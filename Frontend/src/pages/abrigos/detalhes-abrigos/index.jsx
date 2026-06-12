import { useState, useEffect } from 'react';
import { useParams, useNavigate } from "react-router-dom";
import { 
  FaHome, FaBoxOpen, FaUser, FaDonate, FaMapPin, 
  FaUpload, FaMapMarkerAlt, FaPhoneAlt, FaDog, 
  FaWheelchair, FaUtensils, FaBuilding, FaPeopleArrows,
  FaMedkit
} from 'react-icons/fa';
import { GoAlertFill } from "react-icons/go";

/// Página de detalhes do abrigo, onde é possível ver e editar as informações do abrigo selecionado
import "../../pg_adm/style.css";
import './DetalhesAbrigos.css';

function DetalhesAbrigo() {
  const { id } = useParams();
  const navigate = useNavigate();

  // ─── ESTADOS ────────────────────────────────────────────────
  // Cada estado corresponde a um campo do formulário
  const [carregando, setCarregando] = useState(true);
  const [nomeAbrigo, setNomeAbrigo] = useState('');
  const [status, setStatus] = useState('ativo');
  const [endereco, setEndereco] = useState('');
  const [telefone, setTelefone] = useState('');
  const [imagem, setImagem] = useState(null);
  const [responsavel, setResponsavel] = useState('');
  const [tipoAbrigo, setTipoAbrigo] = useState('');
  const [capacidadeTotal, setCapacidadeTotal] = useState(0);
  const [capacidadeOcupada, setCapacidadeOcupada] = useState(0);

  // Todos os campos de infraestrutura agrupados num único estado
  // Agora todos existem no banco, então todos são carregados e salvos na API
  const [infraestrutura, setInfraestrutura] = useState({
    possuiAtendimentoMedico: false,
    possuiPets: false,
    possuiAcessibilidade: false,
    possuiCozinha: false
  });

  // ─── BUSCA OS DADOS DO ABRIGO AO CARREGAR A PÁGINA ──────────
  useEffect(() => {
    const buscarAbrigo = async () => {
      try {

        // Faz a requisição para a API passando o id que veio da URL
        const resposta = await fetch(`http://localhost:3000/api/abrigos/listar/${id}`);
        const dados = await resposta.json();

        // Preenche cada estado com o que veio da API
        // O ?? é o operador nullish: se o valor vier null ou undefined, usa o valor padrão da direita
        setNomeAbrigo(dados.nome);
        setStatus(dados.status ?? 'ativo');
        setEndereco(dados.endereco ?? '');
        setTelefone(dados.telefone ?? '');
        setResponsavel(dados.responsavel ?? '');
        setTipoAbrigo(dados.tipoAbrigo ?? '');
        setCapacidadeTotal(dados.capacidadeTotal ?? 0);
        setCapacidadeOcupada(dados.capacidadeOcupada ?? 0);

        // Preenche todos os campos de infraestrutura de uma vez
        // Como todos existem no banco agora, todos são carregados da API
        setInfraestrutura({
          possuiAtendimentoMedico: dados.possuiAtendimentoMedico ?? false,
          possuiPets: dados.possuiPets ?? false,
          possuiAcessibilidade: dados.possuiAcessibilidade ?? false,
          possuiCozinha: dados.possuiCozinha ?? false
        });

        // Se o abrigo tiver imagem cadastrada, já exibe ela
        if (dados.imagemUrl) setImagem(dados.imagemUrl);

      } catch (erro) {
        console.error("Erro ao buscar abrigo:", erro);
      } finally {
        // Para de mostrar o loading independente de dar certo ou errado
        setCarregando(false);
      }
    };

    // Roda sempre que o :id da URL mudar
    buscarAbrigo();
  }, [id]);

  // ─── HANDLERS ───────────────────────────────────────────────

  // Atualiza apenas o campo alterado dentro do objeto infraestrutura
  // O ...prev preserva os outros campos que não foram alterados
  const handleCheckboxChange = (e) => {
    const { name, checked } = e.target;
    setInfraestrutura(prev => ({ ...prev, [name]: checked }));
  };

  // Atualiza o estado da imagem quando o usuário seleciona um arquivo
  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) setImagem(URL.createObjectURL(file));
  };

  // Envia os dados atualizados para a API via PUT
  const handleSalvar = async (e) => {
    e.preventDefault();
    try {
      await fetch(`http://localhost:3000/api/abrigos/atualizar/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },

        // Envia TODOS os campos que a API espera receber
        // O ...infraestrutura expande os campos do objeto dentro do body
        body: JSON.stringify({ 
          status, 
          endereco, 
          telefone,
          responsavel,
          tipoAbrigo,
          capacidadeTotal,
          capacidadeOcupada,
          ...infraestrutura
        }),
      });
      alert('Abrigo atualizado com sucesso!');
      navigate('/abrigo');
    } catch (erro) {
      console.error("Erro ao salvar:", erro);
    }
  };

  // Exclui o abrigo após confirmação do usuário
  const handleExcluir = async () => {

    // Pede confirmação antes de excluir para evitar exclusões acidentais
    if (!confirm('Tem certeza que deseja excluir este abrigo?')) return;
    try {
      await fetch(`http://localhost:3000/api/abrigos/excluir/${id}`, { method: 'DELETE' });
      navigate('/abrigo');
    } catch (erro) {
      console.error("Erro ao excluir:", erro);
    }
  };

  // ─── TELA DE LOADING ─────────────────────────────────────────
  // Enquanto a API não respondeu, mostra uma mensagem para o usuário não ver a tela vazia
  if (carregando) {
    return (
      <div className="dashboard">
        <aside className="sidebar">
          <ul>
            <a href="/pg_adm"><li><FaHome className="icon" /> Home</li></a>
            <a href="/abrigo"><li className="active"><FaBoxOpen className="icon" /> Abrigos</li></a>
            <a href="/listar_vitimas"><li><FaUser className="icon" /> Vítimas</li></a>
            <li><FaDonate className="icon" /> Doações</li>
            <li><FaMapPin className="icon" /> Região Afetada</li>
            <li><GoAlertFill className="icon" /> Ocorrências</li>
            <li><FaUser className="icon" /> Perfil</li>
          </ul>
        </aside>
        <main className="main">
          <p style={{ padding: '40px', color: '#64748b' }}>Carregando dados do abrigo...</p>
        </main>
      </div>
    );
  }

  // ─── TELA PRINCIPAL ──────────────────────────────────────────
  return (
    <div className="dashboard">
      <aside className="sidebar">
        <ul>
          <a href="/pg_adm"><li><FaHome className="icon" /> Home</li></a>
          <a href="/abrigo"><li className="active"><FaBoxOpen className="icon" /> Abrigos</li></a>
          <a href="/listar_vitimas"><li><FaUser className="icon" /> Vítimas</li></a>
          <li><FaDonate className="icon" /> Doações</li>
          <li><FaMapPin className="icon" /> Região Afetada</li>
          <li><GoAlertFill className="icon" /> Ocorrências</li>
          <li><FaUser className="icon" /> Perfil</li>
        </ul>
      </aside>

      <main className="main">
        <header className="top">
          <div>
            {/* Breadcrumb mostrando o nome do abrigo que veio da API */}
            <p style={{ fontSize: '14px', color: '#64748b', margin: 0 }}>
              Abrigos &gt; <span>{nomeAbrigo}</span>
            </p>
            <h1 style={{ fontSize: '26px', fontWeight: '700', color: '#0f172a', marginTop: '4px' }}>
              Detalhes / Editar Abrigo
            </h1>
          </div>
          <div className="top-icons">
            <img src="/src/assets/logo.png" width="80px" alt="Logo" />
          </div>
        </header>

        <form onSubmit={handleSalvar} className="cadastro-form-container">

          {/* ── COLUNA ESQUERDA: campos de texto e checkboxes ── */}
          <div className="form-column-left">

            <div className="form-group">
              <label htmlFor="status">Status</label>
              <select
                id="status"
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                className={`select-status ${status}`}
              >
                <option value="ativo">Ativo</option>
                <option value="desativado">Desativado</option>
                <option value="manutencao">Manutenção</option>
              </select>
            </div>

            <div className="form-group">
              <label><FaMapMarkerAlt /> Endereço</label>
              <input
                type="text"
                placeholder="Digite o endereço completo..."
                value={endereco}
                onChange={(e) => setEndereco(e.target.value)}
                required
              />
            </div>

            <div className="form-group">
              <label><FaPhoneAlt /> Telefone</label>
              <input
                type="text"
                placeholder="(XX) XXXXX-XXXX"
                value={telefone}
                onChange={(e) => setTelefone(e.target.value)}
                required
              />
            </div>

            <div className="form-group">
              <label><FaUser /> Responsável</label>
              <input
                type="text"
                placeholder="Digite o nome do responsável..."
                value={responsavel}
                onChange={(e) => setResponsavel(e.target.value)}
                required
              />
            </div>

            
            <div className="form-group">
              <label><FaBuilding /> Tipo de Abrigo</label>
              <select
                className="select-tipo-abrigo"
                value={tipoAbrigo}
                onChange={(e) => setTipoAbrigo(e.target.value)}
                required
              >

                <option value=""disabled>Selecione o tipo de abrigo</option>
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
                placeholder="Digite a capacidade total..."
                value={capacidadeTotal}
                onChange={(e) => setCapacidadeTotal(parseInt(e.target.value) || 0)}
                required
              />
            </div>

            <div className="form-group">
              <label><FaPeopleArrows /> Capacidade Ocupada</label>
              <input
                type="number"
                placeholder="Digite a capacidade ocupada..."
                value={capacidadeOcupada}
                onChange={(e) => setCapacidadeOcupada(parseInt(e.target.value) || 0)}
                required
              />
            </div>

            {/* ── INFRAESTRUTURA ── */}
            {/* Todos os campos agora existem no banco e são salvos/carregados da API */}
            <div className="infraestrutura-section">
              <h3 style={{ fontSize: '16px', fontWeight: '700', color: '#1e293b', marginBottom: '12px' }}>
                Infraestrutura
              </h3>


              <label className="checkbox-card">
                <input
                  type="checkbox"
                  name="possuiAtendimentoMedico"
                  checked={infraestrutura.possuiAtendimentoMedico}
                  onChange={handleCheckboxChange}
                />
                <div className="checkbox-content">
                  <FaMedkit className="icon" /><span>Atendimento Médico</span>
                </div>
              </label>

              <label className="checkbox-card">
                <input
                  type="checkbox"
                  name="possuiPets"
                  checked={infraestrutura.possuiPets}
                  onChange={handleCheckboxChange}
                />
                <div className="checkbox-content">
                  <FaDog className="icon" /><span>Pets Bem-Vindos</span>
                </div>
              </label>

              <label className="checkbox-card">
                <input
                  type="checkbox"
                  name="possuiAcessibilidade"
                  checked={infraestrutura.possuiAcessibilidade}
                  onChange={handleCheckboxChange}
                />
                <div className="checkbox-content">
                  <FaWheelchair className="icon" /><span>Acessibilidade</span>
                </div>
              </label>

              <label className="checkbox-card">
                <input
                  type="checkbox"
                  name="possuiCozinha"
                  checked={infraestrutura.possuiCozinha}
                  onChange={handleCheckboxChange}
                />
                <div className="checkbox-content">
                  <FaUtensils className="icon" /><span>Cozinha Comunitária</span>
                </div>
              </label>

            </div>
          </div>

          {/* ── COLUNA DIREITA: upload de imagem e botões ── */}
          <div className="form-column-right">
            <h3 style={{ fontSize: '16px', fontWeight: '700', color: '#1e293b', marginBottom: '12px' }}>
              Imagem do Abrigo
            </h3>

            <div className="upload-container">
              {imagem ? (
                <div className="image-preview">
                  <img src={imagem} alt="Preview do abrigo" />
                  <button type="button" onClick={() => setImagem(null)} className="btn-remove-image">
                    Remover Foto
                  </button>
                </div>
              ) : (
                <label className="upload-dropzone">
                  <input type="file" accept="image/*" onChange={handleImageChange} style={{ display: 'none' }} />
                  <FaUpload className="upload-icon" />
                  <p>Faça upload da imagem principal do abrigo</p>
                  <span className="btn-upload-trigger">Selecionar arquivo do computador</span>
                </label>
              )}
            </div>

            <div className="form-actions">
              <button type="submit" className="btn-action salvar">Salvar Alterações</button>
              <div className="danger-actions">
                <button type="button" onClick={handleExcluir} className="btn-action excluir">
                  Excluir Registro
                </button>
                <button type="button" onClick={() => navigate('/abrigo')} className="btn-action cancelar">
                  Cancelar
                </button>
              </div>
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