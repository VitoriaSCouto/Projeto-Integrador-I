import './style.css'
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaHome, FaHeart, FaDonate, FaMap, FaUser, FaRegBell } from 'react-icons/fa';
import { FaChevronRight, FaLocationDot } from 'react-icons/fa6';
import { FiLogOut } from 'react-icons/fi';
import { GoAlertFill } from 'react-icons/go';

// ─── Labels e cores de status/categoria ─────────────────────────
// Mesmo padrão usado nas outras telas de Solicitação de Ajuda
const badgeStatus = {
  aberto:       { label: 'Aberto',       bg: '#dbeafe', cor: '#1e40af' },
  em_andamento: { label: 'Em andamento', bg: '#fef3c7', cor: '#92400e' },
  concluido:    { label: 'Concluído',    bg: '#d1fae5', cor: '#065f46' },
  cancelado:    { label: 'Cancelado',    bg: '#fee2e2', cor: '#991b1b' },
}

const categoriaLabel = {
  doacao:         'Doação',
  medicamento:    'Medicamento',
  voluntariado:   'Voluntariado',
  infraestrutura: 'Infraestrutura',
  outro:          'Outro',
}

const PainelVoluntario = () => {
  const navigate = useNavigate();

  // ─── DADOS DO VOLUNTÁRIO LOGADO ──────────────────────────────
  // Recupera do localStorage o que foi salvo no login — evita requisição extra
  const voluntarioSalvo = JSON.parse(localStorage.getItem('voluntario') || '{}');

  // ─── ESTADOS ─────────────────────────────────────────────────
  const [voluntario,          setVoluntario]          = useState(voluntarioSalvo);
  const [abrigos,              setAbrigos]              = useState([]);
  const [minhasSolicitacoes,   setMinhasSolicitacoes]   = useState([]);
  const [carregando,           setCarregando]           = useState(true);
  const [erro,                 setErro]                 = useState(null);
  const [activePage,           setActivePage]           = useState('home');

  // ─── TOKEN DO VOLUNTÁRIO ─────────────────────────────────────
  // Se não tiver token, redireciona para o login imediatamente
  const token = localStorage.getItem('token_voluntario');

  useEffect(() => {
    if (!token) {
      navigate('/login_voluntario');
      return;
    }
    buscarDados();
  }, []);

  // ─── BUSCA DE DADOS ──────────────────────────────────────────
  // Busca em paralelo: abrigos em alerta + dados completos do voluntário + solicitações que ele atendeu
  async function buscarDados() {
    try {
      const [resAbrigos, resVoluntario] = await Promise.all([
        fetch('http://localhost:3000/api/abrigos/listar'),
        fetch('http://localhost:3000/api/voluntarios/me', {
          headers: { Authorization: `Bearer ${token}` }
        }),
      ]);

      if (!resAbrigos.ok)    throw new Error('Erro ao buscar abrigos');
      if (!resVoluntario.ok) throw new Error('Erro ao buscar dados do voluntário');

      const dadosAbrigos    = await resAbrigos.json();
      const dadosVoluntario = await resVoluntario.json();

      // Filtra abrigos que precisam de ajuda:
      // statusAlerta: true OU ocupação acima de 80% da capacidade total
      const abrigosNecessitando = dadosAbrigos.abrigos.filter(a =>
        a.statusAlerta ||
        (a.capacidadeTotal > 0 && (a.capacidadeOcupada / a.capacidadeTotal) >= 0.8)
      );

      setAbrigos(abrigosNecessitando);
      setVoluntario(dadosVoluntario.voluntario);
      // Antes era "doacoes" (model removido do schema). Agora é
      // "solicitacoesAjudaAtendidas" — solicitações de ajuda que este
      // voluntário atendeu de fato (atribuídas pelo ADM ao concluir).
      setMinhasSolicitacoes(dadosVoluntario.voluntario.solicitacoesAjudaAtendidas || []);

    } catch (err) {
      setErro(err.message);
    } finally {
      setCarregando(false);
    }
  }

  // ─── LOGOUT ──────────────────────────────────────────────────
  // Remove os dados do voluntário do localStorage e volta para o login
  function fazerLogout() {
    localStorage.removeItem('token_voluntario');
    localStorage.removeItem('voluntario');
    navigate('/login_voluntario');
  }

  // ─── DERIVAÇÕES ──────────────────────────────────────────────
  const totalSolicitacoes = minhasSolicitacoes.length;
  const emAndamento       = minhasSolicitacoes.filter(s => s.status === 'em_andamento').length;
  const concluidas        = minhasSolicitacoes.filter(s => s.status === 'concluido').length;
  const vinculado         = voluntario?.abrigo?.nome ?? null;

  const statCards = [
    {
      id:     'abrigos',
      label:  'Abrigos precisando de ajuda',
      value:  abrigos.length,
      sub:    'com alerta ou lotação alta',
      icon:   <FaHome />,
      accent: 'red',
    },
    {
      id:     'solicitacoes',
      label:  'Minhas contribuições',
      value:  totalSolicitacoes,
      sub:    `${concluidas} concluída${concluidas !== 1 ? 's' : ''}`,
      icon:   <FaHeart />,
      accent: 'cyan',
    },
    {
      id:     'vinculo',
      label:  'Meu vínculo',
      value:  vinculado ? '✓' : '—',
      sub:    vinculado ?? 'Sem abrigo vinculado',
      icon:   <FaLocationDot />,
      accent: vinculado ? 'blue' : 'orange',
    },
  ];

  // ─── TELA DE CARREGANDO / ERRO ───────────────────────────────
  if (carregando) return <div className="dashboard">Carregando...</div>;
  if (erro)       return <div className="dashboard">Erro: {erro}</div>;

  return (
    <div className="dashboard">

      {/* ── SIDEBAR ── */}
      <aside className="sidebar">
        <div className="top-icons">
          <img src="src/assets/logo.png" width="70px" />
          <p>S.O.S. Vale</p>
        </div>

        <ul>
          <li
            className={activePage === 'home' ? 'active' : ''}
            onClick={() => setActivePage('home')}
          >
            <FaHome className="icon" /> Home
          </li>

          {/* Solicitações de ajuda que o voluntário pode atender */}
          <li
            className={activePage === 'solicitacoes' ? 'active' : ''}
            onClick={() => navigate('/solicitacoes-ajuda-voluntario')}
          >
            <FaDonate className="icon" /> Solicitações de Ajuda
          </li>

          {/* Mapa */}
          <li onClick={() => navigate('/mapa')}>
            <FaMap className="icon" /> Mapa
          </li>

          {/* Meu perfil */}
          <li
            className={activePage === 'perfil' ? 'active' : ''}
            onClick={() => setActivePage('perfil')}
          >
            <FaUser className="icon" /> Meu perfil
          </li>
        </ul>

        {/* Logout no rodapé da sidebar */}
        <div className="sidebar-footer">
          <button className="logout-btn" onClick={fazerLogout}>
            <FiLogOut className="icon" /> Sair
          </button>
        </div>
      </aside>

      {/* ── MAIN ── */}
      <main className="main">

        {/* ── HEADER ── */}
        <header className="top">
          <div>
            <p style={{ fontSize: '14px', color: '#64748b', margin: 0 }}>Home &gt;</p>
            <h1 style={{ fontSize: '26px', fontWeight: '700', color: '#0f172a', marginTop: '4px' }}>
              Olá, {voluntario?.nome?.split(' ')[0] ?? 'Voluntário'} 👋
            </h1>
            <p className="subtitle">Veja onde você pode ajudar hoje</p>
          </div>

          <div className="top-controls">
            {/* Badge com solicitações em andamento */}
            <button className="notif-btn">
              <FaRegBell />
              {emAndamento > 0 && (
                <span className="notif-badge">{emAndamento}</span>
              )}
            </button>
          </div>
        </header>

        {/* ── CARDS DE TOPO ── */}
        <section className="stat-grid">
          {statCards.map(card => (
            <div className={`stat-card stat-card--${card.accent}`} key={card.id}>
              <div className="stat-card-icon">{card.icon}</div>
              <div className="stat-card-value">{card.value}</div>
              <div className="stat-card-label">{card.label}</div>
              <div className="stat-card-unread">
                <span className="dot" /> {card.sub}
              </div>
            </div>
          ))}
        </section>

        {/* ── CONTEÚDO PRINCIPAL ── */}
        <section className="content-grid">

          {/* ── LISTA DE ABRIGOS QUE PRECISAM DE AJUDA ── */}
          <div className="panel activities-panel">
            <div className="panel-header">
              <h3>Abrigos que precisam de ajuda</h3>
            </div>

            <div className="activities-list">
              {abrigos.length === 0 ? (
                <p style={{ color: '#64748b', padding: '16px 0' }}>
                  Nenhum abrigo em alerta no momento.
                </p>
              ) : (
                abrigos.slice(0, 6).map(abrigo => {
                  // Calcula o percentual de ocupação para exibir na linha
                  const ocupacao = abrigo.capacidadeTotal > 0
                    ? Math.round((abrigo.capacidadeOcupada / abrigo.capacidadeTotal) * 100)
                    : 0;

                  return (
                    <div className="activity-row" key={abrigo.id}>
                      <div className="activity-icon"><FaHome /></div>
                      <div className="activity-info">
                        <p className="activity-title">{abrigo.nome}</p>
                        <div className="activity-meta">
                          <span><FaLocationDot /> {abrigo.bairro ? `${abrigo.bairro}, ` : ''}{abrigo.cidade}</span>
                          {/* Ocupação como barra visual simples */}
                          <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <div style={{
                              width: '80px', height: '6px',
                              background: '#e2e8f0', borderRadius: '4px', overflow: 'hidden'
                            }}>
                              <div style={{
                                width: `${ocupacao}%`, height: '100%',
                                background: ocupacao >= 90 ? '#ef4444' : '#f59e0b',
                                borderRadius: '4px'
                              }} />
                            </div>
                            {ocupacao}% ocupado
                          </span>
                          {/* Badge de alerta se statusAlerta for true */}
                          {abrigo.statusAlerta && (
                            <span style={{
                              background: '#fee2e2', color: '#dc2626',
                              fontSize: '11px', padding: '2px 8px', borderRadius: '99px'
                            }}>
                              Em alerta
                            </span>
                          )}
                        </div>
                      </div>
                      {/* Leva para as solicitações de ajuda abertas desse abrigo */}
                      <button
                        className="activity-btn"
                        onClick={() => navigate(`/abrigos/${abrigo.id}/solicitacoes-ajuda`)}
                      >
                        Quero ajudar
                      </button>
                    </div>
                  );
                })
              )}
            </div>

            <button className="see-all-btn" onClick={() => navigate('/abrigos')}>
              Ver todos os abrigos <FaChevronRight />
            </button>
          </div>

          {/* ── LATERAL ── */}
          <div className="side-column">

            {/* ── MINHAS CONTRIBUIÇÕES RECENTES ── */}
            <div className="panel chart-panel">
              <h3>Minhas contribuições recentes</h3>

              {minhasSolicitacoes.length === 0 ? (
                <p style={{ color: '#64748b', fontSize: '14px', marginTop: '8px' }}>
                  Você ainda não atendeu nenhuma solicitação.
                </p>
              ) : (
                <div style={{ marginTop: '12px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {minhasSolicitacoes.slice(0, 5).map((solicitacao, index) => {
                    const badge = badgeStatus[solicitacao.status] ?? { label: solicitacao.status, bg: '#f1f5f9', cor: '#64748b' }
                    return (
                      <div key={index} style={{
                        display: 'flex', justifyContent: 'space-between',
                        alignItems: 'center', fontSize: '13px', gap: '8px',
                        borderBottom: '1px solid #f1f5f9', paddingBottom: '8px'
                      }}>
                        <span style={{ fontWeight: '600', color: '#0f172a', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {solicitacao.titulo}
                        </span>
                        <span style={{ color: '#64748b', flexShrink: 0 }}>
                          {categoriaLabel[solicitacao.categoria] ?? solicitacao.categoria}
                        </span>
                        {/* Badge de status com cor por estado */}
                        <span style={{
                          fontSize: '11px', padding: '2px 8px', borderRadius: '99px',
                          background: badge.bg, color: badge.cor, flexShrink: 0
                        }}>
                          {badge.label}
                        </span>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>

            {/* ── AÇÕES RÁPIDAS ── */}
            <div className="panel quick-actions-panel">
              <h3>Ações Rápidas</h3>
              <div className="quick-actions-grid">
                <button
                  className="quick-action"
                  onClick={() => navigate('/solicitacoes-ajuda-voluntario')}
                >
                  <span className="quick-action-icon"><FaDonate /></span>
                  Ver solicitações
                </button>

                <button
                  className="quick-action"
                  onClick={() => navigate('/mapa')}
                >
                  <span className="quick-action-icon"><FaMap /></span>
                  Ver mapa
                </button>

                <button
                  className="quick-action"
                  onClick={() => setActivePage('perfil')}
                >
                  <span className="quick-action-icon"><FaUser /></span>
                  Meu perfil
                </button>
              </div>
            </div>

          </div>
        </section>
      </main>
    </div>
  );
}

export default PainelVoluntario;