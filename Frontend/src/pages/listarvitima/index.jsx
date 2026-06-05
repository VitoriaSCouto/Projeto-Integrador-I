import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { FaHome, FaBoxOpen, FaUser, FaDonate, FaMapPin, FaSearch, FaPlus } from "react-icons/fa";
import { GoAlertFill } from "react-icons/go";

// IMPORTAÇÃO DOS DOIS CSS (Global e o Específico de Vítimas)
import "../pg_adm/style.css";      
import "./vitima.css";   

const ListarVitimas = () => {
  const [vitimas, setVitimas] = useState([])
  const [busca, setBusca] = useState('')
  const navigate = useNavigate()

  useEffect(() => {
    const buscarVitimas = async () => {
      const resposta = await fetch('http://localhost:3000/api/vitimas/listar')
      const dados = await resposta.json()
      setVitimas(dados.vitimas)
    }
    buscarVitimas()
  }, [])

  const vitimasFiltradas = vitimas.filter(vitima =>
    vitima.nome.toLowerCase().includes(busca.toLowerCase())
  )

  return (
    <div className="dashboard">
      
      {/* Sidebar - Puxando o estilo estrutural do style.css global */}
      <aside className="sidebar">
        <ul>
          <a href="/pg_adm">
            <li><FaHome className="icon" /> Home</li>
          </a>
          <a href="/abrigo">
            <li><FaBoxOpen className="icon" /> Abrigos</li>
          </a>
          <a href="/listar_vitimas">
            <li className="active"><FaUser className="icon" /> Vítimas</li>
          </a>
          <li><FaDonate className="icon" /> Doações</li>
          <li><FaMapPin className="icon" /> Região Afetada</li>
          <li><GoAlertFill className="icon" /> Ocorrências</li>
          <li><FaUser className="icon" /> Perfil</li>
        </ul>
      </aside>

      {/* Conteúdo principal */}
      <div className="main">
        
        <header className="main-header">
          <div>
            <h1>Vítimas Registradas</h1>
            <p className="subtitle">Consulte, gerencie informações de contato e faça a triagem dos cidadãos afetados</p>
          </div>
        </header>

        {/* Barra de busca e botão de cadastro */}
        <div className="search-container">
          <div className="search-box">
            <FaSearch className="search-icon" />
            <input
              type="text"
              placeholder="Pesquise por nome da vítima..."
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
            />
          </div>
          <button className="btn-add-vitima" onClick={() => navigate('/cadastro_vitima')}>
            <FaPlus /> Nova Vítima
          </button>
        </div>

        {/* Grid de cards de vítimas */}
        <div className="vitimas-grid">
          {vitimasFiltradas.map((vitima) => (
            <div key={vitima.id} className="vitima-card">

              {/* Foto/Avatar maior e Nome da vítima alinhados */}
              <div className="vitima-card-header">
                {vitima.fotoPerfil ? (
                  <img src={vitima.fotoPerfil} alt={vitima.nome} className="vitima-avatar" />
                ) : (
                  <div className="vitima-avatar-placeholder">👤</div>
                )}
                <h3>{vitima.nome}</h3>
              </div>

              {/* Corpo de informações da vítima */}
              <div className="vitima-info">
                <p><strong>📋 CPF:</strong> {vitima.cpf}</p>
                <p><strong>📞 Telefone:</strong> {vitima.telefone}</p>
                <p><strong>👤 Gênero:</strong> {vitima.genero}</p>
              </div>

              {/* Botão de detalhes */}
              <button className="btn-detalhes">
                Ver Detalhes
              </button>
            </div>
          ))}
        </div>

      </div>
    </div>
  )
}

export default ListarVitimas;