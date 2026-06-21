//--------- Imports-----------
//Todos os imports necessarios para o código

import { useState, useEffect } from 'react';
import { useNavigate } from "react-router-dom";
import {
  FaHome, FaBoxOpen, FaUser, FaDonate, FaMapPin,
  FaMapMarkerAlt, FaSearch, FaPlus
} from 'react-icons/fa';
import { GoAlertFill } from "react-icons/go";
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import "../../pg_adm/style.css";

//Fim dos imports
//--------------------------


//-- Navigate


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
  { nome: 'Pindamonhangaba',     lat: -22.9238, lng: -45.4603, zoom: 13 },
  { nome: 'Jacareí',             lat: -23.2988, lng: -45.9658, zoom: 13 },
  { nome: 'São José dos Campos', lat: -23.1794, lng: -45.8869, zoom: 12 },
  { nome: 'Guaratinguetá',       lat: -22.8161, lng: -45.1939, zoom: 13 },
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
    if (alvo?.lat && alvo?.lng) {
      map.flyTo([alvo.lat, alvo.lng], 16, { duration: 1.2 })
    }
  }, [alvo, map])
  return null
}

// ─── Função: geocodifica endereço via Nominatim (OpenStreetMap) ─────────────
// Recebe o endereço e cidade do abrigo e retorna { lat, lng } ou null
// Nominatim é gratuito e não precisa de API Key
async function geocodificar(endereco, cidade) {
  try {
    const query = encodeURIComponent(`${endereco}, ${cidade}, São Paulo, Brasil`)
    const url = `https://nominatim.openstreetmap.org/search?q=${query}&format=json&limit=1`
    const res = await fetch(url, {
      headers: { 'Accept-Language': 'pt-BR' }
    })
    const data = await res.json()
    if (data.length > 0) {
      return { lat: parseFloat(data[0].lat), lng: parseFloat(data[0].lon) }
    }
    return null
  } catch {
    return null
  }
}

