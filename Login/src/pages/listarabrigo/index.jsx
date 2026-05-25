import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

const ListarAbrigos = () => {
  const [abrigos, setAbrigos] = useState([])
  const [busca, setBusca] = useState('')
  const navigate = useNavigate()

  const buscarAbrigos = async () => {
    const resposta = await fetch('http://localhost:3000/api/abrigos/listar')
    const dados = await resposta.json()
    setAbrigos(dados.abrigos)
  }

    useEffect(() => {
    buscarAbrigos()
  }, [])
  
  const abrigosFiltrados = abrigos.filter(abrigo =>
    abrigo.nome.toLowerCase().includes(busca.toLowerCase())
  )

  const getStatus = (ocupada, total) => {
    const porcentagem = (ocupada / total) * 100
    if (porcentagem >= 100) return { label: 'Lotado', cor: '#e74c3c' }
    if (porcentagem >= 80) return { label: 'Últimas Vagas', cor: '#f39c12' }
    return { label: 'Com vagas', cor: '#27ae60' }
  }

  return (
    <div style={{ fontFamily: 'Arial, sans-serif', padding: '20px', maxWidth: '900px', margin: '0 auto' }}>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <input
          type="text"
          placeholder="🔍 Pesquise por nome"
          value={busca}
          onChange={(e) => setBusca(e.target.value)}
          style={{
            padding: '10px 15px',
            borderRadius: '20px',
            border: '1px solid #ccc',
            width: '300px',
            fontSize: '14px'
          }}
        />
        <button
          onClick={() => navigate('/cadastro-abrigo')}
          style={{
            backgroundColor: '#3498db',
            color: 'white',
            border: 'none',
            borderRadius: '50%',
            width: '40px',
            height: '40px',
            fontSize: '24px',
            cursor: 'pointer'
          }}
        >+</button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
        {abrigosFiltrados.map((abrigo) => {
          const status = getStatus(abrigo.capacidadeOcupada, abrigo.capacidadeTotal)
          const porcentagem = (abrigo.capacidadeOcupada / abrigo.capacidadeTotal) * 100

          return (
            <div key={abrigo.id} style={{
              border: '1px solid #e0e0e0',
              borderRadius: '12px',
              padding: '20px',
              backgroundColor: 'white',
              boxShadow: '0 2px 8px rgba(0,0,0,0.08)'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h3 style={{ margin: 0 }}>{abrigo.nome}</h3>
                <span>🏠</span>
              </div>

              <span style={{
                backgroundColor: status.cor,
                color: 'white',
                padding: '4px 10px',
                borderRadius: '20px',
                fontSize: '12px',
                display: 'inline-block',
                marginTop: '10px'
              }}>
                {status.label}
              </span>

              <div style={{ marginTop: '10px', backgroundColor: '#e0e0e0', borderRadius: '10px', height: '8px' }}>
                <div style={{
                  width: `${Math.min(porcentagem, 100)}%`,
                  backgroundColor: status.cor,
                  height: '8px',
                  borderRadius: '10px'
                }} />
              </div>

              <p style={{ fontSize: '14px', color: '#555' }}>
                Capacidade: {abrigo.capacidadeOcupada}/{abrigo.capacidadeTotal}
              </p>

              <p style={{ fontSize: '14px', color: '#555' }}>
                📍 {abrigo.endereco}
              </p>

              <button style={{
                backgroundColor: '#2c3e7a',
                color: 'white',
                border: 'none',
                borderRadius: '20px',
                padding: '8px 20px',
                cursor: 'pointer',
                width: '100%',
                marginTop: '10px'
              }}>
                Detalhes
              </button>
            </div>
          )
        })}
      </div>
    </div>
  )
}

export default ListarAbrigos;