// Regras do sistema de alertas
//
// Um morador inscrito relata uma ocorrência respondendo perguntas fechadas
// (tipo + gravidade) e enviando uma foto. Relatos do mesmo tipo, no mesmo
// bairro, dentro da janela de tempo, são agrupados em um único Alerta.
//
// O alerta só é disparado (inscritos do bairro + grupo da cidade) quando
// atinge o número mínimo de relatos de pessoas diferentes — isso filtra
// alarmes falsos. Um admin pode disparar antes, cancelar ou encerrar.

import { achatarLocalizacao, selectLocalizacao } from './localizacao.js'

// ─── CONFIGURAÇÃO ────────────────────────────────────────────────────────────
// Podem ser ajustadas no .env do Backend

// Quantas pessoas diferentes precisam relatar a mesma ocorrência para o
// alerta ser disparado automaticamente
export const CONFIRMACOES_MINIMAS = Number(process.env.ALERTA_CONFIRMACOES_MINIMAS) || 3

// Relatos só se juntam a um alerta em verificação criado nas últimas X horas.
// Depois disso, um relato novo abre outro alerta.
export const JANELA_HORAS = Number(process.env.ALERTA_JANELA_HORAS) || 6

// Depois de quantas tentativas uma notificação é marcada como falha definitiva
export const MAX_TENTATIVAS_NOTIFICACAO = 3


// ─── OPÇÕES FECHADAS (as mesmas perguntas do bot) ────────────────────────────

export const TIPOS_ALERTA = {
  alagamento: {
    label: 'Alagamento', emoji: '🌊',
    orientacao: 'Não atravesse ruas alagadas a pé ou de carro. Se a água entrar na sua casa, desligue a energia e procure um local mais alto.'
  },
  deslizamento: {
    label: 'Deslizamento de terra', emoji: '⛰️',
    orientacao: 'Se notar rachaduras nas paredes, árvores ou postes inclinados ou barulho vindo do morro, saia de casa imediatamente e ligue para a Defesa Civil (199).'
  },
  arvore_caida: {
    label: 'Árvore caída', emoji: '🌳',
    orientacao: 'Mantenha distância e não toque em fios próximos à árvore. Evite passar pelo local.'
  },
  falta_energia: {
    label: 'Falta de energia / fios caídos', emoji: '⚡',
    orientacao: 'Nunca se aproxime de fios caídos. Desligue os aparelhos da tomada e avise a distribuidora de energia.'
  },
  incendio: {
    label: 'Incêndio', emoji: '🔥',
    orientacao: 'Afaste-se do fogo e da fumaça e ligue imediatamente para os Bombeiros (193).'
  },
  via_interditada: {
    label: 'Via interditada', emoji: '🚧',
    orientacao: 'Evite a região e procure rotas alternativas.'
  },
  vendaval: {
    label: 'Vendaval / chuva forte', emoji: '🌪️',
    orientacao: 'Fique em local fechado, longe de janelas, e evite áreas com árvores, placas e fios.'
  },
}

// Ordem de gravidade: usada para desempate (a mais grave vence)
export const GRAVIDADES = {
  grave: { label: 'Grave', emoji: '🔴', peso: 3, descricao: 'Risco à vida, pessoas feridas ou ilhadas' },
  medio: { label: 'Médio', emoji: '🟠', peso: 2, descricao: 'Danos ou risco, sem pessoas em perigo imediato' },
  leve:  { label: 'Leve',  emoji: '🟡', peso: 1, descricao: 'Transtorno, sem risco imediato' },
}

export const STATUS_ALERTA = ['em_verificacao', 'ativo', 'encerrado', 'cancelado']


// ─── MENSAGENS ENVIADAS PELO WHATSAPP ────────────────────────────────────────

function formatarDataHora(data) {
  return new Date(data).toLocaleString('pt-BR', {
    timeZone: 'America/Sao_Paulo',
    day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit'
  })
}

function descreverLocal(alerta) {
  const { bairro } = alerta
  return `${bairro.nome} — ${bairro.cidade.nome}/${bairro.cidade.estado.sigla}`
}

