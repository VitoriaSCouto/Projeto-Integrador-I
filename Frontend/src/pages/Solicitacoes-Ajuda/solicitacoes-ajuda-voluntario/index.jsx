// ─── Imports ──────────────────────────────────────────────────────────────────
import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  FaHome, FaUser, FaMap, FaHandHoldingHeart,
  FaPhoneAlt, FaBuilding, FaHeart, FaRegHeart
} from 'react-icons/fa';
import { FaGear } from 'react-icons/fa6';
import { GoAlertFill } from 'react-icons/go';
import '../../pg_adm/style.css';
import SidebarVoluntario from '../../../components/SidebarVoluntario';
import { API_URL } from '../../../services/api';
import { fetchVoluntario } from '../../../services/voluntario';

// ─── Badges e labels ──────────────────────────────────────────────────────────
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

const CATEGORIAS = ['todas', 'doacao', 'medicamento', 'voluntariado', 'infraestrutura', 'outro']

// O voluntário logado é identificado pelo token (token_voluntario), não por um id
// fixo na tela — antes era "VOLUNTARIO_LOGADO_ID = 1" e todo interesse ia para o voluntário 1


// ─── Componente principal ─────────────────────────────────────────────────────
function SolicitacoesAjudaVoluntario() {


  const [solicitacoes, setSolicitacoes]   = useState([])
  const [carregando, setCarregando]       = useState(true)
  const [filtroCategoria, setFiltroCategoria] = useState('todas')

  // ?abrigo=ID na URL (vindo do "Quero ajudar" do painel) mostra só as solicitações daquele abrigo
  const [parametros, setParametros] = useSearchParams()
  const filtroAbrigo = Number(parametros.get('abrigo')) || null

  // Guarda os IDs das solicitações em que o voluntário marcou interesse
  const [interesses, setInteresses]       = useState(new Set())
  const [carregandoInteresse, setCarregandoInteresse] = useState(null) // id sendo processado

  // ─── Busca — só solicitações abertas ou em andamento ────────────────────────
  useEffect(() => {
    const buscar = async () => {
      try {
        // Rota pública — já filtra status aberto/em_andamento no backend
        const res = await fetch(`${API_URL}/api/solicitacoes-ajuda/publico`)
        const dados = await res.json()
        setSolicitacoes(dados.solicitacoes ?? [])

        // Busca os interesses já marcados pelo voluntário logado
        const resInt = await fetchVoluntario('/solicitacoes-ajuda/meus-interesses')
        const dadosInt = await resInt.json()
        const ids = new Set((dadosInt.interesses ?? []).map(i => i.solicitacaoId))
        setInteresses(ids)
      } catch (err) {
        console.error('Erro ao buscar solicitações:', err)
      } finally {
        setCarregando(false)
      }
    }
    buscar()
  }, [])

  // ─── Marcar / desmarcar interesse ───────────────────────────────────────────
  const handleInteresse = async (solicitacaoId) => {
    setCarregandoInteresse(solicitacaoId)
    const jaTemInteresse = interesses.has(solicitacaoId)

    // Atualiza o estado local imediatamente (optimistic update)
    setInteresses(prev => {
      const novo = new Set(prev)
      jaTemInteresse ? novo.delete(solicitacaoId) : novo.add(solicitacaoId)
      return novo
    })

    try {
      // Rota do backend é /interesse/:id (id da solicitação vem depois de "interesse")
      // Sem corpo: a API sabe quem é o voluntário pelo token
      const resposta = await fetchVoluntario(`/solicitacoes-ajuda/interesse/${solicitacaoId}`, {
        method: jaTemInteresse ? 'DELETE' : 'POST',
      })

      if (!resposta.ok) {
        const d = await resposta.json()
        throw new Error(d.mensagem ?? 'Erro ao registrar interesse.')
      }
    } catch (err) {
      // Reverte se a API falhar
      console.error('Erro ao registrar interesse:', err)
      setInteresses(prev => {
        const revertido = new Set(prev)
        jaTemInteresse ? revertido.add(solicitacaoId) : revertido.delete(solicitacaoId)
        return revertido
      })
    } finally {
      setCarregandoInteresse(null)
    }
  }

  // ─── Filtro ──────────────────────────────────────────────────────────────────
  const lista = solicitacoes
    .filter(s => filtroCategoria === 'todas' || s.categoria === filtroCategoria)
    .filter(s => !filtroAbrigo || s.abrigoId === filtroAbrigo)

  const abrigoFiltrado = filtroAbrigo ? solicitacoes.find(s => s.abrigoId === filtroAbrigo)?.abrigo : null

  // ─── Loading ─────────────────────────────────────────────────────────────────
  if (carregando) {
    return (
      <div className="dashboard">
        <SidebarVoluntario ativo="ajuda" />
        <main className="main">
          <p style={{ padding: '40px', color: '#64748b' }}>Carregando solicitações...</p>
        </main>
      </div>
    )
  }

  // ─── Render ───────────────────────────────────────────────────────────────────
  return (
    <div className="dashboard">
      <SidebarVoluntario ativo="ajuda" />

      <main className="main">

        {/* Header */}
        <header className="top">
          <div>
            <p style={{ fontSize: '14px', color: '#64748b', margin: 0 }}>
              Voluntário &gt; Solicitações de Ajuda
            </p>
            <h1 style={{ fontSize: '26px', fontWeight: '700', color: '#0f172a', marginTop: '4px' }}>
              Solicitações de Ajuda
            </h1>
            <p className="subtitle">
              Veja os pedidos dos abrigos e indique interesse em ajudar
            </p>
          </div>
        </header>

        {/* Painel */}
        <div className="panel" style={{ background: '#fff', borderRadius: '12px', padding: '24px', boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>

          {/* Filtros por categoria */}
          <div style={{ display: 'flex', gap: '8px', marginBottom: '20px', flexWrap: 'wrap' }}>
            {CATEGORIAS.map(c => (
              <button
                key={c}
                onClick={() => setFiltroCategoria(c)}
                style={{
                  padding: '6px 16px',
                  borderRadius: '20px',
                  border: 'none',
                  cursor: 'pointer',
                  fontSize: '13px',
                  fontWeight: '600',
                  background: filtroCategoria === c ? '#0f172a' : '#f1f5f9',
                  color: filtroCategoria === c ? '#fff' : '#64748b',
                  transition: 'all 0.2s'
                }}
              >
                {c === 'todas' ? 'Todas' : categoriaLabel[c]}
              </button>
            ))}

            {/* Filtro de abrigo vindo do painel — dá para remover */}
            {filtroAbrigo && (
              <button
                onClick={() => setParametros({})}
                title="Mostrar todos os abrigos"
                style={{ padding: '6px 12px', borderRadius: '20px', border: '1px solid #bae6fd', background: '#e0f2fe', color: '#0c4a6e', fontSize: '13px', fontWeight: '600', cursor: 'pointer' }}
              >
                Abrigo: {abrigoFiltrado?.nome ?? `#${filtroAbrigo}`} ✕
              </button>
            )}

            <span style={{ marginLeft: 'auto', fontSize: '13px', color: '#94a3b8', alignSelf: 'center' }}>
              {lista.length} solicitaç{lista.length !== 1 ? 'ões' : 'ão'}
            </span>
          </div>

          {/* Lista vazia */}
          {lista.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '48px 0', color: '#94a3b8' }}>
              <FaHandHoldingHeart style={{ fontSize: '40px', marginBottom: '12px' }} />
              <p style={{ fontSize: '15px' }}>Nenhuma solicitação aberta no momento.</p>
            </div>
          ) : (

            /* Grid de cards */
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '16px' }}>
              {lista.map(s => {
                const urgBadge = badgeUrgencia[s.urgencia] ?? { label: s.urgencia, bg: '#f1f5f9', cor: '#64748b' }
                const temInteresse = interesses.has(s.id_solicitacao)
                const processando = carregandoInteresse === s.id_solicitacao

                return (
                  <div
                    key={s.id_solicitacao}
                    style={{
                      borderRadius: '12px',
                      border: temInteresse ? '1.5px solid #a78bfa' : '1px solid #e2e8f0',
                      background: temInteresse ? '#faf5ff' : '#fff',
                      padding: '20px',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '12px',
                      transition: 'border-color 0.2s, background 0.2s'
                    }}
                  >
                    {/* Topo: ícone + título + badges */}
                    <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
                      <div style={{
                        width: '40px', height: '40px', flexShrink: 0,
                        borderRadius: '10px', background: '#ede9fe',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        color: '#7c3aed', fontSize: '18px'
                      }}>
                        <FaHandHoldingHeart />
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <p style={{ fontWeight: '700', color: '#0f172a', fontSize: '14px', margin: '0 0 4px', lineHeight: '1.4' }}>
                          {s.titulo}
                        </p>
                        <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                          <span style={{ background: urgBadge.bg, color: urgBadge.cor, padding: '2px 8px', borderRadius: '12px', fontSize: '11px', fontWeight: '600' }}>
                            {urgBadge.label}
                          </span>
                          <span style={{ background: '#f1f5f9', color: '#475569', padding: '2px 8px', borderRadius: '12px', fontSize: '11px', fontWeight: '600' }}>
                            {categoriaLabel[s.categoria] ?? s.categoria}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Descrição resumida */}
                    <p style={{
                      fontSize: '13px', color: '#64748b', lineHeight: '1.6',
                      display: '-webkit-box', WebkitLineClamp: 3,
                      WebkitBoxOrient: 'vertical', overflow: 'hidden'
                    }}>
                      {s.descricao}
                    </p>

                    {/* Abrigo */}
                    {s.abrigo && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', color: '#475569' }}>
                        <FaBuilding style={{ color: '#94a3b8', flexShrink: 0 }} />
                        <span style={{ fontWeight: '500' }}>{s.abrigo.nome}</span>
                        {s.abrigo.cidade && (
                          <span style={{ color: '#94a3b8' }}>— {s.abrigo.cidade}/{s.abrigo.estado}</span>
                        )}
                      </div>
                    )}

                    {/* Contato do abrigo */}
                    {s.abrigo?.telefone && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', color: '#2563eb' }}>
                        <FaPhoneAlt />
                        <a href={`tel:${s.abrigo.telefone}`} style={{ color: 'inherit', textDecoration: 'none', fontWeight: '500' }}>
                          {s.abrigo.telefone}
                        </a>
                      </div>
                    )}

                    {/* Rodapé do card: interesse + data */}
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '4px' }}>

                      {/* Data */}
                      <span style={{ fontSize: '11px', color: '#94a3b8' }}>
                        {new Date(s.createdAt).toLocaleDateString('pt-BR')}
                      </span>

                      {/* Botão de interesse */}
                      <button
                        onClick={() => handleInteresse(s.id_solicitacao)}
                        disabled={processando}
                        style={{
                          display: 'flex', alignItems: 'center', gap: '6px',
                          padding: '7px 14px', borderRadius: '20px', border: 'none',
                          cursor: processando ? 'wait' : 'pointer',
                          background: temInteresse ? '#7c3aed' : '#f3f4f6',
                          color: temInteresse ? '#fff' : '#374151',
                          fontWeight: '600', fontSize: '13px',
                          transition: 'all 0.2s',
                          opacity: processando ? 0.7 : 1
                        }}
                      >
                        {temInteresse
                          ? <><FaHeart /> Tenho interesse</>
                          : <><FaRegHeart /> Quero ajudar</>
                        }
                      </button>

                    </div>
                  </div>
                )
              })}
            </div>
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

export default SolicitacoesAjudaVoluntario