//------- Começo Função Principal -----
function Mapa() {


  // ─── ESTADOS ────────────────────────────────────────────────
  // Navigate

  const navigate = useNavigate();

  // Cada estado corresponde a uma parte da tela

  // Lista de abrigos vindos da API, com lat/lng adicionados após geocoding
  const [abrigos, setAbrigos] = useState([])

  // Lista de regiões vindas da API (usado no select do modal de cadastro)
  const [regioes, setRegioes] = useState([])

  // Cidade selecionada no select (objeto de CIDADES)
  const [cidadeSelecionada, setCidadeSelecionada] = useState(CIDADES[0])

  // Texto digitado na barra de busca
  const [busca, setBusca] = useState('')

  // Sugestões que aparecem ao digitar na busca
  const [sugestoes, setSugestoes] = useState([])

  // Abrigo alvo para voar no mapa após selecionar uma sugestão
  const [abrigoAlvo, setAbrigoAlvo] = useState(null)

  // Controla o loading enquanto os abrigos são geocodificados
  const [carregando, setCarregando] = useState(true)

  // Controla se o modal de cadastro de região está aberto
  const [modalAberto, setModalAberto] = useState(false)

  // Controla o loading do botão de salvar no modal
  const [salvando, setSalvando] = useState(false)

  // Feedback de sucesso ou erro no modal
  const [feedbackModal, setFeedbackModal] = useState(null)

  // Dados do formulário do modal de cadastro de região
  const [formRegiao, setFormRegiao] = useState({
    bairro: '',
    cidade: '',
    estado: 'SP',
    populacaoEstimada: '',
    areaKm2: '',
    nivelRisco: 'baixo',
    statusAlerta: false,
  })


  //-------- Busca dos dados ao carregar a página ----------------

  useEffect(() => {

    // Primeiro: Busca os abrigos e geocodifica os endereços
    // O geocoding converte "Rua X, Taubaté" em { lat, lng } para plotar no mapa
    // Nominatim tem limite de 1 req/segundo, então aguarda 1s entre cada abrigo
    const buscarAbrigos = async () => {
      setCarregando(true)
      try {
        const resposta = await fetch('http://localhost:3000/api/abrigos/listar')
        const dados = await resposta.json()

        // Geocodifica cada abrigo com delay de 1s para respeitar o limite do Nominatim
        const abrigosComCoordenadas = []
        for (const abrigo of dados.abrigos) {
          const coords = await geocodificar(abrigo.endereco, abrigo.cidade)
          abrigosComCoordenadas.push({ ...abrigo, lat: coords?.lat, lng: coords?.lng })
          // Aguarda 1 segundo antes de geocodificar o próximo
          await new Promise(r => setTimeout(r, 1000))
        }

        setAbrigos(abrigosComCoordenadas)
      } catch (erro) {
        console.error('Erro ao buscar abrigos:', erro)
      } finally {
        setCarregando(false)
      }
    }

    // Segundo: Busca as regiões para o select do modal de cadastro
    // Mesma lógica do DetalhesAbrigo — puxa tudo sem filtro
    const buscarRegioes = async () => {
      try {
        const resposta = await fetch('http://localhost:3000/api/regioes/listar')
        const dados = await resposta.json()
        setRegioes(dados.regioes)
      } catch (erro) {
        console.error('Erro ao buscar regiões:', erro)
      }
    }

    // Terceiro: Roda as duas buscas ao carregar a página
    buscarAbrigos()
    buscarRegioes()

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

  // Handler para fechar o modal e limpar o feedback
  const handleFecharModal = () => {
    setModalAberto(false)
    setFeedbackModal(null)
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
  // Enquanto os abrigos estão sendo geocodificados, mostra mensagem para o usuário
  // O geocoding pode demorar dependendo da quantidade de abrigos cadastrados
  if (carregando) {
    return (
      <div className="dashboard">
        <aside className="sidebar">
          <ul>
            <a href="/pg_adm"><li><FaHome className="icon" /> Home</li></a>
            <a href="/abrigos"><li><FaBoxOpen className="icon" /> Abrigos</li></a>
            <a href="/vitimas"><li><FaUser className="icon" /> Vítimas</li></a>
            <li><FaDonate className="icon" /> Doações</li>
            <a href="/mapa"><li className="active"><FaMapPin className="icon" /> Mapa</li></a>
            <li><GoAlertFill className="icon" /> Ocorrências</li>
            <li><FaUser className="icon" /> Perfil</li>
          </ul>
        </aside>
        <main className="main">
          <p style={{ padding: '40px', color: '#64748b' }}>
            Localizando abrigos no mapa... (pode levar alguns segundos)
          </p>
        </main>
      </div>
    )
  }


  //------- Tela Principal (Carregado) ------
  return (

    <div className="dashboard">

      {/* Código do Sidebar */}
      <aside className="sidebar">

        <ul>
          <a href="/pg_adm"><li><FaHome className="icon" /> Home</li></a>
          <a href="/abrigos"><li><FaBoxOpen className="icon" /> Abrigos</li></a>
          <a href="/vitimas"><li><FaUser className="icon" /> Vítimas</li></a>
          <li><FaDonate className="icon" /> Doações</li>
          <a href="/mapa"><li className="active"><FaMapPin className="icon" /> Mapa</li></a>
          <li><GoAlertFill className="icon" /> Ocorrências</li>
          <li><FaUser className="icon" /> Perfil</li>
        </ul>

      </aside>

      {/* Código do Main */}
      <main className="main">

        <header className="top">
          <div>
            {/* Breadcrumb */}
            <p style={{ fontSize: '14px', color: '#64748b', margin: 0 }}>
              Mapa
            </p>

            <h1 style={{ fontSize: '26px', fontWeight: '700', color: '#0f172a', marginTop: '4px' }}>
              Mapa de Abrigos
            </h1>

            <p className="subtitle">Visualize os abrigos cadastrados nas cidades do Vale do Paraíba</p>
          </div>
          <div className="top-icons">
            <img src="/src/assets/logo.png" width="80px" alt="Logo" />
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

          {/* Botão de cadastrar nova região — abre o modal */}
          <button
            type="button"
            onClick={() => { navigate('/Cadastrar-Regiao') }}
            style={{ display: 'flex', alignItems: 'center', gap: '6px', background: '#1e3a5f', color: '#fff', border: 'none', borderRadius: '8px', padding: '10px 18px', fontSize: '14px', fontWeight: '600', cursor: 'pointer', whiteSpace: 'nowrap' }}
          >
            <FaPlus /> Cadastrar nova região
          </button>

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

            {/* Marcadores dos abrigos — só plota os que foram geocodificados com sucesso */}
            {abrigos
              .filter(a => a.lat && a.lng)
              .map(abrigo => (
                <Marker
                  key={abrigo.id}
                  position={[abrigo.lat, abrigo.lng]}
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

      {/* ─── Modal: Cadastrar Nova Região ─── */}
      {/* Abre ao clicar em "Cadastrar nova região" */}
      {/* Clicando fora do modal (no overlay escuro) ele fecha */}
      {modalAberto && (
        <div
          onClick={handleFecharModal}
          style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', zIndex: 10000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
        >
          {/* stopPropagation evita que o clique dentro do modal feche ele */}
          <div
            onClick={e => e.stopPropagation()}
            style={{ background: '#fff', borderRadius: '16px', padding: '32px', width: '100%', maxWidth: '560px', boxShadow: '0 20px 60px rgba(0,0,0,0.18)', maxHeight: '90vh', overflowY: 'auto' }}
          >

            {/* Cabeçalho do modal */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h2 style={{ fontSize: '20px', fontWeight: '700', color: '#0f172a', margin: 0 }}>
                Cadastrar Nova Região
              </h2>
              <button
                type="button"
                onClick={handleFecharModal}
                style={{ background: 'none', border: 'none', fontSize: '18px', cursor: 'pointer', color: '#64748b', padding: '4px 8px' }}
              >
                ✕
              </button>
            </div>

            {/* Feedback de sucesso ou erro — aparece após tentar salvar */}
            {feedbackModal && (
              <div style={{
                borderRadius: '8px',
                padding: '10px 14px',
                fontSize: '14px',
                fontWeight: '500',
                marginBottom: '16px',
                background: feedbackModal.tipo === 'sucesso' ? '#dcfce7' : '#fee2e2',
                color:      feedbackModal.tipo === 'sucesso' ? '#16a34a' : '#dc2626',
              }}>
                {feedbackModal.mensagem}
              </div>
            )}

            {/* Formulário de cadastro de região */}
            {/* Não usa <form> com onSubmit aqui pois está dentro de um modal — usa onClick no botão */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>

                {/* Bairro */}
                <div className="form-group">
                  <label>Bairro *</label>
                  <input
                    value={formRegiao.bairro}
                    onChange={e => setFormRegiao(f => ({ ...f, bairro: e.target.value }))}
                    placeholder="Ex: Centro"
                  />
                </div>

                {/* Cidade — puxa do banco igual ao DetalhesAbrigo */}
                <div className="form-group">
                  <label>Cidade *</label>
                  <select
                    value={formRegiao.cidade}
                    onChange={e => setFormRegiao(f => ({ ...f, cidade: e.target.value }))}
                    className="select-cidade"
                  >
                    <option value="">Selecione a cidade</option>
                    {regioes.map(regiao => (
                      <option key={regiao.id} value={regiao.cidade}>
                        {regiao.cidade} - {regiao.estado}
                      </option>
                    ))}
                    {/* Se não houver regiões cadastradas ainda, mostra as cidades padrão */}
                    {regioes.length === 0 && CIDADES.filter(c => c.nome !== 'Todas').map(c => (
                      <option key={c.nome} value={c.nome}>{c.nome}</option>
                    ))}
                  </select>
                </div>

                {/* Estado */}
                <div className="form-group">
                  <label>Estado</label>
                  <input
                    value={formRegiao.estado}
                    onChange={e => setFormRegiao(f => ({ ...f, estado: e.target.value }))}
                    placeholder="SP"
                    maxLength={2}
                  />
                </div>

                {/* População estimada */}
                <div className="form-group">
                  <label>População estimada</label>
                  <input
                    type="number"
                    min={0}
                    value={formRegiao.populacaoEstimada}
                    onChange={e => setFormRegiao(f => ({ ...f, populacaoEstimada: e.target.value }))}
                    placeholder="Ex: 15000"
                  />
                </div>

                {/* Área em km² */}
                <div className="form-group">
                  <label>Área (km²)</label>
                  <input
                    type="number"
                    step="0.01"
                    min={0}
                    value={formRegiao.areaKm2}
                    onChange={e => setFormRegiao(f => ({ ...f, areaKm2: e.target.value }))}
                    placeholder="Ex: 4.5"
                  />
                </div>

                {/* Nível de risco */}
                <div className="form-group">
                  <label>Nível de risco</label>
                  <select
                    value={formRegiao.nivelRisco}
                    onChange={e => setFormRegiao(f => ({ ...f, nivelRisco: e.target.value }))}
                  >
                    <option value="baixo">Baixo</option>
                    <option value="medio">Médio</option>
                    <option value="alto">Alto</option>
                    <option value="critico">Crítico</option>
                  </select>
                </div>

              </div>

              {/* Checkbox de status de alerta — mesma estrutura das checkboxes do DetalhesAbrigo */}
              <label className="checkbox-card">
                <input
                  type="checkbox"
                  checked={formRegiao.statusAlerta}
                  onChange={e => setFormRegiao(f => ({ ...f, statusAlerta: e.target.checked }))}
                />
                <div className="checkbox-content">
                  <GoAlertFill className="icon" /><span>Região em alerta ativo</span>
                </div>
              </label>

              {/* Botões do modal — mesmas classes do DetalhesAbrigo */}
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '8px' }}>
                <button
                  type="button"
                  onClick={handleFecharModal}
                  className="btn-action cancelar"
                >
                  Cancelar
                </button>
              </div>

            </div>
          </div>
        </div>
      )}

    </div>
  )
}

export default Mapa;