import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export default async function doacaoRoutes(app) {

  //----- Cadastrar -----
  // Rota POST para registrar uma nova doação
  // Toda doação precisa de um abrigoId (destino) e voluntarioId (quem doou)
  // URL: http://localhost:3000/api/doacoes/cadastrar
  app.post('/cadastrar', async (request, reply) => {
    try {

      const { doadorNome, doadorTelefone, tipo, quantidade, descricao, abrigoId, voluntarioId } = request.body

      // Verifica se o abrigo de destino existe antes de criar a doação
      const abrigoExistente = await prisma.abrigo.findUnique({
        where: { id_abrigo: Number(abrigoId) }
      })

      if (!abrigoExistente) {
        return reply.status(404).send({ mensagem: 'Abrigo não encontrado.' })
      }

      // Verifica se o voluntário que está doando existe
      const voluntarioExistente = await prisma.voluntario.findUnique({
        where: { id_voluntario: Number(voluntarioId) }
      })

      if (!voluntarioExistente) {
        return reply.status(404).send({ mensagem: 'Voluntário não encontrado.' })
      }

      // Cria a doação — status começa como 'pendente' até o abrigo confirmar o recebimento
      const doacao = await prisma.doacao.create({
        data: {
          tipo,
          quantidade:   Number(quantidade),
          descricao:    descricao ?? null,
          status:       'pendente',
          abrigoId:     Number(abrigoId),
          voluntarioId: Number(voluntarioId),
        }
      })

      return reply.status(201).send({
        mensagem:     'Doação registrada com sucesso!',
        id:           doacao.id_doacao,
        tipo:         doacao.tipo,
        quantidade:   doacao.quantidade,
        descricao:    doacao.descricao,
        status:       doacao.status,
        abrigoId:     doacao.abrigoId,
        voluntarioId: doacao.voluntarioId,
        createdAt:    doacao.createdAt,
      })

    } catch (erro) {
      console.error('ERRO DETALHADO:', erro)
      return reply.status(500).send({ mensagem: erro.message })
    }
  })


  //----- Listar -----
  // Rota GET para listar todas as doações, com filtros opcionais via query params
  // URL: http://localhost:3000/api/doacoes/listar
  // URL: http://localhost:3000/api/doacoes/listar?abrigoId=1
  // URL: http://localhost:3000/api/doacoes/listar?status=pendente
  // URL: http://localhost:3000/api/doacoes/listar?tipo=ALIMENTO
  app.get('/listar', async (request, reply) => {

    const { abrigoId, status, tipo, voluntarioId } = request.query

    const doacoes = await prisma.doacao.findMany({
      where: {
        // undefined remove o filtro se o query param não for informado
        abrigoId:     abrigoId     ? { equals: Number(abrigoId) }               : undefined,
        voluntarioId: voluntarioId ? { equals: Number(voluntarioId) }            : undefined,
        status:       status       ? { equals: status }                          : undefined,
        tipo:         tipo         ? { contains: tipo, mode: 'insensitive' }     : undefined,
      },
      orderBy: { createdAt: 'desc' },
      // Inclui dados do abrigo e do voluntário para evitar requisições extras no frontend
      include: {
        abrigo:     { select: { nome: true, cidade: true } },
        voluntario: { select: { nome: true, email: true } },
      }
    })

    const doacoesListadas = doacoes.map((doacao) => ({
      id:           doacao.id_doacao,
      tipo:         doacao.tipo,
      quantidade:   doacao.quantidade,
      descricao:    doacao.descricao,
      status:       doacao.status,
      abrigoId:     doacao.abrigoId,
      abrigo:       doacao.abrigo,
      voluntarioId: doacao.voluntarioId,
      voluntario:   doacao.voluntario,
      createdAt:    doacao.createdAt,
    }))

    return reply.status(200).send({
      mensagem: 'Lista:',
      total:    doacoesListadas.length,
      doacoes:  doacoesListadas,
    })
  })


  //----- Listar uma só ----- (Importante para Detalhes-doacao)
  // Método GET para buscar uma doação específica pelo ID
  // Retorna TODOS os campos — usado pela tela de Detalhes
  // URL: http://localhost:3000/api/doacoes/listar/:id
  app.get('/listar/:id', async (request, reply) => {

    const { id } = request.params

    const doacao = await prisma.doacao.findUnique({
      where: { id_doacao: Number(id) },
      include: {
        abrigo:     { select: { nome: true, cidade: true, estado: true, telefone: true } },
        voluntario: { select: { nome: true, email: true, telefone: true } },
      }
    })

    if (!doacao) {
      return reply.status(404).send({ mensagem: 'Doação não encontrada.' })
    }

    return reply.status(200).send(doacao)
  })


  //----- Atualizar -----
  // Rota PUT para atualizar uma doação — principalmente para mudar o status
  // Status possíveis: 'pendente' → 'recebida' → 'distribuida'
  // URL: http://localhost:3000/api/doacoes/atualizar/:id
  app.put('/atualizar/:id', async (request, reply) => {
    try {

      const { id } = request.params
      const { tipo, quantidade, descricao, status, abrigoId, voluntarioId } = request.body

      const doacaoExistente = await prisma.doacao.findUnique({
        where: { id_doacao: Number(id) }
      })

      if (!doacaoExistente) {
        return reply.status(404).send({ mensagem: 'Doação não encontrada.' })
      }

      // Valida o status se vier no body — evita valores inválidos no banco
      const statusValidos = ['pendente', 'recebida', 'distribuida']
      if (status && !statusValidos.includes(status)) {
        return reply.status(400).send({ mensagem: `Status inválido. Use: ${statusValidos.join(', ')}` })
      }

      const doacaoAtualizada = await prisma.doacao.update({
        where: { id_doacao: Number(id) },
        data: {
          // Se não vier no body, mantém o valor atual do banco
          tipo:         tipo         ?? doacaoExistente.tipo,
          quantidade:   quantidade   ? Number(quantidade) : doacaoExistente.quantidade,
          descricao:    descricao    ?? doacaoExistente.descricao,
          status:       status       ?? doacaoExistente.status,
          abrigoId:     abrigoId     ? Number(abrigoId)     : doacaoExistente.abrigoId,
          voluntarioId: voluntarioId ? Number(voluntarioId) : doacaoExistente.voluntarioId,
        }
      })

      return reply.status(200).send({
        mensagem:     'Doação atualizada com sucesso!',
        id:           doacaoAtualizada.id_doacao,
        tipo:         doacaoAtualizada.tipo,
        quantidade:   doacaoAtualizada.quantidade,
        descricao:    doacaoAtualizada.descricao,
        status:       doacaoAtualizada.status,
        abrigoId:     doacaoAtualizada.abrigoId,
        voluntarioId: doacaoAtualizada.voluntarioId,
      })

    } catch (erro) {
      console.error('ERRO DETALHADO:', erro)
      return reply.status(500).send({ mensagem: erro.message })
    }
  })


  //----- Excluir -----
  // Rota DELETE para excluir uma doação
  // URL: http://localhost:3000/api/doacoes/excluir/:id
  app.delete('/excluir/:id', async (request, reply) => {

    const { id } = request.params

    const doacaoExistente = await prisma.doacao.findUnique({
      where: { id_doacao: Number(id) }
    })

    if (!doacaoExistente) {
      return reply.status(404).send({ mensagem: 'Doação não encontrada.' })
    }

    await prisma.doacao.delete({
      where: { id_doacao: Number(id) }
    })

    return reply.status(200).send({ mensagem: 'Doação excluída com sucesso!' })
  })


  //----- Dashboard -----
  // Rota GET para alimentar a home do painel admin com dados agregados
  // Retorna tudo de uma vez para evitar múltiplas requisições do frontend
  // URL: http://localhost:3000/api/doacoes/dashboard
  app.get('/dashboard', async (request, reply) => {
    try {

      // Janela de 30 dias para o gráfico de itens mais doados
      const trintaDiasAtras = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)

      // Conta regiões em alerta para o card de Alertas
      const totalAlertas = await prisma.regiao.count({
        where: { statusAlerta: true }
      })

      // Agrupa doações por tipo nos últimos 30 dias — usado no gráfico
      const itensMaisDoados = await prisma.doacao.groupBy({
        by: ['tipo'],
        _count: { tipo: true },
        where: { createdAt: { gte: trintaDiasAtras } },
        orderBy: { _count: { tipo: 'desc' } }
      })

      // Últimas 10 doações para o feed de atividades recentes
      const ultimasDoacoes = await prisma.doacao.findMany({
        take:     10,
        orderBy:  { createdAt: 'desc' },
        include: {
          abrigo:     { select: { nome: true } },
          voluntario: { select: { nome: true } },
        }
      })

      // Últimas 10 solicitações de abrigo para completar o feed de atividades
      const ultimasSolicitacoes = await prisma.solicitacaoAbrigo.findMany({
        take:    10,
        orderBy: { createdAt: 'desc' },
        select:  { id_solicitacao: true, nome: true, cidade: true, status: true, createdAt: true }
      })

      return reply.status(200).send({
        alertas:          totalAlertas,
        itensMaisDoados:  itensMaisDoados.map((item) => ({
          tipo:  item.tipo,
          total: item._count.tipo,
        })),
        atividades: {
          doacoes:       ultimasDoacoes,
          solicitacoes:  ultimasSolicitacoes,
        }
      })

    } catch (erro) {
      console.error('ERRO DETALHADO:', erro)
      return reply.status(500).send({ mensagem: erro.message })
    }
  })
}