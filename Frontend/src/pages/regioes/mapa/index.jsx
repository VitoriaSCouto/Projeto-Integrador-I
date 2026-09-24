//--------- Imports-----------
//Todos os imports necessarios para o código

import { useState, useEffect } from 'react';
import { useNavigate } from "react-router-dom";
import {
  FaHome, FaBoxOpen, FaUser, FaDonate, FaMapPin,
  FaSearch, FaPlus, FaMap
} from 'react-icons/fa';
import { GoAlertFill } from "react-icons/go";
import { FaGear } from "react-icons/fa6";
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import SidebarAdm from '../../../components/SidebarAdm';
import SidebarVoluntario from '../../../components/SidebarVoluntario';
import "../../pg_adm/style.css";

//Fim dos imports
//--------------------------

// ─── Correção de ícone padrão do Leaflet no Vite ───────────────────────────
// O Vite não resolve os assets do Leaflet automaticamente, então precisamos
// apontar manualmente para os ícones do pacote
delete L.Icon.Default.prototype._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl:       'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl:     'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
})

// ─── Ícones customizados ────────────────────────────────────────────────────
// Ícone azul para abrigos ativos com vagas disponíveis
const iconeAzul = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-blue.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
})

// Ícone vermelho para abrigos cheios ou inativos
const iconeVermelho = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-red.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
})

// ─── Cidades do Vale do Paraíba disponíveis no select ──────────────────────
// Cada cidade tem coordenadas e zoom definidos para o flyTo do mapa
const CIDADES = [
  { nome: 'Todas',               lat: -23.0,    lng: -45.55,   zoom: 9  },
  { nome: 'Taubaté',             lat: -23.0268, lng: -45.5557, zoom: 13 },
  { nome: 'Caçapava',            lat: -23.1008, lng: -45.7069, zoom: 13 },
  { nome: 'Pindamonhangaba',     lat: -22.9238, lng: -45.4603, zoom: 13 }
]

// ─── Componente auxiliar: voa para a cidade selecionada no select ───────────
// Precisa estar dentro do MapContainer para ter acesso ao useMap()
function ControladorCidade({ cidade }) {
  const map = useMap()
  useEffect(() => {
    if (cidade) {
      map.flyTo([cidade.lat, cidade.lng], cidade.zoom, { duration: 1.2 })
    }
  }, [cidade, map])
  return null
}

// ─── Componente auxiliar: voa para o abrigo selecionado na busca ────────────
// Também precisa estar dentro do MapContainer
function VoarParaAbrigo({ alvo }) {
  const map = useMap()
  useEffect(() => {
    if (alvo?.latitude && alvo?.longitude) {
      map.flyTo([alvo.latitude, alvo.longitude], 16, { duration: 1.2 })
    }
  }, [alvo, map])
  return null
}

