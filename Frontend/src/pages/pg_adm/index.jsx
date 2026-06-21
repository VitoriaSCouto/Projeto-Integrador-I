import './style.css'
import { useState } from 'react';
import { IoMdHome } from "react-icons/io";
import { FaBoxOpen, FaMapPin, FaRegBell, FaUser, FaHome, FaDonate, FaChevronDown, FaChevronRight, FaPills } from "react-icons/fa";
import { GoAlertFill } from "react-icons/go";
import { FaHeart, FaGear, FaClipboardList, FaTriangleExclamation, FaClock, FaLocationDot, FaMap, FaPeopleGroup, FaCommentDots } from "react-icons/fa6";

// --- Dados mockados (trocar por dados reais da API depois) ---
const statCards = [
  { id: 'abrigo', label: 'Novas solicitações de abrigo', value: 12, unread: 3, icon: <FaClipboardList />, accent: 'blue' },
  { id: 'doacao', label: 'Novas solicitações de doação', value: 18, unread: 5, icon: <FaHeart />, accent: 'cyan' },
  { id: 'remedio', label: 'Novas solicitações (remédio)', value: 9, unread: 2, icon: <FaPills />, accent: 'teal' },
  { id: 'alertas', label: 'Alertas', value: 7, unread: 2, icon: <FaRegBell />, accent: 'red' },
  { id: 'ajuda', label: 'Pedidos de ajuda', value: 6, unread: 3, icon: <FaTriangleExclamation />, accent: 'orange' },
];

const activitiesData = [
  { id: 1, title: 'Abrigo solicitado', place: 'Rua tal tal', time: 'Há 15 min', type: 'abrigo' },
  { id: 2, title: 'Doação registrada', place: 'Rua tal tal', time: 'Há 22 min', type: 'doacao' },
  { id: 3, title: 'Alerta de enchente', place: 'Canal de drenagem', time: 'Há 30 min', type: 'alerta' },
  { id: 4, title: 'Abrigo solicitado', place: 'Rua tal tal', time: 'Há 40 min', type: 'abrigo' },
  { id: 5, title: 'Pedido de remédio', place: 'Rua tal tal', time: 'Há 1 hora', type: 'abrigo' },
  { id: 6, title: 'Abrigo solicitado', place: 'Rua tal tal', time: 'Há 1h 30min', type: 'abrigo' },
];

const itensRequisitados = [
  { label: 'roupas', value: 92 },
  { label: 'alimentos não perecíveis', value: 78 },
  { label: 'água potável', value: 60 },
  { label: 'cobertores', value: 34 },
  { label: 'produtos de higiene', value: 85 },
];

const quickActions = [
  { id: 'mapa', label: 'Ver mapa', icon: <FaMap /> },
  { id: 'abrigos', label: 'Hub abrigos', icon: <FaHome /> },
  { id: 'vitimas', label: 'Hub vítimas', icon: <FaPeopleGroup /> },
  { id: 'topico', label: 'Tópico vazio', icon: <FaCommentDots /> },
];

const filters = [
  { id: 'todas', label: 'Todas' },
  { id: 'abrigo', label: 'Abrigo' },
  { id: 'alerta', label: 'Alertas' },
];

const PgAdm = () => {
  const [activeFilter, setActiveFilter] = useState('todas');
  const [municipio, setMunicipio] = useState('Todos os Municípios');
  const [regiao, setRegiao] = useState('Todas as Regiões');
  const [periodo, setPeriodo] = useState('Últimos 30 dias');

  const filteredActivities = activeFilter === 'todas'
    ? activitiesData
    : activitiesData.filter(a => a.type === activeFilter);

  const maxValue = Math.max(...itensRequisitados.map(i => i.value));

  return (
    <div className="dashboard">
      <aside className="sidebar">
        <ul>
          <li className="active"><FaHome className="icon" /> Home</li>

          <a style={{ textDecoration: 'none', color: 'inherit' }} href="/abrigos">
            <li><FaBoxOpen className="icon" /> Abrigos</li>
          </a>
          <a style={{ textDecoration: 'none', color: 'inherit' }} href="/vitimas">
            <li><FaUser className="icon" /> Vítimas</li>
          </a>
          <li><FaDonate className="icon" /> Doações</li>
          <li><FaMapPin className="icon" />Região Afetada</li>
          <li><GoAlertFill className="icon" /> Ocorrências</li>
          <li><FaUser className="icon" /> Perfil</li>
        </ul>
      </aside>

      <main className="main">


        <header className="top">
          <div>
            {/* Breadcrumb mostrando o nome do abrigo que veio da API */}
            <p style={{ fontSize: '14px', color: '#64748b', margin: 0 }}>
              Home &gt;
            </p>

            {/* Título muda dependendo do modo */}
            <h1 style={{ fontSize: '26px', fontWeight: '700', color: '#0f172a', marginTop: '4px' }}>
              {/* Muda dependendo do modo */}
              {'Home S.O.S. Vale'}
            </h1>
            <p className="subtitle"> Gerencie informações recentes</p>

          </div>
          <div className="top-icons">
            <img src="/src/assets/logo.png" width="80px" alt="Logo" />
          </div>

          <div className="top-controls">
            <button className="notif-btn">
              <FaRegBell />
              <span className="notif-badge">3</span>
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

        <section className="stat-grid">
          {statCards.map(card => (
            <div className={`stat-card stat-card--${card.accent}`} key={card.id}>
              <div className="stat-card-icon">{card.icon}</div>
              <div className="stat-card-value">{card.value}</div>
              <div className="stat-card-label">{card.label}</div>
              <div className="stat-card-unread">
                <span className="dot" /> {card.unread} não lidas
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
                  <button className="activity-btn">Ver solicitação</button>
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
                      <div
                        className="bar-fill"
                        style={{ width: `${(item.value / maxValue) * 100}%` }}
                      />
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
                  <button className="quick-action" key={action.id}>
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

export default PgAdm;