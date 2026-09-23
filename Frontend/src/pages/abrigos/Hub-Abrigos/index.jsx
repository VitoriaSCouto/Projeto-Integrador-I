import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { FaHome, FaBoxOpen, FaUser, FaDonate, FaMapPin, FaSearch, FaPlus, FaSchool,FaBasketballBall, FaChurch, FaHotel, FaBed, FaMapMarkedAlt,
  FaPalette, FaUsers, FaTree, FaCircle, FaMap } from "react-icons/fa";
import { FaLocationDot } from "react-icons/fa6";
import { GoAlertFill } from "react-icons/go";
import { FaGear } from "react-icons/fa6";

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


  //Fiz a mão de ultima hora, só para ter mesmo
  //Muda com base no status
  const VerdCinza = '#e2fbf0'
  const AmarCinza = '#fff3e0'
  const VermCinza = '#ffebee'
  const tipoBolaStatus = (tipo)=> {
    switch (tipo)
    {
      case 'ativo':       return <span><FaCircle style={{color:'#93fb73'}}/><FaCircle style={{color:VerdCinza}}/><FaCircle style={{color:VerdCinza}}/></span>;
      case 'manutencao':  return <span><FaCircle style={{color:AmarCinza}}/><FaCircle style={{color:'#ffff66'}}/><FaCircle style={{color:AmarCinza}}/></span>;
      case 'desativado':  return <span><FaCircle style={{color:VermCinza}}/><FaCircle style={{color:VermCinza}}/><FaCircle style={{color:'#ff6666'}}/></span>;
    }
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
        <div className="top-icons">
          <img src="src/assets/logo.png" width="70px" />
          <p>S.O.S. Vale</p>
        </div>
        <ul>
          <a href="/pg_adm">
            <li><FaHome className="icon" /> Home</li>
          </a>
          <a href="/abrigos">
            <li className="active"><FaBoxOpen className="icon" /> Abrigos</li>
          </a>
          <a href="/vitimas">
            <li><FaUser className="icon" /> Vítimas</li>
          </a>
          <li><FaDonate className="icon" /> Doações</li>
          <a href="/mapa">
            <li><FaMap className="icon" /> Mapa</li>
          </a>
          <a href="/alertas"><li><GoAlertFill className="icon" /> Alertas</li></a>
          <li><FaGear className="icon" /> Configurações</li>
        </ul>
      </aside>

      <div className="main">

        <header className="top">
          <div>
            {/* Breadcrumb mostrando o nome do abrigo que veio da API */}
            <p style={{ fontSize: '14px', color: '#64748b', margin: 0 }}>
              Abrigos &gt;
            </p>
            {/* Título muda dependendo do modo */}
            <h1 style={{ fontSize: '26px', fontWeight: '700', color: '#0f172a', marginTop: '4px' }}>
              {/* Muda dependendo do modo */}
              {'Hub de Abrigos'}
            </h1>
            <p className="subtitle"> Consulte, gerencie, atualize ou delete informações de abrigos</p>
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
      <div style={{ display: 'flex', gap: '16px', marginLeft: 'auto' }}>
  <button
    className="btn-add-vitima"
    onClick={() => navigate('../listar-solicitação-abrigo')}
    style={{ background: '#fff', color: '#0f172a', border: '1.5px solid #cbd5e1' }}
  >
    <FaHome /> Ver solicitações de abrigo
  </button>
  <button className="btn-add-vitima" onClick={() => navigate('../cadastrar-abrigos')}>
    <FaPlus /> Novo Abrigo
  </button>
</div>
        </div>

        <div className="abrigos-grid">
          {abrigosFiltrados.map((abrigo) => {
            const status = getStatus(abrigo.capacidadeOcupada, abrigo.capacidadeTotal)
            const porcentagem = (abrigo.capacidadeOcupada / abrigo.capacidadeTotal) * 100

            return (
              <div key={abrigo.id} className="abrigo-card">
                
              <div className="abrigo-card-header">
                <h3>{abrigo.nome}</h3>

                {/* Agrupa bolinhas + ícone no canto direito */}
                <div className="card-header-right">
                  <p>{tipoBolaStatus(abrigo.status)}</p>
                  <span className="home-badge-icon">
                    {tipoEmoji(abrigo.tipoAbrigo)}
                  </span>
                </div>
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
                  <p className="endereco"><FaMapMarkedAlt className="endereco-icon"/> {abrigo.cidade}</p>
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