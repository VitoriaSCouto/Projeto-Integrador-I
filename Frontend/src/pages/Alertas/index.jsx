import AdminSidebar from '../../components/AdminSidebar';
import { useCallback, useEffect, useId, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  FiAlertTriangle, FiArrowUpRight, FiBell, FiCheckCircle,
  FiChevronRight, FiClock, FiCloudRain, FiEdit3, FiExternalLink,
  FiFileText, FiInfo, FiMapPin, FiPlus, FiRefreshCw,
  FiSearch, FiShield, FiWind, FiX,
} from 'react-icons/fi';
import { alertasService, MODO_DEMO } from './alertas.service.js';
import {
  TIPOS, SEVERIDADES, STATUS_LABELS, statusEfetivo, formatarData,
  dataParaInput, dataDoInput, validarFormulario,
} from './alertas.utils.js';
import './alertas.css';

const ICONES_TIPO = { inundacao: FiCloudRain, deslizamento: FiAlertTriangle, tempestade: FiCloudRain, vento_forte: FiWind, outro: FiBell };
const ACOES = {
  criar: 'Rascunho criado', criado: 'Rascunho criado', editar: 'Rascunho atualizado',
  enviar_revisao: 'Enviado para revisão', devolver_rascunho: 'Devolvido para ajustes',
  publicar: 'Alerta publicado', encerrar: 'Alerta encerrado', cancelar: 'Alerta cancelado',
};
const CONFIG_ACOES = {
  enviar_revisao: { titulo: 'Enviar para revisão', botao: 'Enviar para revisão', texto: 'O conteúdo ficará disponível para conferência antes da publicação.' },
  devolver_rascunho: { titulo: 'Devolver para ajustes', botao: 'Devolver rascunho', texto: 'Descreva os ajustes necessários. O alerta voltará a ser editável.', exigeObservacao: true },
  publicar: { titulo: 'Revisar e publicar', botao: 'Confirmar publicação', texto: 'Confira a mensagem, a região, a fonte e a vigência antes de confirmar.' },
  encerrar: { titulo: 'Encerrar alerta', botao: 'Encerrar alerta', texto: 'O alerta deixará de estar vigente. Registre o motivo do encerramento.', exigeObservacao: true },
  cancelar: { titulo: 'Cancelar alerta', botao: 'Confirmar cancelamento', texto: 'O registro será preservado no histórico. Informe por que este alerta foi cancelado.', exigeObservacao: true },
};
const NORMALIZAR = (texto = '') => String(texto).normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
const localRegiao = (regiao) => regiao ? `${regiao.bairro} · ${regiao.cidade}/${regiao.estado}` : 'Região não informada';

function urlSegura(valor) {
  try {
    const url = new URL(valor);
    return ['http:', 'https:'].includes(url.protocol) ? url.href : null;
  } catch { return null; }
}

function Etiqueta({ valor, tipo = 'status' }) {
  return <span className={`al-tag al-tag--${tipo}-${valor}`}>{(tipo === 'severidade' ? SEVERIDADES : STATUS_LABELS)[valor] || valor}</span>;
}

function Fonte({ alerta }) {
  const url = urlSegura(alerta.fonteUrl);
  return url
    ? <a className="al-source-link" href={url} target="_blank" rel="noopener noreferrer">{alerta.fonteNome}<FiExternalLink aria-hidden="true" /><span className="al-sr-only"> (abre em outra aba)</span></a>
    : <span>{alerta.fonteNome || 'Não informada'}</span>;
}

function PreviaAlerta({ alerta, agora }) {
  return <section className="al-preview" aria-label="Prévia do conteúdo do alerta">
    <div className="al-card-tags"><Etiqueta valor={alerta.severidade} tipo="severidade" /><span className="al-type-label">{TIPOS[alerta.tipo]}</span></div>
    <h3>{alerta.titulo}</h3>
    <p className="al-location"><FiMapPin aria-hidden="true" />{localRegiao(alerta.regiao)}</p>
    <h4>O que está acontecendo</h4><p className="al-prose">{alerta.descricao}</p>
    <div className="al-guidance"><h4><FiShield aria-hidden="true" /> Orientações à população</h4><p className="al-prose">{alerta.orientacoes}</p></div>
    <dl className="al-detail-grid">
      <div><dt>Início da vigência</dt><dd>{formatarData(alerta.inicioEm)}</dd></div>
      <div><dt>Fim da vigência</dt><dd>{formatarData(alerta.expiraEm)}</dd></div>
      <div><dt>Fonte da informação</dt><dd><Fonte alerta={alerta} /></dd></div>
      <div><dt>Situação</dt><dd><Etiqueta valor={statusEfetivo(alerta, agora)} /></dd></div>
    </dl>
    <p className="al-microcopy">Horários exibidos no fuso de São Paulo (America/Sao_Paulo).</p>
  </section>;
}

