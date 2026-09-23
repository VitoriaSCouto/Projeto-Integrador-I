// Rotas do painel admin para acompanhar e gerenciar os alertas
// Todas exigem login de administrador (token JWT no cabeçalho Authorization)

import { PrismaClient } from '@prisma/client'
import { removerFotos } from '../lib/armazenamento.js'
import {
  formatarAlerta, includeListagemAlerta, dispararAlerta, cancelarAlerta,
  encerrarAlerta, ErroAlerta, STATUS_ALERTA, TIPOS_ALERTA, GRAVIDADES, CONFIRMACOES_MINIMAS
} from '../lib/alertas.js'

const prisma = new PrismaClient()

// Transforma ErroAlerta em resposta HTTP; outros erros seguem para o Fastify
function responderErro(reply, erro) {
  if (erro instanceof ErroAlerta) {
    return reply.status(erro.statusCode).send({ mensagem: erro.message })
  }
  throw erro
}

export default async function alertaRoutes(app) {

  app.addHook('onRequest', app.authenticateAdmin)


  //----- Opções -----
  // Tipos, gravidades e configuração — para montar filtros e rótulos no front
  // URL: GET http://localhost:3000/api/alertas/opcoes
  app.get('/opcoes', async (request, reply) => {
    return reply.status(200).send({
      tipos: Object.entries(TIPOS_ALERTA).map(([valor, t]) => ({ valor, label: t.label, emoji: t.emoji })),
      gravidades: Object.entries(GRAVIDADES).map(([valor, g]) => ({ valor, label: g.label, descricao: g.descricao })),
      status: STATUS_ALERTA,
      confirmacoesNecessarias: CONFIRMACOES_MINIMAS,
    })
  })


  //----- Listar -----
  // URL: GET http://localhost:3000/api/alertas/listar
  // Filtros: ?status=ativo | ?tipo=alagamento | ?cidadeId=1 | ?bairroId=2
  app.get('/listar', async (request, reply) => {
    const { status, tipo, cidadeId, bairroId } = request.query

    if (status && !STATUS_ALERTA.includes(status)) {
      return reply.status(400).send({ mensagem: 'Status inválido.' })
    }
    if (tipo && !TIPOS_ALERTA[tipo]) {
      return reply.status(400).send({ mensagem: 'Tipo inválido.' })
    }

    const alertas = await prisma.alerta.findMany({
      where: {
        status:   status   || undefined,
        tipo:     tipo     || undefined,
        bairroId: bairroId ? Number(bairroId) : undefined,
        bairro:   cidadeId ? { cidadeId: Number(cidadeId) } : undefined,
      },
      orderBy: { createdAt: 'desc' },
      include: includeListagemAlerta
    })

    return reply.status(200).send({
      mensagem: 'Lista de alertas:',
      total: alertas.length,
      alertas: alertas.map(formatarAlerta)
    })
  })


  //----- Detalhes -----
  // Alerta + relatos (quem relatou, gravidade, foto) + situação das notificações
  // URL: GET http://localhost:3000/api/alertas/listar/:id
  app.get('/listar/:id', async (request, reply) => {
    const id = Number(request.params.id)

    const alerta = await prisma.alerta.findUnique({
      where: { id_alerta: id },
      include: {
        ...includeListagemAlerta,
        analisadoPor: { select: { id: true, nome: true, email: true } },
        relatos: {
          orderBy: { createdAt: 'asc' },
          include: {
            inscrito: { select: { id_inscrito: true, nome: true, telefone: true, whatsappId: true } }
          }
        },
      }
    })

    if (!alerta) return reply.status(404).send({ mensagem: 'Alerta não encontrado.' })

    // Resumo das notificações: quantas por status, separando inscritos e grupo
    const agrupadas = await prisma.notificacao.groupBy({
      by: ['evento', 'tipoDestino', 'status'],
      where: { alertaId: id },
      _count: { _all: true }
    })

    const falhas = await prisma.notificacao.findMany({
      where: { alertaId: id, status: 'falha' },
      select: { id_notificacao: true, destino: true, tipoDestino: true, erro: true, tentativas: true },
      take: 20
    })

    return reply.status(200).send({
      ...formatarAlerta(alerta),
      relatos: alerta.relatos.map(r => ({
        ...r,
        gravidadeLabel: GRAVIDADES[r.gravidade]?.label ?? r.gravidade,
      })),
      notificacoes: {
        resumo: agrupadas.map(g => ({
          evento: g.evento, tipoDestino: g.tipoDestino, status: g.status, total: g._count._all
        })),
        falhas,
      }
    })
  })


  //----- Confirmar e disparar agora -----
  // Para quando a equipe já confirmou a ocorrência e não quer esperar os
  // outros relatos
  // URL: PATCH http://localhost:3000/api/alertas/confirmar/:id
  app.patch('/confirmar/:id', async (request, reply) => {
    const id = Number(request.params.id)

    const alerta = await prisma.alerta.findUnique({ where: { id_alerta: id } })
    if (!alerta) return reply.status(404).send({ mensagem: 'Alerta não encontrado.' })
    if (alerta.status !== 'em_verificacao') {
      return reply.status(400).send({ mensagem: 'Só é possível confirmar alertas em verificação.' })
    }

    const disparou = await prisma.$transaction(
      (tx) => dispararAlerta(tx, id, { adminId: request.user.id }),
      { timeout: 15000 }
    )

    if (!disparou) {
      return reply.status(409).send({ mensagem: 'O alerta mudou de situação enquanto você confirmava. Atualize a página.' })
    }

    const total = await prisma.notificacao.count({ where: { alertaId: id, evento: 'disparo' } })

    return reply.status(200).send({
      mensagem: `Alerta confirmado! ${total} notificação(ões) na fila de envio.`,
      totalNotificacoes: total
    })
  })


  //----- Cancelar -----
  // Se o alerta já foi disparado, quem recebeu recebe uma correção
  // URL: PATCH http://localhost:3000/api/alertas/cancelar/:id
  // Body: { motivo }
  app.patch('/cancelar/:id', async (request, reply) => {
    const motivo = request.body?.motivo?.trim()
    if (!motivo) return reply.status(400).send({ mensagem: 'Informe o motivo do cancelamento.' })

    try {
      const { correcoes } = await cancelarAlerta(prisma, Number(request.params.id), {
        adminId: request.user.id, motivo: motivo.slice(0, 300)
      })

      return reply.status(200).send({
        mensagem: correcoes > 0
          ? `Alerta cancelado. ${correcoes} aviso(s) de correção na fila de envio.`
          : 'Alerta cancelado.',
        correcoes
      })
    } catch (erro) {
      return responderErro(reply, erro)
    }
  })


  //----- Encerrar (ocorrência resolvida) -----
  // URL: PATCH http://localhost:3000/api/alertas/encerrar/:id
  app.patch('/encerrar/:id', async (request, reply) => {
    try {
      await encerrarAlerta(prisma, Number(request.params.id), { adminId: request.user.id })
      return reply.status(200).send({ mensagem: 'Ocorrência encerrada.' })
    } catch (erro) {
      return responderErro(reply, erro)
    }
  })


  //----- Reenviar notificações que falharam -----
  // URL: PATCH http://localhost:3000/api/alertas/reenviar-falhas/:id
  app.patch('/reenviar-falhas/:id', async (request, reply) => {
    const id = Number(request.params.id)

    const alerta = await prisma.alerta.findUnique({ where: { id_alerta: id } })
    if (!alerta) return reply.status(404).send({ mensagem: 'Alerta não encontrado.' })
    if (alerta.status !== 'ativo') {
      return reply.status(400).send({ mensagem: 'Só é possível reenviar notificações de alertas ativos.' })
    }

    const { count } = await prisma.notificacao.updateMany({
      where: { alertaId: id, status: 'falha' },
      data: { status: 'pendente', tentativas: 0, erro: null }
    })

    return reply.status(200).send({ mensagem: `${count} notificação(ões) voltaram para a fila.`, total: count })
  })


  //----- Excluir -----
  // Apaga o alerta, os relatos, as notificações e as fotos
  // URL: DELETE http://localhost:3000/api/alertas/excluir/:id
  app.delete('/excluir/:id', async (request, reply) => {
    const id = Number(request.params.id)

    const alerta = await prisma.alerta.findUnique({
      where: { id_alerta: id },
      include: { relatos: { select: { fotoRelato: true } } }
    })

    if (!alerta) return reply.status(404).send({ mensagem: 'Alerta não encontrado.' })

    // relatos e notificações são apagados junto (onDelete: Cascade)
    await prisma.alerta.delete({ where: { id_alerta: id } })
    await removerFotos('fotos-alerta', alerta.relatos.map(r => r.fotoRelato))

    return reply.status(200).send({ mensagem: 'Alerta excluído com sucesso!' })
  })
}
