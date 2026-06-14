import { useState, useEffect } from "react";

const CadastrarAbrigo = () => {
  const [mensagem, setMensagem] = useState('')
  const [fotoAbrigo, setFotoAbrigo] = useState(null)
  const [regioes, setRegioes] = useState([])

  useEffect(() => {
  const buscarRegioes = async () => { // função dentro
    const resposta = await fetch('http://localhost:3000/api/regioes/listar')
    const dados = await resposta.json()
    setRegioes(dados.regioes)
  }
  buscarRegioes() // chama logo em seguida
}, [])

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

  const handleSubmit = async (e) => {
    e.preventDefault()

    const dados = {
      nome: e.target.nome.value,
      cidade: e.target.cidade.value,
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
        <input type="text" name="nome" placeholder="Nome do Abrigo" required /><br/>

        <select name="cidade" required>
          <option value=""disabled>Selecione a cidade</option>
          {regioes.map((regiao) => (
            <option key={regiao.id} value={regiao.cidade}>
              {regiao.cidade} - {regiao.estado}
            </option>
          ))}
        </select><br/>
        
        <input type="text" name="endereco" placeholder="Endereço" required /><br/>
        <input type="text" name="telefone" placeholder="Telefone" required /><br/>
        <input type="text" name="responsavel" placeholder="Responsável" required /><br/>
        <select name="tipoAbrigo" required>
                <option value=""disabled>Selecione o tipo de abrigo</option>
                <option value="Escola">Escola</option>
                <option value="Ginásio">Ginásio</option>
                <option value="Igreja">Igreja</option>
                <option value="Hotel">Hotel</option>
                <option value="Pousada">Pousada</option>
                <option value="CentroCultural">Centro Cultural</option>
                <option value="CentroComunitário">Centro Comunitário</option>
                <option value="Campo">Campo</option>
        </select><br/>
        <input type="number" name="capacidadeTotal" placeholder="Capacidade Total" required /><br/>
        <input type="number" name="capacidadeOcupada" placeholder="Capacidade Ocupada" required /><br/>
        <input type="checkbox" name="possuiAtendimentoMedico" />Possui Atendimento Médico<br/>
        <input type="checkbox" name="possuiEnfermagem" />Possui Enfermagem<br/>
        <input type="checkbox" name="possuiPets" />Possui Pets<br/>
        <input type="checkbox" name="possuiAcessibilidade" />Possui Acessibilidade<br/>
        <input type="checkbox" name="possuiCozinha" />Possui Cozinha<br/>

        <input type="file" accept="image/*" onChange={handleImagem} /><br/>

        <button type="submit">Cadastrar</button>
        {mensagem && <p>{mensagem}</p>}
      </form>
    </div>
  );
};

export default CadastrarAbrigo;