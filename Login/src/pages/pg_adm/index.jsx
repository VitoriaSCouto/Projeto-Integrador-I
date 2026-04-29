import './style.css'

import { IoMdHome } from "react-icons/io";
import { FaBoxOpen , FaMapPin, FaRegBell, FaUser, FaHome, FaDonate } from "react-icons/fa";
import { GoAlertFill } from "react-icons/go";
import { FaHeart, FaGear } from "react-icons/fa6";

const PgAdm = () => {
  return (
    <div class="dashboard">
 
      <aside class="sidebar">
        <ul>
          <li class="active"><FaHome className= "icon" /> Home</li>
          <li><FaBoxOpen  className= "icon" /> Abrigos</li>
          <li>< FaDonate className= "icon" /> Doações</li>
          <li><FaMapPin className= "icon" />Regiões Afetadas</li>
          <li><GoAlertFill className= "icon" /> Ocorrências</li>
          <li><FaHeart className= "icon" /> Necessidades</li>
          <li><FaGear className= "icon" /> Configurações</li>
        </ul>
      </aside>


      <main class="main">

        
        <header class="top">
          <h1>Olá, Administrador(a)!</h1>
          <div class="top-icons">
            <FaRegBell className= "icon2" /> 
            <FaUser className= "icon3" /> 
           <img src="src/assets/logo.png" width= "80px" />
          </div>
        </header>


        <section class="alerts">
          <h3>Alertas Recentes</h3>

          <div class="alert">
            ⚠️ Níveis de água estão subindo no canal de drenagem de Caçapava
            <span>20min</span>
          </div>

          <div class="alert">
            ⚠️ Princípios de queimadas na região de Taubaté
            <span>50min</span>
          </div>

          <div class="alert">
            ⚠️ Deslizamento na rodovia Osvaldo Cruz
            <span>2 horas</span>
          </div>
        </section>


        <section class="actions">
          <h3>Ações Rápidas</h3>

          <div class="cards">
            <div class="card"><img src="src/assets/doacao.jpeg" /><p>Registrar Doação</p></div>
            <div class="card"><img src="src/assets/regiao.jpeg" /><p>Atualizar Regiões</p></div>
            <div class="card"><img src="src/assets/user.jpeg" /><p>Visualizar Municípios</p></div>
            <div class="card"><img src="src/assets/voluntario.jpeg" /><p>Visualizar Voluntários</p></div>
          </div>
        </section>

      </main>

    </div>
  );
}

export default PgAdm;