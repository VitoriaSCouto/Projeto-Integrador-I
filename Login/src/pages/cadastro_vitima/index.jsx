import { useState, useEffect } from "react";

const CadastroVitima = () => {
  const [mensagem, setMensagem] = useState('')
  const [vitima, setVitima] = useState([])
//classe vetor template, classe lista encadeada template, fazer uma main que usa o rgb como template. 
  useEffect(() => {
  const buscarVitimas = async () => { // função dentro
    const resposta = await fetch('http://localhost:3000/api/vitimas/listar')
    const dados = await resposta.json()
    setVitima(dados.vitimas)
  }
  buscarVitimas() // chama logo em seguida
}, [])

  const handleSubmit = async (e) => {
    e.preventDefault()

    const dados = {
      nome: e.target.nome.value,
      cpf: e.target.cpf.value,
      telefone: e.target.telefone.value,
      dataNascimento: e.target.dataNascimento.value,
      genero: e.target.genero.value,
      fotoPerfil: e.target.fotoPerfil.value
    }

    const resposta = await fetch('http://localhost:3000/api/vitimas/cadastrar', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(dados)
    })

    const resultado = await resposta.json()
    setMensagem(resultado.mensagem)
  }

  return (
    <div>
      <form onSubmit={handleSubmit}>
        <h1>Cadastro de Vítima</h1>
        <input type="text" name="nome" placeholder="Nome da Vítima" /><br/>
        <input type="text" name="cpf" placeholder="CPF" /><br/>
        <input type="text" name="telefone" placeholder="Telefone" /><br/>
        <input type="date" name="dataNascimento" placeholder="Data de Nascimento" /><br/>
        <select name="genero">
          <option value="">Selecione o gênero</option>
          <option value="masculino">Masculino</option>
          <option value="feminino">Feminino</option>
          <option value="outro">Outro</option>
        </select><br/>
        <input type="text" name="fotoPerfil" placeholder="URL da Foto de Perfil" /><br/>
        <button type="submit">Cadastrar</button>
        {mensagem && <p>{mensagem}</p>}
      </form>
    </div>
  );
};

export default CadastroVitima;