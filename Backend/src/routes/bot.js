// Rotas usadas SOMENTE pelo ChatBot do WhatsApp
//
// Todas exigem o cabeçalho "x-bot-key" igual ao BOT_API_KEY do .env —
// assim ninguém de fora consegue se passar pelo bot, disparar alertas ou
// ler a fila de notificações (que tem os números dos inscritos).

import prisma from '../lib/prisma.js'
import { consultarCep, obterOuCriarBairroPorCep } from '../lib/localizacao.js'
import { includeInscrito, formatarInscrito, emailValido } from '../lib/inscritos.js'
import { enviarFotoBase64, removerFotos } from '../lib/armazenamento.js'
import {
  registrarRelato, ErroAlerta, TIPOS_ALERTA, GRAVIDADES, MAX_TENTATIVAS_NOTIFICACAO,
  formatarAlerta, includeListagemAlerta
} from '../lib/alertas.js'


// Se o bot cair no meio de um envio, a notificação fica "enviando".
// Depois desse tempo ela volta para a fila.
const MINUTOS_PARA_REENVIAR = 5

export default async function botRoutes(app) {

  // Protege todas as rotas deste arquivo
  app.addHook('onRequest', app.authenticateBot)


  // ═══════════════════════ INSCRITOS ═══════════════════════

  //----- Inscritos sem o número de telefone real -----
  // Contatos no formato novo do WhatsApp ("123...@lid") chegavam com o código
  // interno salvo no lugar do telefone. O bot chama esta rota ao ligar,
  // descobre o número real de cada um e corrige com a rota abaixo.
  // URL: GET /api/bot/inscritos/sem-telefone
  app.get('/inscritos/sem-telefone', async (request, reply) => {
    const inscritos = await prisma.inscritoAlerta.findMany({
      select: { whatsappId: true, telefone: true }
    })

    const semTelefone = inscritos
      // Em "@c.us" o próprio ID é o telefone (está certo); só "@lid" guarda um código
      .filter(i => !i.telefone || (i.whatsappId.endsWith('@lid') && i.telefone === i.whatsappId.split('@')[0]))
      .map(i => i.whatsappId)

    return reply.status(200).send({ whatsappIds: semTelefone })
  })


  //----- Corrigir o telefone de um inscrito -----
  // URL: PATCH /api/bot/inscritos/:whatsappId/telefone
  // Body: { telefone: "5512999999999" }
  app.patch('/inscritos/:whatsappId/telefone', async (request, reply) => {
    const telefone = String(request.body?.telefone ?? '').replace(/\D/g, '')

    if (telefone.length < 10 || telefone.length > 15) {
      return reply.status(400).send({ mensagem: 'Telefone inválido.' })
    }

    const { count } = await prisma.inscritoAlerta.updateMany({
      where: { whatsappId: request.params.whatsappId },
      data: { telefone }
    })

    if (count === 0) return reply.status(404).send({ mensagem: 'Número não inscrito.' })

    return reply.status(200).send({ mensagem: 'Telefone atualizado.' })
  })


  //----- Buscar inscrito pelo número -----
  // URL: GET /api/bot/inscritos/:whatsappId
  app.get('/inscritos/:whatsappId', async (request, reply) => {
    const inscrito = await prisma.inscritoAlerta.findUnique({
      where: { whatsappId: request.params.whatsappId },
      include: includeInscrito
    })

    if (!inscrito) return reply.status(404).send({ mensagem: 'Número não inscrito.' })

    return reply.status(200).send({ inscrito: formatarInscrito(inscrito) })
  })


  //----- Inscrever (ou reativar) -----
  // URL: POST /api/bot/inscritos
  // Body: { whatsappId, telefone?, nome, email, bairroId }
  app.post('/inscritos', async (request, reply) => {
    const { whatsappId, telefone, nome, email, bairroId } = request.body ?? {}

    if (!whatsappId)                        return reply.status(400).send({ mensagem: 'whatsappId é obrigatório.' })
    if (!nome?.trim() || nome.trim().length < 2) return reply.status(400).send({ mensagem: 'Informe seu nome.' })
    if (!emailValido(email))                return reply.status(400).send({ mensagem: 'E-mail inválido.' })

    const bairro = await prisma.bairro.findUnique({ where: { id_bairro: Number(bairroId) } })
    if (!bairro) return reply.status(404).send({ mensagem: 'Bairro não encontrado.' })

    const dados = {
      nome: nome.trim().slice(0, 100),
      email: email.trim().toLowerCase(),
      telefone: telefone ? String(telefone).slice(0, 20) : null,
      bairroId: bairro.id_bairro,
      ativo: true,
    }

    // Quem cancelou a inscrição e volta é reativado com os dados novos
    const inscrito = await prisma.inscritoAlerta.upsert({
      where: { whatsappId },
      create: { whatsappId, ...dados },
      update: dados,
      include: includeInscrito
    })

    return reply.status(201).send({
      mensagem: 'Inscrição realizada com sucesso!',
      inscrito: formatarInscrito(inscrito)
    })
  })


  //----- Acompanhar outro bairro -----
  // URL: POST /api/bot/inscritos/:whatsappId/bairros
  // Body: { bairroId }
  app.post('/inscritos/:whatsappId/bairros', async (request, reply) => {
    const inscrito = await prisma.inscritoAlerta.findUnique({
      where: { whatsappId: request.params.whatsappId }
    })
    if (!inscrito?.ativo) return reply.status(404).send({ mensagem: 'Número não inscrito.' })

    const bairroId = Number(request.body?.bairroId)
    const bairro = await prisma.bairro.findUnique({ where: { id_bairro: bairroId } })
    if (!bairro) return reply.status(404).send({ mensagem: 'Bairro não encontrado.' })

    if (bairroId === inscrito.bairroId) {
      return reply.status(400).send({ mensagem: 'Este já é o bairro onde você mora — você já recebe os alertas dele.' })
    }

    await prisma.inscritoBairro.upsert({
      where: { inscritoId_bairroId: { inscritoId: inscrito.id_inscrito, bairroId } },
      create: { inscritoId: inscrito.id_inscrito, bairroId },
      update: {}
    })

    const atualizado = await prisma.inscritoAlerta.findUnique({
      where: { id_inscrito: inscrito.id_inscrito },
      include: includeInscrito
    })

    return reply.status(201).send({
      mensagem: `Agora você também recebe os alertas de ${bairro.nome}.`,
      inscrito: formatarInscrito(atualizado)
    })
  })


  //----- Deixar de acompanhar um bairro -----
  // URL: DELETE /api/bot/inscritos/:whatsappId/bairros/:bairroId
  app.delete('/inscritos/:whatsappId/bairros/:bairroId', async (request, reply) => {
    const inscrito = await prisma.inscritoAlerta.findUnique({
      where: { whatsappId: request.params.whatsappId }
    })
    if (!inscrito?.ativo) return reply.status(404).send({ mensagem: 'Número não inscrito.' })

    const { count } = await prisma.inscritoBairro.deleteMany({
      where: { inscritoId: inscrito.id_inscrito, bairroId: Number(request.params.bairroId) }
    })

    if (count === 0) return reply.status(404).send({ mensagem: 'Você não acompanha este bairro.' })

    const atualizado = await prisma.inscritoAlerta.findUnique({
      where: { id_inscrito: inscrito.id_inscrito },
      include: includeInscrito
    })

    return reply.status(200).send({
      mensagem: 'Bairro removido.',
      inscrito: formatarInscrito(atualizado)
    })
  })


  //----- Cancelar inscrição -----
  // Não apaga os dados (os relatos continuam valendo) — só para de enviar
  // URL: PATCH /api/bot/inscritos/:whatsappId/cancelar
  app.patch('/inscritos/:whatsappId/cancelar', async (request, reply) => {
    const { count } = await prisma.inscritoAlerta.updateMany({
      where: { whatsappId: request.params.whatsappId, ativo: true },
      data: { ativo: false }
    })

    if (count === 0) return reply.status(404).send({ mensagem: 'Número não inscrito.' })

    return reply.status(200).send({ mensagem: 'Inscrição cancelada.' })
  })


  // ═══════════════════════ BAIRRO PELO CEP ═══════════════════════

  //----- Encontrar ou cadastrar o bairro a partir do CEP -----
  // Usado quando o morador não acha o bairro na lista do bot.
  // Só é chamado DEPOIS que o morador confirma os dados mostrados pelo
  // GET /api/bairros/cep/:cep.
  // URL: POST /api/bot/bairros/cep
  // Body: { cep }
  app.post('/bairros/cep', async (request, reply) => {
    let dadosCep
    try {
      dadosCep = await consultarCep(request.body?.cep)
    } catch (erro) {
      request.log.error(erro)
      return reply.status(502).send({ mensagem: 'Não foi possível consultar o CEP agora.' })
    }

    if (!dadosCep) return reply.status(404).send({ mensagem: 'CEP não encontrado.' })

    try {
      const { bairro, cidade, criouBairro, criouCidade } = await obterOuCriarBairroPorCep(prisma, dadosCep)

      return reply.status(criouBairro ? 201 : 200).send({
        mensagem: criouBairro ? 'Bairro cadastrado a partir do CEP.' : 'Bairro encontrado.',
        bairro: {
          id_bairro: bairro.id_bairro,
          nome:      bairro.nome,
          cidadeId:  cidade.id_cidade,
          cidade:    cidade.nome,
          estado:    cidade.estado.sigla,
        },
        criouBairro,
        criouCidade,
      })
    } catch (erro) {
      return reply.status(erro.statusCode ?? 500).send({ mensagem: erro.message })
    }
  })


  // ═══════════════════════ ALERTAS ═══════════════════════

  //----- Alertas ativos -----
  // Alertas já confirmados, para a opção "Alertas ativos" do menu do bot.
  // Filtro opcional: ?cidadeId=1
  // URL: GET /api/bot/alertas/ativos
  app.get('/alertas/ativos', async (request, reply) => {
    const { cidadeId } = request.query

    const alertas = await prisma.alerta.findMany({
      where: {
        status: 'ativo',
        bairro: cidadeId ? { cidadeId: Number(cidadeId) } : undefined,
      },
      orderBy: { disparadoEm: 'desc' },
      include: includeListagemAlerta
    })

    return reply.status(200).send({
      total: alertas.length,
      alertas: alertas.map(alerta => ({
        ...formatarAlerta(alerta),
        emoji:          TIPOS_ALERTA[alerta.tipo]?.emoji ?? '⚠️',
        gravidadeEmoji: GRAVIDADES[alerta.gravidade]?.emoji ?? '',
        pesoGravidade:  GRAVIDADES[alerta.gravidade]?.peso ?? 1,
      }))
    })
  })

  //----- Relatar ocorrência -----
  // URL: POST /api/bot/alertas/relatar
  // Body: { whatsappId, tipo, gravidade, bairroId, foto? (base64), fotoMimetype? }
  // A foto é OPCIONAL. Quando vem, é em base64 — por isso o limite do corpo é maior nesta rota
  app.post('/alertas/relatar', { bodyLimit: 15 * 1024 * 1024 }, async (request, reply) => {
    const { whatsappId, tipo, gravidade, bairroId, foto, fotoMimetype } = request.body ?? {}

    const inscrito = await prisma.inscritoAlerta.findUnique({ where: { whatsappId: whatsappId ?? '' } })
    if (!inscrito?.ativo) {
      return reply.status(403).send({ mensagem: 'Você precisa estar inscrito no sistema de alertas para relatar ocorrências.' })
    }

    // Valida antes do upload para não subir foto à toa
    if (!TIPOS_ALERTA[tipo])     return reply.status(400).send({ mensagem: 'Tipo de alerta inválido.' })
    if (!GRAVIDADES[gravidade])  return reply.status(400).send({ mensagem: 'Gravidade inválida.' })
    if (!bairroId)               return reply.status(400).send({ mensagem: 'Informe o bairro da ocorrência.' })

    // Foto opcional. Se o upload falhar, o relato continua valendo, só fica sem foto
    const fotoRelato = foto
      ? await enviarFotoBase64('fotos-alerta', `relato-${inscrito.id_inscrito}`, foto, fotoMimetype || 'image/jpeg')
      : null

    try {
      const resultado = await registrarRelato(prisma, {
        inscritoId: inscrito.id_inscrito, tipo, gravidade, bairroId, fotoRelato
      })

      return reply.status(201).send({ mensagem: 'Relato registrado.', ...resultado })

    } catch (erro) {
      await removerFotos('fotos-alerta', [fotoRelato])

      if (erro instanceof ErroAlerta) {
        return reply.status(erro.statusCode).send({ mensagem: erro.message })
      }
      throw erro
    }
  })


  // ═══════════════════════ FILA DE NOTIFICAÇÕES ═══════════════════════

  //----- Reservar notificações para envio -----
  // O bot chama periodicamente. As notificações devolvidas ficam "enviando"
  // para não serem pegas de novo enquanto o bot envia.
  // URL: POST /api/bot/notificacoes/reservar
  // Body: { limite? }  (padrão 10, máximo 50)
  app.post('/notificacoes/reservar', async (request, reply) => {
    const limite = Math.min(Number(request.body?.limite) || 10, 50)
    const travadasAntesDe = new Date(Date.now() - MINUTOS_PARA_REENVIAR * 60 * 1000)

    const notificacoes = await prisma.$transaction(async (tx) => {
      const candidatas = await tx.notificacao.findMany({
        where: {
          OR: [
            { status: 'pendente' },
            { status: 'enviando', updatedAt: { lt: travadasAntesDe } },
          ]
        },
        orderBy: { createdAt: 'asc' },
        take: limite,
        select: { id_notificacao: true }
      })

      const ids = candidatas.map(c => c.id_notificacao)
      if (ids.length === 0) return []

      await tx.notificacao.updateMany({
        where: { id_notificacao: { in: ids } },
        data: { status: 'enviando', tentativas: { increment: 1 } }
      })

      return tx.notificacao.findMany({
        where: { id_notificacao: { in: ids } },
        orderBy: { createdAt: 'asc' },
        select: {
          id_notificacao: true, evento: true, tipoDestino: true,
          destino: true, mensagem: true, fotoUrl: true, tentativas: true,
        }
      })
    })

    return reply.status(200).send({ notificacoes })
  })


  //----- Informar resultado do envio -----
  // URL: PATCH /api/bot/notificacoes/:id
  // Body: { sucesso: true } | { sucesso: false, erro: "mensagem" }
  app.patch('/notificacoes/:id', async (request, reply) => {
    const id = Number(request.params.id)
    const { sucesso, erro } = request.body ?? {}

    const notificacao = await prisma.notificacao.findUnique({ where: { id_notificacao: id } })
    if (!notificacao) return reply.status(404).send({ mensagem: 'Notificação não encontrada.' })

    // Só atualiza se ainda estiver "enviando" (pode ter sido cancelada no meio)
    const data = sucesso
      ? { status: 'enviada', enviadaEm: new Date(), erro: null }
      : {
          // Tenta de novo até o limite, depois marca como falha definitiva
          status: notificacao.tentativas >= MAX_TENTATIVAS_NOTIFICACAO ? 'falha' : 'pendente',
          erro: String(erro ?? 'Erro desconhecido').slice(0, 500),
        }

    await prisma.notificacao.updateMany({
      where: { id_notificacao: id, status: 'enviando' },
      data
    })

    return reply.status(200).send({ mensagem: 'Resultado registrado.' })
  })


  // ═══════════════════════ GRUPOS DAS CIDADES ═══════════════════════

  //----- Links de convite dos grupos de alertas -----
  // Cidades que têm link cadastrado no painel (Regiões), para o bot enviar
  // a quem quiser entrar no grupo da cidade
  // URL: GET /api/bot/cidades/grupos
  app.get('/cidades/grupos', async (request, reply) => {
    const cidades = await prisma.cidade.findMany({
      where: { grupoWhatsappLink: { not: null } },
      orderBy: { nome: 'asc' },
      select: { id_cidade: true, nome: true, grupoWhatsappLink: true, estado: { select: { sigla: true } } }
    })

    return reply.status(200).send({
      cidades: cidades.map(c => ({ id_cidade: c.id_cidade, nome: c.nome, estado: c.estado.sigla, link: c.grupoWhatsappLink }))
    })
  })

  //----- Vincular / desvincular o grupo de alertas de uma cidade -----
  // Chamado pelo comando "!alertas vincular <cidade>" enviado em um grupo
  // URL: PUT /api/bot/cidades/:id/grupo
  // Body: { grupoWhatsappId }  (null para desvincular)
  app.put('/cidades/:id/grupo', async (request, reply) => {
    const id = Number(request.params.id)
    const { grupoWhatsappId } = request.body ?? {}

    if (grupoWhatsappId && !/@g\.us$/.test(grupoWhatsappId)) {
      return reply.status(400).send({ mensagem: 'ID de grupo inválido.' })
    }

    const cidade = await prisma.cidade.findUnique({ where: { id_cidade: id } })
    if (!cidade) return reply.status(404).send({ mensagem: 'Cidade não encontrada.' })

    await prisma.cidade.update({
      where: { id_cidade: id },
      data: { grupoWhatsappId: grupoWhatsappId || null }
    })

    return reply.status(200).send({
      mensagem: grupoWhatsappId
        ? `Grupo vinculado à cidade ${cidade.nome}.`
        : `Grupo desvinculado da cidade ${cidade.nome}.`
    })
  })


  //----- Desvincular um grupo de todas as cidades -----
  // URL: DELETE /api/bot/grupos/:grupoWhatsappId
  app.delete('/grupos/:grupoWhatsappId', async (request, reply) => {
    const { count } = await prisma.cidade.updateMany({
      where: { grupoWhatsappId: request.params.grupoWhatsappId },
      data: { grupoWhatsappId: null }
    })

    return reply.status(200).send({ mensagem: `Grupo desvinculado de ${count} cidade(s).`, total: count })
  })
}
