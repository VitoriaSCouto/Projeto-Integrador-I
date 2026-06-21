import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { FaHome, FaBoxOpen, FaUser, FaDonate, FaMap, FaSearch, FaPlus, FaPhoneAlt, FaIdCard } from "react-icons/fa";
import { GoAlertFill } from "react-icons/go";
import { FaGear } from "react-icons/fa6";

// IMPORTAÇÃO DOS DOIS CSS (Global e o Específico de Vítimas)
import "../../pg_adm/style.css";      
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
          <a href="/abrigos">
            <li><FaBoxOpen className="icon" /> Abrigos</li>
          </a>
          <a href="/vitimas"><li className="active"><FaUser className="icon" /> Vítimas</li></a>
          <li><FaDonate className="icon" /> Doações</li>
          <a href="/mapa"><li><FaMap className="icon" />Mapa</li></a>
          <li><GoAlertFill className="icon" /> Ocorrências</li>
          <a href="/configuracoes"><li><FaGear className="icon" /> Configurações</li></a>
        </ul>
      </aside>

      {/* Conteúdo principal */}
      <div className="main">
        
        <header className="top">
          <div>

            {/* Breadcrumb mostrando o nome do abrigo que veio da API */}
            <p style={{ fontSize: '14px', color: '#64748b', margin: 0 }}>
              Vítimas &gt;
            </p>

            {/* Título muda dependendo do modo */}
            <h1 style={{ fontSize: '26px', fontWeight: '700', color: '#0f172a', marginTop: '4px' }}>

              
            {/* Muda dependendo do modo */}
            {'Hub de Vitimas'}
            </h1>
            <p className="subtitle"> Consulte, cadastre ou gerencie vitímas</p>

          </div>
          <div className="top-icons">
            <img src="/src/assets/logo.png" width="80px" alt="Logo" />
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
          <button className="btn-add-vitima" onClick={() => navigate('/cadastro-vitima')}>
            <FaPlus /> Nova Vítima
          </button>
        </div>

        {/* Grid de cards de vítimas */}
        <div className="vitimas-grid">
          {vitimasFiltradas.map((vitima) => (
            <div key={vitima.id} className="vitima-card">

              {/* Foto/Avatar maior e Nome da vítima alinhados */}
              <div className="vitima-card-header">
                {vitima.fotoVitima ? (
                  <img src={vitima.fotoVitima} alt={vitima.nome} className="vitima-avatar" />
                ) : (
                  <div className="vitima-avatar-placeholder"><FaUser></FaUser></div>
                )}
                <h3>{vitima.nome}</h3>
              </div>

              {/* Corpo de informações da vítima */}
              <div className="vitima-info">
                <p><strong><FaIdCard/> CPF:</strong> {vitima.cpf}</p>
                <p><strong><FaPhoneAlt/> Telefone:</strong> {vitima.telefone}</p>
                <p><strong><FaUser/> Gênero:</strong> {vitima.genero}</p>
              </div>

              {/* Botão de detalhes */}
              <a href={`/detalhes-vitimas/${vitima.id}`}>
              <button className="btn-detalhes">
                Ver Detalhes
              </button>
              </a>
            </div>
          ))}
        </div>

      </div>
    </div>
  )
}

export default ListarVitimas;