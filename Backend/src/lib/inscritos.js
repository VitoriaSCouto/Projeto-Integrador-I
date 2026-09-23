// Include e formatação dos inscritos do sistema de alertas
// (usados pelas rotas do bot e do painel admin)

const cidadeComEstado = { select: { id_cidade: true, nome: true, estado: { select: { sigla: true } } } }

export const includeInscrito = {
  bairro: { select: { id_bairro: true, nome: true, cidade: cidadeComEstado } },
  bairrosInteresse: {
    orderBy: { createdAt: 'asc' },
    include: { bairro: { select: { id_bairro: true, nome: true, cidade: cidadeComEstado } } }
  },
  _count: { select: { relatos: true } },
}

function formatarBairro(bairro) {
  return {
    id_bairro: bairro.id_bairro,
    nome:      bairro.nome,
    cidadeId:  bairro.cidade.id_cidade,
    cidade:    bairro.cidade.nome,
    estado:    bairro.cidade.estado.sigla,
  }
}

export function formatarInscrito({ bairro, bairrosInteresse, _count, ...inscrito }) {
  return {
    ...inscrito,
    bairro:   bairro.nome,
    cidadeId: bairro.cidade.id_cidade,
    cidade:   bairro.cidade.nome,
    estado:   bairro.cidade.estado.sigla,
    bairrosInteresse: (bairrosInteresse ?? []).map(i => formatarBairro(i.bairro)),
    totalRelatos: _count?.relatos ?? 0,
  }
}

// Validação simples de e-mail (algo@algo.algo)
export function emailValido(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(email ?? '').trim())
}
