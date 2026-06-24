// --------- Imports -----------
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  FaHome, FaBoxOpen, FaUser, FaDonate, FaMap,
  FaClipboardList
} from 'react-icons/fa';
import { FaGear } from 'react-icons/fa6';
import { GoAlertFill } from 'react-icons/go';
import '../../pg_adm/style.css';

function ListaSolicitacoesAbrigo() {

  const navigate = useNavigate();

  // ─── ESTADOS ────────────────────────────────────────────────
  const [solicitacoes, setSolicitacoes] = useState([]);
  const [carregando, setCarregando] = useState(true);
  const [filtroStatus, setFiltroStatus] = useState('todas');

  // ─── BUSCA DA API ────────────────────────────────────────────
  useEffect(() => {
    const buscarSolicitacoes = async () => {
      try {
        const resposta = await fetch('http://localhost:3000/api/solicitacoes/listar')
        const dados = await resposta.json()
        setSolicitacoes(dados.solicitacoes)
      } catch (erro) {
        console.error('Erro ao buscar solicitações:', erro)
      } finally {
        setCarregando(false)
      }
    }

    buscarSolicitacoes()
  }, [])

  // ─── DERIVAÇÕES ──────────────────────────────────────────────
  // Filtra o array conforme o botão selecionado
  const solicitacoesFiltradas = filtroStatus === 'todas'
    ? solicitacoes
    : solicitacoes.filter(s => s.status === filtroStatus)

  // Badge colorido por status — igual ao DetalhesSolicitacao
  const badgeStatus = {
    pendente: { label: 'Pendente', bg: '#fef3c7', cor: '#92400e' },
    aprovado: { label: 'Aprovado', bg: '#d1fae5', cor: '#065f46' },
    recusado: { label: 'Recusado', bg: '#fee2e2', cor: '#991b1b' },
  }

  // ─── TELA DE LOADING ─────────────────────────────────────────
  if (carregando) {
    return (
      <div className="dashboard">
        <aside className="sidebar">
          <div className="top-icons">
            <img src="src/assets/logo.png" width="70px" />
            <p>S.O.S. Vale</p>
          </div>
          <ul>
            <a href="/pg_adm"><li><FaHome className="icon" /> Home</li></a>
            <a href="/abrigos"><li><FaBoxOpen className="icon" /> Abrigos</li></a>
            <a href="/vitimas"><li><FaUser className="icon" /> Vítimas</li></a>
            <li><FaDonate className="icon" /> Doações</li>
            <a href="/mapa"><li><FaMap className="icon" /> Mapa</li></a>
            <li><GoAlertFill className="icon" /> Ocorrências</li>
            <li><FaGear className="icon" /> Configurações</li>
          </ul>
        </aside>
        <main className="main">
          <p style={{ padding: '40px', color: '#64748b' }}>Carregando solicitações...</p>
        </main>
      </div>
    )
  }

  // ─── TELA PRINCIPAL ──────────────────────────────────────────
  return (
    <div className="dashboard">

      {/* Sidebar */}
      <aside className="sidebar">
        <div className="top-icons">
          <img src="src/assets/logo.png" width="70px" />
          <p>S.O.S. Vale</p>
        </div>
        <ul>
          <a href="/pg_adm"><li><FaHome className="icon" /> Home</li></a>
          <a href="/abrigos"><li><FaBoxOpen className="icon" /> Abrigos</li></a>
          <a href="/vitimas"><li><FaUser className="icon" /> Vítimas</li></a>
          <li><FaDonate className="icon" /> Doações</li>
          <a href="/mapa"><li><FaMap className="icon" /> Mapa</li></a>
          <li><GoAlertFill className="icon" /> Ocorrências</li>
          <li className="active"><FaGear className="icon" /> Configurações</li>
        </ul>
      </aside>

      <main className="main">

        {/* Header */}
        <header className="top">
          <div>
            <p style={{ fontSize: '14px', color: '#64748b', margin: 0 }}>
              Home &gt; <span>Solicitações de Abrigo</span>
            </p>
            <h1 style={{ fontSize: '26px', fontWeight: '700', color: '#0f172a', marginTop: '4px' }}>
              Solicitações de Abrigo
            </h1>
            <p className="subtitle">Gerencie os pedidos de cadastro de novos abrigos</p>
          </div>
        </header>

        {/* Painel da lista */}
        <div className="panel" style={{ background: '#fff', borderRadius: '12px', padding: '24px', boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>

          {/* Filtros de status */}
          <div style={{ display: 'flex', gap: '8px', marginBottom: '20px' }}>
            {['todas', 'pendente', 'aprovado', 'recusado'].map(f => (
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
                {f.charAt(0).toUpperCase() + f.slice(1)}
              </button>
            ))}

            {/* Contador */}
            <span style={{ marginLeft: 'auto', fontSize: '13px', color: '#94a3b8', alignSelf: 'center' }}>
              {solicitacoesFiltradas.length} resultado{solicitacoesFiltradas.length !== 1 ? 's' : ''}
            </span>
          </div>

          {/* Lista */}
          {solicitacoesFiltradas.length === 0 ? (

            // Lista vazia
            <div style={{ textAlign: 'center', padding: '48px 0', color: '#94a3b8' }}>
              <FaClipboardList style={{ fontSize: '40px', marginBottom: '12px' }} />
              <p style={{ fontSize: '15px' }}>Nenhuma solicitação encontrada.</p>
            </div>

          ) : (

            // Lista com itens
            solicitacoesFiltradas.map(s => {
              const badge = badgeStatus[s.status] ?? { label: s.status, bg: '#f1f5f9', cor: '#64748b' }

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
                    background: '#e0f2fe',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    color: '#0369a1', fontSize: '18px', flexShrink: 0
                  }}>
                    <FaClipboardList />
                  </div>

                  {/* Informações */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ fontWeight: '600', color: '#0f172a', fontSize: '15px', margin: 0 }}>
                      {s.nome}
                    </p>
                    <p style={{ fontSize: '13px', color: '#64748b', margin: '2px 0 0' }}>
                      {s.cidade} — {s.responsavel} — {s.tipoAbrigo}
                    </p>
                  </div>

                  {/* Badge de status */}
                  <span style={{
                    background: badge.bg,
                    color: badge.cor,
                    padding: '4px 12px',
                    borderRadius: '20px',
                    fontSize: '12px',
                    fontWeight: '600',
                    flexShrink: 0
                  }}>
                    {badge.label}
                  </span>

                  {/* Botão */}
                  <button
                    onClick={() => navigate(`/visualizar-solicitação-abrigo/${s.id_solicitacao}`)}
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

export default ListaSolicitacoesAbrigo;