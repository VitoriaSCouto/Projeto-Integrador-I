import { alertasService } from '../Alertas/alertas.service';
import { statusEfetivo } from '../Alertas/alertas.utils';
import AdminSidebar from '../../components/AdminSidebar';
import './style.css'
import { useState, useEffect } from 'react'; // ← useEffect adicionado: serve para executar código quando o componente carrega
import { IoMdHome } from "react-icons/io";
import { FaBoxOpen, FaMapPin, FaRegBell, FaUser, FaHome, FaDonate, FaChevronDown, FaChevronRight, FaPills } from "react-icons/fa";
import { GoAlertFill } from "react-icons/go";
import { FaHeart, FaGear, FaClipboardList, FaTriangleExclamation, FaClock, FaLocationDot, FaMap, FaPeopleGroup, FaCommentDots } from "react-icons/fa6";

const itensRequisitados = [
  { label: 'Roupas', value: 92 },
  { label: 'Alimentos não perecíveis', value: 78 },
  { label: 'Água potável', value: 60 },
  { label: 'Cobertores', value: 34 },
  { label: 'Produtos de higiene', value: 85 },
];

const quickActions = [
  { id: 'mapa', label: 'Ver mapa', icon: <FaMap /> },
  { id: 'abrigos', label: 'Hub abrigos', icon: <FaHome /> },
  { id: 'vitimas', label: 'Hub vítimas', icon: <FaPeopleGroup /> },
  { id: 'alertas', label: 'Alertas', icon: <FaRegBell /> },
];

const filters = [
  { id: 'todas', label: 'Todas' },
  { id: 'abrigo', label: 'Abrigo' },
  { id: 'alerta', label: 'Alertas' },
];

