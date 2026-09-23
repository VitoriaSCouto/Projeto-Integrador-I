// --------- Imports -----------
import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  FaMapMarkerAlt, FaClock, FaUsers, FaCheckCircle, FaUserShield, FaPhoneAlt
} from 'react-icons/fa';
import { GoAlertFill } from 'react-icons/go';
import SidebarAdm from '../../../components/SidebarAdm';
import { apiAdmin, formatarDataHora, formatarTempo } from '../../../services/api';
import { STATUS_ALERTA, STATUS_NOTIFICACAO } from '../constantes';
import '../../pg_adm/style.css';
import '../../Solicitacoes-Abrigo/Detalhes-solicitacao/DetalhesSolicitacao.css';
import '../alertas.css';

const SITUACAO_GRUPO = {
  pendente:  'na fila de envio',
  enviando:  'enviando...',
  enviada:   'aviso publicado no grupo ✓',
  falha:     'falhou ao enviar',
  cancelada: 'envio cancelado',
}

// Soma as notificações do resumo que batem com o filtro
const somar = (resumo, filtro) => resumo
  .filter(n => Object.entries(filtro).every(([campo, valor]) =>
    Array.isArray(valor) ? valor.includes(n[campo]) : n[campo] === valor))
  .reduce((total, n) => total + n.total, 0)

