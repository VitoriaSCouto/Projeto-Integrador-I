import { useState } from "react";

const CadastroVitima = () => {
  // Estado para guardar a mensagem de sucesso ou erro
  const [mensagem, setMensagem] = useState('')
  // Estado para guardar a imagem em Base64
  const [fotoPerfil, setFotoPerfil] = useState(null)

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
    setFotoPerfil(base64)
  }
  reader.readAsDataURL(arquivo)
}

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
      fotoPerfil: fotoPerfil // Base64 da imagem
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
    <div>
      <form onSubmit={handleSubmit}>
        <h1>Cadastro de Vítima</h1>

        {/* Campo de texto para o nome */}
        <input type="text" name="nome" placeholder="Nome da Vítima" /><br/>

        {/* Campo de texto para o CPF */}
        <input type="text" name="cpf" placeholder="CPF" /><br/>

        {/* Campo de texto para o telefone */}
        <input type="text" name="telefone" placeholder="Telefone" /><br/>

        {/* Campo de data para a data de nascimento */}
        <input type="date" name="dataNascimento" /><br/>

        {/* Select para o gênero */}
        <select name="genero">
          <option value="">Selecione o gênero</option>
          <option value="masculino">Masculino</option>
          <option value="feminino">Feminino</option>
          <option value="outro">Outro</option>
        </select><br/>

        {/* Campo de arquivo para a foto de perfil */}
        {/* accept="image/*" limita apenas imagens */}
        {/* onChange chama o handleImagem quando o usuário selecionar */}
        <input type="file" accept="image/*" onChange={handleImagem} /><br/>

        <button type="submit">Cadastrar</button>

        {/* Só mostra a mensagem se ela não estiver vazia */}
        {mensagem && <p>{mensagem}</p>}
      </form>
    </div>
  );
};

export default CadastroVitima;