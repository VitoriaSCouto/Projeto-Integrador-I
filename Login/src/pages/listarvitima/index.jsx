import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

const ListarVitimas = () => {
  // Estado para guardar a lista de vítimas
  const [vitimas, setVitimas] = useState([])

  // Estado para guardar o termo de busca
  const [busca, setBusca] = useState('')

  // Hook para navegar entre páginas
  const navigate = useNavigate()

  // Função que busca as vítimas da API
  useEffect(() => {
  const buscarVitimas = async () => { // função dentro
    const resposta = await fetch('http://localhost:3000/api/vitimas/listar')
    const dados = await resposta.json()
    setVitimas(dados.vitimas)
  }
  buscarVitimas() // chama logo em seguida
}, [])

  // Filtra as vítimas pelo nome digitado na busca
  const vitimasFiltradas = vitimas.filter(vitima =>
    vitima.nome.toLowerCase().includes(busca.toLowerCase())
  )

  return (
    <div style={{ fontFamily: 'Arial, sans-serif', padding: '20px', maxWidth: '900px', margin: '0 auto' }}>

      {/* Barra de busca e botão de cadastro */}
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
        {/* Botão + para cadastrar nova vítima */}
        <button
          onClick={() => navigate('/cadastro_vitima')}
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

      {/* Grid de cards de vítimas */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
        {vitimasFiltradas.map((vitima) => (
          <div key={vitima.id} style={{
            border: '1px solid #e0e0e0',
            borderRadius: '12px',
            padding: '20px',
            backgroundColor: 'white',
            boxShadow: '0 2px 8px rgba(0,0,0,0.08)'
          }}>

            {/* Foto e nome da vítima */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              {/* Se tiver foto mostra a imagem, senão mostra um emoji */}
              {vitima.fotoPerfil
                ? <img src={vitima.fotoPerfil} alt={vitima.nome} style={{ width: '50px', height: '50px', borderRadius: '50%', objectFit: 'cover' }} />
                : <span style={{ fontSize: '40px' }}>👤</span>
              }
              <h3 style={{ margin: 0 }}>{vitima.nome}</h3>
            </div>

            {/* Informações da vítima */}
            <p style={{ fontSize: '14px', color: '#555' }}>
              📋 CPF: {vitima.cpf}
            </p>
            <p style={{ fontSize: '14px', color: '#555' }}>
              📞 Telefone: {vitima.telefone}
            </p>
            <p style={{ fontSize: '14px', color: '#555' }}>
              👤 Gênero: {vitima.genero}
            </p>

            {/* Botão de detalhes */}
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
        ))}
      </div>
    </div>
  )
}

export default ListarVitimas;