function FormularioAlerta({ alerta, regioes, ocupado, erro, onSalvar, onVoltar }) {
  const id = useId();
  const [form, setForm] = useState(() => ({
    titulo: alerta?.titulo || '', descricao: alerta?.descricao || '', orientacoes: alerta?.orientacoes || '',
    tipo: alerta?.tipo || 'inundacao', severidade: alerta?.severidade || 'moderada',
    regiaoId: alerta?.regiaoId ? String(alerta.regiaoId) : '',
    inicioEm: dataParaInput(alerta?.inicioEm || new Date().toISOString()),
    expiraEm: dataParaInput(alerta?.expiraEm || new Date(Date.now() + 6 * 3600000).toISOString()),
    fonteNome: alerta?.fonteNome || '', fonteUrl: alerta?.fonteUrl || '',
  }));
  const [erroLocal, setErroLocal] = useState('');
  const fuso = Intl.DateTimeFormat().resolvedOptions().timeZone;
  const alterar = (event) => setForm((anterior) => ({ ...anterior, [event.target.name]: event.target.value }));
  const campo = (nome) => ({ id: `${id}-${nome}`, name: nome, value: form[nome], onChange: alterar, disabled: ocupado });
  function enviar(event) {
    event.preventDefault();
    let payload;
    try {
      payload = { ...form, titulo: form.titulo.trim(), descricao: form.descricao.trim(), orientacoes: form.orientacoes.trim(),
        fonteNome: form.fonteNome.trim(), fonteUrl: form.fonteUrl.trim(), regiaoId: Number(form.regiaoId),
        inicioEm: dataDoInput(form.inicioEm), expiraEm: dataDoInput(form.expiraEm) };
    } catch { setErroLocal('Informe datas válidas para o início e o fim da vigência.'); return; }
    const falha = validarFormulario(payload);
    setErroLocal(falha || '');
    if (!falha) onSalvar(payload);
  }
  return <form className="al-form" onSubmit={enviar}>
    <p className="al-form-intro">Todos os campos são obrigatórios, exceto o link da fonte. O conteúdo será salvo como rascunho.</p>
    {(erroLocal || erro) && <p className="al-inline-error" role="alert">{erroLocal || erro}</p>}
    <div className="al-field"><label htmlFor={`${id}-titulo`}>Título do alerta</label><input {...campo('titulo')} required minLength={5} maxLength={140} placeholder="Ex.: Risco de inundação no bairro Centro" /><small>{form.titulo.length}/140 caracteres</small></div>
    <div className="al-form-grid">
      <div className="al-field"><label htmlFor={`${id}-tipo`}>Tipo de evento</label><select {...campo('tipo')}>{Object.entries(TIPOS).map(([valor, nome]) => <option key={valor} value={valor}>{nome}</option>)}</select></div>
      <div className="al-field"><label htmlFor={`${id}-severidade`}>Severidade</label><select {...campo('severidade')}>{Object.entries(SEVERIDADES).map(([valor, nome]) => <option key={valor} value={valor}>{nome}</option>)}</select></div>
    </div>
    <div className="al-field"><label htmlFor={`${id}-regiaoId`}>Região afetada</label><select {...campo('regiaoId')} required><option value="">Selecione uma região cadastrada</option>{regioes.map((regiao) => <option key={regiao.id_regiao} value={regiao.id_regiao}>{localRegiao(regiao)}</option>)}</select>{!regioes.length && <small>Nenhuma região cadastrada. Cadastre uma região no projeto antes de criar alertas.</small>}</div>
    <div className="al-field"><label htmlFor={`${id}-descricao`}>Descrição da situação</label><textarea {...campo('descricao')} required minLength={10} maxLength={3000} rows={3} placeholder="Descreva a situação, a área afetada e a informação confirmada." /><small>{form.descricao.length}/3.000 caracteres</small></div>
    <div className="al-field"><label htmlFor={`${id}-orientacoes`}>Orientações à população</label><textarea {...campo('orientacoes')} required minLength={10} maxLength={3000} rows={3} placeholder="Registre orientações objetivas e validadas pela equipe responsável." /><small>{form.orientacoes.length}/3.000 caracteres</small></div>
    <div className="al-form-grid">
      <div className="al-field"><label htmlFor={`${id}-inicioEm`}>Início da vigência</label><input {...campo('inicioEm')} type="datetime-local" required aria-describedby={`${id}-fuso`} /></div>
      <div className="al-field"><label htmlFor={`${id}-expiraEm`}>Fim da vigência</label><input {...campo('expiraEm')} type="datetime-local" required aria-describedby={`${id}-fuso`} /></div>
    </div>
    <p className="al-microcopy" id={`${id}-fuso`}>Digite as datas no fuso do seu navegador: <strong>{fuso}</strong>. O fim deve ser posterior ao início e ao momento atual.</p>
    <div className="al-field"><label htmlFor={`${id}-fonteNome`}>Fonte da informação</label><input {...campo('fonteNome')} required minLength={3} maxLength={160} placeholder="Ex.: órgão responsável e identificação do boletim" /></div>
    <div className="al-field"><label htmlFor={`${id}-fonteUrl`}>Link da fonte <span>(opcional)</span></label><input {...campo('fonteUrl')} type="url" maxLength={2048} placeholder="https://" /></div>
    <div className="al-modal-footer"><button type="button" className="al-button al-button--secondary" onClick={onVoltar} disabled={ocupado}>Voltar</button><button type="submit" className="al-button al-button--primary" disabled={ocupado || !regioes.length}><FiFileText aria-hidden="true" />{ocupado ? 'Salvando…' : 'Salvar rascunho'}</button></div>
  </form>;
}

