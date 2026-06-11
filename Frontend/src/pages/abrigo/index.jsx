import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { FaHome, FaBoxOpen, FaUser, FaDonate, FaMapPin, FaSearch, FaPlus } from "react-icons/fa";
import { GoAlertFill } from "react-icons/go";

import "../pg_adm/style.css";    
import "./abrigo.css";  

const ListarAbrigos = () => {
  const [abrigos, setAbrigos] = useState([])
  const [busca, setBusca] = useState('')
  const navigate = useNavigate()

  useEffect(() => {
    const buscarAbrigos = async () => {
      const resposta = await fetch('http://localhost:3000/api/abrigos/listar')
      const dados = await resposta.json()
      setAbrigos(dados.abrigos)
    }
    buscarAbrigos()
  }, [])

  const abrigosFiltrados = abrigos.filter(abrigo =>
    abrigo.nome.toLowerCase().includes(busca.toLowerCase())
  )

  const getStatus = (ocupada, total) => {
    const porcentagem = (ocupada / total) * 100
    if (porcentagem >= 100) return { label: 'Lotado', classe: 'status-lotado' }
    if (porcentagem >= 80) return { label: 'Últimas Vagas', classe: 'status-atencao' }
    return { label: 'Com vagas', classe: 'status-vagas' }
  }

  return (
    <div className="dashboard">
      <aside className="sidebar">
        <ul>
          <a href="/pg_adm">
            <li><FaHome className="icon" /> Home</li>
          </a>
          <a href="/abrigo">
            <li className="active"><FaBoxOpen className="icon" /> Abrigos</li>
          </a>
          <a href="/listar_vitimas">
            <li><FaUser className="icon" /> Vítimas</li>
          </a>
          <li><FaDonate className="icon" /> Doações</li>
          <li><FaMapPin className="icon" /> Região Afetada</li>
          <li><GoAlertFill className="icon" /> Ocorrências</li>
          <li><FaUser className="icon" /> Perfil</li>
        </ul>
      </aside>

      <div className="main">
        <header className="main-header">
          <div>
            <h1>Abrigos Cadastrados</h1>
            <p className="subtitle">Gerencie os locais de acolhimento e o nível de ocupação</p>
          </div>
        </header>

        <div className="search-container">
          <div className="search-box">
            <FaSearch className="search-icon" />
            <input
              type="text"
              placeholder="Pesquise por nome do abrigo..."
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
            />
          </div>
          <button className="btn-add-vitima" onClick={() => navigate('../cadastrar-abrigos')}>
            <FaPlus /> Novo Abrigo
          </button>
        </div>

        <div className="abrigos-grid">
          {abrigosFiltrados.map((abrigo) => {
            const status = getStatus(abrigo.capacidadeOcupada, abrigo.capacidadeTotal)
            const porcentagem = (abrigo.capacidadeOcupada / abrigo.capacidadeTotal) * 100

            return (
              <div key={abrigo.id} className="abrigo-card">
                
                <div className="abrigo-card-header">
                  <h3>{abrigo.nome}</h3>
                  <span className="home-badge-icon">🏠</span>
                </div>

                <div className="abrigo-status-row">
                  <span className={`status-badge ${status.classe}`}>
                    {status.label}
                  </span>
                </div>

                <div className="progress-container">
                  <div 
                    className={`progress-bar ${status.classe}`} 
                    style={{ width: `${Math.min(porcentagem, 100)}%` }} 
                  />
                </div>

                <div className="abrigo-info">
                  <p><strong>Capacidade:</strong> {abrigo.capacidadeOcupada} / {abrigo.capacidadeTotal}</p>
                  <p className="endereco">📍 {abrigo.endereco}</p>
                </div>

                <button className="btn-detalhes">
                  Ver Detalhes
                </button>
              </div>
            )
          })}
        </div>

      </div>
    </div>
  )
}

export default ListarAbrigos;