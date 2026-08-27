// ─── Imports ──────────────────────────────────────────────────────────────────
import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  FaHome, FaBoxOpen, FaUser, FaDonate, FaMap,
  FaHandHoldingHeart, FaPhoneAlt, FaBuilding
} from 'react-icons/fa';
import { FaGear } from 'react-icons/fa6';
import { GoAlertFill } from 'react-icons/go';
import '../../pg_adm/style.css';

// ─── Badges e labels ──────────────────────────────────────────────────────────
const badgeStatus = {
  aberto:       { label: 'Aberto',       bg: '#dbeafe', cor: '#1e40af' },
  em_andamento: { label: 'Em andamento', bg: '#fef3c7', cor: '#92400e' },
  concluido:    { label: 'Concluído',    bg: '#d1fae5', cor: '#065f46' },
  cancelado:    { label: 'Cancelado',    bg: '#fee2e2', cor: '#991b1b' },
}

const badgeUrgencia = {
  baixa:   { label: 'Baixa',   bg: '#f0fdf4', cor: '#166534' },
  media:   { label: 'Média',   bg: '#fefce8', cor: '#854d0e' },
  alta:    { label: 'Alta',    bg: '#fff7ed', cor: '#9a3412' },
  critica: { label: 'Crítica', bg: '#fef2f2', cor: '#7f1d1d' },
}

const categoriaLabel = {
  doacao:         'Doação',
  medicamento:    'Medicamento',
  voluntariado:   'Voluntariado',
  infraestrutura: 'Infraestrutura',
  outro:          'Outro',
}

// ─── Sidebar ──────────────────────────────────────────────────────────────────
const Sidebar = () => (
  <aside className="sidebar">
    <div className="top-icons">
      <img src="../../src/assets/logo.png" width="70px" />
      <p>S.O.S. Vale</p>
    </div>
    <ul>
      <a href="/pg_adm"><li><FaHome className="icon" /> Home</li></a>
      <a href="/abrigos"><li className="active"><FaBoxOpen className="icon" /> Abrigos</li></a>
      <a href="/vitimas"><li><FaUser className="icon" /> Vítimas</li></a>
      <li><FaDonate className="icon" /> Doações</li>
      <a href="/mapa"><li><FaMap className="icon" /> Mapa</li></a>
      <li><GoAlertFill className="icon" /> Ocorrências</li>
      <li><FaGear className="icon" /> Configurações</li>
    </ul>
  </aside>
)