function ConfirmacaoAcao({ alerta, acao, agora, ocupado, erro, onConfirmar, onVoltar }) {
  const id = useId();
  const config = CONFIG_ACOES[acao];
  const [observacao, setObservacao] = useState('');
  const [confirmado, setConfirmado] = useState(false);
  const [erroLocal, setErroLocal] = useState('');
  const expirado = new Date(alerta.expiraEm).getTime() <= agora;
  function enviar(event) {
    event.preventDefault();
    if (config.exigeObservacao && observacao.trim().length < 10) { setErroLocal('Registre uma observação com pelo menos 10 caracteres.'); return; }
    if (acao === 'publicar' && !confirmado) { setErroLocal('Confirme a revisão do conteúdo antes de publicar.'); return; }
    setErroLocal('');
    onConfirmar(observacao.trim());
  }
  return <form className="al-confirm-form" onSubmit={enviar}>
    <p className="al-form-intro">{config.texto}</p>
    {acao === 'publicar' ? <>
      <PreviaAlerta alerta={alerta} agora={agora} />
      <p className="al-info-note"><FiInfo aria-hidden="true" />{MODO_DEMO ? 'Esta publicação é uma simulação. Nenhuma mensagem será enviada.' : 'Publicar disponibiliza o registro no sistema. O envio por WhatsApp não está integrado a esta tela.'}</p>
      {expirado && <p className="al-inline-error" role="alert">A vigência terminou. Devolva o alerta para ajustes antes de publicar.</p>}
      <label className="al-check" htmlFor={`${id}-confirmado`}><input id={`${id}-confirmado`} type="checkbox" checked={confirmado} onChange={(event) => setConfirmado(event.target.checked)} required disabled={ocupado} /><span>Conferi a fonte, a região, a vigência e as orientações. Confirmo a revisão humana deste alerta.</span></label>
    </> : <div className="al-action-summary"><strong>{alerta.titulo}</strong><span>{localRegiao(alerta.regiao)}</span></div>}
    <div className="al-field"><label htmlFor={`${id}-observacao`}>{config.exigeObservacao ? 'Motivo / observação' : 'Observação da equipe (opcional)'}</label><textarea id={`${id}-observacao`} value={observacao} onChange={(event) => setObservacao(event.target.value)} rows={3} required={Boolean(config.exigeObservacao)} minLength={config.exigeObservacao ? 10 : undefined} maxLength={2000} disabled={ocupado} /></div>
    {(erroLocal || erro) && <p className="al-inline-error" role="alert">{erroLocal || erro}</p>}
    <div className="al-modal-footer"><button type="button" className="al-button al-button--secondary" onClick={onVoltar} disabled={ocupado}>Voltar</button><button type="submit" className={`al-button ${acao === 'cancelar' ? 'al-button--danger' : 'al-button--primary'}`} disabled={ocupado || (acao === 'publicar' && (!confirmado || expirado))}>{ocupado ? 'Processando…' : config.botao}</button></div>
  </form>;
}

