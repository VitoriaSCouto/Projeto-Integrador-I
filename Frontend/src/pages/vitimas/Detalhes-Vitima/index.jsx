//--------- Imports-----------
//Todos os imports necessarios para o código

import { useState, useEffect } from 'react';
import { useParams, useNavigate } from "react-router-dom";
import { 
  FaHome, FaBoxOpen, FaUser, FaDonate, FaMapPin, 
  FaUpload, FaMapMarkerAlt, FaPhoneAlt, FaDog, FaUserNurse,
  FaWheelchair, FaUtensils, FaBuilding, FaPeopleArrows, FaIdCard,
  FaMedkit,FaMapMarkedAlt,
  FaLocationArrow,
  FaCalendar, FaMap
} from 'react-icons/fa';
import { FaGear } from "react-icons/fa6";
import { FaPersonHalfDress } from "react-icons/fa6";
import { GoAlertFill } from "react-icons/go";

import "../../pg_adm/style.css";
import './DetalhesVitima.css';

//Fim dos imports
//--------------------------

//------- Começo Função Principal -----
function DetalhesVitimas() {


  // ─── ESTADOS ────────────────────────────────────────────────
  //Cada estado corresponde a um campo do formulário

  //Pega a ID que vem da URL
  const { id } = useParams();
  const navigate = useNavigate();

  //Const para receber os dados que seram puxados pelo Prisma
  const [dadosVitima, setDadosVitima] = useState({})

  //Const usado para a tela de loading
  const [carregando, setCarregando] = useState(true);

  //O modo edição controla se a página está em modo de visualização ou edição
  const [editando, setEditando] = useState(false);

  //Consts dos dados da tabela vitima
  const [nomeVitima, setNomeVitima] = useState('');
  const [cpf, setCpf] = useState('');
  const [telefone, setTelefone] = useState('');
  const [dataNascimento, setDataNascimento] = useState('');
  const [genero, setGenero] = useState('');

  //Consts das fotos
  const [fotoUrl, setFotoUrl] = useState(null); //Foto "atual"
  const [novaFoto, setNovaFoto] = useState(null); //Variavel para atualizações
  const fotoExibida = novaFoto ?? fotoUrl; //Foto exibida


  //Essa divisão foi necessaria para corrigir o fluxo de como funcionava o upload das fotos
  //
  //                                       / Base64? Então ele sabe que é um arquivo novo, transformando em URL, subindo uma foto nova e apagando a anterior no processo.
  //    O que a API vai fazer? = Recebeu:  - Null? Então ele remove a foto do vitima e do storage.
  //                                       \ Mesmo URL? Então ele não atualiza a foto E NEM CRIA OUTRA IDENTICA! (Isso por que agora as fotos usam ID como nome e não DATE())
  //
  //Isso melhora a sanidade mental do sistema. (Ele provavelmente deselvolveu uma depois de um certo erro criar 10 vezes a mesma imagem no banco)

  //-------- Busca dos dados ao carregar a página ----------------
  
  useEffect(() => {

    //Busca Vítima
    //Async é necessario para mexer com o banco, ele evita que o código rode rapido demais
    const buscarVitima = async () => {
      try {

        //Faz a requisição para a API passando o ID que veio da URL
        //Só puxa o vitima com o ID que veio da URL
        const resposta = await fetch(`http://localhost:3000/api/vitimas/listar/${id}`);
        //Armazena tudo que puxou do banco em dados.
        const dados = await resposta.json();

        //Cria um BACKUP dos dados do vitima.
        setDadosVitima(dados)

        // Preenche cada estado com o que veio da API
        // O ?? é o operador nullish: se o valor vier null ou undefined, usa o valor padrão da direita
        setNomeVitima(dados.nome);
        setCpf(dados.cpf ?? '');
        setTelefone(dados.telefone ?? '');
        setDataNascimento(dados.dataNascimento ?? '');
        setGenero(dados.genero ?? '');
   
        //FotoURL a "foto atual".
        // Atualiza a foto exibida com a URL vinda do banco
        // O '?t=' + Date.now() adiciona um timestamp único no final da URL
        // Isso força o navegador a buscar a foto nova em vez de usar o cache
        // Se não tiver foto no banco (null), mantém null
        setFotoUrl(dados.fotoVitima ? dados.fotoVitima + '?t=' + Date.now() : null)

        // Preenche todos os campos de infraestrutura de uma vez
        // Como todos existem no banco agora, todos são carregados da API

      //Se der erro, avisa o erro
      } catch (erro) {
        console.error("Erro ao buscar vitima:", erro);
      } finally {
        //Para de mostrar o loading independente de dar certo ou errado
        setCarregando(false);
      }
    };

    //Terceiro: Roda as consts criadas.
    //Roda sempre que o :id da URL mudar
    buscarVitima();
  }, [id]);

  //-------- Handlers ---------
  //Funções, grandes funções.
  //Normalmente usadas em onClick.

  //Handler das CheckBox
  //Atualiza apenas o campo alterado dentro do objeto infraestrutura

  //Desabilitado por não tem checkbox

  //O ...prev preserva os outros campos que não foram alterados
  //const handleCheckboxChange = (e) => {
  //  const { name, checked } = e.target;
  //  setInfraestrutura(prev => ({ ...prev, [name]: checked }));
  //};

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
  //Envia os dados atualizados para a API via URL PUT do vitima
  const handleSalvar = async (e) => {
    e.preventDefault();


    try {
      //Armazena o resultado do fetch na resposta
       const resposta = await fetch(`http://localhost:3000/api/vitimas/atualizar/${id}`, {  //<== Essa aqui
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },

        // Envia TODOS os campos que a API espera receber
        // O ...infraestrutura expande os campos do objeto dentro do body
        body: JSON.stringify({ 
          nome: nomeVitima,
          cpf, 
          telefone,
          dataNascimento,
          genero,

          //Se novaFoto tiver algo (usuário selecionou uma foto nova) → manda só o base64 puro, sem o prefixo id:image/jpeg;base64,
          //Se novaFoto for null (não selecionou foto nova, ou clicou em remover) → manda null
          //Se nada mudou, nada muda, nada é apagado, nada é criado e a foto é mantida (Por conta do False)
          //FLUXO:
          //Usuário não mexeu na foto  → novaFoto = null  → manda fotoUrl  → backend mantém
          //Usuário removeu a foto     → novaFoto = false → manda null     → backend deleta
          //Usuário escolheu foto nova → novaFoto = "..." → manda base64   → backend faz upload

          fotoVitima: novaFoto === false ? null : novaFoto ? novaFoto.split(',')[1] : fotoUrl,
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
          //Para não fazer funcionar o sistema de fotos no Supabase eu escolhi salvar o nome das fotos como como vitima-IDdoVitima.
          //Isso foi feio especificamente para não mudar o URL, já que se mudasse o URL, não ia ser possivel apagar a foto do Supabase!
          //Deve ter um jeito mais facil para arrumar isso, mas acredito que esse foi o mais simples e facil.
      //Resumindo: é preciso ter cuidado na hora de mexer nos arquivos que ligam o SupaStorage com o sistema.


      //Aqui trabalha em conjunto com o HandleCancelEditar
      //Basicamente, o HandleCancel serve para que quando você Cancele a edição o código retorne a como estava antes
      //Mas e se o usuario retornar DEPOIS de ja ter salvo? ele voltaria para o código que estava antes do Update.
      setDadosVitima({
       ...dadosVitima,
       nome: nomeVitima,
       cpf,
       telefone,
       dataNascimento,
       genero,

      })

      //Atualiza a foto exibida com a URL nova do banco (com timestamp anti-cache)
      setFotoUrl(dadosResultado.fotoVitima ? dadosResultado.fotoVitima + '?t=' + Date.now() : null);

       alert('Vitima atualizada com sucesso!');
       setNovaFoto(null);  //limpa a foto nova após salvar
       setEditando(false); //Volta pro modo de Visualização

    } catch (erro) {
      console.error("Erro ao salvar:", erro);
    }

  };

  //Handler do botão excluir
  //Exclui o vitima após confirmação do usuário
  const handleExcluir = async () => {
    // Pede confirmação antes de excluir para evitar exclusões acidentais
    if (!confirm('Tem certeza que deseja excluir esta vítima?')) return;
    try {

      //Apaga o vitima selecionado e volta pro Hub de vitimas.
      await fetch(`http://localhost:3000/api/vitimas/excluir/${id}`, {
      method: 'DELETE' });
      navigate('/vitimas');
    } 
    catch (erro) {
      console.error("Erro ao excluir:", erro);
    }
  };

  //Handler do botão entrar edição
  //Entra no modo edição e sai do modo view
  const handleEditar = async () =>{
    setEditando(true)
  }

  //Handler do botão cancelar edição
  //Volta pro modo view e realiza mais algumas coisas:
  const handleCancelExcluir = async () =>{
    //Esse aqui eu fiz ele mais como um teste para aprendizado

    //Volta pro modo view
    setEditando(false);
    //Volta tudo pro original
    setNomeVitima(dadosVitima.nome);
    setCpf(dadosVitima.cpf);
    setTelefone(dadosVitima.telefone);
    setDataNascimento(dadosVitima.dataNascimento);
    setGenero(dadosVitima.genero);
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
            <a href="/abrigos"><li><FaBoxOpen className="icon" /> Abrigos</li></a>
            <a href="/vitimas"><li className="active"><FaUser className="icon" /> Vítimas</li></a>
            <li><FaDonate className="icon" /> Doações</li>
            <a href="/mapa"><li><FaMap className="icon" /> Mapa</li></a>
            <li><GoAlertFill className="icon" /> Ocorrências</li>
            <a href="/configuracoes"><li><FaGear className="icon" /> Configurações</li></a>
          </ul>
        </aside>
        <main className="main">
          <p style={{ padding: '40px', color: '#64748b' }}>Carregando dados da vítima...</p>
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
          <a href="/abrigos"><li><FaBoxOpen className="icon" /> Abrigos</li></a>
          <a href="/vitimas"><li className="active"><FaUser className="icon" /> Vítimas</li></a>
          <li><FaDonate className="icon" /> Doações</li>
          <a href="/mapa"><li><FaMap className="icon" /> Mapa</li></a>
          <li><GoAlertFill className="icon" /> Ocorrências</li>
          <a href="/configuracoes"><li><FaGear className="icon" /> Configurações</li></a>
        </ul>
      </aside>

      {/* Código do Main */}
      <main className="main">

        <header className="top">
          <div>
            {/* Breadcrumb mostrando o nome do vitima que veio da API */}
            <p style={{ fontSize: '14px', color: '#64748b', margin: 0 }}>
              Vítimas &gt; <span>{nomeVitima}</span>
            </p>

            {/* Título muda dependendo do modo */}
            <h1 style={{ fontSize: '26px', fontWeight: '700', color: '#0f172a', marginTop: '4px' }}>
              {/* Muda dependendo do modo */}
              {editando ? 'Editar vitima' : 'Detalhes do vitima'}
            </h1>
            <p className="subtitle"> Gerencia as informações desta vítima</p>

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
            */}
            
            {/* Texto do Nome */}
            <div className="form-group">
              <label><FaBuilding /> Nome da Vítima</label>

              {/* Exemplo de Modo edição */}
              
              {editando ? (
                //Se ligado:
                <input value={nomeVitima} onChange={(e) => setNomeVitima(e.target.value)} />
              ) : (
                //Se desligado:
                <p>{nomeVitima}</p>
              )}
            </div>

            {/* Texto do CPF */}
            <div className="form-group">
              <label><FaIdCard/> CPF </label>

              {editando ? (
                //Se ligado:
                <input value={cpf} onChange={(e) => setCpf(e.target.value)} />
              ) : (
                //Se desligado:
                <p>{cpf}</p>
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

            {/* Texto da Data de Nascimento */}
            <div className="form-group">
              <label><FaCalendar /> Data de Nascimento</label>

              {editando ? (
                //Se ligado:
                <input type='date' value={dataNascimento} onChange={(e) => setDataNascimento(e.target.value)} />
              ) : (
                //Se desligado:
                <p>{dataNascimento}</p>
              )}
            </div>

            {/* Select Gênero */}
            <div className="form-group">
              <label><FaPersonHalfDress  /> Gênero</label>

              {editando ? (
                //Se ligado:
                <select value={genero} onChange={(e) => setGenero(e.target.value)} className="select-genero">
                  <option value="Masculino">Masculino</option>
                  <option value="Feminino">Feminino</option>
                  <option value="Outro">Outro</option>
                </select>
              ) : (
                //Se desligado:
                <p>{genero}</p>
              )}
            </div>
          </div>

          {/* --- COLUNA DIREITA: upload de imagem e botões */}
          <div className="form-column-right">
           {/* Aqui começa a parte da direita, os códigos aqui mexem bastante com os Handlers
               e com o Modo edição. O diferencial daqui é que o modo edição estar ativo muda grande parte do código.*/}

            {/*Começo do Formulario da Direita, lembrando que os dois Formularios*/}
            <h3 style={{ fontSize: '16px', fontWeight: '700', color: '#1e293b', marginBottom: '12px' }}>
              Imagem da vítima
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
                    <img src={fotoExibida} alt="Preview da vítima" />

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
                    <p>Faça upload da foto principal do vitima</p>
                    <span className="btn-upload-trigger">Selecionar arquivo do computador</span>
                  </label>
                )}
               </div>
               ) : (
               //Se edição desligada:
                //Modo view       
                <div className="upload-container">
                  <div className="image-preview">
                {fotoExibida ? (
                  <img src={fotoExibida} alt={nomeVitima}/>
                ) : (
                  <p style={{ color: '#94a3b8', fontSize: '14px' }}>Sem foto cadastrada</p>
                )}
                </div>
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
                  Editar vítima
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
  )
}

export default DetalhesVitimas;