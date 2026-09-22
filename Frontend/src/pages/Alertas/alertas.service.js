import { criarDadosDemo } from './alertas.demo.js';
import { validarFormulario } from './alertas.utils.js';

// O modo API é explícito: uma falha de rede nunca é substituída por dados fictícios.
const modo = import.meta.env.VITE_ALERTAS_MODO || 'api';
export const MODO_DEMO = modo === 'demo';
const base = (import.meta.env.VITE_API_URL || 'http://localhost:3000/api').replace(/\/$/, '');
const demo = criarDadosDemo();
const clonar = (valor) => structuredClone(valor);

async function requisicao(caminho = '', options = {}) {
  if (modo !== 'api') throw new Error('VITE_ALERTAS_MODO deve ser demo ou api.');
  const token = localStorage.getItem('token_adm');
  if (!token) throw new Error('Entre com sua conta de administrador para acessar os alertas.');
  const abortar = new AbortController();
  const timeout = setTimeout(() => abortar.abort(), 15_000);
  try {
    const resposta = await fetch(`${base}/alertas${caminho}`, {
      ...options, signal: abortar.signal,
      headers: { ...(options.body ? { 'Content-Type': 'application/json' } : {}), Authorization: `Bearer ${token}` },
    });
    const dados = await resposta.json().catch(() => null);
    if (!resposta.ok) {
      throw new Error(dados?.mensagem || (resposta.status === 401
        ? 'Sua sessão expirou. Entre novamente como administrador.'
        : `Não foi possível concluir a operação (HTTP ${resposta.status}).`));
    }
    if (!dados) throw new Error('A API devolveu uma resposta inválida. Confira o endereço configurado.');
    return dados;
  } catch (erro) {
    if (erro.name === 'AbortError') throw new Error('A API demorou a responder. Atualize a lista antes de repetir uma gravação.');
    if (erro instanceof TypeError) throw new Error('Sem conexão com a API. Verifique o servidor e tente atualizar.');
    throw erro;
  } finally { clearTimeout(timeout); }
}

function normalizar(payload) {
  const erro = validarFormulario(payload);
  if (erro) throw new Error(erro);
  const regiao = demo.regioes.find((item) => item.id_regiao === payload.regiaoId);
  if (!regiao) throw new Error('Região não encontrada.');
  return Object.fromEntries([
    ...['titulo', 'descricao', 'orientacoes', 'fonteNome', 'fonteUrl'].map((chave) => [chave, String(payload[chave] || '').trim()]),
    ...['tipo', 'severidade', 'regiaoId', 'inicioEm', 'expiraEm'].map((chave) => [chave, payload[chave]]),
    ['regiao', regiao],
  ]);
}

function localizar(id, versao) {
  const alerta = demo.alertas.find((item) => item.id_alerta === id);
  if (!alerta) throw new Error('Alerta não encontrado.');
  if (alerta.versao !== versao) throw new Error('O alerta foi atualizado. Feche esta janela e atualize a lista.');
  return alerta;
}

function registrar(alerta, acao, observacao = '') {
  const agora = new Date().toISOString();
  alerta.updatedAt = agora;
  alerta.historico.unshift({ id: crypto.randomUUID(), acao, observacao, createdAt: agora, ator: demo.admin });
}

export const alertasService = {
  async listar() {
    if (MODO_DEMO) return clonar(demo.alertas);
    const { alertas } = await requisicao();
    if (!Array.isArray(alertas)) throw new Error('Lista de alertas inválida.');
    return alertas;
  },
  async listarRegioes() {
    if (MODO_DEMO) return clonar(demo.regioes);
    const { regioes } = await requisicao('/regioes');
    if (!Array.isArray(regioes)) throw new Error('Lista de regiões inválida.');
    return regioes;
  },
  async criar(payload) {
    if (!MODO_DEMO) return (await requisicao('', { method: 'POST', body: JSON.stringify(payload) })).alerta;
    const dados = normalizar(payload);
    const agora = new Date().toISOString();
    const alerta = { ...dados, id_alerta: Math.max(0, ...demo.alertas.map((a) => a.id_alerta)) + 1,
      status: 'rascunho', versao: 1, criadoPor: demo.admin, publicadoEm: null,
      createdAt: agora, updatedAt: agora, historico: [] };
    registrar(alerta, 'criar');
    demo.alertas.unshift(alerta);
    return clonar(alerta);
  },
  async editar(id, payload) {
    if (!MODO_DEMO) return (await requisicao(`/${id}`, { method: 'PUT', body: JSON.stringify(payload) })).alerta;
    const alerta = localizar(id, payload.versao);
    if (alerta.status !== 'rascunho') throw new Error('Somente rascunhos podem ser editados.');
    Object.assign(alerta, normalizar(payload), { versao: alerta.versao + 1 });
    registrar(alerta, 'editar');
    return clonar(alerta);
  },
  async transicionar(id, payload) {
    if (!MODO_DEMO) return (await requisicao(`/${id}/transicoes`, { method: 'POST', body: JSON.stringify(payload) })).alerta;
    const alerta = localizar(id, payload.versao);
    const regras = {
      enviar_revisao: [['rascunho'], 'em_revisao'], devolver_rascunho: [['em_revisao'], 'rascunho'],
      publicar: [['em_revisao'], 'publicado'], encerrar: [['publicado'], 'encerrado'],
      cancelar: [['rascunho', 'em_revisao', 'publicado'], 'cancelado'],
    };
    const regra = regras[payload.acao];
    if (!regra || !regra[0].includes(alerta.status)) throw new Error('Esta ação não está disponível para o estado atual.');
    const observacao = String(payload.observacao || '').trim();
    if (['encerrar', 'cancelar', 'devolver_rascunho'].includes(payload.acao) && observacao.length < 10) {
      throw new Error('Explique o motivo com pelo menos 10 caracteres.');
    }
    if (observacao.length > 2000) throw new Error('A observação deve ter no máximo 2000 caracteres.');
    if (payload.acao === 'publicar') {
      const erro = validarFormulario(alerta);
      if (erro) throw new Error(erro);
      alerta.publicadoEm = new Date().toISOString();
    }
    alerta.status = regra[1];
    alerta.versao += 1;
    registrar(alerta, payload.acao, observacao);
    return clonar(alerta);
  },
};
