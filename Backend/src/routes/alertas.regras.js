// Regras independentes de Fastify/Prisma: podem ser verificadas sem banco.
export const TIPOS_ALERTA = ['inundacao', 'deslizamento', 'tempestade', 'vento_forte', 'outro']
export const SEVERIDADES_ALERTA = ['baixa', 'moderada', 'alta', 'critica']

export class ErroAlerta extends Error {
  constructor(mensagem, statusCode = 400) {
    super(mensagem)
    this.name = 'ErroAlerta'
    this.statusCode = statusCode
  }
}

function exigirObjeto(valor) {
  if (!valor || typeof valor !== 'object' || Array.isArray(valor)) {
    throw new ErroAlerta('Envie um objeto JSON válido.')
  }
}

function aceitarCampos(body, permitidos) {
  exigirObjeto(body)
  if (Object.keys(body).some((campo) => !permitidos.includes(campo))) {
    throw new ErroAlerta('A requisição contém campos não permitidos.')
  }
}

function texto(valor, nome, minimo, maximo) {
  if (typeof valor !== 'string') throw new ErroAlerta(`${nome} deve ser um texto.`)
  const resultado = valor.trim()
  if (resultado.length < minimo || resultado.length > maximo) {
    throw new ErroAlerta(`${nome} deve conter entre ${minimo} e ${maximo} caracteres.`)
  }
  return resultado
}

function enumValido(valor, valores, nome) {
  if (!valores.includes(valor)) throw new ErroAlerta(`${nome} inválido.`)
  return valor
}

export function validarId(valor, nome = 'Identificador') {
  // Aceita IDs vindos da URL e do select HTML, mas rejeita expoentes/decimais.
  const normalizado = typeof valor === 'string' && /^[1-9]\d*$/.test(valor)
    ? Number(valor)
    : valor
  if (!Number.isSafeInteger(normalizado) || normalizado <= 0 || normalizado > 2147483647) {
    throw new ErroAlerta(`${nome} deve ser um número inteiro positivo válido.`)
  }
  return normalizado
}

export function validarVersao(valor) {
  if (typeof valor !== 'number') throw new ErroAlerta('Informe a versão numérica do alerta.')
  return validarId(valor, 'Versão')
}

function dataComFuso(valor, nome) {
  if (typeof valor !== 'string') throw new ErroAlerta(`${nome} deve ser uma data ISO com fuso horário.`)
  const partes = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})(?::(\d{2})(?:\.(\d{1,3}))?)?(Z|[+-]\d{2}:\d{2})$/.exec(valor)
  if (!partes) throw new ErroAlerta(`${nome} deve ser uma data ISO com fuso horário.`)
  const [, ano, mes, dia, hora, minuto, segundo = '0'] = partes
  const ultimoDia = new Date(Date.UTC(Number(ano), Number(mes), 0)).getUTCDate()
  if (Number(ano) < 1000 || Number(mes) < 1 || Number(mes) > 12 ||
      Number(dia) < 1 || Number(dia) > ultimoDia || Number(hora) > 23 ||
      Number(minuto) > 59 || Number(segundo) > 59) {
    throw new ErroAlerta(`${nome} contém uma data ou horário inválido.`)
  }
  const data = new Date(valor)
  if (!Number.isFinite(data.getTime())) throw new ErroAlerta(`${nome} inválido.`)
  return data
}

function urlFonte(valor) {
  if (valor == null || valor === '') return null
  const endereco = texto(valor, 'URL da fonte', 1, 2048)
  let url
  try { url = new URL(endereco) } catch { throw new ErroAlerta('A URL da fonte deve ser um endereço HTTP ou HTTPS válido.') }
  if (!['http:', 'https:'].includes(url.protocol) || !url.hostname || url.username || url.password) {
    throw new ErroAlerta('Use uma URL HTTP ou HTTPS sem credenciais na fonte.')
  }
  if (url.href.length > 2048) throw new ErroAlerta('A URL normalizada da fonte deve ter até 2048 caracteres.')
  // É apenas uma referência: o servidor nunca acessa esta URL.
  return url.href
}

const CAMPOS_CONTEUDO = [
  'titulo', 'descricao', 'orientacoes', 'tipo', 'severidade', 'regiaoId',
  'inicioEm', 'expiraEm', 'fonteNome', 'fonteUrl',
]

