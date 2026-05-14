import { useState } from "react";

const CadastroAbrigo = () => {
  const [mensagem, setMensagem] = useState('')

  const handleSubmit = async (e) => {
    e.preventDefault()

    const dados = {
      nome: e.target.nome.value,
      endereco: e.target.endereco.value,
      telefone: e.target.telefone.value,
      responsavel: e.target.responsavel.value,
      tipoAbrigo: e.target.tipoAbrigo.value,
      capacidadeTotal: Number(e.target.capacidadeTotal.value)
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
    <div>
      <form onSubmit={handleSubmit}>
        <h1>Cadastro de Abrigo</h1>
        <input type="text" name="nome" placeholder="Nome do Abrigo" /><br/>
        <input type="text" name="endereco" placeholder="Endereço" /><br/>
        <input type="text" name="telefone" placeholder="Telefone" /><br/>
        <input type="text" name="responsavel" placeholder="Responsável" /><br/>
        <input type="text" name="tipoAbrigo" placeholder="Tipo do Abrigo" /><br/>
        <input type="number" name="capacidadeTotal" placeholder="Capacidade Total" /><br/>
        <button type="submit">Cadastrar</button>
        {mensagem && <p>{mensagem}</p>}
      </form>
    </div>
  );
};

export default CadastroAbrigo;