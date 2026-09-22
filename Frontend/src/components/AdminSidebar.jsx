import { NavLink } from 'react-router-dom';
import { FaHome, FaBoxOpen, FaUser, FaDonate, FaRegBell } from 'react-icons/fa';
import { FaMap, FaGear } from 'react-icons/fa6';
import { GoAlertFill } from 'react-icons/go';
import logo from '../assets/logo.png';
import './AdminSidebar.css';
const itens = [
  { nome: 'Home', rota: '/pg_adm', Icone: FaHome },
  { nome: 'Abrigos', rota: '/abrigos', Icone: FaBoxOpen },
  { nome: 'Vítimas', rota: '/vitimas', Icone: FaUser },
  { nome: 'Doações', Icone: FaDonate },
  { nome: 'Mapa', rota: '/mapa', Icone: FaMap },
  { nome: 'Alertas', rota: '/alertas', Icone: FaRegBell },
  { nome: 'Ocorrências', Icone: GoAlertFill },
  { nome: 'Configurações', Icone: FaGear },
];
export default function AdminSidebar() {
  return <aside className="admin-sidebar">
    <NavLink to="/pg_adm" className="admin-brand"><img src={logo} alt="" /><span>S.O.S. Vale</span></NavLink>
    <nav aria-label="Menu administrativo"><ul>{itens.map((item) => { const { nome, rota, Icone } = item; return <li key={nome}>
      {rota ? <NavLink to={rota} className={({ isActive }) => `admin-nav-item${isActive ? ' admin-nav-active' : ''}`}><Icone aria-hidden="true" />{nome}</NavLink>
        : <span className="admin-nav-item admin-nav-disabled" aria-disabled="true"><Icone aria-hidden="true" />{nome}</span>}
    </li>; })}</ul></nav>
  </aside>;
}
