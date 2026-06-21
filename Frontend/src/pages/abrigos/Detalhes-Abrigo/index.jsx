//--------- Imports-----------
//Todos os imports necessarios para o código

import { useState, useEffect } from 'react';
import { useParams, useNavigate } from "react-router-dom";
import { 
  FaHome, FaBoxOpen, FaUser, FaDonate, FaMapPin, 
  FaUpload, FaMapMarkerAlt, FaPhoneAlt, FaDog, FaUserNurse,
  FaWheelchair, FaUtensils, FaBuilding, FaPeopleArrows,
  FaMedkit,FaMapMarkedAlt,
  FaLocationArrow, FaMap
} from 'react-icons/fa';
import { FaGear } from "react-icons/fa6";
import { GoAlertFill } from "react-icons/go";
import "../../pg_adm/style.css";
import './DetalhesAbrigo.css';

//Fim dos imports
//--------------------------

//------- Começo Função Principal -----
function DetalhesAbrigo() {


  // ─── ESTADOS ────────────────────────────────────────────────
  //Cada estado corresponde a um campo do formulário

  //Pega a ID que vem da URL
  const { id } = useParams();
  const navigate = useNavigate();

  //Const para receber os dados que seram puxados pelo Prisma
  const [regioes, setRegioes] = useState([])
  const [dadosAbrigo, setDadosAbrigo] = useState({})

  //Const usado para a tela de loading
  const [carregando, setCarregando] = useState(true);

  //O modo edição controla se a página está em modo de visualização ou edição
  const [editando, setEditando] = useState(false);

  //Consts dos dados da tabela Abrigo
  const [nomeAbrigo, setNomeAbrigo] = useState('');
  const [status, setStatus] = useState('ativo');
  const [cidade, setCidade] = useState('');
  const [endereco, setEndereco] = useState('');
  const [telefone, setTelefone] = useState('');
  const [responsavel, setResponsavel] = useState('');
  const [tipoAbrigo, setTipoAbrigo] = useState('');
  const [capacidadeTotal, setCapacidadeTotal] = useState(0);
  const [capacidadeOcupada, setCapacidadeOcupada] = useState(0);

  //Consts das fotos
  const [fotoUrl, setFotoUrl] = useState(null); //Foto "atual"
  const [novaFoto, setNovaFoto] = useState(null); //Variavel para atualizações
  const fotoExibida = novaFoto ?? fotoUrl; //Foto exibida

  //Consts dos erros
  const [erroCapacidade, setErroCapacidade] = useState('')

  //Const para validar a capacidade
  const validarCapacidade = (ocupada, total) => {
  // Só valida se os dois campos tiverem valor
  if (ocupada === 0 && total === 0) return

  if (ocupada > total) {
    setErroCapacidade('Capacidade ocupada não pode ser maior que a total.')
  } else {
    setErroCapacidade('')
  }
}

  //Essa divisão foi necessaria para corrigir o fluxo de como funcionava o upload das fotos
  //
  //                                       / Base64? Então ele sabe que é um arquivo novo, transformando em URL, subindo uma foto nova e apagando a anterior no processo.
  //    O que a API vai fazer? = Recebeu:  - Null? Então ele remove a foto do abrigo e do storage.
  //                                       \ Mesmo URL? Então ele não atualiza a foto E NEM CRIA OUTRA IDENTICA! (Isso por que agora as fotos usam ID como nome e não DATE())
  //
  //Isso melhora a sanidade mental do sistema. (Ele provavelmente deselvolveu uma depois de um certo erro criar 10 vezes a mesma imagem no banco)

  //Todos os campos de infraestrutura agrupados num único estado
  //Deixa mais organizado.
  const [infraestrutura, setInfraestrutura] = useState({
    possuiAtendimentoMedico: false,
    possuiEnfermagem: false,
    possuiPets: false,
    possuiAcessibilidade: false,
    possuiCozinha: false
  });


  //-------- Busca dos dados ao carregar a página ----------------
  
  useEffect(() => {

    //Primeiro: Busca Abrigo
    //Async é necessario para mexer com o banco, ele evita que o código rode rapido demais
    const buscarAbrigo = async () => {
      try {

        //Faz a requisição para a API passando o ID que veio da URL
        //Só puxa o Abrigo com o ID que veio da URL
        const resposta = await fetch(`http://localhost:3000/api/abrigos/listar/${id}`);
        //Armazena tudo que puxou do banco em dados.
        const dados = await resposta.json();

        //Cria um BACKUP dos dados do abrigo.
        setDadosAbrigo(dados)

        // Preenche cada estado com o que veio da API
        // O ?? é o operador nullish: se o valor vier null ou undefined, usa o valor padrão da direita
        setNomeAbrigo(dados.nome);
        setStatus(dados.status ?? 'ativo');
        setCidade(dados.cidade ?? '');
        setEndereco(dados.endereco ?? '');
        setTelefone(dados.telefone ?? '');
        setResponsavel(dados.responsavel ?? '');
        setTipoAbrigo(dados.tipoAbrigo ?? '');
        setCapacidadeTotal(dados.capacidadeTotal ?? 0);
        setCapacidadeOcupada(dados.capacidadeOcupada ?? 0);

        //FotoURL a "foto atual".
        // Atualiza a foto exibida com a URL vinda do banco
        // O '?t=' + Date.now() adiciona um timestamp único no final da URL
        // Isso força o navegador a buscar a foto nova em vez de usar o cache
        // Se não tiver foto no banco (null), mantém null
        setFotoUrl(dados.fotoAbrigo ? dados.fotoAbrigo + '?t=' + Date.now() : null)

        // Preenche todos os campos de infraestrutura de uma vez
        // Como todos existem no banco agora, todos são carregados da API
        setInfraestrutura({
          possuiAtendimentoMedico: dados.possuiAtendimentoMedico ?? false,
          possuiEnfermagem: dados.possuiEnfermagem ?? false,
          possuiPets: dados.possuiPets ?? false,
          possuiAcessibilidade: dados.possuiAcessibilidade ?? false,
          possuiCozinha: dados.possuiCozinha ?? false
        });

      //Se der erro, avisa o erro
      } catch (erro) {
        console.error("Erro ao buscar abrigo:", erro);
      } finally {
        //Para de mostrar o loading independente de dar certo ou errado
        setCarregando(false);
      }
    };

    //Segundo: Busca Região
    //Mesma lógica, porém menor por ser uma tabela secundaria.
    const buscarRegioes = async () => {
      const resposta = await fetch('http://localhost:3000/api/regioes/listar')
      const dados = await resposta.json()

      //Uma forma diferente.. ao inves de criar um Set para cada, ele joga tudo no Regioes
      //Para chamar: regioes.cidade (exemplo)
      setRegioes(dados.regioes)
    }

    //Terceiro: Roda as consts criadas.
    //Roda sempre que o :id da URL mudar
    //O ID não afeta o regiões, já que ele usa uma URL GET que puxa tudo, diferente do abrigo que tem um :id no final.
    buscarAbrigo();
    buscarRegioes();
  }, [id]);

  //-------- Handlers --------
  //Funções, grandes funções.
  //Normalmente usadas em onClick.

  //Handler das CheckBox
  //Atualiza apenas o campo alterado dentro do objeto infraestrutura
  //O ...prev preserva os outros campos que não foram alterados
  const handleCheckboxChange = (e) => {
    const { name, checked } = e.target;
    setInfraestrutura(prev => ({ ...prev, [name]: checked }));
  };

  //Handler da imagem
  const handleImagem = (e) => {
   const arquivo = e.target.files[0]
   //Limite de MB por foto.
   const limiteMB = 2
    if (arquivo.size > limiteMB * 1024 * 1024) {
       alert(`A imagem deve ter no máximo ${limiteMB}MB.`)
      return
    }
   const reader = new FileReader()
   reader.onloadend = () => {
     setNovaFoto(reader.result) // guarda completo com prefixo ID: para o preview funcionar
    } 
   reader.readAsDataURL(arquivo)
  }

  //Handler do botão salvar.
  //Envia os dados atualizados para a API via URL PUT do Abrigo
  const handleSalvar = async (e) => {
    e.preventDefault();

    
      //Verifica se o capacidadeOcupada é maior que o capacidadeTotal, se for verdade o formulario não sobe.
      if (capacidadeOcupada>capacidadeTotal){
        if (erroCapacidade) return
      }


    try {
      //Armazena o resultado do fetch na resposta
       const resposta = await fetch(`http://localhost:3000/api/abrigos/atualizar/${id}`, {  //<== Essa aqui
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },

        // Envia TODOS os campos que a API espera receber
        // O ...infraestrutura expande os campos do objeto dentro do body
        body: JSON.stringify({ 
          nome: nomeAbrigo,
          status,
          cidade,
          endereco, 
          telefone,
          responsavel,
          tipoAbrigo,
          capacidadeTotal,
          capacidadeOcupada,

          //Se novaFoto tiver algo (usuário selecionou uma foto nova) → manda só o base64 puro, sem o prefixo id:image/jpeg;base64,
          //Se novaFoto for null (não selecionou foto nova, ou clicou em remover) → manda null
          //Se nada mudou, nada muda, nada é apagado, nada é criado e a foto é mantida (Por conta do False)
          //FLUXO:
          //Usuário não mexeu na foto  → novaFoto = null  → manda fotoUrl  → backend mantém
          //Usuário removeu a foto     → novaFoto = false → manda null     → backend deleta
          //Usuário escolheu foto nova → novaFoto = "..." → manda base64   → backend faz upload

          fotoAbrigo: novaFoto === false ? null : novaFoto ? novaFoto.split(',')[1] : fotoUrl,
          ...infraestrutura
        }),
      });

      const dadosResultado = await resposta.json()
      console.log('status da resposta:', resposta.status);
      console.log('resultado:', dadosResultado);

      //Qualquer coisa parecia que estourava o sistema inteiro, tive que mudar muita coisa.
      //Mas porque mudar?:
      //Queria deixar o sistema bonito e principalmente intuitivo, então quando voce atualiza a foto no Banco ela ja vai aparecer no preview na hora.
      //Antes era necessario recarregar a página, e ai tinha um problema:
        //Mesmo se você atualizasse a foto, a antiga voltava quando recarregasse ou saisse da pagina e voltasse.
        //Mas porque dava erro?:
        //A porcaria do Cache do navegador.
        //O navegador ele é otimiza o código e o fluxo, só que ai tem um pequeno problema que surgiu de outro problema.
        //Ele buscava a URL da foto do Supabase, só que a URL da foto nunca muda, apenas o conteudo!
        //Por conta disso o navegador preferia usar o URL da foto que ja estava salva no cache!!
          //Mas porque a mesma URL?:
          //Para não fazer funcionar o sistema de fotos no Supabase eu escolhi salvar o nome das fotos como como abrigo-IDdoAbrigo.
          //Isso foi feio especificamente para não mudar o URL, já que se mudasse o URL, não ia ser possivel apagar a foto do Supabase!
          //Deve ter um jeito mais facil para arrumar isso, mas acredito que esse foi o mais simples e facil.
      //Resumindo: é preciso ter cuidado na hora de mexer nos arquivos que ligam o SupaStorage com o sistema.


      //Aqui trabalha em conjunto com o HandleCancelEditar
      //Basicamente, o HandleCancel serve para que quando você Cancele a edição o código retorne a como estava antes
      //Mas e se o usuario retornar DEPOIS de ja ter salvo? ele voltaria para o código que estava antes do Update.
      setDadosAbrigo({
       ...dadosAbrigo,
       nome: nomeAbrigo,
       cidade,
       endereco,
       telefone,
       responsavel,
       tipoAbrigo,
       capacidadeTotal,
       capacidadeOcupada,
       possuiAtendimentoMedico: infraestrutura.possuiAtendimentoMedico,
       possuiEnfermagem: infraestrutura.possuiEnfermagem,
       possuiPets: infraestrutura.possuiPets,
       possuiAcessibilidade: infraestrutura.possuiAcessibilidade,
       possuiCozinha: infraestrutura.possuiCozinha
      })

      //Atualiza a foto exibida com a URL nova do banco (com timestamp anti-cache)
      setFotoUrl(dadosResultado.fotoAbrigo ? dadosResultado.fotoAbrigo + '?t=' + Date.now() : null);
      alert('Abrigo atualizado com sucesso!');
      setNovaFoto(null);  //limpa a foto nova após salvar
      setEditando(false); //Volta pro modo de Visualização

    } catch (erro) {
      console.error("Erro ao salvar:", erro);
    }

  };

  //Handler do botão excluir
  //Exclui o abrigo após confirmação do usuário
  const handleExcluir = async () => {
    // Pede confirmação antes de excluir para evitar exclusões acidentais
    if (!confirm('Tem certeza que deseja excluir este abrigo?')) return;
    try {

      //Apaga o abrigo selecionado e volta pro Hub de abrigos.
      await fetch(`http://localhost:3000/api/abrigos/excluir/${id}`, {
      method: 'DELETE' });
      navigate('/abrigos');
    } 
    catch (erro) {
      console.error("Erro ao excluir:", erro);
    }
  };

  //Handler do botão entrar edição
  //Entra no modo edição e sai do modo view
  const handleEditar = async () =>{
    setEditando(true)
    validarCapacidade(capacidadeOcupada, capacidadeTotal)
  }

  //Handler do botão cancelar edição
  //Volta pro modo view e realiza mais algumas coisas:
  const handleCancelExcluir = async () =>{
    //Esse aqui eu fiz ele mais como um teste para aprendizado
    
    //Se tiver errado, não permite voltar
    if (capacidadeOcupada>capacidadeTotal){
      if (erroCapacidade) return
    }

    //Volta pro modo view
    setEditando(false);
    //Volta tudo pro original
    setNomeAbrigo(dadosAbrigo.nome);
    setCidade(dadosAbrigo.cidade);
    setEndereco(dadosAbrigo.endereco)
    setTelefone(dadosAbrigo.telefone);
    setResponsavel(dadosAbrigo.responsavel);
    setTipoAbrigo(dadosAbrigo.tipoAbrigo);
    setCapacidadeTotal(dadosAbrigo.capacidadeTotal);
    setCapacidadeOcupada(dadosAbrigo.capacidadeOcupada);
    setInfraestrutura({  
     possuiAtendimentoMedico: dadosAbrigo.possuiAtendimentoMedico ?? false,
     possuiEnfermagem: dadosAbrigo.possuiEnfermagem ?? false,
     possuiPets: dadosAbrigo.possuiPets ?? false,
     possuiAcessibilidade: dadosAbrigo.possuiAcessibilidade ?? false,
     possuiCozinha: dadosAbrigo.possuiCozinha ?? false}
    )

  }

  //------- Tela de loading ------
  // Enquanto a API não respondeu, mostra uma mensagem para o usuário não ver a tela vazia
  if (carregando) {

    //Enquanto carrega:
    return (
      <div className="dashboard">
        <aside className="sidebar">
          <ul>
            <a href="/pg_adm"><li><FaHome className="icon" /> Home</li></a>
            <a href="/abrigos"><li className="active"><FaBoxOpen className="icon" />Abrigos</li></a>
            <a href="/vitimas"><li><FaUser className="icon" /> Vítimas</li></a>
            <li><FaDonate className="icon" /> Doações</li>
            <a href="/mapa"><li><FaMap className="icon" />Mapa</li></a>
            <li><GoAlertFill className="icon" /> Ocorrências</li>
            <li><FaGear className="icon" /> Configurações</li>
          </ul>
        </aside>
        <main className="main">
          <p style={{ padding: '40px', color: '#64748b' }}>Carregando dados do abrigo...</p>
        </main>
      </div>
    );
  }

  //------- Tela Principal (Carregado) ------
  return (

    <div className="dashboard">

      {/* Código do Sidebar */}
      <aside className="sidebar">
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

      {/* Código do Main */}
      <main className="main">

        <header className="top">
          <div>
            {/* Breadcrumb mostrando o nome do abrigo que veio da API */}
            <p style={{ fontSize: '14px', color: '#64748b', margin: 0 }}>
              Abrigos &gt; <span>{nomeAbrigo}</span>
            </p>

            {/* Título muda dependendo do modo */}
            <h1 style={{ fontSize: '26px', fontWeight: '700', color: '#0f172a', marginTop: '4px' }}>
              {/* Muda dependendo do modo */}
              {editando ? 'Editar Abrigo' : 'Detalhes do Abrigo'}
            </h1>
            <p className="subtitle"> Gerencia as informações deste abrigo</p>

          </div>
          <div className="top-icons">

            <img src="/src/assets/logo.png" width="80px" alt="Logo" />

          </div>
        </header>

        {/* --- COMEÇO DO FORMULARIO --- */}
        <form onSubmit={handleSalvar} className="cadastro-form-container">

          {/* --- COLUNA ESQUERDA: campos de texto e checkboxes */}
          <div className="form-column-left">

            {/*
              Tudo aqui apresenta um modo diferente dependendo se a edição estiver ativa ou não:

              O Status por exemplo apresenta: disabled={!editando} no select dele.
              Isso é para desabilitar durante a edição:
              O disabled bloqueia a interação mas o browser aplica um estilo acinzentado por padrão
              Para remover esse estilo acinzentado e manter a cor do status, adicionamos CSS inline
              O pointerEvents: 'none' remove o cursor de clique quando desabilitado
              O appearance: 'none' e WebkitAppearance: 'none' removem a seta do select
            */}

            {/* Select do Status */}
            <div className="form-group">
              <label htmlFor="status">Status</label>
              <select
                id="status"
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                className={`select-status ${status}`}
                disabled={!editando}
                style={!editando ? {
                  opacity: 1,
                  cursor: 'default',
                  appearance: 'none',
                  WebkitAppearance: 'none'
                } : {}}
              >
                <option value="ativo">Ativado</option>
                <option value="manutencao">Manutenção</option>
                <option value="desativado">Desativado</option>
              </select>
            </div>
            
            {/* Texto do Nome */}
            <div className="form-group">
              <label><FaBuilding /> Nome do Abrigo</label>

              {/* Exemplo de Modo edição */}
              
              {editando ? (
                //Se ligado:
                <input value={nomeAbrigo} onChange={(e) => setNomeAbrigo(e.target.value)} />
              ) : (
                //Se desligado:
                <p>{nomeAbrigo}</p>
              )}
            </div>

            {/* Select da Cidade */}
            <div className="form-group">
              <label><FaMapMarkedAlt /> Cidade</label>

              {editando ? (
                //Se ligado:
                <select value={cidade} onChange={(e) => setCidade(e.target.value)} className="select-cidade">
                <option value="">Selecione a cidade</option>
                {/* O Select puxa as cidades + estados cadastrados no banco*/}
                {regioes.map((regiao) => (
                  <option key={regiao.id} value={regiao.cidade}>
                   {regiao.cidade} - {regiao.estado}
                  </option>
                  )) 
                }
                </select>
              ) : (
                //Se desligado:
                <p>{cidade}</p>
              )}
            </div>

            {/* Texto do Endereço */}
            <div className="form-group">
              <label><FaMapMarkerAlt /> Endereço</label>

              {editando ? (
                //Se ligado:
                <input value={endereco} onChange={(e) => setEndereco(e.target.value)} />
              ) : (
                //Se desligado:
                <p>{endereco}</p>
              )}
            </div>

            {/* Texto do Telefone */}
            <div className="form-group">
              <label><FaPhoneAlt /> Telefone</label>

              {editando ? (
                //Se ligado:
                <input value={telefone} onChange={(e) => setTelefone(e.target.value)} />
              ) : (
                //Se desligado:
                <p>{telefone}</p>
              )}
            </div>

            {/* Texto do Responsável */}
            <div className="form-group">
              <label><FaUser /> Responsável</label>

              {editando ? (
                //Se ligado:
                <input value={responsavel} onChange={(e) => setResponsavel(e.target.value)} />
              ) : (
                //Se desligado:
                <p>{responsavel}</p>
              )}
            </div>

            {/* Select Tipo de abrigo */}
            <div className="form-group">
              <label><FaBuilding /> Tipo de Abrigo</label>

              {editando ? (
                //Se ligado:
                <select value={tipoAbrigo} onChange={(e) => setTipoAbrigo(e.target.value)} className="select-tipo-abrigo">
                  <option value="Escola">Escola</option>
                  <option value="Ginásio">Ginásio</option>
                  <option value="Igreja">Igreja</option>
                  <option value="Hotel">Hotel</option>
                  <option value="Pousada">Pousada</option>
                  <option value="CentroCultural">Centro Cultural</option>
                  <option value="CentroComunitário">Centro Comunitário</option>
                  <option value="Campo">Campo</option>
                </select>
              ) : (
                //Se desligado:
                <p>{tipoAbrigo}</p>
              )}
            </div>

            {/* Texto da capacidade total */}
            <div className="form-group">
              <label><FaPeopleArrows /> Capacidade Total</label>

              {editando ? (
                //Se ligado:
                <input
                type="number"
                name="capacidadeTotal"
                value={capacidadeTotal}
                required
                onChange={(e) => {
                  const total = parseInt(e.target.value)
                  setCapacidadeTotal(total)
                  validarCapacidade(capacidadeOcupada, total)
                }}
                />
              ) : (
                //Se desligado:
                <p>{capacidadeTotal}</p>
              )}
            </div>

            {/* Texto da capacidade ocupada */}
            <div className="form-group">
              <label><FaPeopleArrows /> Capacidade Ocupada</label>

              {editando ? (
                //Se ligada:
                <input 
                type="number"
                name="capacidadeOcupada"
                value={capacidadeOcupada}
                className={`input-capacidade ${erroCapacidade ? 'input-erro' : ''}`} 
                onChange={(e) => {
                  const ocupada = parseInt(e.target.value)
                  setCapacidadeOcupada(ocupada)
                  validarCapacidade(ocupada, capacidadeTotal) // valida com o novo ocupada
                }}/>
              ) : (
                //Se desligada:
                <p>{capacidadeOcupada}</p>
              )}
            </div>

            {/* Verifica se o Ocupada é maior que o Total */}
            {erroCapacidade && (
            <p style={{ color: '#ef4444', fontSize: '13px', marginTop: '4px' }}>
            {erroCapacidade}
            </p>
            )}

            {/* CheckBox da Infraestrutura*/}
            {/* Tudo é Boolean, ou seja: True ou False */}
            <div className="infraestrutura-section">
              <h3 style={{ fontSize: '16px', fontWeight: '700', color: '#1e293b', marginBottom: '12px' }}>
                Infraestrutura
              </h3>

              {/* 
                Assim como o Status.
                disabled={!editando} bloqueia a interação quando não está editando
                O label também recebe pointerEvents: 'none' para remover o cursor de clique
                pois o label engloba o checkbox e sem isso o clique no card ainda funciona
              */}

              {/* Check Atendimento */}
              <label className="checkbox-card" style={!editando ? { pointerEvents: 'none' } : {}}>
                <input
                  type="checkbox"
                  name="possuiAtendimentoMedico"
                  checked={infraestrutura.possuiAtendimentoMedico}
                  onChange={handleCheckboxChange}
                  disabled={!editando}
                />
                <div className="checkbox-content">
                  <FaMedkit className="icon" /><span>Atendimento Médico</span>
                </div>
              </label>

              {/* Check Enfermagem */}
              <label className="checkbox-card" style={!editando ? { pointerEvents: 'none' } : {}}>
                <input
                  type="checkbox"
                  name="possuiEnfermagem"
                  checked={infraestrutura.possuiEnfermagem}
                  onChange={handleCheckboxChange}
                  disabled={!editando}
                />
                <div className="checkbox-content">
                  <FaUserNurse className="icon" /><span>Enfermagem</span>
                </div>
              </label>

              {/* Check Pets */}
              <label className="checkbox-card" style={!editando ? { pointerEvents: 'none' } : {}}>
                <input
                  type="checkbox"
                  name="possuiPets"
                  checked={infraestrutura.possuiPets}
                  onChange={handleCheckboxChange}
                  disabled={!editando}
                />
                <div className="checkbox-content">
                  <FaDog className="icon" /><span>Pets Bem-Vindos</span>
                </div>
              </label>

              {/* Check Acessibilidade */}
              <label className="checkbox-card" style={!editando ? { pointerEvents: 'none' } : {}}>
                <input
                  type="checkbox"
                  name="possuiAcessibilidade"
                  checked={infraestrutura.possuiAcessibilidade}
                  onChange={handleCheckboxChange}
                  disabled={!editando}
                />
                <div className="checkbox-content">
                  <FaWheelchair className="icon" /><span>Acessibilidade</span>
                </div>
              </label>

              {/* Check Cozinha */}
              <label className="checkbox-card" style={!editando ? { pointerEvents: 'none' } : {}}>
                <input
                  type="checkbox"
                  name="possuiCozinha"
                  checked={infraestrutura.possuiCozinha}
                  onChange={handleCheckboxChange}
                  disabled={!editando}
                />
                <div className="checkbox-content">
                  <FaUtensils className="icon" /><span>Cozinha Comunitária</span>
                </div>
              </label>

              {/* Aberto para mais Checks. */}
              {/* Se quiser adicionar:
                  ADD no banco, ADD no Abrigo.JS, ADD no Cadastro Abrigo e ADD no Detalhes Abrigo.
                  Adicionar em todos os métodos também.
              */}

            </div>
          </div>

          {/* --- COLUNA DIREITA: upload de imagem e botões */}
          <div className="form-column-right">
           {/* Aqui começa a parte da direita, os códigos aqui mexem bastante com os Handlers
               e com o Modo edição. O diferencial daqui é que o modo edição estar ativo muda grande parte do código.*/}

            {/*Começo do Formulario da Direita, lembrando que os dois Formularios*/}
            <h3 style={{ fontSize: '16px', fontWeight: '700', color: '#1e293b', marginBottom: '12px' }}>
              Imagem do Abrigo
            </h3>

            {/*  -----  Parte da foto  ----- */}
            <>
                {/*
                Modo visualização: mostra a foto dentro do retângulo
                Se não tiver foto, mostra "Sem foto cadastrada"
                O upload-container mantém o mesmo tamanho e borda do modo edição
                */}

              {editando ? (
                //Se ligado:
                <div className="upload-container">
                {fotoExibida ? (

                  //Caso tenha foto:
                  <div className="image-preview">
                    <img src={fotoExibida} alt="Preview do abrigo" />

                    {/* Botão de Remover */}
                    <button type="button" onClick={() => {

                      //Antes de clicar:
                      //fotoUrl = "https://supabase.com/foto.jpg"  → aparece na tela
                      //novaFoto = null                            → não mexeu em nada
                      
                      //Depois de Clicar
                      //fotoUrl = null    → preview some da tela
                      //novaFoto = false  → sinaliza "removeu" para o handleSalvar

                       setNovaFoto(false);
                       setFotoUrl(null); }} className="btn-remove-image">
                      Remover Foto
                    </button>
                  </div>
                ) : (
               
                  //Caso não tenha foto:
                  <label className="upload-dropzone">
                    <input type="file" accept="image/*" onChange={handleImagem} style={{ display: 'none' }} />
                    <FaUpload className="upload-icon" />
                    <p>Faça upload da foto principal do abrigo</p>
                    <span className="btn-upload-trigger">Selecionar arquivo do computador</span>
                  </label>
                )}
               </div>
              ) : (
               //Se edição desligada:
                //Modo view       
                <div className="upload-container">
                {fotoExibida ? (
                  <img src={fotoExibida} alt={nomeAbrigo} style={{ maxWidth: '100%', maxHeight: '100%', borderRadius: '8px' }} />
                ) : (
                  <p style={{ color: '#94a3b8', fontSize: '14px' }}>Sem foto cadastrada</p>
                )}
                </div>
             )}
            </>

            {/* ----- Parte dos botões -----*/}
            <div className="form-actions">
              {/* Botões mudam dependendo do modo */}
              {editando ? (
                //Se ligado:

                <> {/* Essa coisa <> é um <react_fragment> abreviado, ele é necessario para retornar algo sem criar uma div */}

                  {/*Botão Salvar - Handler Salvar */}
                  <button type="submit"className="btn-action salvar">Salvar Alterações</button>
                  <div className="danger-actions">

                    {/*Botão Excluir - Handler Excluir */}
                    <button type="button" onClick={handleExcluir} className="btn-action excluir">
                      Excluir Registro
                    </button>
                    {/*Botão Cancelar Edição - Handler CancelExcluir */}
                    <button type="button" onClick={handleCancelExcluir} className="btn-action cancelar">
                      Cancelar edição
                    </button>

                  </div>
                </>
              ) : (
                //Se desligado:
                //Não tem botão ;)
                null
              )}
                {/* No modo visualização só aparece o botão de entrar no modo edição */}
                {editando ? null : (
                  <button type="button" onClick={handleEditar}
                  className="btn-action cancelar">
                  Editar Abrigo
                  </button>
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
}

export default DetalhesAbrigo;