export function montarMensagemAlerta(alerta, totalRelatos, { paraGrupo }) {
  const tipo = TIPOS_ALERTA[alerta.tipo]
  const gravidade = GRAVIDADES[alerta.gravidade]

  const confirmacao = alerta.disparadoPorAdmin
    ? 'Confirmado pela equipe S.O.S Vale'
    : `Relatado por ${totalRelatos} moradores`

  const linhas = [
    `🚨 *ALERTA S.O.S VALE* 🚨`,
    ``,
    `${tipo.emoji} *${tipo.label}*`,
    `${gravidade.emoji} Gravidade: *${gravidade.label.toUpperCase()}*`,
    `📍 ${descreverLocal(alerta)}`,
    `🕒 ${formatarDataHora(alerta.disparadoEm ?? new Date())}`,
    `✅ ${confirmacao}`,
    ``,
    `*O que fazer:* ${tipo.orientacao}`,
    ``,
    `Emergência: 193 Bombeiros • 192 SAMU • 199 Defesa Civil`,
  ]

  if (!paraGrupo) {
    linhas.push(
      ``,
      `_Você recebeu este aviso porque mora ou acompanha este bairro. Envie *oi* e escolha a opção 1 para gerenciar seus alertas._`
    )
  }

  return linhas.join('\n')
}

export function montarMensagemCancelamento(alerta) {
  const tipo = TIPOS_ALERTA[alerta.tipo]

  const linhas = [
    `⚠️ *ALERTA CANCELADO* ⚠️`,
    ``,
    `O alerta de *${tipo.label}* em ${descreverLocal(alerta)}, enviado às ${formatarDataHora(alerta.disparadoEm)}, foi cancelado pela equipe S.O.S Vale.`,
  ]

  if (alerta.motivoCancelamento) {
    linhas.push(``, `Motivo: ${alerta.motivoCancelamento}`)
  }

  return linhas.join('\n')
}


// ─── CONSULTAS AUXILIARES ────────────────────────────────────────────────────

const includeBairroCompleto = {
  bairro: {
    include: { cidade: { include: { estado: true } } }
  }
}

// A gravidade do alerta é a mais relatada; em caso de empate, a mais grave
function calcularGravidade(relatos) {
  const contagem = {}
  for (const r of relatos) contagem[r.gravidade] = (contagem[r.gravidade] ?? 0) + 1

  return Object.keys(contagem).sort((a, b) =>
    contagem[b] - contagem[a] || GRAVIDADES[b].peso - GRAVIDADES[a].peso
  )[0]
}

// Formata o alerta para as respostas da API (lista e detalhes)
export function formatarAlerta(alerta) {
  const { bairro, _count, ...resto } = alerta
  const localizacao = bairro
    ? achatarLocalizacao({ cidade: bairro.cidade, bairro })
    : {}

  return {
    ...resto,
    tipoLabel:      TIPOS_ALERTA[alerta.tipo]?.label ?? alerta.tipo,
    gravidadeLabel: GRAVIDADES[alerta.gravidade]?.label ?? alerta.gravidade,
    bairroId:       alerta.bairroId,
    bairro:         localizacao.bairro ?? null,
    cidade:         localizacao.cidade ?? null,
    cidadeId:       localizacao.cidadeId ?? null,
    estado:         localizacao.estado ?? null,
    totalRelatos:   _count?.relatos ?? alerta.relatos?.length ?? 0,
    confirmacoesNecessarias: CONFIRMACOES_MINIMAS,
  }
}

export const includeListagemAlerta = {
  bairro: { select: { id_bairro: true, nome: true, cidade: selectLocalizacao.cidade } },
  _count: { select: { relatos: true } },
}


// ─── DISPARO ─────────────────────────────────────────────────────────────────

