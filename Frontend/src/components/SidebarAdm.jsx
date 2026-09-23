import {
  FaHome, FaBoxOpen, FaUser, FaDonate, FaMap, FaUsers, FaMapMarkedAlt
} from 'react-icons/fa';
import { FaGear } from 'react-icons/fa6';
import { GoAlertFill } from 'react-icons/go';
import logo from '../assets/logo.png';

// Sidebar do painel administrativo
// "ativo" recebe o id do item que deve aparecer selecionado
const itens = [
  { id: 'home',      href: '/pg_adm',   label: 'Home',      icone: <FaHome className="icon" /> },
  { id: 'abrigos',   href: '/abrigos',  label: 'Abrigos',   icone: <FaBoxOpen className="icon" /> },
  { id: 'vitimas',   href: '/vitimas',  label: 'Vítimas',   icone: <FaUser className="icon" /> },
  { id: 'doacoes',   href: null,        label: 'Doações',   icone: <FaDonate className="icon" /> },
  { id: 'mapa',      href: '/mapa',     label: 'Mapa',      icone: <FaMap className="icon" /> },
  { id: 'alertas',   href: '/alertas',  label: 'Alertas',   icone: <GoAlertFill className="icon" /> },
  { id: 'inscritos', href: '/inscritos', label: 'Inscritos', icone: <FaUsers className="icon" /> },
  { id: 'regioes',   href: '/regioes',  label: 'Regiões',   icone: <FaMapMarkedAlt className="icon" /> },
  { id: 'config',    href: null,        label: 'Configurações', icone: <FaGear className="icon" /> },
]

function SidebarAdm({ ativo }) {
  return (
    <aside className="sidebar">
      <div className="top-icons">
        <img src={logo} width="70px" alt="Logo S.O.S Vale" />
        <p>S.O.S. Vale</p>
      </div>
      <ul>
        {itens.map(item => {
          const li = (
            <li className={item.id === ativo ? 'active' : undefined}>
              {item.icone} {item.label}
            </li>
          )
          return item.href
            ? <a key={item.id} href={item.href}>{li}</a>
            : <span key={item.id}>{li}</span>
        })}
      </ul>
    </aside>
  )
}

export default SidebarAdm;
