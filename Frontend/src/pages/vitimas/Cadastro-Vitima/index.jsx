import { useState } from "react";
import { FaHome, FaBoxOpen, FaUser, FaDonate, FaMapPin,
         FaIdCard, FaPhoneAlt, FaCalendar, FaVenusMars, FaUpload, FaMap } from 'react-icons/fa';
import { GoAlertFill } from "react-icons/go";
import { FaGear } from "react-icons/fa6";
import "../../pg_adm/style.css"; // ← importa o CSS global do projeto
import "./vitima.css"; 
import SidebarAdm from '../../../components/SidebarAdm';
import { fetchAdmin, hojeISO } from '../../../services/api';
import { LIMITES, EXEMPLOS, aoDigitar, somenteNome, mascaraCpf, mascaraTelefone, erroDosCampos } from '../../../utils/campos';
import { Obrigatorio, Opcional, AvisoObrigatorios } from '../../../components/MarcasCampo';


const CadastroVitima = () => {
  // Estado para guardar a mensagem de sucesso ou erro
  const [mensagem, setMensagem] = useState('')
  // true quando a mensagem é de erro (aparece em vermelho, não em verde)
  const [erroEnvio, setErroEnvio] = useState(false)
  // Estado para guardar a imagem em Base64
  const [fotoVitima, setfotoVitima] = useState(null)
  

  //----- Handle Image -----
  // Função que roda quando o usuário seleciona uma imagem
  const handleImagem = (e) => {
    const arquivo = e.target.files[0]
    // Cancelou a janela de seleção: não há arquivo
    if (!arquivo) return

    // Verifica o tamanho — 2MB = 2 * 1024 * 1024 bytes
    const limiteMB = 2
    if (arquivo.size > limiteMB * 1024 * 1024) {
       setErroEnvio(true)
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

    // Confere CPF (dígitos verificadores) e telefone antes de enviar
    const erroCampos = erroDosCampos({ cpf: e.target.cpf.value, telefone: e.target.telefone.value })
    if (erroCampos) {
      setErroEnvio(true)
      setMensagem(erroCampos)
      return
    }

    // Monta o objeto com os dados do formulário
    const dados = {
      nome: e.target.nome.value.trim(),
      cpf: e.target.cpf.value,
      // Telefone é único no banco: vazio vai como null (antes "" dava erro na 2ª vítima sem telefone)
      telefone: e.target.telefone.value.trim() || null,
      dataNascimento: e.target.dataNascimento.value,
      genero: e.target.genero.value,
      fotoVitima: fotoVitima // Base64 da imagem
    }

    // Envia os dados para a API
    try {
      const resposta = await fetchAdmin('/vitimas/cadastrar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(dados) // converte objeto para JSON
      })

      // Pega a resposta da API e atualiza a mensagem
      const resultado = await resposta.json().catch(() => ({}))
      setErroEnvio(!resposta.ok)
      setMensagem(resultado.mensagem ?? (resposta.ok ? 'Vítima cadastrada!' : `Erro ${resposta.status} ao cadastrar.`))
    } catch (erro) {
      console.error('Erro ao cadastrar vítima:', erro)
      setErroEnvio(true)
      setMensagem('Erro ao conectar com o servidor. Tente novamente.')
    }
  }

  return (
  <div className="dashboard">
    <SidebarAdm ativo="vitimas" />
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
        </header>

      {/* Formulário com duas colunas */}
      <form onSubmit={handleSubmit} className="cadastro-form-container">

        {/* Coluna esquerda: campos de texto */}
        <div className="form-column-left">

          <AvisoObrigatorios />

          {/* Nome: só letras (números são removidos ao digitar) */}
          <div className="form-group">
            <label htmlFor="nome"><FaUser /> Nome Completo<Obrigatorio /></label>
            <input type="text" id="nome" name="nome" placeholder="Ex: Maria da Silva"
              maxLength={LIMITES.nomePessoa} minLength={2} autoComplete="off" required
              onChange={aoDigitar(somenteNome)} />
          </div>

          {/* CPF e telefone: só números, a pontuação é colocada sozinha */}
          <div className="form-group">
            <label htmlFor="cpf"><FaIdCard /> CPF<Obrigatorio /></label>
            <input type="text" id="cpf" name="cpf" placeholder={EXEMPLOS.cpf} inputMode="numeric"
              maxLength={LIMITES.cpf} autoComplete="off" required
              onChange={aoDigitar(mascaraCpf)} />
          </div>

          <div className="form-group">
            <label htmlFor="telefone"><FaPhoneAlt /> Telefone<Opcional /></label>
            <input type="tel" id="telefone" name="telefone" placeholder={EXEMPLOS.telefone} inputMode="numeric"
              maxLength={LIMITES.telefone} autoComplete="off"
              onChange={aoDigitar(mascaraTelefone)} />
          </div>

          <div className="form-group">
            <label htmlFor="dataNascimento"><FaCalendar /> Data de Nascimento<Obrigatorio /></label>
            <input type="date" id="dataNascimento" name="dataNascimento" min="1900-01-01" max={hojeISO()} required />
          </div>

          <div className="form-group">
            <label htmlFor="genero"><FaVenusMars /> Gênero<Obrigatorio /></label>
            <select
             className="select-genero"
             id="genero"
             name="genero"
             required>
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
            Foto de Perfil<Opcional />
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
                <input type="file" accept="image/jpeg,image/png" onChange={handleImagem} style={{ display: 'none' }} />
                <FaUpload className="upload-icon" />
                <p>Foto de perfil da vítima (JPG ou PNG, até 2 MB)</p>
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
  )
}

export default CadastroVitima;