// Cria as notificações de disparo: uma por inscrito que mora ou acompanha o
// bairro e uma para o grupo da cidade (se houver). Deve rodar dentro de uma
// transação.
async function gerarNotificacoesDisparo(tx, alertaId) {
  const alerta = await tx.alerta.findUnique({
    where: { id_alerta: alertaId },
    include: {
      ...includeBairroCompleto,
      relatos: { select: { fotoRelato: true }, orderBy: { createdAt: 'asc' } },
    }
  })

  const totalRelatos = alerta.relatos.length
  const fotoUrl = alerta.relatos.find(r => r.fotoRelato)?.fotoRelato ?? null

  const destinatarios = await tx.inscritoAlerta.findMany({
    where: {
      ativo: true,
      OR: [
        { bairroId: alerta.bairroId },
        { bairrosInteresse: { some: { bairroId: alerta.bairroId } } },
      ]
    },
    select: { id_inscrito: true, whatsappId: true }
  })

  const mensagemInscrito = montarMensagemAlerta(alerta, totalRelatos, { paraGrupo: false })

  const notificacoes = destinatarios.map(d => ({
    alertaId,
    evento: 'disparo',
    tipoDestino: 'inscrito',
    destino: d.whatsappId,
    inscritoId: d.id_inscrito,
    mensagem: mensagemInscrito,
    fotoUrl,
  }))

  const cidade = alerta.bairro.cidade
  if (cidade.grupoWhatsappId) {
    notificacoes.push({
      alertaId,
      evento: 'disparo',
      tipoDestino: 'grupo',
      destino: cidade.grupoWhatsappId,
      cidadeId: cidade.id_cidade,
      mensagem: montarMensagemAlerta(alerta, totalRelatos, { paraGrupo: true }),
      fotoUrl,
    })
  }

  // skipDuplicates + @@unique([alertaId, evento, destino]) garantem que
  // ninguém recebe o mesmo alerta duas vezes
  const { count } = await tx.notificacao.createMany({ data: notificacoes, skipDuplicates: true })
  return count
}

// Muda o alerta de "em_verificacao" para "ativo" e gera as notificações.
// Retorna false se outro processo já tinha disparado (ou o status mudou).
export async function dispararAlerta(tx, alertaId, { adminId } = {}) {
  const { count } = await tx.alerta.updateMany({
    where: { id_alerta: alertaId, status: 'em_verificacao' },
    data: {
      status: 'ativo',
      disparadoEm: new Date(),
      disparadoPorAdmin: Boolean(adminId),
      ...(adminId ? { analisadoPorId: adminId } : {}),
    }
  })

  if (count === 0) return false

  await gerarNotificacoesDisparo(tx, alertaId)
  return true
}


// ─── RELATO VINDO DO BOT ─────────────────────────────────────────────────────

export class ErroAlerta extends Error {
  constructor(mensagem, statusCode = 400) {
    super(mensagem)
    this.statusCode = statusCode
  }
}

// Registra o relato de um inscrito e decide o que acontece com o alerta.
//
// Retorna { alerta, situacao, totalRelatos, confirmacoesNecessarias }
//   situacao:
//     'aguardando_confirmacao' → alerta ainda não atingiu o mínimo
//     'disparado'              → este relato fez o alerta ser disparado agora
//     'ja_ativo'               → o alerta já estava ativo; o relato só reforça
export async function registrarRelato(prisma, { inscritoId, tipo, gravidade, bairroId, fotoRelato }) {
  if (!TIPOS_ALERTA[tipo]) throw new ErroAlerta('Tipo de alerta inválido.')
  if (!GRAVIDADES[gravidade]) throw new ErroAlerta('Gravidade inválida.')

  const bairro = await prisma.bairro.findUnique({ where: { id_bairro: Number(bairroId) } })
  if (!bairro) throw new ErroAlerta('Bairro não encontrado.', 404)

  const indiceTipo = Object.keys(TIPOS_ALERTA).indexOf(tipo)

  return prisma.$transaction(async (tx) => {
    // Trava por (bairro, tipo) até o fim da transação: dois relatos que
    // chegam juntos não criam dois alertas nem disparam duas vezes
    await tx.$executeRaw`SELECT pg_advisory_xact_lock(${bairro.id_bairro}::int, ${indiceTipo}::int)`

    const inicioJanela = new Date(Date.now() - JANELA_HORAS * 60 * 60 * 1000)

    let alerta = await tx.alerta.findFirst({
      where: {
        bairroId: bairro.id_bairro,
        tipo,
        OR: [
          { status: 'ativo' },
          { status: 'em_verificacao', createdAt: { gte: inicioJanela } },
        ]
      },
      orderBy: { createdAt: 'desc' }
    })

    if (alerta) {
      const jaRelatou = await tx.relatoAlerta.findFirst({
        where: { alertaId: alerta.id_alerta, inscritoId }
      })
      if (jaRelatou) {
        throw new ErroAlerta('Você já relatou esta ocorrência. Obrigado!', 409)
      }
    } else {
      alerta = await tx.alerta.create({
        data: { tipo, gravidade, bairroId: bairro.id_bairro }
      })
    }

    await tx.relatoAlerta.create({
      data: { alertaId: alerta.id_alerta, inscritoId, gravidade, fotoRelato: fotoRelato ?? null }
    })

    const relatos = await tx.relatoAlerta.findMany({
      where: { alertaId: alerta.id_alerta },
      select: { gravidade: true }
    })

    await tx.alerta.update({
      where: { id_alerta: alerta.id_alerta },
      data: { gravidade: calcularGravidade(relatos) }
    })

    let situacao = alerta.status === 'ativo' ? 'ja_ativo' : 'aguardando_confirmacao'

    if (alerta.status === 'em_verificacao' && relatos.length >= CONFIRMACOES_MINIMAS) {
      const disparou = await dispararAlerta(tx, alerta.id_alerta)
      if (disparou) situacao = 'disparado'
    }

    const alertaAtualizado = await tx.alerta.findUnique({
      where: { id_alerta: alerta.id_alerta },
      include: includeListagemAlerta
    })

    return {
      alerta: formatarAlerta(alertaAtualizado),
      situacao,
      totalRelatos: relatos.length,
      confirmacoesNecessarias: CONFIRMACOES_MINIMAS,
    }
  }, { timeout: 15000 })
}