//------- Começo Função Principal -----
// modulo: 'admin' (rota /mapa) ou 'voluntario' (rota /voluntario/mapa)
// muda só a sidebar e esconde o botão de gerenciar regiões para o voluntário
function Mapa({ modulo = 'admin' }) {

  const ehVoluntario = modulo === 'voluntario'
  const sidebar = ehVoluntario ? <SidebarVoluntario ativo="mapa" /> : <SidebarAdm ativo="mapa" />

  // ─── ESTADOS ────────────────────────────────────────────────
  const navigate = useNavigate()

  // Lista de abrigos vindos da API — já trazem latitude e longitude do banco
  // Não precisamos mais de geocoding aqui, as coordenadas vêm prontas
  const [abrigos, setAbrigos] = useState([])

  // Cidade selecionada no select (objeto de CIDADES)
  const [cidadeSelecionada, setCidadeSelecionada] = useState(CIDADES[0])

  // Texto digitado na barra de busca
  const [busca, setBusca] = useState('')

  // Sugestões que aparecem ao digitar na busca
  const [sugestoes, setSugestoes] = useState([])

  // Abrigo alvo para voar no mapa após selecionar uma sugestão
  const [abrigoAlvo, setAbrigoAlvo] = useState(null)

  // Controla o loading enquanto os abrigos são buscados na API
  const [carregando, setCarregando] = useState(true)


  //-------- Busca dos dados ao carregar a página ----------------

  useEffect(() => {

    // Busca todos os abrigos da API
    // Diferente da versão anterior, não precisamos mais geocodificar aqui
    // As coordenadas já vêm prontas do banco (latitude e longitude)
    const buscarAbrigos = async () => {
      setCarregando(true)
      try {
        const resposta = await fetch('http://localhost:3000/api/abrigos/listar')
        const dados = await resposta.json()
        setAbrigos(dados.abrigos)
      } catch (erro) {
        console.error('Erro ao buscar abrigos:', erro)
      } finally {
        setCarregando(false)
      }
    }

    // Roda ao montar o componente
    buscarAbrigos()

  }, []) // Sem dependências: roda só uma vez ao montar o componente


  //-------- Handlers --------
  // Funções usadas nos eventos da tela

  // Handler da barra de busca
  // Filtra os abrigos pelo nome ou cidade conforme o usuário digita
  const handleBusca = (e) => {
    const valor = e.target.value
    setBusca(valor)

    if (valor.trim().length < 2) {
      setSugestoes([])
      return
    }

    const termo = valor.toLowerCase()
    // Filtra abrigos cujo nome ou cidade contém o termo digitado
    const filtrados = abrigos.filter(
      a => a.nome.toLowerCase().includes(termo) || a.cidade.toLowerCase().includes(termo)
    )
    setSugestoes(filtrados.slice(0, 6))
  }

  // Handler ao clicar em uma sugestão
  // Preenche a busca com o nome do abrigo e voa até ele no mapa
  const handleSelecionarSugestao = (abrigo) => {
    setBusca(abrigo.nome)
    setSugestoes([])
    setAbrigoAlvo(abrigo)
  }


  //-------- Helpers --------
  // Funções auxiliares pequenas usadas no JSX

  // Determina o ícone do marcador com base no status e ocupação do abrigo
  // Azul = com vagas e ativo | Vermelho = cheio ou inativo
  const iconeDoAbrigo = (abrigo) => {
    const cheio = abrigo.capacidadeOcupada >= abrigo.capacidadeTotal
    const inativo = abrigo.status !== 'ativo'
    return (cheio || inativo) ? iconeVermelho : iconeAzul
  }

  // Calcula a porcentagem de ocupação para a barra de progresso do popup
  const porcentagemOcupacao = (abrigo) => {
    if (!abrigo.capacidadeTotal) return 0
    return Math.min(100, Math.round((abrigo.capacidadeOcupada / abrigo.capacidadeTotal) * 100))
  }


  //------- Tela de loading ------
  // Enquanto a API responde, mostra mensagem para o usuário não ver a tela vazia
  if (carregando) {
    return (
      <div className="dashboard">
          {sidebar}
        <main className="main">
          <p style={{ padding: '40px', color: '#64748b' }}>Carregando mapa...</p>
        </main>
      </div>
    )
  }


  //------- Tela Principal (Carregado) ------
  return (

    <div className="dashboard">

      {/* Código do Sidebar */}
              {sidebar}

      {/* Código do Main */}
      <main className="main">

        <header className="top">
          <div>
            {/* Breadcrumb */}
            <p style={{ fontSize: '14px', color: '#64748b', margin: 0 }}>
              Mapa &gt;
            </p>
            <h1 style={{ fontSize: '26px', fontWeight: '700', color: '#0f172a', marginTop: '4px' }}>
              Mapa de Abrigos
            </h1>
            <p className="subtitle">Visualize os abrigos cadastrados nas cidades do Vale do Paraíba</p>
          </div>
        </header>

        {/* ─── Barra de controles: select de cidade + busca + botão cadastrar ─── */}
        <div style={{ display: 'flex', gap: '12px', alignItems: 'center', marginBottom: '12px', flexWrap: 'wrap' }}>

          {/* Select de cidades — ao mudar, o mapa voa até a cidade escolhida */}
          <select
            value={cidadeSelecionada.nome}
            onChange={e => setCidadeSelecionada(CIDADES.find(c => c.nome === e.target.value))}
            style={{ padding: '9px 14px', borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '14px', background: '#fff', color: '#0f172a', cursor: 'pointer', minWidth: '180px' }}
          >
            {CIDADES.map(c => (
              <option key={c.nome} value={c.nome}>{c.nome}</option>
            ))}
          </select>

          {/* Barra de busca com dropdown de sugestões */}
          {/* Ao digitar, filtra abrigos por nome ou cidade */}
          {/* Ao clicar numa sugestão, o mapa voa até o abrigo */}
          <div style={{ position: 'relative', flex: 1, minWidth: '240px' }}>
            <FaSearch style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8', fontSize: '14px' }} />
            <input
              style={{ width: '100%', padding: '9px 14px 9px 36px', borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '14px', background: '#fff', color: '#0f172a', boxSizing: 'border-box' }}
              placeholder="Pesquise por abrigo ou cidade..."
              value={busca}
              onChange={handleBusca}
              // O setTimeout evita que o dropdown feche antes do clique na sugestão ser registrado
              onBlur={() => setTimeout(() => setSugestoes([]), 200)}
            />

            {/* Dropdown de sugestões — aparece ao digitar 2 ou mais caracteres */}
            {sugestoes.length > 0 && (
              <ul style={{ position: 'absolute', top: 'calc(100% + 4px)', left: 0, right: 0, background: '#fff', border: '1px solid #e2e8f0', borderRadius: '8px', listStyle: 'none', margin: 0, padding: '4px 0', zIndex: 9999, boxShadow: '0 4px 16px rgba(0,0,0,0.10)' }}>
                {sugestoes.map(a => (
                  <li
                    key={a.id}
                    onMouseDown={() => handleSelecionarSugestao(a)}
                    style={{ display: 'flex', flexDirection: 'column', padding: '8px 14px', cursor: 'pointer' }}
                  >
                    <span style={{ fontSize: '14px', fontWeight: '600', color: '#0f172a' }}>{a.nome}</span>
                    <span style={{ fontSize: '12px', color: '#64748b' }}>{a.cidade}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* Botão de gerenciar regiões — só para o admin */}
          {!ehVoluntario && (
            <button
              type="button"
              onClick={() => navigate('/regioes')}
              style={{ display: 'flex', alignItems: 'center', gap: '6px', background: '#1e3a5f', color: '#fff', border: 'none', borderRadius: '8px', padding: '10px 18px', fontSize: '14px', fontWeight: '600', cursor: 'pointer', whiteSpace: 'nowrap' }}
            >
              <FaPlus /> Gerenciar regiões
            </button>
          )}

        </div>

        {/* ─── Legenda dos marcadores ─── */}
        <div style={{ display: 'flex', gap: '20px', marginBottom: '10px' }}>
          <span style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', color: '#475569' }}>
            <span style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#2563eb', display: 'inline-block' }} />
            Com vagas
          </span>
          <span style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', color: '#475569' }}>
            <span style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#dc2626', display: 'inline-block' }} />
            Sem vagas / Inativo
          </span>
          {/* Aviso para abrigos sem coordenadas cadastradas */}
          {abrigos.some(a => !a.latitude || !a.longitude) && (
            <span style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', color: '#f59e0b' }}>
              ⚠️ {abrigos.filter(a => !a.latitude || !a.longitude).length} abrigo(s) sem localização cadastrada
            </span>
          )}
        </div>

        {/* ─── Mapa Leaflet ─── */}
        {/* O MapContainer é o componente principal do React Leaflet */}
        {/* center e zoom definem a posição inicial — centralizado no Vale do Paraíba */}
        <div style={{ height: '520px', borderRadius: '12px', overflow: 'hidden', border: '1px solid #e2e8f0', marginBottom: '24px' }}>
          <MapContainer
            center={[-23.0, -45.55]}
            zoom={9}
            style={{ width: '100%', height: '100%' }}
          >

            {/* Tiles do OpenStreetMap — gratuito, sem API Key */}
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />

            {/* Voa para a cidade selecionada no select */}
            <ControladorCidade cidade={cidadeSelecionada} />

            {/* Voa para o abrigo selecionado na busca */}
            {abrigoAlvo && <VoarParaAbrigo alvo={abrigoAlvo} />}

            {/* Marcadores dos abrigos */}
            {/* Filtra apenas os que têm latitude e longitude cadastrados no banco */}
            {/* Abrigos cadastrados antes desta atualização podem não ter coordenadas ainda */}
            {abrigos
              .filter(a => a.latitude && a.longitude)
              .map(abrigo => (
                <Marker
                  key={abrigo.id}
                  position={[abrigo.latitude, abrigo.longitude]}
                  icon={iconeDoAbrigo(abrigo)}
                >
                  {/* Popup ao clicar no marcador — mostra os dados do abrigo */}
                  <Popup>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', minWidth: '180px' }}>

                      <strong style={{ fontSize: '14px', color: '#0f172a' }}>{abrigo.nome}</strong>
                      <span style={{ fontSize: '12px', color: '#64748b' }}>{abrigo.cidade}</span>
                      <span style={{ fontSize: '12px', color: '#64748b', marginBottom: '6px' }}>{abrigo.endereco}</span>

                      {/* Barra de ocupação — mesma lógica do Hub de Abrigos */}
                      <span style={{ fontSize: '12px', color: '#475569' }}>
                        Capacidade: {abrigo.capacidadeOcupada} / {abrigo.capacidadeTotal}
                      </span>
                      <div style={{ background: '#e2e8f0', borderRadius: '9999px', height: '6px', overflow: 'hidden', marginBottom: '8px' }}>
                        <div style={{
                          height: '100%',
                          borderRadius: '9999px',
                          width: `${porcentagemOcupacao(abrigo)}%`,
                          background: porcentagemOcupacao(abrigo) >= 100 ? '#dc2626' : '#16a34a'
                        }} />
                      </div>

                      {/* Badge de vagas — igual ao Hub de Abrigos */}
                      <span style={{
                        display: 'inline-block',
                        fontSize: '11px',
                        fontWeight: '600',
                        padding: '2px 8px',
                        borderRadius: '20px',
                        alignSelf: 'flex-start',
                        background: abrigo.capacidadeOcupada < abrigo.capacidadeTotal ? '#dcfce7' : '#fee2e2',
                        color:      abrigo.capacidadeOcupada < abrigo.capacidadeTotal ? '#16a34a' : '#dc2626',
                      }}>
                        {abrigo.capacidadeOcupada < abrigo.capacidadeTotal ? 'Com vagas' : 'Sem vagas'}
                      </span>

                    </div>
                  </Popup>
                </Marker>
              ))
            }

          </MapContainer>
        </div>

        <footer style={{ marginTop: 'auto', paddingTop: '20px', display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: '#94a3b8' }}>
          <p>© 2026 S.O.S Vale. Todos os direitos reservados.</p>
          <p>Versão 1.0.0</p>
        </footer>

      </main>
    </div>
  )
}

export default Mapa;
