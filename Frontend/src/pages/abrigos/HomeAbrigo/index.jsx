import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { FaHome, FaBoxOpen, FaUser, FaDonate, FaMapPin, FaSearch, FaPlus, FaSchool,FaBasketballBall, FaChurch, FaHotel, FaBed, 
  FaPalette, FaUsers, FaTree  } from "react-icons/fa";
import { FaLocationDot } from "react-icons/fa6";
import { GoAlertFill } from "react-icons/go";

import "../../pg_adm/style.css";  
import "./abrigo.css";  

const ListarAbrigos = () => {
  const [abrigos, setAbrigos] = useState([])
  const [busca, setBusca] = useState('')
  const navigate = useNavigate()

  useEffect(() => {
    const buscarAbrigos = async () => {
      const resposta = await fetch('http://localhost:3000/api/abrigos/listar')
      const dados = await resposta.json()
      console.log(dados.abrigos)

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


  const tipoEmoji = (tipo) => {
  switch (tipo) {
    case 'Escola':       return <FaSchool className="icon" />;
    case 'Ginásio':      return <FaBasketballBall className="icon" />;
    case 'Igreja':       return <FaChurch className="icon" />;
    case 'Hotel':        return <FaHotel className="icon" />;
    case 'Pousada':      return <FaBed className="icon" />;
    case 'Centro Cultural':    return <FaPalette className="icon" />;
    case 'Centro Comunitário': return <FaUsers className="icon" />;
    case 'Campo':        return <FaTree className="icon" />;
    default:             return <FaBoxOpen className="icon" />;
  }
  };

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
                  <span className="home-badge-icon">
                    {tipoEmoji(abrigo.tipoAbrigo)}
                  </span>
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
                  <p className="endereco"><FaLocationDot className="endereco-icon"/> {abrigo.endereco}</p>
                </div>

                <a href={`/detalhes-abrigos/${abrigo.id}`} className="detalhes-link"><button className="btn-detalhes">
                  
                  Ver Detalhes
                </button></a>
              </div>
            )
          })}
        </div>

      </div>
    </div>
  )
}

export default ListarAbrigos;