function DetalhesAlerta() {

  const { id } = useParams();
  const navigate = useNavigate();

  // ─── ESTADOS ────────────────────────────────────────────────
  const [alerta, setAlerta] = useState(null)
  const [carregando, setCarregando] = useState(true)
  const [erro, setErro] = useState('')
  const [mensagem, setMensagem] = useState('')

  // Foto exibida em destaque (a do relato selecionado)
  const [fotoSelecionada, setFotoSelecionada] = useState(null)

  // null | 'confirmar' | 'cancelar' | 'encerrar' — evita ações acidentais
  const [painelDecisao, setPainelDecisao] = useState(null)
  const [motivo, setMotivo] = useState('')
  const [enviando, setEnviando] = useState(false)

  // ─── BUSCA DOS DADOS ────────────────────────────────────────
  const buscarAlerta = useCallback(async () => {
    try {
      const dados = await apiAdmin(`/alertas/listar/${id}`)
      setAlerta(dados)
      setFotoSelecionada(atual => atual ?? dados.relatos.find(r => r.fotoRelato)?.fotoRelato ?? null)
      setErro('')
    } catch (e) {
      setErro(e.message)
    } finally {
      setCarregando(false)
    }
  }, [id])

  useEffect(() => {
    buscarAlerta()
  }, [buscarAlerta])

  // ─── AÇÕES ──────────────────────────────────────────────────
  // Executa a ação, mostra a mensagem da API e recarrega os dados.
  // Só mostra sucesso se a API respondeu OK.
  const executar = async (caminho, corpo) => {
    setEnviando(true)
    setErro('')
    setMensagem('')
    try {
      const dados = await apiAdmin(caminho, { metodo: 'PATCH', corpo })
      setMensagem(dados.mensagem)
      setPainelDecisao(null)
      setMotivo('')
      await buscarAlerta()
    } catch (e) {
      setErro(e.message)
    } finally {
      setEnviando(false)
    }
  }

  const handleCancelar = () => {
    if (!motivo.trim()) {
      setErro('Informe o motivo do cancelamento.')
      return
    }
    executar(`/alertas/cancelar/${id}`, { motivo })
  }

  const handleExcluir = async () => {
    const aviso = alerta.status === 'ativo'
      ? 'Este alerta está ATIVO. Excluir não avisa os moradores — para corrigir um alerta falso, use "Cancelar alerta".\n\nExcluir mesmo assim?'
      : 'Tem certeza que deseja excluir este alerta, os relatos e as fotos?'

    if (!confirm(aviso)) return

    try {
      await apiAdmin(`/alertas/excluir/${id}`, { metodo: 'DELETE' })
      navigate('/alertas')
    } catch (e) {
      setErro(e.message)
    }
  }

  // ─── TELA DE LOADING / ERRO ─────────────────────────────────
  if (carregando || !alerta) {
    return (
      <div className="dashboard">
        <SidebarAdm ativo="alertas" />
        <main className="main">
          <p style={{ padding: '40px', color: erro ? '#ef4444' : '#64748b' }}>
            {erro || 'Carregando alerta...'}
          </p>
        </main>
      </div>
    )
  }

  // ─── DERIVAÇÕES ─────────────────────────────────────────────
  const { resumo, falhas } = alerta.notificacoes
  const inscritosEnviadas = somar(resumo, { evento: 'disparo', tipoDestino: 'inscrito', status: 'enviada' })
  const inscritosFila     = somar(resumo, { evento: 'disparo', tipoDestino: 'inscrito', status: ['pendente', 'enviando'] })
  const inscritosFalha    = somar(resumo, { evento: 'disparo', tipoDestino: 'inscrito', status: 'falha' })
  const grupo             = resumo.find(n => n.evento === 'disparo' && n.tipoDestino === 'grupo')
  const correcoes         = somar(resumo, { evento: 'cancelamento' })
  const correcoesEnviadas = somar(resumo, { evento: 'cancelamento', status: 'enviada' })
  const totalFalhas       = somar(resumo, { status: 'falha' })

  const faltam = Math.max(0, alerta.confirmacoesNecessarias - alerta.totalRelatos)

  // ─── TELA PRINCIPAL ─────────────────────────────────────────
  return (
    <div className="dashboard">
      <SidebarAdm ativo="alertas" />

      <main className="main">
        <header className="top">
          <div>
            <p className="modulo-breadcrumb"><a href="/alertas">Alertas</a> &gt; <span>#{alerta.id_alerta}</span></p>
            <h1 className="modulo-titulo">Alerta #{alerta.id_alerta} — {alerta.tipoLabel}</h1>
            <p className="subtitle">{alerta.bairro} — {alerta.cidade}/{alerta.estado}</p>
          </div>
          <span className={`badge ${alerta.status}`} style={{ fontSize: '14px', padding: '6px 16px' }}>
            {STATUS_ALERTA[alerta.status]}
          </span>
        </header>

        <div className="cadastro-form-container">

          {/* ── COLUNA ESQUERDA ── */}
          <div className="form-column-left">

            <h3 className="secao-titulo">Dados da ocorrência</h3>

            <div className="info-grade">
              <div className="form-group">
                <label><GoAlertFill /> Tipo</label>
                <p>{alerta.tipoLabel}</p>
              </div>
              <div className="form-group">
                <label><GoAlertFill /> Gravidade</label>
                <p><span className={`badge ${alerta.gravidade}`}>{alerta.gravidadeLabel}</span></p>
              </div>
              <div className="form-group">
                <label><FaMapMarkerAlt /> Local</label>
                <p>{alerta.bairro} — {alerta.cidade}/{alerta.estado}</p>
              </div>
              <div className="form-group">
                <label><FaUsers /> Relatos</label>
                <p>
                  {alerta.totalRelatos} de {alerta.confirmacoesNecessarias} necessários
                  {alerta.status === 'em_verificacao' && faltam > 0 && ` (faltam ${faltam})`}
                </p>
              </div>
              <div className="form-group">
                <label><FaClock /> Primeiro relato</label>
                <p>{formatarDataHora(alerta.createdAt)}</p>
              </div>
              <div className="form-group">
                <label><FaCheckCircle /> Disparado em</label>
                <p>
                  {alerta.disparadoEm ? formatarDataHora(alerta.disparadoEm) : 'Ainda não disparado'}
                  {alerta.disparadoPorAdmin && ' (confirmado pela equipe)'}
                </p>
              </div>
              {alerta.analisadoPor && (
                <div className="form-group">
                  <label><FaUserShield /> Última ação da equipe</label>
                  <p>{alerta.analisadoPor.nome}{alerta.finalizadoEm && ` — ${formatarDataHora(alerta.finalizadoEm)}`}</p>
                </div>
              )}
              {alerta.motivoCancelamento && (
                <div className="form-group">
                  <label style={{ color: '#ef4444' }}>Motivo do cancelamento</label>
                  <p style={{ color: '#ef4444' }}>{alerta.motivoCancelamento}</p>
                </div>
              )}
            </div>

            {/* Relatos dos moradores */}
            <h3 className="secao-titulo">Relatos dos moradores ({alerta.relatos.length})</h3>

            {alerta.relatos.map(relato => (
              <div className="relato-item" key={relato.id_relato}>
                {relato.fotoRelato ? (
                  <img
                    src={relato.fotoRelato}
                    alt="Foto do relato"
                    className={`relato-foto ${fotoSelecionada === relato.fotoRelato ? 'selecionada' : ''}`}
                    onClick={() => setFotoSelecionada(relato.fotoRelato)}
                  />
                ) : (
                  <div className="relato-foto">sem foto</div>
                )}

                <div className="linha-info">
                  <p className="linha-titulo" style={{ fontSize: '14px' }}>
                    {relato.inscrito
                      ? <a href={`/inscritos/${relato.inscrito.id_inscrito}`}>{relato.inscrito.nome}</a>
                      : 'Inscrito excluído'}
                  </p>
                  <p className="linha-subtitulo">
                    {relato.inscrito?.telefone && <span><FaPhoneAlt /> {relato.inscrito.telefone}</span>}
                    <span><FaClock /> {formatarTempo(relato.createdAt)}</span>
                  </p>
                </div>

                <span className={`badge ${relato.gravidade}`}>{relato.gravidadeLabel}</span>
              </div>
            ))}

            {/* Situação do envio pelo WhatsApp */}
            <h3 className="secao-titulo">Notificações pelo WhatsApp</h3>

            {!alerta.disparadoEm ? (
              <p className="aviso">
                Nenhuma notificação enviada ainda. O alerta será enviado quando tiver {alerta.confirmacoesNecessarias} relatos ou se a equipe confirmar.
              </p>
            ) : (
              <>
                <div className="notificacoes-resumo">
                  <div className="notificacao-card"><strong>{inscritosEnviadas}</strong><span>moradores avisados</span></div>
                  <div className="notificacao-card"><strong>{inscritosFila}</strong><span>{STATUS_NOTIFICACAO.pendente.toLowerCase()}</span></div>
                  <div className="notificacao-card"><strong>{inscritosFalha}</strong><span>{STATUS_NOTIFICACAO.falha.toLowerCase()}</span></div>
                </div>

                <p className="aviso">
                  Grupo da cidade: {grupo
                    ? SITUACAO_GRUPO[grupo.status] ?? grupo.status
                    : 'nenhum grupo vinculado à cidade — vincule em Regiões para avisar o grupo.'}
                </p>

                {correcoes > 0 && (
                  <p className="aviso alerta">
                    Correção de cancelamento: {correcoesEnviadas} de {correcoes} enviadas.
                  </p>
                )}

                {falhas.length > 0 && (
                  <div style={{ fontSize: '13px', color: '#64748b', marginBottom: '12px' }}>
                    {falhas.map(f => (
                      <p key={f.id_notificacao}>✗ {f.destino.split('@')[0]} — {f.erro} ({f.tentativas} tentativas)</p>
                    ))}
                  </div>
                )}

                {alerta.status === 'ativo' && totalFalhas > 0 && (
                  <button
                    className="botao-secundario"
                    disabled={enviando}
                    onClick={() => executar(`/alertas/reenviar-falhas/${id}`)}
                  >
                    Tentar reenviar as que falharam
                  </button>
                )}
              </>
            )}
          </div>

          {/* ── COLUNA DIREITA ── */}
          <div className="form-column-right">

            <h3 className="secao-titulo">Foto do relato</h3>

            <div className="upload-container">
              {fotoSelecionada ? (
                <a href={fotoSelecionada} target="_blank" rel="noreferrer">
                  <img src={fotoSelecionada} alt="Foto da ocorrência" className="foto-principal" />
                </a>
              ) : (
                <p style={{ color: '#94a3b8', fontSize: '14px' }}>Nenhuma foto disponível</p>
              )}
            </div>

            {mensagem && <p className="mensagem-sucesso" style={{ marginBottom: '12px' }}>{mensagem}</p>}
            {erro && <p className="mensagem-erro" style={{ marginBottom: '12px' }}>{erro}</p>}

            {/* ── PAINEL DE DECISÃO ── */}
            <div className="form-actions">

              {alerta.status === 'em_verificacao' && painelDecisao === null && (
                <>
                  <p className="aviso alerta">
                    Aguardando confirmação: {alerta.totalRelatos}/{alerta.confirmacoesNecessarias} relatos.
                    Se a equipe já confirmou a ocorrência, é possível disparar agora.
                  </p>
                  <button className="btn-action salvar" onClick={() => setPainelDecisao('confirmar')}>
                    Confirmar e disparar agora
                  </button>
                  <button className="btn-action excluir" onClick={() => setPainelDecisao('cancelar')}>
                    Cancelar alerta
                  </button>
                </>
              )}

              {alerta.status === 'ativo' && painelDecisao === null && (
                <>
                  <button className="btn-action salvar" onClick={() => setPainelDecisao('encerrar')}>
                    Encerrar ocorrência (resolvida)
                  </button>
                  <button className="btn-action excluir" onClick={() => setPainelDecisao('cancelar')}>
                    Cancelar alerta (enviar correção)
                  </button>
                </>
              )}

              {painelDecisao === 'confirmar' && (
                <div className="painel-decisao">
                  <p style={{ fontSize: '14px', color: '#1e293b' }}>
                    O alerta será enviado agora para todos os inscritos que moram ou acompanham
                    o bairro {alerta.bairro}, e para o grupo de {alerta.cidade} (se houver).
                  </p>
                  <button className="btn-action salvar" disabled={enviando} onClick={() => executar(`/alertas/confirmar/${id}`)}>
                    {enviando ? 'Disparando...' : 'Confirmar disparo'}
                  </button>
                  <button className="btn-action cancelar" onClick={() => setPainelDecisao(null)}>Voltar</button>
                </div>
              )}

              {painelDecisao === 'encerrar' && (
                <div className="painel-decisao">
                  <p style={{ fontSize: '14px', color: '#1e293b' }}>
                    Use quando a ocorrência foi resolvida. Novos relatos do mesmo tipo neste bairro
                    abrirão um novo alerta. Notificações que ainda não saíram serão canceladas.
                  </p>
                  <button className="btn-action salvar" disabled={enviando} onClick={() => executar(`/alertas/encerrar/${id}`)}>
                    {enviando ? 'Encerrando...' : 'Confirmar encerramento'}
                  </button>
                  <button className="btn-action cancelar" onClick={() => setPainelDecisao(null)}>Voltar</button>
                </div>
              )}

              {painelDecisao === 'cancelar' && (
                <div className="painel-decisao">
                  <label style={{ fontSize: '14px', fontWeight: '600', color: '#1e293b' }}>
                    Motivo do cancelamento (obrigatório)
                  </label>
                  {alerta.status === 'ativo' && (
                    <p className="aviso alerta">
                      Este alerta já foi disparado. Quem recebeu vai receber uma mensagem de correção com este motivo.
                    </p>
                  )}
                  <textarea
                    value={motivo}
                    onChange={(e) => setMotivo(e.target.value)}
                    placeholder="Ex: Relato falso — a equipe esteve no local e não há alagamento."
                    rows={4}
                    maxLength={300}
                  />
                  <button className="btn-action excluir" disabled={enviando} onClick={handleCancelar}>
                    {enviando ? 'Cancelando...' : 'Confirmar cancelamento'}
                  </button>
                  <button className="btn-action cancelar" onClick={() => setPainelDecisao(null)}>Voltar</button>
                </div>
              )}

              {painelDecisao === null && (
                <button className="btn-action cancelar" onClick={handleExcluir}>
                  Excluir alerta
                </button>
              )}
            </div>
          </div>
        </div>

        <footer style={{ marginTop: 'auto', paddingTop: '20px', display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: '#94a3b8' }}>
          <p>© 2026 S.O.S Vale. Todos os direitos reservados.</p>
          <p>Versão 1.0.0</p>
        </footer>
      </main>
    </div>
  )
}

export default DetalhesAlerta;