function DetalhesAlerta({ alerta, agora, onEditar, onAcao }) {
  const efetivo = statusEfetivo(alerta, agora);
  const editavel = alerta.status === 'rascunho';
  const emRevisao = alerta.status === 'em_revisao';
  const publicadoVigente = alerta.status === 'publicado' && ['ativo', 'agendado'].includes(efetivo);
  return <div className="al-details">
    <PreviaAlerta alerta={alerta} agora={agora} />
    <dl className="al-detail-grid al-audit-meta"><div><dt>Criado por</dt><dd>{alerta.criadoPor?.nome || 'Equipe responsável'}</dd></div><div><dt>Última atualização</dt><dd>{formatarData(alerta.updatedAt)}</dd></div></dl>
    <section className="al-history"><h3><FiClock aria-hidden="true" /> Histórico do alerta</h3>
      {alerta.historico?.length ? <ol>{[...alerta.historico].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)).map((item, index) => <li key={item.id || `${item.createdAt}-${index}`}><strong>{ACOES[item.acao] || item.acao}</strong><span>{item.ator?.nome || 'Equipe responsável'} · {formatarData(item.createdAt)}</span>{item.observacao && <p className="al-prose">{item.observacao}</p>}</li>)}</ol> : <p className="al-muted">Nenhuma alteração registrada.</p>}
    </section>
    {(editavel || emRevisao || publicadoVigente) && <div className="al-modal-footer al-modal-footer--wrap">
      {(editavel || emRevisao || publicadoVigente) && <button type="button" className="al-button al-button--text-danger" onClick={() => onAcao('cancelar')}>Cancelar alerta</button>}
      {editavel && <><button type="button" className="al-button al-button--secondary" onClick={onEditar}><FiEdit3 aria-hidden="true" />Editar rascunho</button><button type="button" className="al-button al-button--primary" onClick={() => onAcao('enviar_revisao')}>Enviar para revisão</button></>}
      {emRevisao && <><button type="button" className="al-button al-button--secondary" onClick={() => onAcao('devolver_rascunho')}>Devolver para ajustes</button><button type="button" className="al-button al-button--primary" onClick={() => onAcao('publicar')}>Revisar e publicar</button></>}
      {publicadoVigente && <button type="button" className="al-button al-button--primary" onClick={() => onAcao('encerrar')}>Encerrar alerta</button>}
    </div>}
  </div>;
}