const PgAdm = () => {
  const [resumoAlertas, setResumoAlertas] = useState(null);
  useEffect(() => {
    let ativo = true;
    alertasService.listar().then(lista => { if (ativo) setResumoAlertas({ ativos: lista.filter(a => statusEfetivo(a) === 'ativo').length, revisao: lista.filter(a => a.status === 'em_revisao').length }); }).catch(() => { if (ativo) setResumoAlertas(null); });
    return () => { ativo = false; };
  }, []);
  const [activeFilter, setActiveFilter] = useState('todas');
  const [municipio, setMunicipio] = useState('Todos os Municípios');
  const [periodo, setPeriodo] = useState('Últimos 30 dias');

  // ─── ESTADOS NOVOS ───────────────────────────────────────────
  // solicitacoes: vai guardar a lista que vier da API
  // carregando: controla se ainda estamos esperando a resposta da API
  // erro: guarda a mensagem de erro se a requisição falhar
  const [solicitacoes, setSolicitacoes] = useState([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState(null);

  // ─── BUSCA DA API ────────────────────────────────────────────
  // useEffect com [] roda UMA VEZ quando o componente aparece na tela
  // É o lugar certo para buscar dados externos
  useEffect(() => {
    async function buscarSolicitacoes() {
      try {
        const resposta = await fetch('http://localhost:3000/api/solicitacoes/listar')

        // Se o servidor retornou erro (ex: 500), lança uma exceção manualmente
        if (!resposta.ok) throw new Error('Erro ao buscar solicitações')

        const dados = await resposta.json()

        // A API retorna { solicitacoes: [...] }, então pegamos só o array
        setSolicitacoes(dados.solicitacoes)
      } catch (err) {
        setErro(err.message)
      } finally {
        // Seja sucesso ou erro, o carregando sempre vira false no fim
        setCarregando(false)
      }
    }

    buscarSolicitacoes()
  }, []) // ← o [] garante que roda só uma vez (se fosse [periodo], rodaria toda vez que periodo mudasse)

  // ─── DERIVAÇÕES DOS DADOS ────────────────────────────────────
  // Contamos direto do array que veio da API, sem guardar em estado separado
  // Isso é chamado de "estado derivado" — calculamos na hora do render

  // Quantas solicitações de abrigo existem no total
  const totalSolicitacoesAbrigo = solicitacoes.length

  // Quantas ainda estão pendentes (= "não lidas" para o card)
  const pendentesSolicitacoesAbrigo = solicitacoes.filter(s => s.status === 'pendente').length

  // ─── MONTAGEM DINÂMICA DOS CARDS ────────────────────────────
  // Antes era um array fixo fora do componente
  // Agora está dentro para poder usar os valores calculados acima
  const statCards = [
    {
      id: 'abrigo',
      label: 'Novas solicitações de abrigo',
      value: totalSolicitacoesAbrigo,       // ← vem da API
      unread: pendentesSolicitacoesAbrigo,  // ← vem da API
      icon: <FaClipboardList />,
      accent: 'blue'
    },
    { id: 'Doações',   label: 'Novas solicitações de doações',   value: 18, unread: 5, icon: <FaHeart />,            accent: 'cyan'   },
    { id: 'Remédios',  label: 'Novas solicitações de medicamentos',   value: 9,  unread: 2, icon: <FaPills />,            accent: 'teal'   },
    { id: 'Alertas',  label: 'Alertas ativos',                 value: resumoAlertas?.ativos ?? '—', unread: resumoAlertas?.revisao ?? '—', icon: <FaRegBell />,          accent: 'red'    },
    { id: 'Ajuda',    label: 'Pedidos de ajuda',               value: 6,  unread: 3, icon: <FaTriangleExclamation />, accent: 'orange' },
  ]

  // ─── ATIVIDADES DINÂMICAS ────────────────────────────────────
  // Transformamos as solicitações da API no formato que a lista espera
  // .slice(0, 6) pega só as 6 mais recentes (a API já retorna ordenado por createdAt desc)
  const activitiesData = solicitacoes.slice(0, 6).map(s => ({
    id:    s.id_solicitacao,
    title: 'Abrigo solicitado',
    place: `${s.bairro}, ${s.cidade}`,  // ← endereço real da solicitação
    time:  formatarTempo(s.createdAt),  // ← função que vamos criar abaixo
    type:  'abrigo'
  }))

  const filteredActivities = activeFilter === 'todas'
    ? activitiesData
    : activitiesData.filter(a => a.type === activeFilter);

  const maxValue = Math.max(...itensRequisitados.map(i => i.value));

  // ─── TELA DE CARREGANDO / ERRO ───────────────────────────────



  return (
    // ... JSX igual ao seu, sem mudanças visuais
    <div className="dashboard">
      <AdminSidebar />

      <main className="main">
        <header className="top">
          <div>
            <p style={{ fontSize: '14px', color: '#64748b', margin: 0 }}>Home &gt;</p>
            <h1 style={{ fontSize: '26px', fontWeight: '700', color: '#0f172a', marginTop: '4px' }}>
              Home S.O.S. Vale
            </h1>
            <p className="subtitle">Gerencie informações recentes</p>
          </div>
          <div className="top-controls">
            <button className="notif-btn">
              <FaRegBell />
              {/* Badge dinâmico: total de pendentes em todas as categorias */}
              <span className="notif-badge">{pendentesSolicitacoesAbrigo}</span>
            </button>
            <div className="filter-select">
              <FaLocationDot className="filter-select-icon" />
              <select value={municipio} onChange={(e) => setMunicipio(e.target.value)}>
                <option>Todos os Municípios</option>
                <option>Taubaté</option>
                <option>Caçapava</option>
                <option>Pindamonhangaba</option>
              </select>
            </div>
            <div className="filter-select">
              <FaClock className="filter-select-icon" />
              <select value={periodo} onChange={(e) => setPeriodo(e.target.value)}>
                <option>Últimos 30 dias</option>
                <option>Últimos 7 dias</option>
                <option>Hoje</option>
              </select>
            </div>
          </div>
        </header>

        {carregando && <p role="status">Carregando solicitações…</p>}
        {erro && <p role="alert">Não foi possível carregar solicitações: {erro}</p>}
        <section className="stat-grid">
          {statCards.map(card => (
            <div className={`stat-card stat-card--${card.accent}`} key={card.id}>
              <div className="stat-card-icon">{card.icon}</div>
              <div className="stat-card-value">{card.value}</div>
              <div className="stat-card-label">{card.label}</div>
              <div className="stat-card-unread">
                <span className="dot" /> {card.unread} {card.id === 'Alertas' ? 'em revisão' : 'não lidas'}
                {card.id === 'Alertas' && <a href="/alertas" style={{ marginLeft: 8 }}>Ver alertas</a>}
              </div>
            </div>
          ))}
        </section>

        <section className="content-grid">
          <div className="panel activities-panel">
            <div className="panel-header">
              <h3>Atividades</h3>
              <div className="filter-tabs">

                {filters.map(f => (
                  <button
                    key={f.id}
                    className={`filter-tab ${activeFilter === f.id ? 'filter-tab--active' : ''}`}
                    onClick={() => setActiveFilter(f.id)}
                  >
                    {f.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="activities-list">
              {filteredActivities.map(item => (
                <div className="activity-row" key={item.id}>
                  <div className="activity-icon"><FaHome /></div>
                  <div className="activity-info">
                    <p className="activity-title">{item.title}</p>
                    <div className="activity-meta">
                      <span><FaLocationDot /> {item.place}</span>
                      <span><FaClock /> {item.time}</span>
                    </div>
                  </div>
                  <a href={`/visualizar-solicitação-abrigo/${item.id}`}><button className="activity-btn" on>Ver solicitação</button></a>
                </div>
              ))}
            </div>

            <button className="see-all-btn">
              Ver todas as solicitações <FaChevronRight />
            </button>
          </div>

          <div className="side-column">
            <div className="panel chart-panel">
              <h3>Gráfico</h3>
              <p className="chart-subtitle">ITENS MAIS REQUISITADOS</p>
              <div className="bar-chart">
                {itensRequisitados.map(item => (
                  <div className="bar-row" key={item.label}>
                    <div className="bar-track">
                      <div className="bar-fill" style={{ width: `${(item.value / maxValue) * 100}%` }} />
                    </div>
                    <span className="bar-label">{item.label}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="panel quick-actions-panel">
              <h3>Ações Rápidas</h3>
              <div className="quick-actions-grid">
                {quickActions.map(action => (
                  <button className="quick-action" key={action.id} onClick={() => { window.location.href = `/${action.id}`; }}>
                    <span className="quick-action-icon">{action.icon}</span>
                    {action.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}

// ─── FUNÇÃO AUXILIAR ─────────────────────────────────────────────
// Fica fora do componente pois não depende de nenhum estado
// Converte "2026-06-24T03:55:54.000Z" em "Há 15 min", "Há 2 horas", etc.
function formatarTempo(dataISO) {
  const agora = new Date()
  const data = new Date(dataISO)
  const diffMin = Math.floor((agora - data) / 1000 / 60)

  if (diffMin < 1)   return 'Agora mesmo'
  if (diffMin < 60)  return `Há ${diffMin} min`

  const diffHoras = Math.floor(diffMin / 60)
  if (diffHoras < 24) return `Há ${diffHoras}h`

  const diffDias = Math.floor(diffHoras / 24)
  return `Há ${diffDias} dias`
}

export default PgAdm;