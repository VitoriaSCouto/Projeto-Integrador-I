//--------- Imports-----------
import { useState, useEffect } from 'react';
import { useParams, useNavigate } from "react-router-dom";
import { 
  FaHome, FaBoxOpen, FaUser, FaDonate, FaMap,
  FaUpload, FaPhoneAlt, FaBuilding,
  FaMedkit, FaCalendar, FaIdCard
} from 'react-icons/fa';
import { FaGear, FaPersonHalfDress } from "react-icons/fa6";
import { GoAlertFill } from "react-icons/go";

import "../../pg_adm/style.css";
import './DetalhesVitima.css';

//------- Começo Função Principal -----
function DetalhesVitimas() {

  // ─── ESTADOS ────────────────────────────────────────────────
  const { id } = useParams();
  const navigate = useNavigate();

  const [dadosVitima, setDadosVitima] = useState({})
  const [carregando, setCarregando]   = useState(true);
  const [editando, setEditando]       = useState(false);

  const [nomeVitima, setNomeVitima]       = useState('');
  const [cpf, setCpf]                     = useState('');
  const [telefone, setTelefone]           = useState('');
  const [dataNascimento, setDataNascimento] = useState('');
  const [genero, setGenero]               = useState('');

  // Dados do abrigo vinculado — lidos mas não editáveis aqui
  const [abrigoVinculado, setAbrigoVinculado] = useState(null)  // { id, nome, cidade, dataEntrada }

  const [fotoUrl, setFotoUrl]   = useState(null);
  const [novaFoto, setNovaFoto] = useState(null);
  const fotoExibida = novaFoto ?? fotoUrl;

  // ── Busca dos dados ao carregar ───────────────────────────────────────
  useEffect(() => {
    const buscarVitima = async () => {
      try {
        const resposta = await fetch(`http://localhost:3000/api/vitimas/listar/${id}`);
        const dados    = await resposta.json();

        setDadosVitima(dados)
        setNomeVitima(dados.nome);
        setCpf(dados.cpf ?? '');
        setTelefone(dados.telefone ?? '');
        setDataNascimento(dados.dataNascimento ?? '');
        setGenero(dados.genero ?? '');
        setFotoUrl(dados.fotoVitima ? dados.fotoVitima + '?t=' + Date.now() : null)

        // Monta o objeto de abrigo vinculado se existir
        // O GET /vitimas/listar/:id já inclui o campo "abrigo" com nome e cidade
        if (dados.abrigoId && dados.abrigo) {
          setAbrigoVinculado({
            id:          dados.abrigoId,
            nome:        dados.abrigo.nome,
            cidade:      dados.abrigo.cidade,
            endereco:    dados.abrigo.endereco ?? null,
            dataEntrada: dados.dataEntrada ?? null,
          })
        } else {
          setAbrigoVinculado(null)
        }

      } catch (erro) {
        console.error("Erro ao buscar vitima:", erro);
      } finally {
        setCarregando(false);
      }
    };

    buscarVitima();
  }, [id]);

  // ── Handlers ─────────────────────────────────────────────────────────
  const handleImagem = (e) => {
    const arquivo = e.target.files[0]
    const limiteMB = 2
    if (arquivo.size > limiteMB * 1024 * 1024) {
      alert(`A imagem deve ter no máximo ${limiteMB}MB.`)
      return
    }
    const reader = new FileReader()
    reader.onloadend = () => { setNovaFoto(reader.result) }
    reader.readAsDataURL(arquivo)
  }

  const handleSalvar = async (e) => {
    e.preventDefault();
    try {
      const resposta = await fetch(`http://localhost:3000/api/vitimas/atualizar/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          nome: nomeVitima,
          cpf, 
          telefone,
          dataNascimento,
          genero,
          fotoVitima: novaFoto === false ? null : novaFoto ? novaFoto.split(',')[1] : fotoUrl,
          // Não envia abrigoId aqui — o vínculo de abrigo é gerenciado pela página VitimasDoAbrigo
        }),
      });

      const dadosResultado = await resposta.json()

      if (!resposta.ok) {
        alert(dadosResultado.mensagem ?? 'Erro ao salvar.')
        return
      }

      setDadosVitima({ ...dadosVitima, nome: nomeVitima, cpf, telefone, dataNascimento, genero })
      setFotoUrl(dadosResultado.fotoVitima ? dadosResultado.fotoVitima + '?t=' + Date.now() : null);
      alert('Vítima atualizada com sucesso!');
      setNovaFoto(null);
      setEditando(false);

    } catch (erro) {
      console.error("Erro ao salvar:", erro);
    }
  };

  const handleExcluir = async () => {
    if (!confirm('Tem certeza que deseja excluir esta vítima?')) return;
    try {
      await fetch(`http://localhost:3000/api/vitimas/excluir/${id}`, { method: 'DELETE' });
      navigate('/vitimas');
    } catch (erro) {
      console.error("Erro ao excluir:", erro);
    }
  };

  const handleEditar = () => setEditando(true)

  const handleCancelExcluir = () => {
    setEditando(false);
    setNomeVitima(dadosVitima.nome);
    setCpf(dadosVitima.cpf);
    setTelefone(dadosVitima.telefone);
    setDataNascimento(dadosVitima.dataNascimento);
    setGenero(dadosVitima.genero);
  }

  // ── Formata data para exibição ────────────────────────────────────────
  const formatarData = (data) => {
    if (!data) return '—'
    return new Date(data).toLocaleDateString('pt-BR')
  }

  // ── Tela de loading ───────────────────────────────────────────────────
  if (carregando) {
    return (
      <div className="dashboard">
        <aside className="sidebar">
          <div className="top-icons">
            <img src="src/assets/logo.png" width="70px" />
            <p>S.O.S. Vale</p>
          </div>
          <ul>
            <a href="/pg_adm"><li><FaHome className="icon" /> Home</li></a>
            <a href="/abrigos"><li><FaBoxOpen className="icon" /> Abrigos</li></a>
            <a href="/vitimas"><li className="active"><FaUser className="icon" /> Vítimas</li></a>
            <li><FaDonate className="icon" /> Doações</li>
            <a href="/mapa"><li><FaMap className="icon" /> Mapa</li></a>
            <a href="/alertas"><li><GoAlertFill className="icon" /> Alertas</li></a>
            <a href="/configuracoes"><li><FaGear className="icon" /> Configurações</li></a>
          </ul>
        </aside>
        <main className="main">
          <p style={{ padding: '40px', color: '#64748b' }}>Carregando dados da vítima...</p>
        </main>
      </div>
    );
  }

  // ── Tela principal ────────────────────────────────────────────────────
  return (
    <div className="dashboard">

      <aside className="sidebar">
        <div className="top-icons">
          <img src="../src/assets/logo.png" width="70px" />
          <p>S.O.S. Vale</p>
        </div>
        <ul>
          <a href="/pg_adm"><li><FaHome className="icon" /> Home</li></a>
          <a href="/abrigos"><li><FaBoxOpen className="icon" /> Abrigos</li></a>
          <a href="/vitimas"><li className="active"><FaUser className="icon" /> Vítimas</li></a>
          <li><FaDonate className="icon" /> Doações</li>
          <a href="/mapa"><li><FaMap className="icon" /> Mapa</li></a>
          <a href="/alertas"><li><GoAlertFill className="icon" /> Alertas</li></a>
          <a href="/configuracoes"><li><FaGear className="icon" /> Configurações</li></a>
        </ul>
      </aside>

      <main className="main">

        <header className="top">
          <div>
            <p style={{ fontSize: '14px', color: '#64748b', margin: 0 }}>
              Vítimas &gt; <span>{nomeVitima}</span>
            </p>
            <h1 style={{ fontSize: '26px', fontWeight: '700', color: '#0f172a', marginTop: '4px' }}>
              {editando ? 'Editar Vítima' : 'Detalhes da Vítima'}
            </h1>
            <p className="subtitle">Gerencia as informações desta vítima</p>
          </div>
        </header>

        {/* ── Card de situação no abrigo ──────────────────────────────────
            Sempre visível, acima do formulário.
            Verde se vinculada, cinza se sem abrigo.
        ─────────────────────────────────────────────────────────────────── */}
        {abrigoVinculado ? (
          <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            background: '#f0fdf4', border: '1px solid #bbf7d0',
            borderRadius: '12px', padding: '16px 20px', marginBottom: '20px'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
              {/* Ícone */}
              <div style={{
                width: '42px', height: '42px', borderRadius: '10px',
                background: '#16a34a', display: 'flex', alignItems: 'center', justifyContent: 'center'
              }}>
                <FaBuilding style={{ color: '#fff', fontSize: '18px' }} />
              </div>

              {/* Info */}
              <div>
                <p style={{ margin: 0, fontSize: '12px', fontWeight: '600', color: '#16a34a', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  Abrigo atual
                </p>
                <p style={{ margin: '2px 0 0', fontSize: '16px', fontWeight: '700', color: '#0f172a' }}>
                  {abrigoVinculado.nome}
                </p>
                <p style={{ margin: '2px 0 0', fontSize: '13px', color: '#475569' }}>
                  {abrigoVinculado.cidade}
                  {abrigoVinculado.dataEntrada && (
                    <> · <FaCalendar style={{ fontSize: '11px', marginRight: '3px', verticalAlign: 'middle' }} />
                    Entrada em {formatarData(abrigoVinculado.dataEntrada)}</>
                  )}
                </p>
              </div>
            </div>

            {/* Botão para ir ao abrigo */}
            <button
              onClick={() => navigate(`/detalhes-abrigos/${abrigoVinculado.id}`)}
              style={{
                display: 'flex', alignItems: 'center', gap: '6px',
                padding: '8px 16px', borderRadius: '8px',
                border: '1px solid #16a34a', background: '#fff',
                color: '#16a34a', fontSize: '13px', fontWeight: '600',
                cursor: 'pointer', whiteSpace: 'nowrap'
              }}
            >
              <FaBoxOpen style={{ fontSize: '12px' }} />
              Ver abrigo
            </button>
          </div>
        ) : (
          <div style={{
            display: 'flex', alignItems: 'center', gap: '14px',
            background: '#f8fafc', border: '1px solid #e2e8f0',
            borderRadius: '12px', padding: '16px 20px', marginBottom: '20px'
          }}>
            <div style={{
              width: '42px', height: '42px', borderRadius: '10px',
              background: '#e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'center'
            }}>
              <FaBuilding style={{ color: '#94a3b8', fontSize: '18px' }} />
            </div>
            <div>
              <p style={{ margin: 0, fontSize: '12px', fontWeight: '600', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Sem abrigo vinculado
              </p>
              <p style={{ margin: '2px 0 0', fontSize: '14px', color: '#64748b' }}>
                Esta vítima não está alocada em nenhum abrigo no momento.
              </p>
            </div>
          </div>
        )}
        {/* ─────────────────────────────────────────────────────────────── */}

        {/* ── Formulário ─────────────────────────────────────────────────── */}
        <form onSubmit={handleSalvar} className="cadastro-form-container">

          {/* Coluna esquerda */}
          <div className="form-column-left">

            <div className="form-group">
              <label><FaBuilding /> Nome da Vítima</label>
              {editando ? (
                <input value={nomeVitima} onChange={(e) => setNomeVitima(e.target.value)} />
              ) : (
                <p>{nomeVitima}</p>
              )}
            </div>

            <div className="form-group">
              <label><FaIdCard /> CPF</label>
              {editando ? (
                <input value={cpf} onChange={(e) => setCpf(e.target.value)} />
              ) : (
                <p>{cpf || '—'}</p>
              )}
            </div>

            <div className="form-group">
              <label><FaPhoneAlt /> Telefone</label>
              {editando ? (
                <input value={telefone} onChange={(e) => setTelefone(e.target.value)} />
              ) : (
                <p>{telefone || '—'}</p>
              )}
            </div>

            <div className="form-group">
              <label><FaCalendar /> Data de Nascimento</label>
              {editando ? (
                <input type="date" value={dataNascimento} onChange={(e) => setDataNascimento(e.target.value)} />
              ) : (
                <p>{dataNascimento || '—'}</p>
              )}
            </div>

            <div className="form-group">
              <label><FaPersonHalfDress /> Gênero</label>
              {editando ? (
                <select value={genero} onChange={(e) => setGenero(e.target.value)} className="select-genero">
                  <option value="Masculino">Masculino</option>
                  <option value="Feminino">Feminino</option>
                  <option value="Outro">Outro</option>
                </select>
              ) : (
                <p>{genero || '—'}</p>
              )}
            </div>
          </div>

          {/* Coluna direita */}
          <div className="form-column-right">

            <h3 style={{ fontSize: '16px', fontWeight: '700', color: '#1e293b', marginBottom: '12px' }}>
              Imagem da Vítima
            </h3>

            <>
              {editando ? (
                <div className="upload-container">
                  {fotoExibida ? (
                    <div className="image-preview">
                      <img src={fotoExibida} alt="Preview da vítima" />
                      <button type="button" onClick={() => { setNovaFoto(false); setFotoUrl(null); }} className="btn-remove-image">
                        Remover Foto
                      </button>
                    </div>
                  ) : (
                    <label className="upload-dropzone">
                      <input type="file" accept="image/*" onChange={handleImagem} style={{ display: 'none' }} />
                      <FaUpload className="upload-icon" />
                      <p>Faça upload da foto da vítima</p>
                      <span className="btn-upload-trigger">Selecionar arquivo do computador</span>
                    </label>
                  )}
                </div>
              ) : (
                <div className="upload-container">
                  <div className="image-preview">
                    {fotoExibida ? (
                      <img src={fotoExibida} alt={nomeVitima} />
                    ) : (
                      <p style={{ color: '#94a3b8', fontSize: '14px' }}>Sem foto cadastrada</p>
                    )}
                  </div>
                </div>
              )}
            </>

            <div className="form-actions">
              {editando ? (
                <>
                  <button type="submit" className="btn-action salvar">Salvar Alterações</button>
                  <div className="danger-actions">
                    <button type="button" onClick={handleExcluir} className="btn-action excluir">
                      Excluir Registro
                    </button>
                    <button type="button" onClick={handleCancelExcluir} className="btn-action cancelar">
                      Cancelar edição
                    </button>
                  </div>
                </>
              ) : null}
              {!editando && (
                <button type="button" onClick={handleEditar} className="btn-action cancelar">
                  Editar Vítima
                </button>
              )}
            </div>

          </div>
        </form>
        {/* ─────────────────────────────────────────────────────────────── */}

        <footer style={{ marginTop: 'auto', paddingTop: '20px', display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: '#94a3b8' }}>
          <p>© 2026 S.O.S Vale. Todos os direitos reservados.</p>
          <p>Versão 1.0.0</p>
        </footer>
      </main>
    </div>
  )
}

export default DetalhesVitimas;