export default function Alertas() {
  const [alertas, setAlertas] = useState([]);
  const [regioes, setRegioes] = useState([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState('');
  const [atualizadoEm, setAtualizadoEm] = useState(null);
  const [agora, setAgora] = useState(Date.now());
  const [busca, setBusca] = useState('');
  const [municipio, setMunicipio] = useState('');
  const [severidade, setSeveridade] = useState('');
  const [situacao, setSituacao] = useState('');
  const [modal, setModal] = useState(null);
  const [ocupado, setOcupado] = useState(false);
  const [erroModal, setErroModal] = useState('');
  const [mensagem, setMensagem] = useState('');
  const dialogRef = useRef(null);
  const modalTitulo = useId();
  const filtroId = useId();
  const pedidoAtual = useRef(0);

  const carregar = useCallback(async () => {
    const pedido = ++pedidoAtual.current;
    setCarregando(true); setErro('');
    try {
      const [lista, listaRegioes] = await Promise.all([alertasService.listar(), alertasService.listarRegioes()]);
      if (pedido !== pedidoAtual.current) return;
      setAlertas(lista); setRegioes(listaRegioes); setAtualizadoEm(new Date().toISOString()); setAgora(Date.now());
    } catch (falha) {
      if (pedido === pedidoAtual.current) setErro(falha.message || 'Não foi possível carregar os alertas. Tente novamente.');
    } finally { if (pedido === pedidoAtual.current) setCarregando(false); }
  }, []);
  useEffect(() => {
    carregar();
    const timer = window.setInterval(() => setAgora(Date.now()), 30000);
    return () => { window.clearInterval(timer); pedidoAtual.current += 1; };
  }, [carregar]);
  useEffect(() => {
    const dialog = dialogRef.current;
    if (modal && !dialog.open) dialog.showModal();
    if (!modal && dialog.open) dialog.close();
    if (modal) dialog.querySelector('.al-close')?.focus({ preventScroll: true });
  }, [modal]);

  const municipios = useMemo(() => [...new Set([...regioes.map((item) => item.cidade), ...alertas.map((item) => item.regiao?.cidade)].filter(Boolean))].sort((a, b) => a.localeCompare(b, 'pt-BR')), [regioes, alertas]);
  const contagens = {
    ativos: alertas.filter((item) => statusEfetivo(item, agora) === 'ativo').length,
    criticos: alertas.filter((item) => statusEfetivo(item, agora) === 'ativo' && item.severidade === 'critica').length,
    revisao: alertas.filter((item) => item.status === 'em_revisao').length,
    expiram: alertas.filter((item) => item.status === 'publicado' && new Date(item.expiraEm).getTime() > agora && new Date(item.expiraEm).getTime() <= agora + 86400000).length,
  };
  const filtrados = alertas.filter((item) => {
    const texto = NORMALIZAR(`${item.titulo} ${item.descricao} ${item.regiao?.bairro || ''} ${item.regiao?.cidade || ''} ${item.fonteNome}`);
    return (!busca.trim() || texto.includes(NORMALIZAR(busca.trim()))) && (!municipio || item.regiao?.cidade === municipio) && (!severidade || item.severidade === severidade) && (!situacao || statusEfetivo(item, agora) === situacao);
  }).sort((a, b) => {
    const ordemStatus = { ativo: 0, em_revisao: 1, agendado: 2, rascunho: 3, expirado: 4, encerrado: 5, cancelado: 6 };
    const ordemSeveridade = { critica: 0, alta: 1, moderada: 2, baixa: 3 };
    return (ordemStatus[statusEfetivo(a, agora)] - ordemStatus[statusEfetivo(b, agora)]) || (ordemSeveridade[a.severidade] - ordemSeveridade[b.severidade]) || (new Date(b.updatedAt) - new Date(a.updatedAt));
  });
  const cobertura = municipios.map((cidade) => ({ cidade, total: alertas.filter((item) => item.regiao?.cidade === cidade && statusEfetivo(item, agora) === 'ativo').length }));
  const temFiltros = Boolean(busca || municipio || severidade || situacao);
  function limparFiltros() { setBusca(''); setMunicipio(''); setSeveridade(''); setSituacao(''); }
  function abrirModal(proximo) { setErroModal(''); setModal(proximo); }
  function fecharModal() { if (!ocupado) { setModal(null); setErroModal(''); } }
  function guardarResultado(resultado, texto) {
    setAlertas((lista) => [resultado, ...lista.filter((item) => item.id_alerta !== resultado.id_alerta)]);
    setAgora(Date.now()); setAtualizadoEm(new Date().toISOString()); setMensagem(texto);
    setModal({ tipo: 'detalhe', alerta: resultado }); setErroModal('');
  }
  async function salvar(payload) {
    if (ocupado) return;
    setOcupado(true); setErroModal('');
    try {
      const resultado = modal.alerta ? await alertasService.editar(modal.alerta.id_alerta, { ...payload, versao: modal.alerta.versao }) : await alertasService.criar(payload);
      guardarResultado(resultado, 'Rascunho salvo. Envie para revisão quando o conteúdo estiver pronto.');
    } catch (falha) { setErroModal(falha.message || 'Não foi possível salvar o alerta.'); }
    finally { setOcupado(false); }
  }
  async function transicionar(observacao) {
    if (ocupado) return;
    setOcupado(true); setErroModal('');
    try {
      const resultado = await alertasService.transicionar(modal.alerta.id_alerta, { acao: modal.acao, versao: modal.alerta.versao, observacao });
      guardarResultado(resultado, `${ACOES[modal.acao]}.${MODO_DEMO ? ' Alteração realizada apenas na demonstração.' : ''}`);
    } catch (falha) { setErroModal(falha.message || 'Não foi possível concluir a operação. Feche o diálogo e atualize a lista antes de tentar novamente.'); }
    finally { setOcupado(false); }
  }
  const tituloModal = modal?.tipo === 'form' ? (modal.alerta ? 'Editar rascunho' : 'Novo alerta') : modal?.tipo === 'acao' ? CONFIG_ACOES[modal.acao].titulo : 'Detalhes do alerta';

  return <div className="alertas-page">
    <a className="al-skip-link" href="#alertas-conteudo">Pular para os alertas</a>
    <AdminSidebar />
    <main className="al-main" id="alertas-conteudo" tabIndex={-1}>
      <div className="al-topline"><p><Link to="/pg_adm">Home</Link><FiChevronRight aria-hidden="true" /><span>Alertas</span></p><span className="al-region-label"><FiMapPin aria-hidden="true" />Vale do Paraíba</span></div>
      <header className="al-page-header"><div><div className="al-eyebrow">PREVENÇÃO E RESPOSTA</div><h1>Alertas</h1><p>Informações certas, no momento em que mais importam.</p></div><button type="button" className="al-button al-button--primary" onClick={() => abrirModal({ tipo: 'form', alerta: null })} disabled={carregando || Boolean(erro)}><FiPlus aria-hidden="true" />Novo alerta</button></header>
      {MODO_DEMO && <div className="al-demo-note"><FiInfo aria-hidden="true" /><p><strong>Modo demonstração</strong><span>Dados fictícios. As alterações ficam apenas na memória e são perdidas ao recarregar a página. Nenhum alerta é enviado à população.</span></p><span className="al-demo-tag">DEMO</span></div>}
      <section className="al-stats" aria-label="Visão geral de todos os alertas">
        {[
          { nome: 'Alertas ativos', valor: contagens.ativos, descricao: 'Em vigência agora', tom: 'blue', Icone: FiBell },
          { nome: 'Críticos ativos', valor: contagens.criticos, descricao: 'Prioridade máxima de atenção', tom: 'red', Icone: FiAlertTriangle },
          { nome: 'Em revisão', valor: contagens.revisao, descricao: 'Aguardando conferência humana', tom: 'amber', Icone: FiFileText },
          { nome: 'Expiram em 24h', valor: contagens.expiram, descricao: 'Publicados com vigência a terminar', tom: 'teal', Icone: FiClock },
        ].map((cartao) => { const { nome, valor, descricao, tom, Icone } = cartao; return <article key={nome} className={`al-stat al-stat--${tom}`}><div className="al-stat-top"><span>{nome}</span><span className="al-stat-icon"><Icone aria-hidden="true" /></span></div><strong>{!atualizadoEm ? '—' : String(valor).padStart(2, '0')}</strong><p>{descricao}</p></article>; })}
      </section>
      <section className="al-filters" aria-label="Filtrar alertas"><div className="al-search al-field"><label htmlFor={`${filtroId}-busca`}>Buscar alerta</label><div><FiSearch aria-hidden="true" /><input id={`${filtroId}-busca`} type="search" value={busca} onChange={(event) => setBusca(event.target.value)} placeholder="Título, bairro ou fonte…" /></div></div><div className="al-field"><label htmlFor={`${filtroId}-cidade`}>Município</label><select id={`${filtroId}-cidade`} value={municipio} onChange={(event) => setMunicipio(event.target.value)}><option value="">Todos os municípios</option>{municipios.map((cidade) => <option key={cidade}>{cidade}</option>)}</select></div><div className="al-field"><label htmlFor={`${filtroId}-severidade`}>Severidade</label><select id={`${filtroId}-severidade`} value={severidade} onChange={(event) => setSeveridade(event.target.value)}><option value="">Todas as severidades</option>{Object.entries(SEVERIDADES).map(([valor, nome]) => <option key={valor} value={valor}>{nome}</option>)}</select></div><div className="al-field"><label htmlFor={`${filtroId}-situacao`}>Situação</label><select id={`${filtroId}-situacao`} value={situacao} onChange={(event) => setSituacao(event.target.value)}><option value="">Todas as situações</option>{Object.entries(STATUS_LABELS).filter(([valor]) => valor !== 'publicado').map(([valor, nome]) => <option key={valor} value={valor}>{nome}</option>)}</select></div></section>
      <div className="al-notice-slot" aria-live="polite" aria-atomic="true">{mensagem && <div className="al-success"><FiCheckCircle aria-hidden="true" /><p>{mensagem}</p><button type="button" aria-label="Dispensar mensagem" onClick={() => setMensagem('')}><FiX aria-hidden="true" /></button></div>}</div>
      <div className="al-workspace">
        <section className="al-list-panel" aria-labelledby="al-list-title" aria-busy={carregando}>
          <div className="al-panel-heading"><div><h2 id="al-list-title">Central de alertas <span>{!atualizadoEm ? '—' : filtrados.length}</span></h2><p>{temFiltros ? 'Resultados dos filtros selecionados' : 'Acompanhe a situação de cada comunicação'}</p></div><button type="button" className="al-refresh" onClick={carregar} disabled={carregando || ocupado}><FiRefreshCw className={carregando ? 'al-spin' : ''} aria-hidden="true" /><span>Atualizar</span></button></div>
          {temFiltros && <div className="al-filter-summary"><span>Filtros aplicados à lista</span><button type="button" onClick={limparFiltros}>Limpar filtros <FiX aria-hidden="true" /></button></div>}
          {erro ? <div className="al-empty" role="alert"><FiAlertTriangle aria-hidden="true" /><h3>Não foi possível atualizar a central</h3><p>{erro}</p><button type="button" className="al-button al-button--primary" onClick={carregar}>Tentar novamente</button></div>
            : carregando ? <div className="al-empty" role="status"><FiRefreshCw className="al-spin" aria-hidden="true" /><h3>Carregando alertas</h3><p>Buscando regiões e informações de vigência…</p></div>
              : !filtrados.length ? <div className="al-empty"><FiBell aria-hidden="true" /><h3>{temFiltros ? 'Nenhum alerta encontrado' : 'Sua central está pronta'}</h3><p>{temFiltros ? 'Ajuste os filtros ou a busca para visualizar outros alertas.' : 'Crie o primeiro rascunho e revise a informação antes de publicar.'}</p><button type="button" className="al-button al-button--secondary" onClick={temFiltros ? limparFiltros : () => abrirModal({ tipo: 'form', alerta: null })}>{temFiltros ? 'Limpar filtros' : 'Criar primeiro alerta'}</button></div>
                : <div className="al-alert-list">{filtrados.map((alerta) => {
                  const Icone = ICONES_TIPO[alerta.tipo] || FiBell;
                  return <article className={`al-alert-card al-alert-card--${alerta.severidade}`} key={alerta.id_alerta}>
                    <div className="al-alert-card-main"><span className="al-event-icon"><Icone aria-hidden="true" /></span><div className="al-alert-content"><div className="al-card-tags"><Etiqueta valor={alerta.severidade} tipo="severidade" /><Etiqueta valor={statusEfetivo(alerta, agora)} /><span className="al-type-label">{TIPOS[alerta.tipo]}</span></div><h3>{alerta.titulo}</h3><p className="al-location"><FiMapPin aria-hidden="true" />{localRegiao(alerta.regiao)}</p><p className="al-excerpt">{alerta.descricao}</p></div></div>
                    <dl className="al-card-meta"><div><dt><FiClock aria-hidden="true" />Vigência · São Paulo</dt><dd>{formatarData(alerta.inicioEm)}<span>até {formatarData(alerta.expiraEm)}</span></dd></div><div><dt><FiShield aria-hidden="true" />Fonte da informação</dt><dd><Fonte alerta={alerta} /></dd></div></dl>
                    <div className="al-card-footer"><span>Atualizado em {formatarData(alerta.updatedAt)}</span><button type="button" onClick={() => abrirModal({ tipo: 'detalhe', alerta })} aria-label={`Ver detalhes de ${alerta.titulo}`}>Ver detalhes<FiArrowUpRight aria-hidden="true" /></button></div>
                  </article>;
                })}</div>}
          <div className="al-list-footnote"><span>{atualizadoEm ? `Última sincronização: ${formatarData(atualizadoEm)}` : 'Aguardando carregamento'}</span><span>Vigência recalculada a cada 30 s</span></div>
        </section>
        <aside className="al-context" aria-label="Apoio à gestão de alertas">
          <section className="al-context-card al-context-card--navy"><span className="al-context-icon"><FiShield aria-hidden="true" /></span><h2>Informação confiável salva vidas.</h2><p>Antes de publicar, valide a fonte e deixe claro quem precisa agir, onde e até quando.</p><div className="al-context-divider" /><span className="al-small-heading">FLUXO DE PUBLICAÇÃO</span><ol className="al-workflow"><li><span>1</span><div><strong>Preparar</strong><p>Região, situação e orientações.</p></div></li><li><span>2</span><div><strong>Revisar</strong><p>Conferência humana da informação.</p></div></li><li><span>3</span><div><strong>Publicar</strong><p>Vigência definida e histórico registrado.</p></div></li></ol></section>
          <section className="al-context-card"><div className="al-context-heading"><h2>Por município</h2><FiMapPin aria-hidden="true" /></div><p className="al-muted">Alertas ativos em toda a central</p><ul className="al-city-list">{!atualizadoEm ? <li>Aguardando dados…</li> : cobertura.length ? cobertura.map(({ cidade, total }) => <li key={cidade}><span>{cidade}</span><strong>{total}</strong></li>) : <li>Nenhuma região cadastrada.</li>}</ul><Link className="al-map-link" to="/mapa">Abrir mapa do sistema<FiArrowUpRight aria-hidden="true" /></Link></section>
          <div className="al-channel-note"><FiInfo aria-hidden="true" /><p><strong>Publicação no sistema</strong>O envio por WhatsApp depende de integração adicional e não é realizado por esta tela.</p></div>
        </aside>
      </div>
      <footer className="al-page-footer"><span>S.O.S. Vale · Gestão de desastres naturais</span><span>Prevenção · Informação · Cuidado</span></footer>
    </main>
    <dialog ref={dialogRef} className="al-dialog" aria-labelledby={modalTitulo} aria-busy={ocupado} onCancel={(event) => { event.preventDefault(); fecharModal(); }} onClose={() => { if (!ocupado) setModal(null); }}>
      {modal && <><div className="al-modal-heading"><div><p className="al-eyebrow">CENTRAL DE ALERTAS</p><h2 id={modalTitulo}>{tituloModal}</h2></div><button type="button" className="al-close" onClick={fecharModal} disabled={ocupado} aria-label="Fechar diálogo"><FiX aria-hidden="true" /></button></div>
        <div className="al-modal-body">{modal.tipo === 'form' ? <FormularioAlerta key={`form-${modal.alerta?.id_alerta || 'novo'}`} alerta={modal.alerta} regioes={regioes} ocupado={ocupado} erro={erroModal} onSalvar={salvar} onVoltar={fecharModal} />
          : modal.tipo === 'acao' ? <ConfirmacaoAcao key={`${modal.acao}-${modal.alerta.id_alerta}`} alerta={modal.alerta} acao={modal.acao} agora={agora} ocupado={ocupado} erro={erroModal} onConfirmar={transicionar} onVoltar={() => abrirModal({ tipo: 'detalhe', alerta: modal.alerta })} />
            : <DetalhesAlerta alerta={modal.alerta} agora={agora} onEditar={() => abrirModal({ tipo: 'form', alerta: modal.alerta })} onAcao={(acao) => abrirModal({ tipo: 'acao', alerta: modal.alerta, acao })} />}</div></>}
    </dialog>
  </div>;
}
