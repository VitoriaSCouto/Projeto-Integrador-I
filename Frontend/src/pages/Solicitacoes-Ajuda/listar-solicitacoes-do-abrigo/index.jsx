// ─── Imports ──────────────────────────────────────────────────────────────────
import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  FaHome, FaBoxOpen, FaUser, FaDonate, FaMap,
  FaHandHoldingHeart
} from 'react-icons/fa';
import { FaGear } from 'react-icons/fa6';
import { GoAlertFill } from 'react-icons/go';
import '../../pg_adm/style.css';
import SidebarAdm from '../../../components/SidebarAdm';

// ─── Constantes de exibição ───────────────────────────────────────────────────
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

const FILTROS = ['todas', 'aberto', 'em_andamento', 'concluido', 'cancelado']

// ─── Sidebar reutilizável ─────────────────────────────────────────────────────
const Sidebar = () => (
  <SidebarAdm ativo="ajuda" />
)

// ─── Componente principal ─────────────────────────────────────────────────────
function SolicitacoesAjudaDoAbrigo() {

  const { id } = useParams()
  const navigate = useNavigate()

  const [solicitacoes, setSolicitacoes]   = useState([])
  const [nomeAbrigo, setNomeAbrigo]       = useState('')
  const [carregando, setCarregando]       = useState(true)
  const [filtroStatus, setFiltroStatus]   = useState('todas')

  // ─── Busca ──────────────────────────────────────────────────────────────────
  useEffect(() => {
    const buscar = async () => {
      try {
        // Busca o nome do abrigo para o breadcrumb
        const resAbrigo = await fetch(`http://localhost:3000/api/abrigos/listar/${id}`)
        const dadosAbrigo = await resAbrigo.json()
        setNomeAbrigo(dadosAbrigo.nome ?? '')

        // Busca todas as solicitações do abrigo (sem limite)
        const resSolic = await fetch(`http://localhost:3000/api/solicitacoes-ajuda/abrigo/${id}`)
        const dadosSolic = await resSolic.json()
        setSolicitacoes(dadosSolic.solicitacoes ?? [])
      } catch (erro) {
        console.error('Erro ao buscar dados:', erro)
      } finally {
        setCarregando(false)
      }
    }
    buscar()
  }, [id])

  // ─── Derivações ─────────────────────────────────────────────────────────────
  const lista = filtroStatus === 'todas'
    ? solicitacoes
    : solicitacoes.filter(s => s.status === filtroStatus)

  // ─── Loading ─────────────────────────────────────────────────────────────────
  if (carregando) {
    return (
      <div className="dashboard">
        <Sidebar />
        <main className="main">
          <p style={{ padding: '40px', color: '#64748b' }}>Carregando solicitações...</p>
        </main>
      </div>
    )
  }

  // ─── Render ──────────────────────────────────────────────────────────────────
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
                onClick={() => navigate(`/detalhes-abrigos/${id}`)}
              >
                {nomeAbrigo}
              </span>
              {' '}&gt; Solicitações de Ajuda
            </p>
            <h1 style={{ fontSize: '26px', fontWeight: '700', color: '#0f172a', marginTop: '4px' }}>
              Solicitações de Ajuda
            </h1>
            <p className="subtitle">Todos os pedidos de ajuda vinculados a este abrigo</p>
          </div>

          {/* Botão nova solicitação */}
          <button
            onClick={() => navigate(`/abrigos/${id}/cadastrar-solicitacao-ajuda`)}
            style={{
              padding: '10px 20px',
              borderRadius: '8px',
              border: 'none',
              background: '#0f172a',
              color: '#fff',
              fontWeight: '700',
              fontSize: '14px',
              cursor: 'pointer'
            }}
          >
            + Nova Solicitação
          </button>
        </header>

        {/* Painel */}
        <div className="panel" style={{ background: '#fff', borderRadius: '12px', padding: '24px', boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>

          {/* Filtros */}
          <div style={{ display: 'flex', gap: '8px', marginBottom: '20px', flexWrap: 'wrap' }}>
            {FILTROS.map(f => (
              <button
                key={f}
                onClick={() => setFiltroStatus(f)}
                style={{
                  padding: '6px 16px',
                  borderRadius: '20px',
                  border: 'none',
                  cursor: 'pointer',
                  fontSize: '13px',
                  fontWeight: '600',
                  background: filtroStatus === f ? '#0f172a' : '#f1f5f9',
                  color: filtroStatus === f ? '#fff' : '#64748b',
                  transition: 'all 0.2s'
                }}
              >
                {f === 'todas'       ? 'Todas'
                 : f === 'em_andamento' ? 'Em andamento'
                 : f.charAt(0).toUpperCase() + f.slice(1)}
              </button>
            ))}

            <span style={{ marginLeft: 'auto', fontSize: '13px', color: '#94a3b8', alignSelf: 'center' }}>
              {lista.length} resultado{lista.length !== 1 ? 's' : ''}
            </span>
          </div>

          {/* Lista vazia */}
          {lista.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '48px 0', color: '#94a3b8' }}>
              <FaHandHoldingHeart style={{ fontSize: '40px', marginBottom: '12px' }} />
              <p style={{ fontSize: '15px' }}>Nenhuma solicitação encontrada.</p>
            </div>
          ) : (

            lista.map(s => {
              const badge   = badgeStatus[s.status]   ?? { label: s.status,    bg: '#f1f5f9', cor: '#64748b' }
              const urgBadge = badgeUrgencia[s.urgencia] ?? { label: s.urgencia, bg: '#f1f5f9', cor: '#64748b' }

              return (
                <div
                  key={s.id_solicitacao}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    padding: '16px',
                    borderRadius: '8px',
                    marginBottom: '10px',
                    background: '#f8fafc',
                    border: '1px solid #e2e8f0',
                    gap: '16px'
                  }}
                >
                  {/* Ícone */}
                  <div style={{
                    width: '42px', height: '42px',
                    borderRadius: '10px',
                    background: '#ede9fe',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    color: '#7c3aed', fontSize: '18px', flexShrink: 0
                  }}>
                    <FaHandHoldingHeart />
                  </div>

                  {/* Informações */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ fontWeight: '600', color: '#0f172a', fontSize: '15px', margin: 0 }}>
                      {s.titulo}
                    </p>
                    <p style={{ fontSize: '13px', color: '#64748b', margin: '2px 0 0' }}>
                      {categoriaLabel[s.categoria] ?? s.categoria}
                      {s.criadoPor?.nome ? ` — criado por ${s.criadoPor.nome}` : ''}
                    </p>
                  </div>

                  {/* Badge urgência */}
                  <span style={{
                    background: urgBadge.bg, color: urgBadge.cor,
                    padding: '4px 10px', borderRadius: '20px',
                    fontSize: '12px', fontWeight: '600', flexShrink: 0
                  }}>
                    {urgBadge.label}
                  </span>

                  {/* Badge status */}
                  <span style={{
                    background: badge.bg, color: badge.cor,
                    padding: '4px 12px', borderRadius: '20px',
                    fontSize: '12px', fontWeight: '600', flexShrink: 0
                  }}>
                    {badge.label}
                  </span>

                  {/* Botão */}
                  <button
                    onClick={() => navigate(`/visualizar-solicitacao-ajuda/${s.id_solicitacao}`)}
                    className="btn-action cancelar"
                    style={{ width: 'auto', padding: '8px 16px', fontSize: '13px', flexShrink: 0 }}
                  >
                    Ver detalhes
                  </button>
                </div>
              )
            })
          )}
        </div>

        <footer style={{ marginTop: 'auto', paddingTop: '20px', display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: '#94a3b8' }}>
          <p>© 2026 S.O.S Vale. Todos os direitos reservados.</p>
          <p>Versão 1.0.0</p>
        </footer>

      </main>
    </div>
  )
}

export default SolicitacoesAjudaDoAbrigo