import { useState } from "react";
import { FaHome, FaBoxOpen, FaUser, FaDonate, FaMapPin,
         FaIdCard, FaPhoneAlt, FaCalendar, FaVenusMars, FaUpload } from 'react-icons/fa';
import { GoAlertFill } from "react-icons/go";
import "../../pg_adm/style.css"; // ← importa o CSS global do projeto
import "./vitima.css"; 


const CadastroVitima = () => {
  // Estado para guardar a mensagem de sucesso ou erro
  const [mensagem, setMensagem] = useState('')
  // Estado para guardar a imagem em Base64
  const [fotoVitima, setfotoVitima] = useState(null)
  

  //----- Handle Image -----
  // Função que roda quando o usuário seleciona uma imagem
  const handleImagem = (e) => {
    const arquivo = e.target.files[0]

    // Verifica o tamanho — 2MB = 2 * 1024 * 1024 bytes
    const limiteMB = 2
    if (arquivo.size > limiteMB * 1024 * 1024) {
       setMensagem(`A imagem deve ter no máximo ${limiteMB}MB.`)
       return // para a execução
    }

    const reader = new FileReader()
    reader.onloadend = () => {
      const base64 = reader.result.split(',')[1]
      setfotoVitima(base64)
    }
    reader.readAsDataURL(arquivo)
  }

  //----- Handle Submit -----
  // Função que roda quando o formulário é enviado
  const handleSubmit = async (e) => {
    // Impede a página de recarregar
    e.preventDefault()

    // Monta o objeto com os dados do formulário
    const dados = {
      nome: e.target.nome.value,
      cpf: e.target.cpf.value,
      telefone: e.target.telefone.value,
      dataNascimento: e.target.dataNascimento.value,
      genero: e.target.genero.value,
      fotoVitima: fotoVitima // Base64 da imagem
    }

    // Envia os dados para a API
    const resposta = await fetch('http://localhost:3000/api/vitimas/cadastrar', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(dados) // converte objeto para JSON
    })

    // Pega a resposta da API e atualiza a mensagem
    const resultado = await resposta.json()
    setMensagem(resultado.mensagem)
  }

  return (
  <div className="dashboard">

    {/* Sidebar — igual ao resto do projeto */}
    <aside className="sidebar">
      <ul>
        <a href="/pg_adm"><li><FaHome className="icon" /> Home</li></a>
        <a href="/abrigos"><li><FaBoxOpen className="icon" /> Abrigos</li></a>
        <a href="/vitimas"><li className="active"><FaUser className="icon" /> Vítimas</li></a>
        <li><FaDonate className="icon" /> Doações</li>
        <li><FaMapPin className="icon" /> Região Afetada</li>
        <li><GoAlertFill className="icon" /> Ocorrências</li>
        <li><FaUser className="icon" /> Perfil</li>
      </ul>
    </aside>

    <main className="main">

      {/* Header padrão do projeto */}
      
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
            <p className="subtitle"> Cadastre uma nova vitíma</p>

          </div>
          <div className="top-icons">
            <img src="/src/assets/logo.png" width="80px" alt="Logo" />
          </div>
        </header>

      {/* Formulário com duas colunas */}
      <form onSubmit={handleSubmit} className="cadastro-form-container">

        {/* Coluna esquerda: campos de texto */}
        <div className="form-column-left">

          <div className="form-group">
            <label><FaUser /> Nome Completo</label>
            <input type="text" name="nome" placeholder="Ex: João da Silva" required />
          </div>

          <div className="form-group">
            <label><FaIdCard /> CPF</label>
            <input type="text" name="cpf" placeholder="000.000.000-00" required />
          </div>

          <div className="form-group">
            <label><FaPhoneAlt /> Telefone</label>
            <input type="text" name="telefone" placeholder="(12) 99999-9999" />
          </div>

          <div className="form-group">
            <label><FaCalendar /> Data de Nascimento</label>
            <input type="date" name="dataNascimento" />
          </div>

          <div className="form-group">
            <label><FaVenusMars /> Gênero</label>
            <select
             className="select-genero"
             id="genero"
             name="genero">
              <option value="">Selecione o gênero</option>
              <option value="Masculino">Masculino</option>
              <option value="Feminino">Feminino</option>
              <option value="Outro">Outro</option>
            </select>
          </div>

        </div>

        {/* Coluna direita: foto + botão */}
        <div className="form-column-right">

          <h3 style={{ fontSize: '16px', fontWeight: '700', color: '#1e293b', marginBottom: '12px' }}>
            Foto de Perfil
          </h3>

          {/* Preview da foto */}
          <div className="upload-container">
            {fotoVitima ? (
              <div className="image-preview">
                {/*
                  fotoVitima aqui é base64 puro (sem o prefixo data:image)
                  então precisamos montar a src completa na mão
                */}
                <img src={`data:image/jpeg;base64,${fotoVitima}`} alt="Preview" />
                <button type="button" onClick={() => setfotoVitima(null)} className="btn-remove-image">
                  Remover Foto
                </button>
              </div>
            ) : (
              <label className="upload-dropzone">
                <input type="file" accept="image/*" onChange={handleImagem} style={{ display: 'none' }} />
                <FaUpload className="upload-icon" />
                <p>Foto de perfil da vítima</p>
                <span className="btn-upload-trigger">Selecionar arquivo</span>
              </label>
            )}
          </div>

          {/* Botão submit */}
          <div className="form-actions">
            <button type="submit" className="btn-action salvar">
              Cadastrar Vítima
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
  )
}

export default CadastroVitima;