// ─── AÇÕES DO ADMIN ──────────────────────────────────────────────────────────

// Cancela o alerta. Se ele já tinha sido disparado, envia uma correção para
// quem recebeu (ou pode ter recebido) o aviso.
export async function cancelarAlerta(prisma, alertaId, { adminId, motivo }) {
  return prisma.$transaction(async (tx) => {
    const alerta = await tx.alerta.findUnique({ where: { id_alerta: alertaId } })
    if (!alerta) throw new ErroAlerta('Alerta não encontrado.', 404)
    if (['cancelado', 'encerrado'].includes(alerta.status)) {
      throw new ErroAlerta(`Este alerta já está ${alerta.status}.`)
    }

    const cancelado = await tx.alerta.update({
      where: { id_alerta: alertaId },
      data: {
        status: 'cancelado',
        motivoCancelamento: motivo,
        analisadoPorId: adminId,
        finalizadoEm: new Date(),
      },
      include: includeBairroCompleto
    })

    // O que ainda não saiu não sai mais
    await tx.notificacao.updateMany({
      where: { alertaId, evento: 'disparo', status: { in: ['pendente', 'falha'] } },
      data: { status: 'cancelada' }
    })

    let correcoes = 0

    if (alerta.status === 'ativo') {
      const recebidas = await tx.notificacao.findMany({
        where: { alertaId, evento: 'disparo', status: { in: ['enviada', 'enviando'] } },
        select: { tipoDestino: true, destino: true, inscritoId: true, cidadeId: true }
      })

      const mensagem = montarMensagemCancelamento(cancelado)

      const resultado = await tx.notificacao.createMany({
        data: recebidas.map(n => ({ ...n, alertaId, evento: 'cancelamento', mensagem })),
        skipDuplicates: true
      })
      correcoes = resultado.count
    }

    return { alerta: cancelado, correcoes }
  })
}

// Encerra a ocorrência (resolvida). Notificações que ainda não saíram são
// canceladas para não avisar sobre algo que já acabou.
export async function encerrarAlerta(prisma, alertaId, { adminId }) {
  return prisma.$transaction(async (tx) => {
    const alerta = await tx.alerta.findUnique({ where: { id_alerta: alertaId } })
    if (!alerta) throw new ErroAlerta('Alerta não encontrado.', 404)
    if (['cancelado', 'encerrado'].includes(alerta.status)) {
      throw new ErroAlerta(`Este alerta já está ${alerta.status}.`)
    }

    await tx.notificacao.updateMany({
      where: { alertaId, status: { in: ['pendente', 'falha'] } },
      data: { status: 'cancelada' }
    })

    return tx.alerta.update({
      where: { id_alerta: alertaId },
      data: { status: 'encerrado', analisadoPorId: adminId, finalizadoEm: new Date() }
    })
  })
}
