import { useState, useEffect } from "react";

const CadastroAbrigo = () => {
  const [mensagem, setMensagem] = useState('')
  const [regioes, setRegioes] = useState([])

  useEffect(() => {
  const buscarRegioes = async () => { // função dentro
    const resposta = await fetch('http://localhost:3000/api/regioes/listar')
    const dados = await resposta.json()
    setRegioes(dados.regioes)
  }
  buscarRegioes() // chama logo em seguida
}, [])

  const handleSubmit = async (e) => {
    e.preventDefault()

    const dados = {
      nome: e.target.nome.value,
      endereco: e.target.endereco.value,
      telefone: e.target.telefone.value,
      responsavel: e.target.responsavel.value,
      tipoAbrigo: e.target.tipoAbrigo.value,
      capacidadeTotal: Number(e.target.capacidadeTotal.value),
      capacidadeOcupada: Number(e.target.capacidadeOcupada.value) || 0
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
        <select name="endereco">
          <option value="">Selecione a região</option>
          {regioes.map((regiao) => (
            <option key={regiao.id} value={regiao.cidade}>
              {regiao.cidade} - {regiao.estado}
            </option>
          ))}
        </select><br/>
        <input type="text" name="telefone" placeholder="Telefone" /><br/>
        <input type="text" name="responsavel" placeholder="Responsável" /><br/>
        <input type="text" name="tipoAbrigo" placeholder="Tipo do Abrigo" /><br/>
        <input type="number" name="capacidadeTotal" placeholder="Capacidade Total" /><br/>
        <input type="number" name="capacidadeOcupada" placeholder="Capacidade Ocupada" /><br/>
        <button type="submit">Cadastrar</button>
        {mensagem && <p>{mensagem}</p>}
      </form>
    </div>
  );
};

export default CadastroAbrigo;