export const TIPOS = {
  inundacao: 'Inundação', deslizamento: 'Deslizamento', tempestade: 'Tempestade',
  vento_forte: 'Vento forte', outro: 'Outro evento',
};
export const SEVERIDADES = { baixa: 'Baixa', moderada: 'Moderada', alta: 'Alta', critica: 'Crítica' };
export const STATUS_LABELS = {
  rascunho: 'Rascunho', em_revisao: 'Em revisão', publicado: 'Publicado', agendado: 'Agendado',
  ativo: 'Ativo', expirado: 'Expirado', encerrado: 'Encerrado', cancelado: 'Cancelado',
};

// Expiração é derivada da validade; não depende de uma tarefa agendada no banco.
export function statusEfetivo(alerta, agora = Date.now()) {
  if (alerta.status !== 'publicado') return alerta.status;
  if (new Date(alerta.expiraEm).getTime() <= Number(agora)) return 'expirado';
  if (new Date(alerta.inicioEm).getTime() > Number(agora)) return 'agendado';
  return 'ativo';
}

export function formatarData(valor) {
  if (!valor || Number.isNaN(new Date(valor).getTime())) return 'Não informado';
  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit',
    timeZone: 'America/Sao_Paulo',
  }).format(new Date(valor));
}

export function dataParaInput(iso) {
  const data = new Date(iso);
  if (Number.isNaN(data.getTime())) return '';
  return new Date(data.getTime() - data.getTimezoneOffset() * 60_000).toISOString().slice(0, 16);
}

export function dataDoInput(valor) {
  const data = new Date(valor);
  return valor && !Number.isNaN(data.getTime()) ? data.toISOString() : '';
}

export function validarFormulario(dados) {
  const campos = [
    ['titulo', 'Título', 5, 140], ['descricao', 'Descrição', 10, 3000],
    ['orientacoes', 'Orientações', 10, 3000], ['fonteNome', 'Nome da fonte', 3, 160],
  ];
  for (const [campo, nome, min, max] of campos) {
    const tamanho = String(dados[campo] ?? '').trim().length;
    if (tamanho < min || tamanho > max) return `${nome}: informe entre ${min} e ${max} caracteres.`;
  }
  if (!Number.isSafeInteger(dados.regiaoId) || dados.regiaoId < 1) return 'Selecione uma região cadastrada.';
  if (!Object.hasOwn(TIPOS, dados.tipo)) return 'Selecione o tipo de evento.';
  if (!Object.hasOwn(SEVERIDADES, dados.severidade)) return 'Selecione a severidade.';
  const inicio = Date.parse(dados.inicioEm);
  const fim = Date.parse(dados.expiraEm);
  if (!Number.isFinite(inicio) || !Number.isFinite(fim)) return 'Informe o início e o fim da validade.';
  if (fim <= inicio) return 'O fim da validade deve ser posterior ao início.';
  if (fim <= Date.now()) return 'O fim da validade deve estar no futuro.';
  const endereco = String(dados.fonteUrl ?? '').trim();
  if (endereco) {
    try {
      const url = new URL(endereco);
      if (!['http:', 'https:'].includes(url.protocol) || endereco.length > 2048 || url.username || url.password) {
        return 'Informe um link da fonte http ou https válido, sem credenciais.';
      }
    } catch { return 'Informe um link da fonte válido (https://...).'; }
  }
  return null;
}