function validarConteudo(body, agora) {
  const inicioEm = dataComFuso(body.inicioEm, 'Início da validade')
  const expiraEm = dataComFuso(body.expiraEm, 'Fim da validade')
  if (expiraEm <= inicioEm) throw new ErroAlerta('O fim da validade deve ser posterior ao início.')
  if (expiraEm <= agora) throw new ErroAlerta('O fim da validade deve estar no futuro.')
  return {
    titulo: texto(body.titulo, 'Título', 5, 140),
    descricao: texto(body.descricao, 'Descrição', 10, 3000),
    orientacoes: texto(body.orientacoes, 'Orientações', 10, 3000),
    tipo: enumValido(body.tipo, TIPOS_ALERTA, 'Tipo de desastre'),
    severidade: enumValido(body.severidade, SEVERIDADES_ALERTA, 'Nível de severidade'),
    regiaoId: validarId(body.regiaoId, 'Região'),
    inicioEm,
    expiraEm,
    fonteNome: texto(body.fonteNome, 'Nome da fonte', 3, 160),
    fonteUrl: urlFonte(body.fonteUrl),
  }
}

export function validarCriacao(body, agora = new Date()) {
  aceitarCampos(body, CAMPOS_CONTEUDO)
  return validarConteudo(body, agora)
}

export function validarEdicao(body, agora = new Date()) {
  aceitarCampos(body, [...CAMPOS_CONTEUDO, 'versao'])
  return { ...validarConteudo(body, agora), versao: validarVersao(body.versao) }
}

const TRANSICOES = {
  enviar_revisao: { de: ['rascunho'], para: 'em_revisao' },
  devolver_rascunho: { de: ['em_revisao'], para: 'rascunho', observacao: true },
  publicar: { de: ['em_revisao'], para: 'publicado' },
  encerrar: { de: ['publicado'], para: 'encerrado', observacao: true },
  cancelar: { de: ['rascunho', 'em_revisao', 'publicado'], para: 'cancelado', observacao: true },
}

export function validarTransicao(body) {
  aceitarCampos(body, ['acao', 'versao', 'observacao'])
  const acao = enumValido(body.acao, Object.keys(TRANSICOES), 'Ação')
  const regra = TRANSICOES[acao]
  const observacao = body.observacao == null || body.observacao === ''
    ? null
    : texto(body.observacao, 'Observação', 1, 2000)
  if (regra.observacao && (!observacao || observacao.length < 10)) {
    throw new ErroAlerta('Explique o motivo com pelo menos 10 caracteres.')
  }
  return { acao, versao: validarVersao(body.versao), observacao }
}

export function conferirVersao(alerta, versao) {
  if (alerta.versao !== versao) {
    throw new ErroAlerta('Este alerta foi atualizado por outra pessoa. Atualize a lista antes de tentar novamente.', 409)
  }
}

export function conferirTransicao(alerta, acao, agora = new Date()) {
  const regra = TRANSICOES[acao]
  if (!regra || !regra.de.includes(alerta.status)) {
    throw new ErroAlerta('Esta ação não está disponível no estado atual do alerta.', 409)
  }
  if (acao === 'publicar' && new Date(alerta.expiraEm) <= agora) {
    throw new ErroAlerta('A validade terminou. Devolva o alerta ao rascunho para corrigir as datas.', 409)
  }
  return regra.para
}

export function calcularSituacaoEfetiva(alerta, agora = new Date()) {
  if (alerta.status !== 'publicado') return alerta.status
  if (new Date(alerta.expiraEm) <= agora) return 'expirado'
  if (new Date(alerta.inicioEm) > agora) return 'agendado'
  return 'ativo'
}

export function criarSnapshot(alerta) {
  // JSON completo do conteúdo daquela versão, sem token, senha ou contatos.
  return {
    id_alerta: alerta.id_alerta,
    titulo: alerta.titulo,
    descricao: alerta.descricao,
    orientacoes: alerta.orientacoes,
    tipo: alerta.tipo,
    severidade: alerta.severidade,
    regiaoId: alerta.regiaoId,
    regiao: alerta.regiao,
    inicioEm: new Date(alerta.inicioEm).toISOString(),
    expiraEm: new Date(alerta.expiraEm).toISOString(),
    fonteNome: alerta.fonteNome,
    fonteUrl: alerta.fonteUrl,
    status: alerta.status,
    versao: alerta.versao,
    criadoPorId: alerta.criadoPorId,
    publicadoEm: alerta.publicadoEm ? new Date(alerta.publicadoEm).toISOString() : null,
  }
}
