import './style.css'
import { IoMdHome } from "react-icons/io";
import { FaBoxOpen , FaMapPin, FaRegBell, FaUser, FaHome, FaDonate } from "react-icons/fa";
import { GoAlertFill } from "react-icons/go";
import { FaHeart, FaGear } from "react-icons/fa6";

const PgAdm = () => {
  return (
    <div className="dashboard">
      <aside className="sidebar"> {/* Corrigido de class para className para seguir o padrão React */}
        <ul>
          {/* AQUI: Corrigido de classNme para className */}
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
          <p>Olá, Administrador(a)!</p>
          <div className="top-icons">
           <img src="src/assets/logo.png" width="80px" />
          </div>
        </header>

        <div className="text-alert">  
          <h3>Alertas Recentes</h3>
        </div>
        <section className="alerts">
          <div className="alert">
            ⚠️ Níveis de água estão subindo no canal de drenagem de Caçapava
            <span>20min</span>
          </div>

          <div className="alert">
            ⚠️ Princípios de queimadas na região de Taubaté
            <span>50min</span>
          </div>

          <div className="alert">
            ⚠️ Deslizamento na rodovia Osvaldo Cruz
            <span>2 horas</span>
          </div>
        </section>

        <div className="text-acoes"><h3>Ações Rápidas</h3></div>
        <section className="actions">
          <div className="cards">
            <div className="card"><img src="src/assets/doacao.jpeg" /><p>Registrar Doação</p></div>
            <div className="card"><img src="src/assets/regiao.jpeg" /><p>Atualizar Regiões</p></div>
            <div className="card"><img src="src/assets/user.jpeg" /><p>Visualizar Municípios</p></div>
            <div className="card"><img src="src/assets/voluntario.jpeg" /><p>Visualizar Voluntários</p></div>
          </div>
        </section>
      </main>
    </div>
  );
}

export default PgAdm;