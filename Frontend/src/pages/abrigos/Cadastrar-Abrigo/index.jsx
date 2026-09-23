import { useState } from "react";
import { 
  FaHome, FaBoxOpen, FaUser, FaDonate, FaMapPin, 
  FaUpload, FaMapMarkerAlt, FaPhoneAlt, FaDog, FaUserNurse,
  FaWheelchair, FaUtensils, FaBuilding, FaPeopleArrows,
  FaMedkit, FaMapMarkedAlt,
  FaLocationArrow, FaMap
} from 'react-icons/fa';
import { GoAlertFill } from "react-icons/go";
import { FaGear } from "react-icons/fa6";
import SeletorLocalidade from "../../../components/SeletorLocalidade";
import "../../pg_adm/style.css";
import "./CadastroAbrigo.css";

const CadastrarAbrigo = () => {
  const [mensagem, setMensagem] = useState('');
  const [erroEnvio, setErroEnvio] = useState(false);
  const [fotoAbrigo, setFotoAbrigo] = useState(null);
  const [status, setStatus] = useState('ativo');

  // ── Localização: Estado → Cidade → Bairro ────────────────────────────────
  // O SeletorLocalidade busca as listas na API e devolve os IDs + os nomes
  // (os nomes são usados no geocoding do endereço)
  const [localidade, setLocalidade] = useState({ cidadeId: null, bairroId: null, estado: '', cidade: '', bairro: '' })

  const handleLocalidade = (novaLocalidade) => {
    setLocalidade(novaLocalidade)
    // Limpa as coordenadas ao trocar a localização pois o endereço pode ter mudado
    setLatitude(null)
    setLongitude(null)
    setFeedbackGeo(null)
  }
  // ─────────────────────────────────────────────────────────────────────────

  const [capacidadeTotal, setCapacidadeTotal] = useState(0);
  const [capacidadeOcupada, setCapacidadeOcupada] = useState(0);

  const [erroCapacidade, setErroCapacidade] = useState('')
  const validarCapacidade = (ocupada, total) => {
    if (ocupada > total) {
      setErroCapacidade('Capacidade ocupada não pode ser maior que a total.')
    } else {
      setErroCapacidade('')
    }
  }

  // ── Estados do geocoding ─────────────────────────────────────────────────
  // latitude e longitude são preenchidos automaticamente ao sair do campo endereço
  const [latitude, setLatitude] = useState(null)
  const [longitude, setLongitude] = useState(null)

  // feedbackGeo mostra o resultado do geocoding para o usuário
  // tipo: 'sucesso' | 'erro' | 'buscando'
  const [feedbackGeo, setFeedbackGeo] = useState(null)
  // ─────────────────────────────────────────────────────────────────────────

  // ── Handler do geocoding ─────────────────────────────────────────────────
  // Roda quando o usuário sai do campo endereço (onBlur)
  // Só tenta geocodificar se o endereço E a cidade estiverem preenchidos
  const handleGeocodificar = async (e) => {
    const endereco = e.target.value.trim()

    // Se o endereço estiver vazio ou a cidade não foi selecionada ainda, não faz nada
    if (!endereco || !localidade.cidade) {
      setFeedbackGeo({ tipo: 'erro', mensagem: 'Preencha a cidade antes de inserir o endereço.' })
      return
    }

    // Mostra feedback de "buscando" enquanto a requisição acontece
    setFeedbackGeo({ tipo: 'buscando', mensagem: 'Buscando localização...' })

    try {
      // Monta a query com o máximo de informação possível para aumentar a precisão
      // Ex: "Rua das Flores 123, Centro, Taubaté, SP, Brasil"
      const query = encodeURIComponent(`${endereco}, ${localidade.bairro}, ${localidade.cidade}, ${localidade.estado}, Brasil`)
      const url = `https://nominatim.openstreetmap.org/search?q=${query}&format=json&limit=1`

      const res = await fetch(url, {
        headers: { 'Accept-Language': 'pt-BR' }
      })
      const data = await res.json()

      if (data.length > 0) {
        // Encontrou — salva as coordenadas nos estados e mostra sucesso
        const lat = parseFloat(data[0].lat)
        const lng = parseFloat(data[0].lon)
        setLatitude(lat)
        setLongitude(lng)
        setFeedbackGeo({ tipo: 'sucesso', mensagem: `Localização encontrada! (${lat.toFixed(5)}, ${lng.toFixed(5)})` })
      } else {
        // Não encontrou — limpa as coordenadas e avisa o usuário
        // Isso pode acontecer se o endereço estiver muito abreviado ou incorreto
        setLatitude(null)
        setLongitude(null)
        setFeedbackGeo({ tipo: 'erro', mensagem: 'Localização não encontrada. Verifique o endereço.' })
      }
    } catch (erro) {
      console.error('Erro no geocoding:', erro)
      setLatitude(null)
      setLongitude(null)
      setFeedbackGeo({ tipo: 'erro', mensagem: 'Erro ao buscar localização. Tente novamente.' })
    }
  }
  // ─────────────────────────────────────────────────────────────────────────

  // Handle Imagens
  const handleImagem = (e) => {
    const arquivo = e.target.files[0]
    const limiteMB = 2
    if (arquivo.size > limiteMB * 1024 * 1024) {
      setMensagem(`A imagem deve ter no máximo ${limiteMB}MB.`)
      return
    }
    const reader = new FileReader()
    reader.onloadend = () => {
      const base64 = reader.result.split(',')[1]
      setFotoAbrigo(base64)
    }
    reader.readAsDataURL(arquivo)
  }

  // Handle submit
  const handleSubmit = async (e) => {
    e.preventDefault()

    const dados = {
      status: e.target.status.value,
      nome: e.target.nome.value,
      cep: e.target.cep.value,
      cidadeId: localidade.cidadeId,
      bairroId: localidade.bairroId,
      endereco: e.target.endereco.value,
      telefone: e.target.telefone.value,
      responsavel: e.target.responsavel.value,
      tipoAbrigo: e.target.tipoAbrigo.value,
      capacidadeTotal: Number(e.target.capacidadeTotal.value),
      capacidadeOcupada: Number(e.target.capacidadeOcupada.value) || 0,
      possuiAtendimentoMedico: e.target.possuiAtendimentoMedico.checked,
      possuiEnfermagem: e.target.possuiEnfermagem.checked,
      possuiPets: e.target.possuiPets.checked,
      possuiAcessibilidade: e.target.possuiAcessibilidade.checked,
      possuiCozinha: e.target.possuiCozinha.checked,
      fotoAbrigo: fotoAbrigo,

      // Inclui latitude e longitude gerados pelo geocoding
      // Se o geocoding falhou ou não rodou, envia null — o banco aceita null nos dois campos
      latitude: latitude,
      longitude: longitude,
    }

    if (capacidadeOcupada > capacidadeTotal) {
      if (erroCapacidade) return
    }

    const resposta = await fetch('http://localhost:3000/api/abrigos/cadastrar', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(dados)
    })

    const resultado = await resposta.json()
    setErroEnvio(!resposta.ok)
    setMensagem(resultado.mensagem)
  }

  return (
    <div className="dashboard">

      <aside className="sidebar">
        <ul>
          <a href="/pg_adm"><li><FaHome className="icon" /> Home</li></a>
          <a href="/abrigos"><li className="active"><FaBoxOpen className="icon" /> Abrigos</li></a>
          <a href="/vitimas"><li><FaUser className="icon" /> Vítimas</li></a>
          <li><FaDonate className="icon" /> Doações</li>
          <a href="/mapa"><li><FaMap className="icon" /> Mapa</li></a>
          <a href="/alertas"><li><GoAlertFill className="icon" /> Alertas</li></a>
          <li><FaGear className="icon" />Configurações</li>
        </ul>
      </aside>

      <main className="main">

        <header className="top">
          <div>
            <p style={{ fontSize: '14px', color: '#64748b', margin: 0 }}>
              Abrigos &gt; <span>Novo Abrigo</span>
            </p>
            <h1 style={{ fontSize: '26px', fontWeight: '700', color: '#0f172a', marginTop: '4px' }}>
              Cadastro de Abrigo
            </h1>
            <p className="subtitle"> Cadastre um novo abrigo</p>
          </div>
          <div className="top-icons">
            <img src="/src/assets/logo.png" width="80px" alt="Logo" />
          </div>
        </header>

        <form onSubmit={handleSubmit} className="cadastro-form-container">

          <div className="form-column-left">

            <div className="form-group">
              <label htmlFor="status">Status</label>
              <select
                id="status"
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                className={`select-status ${status}`}>
                <option value="ativo">Ativado</option>
                <option value="manutencao">Manutenção</option>
                <option value="desativado">Desativado</option>
              </select>
            </div>

            <div className="form-group">
              <label><FaBuilding /> Nome do Abrigo</label>
              <input type="text" name="nome" placeholder="Ex: Escola Municipal Centro" required />
            </div>

            <div className="form-group">
              <label><FaPhoneAlt /> CEP</label>
              <input type="text" name="cep" placeholder="12345-12" required />
            </div>

            {/* Estado → Cidade → Bairro (listas vindas da API de regiões) */}
            <SeletorLocalidade
              cidadeId={localidade.cidadeId}
              bairroId={localidade.bairroId}
              bairroObrigatorio
              onChange={handleLocalidade}
            />

            {/* Campo endereço com geocoding automático no onBlur ──────────── */}
            {/* onBlur = roda quando o usuário sai do campo (clica em outro lugar) */}
            {/* Isso evita fazer uma requisição a cada letra digitada */}
            <div className="form-group">
              <label><FaMapMarkedAlt /> Endereço</label>
              <input
                type="text"
                name="endereco"
                placeholder="Ex: Rua das Flores, 123"
                required
                onBlur={handleGeocodificar}
              />

              {/* Feedback do geocoding — aparece embaixo do campo endereço */}
              {feedbackGeo && (
                <p style={{
                  fontSize: '12px',
                  marginTop: '4px',
                  color: feedbackGeo.tipo === 'sucesso' ? '#16a34a'
                       : feedbackGeo.tipo === 'erro'    ? '#ef4444'
                       :                                  '#64748b'  // buscando
                }}>
                  {feedbackGeo.mensagem}
                </p>
              )}
            </div>
            {/* ─────────────────────────────────────────────────────────────── */}

            <div className="form-group">
              <label><FaPhoneAlt /> Telefone</label>
              <input type="text" name="telefone" placeholder="(12) 99999-9999" required />
            </div>

            <div className="form-group">
              <label><FaUser /> Responsável</label>
              <input type="text" name="responsavel" placeholder="Nome do responsável" required />
            </div>

            <div className="form-group">
              <label><FaBuilding /> Tipo de Abrigo</label>
              <select className="select-tipo-abrigo" name="tipoAbrigo" required>
                <option value="" disabled>Selecione o tipo</option>
                <option value="Escola">Escola</option>
                <option value="Ginásio">Ginásio</option>
                <option value="Igreja">Igreja</option>
                <option value="Hotel">Hotel</option>
                <option value="Pousada">Pousada</option>
                <option value="CentroCultural">Centro Cultural</option>
                <option value="CentroComunitário">Centro Comunitário</option>
                <option value="Campo">Campo</option>
              </select>
            </div>

            <div className="form-group">
              <label><FaPeopleArrows /> Capacidade Total</label>
              <input
                type="number"
                name="capacidadeTotal"
                placeholder="Ex: 100"
                required
                onChange={(e) => {
                  const total = parseInt(e.target.value) || 0
                  setCapacidadeTotal(total)
                  validarCapacidade(capacidadeOcupada, total)
                }}
              />
            </div>

            <div className="form-group">
              <label><FaPeopleArrows /> Capacidade Ocupada</label>
              <input
                type="number"
                name="capacidadeOcupada"
                className={`input-capacidade ${erroCapacidade ? 'input-erro' : ''}`}
                placeholder="Ex: 0"
                onChange={(e) => {
                  const ocupada = parseInt(e.target.value) || 0
                  setCapacidadeOcupada(ocupada)
                  validarCapacidade(ocupada, capacidadeTotal)
                }}
              />
            </div>

            {erroCapacidade && (
              <p style={{ color: '#ef4444', fontSize: '13px', marginTop: '4px' }}>
                {erroCapacidade}
              </p>
            )}

            {/* Checkboxes de infraestrutura */}
            <div className="infraestrutura-section">
              <h3 style={{ fontSize: '16px', fontWeight: '700', color: '#1e293b', marginBottom: '12px' }}>
                Infraestrutura
              </h3>

              <label className="checkbox-card">
                <input type="checkbox" name="possuiAtendimentoMedico" />
                <div className="checkbox-content">
                  <FaMedkit className="icon" /><span>Atendimento Médico</span>
                </div>
              </label>

              <label className="checkbox-card">
                <input type="checkbox" name="possuiEnfermagem" />
                <div className="checkbox-content">
                  <FaUserNurse className="icon" /><span>Enfermagem</span>
                </div>
              </label>

              <label className="checkbox-card">
                <input type="checkbox" name="possuiPets" />
                <div className="checkbox-content">
                  <FaDog className="icon" /><span>Pets Bem-Vindos</span>
                </div>
              </label>

              <label className="checkbox-card">
                <input type="checkbox" name="possuiAcessibilidade" />
                <div className="checkbox-content">
                  <FaWheelchair className="icon" /><span>Acessibilidade</span>
                </div>
              </label>

              <label className="checkbox-card">
                <input type="checkbox" name="possuiCozinha" />
                <div className="checkbox-content">
                  <FaUtensils className="icon" /><span>Cozinha Comunitária</span>
                </div>
              </label>

            </div>
          </div>

          {/* Coluna direita: foto + botão */}
          <div className="form-column-right">

            <h3 style={{ fontSize: '16px', fontWeight: '700', color: '#1e293b', marginBottom: '12px' }}>
              Imagem do Abrigo
            </h3>

            <div className="upload-container">
              {fotoAbrigo ? (
                <div className="image-preview">
                  <img src={`data:image/jpeg;base64,${fotoAbrigo}`} alt="Preview" />
                  <button type="button" onClick={() => setFotoAbrigo(null)} className="btn-remove-image">
                    Remover Foto
                  </button>
                </div>
              ) : (
                <label className="upload-dropzone">
                  <input type="file" accept="image/*" onChange={handleImagem} style={{ display: 'none' }} />
                  <FaUpload className="upload-icon" />
                  <p>Foto principal do abrigo</p>
                  <span className="btn-upload-trigger">Selecionar arquivo do computador</span>
                </label>
              )}
            </div>

            <div className="form-actions">
              <button type="submit" className="btn-action salvar">
                Cadastrar Abrigo
              </button>
              {mensagem && (
                <p style={{ color: erroEnvio ? '#ef4444' : '#10b981', fontSize: '14px', textAlign: 'center' }}>
                  {mensagem}
                </p>
              )}
            </div>

          </div>
        </form>

        <footer style={{ marginTop: 'auto', paddingTop: '20px', display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: '#94a3b8' }}>
          <p>© 2026 S.O.S Vale. Todos os direitos reservados.</p>
          <p>Versão 1.0.0</p>
        </footer>

      </main>
    </div>
  );
};

export default CadastrarAbrigo;
