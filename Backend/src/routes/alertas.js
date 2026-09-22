import {
  ErroAlerta, validarId, validarCriacao, validarEdicao, validarTransicao,
  conferirVersao, conferirTransicao, criarSnapshot,
} from './alertas.regras.js'

const REGIAO_SELECT = {
  id_regiao: true, bairro: true, cidade: true, estado: true, populacaoEstimada: true,
}
const ALERTA_INCLUDE = {
  regiao: { select: REGIAO_SELECT },
  criadoPor: { select: { id: true, nome: true } },
  historico: {
    select: {
      id: true, acao: true, observacao: true, createdAt: true,
      ator: { select: { id: true, nome: true } },
    },
    orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
  },
}

// Registrar com app.register(alertasRoutes, { prefix: '/api/alertas' }).
// options.prisma é uma facilidade para testes: produção cria seu próprio cliente.
export default async function alertasRoutes(app, options = {}) {
  // Carregar o cliente somente em produção mantém os testes independentes dele.
  const prisma = options.prisma ?? new (await import('@prisma/client')).PrismaClient()
  if (!options.prisma) app.addHook('onClose', async () => prisma.$disconnect())
  app.decorateRequest('adminAlertas', null)

  // Inclui erros de parsing/tamanho do Fastify no mesmo contrato de mensagens.
  app.setErrorHandler((erro, request, reply) => {
    const status = erro.statusCode >= 400 && erro.statusCode < 500 ? erro.statusCode : 500
    const mensagem = status === 413 ? 'O conteúdo enviado é muito grande.'
      : status === 415 ? 'Envie os dados com Content-Type application/json.'
        : status < 500 ? 'Não foi possível interpretar a requisição. Confira o JSON enviado.'
          : 'Não foi possível concluir a operação. Tente novamente.'
    if (status === 500) request.log.error({ codigo: erro.code ?? 'INTERNAL' }, 'Falha na API de alertas')
    return reply.code(status).send({ mensagem })
  })

  app.addHook('onRequest', async (request, reply) => {
    try {
      await request.jwtVerify()
    } catch {
      return reply.code(401).send({ mensagem: 'Sessão inválida ou expirada. Entre novamente.' })
    }

    // O JWT atual do voluntário também usa "id" e a mesma assinatura.
    // Cargo + identidade do Admin no banco evitam aceitar um ID coincidente.
    const { id, email, cargo } = request.user ?? {}
    if (!Number.isInteger(id) || id <= 0 || typeof email !== 'string' || typeof cargo !== 'string') {
      return reply.code(403).send({ mensagem: 'Acesso permitido somente a administradores.' })
    }
    try {
      const admin = await prisma.admin.findFirst({
        where: { id, email, cargo },
        select: { id: true, nome: true },
      })
      if (!admin) return reply.code(403).send({ mensagem: 'Administrador não autorizado.' })
      request.adminAlertas = admin
    } catch (erro) {
      request.log.error({ codigo: erro.code ?? 'INTERNAL' }, 'Falha ao validar o acesso a alertas')
      return reply.code(500).send({ mensagem: 'Não foi possível validar seu acesso. Tente novamente.' })
    }
  })

  function tratarErros(handler) {
    return async (request, reply) => {
      try {
        return await handler(request, reply)
      } catch (erro) {
        if (erro instanceof ErroAlerta) {
          return reply.code(erro.statusCode).send({ mensagem: erro.message })
        }
        if (erro.code === 'P2025' || erro.code === 'P2034') {
          return reply.code(409).send({ mensagem: 'Os dados mudaram durante a operação. Atualize a lista e tente novamente.' })
        }
        if (erro.code === 'P2003') {
          return reply.code(409).send({ mensagem: 'A região ou o administrador não está mais disponível. Atualize a página.' })
        }
        request.log.error({ codigo: erro.code ?? 'INTERNAL' }, 'Falha na operação de alertas')
        return reply.code(500).send({ mensagem: 'Não foi possível concluir a operação. Tente novamente.' })
      }
    }
  }

  async function encontrarAlerta(tx, id) {
    const alerta = await tx.alerta.findUnique({ where: { id_alerta: id }, include: ALERTA_INCLUDE })
    if (!alerta) throw new ErroAlerta('Alerta não encontrado.', 404)
    return alerta
  }

  async function conferirRegiao(tx, regiaoId) {
    const regiao = await tx.regiao.findUnique({ where: { id_regiao: regiaoId }, select: { id_regiao: true } })
    if (!regiao) throw new ErroAlerta('Selecione uma região cadastrada no sistema.')
  }

  async function registrarHistorico(tx, alerta, atorId, acao, observacao = null) {
    await tx.historicoAlerta.create({
      data: {
        alertaId: alerta.id_alerta, atorId, acao, observacao,
        versao: alerta.versao, snapshot: criarSnapshot(alerta),
      },
    })
    return encontrarAlerta(tx, alerta.id_alerta)
  }

  app.get('/regioes', tratarErros(async () => {
    const regioes = await prisma.regiao.findMany({
      select: REGIAO_SELECT,
      orderBy: [{ cidade: 'asc' }, { bairro: 'asc' }, { id_regiao: 'asc' }],
    })
    return { regioes }
  }))

  app.get('/', tratarErros(async () => {
    const alertas = await prisma.alerta.findMany({
      include: ALERTA_INCLUDE,
      orderBy: [{ updatedAt: 'desc' }, { id_alerta: 'desc' }],
    })
    return { alertas }
  }))

  app.post('/', tratarErros(async (request, reply) => {
    const conteudo = validarCriacao(request.body)
    const alerta = await prisma.$transaction(async (tx) => {
      await conferirRegiao(tx, conteudo.regiaoId)
      const criado = await tx.alerta.create({
        data: { ...conteudo, criadoPorId: request.adminAlertas.id },
        include: ALERTA_INCLUDE,
      })
      return registrarHistorico(tx, criado, request.adminAlertas.id, 'criar')
    })
    return reply.code(201).send({ alerta })
  }))

  app.put('/:id', tratarErros(async (request) => {
    const id = validarId(request.params.id)
    const { versao, ...conteudo } = validarEdicao(request.body)
    const alerta = await prisma.$transaction(async (tx) => {
      const atual = await encontrarAlerta(tx, id)
      conferirVersao(atual, versao)
      if (atual.status !== 'rascunho') throw new ErroAlerta('Somente rascunhos podem ser editados.', 409)
      await conferirRegiao(tx, conteudo.regiaoId)
      const resultado = await tx.alerta.updateMany({
        where: { id_alerta: id, versao, status: 'rascunho' },
        data: { ...conteudo, versao: { increment: 1 } },
      })
      if (resultado.count !== 1) throw new ErroAlerta('Este alerta mudou. Atualize a lista antes de salvar.', 409)
      const atualizado = await encontrarAlerta(tx, id)
      return registrarHistorico(tx, atualizado, request.adminAlertas.id, 'editar')
    })
    return { alerta }
  }))

  app.post('/:id/transicoes', tratarErros(async (request) => {
    const id = validarId(request.params.id)
    const { acao, versao, observacao } = validarTransicao(request.body)
    const alerta = await prisma.$transaction(async (tx) => {
      const atual = await encontrarAlerta(tx, id)
      conferirVersao(atual, versao)
      const agora = new Date()
      const status = conferirTransicao(atual, acao, agora)
      const resultado = await tx.alerta.updateMany({
        where: { id_alerta: id, versao, status: atual.status },
        data: {
          status, versao: { increment: 1 },
          ...(acao === 'publicar' ? { publicadoEm: agora } : {}),
        },
      })
      if (resultado.count !== 1) throw new ErroAlerta('Este alerta mudou. Atualize a lista antes de continuar.', 409)
      const atualizado = await encontrarAlerta(tx, id)
      return registrarHistorico(tx, atualizado, request.adminAlertas.id, acao, observacao)
    })
    return { alerta }
  }))
}
