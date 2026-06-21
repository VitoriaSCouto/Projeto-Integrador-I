import { useState, useEffect } from "react";
import { 
  FaHome, FaBoxOpen, FaUser, FaDonate, FaMapPin, 
  FaUpload, FaMapMarkerAlt, FaPhoneAlt, FaDog, FaUserNurse,
  FaWheelchair, FaUtensils, FaBuilding, FaPeopleArrows,
  FaMedkit,FaMapMarkedAlt,
  FaLocationArrow, FaMap
} from 'react-icons/fa';
import { GoAlertFill } from "react-icons/go";
import { FaGear } from "react-icons/fa6";
import "../../pg_adm/style.css"; // ← importa o CSS global do projeto
import "./CadastroAbrigo.css"; 

const CadastrarAbrigo = () => {
  const [mensagem, setMensagem] = useState('');
  const [fotoAbrigo, setFotoAbrigo] = useState(null);
  const [regioes, setRegioes] = useState([]);
  const [status, setStatus] = useState('ativo');

  // ── Filtro em cascata: Estado → Cidade → Bairro ──────────────────────────
  // Cada seleção reseta os níveis abaixo dela
  const [estadoSelecionado, setEstadoSelecionado] = useState('')
  const [cidadeSelecionada, setCidadeSelecionada] = useState('')
  const [bairroSelecionado, setBairroSelecionado] = useState('')

  // Lista de estados únicos (sem repetição)
  const estados = [...new Set(regioes.map(r => r.estado))]

  // Apenas cidades do estado escolhido
  const cidades = [...new Set(
    regioes
      .filter(r => r.estado === estadoSelecionado)
      .map(r => r.cidade)
  )]

  // Apenas bairros da cidade escolhida
  const bairros = regioes
    .filter(r => r.cidade === cidadeSelecionada)
    .map(r => r.bairro)
  // ─────────────────────────────────────────────────────────────────────────

  const [capacidadeTotal, setCapacidadeTotal] = useState(0);
  const [capacidadeOcupada, setCapacidadeOcupada] = useState(0);

  const [erroCapacidade, setErroCapacidade] = useState('')
  const validarCapacidade = (ocupada, total) => {
  if (ocupada > total) {
    setErroCapacidade('Capacidade ocupada não pode ser maior que a total.')
  } else {
    setErroCapacidade('') // limpa o erro se estiver ok
  }
}
  //Roda sempre que recarrega
  useEffect(() => {
    const buscarRegioes = async () => { // função dentro
      const resposta = await fetch('http://localhost:3000/api/regioes/listar')
      const dados = await resposta.json()
     setRegioes(dados.regioes)
    }
    buscarRegioes() // chama logo em seguida
  }, [])

  //Handle Imagens
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
  //Handle submit
  const handleSubmit = async (e) => {
    e.preventDefault()

    const dados = {
      status: e.target.status.value,
      nome: e.target.nome.value,
      cep: e.target.cep.value,
      estado: e.target.estado.value,
      cidade: e.target.cidade.value,
      bairro: e.target.bairro.value,
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
      fotoAbrigo: fotoAbrigo
    }

    if (capacidadeOcupada>capacidadeTotal){
      if (erroCapacidade) return
    }

    const resposta = await fetch('http://localhost:3000/api/abrigos/cadastrar', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(dados)
    })

    const resultado = await resposta.json()
    setMensagem(resultado.mensagem)
  }

  return (
  <div className="dashboard">

    <aside className="sidebar">
      <div className="top-icons">
            <img src="src/assets/logo.png" width="70px" />
            <p>S.O.S. Vale</p>
          </div>
      <ul>
        <a href="/pg_adm"><li><FaHome className="icon" /> Home</li></a>
        <a href="/abrigos"><li className="active"><FaBoxOpen className="icon" /> Abrigos</li></a>
        <a href="/vitimas"><li><FaUser className="icon" /> Vítimas</li></a>
        <li><FaDonate className="icon" /> Doações</li>
        <a href="/mapa"><li><FaMap className="icon" /> Mapa</li></a>
        <li><GoAlertFill className="icon" /> Ocorrências</li>
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

           {/* SELECT ESTADO — mostra apenas estados únicos do banco */}
           <div className="form-group">
            <label><FaMapMarkedAlt /> Estado</label>
            <select
             className="select-cidade"
             name="estado"
             value={estadoSelecionado}
             onChange={(e) => {
               setEstadoSelecionado(e.target.value)
               setCidadeSelecionada('')  // reseta cidade ao trocar estado
               setBairroSelecionado('')  // reseta bairro ao trocar estado
             }}
             required>
              <option value="" disabled>Selecione o estado</option>
              {estados.map((estado) => (
                <option key={estado} value={estado}>
                  {estado}
                </option>
              ))}
             </select>
          </div>

          {/* SELECT CIDADE — só habilita após escolher estado, filtra pelo estado */}
          <div className="form-group">
            <label><FaMapMarkedAlt /> Cidade</label>
            <select
             className="select-cidade"
             name="cidade"
             value={cidadeSelecionada}
             disabled={!estadoSelecionado} // travado até escolher estado
             onChange={(e) => {
               setCidadeSelecionada(e.target.value)
               setBairroSelecionado('') // reseta bairro ao trocar cidade
             }}
             required>
              <option value="" disabled>Selecione a cidade</option>
              {cidades.map((cidade) => (
                <option key={cidade} value={cidade}>
                  {cidade}
                </option>
              ))}
            </select>
          </div>

          {/* SELECT BAIRRO — só habilita após escolher cidade, filtra pela cidade */}
          <div className="form-group">
            <label><FaMapMarkedAlt /> Bairro</label>
            <select
             className="select-cidade"
             name="bairro"
             value={bairroSelecionado}
             disabled={!cidadeSelecionada} // travado até escolher cidade
             onChange={(e) => setBairroSelecionado(e.target.value)}
             required>
              <option value="" disabled>Selecione o bairro</option>
              {bairros.map((bairro) => (
                <option key={bairro} value={bairro}>
                  {bairro}
                </option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label><FaMapMarkedAlt/> Endereço</label>
            <input type="text" name="endereco" placeholder="Ex: Rua das Flores, 123" required />
          </div>

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
            <select
             className="select-tipo-abrigo"
             name="tipoAbrigo" required>
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
              validarCapacidade(ocupada, capacidadeTotal) // valida com o novo ocupada
            }}/>
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

            {/*
              Cada checkbox usa a classe checkbox-card que já existe no style.css
              O input fica escondido e o estilo é aplicado no label inteiro
            */}

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
              <p style={{ color: '#10b981', fontSize: '14px', textAlign: 'center' }}>
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