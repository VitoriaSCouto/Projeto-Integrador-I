import { FaHome, FaUser, FaMap, FaHandHoldingHeart } from 'react-icons/fa';
import { FiLogOut } from 'react-icons/fi';
import logo from '../assets/logo.png';

// Sidebar do módulo VOLUNTÁRIO — usada em todas as telas do voluntário.
// O voluntário não tem acesso às telas do admin, então nenhum item leva para elas.
// "ativo" recebe o id do item que deve aparecer selecionado.
const itens = [
  { id: 'home',   href: '/painel-voluntario',             label: 'Home',                  icone: <FaHome className="icon" /> },
  { id: 'ajuda',  href: '/solicitacoes-ajuda-voluntario', label: 'Solicitações de ajuda', icone: <FaHandHoldingHeart className="icon" /> },
  { id: 'mapa',   href: '/voluntario/mapa',               label: 'Mapa de abrigos',       icone: <FaMap className="icon" /> },
  { id: 'perfil', href: '/painel-voluntario?aba=perfil',  label: 'Meu perfil',            icone: <FaUser className="icon" /> },
]

function SidebarVoluntario({ ativo }) {

  const sair = () => {
    localStorage.removeItem('token_voluntario')
    localStorage.removeItem('voluntario')
    // Volta para a seleção de módulo (Administrador / Voluntário / Munícipe)
    window.location.href = '/'
  }

  return (
    <aside className="sidebar">
      <div className="top-icons">
        <img src={logo} width="70px" alt="Logo S.O.S Vale" />
        <p>S.O.S. Vale</p>
      </div>
      <ul>
        {itens.map(item => (
          <a key={item.id} href={item.href}>
            <li className={item.id === ativo ? 'active' : undefined}>
              {item.icone} {item.label}
            </li>
          </a>
        ))}
      </ul>

      <div className="sidebar-footer">
        <button className="logout-btn" onClick={sair}>
          <FiLogOut className="icon" /> Sair
        </button>
      </div>
    </aside>
  )
}

export default SidebarVoluntario;