// ─── Componente principal ─────────────────────────────────────────────────────
function DetalhesSolicitacaoAjuda() {

  const { id } = useParams()   // id da solicitação
  const navigate = useNavigate()

  const [dados, setDados]                 = useState(null)
  const [carregando, setCarregando]       = useState(true)
  const [salvando, setSalvando]           = useState(false)
  const [erro, setErro]                   = useState(null)

  // ─── Modal de fechar/cancelar ────────────────────────────────────────────────
  // tipo: 'concluir' | 'cancelar' | null
  const [modal, setModal]                 = useState(null)
  const [observacao, setObservacao]       = useState('')
  // voluntario selecionado ao concluir (id ou 'anonimo' ou '')
  const [voluntarioId, setVoluntarioId]   = useState('')
  const [voluntarios, setVoluntarios]     = useState([])

  // ─── Busca ───────────────────────────────────────────────────────────────────
  useEffect(() => {
    const buscar = async () => {
      try {
        // Rota do backend é /listar/:id, não /:id
        const res = await fetch(`http://localhost:3000/api/solicitacoes-ajuda/listar/${id}`)
        const d = await res.json()
        setDados(d.solicitacao ?? d)

        // Busca lista de voluntários para o select de "quem atendeu"
        const resVol = await fetch('http://localhost:3000/api/voluntarios/listar')
        const dVol = await resVol.json()
        setVoluntarios(dVol.voluntarios ?? [])
      } catch (err) {
        console.error('Erro ao buscar dados:', err)
        setErro('Não foi possível carregar a solicitação.')
      } finally {
        setCarregando(false)
      }
    }
    buscar()
  }, [id])

  // ─── Atualizar status ────────────────────────────────────────────────────────
  const handleAtualizarStatus = async (novoStatus) => {
    setSalvando(true)
    setErro(null)
    try {
      const body = {
        status: novoStatus,
        observacaoFechamento: observacao.trim() || null,
        // Só envia voluntarioId se for concluir e o ADM tiver selecionado alguém
        ...(novoStatus === 'concluido' && voluntarioId && voluntarioId !== 'anonimo'
          ? { voluntarioId: Number(voluntarioId) }
          : {}),
      }

      // Rota do backend é PUT /atualizar/:id, não PATCH /:id
      const res = await fetch(`http://localhost:3000/api/solicitacoes-ajuda/atualizar/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })

      if (!res.ok) {
        const d = await res.json()
        throw new Error(d.mensagem ?? 'Erro ao atualizar.')
      }

      const atualizado = await res.json()
      setDados(atualizado.solicitacao ?? atualizado)
      setModal(null)
      setObservacao('')
      setVoluntarioId('')
    } catch (err) {
      setErro(err.message)
    } finally {
      setSalvando(false)
    }
  }

  // ─── Excluir ─────────────────────────────────────────────────────────────────
  const handleExcluir = async () => {
    if (!confirm('Tem certeza que deseja apagar esta solicitação? Esta ação não pode ser desfeita.')) return
    try {
      // Rota do backend é DELETE /excluir/:id, não DELETE /:id
      await fetch(`http://localhost:3000/api/solicitacoes-ajuda/excluir/${id}`, { method: 'DELETE' })
      navigate(`/abrigos/${dados.abrigoId}/solicitacoes-ajuda`)
    } catch (err) {
      console.error('Erro ao excluir:', err)
    }
  }

  // ─── Loading / erro ───────────────────────────────────────────────────────────
  if (carregando) {
    return (
      <div className="dashboard">
        <Sidebar />
        <main className="main">
          <p style={{ padding: '40px', color: '#64748b' }}>Carregando solicitação...</p>
        </main>
      </div>
    )
  }

  if (!dados) {
    return (
      <div className="dashboard">
        <Sidebar />
        <main className="main">
          <p style={{ padding: '40px', color: '#ef4444' }}>{erro ?? 'Solicitação não encontrada.'}</p>
        </main>
      </div>
    )
  }

  const badge    = badgeStatus[dados.status]    ?? { label: dados.status,    bg: '#f1f5f9', cor: '#64748b' }
  const urgBadge = badgeUrgencia[dados.urgencia] ?? { label: dados.urgencia, bg: '#f1f5f9', cor: '#64748b' }
  const podeMudar = dados.status === 'aberto' || dados.status === 'em_andamento'

  // ─── Render ───────────────────────────────────────────────────────────────────
  return (
    <div className="dashboard">
      <Sidebar />

      <main className="main">

        {/* Header */}
        <header className="top">
          <div>
            <p style={{ fontSize: '14px', color: '#64748b', margin: 0 }}>
              Abrigos &gt;{' '}
              <span
                style={{ cursor: 'pointer', textDecoration: 'underline' }}
                onClick={() => navigate(`/abrigos/${dados.abrigoId}`)}
              >
                {dados.abrigo?.nome ?? 'Abrigo'}
              </span>
              {' '}&gt;{' '}
              <span
                style={{ cursor: 'pointer', textDecoration: 'underline' }}
                onClick={() => navigate(`/abrigos/${dados.abrigoId}/solicitacoes-ajuda`)}
              >
                Solicitações
              </span>
              {' '}&gt; Detalhes
            </p>
            <h1 style={{ fontSize: '26px', fontWeight: '700', color: '#0f172a', marginTop: '4px' }}>
              {dados.titulo}
            </h1>
          </div>
        </header>

        {/* Grid principal */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: '24px', alignItems: 'start' }}>

          {/* Coluna esquerda — conteúdo */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>

            {/* Card principal */}
            <div className="panel" style={{ background: '#fff', borderRadius: '12px', padding: '28px', boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>

              {/* Badges */}
              <div style={{ display: 'flex', gap: '8px', marginBottom: '20px', flexWrap: 'wrap' }}>
                <span style={{ background: badge.bg, color: badge.cor, padding: '5px 14px', borderRadius: '20px', fontSize: '13px', fontWeight: '600' }}>
                  {badge.label}
                </span>
                <span style={{ background: urgBadge.bg, color: urgBadge.cor, padding: '5px 14px', borderRadius: '20px', fontSize: '13px', fontWeight: '600' }}>
                  Urgência: {urgBadge.label}
                </span>
                <span style={{ background: '#f1f5f9', color: '#475569', padding: '5px 14px', borderRadius: '20px', fontSize: '13px', fontWeight: '600' }}>
                  {categoriaLabel[dados.categoria] ?? dados.categoria}
                </span>
              </div>

              {/* Descrição */}
              <h3 style={{ fontSize: '15px', fontWeight: '700', color: '#1e293b', marginBottom: '8px' }}>Descrição</h3>
              <p style={{ fontSize: '14px', color: '#475569', lineHeight: '1.7', whiteSpace: 'pre-wrap' }}>
                {dados.descricao}
              </p>

              {/* Observação de fechamento, se houver */}
              {dados.observacaoFechamento && (
                <div style={{ marginTop: '20px', padding: '14px', background: '#f8fafc', borderRadius: '8px', borderLeft: '3px solid #94a3b8' }}>
                  <p style={{ fontSize: '12px', fontWeight: '700', color: '#94a3b8', marginBottom: '4px' }}>OBSERVAÇÃO DO FECHAMENTO</p>
                  <p style={{ fontSize: '14px', color: '#475569' }}>{dados.observacaoFechamento}</p>
                </div>
              )}

              {/* Voluntário que atendeu, se houver */}
              {dados.voluntario && (
                <div style={{ marginTop: '16px', padding: '12px 16px', background: '#f0fdf4', borderRadius: '8px', border: '1px solid #bbf7d0' }}>
                  <p style={{ fontSize: '12px', fontWeight: '700', color: '#166534', marginBottom: '4px' }}>ATENDIDO POR</p>
                  <p style={{ fontSize: '14px', color: '#166534', fontWeight: '600' }}>{dados.voluntario.nome}</p>
                  {dados.voluntario.email && (
                    <p style={{ fontSize: '13px', color: '#4ade80' }}>{dados.voluntario.email}</p>
                  )}
                </div>
              )}
            </div>

            {/* Card do abrigo — contato */}
            {dados.abrigo && (
              <div className="panel" style={{ background: '#fff', borderRadius: '12px', padding: '24px', boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
                <h3 style={{ fontSize: '15px', fontWeight: '700', color: '#1e293b', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <FaBuilding style={{ color: '#64748b' }} /> Abrigo vinculado
                </h3>
                <p style={{ fontWeight: '600', color: '#0f172a', fontSize: '15px', margin: '0 0 4px' }}>{dados.abrigo.nome}</p>
                <p style={{ fontSize: '13px', color: '#64748b', margin: '0 0 8px' }}>
                  {dados.abrigo.endereco}{dados.abrigo.bairro ? `, ${dados.abrigo.bairro}` : ''} — {dados.abrigo.cidade}/{dados.abrigo.estado}
                </p>
                {dados.abrigo.telefone && (
                  <p style={{ fontSize: '13px', color: '#2563eb', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <FaPhoneAlt /> {dados.abrigo.telefone}
                  </p>
                )}
                {dados.abrigo.responsavel && (
                  <p style={{ fontSize: '13px', color: '#64748b', marginTop: '4px' }}>
                    Responsável: <strong>{dados.abrigo.responsavel}</strong>
                  </p>
                )}
              </div>
            )}
          </div>

          {/* Coluna direita — ações e meta */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>

            {/* Card de ações */}
            <div className="panel" style={{ background: '#fff', borderRadius: '12px', padding: '20px', boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
              <h3 style={{ fontSize: '15px', fontWeight: '700', color: '#1e293b', marginBottom: '16px' }}>Ações</h3>

              {podeMudar && (
                <>
                  {/* Botão Em andamento — só aparece se ainda estiver aberto */}
                  {dados.status === 'aberto' && (
                    <button
                      onClick={() => handleAtualizarStatus('em_andamento')}
                      disabled={salvando}
                      style={{
                        width: '100%', marginBottom: '10px',
                        padding: '10px', borderRadius: '8px', border: 'none',
                        background: '#fef3c7', color: '#92400e',
                        fontWeight: '700', fontSize: '14px', cursor: 'pointer'
                      }}
                    >
                      Marcar como Em andamento
                    </button>
                  )}

                  {/* Botão Concluir */}
                  <button
                    onClick={() => setModal('concluir')}
                    style={{
                      width: '100%', marginBottom: '10px',
                      padding: '10px', borderRadius: '8px', border: 'none',
                      background: '#d1fae5', color: '#065f46',
                      fontWeight: '700', fontSize: '14px', cursor: 'pointer'
                    }}
                  >
                    Concluir solicitação
                  </button>

                  {/* Botão Cancelar */}
                  <button
                    onClick={() => setModal('cancelar')}
                    style={{
                      width: '100%', marginBottom: '10px',
                      padding: '10px', borderRadius: '8px', border: 'none',
                      background: '#fee2e2', color: '#991b1b',
                      fontWeight: '700', fontSize: '14px', cursor: 'pointer'
                    }}
                  >
                    Cancelar solicitação
                  </button>
                </>
              )}

              {/* Botão Apagar — sempre visível */}
              <button
                onClick={handleExcluir}
                style={{
                  width: '100%',
                  padding: '10px', borderRadius: '8px',
                  border: '1px solid #fca5a5',
                  background: 'transparent', color: '#ef4444',
                  fontWeight: '600', fontSize: '13px', cursor: 'pointer'
                }}
              >
                Apagar registro
              </button>

              {erro && <p style={{ fontSize: '13px', color: '#ef4444', marginTop: '10px' }}>{erro}</p>}
            </div>

            {/* Card de metadados */}
            <div className="panel" style={{ background: '#fff', borderRadius: '12px', padding: '20px', boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
              <h3 style={{ fontSize: '15px', fontWeight: '700', color: '#1e293b', marginBottom: '16px' }}>Informações</h3>

              {[
                ['Criado por',   dados.criadoPor?.nome ?? '—'],
                ['Criado em',    dados.createdAt ? new Date(dados.createdAt).toLocaleString('pt-BR') : '—'],
                ['Atualizado',   dados.updatedAt ? new Date(dados.updatedAt).toLocaleString('pt-BR') : '—'],
                ['Interesses',   `${dados.interesses?.length ?? 0} voluntário(s)`],
              ].map(([chave, valor]) => (
                <div key={chave} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px', fontSize: '13px' }}>
                  <span style={{ color: '#94a3b8', fontWeight: '600' }}>{chave}</span>
                  <span style={{ color: '#0f172a', fontWeight: '500', textAlign: 'right', maxWidth: '180px' }}>{valor}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ─── Modal de confirmação ─────────────────────────────────────────────── */}
        {modal && (
          <div style={{
            position: 'fixed', inset: 0,
            background: 'rgba(15,23,42,0.45)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            zIndex: 1000
          }}>
            <div style={{
              background: '#fff', borderRadius: '14px',
              padding: '28px', width: '100%', maxWidth: '460px',
              boxShadow: '0 8px 40px rgba(0,0,0,0.18)'
            }}>
              <h3 style={{ fontSize: '18px', fontWeight: '700', color: '#0f172a', marginBottom: '6px' }}>
                {modal === 'concluir' ? 'Concluir solicitação' : 'Cancelar solicitação'}
              </h3>
              <p style={{ fontSize: '14px', color: '#64748b', marginBottom: '20px' }}>
                {modal === 'concluir'
                  ? 'Registre como foi atendida e, se quiser, informe o voluntário que ajudou.'
                  : 'Informe o motivo do cancelamento (opcional).'}
              </p>

              {/* Select de voluntário — só no modal de concluir */}
              {modal === 'concluir' && (
                <div style={{ marginBottom: '14px' }}>
                  <label style={{ fontSize: '13px', fontWeight: '600', color: '#475569', display: 'block', marginBottom: '6px' }}>
                    Voluntário que atendeu (opcional)
                  </label>
                  <select
                    style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '14px', color: '#0f172a' }}
                    value={voluntarioId}
                    onChange={e => setVoluntarioId(e.target.value)}
                  >
                    <option value="">Nenhum / não identificado</option>
                    <option value="anonimo">Anônimo</option>
                    {voluntarios.map(v => (
                      <option key={v.id_voluntario} value={v.id_voluntario}>{v.nome}</option>
                    ))}
                  </select>
                </div>
              )}

              {/* Observação */}
              <div style={{ marginBottom: '20px' }}>
                <label style={{ fontSize: '13px', fontWeight: '600', color: '#475569', display: 'block', marginBottom: '6px' }}>
                  Observação (opcional)
                </label>
                <textarea
                  style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '14px', resize: 'vertical', minHeight: '80px', fontFamily: 'inherit' }}
                  value={observacao}
                  onChange={e => setObservacao(e.target.value)}
                  placeholder="Ex: Recebemos 40 cobertores doados pela empresa X..."
                />
              </div>

              {/* Botões do modal */}
              <div style={{ display: 'flex', gap: '10px' }}>
                <button
                  onClick={() => handleAtualizarStatus(modal === 'concluir' ? 'concluido' : 'cancelado')}
                  disabled={salvando}
                  style={{
                    flex: 1, padding: '10px', borderRadius: '8px', border: 'none',
                    background: modal === 'concluir' ? '#0f172a' : '#ef4444',
                    color: '#fff', fontWeight: '700', fontSize: '14px',
                    cursor: salvando ? 'not-allowed' : 'pointer',
                    opacity: salvando ? 0.7 : 1
                  }}
                >
                  {salvando ? 'Salvando...' : modal === 'concluir' ? 'Confirmar conclusão' : 'Confirmar cancelamento'}
                </button>
                <button
                  onClick={() => { setModal(null); setObservacao(''); setVoluntarioId('') }}
                  style={{
                    flex: 1, padding: '10px', borderRadius: '8px',
                    border: '1px solid #e2e8f0', background: '#f8fafc',
                    color: '#334155', fontWeight: '600', fontSize: '14px', cursor: 'pointer'
                  }}
                >
                  Voltar
                </button>
              </div>
            </div>
          </div>
        )}

        <footer style={{ marginTop: 'auto', paddingTop: '20px', display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: '#94a3b8' }}>
          <p>© 2026 S.O.S Vale. Todos os direitos reservados.</p>
          <p>Versão 1.0.0</p>
        </footer>

      </main>
    </div>
  )
}

export default DetalhesSolicitacaoAjuda