import { useState, useEffect } from 'react';
import { useParams, useNavigate } from "react-router-dom";
import { 
  FaHome, FaBoxOpen, FaUser, FaDonate, FaMapPin, 
  FaUpload, FaMapMarkerAlt, FaPhoneAlt, FaDog, FaUserNurse,
  FaWheelchair, FaUtensils, FaBuilding, FaPeopleArrows,
  FaMedkit, FaMapMarkedAlt,
  FaLocationArrow, FaMap, FaHandHoldingHeart
} from 'react-icons/fa';
import { FaGear } from "react-icons/fa6";
import { GoAlertFill } from "react-icons/go";
import SeletorLocalidade from '../../../components/SeletorLocalidade';
import MensagemFeedback from '../../../components/MensagemFeedback';
import { preencherPorCep, geocodificar } from '../../../services/localizacao';
import "../../pg_adm/style.css";
import './DetalhesAbrigo.css';
import SidebarAdm from '../../../components/SidebarAdm';

// ─── Badges das solicitações de ajuda ────────────────────────────────────────
const badgeAjuda = {
  aberto:       { label: 'Aberto',       bg: '#dbeafe', cor: '#1e40af' },
  em_andamento: { label: 'Em andamento', bg: '#fef3c7', cor: '#92400e' },
  concluido:    { label: 'Concluído',    bg: '#d1fae5', cor: '#065f46' },
  cancelado:    { label: 'Cancelado',    bg: '#fee2e2', cor: '#991b1b' },
}

const categoriaLabel = {
  doacao:         'Doação',
  medicamento:    'Medicamento',
  voluntariado:   'Voluntariado',
  infraestrutura: 'Infraestrutura',
  outro:          'Outro',
}

function DetalhesAbrigo() {

  // ─── ESTADOS ─────────────────────────────────────────────────────────────────
  const { id } = useParams();
  const navigate = useNavigate();

  const [dadosAbrigo, setDadosAbrigo] = useState({})
  const [carregando, setCarregando] = useState(true);
  const [editando, setEditando] = useState(false);

  const [nomeAbrigo, setNomeAbrigo] = useState('');
  const [status, setStatus] = useState('ativo');
  const [cep, setCep] = useState('');
  const [estado, setEstado] = useState('');
  const [cidade, setCidade] = useState('');
  const [bairro, setBairro] = useState('');
  const [endereco, setEndereco] = useState('');
  const [telefone, setTelefone] = useState('');
  const [responsavel, setResponsavel] = useState('');
  const [tipoAbrigo, setTipoAbrigo] = useState('');
  const [capacidadeTotal, setCapacidadeTotal] = useState(0);
  const [capacidadeOcupada, setCapacidadeOcupada] = useState(0);

  // IDs da localização (os nomes acima são só para exibir e para o geocoding)
  const [cidadeId, setCidadeId] = useState(null);
  const [bairroId, setBairroId] = useState(null);

  const handleLocalidade = (localidade) => {
    setCidadeId(localidade.cidadeId)
    setBairroId(localidade.bairroId)
    setEstado(localidade.estado)
    setCidade(localidade.cidade)
    setBairro(localidade.bairro)
    // O endereço pode ter mudado: as coordenadas precisam ser buscadas de novo
    setLatitude(null)
    setLongitude(null)
    setFeedbackGeo(null)
  }

  const [fotoUrl, setFotoUrl] = useState(null);
  const [novaFoto, setNovaFoto] = useState(null);
  const fotoExibida = novaFoto ?? fotoUrl;

  const [erroCapacidade, setErroCapacidade] = useState('')

  const validarCapacidade = (ocupada, total) => {
    if (ocupada === 0 && total === 0) return
    if (ocupada > total) {
      setErroCapacidade('Capacidade ocupada não pode ser maior que a total.')
    } else {
      setErroCapacidade('')
    }
  }

  const [latitude, setLatitude] = useState(null)
  const [longitude, setLongitude] = useState(null)
  const [feedbackGeo, setFeedbackGeo] = useState(null)

  const [vitimasRecentes, setVitimasRecentes] = useState([])

  // ─── NOVO: solicitações de ajuda ─────────────────────────────────────────────
  const [solicitacoesAjuda, setSolicitacoesAjuda] = useState([])

  const [infraestrutura, setInfraestrutura] = useState({
    possuiAtendimentoMedico: false,
    possuiEnfermagem: false,
    possuiPets: false,
    possuiAcessibilidade: false,
    possuiCozinha: false
  });

  // ─── BUSCA AO CARREGAR ────────────────────────────────────────────────────────
  useEffect(() => {

    const buscarAbrigo = async () => {
      try {
        const resposta = await fetch(`http://localhost:3000/api/abrigos/listar/${id}`);
        const dados = await resposta.json();

        setDadosAbrigo(dados)
        setNomeAbrigo(dados.nome);
        setStatus(dados.status ?? 'ativo');
        setCep(dados.cep ?? '');
        setEstado(dados.estado ?? '');
        setCidade(dados.cidade ?? '');
        setBairro(dados.bairro ?? '');
        setCidadeId(dados.cidadeId ?? null);
        setBairroId(dados.bairroId ?? null);
        setEndereco(dados.endereco ?? '');
        setTelefone(dados.telefone ?? '');
        setResponsavel(dados.responsavel ?? '');
        setTipoAbrigo(dados.tipoAbrigo ?? '');
        setCapacidadeTotal(dados.capacidadeTotal ?? 0);
        setCapacidadeOcupada(dados.capacidadeOcupada ?? 0);
        setLatitude(dados.latitude ?? null)
        setLongitude(dados.longitude ?? null)

        if (dados.latitude && dados.longitude) {
          setFeedbackGeo({
            tipo: 'existente',
            mensagem: `Localização cadastrada: (${Number(dados.latitude).toFixed(5)}, ${Number(dados.longitude).toFixed(5)})`
          })
        }

        setFotoUrl(dados.fotoAbrigo ? dados.fotoAbrigo + '?t=' + Date.now() : null)

        setInfraestrutura({
          possuiAtendimentoMedico: dados.possuiAtendimentoMedico ?? false,
          possuiEnfermagem: dados.possuiEnfermagem ?? false,
          possuiPets: dados.possuiPets ?? false,
          possuiAcessibilidade: dados.possuiAcessibilidade ?? false,
          possuiCozinha: dados.possuiCozinha ?? false
        });

        if (dados.vitimas && dados.vitimas.length > 0) {
          const cincoMaisRecentes = [...dados.vitimas]
            .sort((a, b) => new Date(b.dataEntrada ?? b.createdAt) - new Date(a.dataEntrada ?? a.createdAt))
            .slice(0, 5)
          setVitimasRecentes(cincoMaisRecentes)
        }

      } catch (erro) {
        console.error("Erro ao buscar abrigo:", erro);
      } finally {
        setCarregando(false);
      }
    };

    // ─── NOVO: busca as 3 últimas solicitações deste abrigo ──────────────────
    const buscarSolicitacoesAjuda = async () => {
      try {
        const resposta = await fetch(`http://localhost:3000/api/solicitacoes-ajuda/abrigo/${id}?limite=3`)
        const dados = await resposta.json()
        setSolicitacoesAjuda(dados.solicitacoes ?? [])
      } catch (erro) {
        console.error('Erro ao buscar solicitações de ajuda:', erro)
      }
    }

    buscarAbrigo();
    buscarSolicitacoesAjuda();
  }, [id]);

  // ─── HANDLERS ────────────────────────────────────────────────────────────────
  const handleCheckboxChange = (e) => {
    const { name, checked } = e.target;
    setInfraestrutura(prev => ({ ...prev, [name]: checked }));
  };

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

  const handleGeocodificar = async () => {
    if (latitude && longitude) {
      const confirmar = confirm(
        `Este abrigo já possui localização cadastrada:\nLat: ${Number(latitude).toFixed(5)} | Lng: ${Number(longitude).toFixed(5)}\n\nDeseja atualizar as coordenadas com base no endereço atual?`
      )
      if (!confirmar) return
    }

    await buscarLocalizacao()
  }

  // Busca as coordenadas tentando do mais preciso ao mais geral
  // (endereço → rua → CEP → bairro → cidade), veja services/localizacao.js.
  // Sem coordenadas o abrigo NÃO aparece no mapa.
  const buscarLocalizacao = async (loc = { estado, cidade, bairro }, end = endereco, cepAtual = cep) => {
    if (!loc.cidade) {
      setFeedbackGeo({ tipo: 'erro', mensagem: 'Informe o CEP ou escolha a cidade antes de buscar.' })
      return
    }

    setFeedbackGeo({ tipo: 'buscando', mensagem: 'Buscando localização no mapa...' })
    const resultado = await geocodificar({
      endereco: end.trim().replace(/,\s*$/, ''),
      bairro: loc.bairro, cidade: loc.cidade, estado: loc.estado, cep: cepAtual,
    })

    if (!resultado) {
      setFeedbackGeo({ tipo: 'erro', mensagem: 'Localização não encontrada — o abrigo não aparecerá no mapa. Confira o endereço.' })
      return
    }

    setLatitude(resultado.latitude)
    setLongitude(resultado.longitude)
    const exata = ['endereco', 'rua'].includes(resultado.precisao)
    setFeedbackGeo({
      tipo: exata ? 'sucesso' : 'aviso',
      mensagem: `📍 Localização encontrada ${resultado.descricao} (${resultado.latitude.toFixed(5)}, ${resultado.longitude.toFixed(5)})`
        + (exata ? '' : ' — o marcador ficará próximo, não no ponto exato.')
        + ' Clique em Salvar para gravar.',
    })
  }

  // No modo edição, ao completar os 8 números do CEP, preenche o resto sozinho
  const [feedbackCep, setFeedbackCep] = useState(null)

  const handleCep = async (valor) => {
    setCep(valor)
    const digitos = valor.replace(/\D/g, '')
    if (digitos.length !== 8) {
      setFeedbackCep(null)
      return
    }

    setFeedbackCep({ tipo: 'buscando', mensagem: 'Buscando endereço pelo CEP...' })
    try {
      const dados = await preencherPorCep(digitos)

      if (!dados.cidadeId) {
        setFeedbackCep({ tipo: 'aviso', mensagem: `CEP de ${dados.cidade}/${dados.estado}, que ainda não está cadastrada. Cadastre a cidade em Regiões ou escolha abaixo.` })
        return
      }

      setCidadeId(dados.cidadeId)
      setBairroId(dados.bairroId)
      setEstado(dados.estado)
      setCidade(dados.cidade)
      setBairro(dados.bairro)

      const novoEndereco = dados.logradouro ? `${dados.logradouro}, ` : endereco
      setEndereco(novoEndereco)

      setFeedbackCep({
        tipo: 'sucesso',
        mensagem: `✓ ${[dados.logradouro, dados.bairro, `${dados.cidade}/${dados.estado}`].filter(Boolean).join(' — ')}`
          + (dados.criouBairro ? ' (bairro cadastrado agora)' : '')
          + (dados.logradouro ? '. Complete o número no endereço.' : ''),
      })

      buscarLocalizacao({ estado: dados.estado, cidade: dados.cidade, bairro: dados.bairro }, novoEndereco, digitos)
    } catch (erro) {
      setFeedbackCep({ tipo: 'erro', mensagem: erro.message })
    }
  }

  const handleSalvar = async (e) => {
    e.preventDefault();
    if (capacidadeOcupada > capacidadeTotal) {
      if (erroCapacidade) return
    }

    try {
      const resposta = await fetch(`http://localhost:3000/api/abrigos/atualizar/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nome: nomeAbrigo,
          status,
          cep,
          cidadeId,
          bairroId,
          endereco,
          telefone,
          responsavel,
          tipoAbrigo,
          capacidadeTotal,
          capacidadeOcupada,
          latitude,
          longitude,
          fotoAbrigo: novaFoto === false ? null : novaFoto ? novaFoto.split(',')[1] : fotoUrl,
          ...infraestrutura
        }),
      });

      const dadosResultado = await resposta.json()

      // Só confirma se a API aceitou (ex: bairro de outra cidade → 400)
      if (!resposta.ok) {
        alert(dadosResultado.mensagem ?? 'Não foi possível salvar o abrigo.')
        return
      }

      setDadosAbrigo({
        ...dadosAbrigo,
        nome: nomeAbrigo, cep, estado, cidade, bairro, cidadeId, bairroId, endereco,
        telefone, responsavel, tipoAbrigo, capacidadeTotal, capacidadeOcupada,
        latitude, longitude,
        possuiAtendimentoMedico: infraestrutura.possuiAtendimentoMedico,
        possuiEnfermagem: infraestrutura.possuiEnfermagem,
        possuiPets: infraestrutura.possuiPets,
        possuiAcessibilidade: infraestrutura.possuiAcessibilidade,
        possuiCozinha: infraestrutura.possuiCozinha
      })

      setFotoUrl(dadosResultado.fotoAbrigo ? dadosResultado.fotoAbrigo + '?t=' + Date.now() : null);

      if (latitude && longitude) {
        setFeedbackGeo({
          tipo: 'existente',
          mensagem: `Localização cadastrada: (${Number(latitude).toFixed(5)}, ${Number(longitude).toFixed(5)})`
        })
      }

      alert('Abrigo atualizado com sucesso!');
      setNovaFoto(null);
      setEditando(false);
    } catch (erro) {
      console.error("Erro ao salvar:", erro);
    }
  };

  const handleExcluir = async () => {
    if (!confirm('Tem certeza que deseja excluir este abrigo?')) return;
    try {
      await fetch(`http://localhost:3000/api/abrigos/excluir/${id}`, { method: 'DELETE' });
      navigate('/abrigos');
    } catch (erro) {
      console.error("Erro ao excluir:", erro);
    }
  };

  const handleEditar = async () => {
    setEditando(true)
    validarCapacidade(capacidadeOcupada, capacidadeTotal)
  }

  const handleCancelExcluir = async () => {
    if (capacidadeOcupada > capacidadeTotal) {
      if (erroCapacidade) return
    }
    setEditando(false);
    setNomeAbrigo(dadosAbrigo.nome);
    setCep(dadosAbrigo.cep ?? '');
    setEstado(dadosAbrigo.estado ?? '');
    setCidade(dadosAbrigo.cidade ?? '');
    setBairro(dadosAbrigo.bairro ?? '');
    setCidadeId(dadosAbrigo.cidadeId ?? null);
    setBairroId(dadosAbrigo.bairroId ?? null);
    setEndereco(dadosAbrigo.endereco)
    setTelefone(dadosAbrigo.telefone);
    setResponsavel(dadosAbrigo.responsavel);
    setTipoAbrigo(dadosAbrigo.tipoAbrigo);
    setCapacidadeTotal(dadosAbrigo.capacidadeTotal);
    setCapacidadeOcupada(dadosAbrigo.capacidadeOcupada);
    setLatitude(dadosAbrigo.latitude ?? null)
    setLongitude(dadosAbrigo.longitude ?? null)

    if (dadosAbrigo.latitude && dadosAbrigo.longitude) {
      setFeedbackGeo({
        tipo: 'existente',
        mensagem: `Localização cadastrada: (${Number(dadosAbrigo.latitude).toFixed(5)}, ${Number(dadosAbrigo.longitude).toFixed(5)})`
      })
    } else {
      setFeedbackGeo(null)
    }

    setInfraestrutura({
      possuiAtendimentoMedico: dadosAbrigo.possuiAtendimentoMedico ?? false,
      possuiEnfermagem: dadosAbrigo.possuiEnfermagem ?? false,
      possuiPets: dadosAbrigo.possuiPets ?? false,
      possuiAcessibilidade: dadosAbrigo.possuiAcessibilidade ?? false,
      possuiCozinha: dadosAbrigo.possuiCozinha ?? false
    })
  }

  // ─── UTILITÁRIOS ─────────────────────────────────────────────────────────────
  const calcularIdade = (dataNascimento) => {
    if (!dataNascimento) return '—'
    const hoje = new Date()
    const nasc = new Date(dataNascimento)
    let idade = hoje.getFullYear() - nasc.getFullYear()
    const mes = hoje.getMonth() - nasc.getMonth()
    if (mes < 0 || (mes === 0 && hoje.getDate() < nasc.getDate())) idade--
    return idade
  }

  const formatarData = (data) => {
    if (!data) return '—'
    return new Date(data).toLocaleDateString('pt-BR')
  }

  // ─── LOADING ─────────────────────────────────────────────────────────────────
  if (carregando) {
    return (
      <div className="dashboard">
        <SidebarAdm ativo="abrigos" />
        <main className="main">
          <p style={{ padding: '40px', color: '#64748b' }}>Carregando dados do abrigo...</p>
        </main>
      </div>
    );
  }

  // ─── RENDER ───────────────────────────────────────────────────────────────────
  return (
    <div className="dashboard">
      <SidebarAdm ativo="abrigos" />

      <main className="main">

        <header className="top">
          <div>
            <p style={{ fontSize: '14px', color: '#64748b', margin: 0 }}>
              Abrigos &gt; <span>{nomeAbrigo}</span>
            </p>
            <h1 style={{ fontSize: '26px', fontWeight: '700', color: '#0f172a', marginTop: '4px' }}>
              {editando ? 'Editar Abrigo' : 'Detalhes do Abrigo'}
            </h1>
            <p className="subtitle">Gerencia as informações deste abrigo</p>
          </div>
        </header>

        <form onSubmit={handleSalvar} className="cadastro-form-container">

          {/* ── COLUNA ESQUERDA ── */}
          <div className="form-column-left">

            <div className="form-group">
              <label htmlFor="status">Status</label>
              <select
                id="status"
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                className={`select-status ${status}`}
                disabled={!editando}
                style={!editando ? { opacity: 1, cursor: 'default', appearance: 'none', WebkitAppearance: 'none' } : {}}
              >
                <option value="ativo">Ativado</option>
                <option value="manutencao">Manutenção</option>
                <option value="desativado">Desativado</option>
              </select>
            </div>

            <div className="form-group">
              <label><FaBuilding /> Nome do Abrigo</label>
              {editando ? (
                <input value={nomeAbrigo} onChange={(e) => setNomeAbrigo(e.target.value)} />
              ) : (
                <p>{nomeAbrigo}</p>
              )}
            </div>

            <div className="form-group">
              <label><FaPhoneAlt /> CEP</label>
              {editando ? (
                <>
                  {/* Ao completar o CEP, preenche estado, cidade, bairro e rua */}
                  <input value={cep} onChange={(e) => handleCep(e.target.value)} placeholder="Ex: 12090-590" maxLength={9} />
                  <MensagemFeedback feedback={feedbackCep} />
                </>
              ) : (
                <p>{cep || '—'}</p>
              )}
            </div>

            {/* Estado → Cidade → Bairro — no modo edição usa o seletor com as listas da API */}
            {editando ? (
              <SeletorLocalidade
                cidadeId={cidadeId}
                bairroId={bairroId}
                onChange={handleLocalidade}
              />
            ) : (
              <>
                <div className="form-group">
                  <label><FaMapMarkedAlt /> Estado</label>
                  <p>{estado || '—'}</p>
                </div>

                <div className="form-group">
                  <label><FaMapMarkedAlt /> Cidade</label>
                  <p>{cidade}</p>
                </div>

                <div className="form-group">
                  <label><FaMapMarkedAlt /> Bairro</label>
                  <p>{bairro || '—'}</p>
                </div>
              </>
            )}

            <div className="form-group">
              <label><FaMapMarkerAlt /> Endereço</label>
              {editando ? (
                <>
                  <input value={endereco} onChange={(e) => setEndereco(e.target.value)} />
                  <button
                    type="button"
                    onClick={handleGeocodificar}
                    style={{
                      marginTop: '6px',
                      display: 'flex', alignItems: 'center', gap: '6px',
                      padding: '6px 12px', fontSize: '13px', borderRadius: '6px',
                      border: 'none', cursor: 'pointer',
                      background: latitude && longitude ? '#1b8a3c' : '#257c35',
                      color: '#fff', fontWeight: '500'
                    }}
                  >
                    {latitude && longitude ? 'Atualizar localização' : 'Buscar localização'}
                  </button>
                  {feedbackGeo?.tipo === 'existente'
                    ? <p style={{ fontSize: '12px', marginTop: '4px', color: '#0ea5e9' }}>{feedbackGeo.mensagem}</p>
                    : <MensagemFeedback feedback={feedbackGeo} />}
                </>
              ) : (
                <>
                  <p>{endereco}</p>
                  {latitude && longitude ? (
                    feedbackGeo && (
                      <p style={{ fontSize: '12px', marginTop: '2px', color: '#0ea5e9' }}>
                        {feedbackGeo.mensagem}
                      </p>
                    )
                  ) : (
                    // Sem coordenadas o abrigo não aparece no mapa — avisa e diz como resolver
                    <p style={{ fontSize: '12px', marginTop: '2px', color: '#b45309' }}>
                      ⚠️ Sem localização: este abrigo não aparece no mapa. Clique em "Editar Abrigo" e depois em "Buscar localização".
                    </p>
                  )}
                </>
              )}
            </div>

            <div className="form-group">
              <label><FaPhoneAlt /> Telefone</label>
              {editando ? (
                <input value={telefone} onChange={(e) => setTelefone(e.target.value)} />
              ) : (
                <p>{telefone}</p>
              )}
            </div>

            <div className="form-group">
              <label><FaUser /> Responsável</label>
              {editando ? (
                <input value={responsavel} onChange={(e) => setResponsavel(e.target.value)} />
              ) : (
                <p>{responsavel}</p>
              )}
            </div>

            <div className="form-group">
              <label><FaBuilding /> Tipo de Abrigo</label>
              {editando ? (
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
                <p>{tipoAbrigo}</p>
              )}
            </div>

            <div className="form-group">
              <label><FaPeopleArrows /> Capacidade Total</label>
              {editando ? (
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
                <p>{capacidadeTotal}</p>
              )}
            </div>

            <div className="form-group">
              <label><FaPeopleArrows /> Capacidade Ocupada</label>
              {editando ? (
                <input
                  type="number"
                  name="capacidadeOcupada"
                  value={capacidadeOcupada}
                  className={`input-capacidade ${erroCapacidade ? 'input-erro' : ''}`}
                  onChange={(e) => {
                    const ocupada = parseInt(e.target.value)
                    setCapacidadeOcupada(ocupada)
                    validarCapacidade(ocupada, capacidadeTotal)
                  }}
                />
              ) : (
                <p>{capacidadeOcupada}</p>
              )}
            </div>

            {erroCapacidade && (
              <p style={{ color: '#ef4444', fontSize: '13px', marginTop: '4px' }}>
                {erroCapacidade}
              </p>
            )}

            <div className="infraestrutura-section">
              <h3 style={{ fontSize: '16px', fontWeight: '700', color: '#1e293b', marginBottom: '12px' }}>
                Infraestrutura
              </h3>

              <label className="checkbox-card" style={!editando ? { pointerEvents: 'none' } : {}}>
                <input type="checkbox" name="possuiAtendimentoMedico" checked={infraestrutura.possuiAtendimentoMedico} onChange={handleCheckboxChange} disabled={!editando} />
                <div className="checkbox-content"><FaMedkit className="icon" /><span>Atendimento Médico</span></div>
              </label>

              <label className="checkbox-card" style={!editando ? { pointerEvents: 'none' } : {}}>
                <input type="checkbox" name="possuiEnfermagem" checked={infraestrutura.possuiEnfermagem} onChange={handleCheckboxChange} disabled={!editando} />
                <div className="checkbox-content"><FaUserNurse className="icon" /><span>Enfermagem</span></div>
              </label>

              <label className="checkbox-card" style={!editando ? { pointerEvents: 'none' } : {}}>
                <input type="checkbox" name="possuiPets" checked={infraestrutura.possuiPets} onChange={handleCheckboxChange} disabled={!editando} />
                <div className="checkbox-content"><FaDog className="icon" /><span>Pets Bem-Vindos</span></div>
              </label>

              <label className="checkbox-card" style={!editando ? { pointerEvents: 'none' } : {}}>
                <input type="checkbox" name="possuiAcessibilidade" checked={infraestrutura.possuiAcessibilidade} onChange={handleCheckboxChange} disabled={!editando} />
                <div className="checkbox-content"><FaWheelchair className="icon" /><span>Acessibilidade</span></div>
              </label>

              <label className="checkbox-card" style={!editando ? { pointerEvents: 'none' } : {}}>
                <input type="checkbox" name="possuiCozinha" checked={infraestrutura.possuiCozinha} onChange={handleCheckboxChange} disabled={!editando} />
                <div className="checkbox-content"><FaUtensils className="icon" /><span>Cozinha Comunitária</span></div>
              </label>
            </div>
          </div>

          {/* ── COLUNA DIREITA ── */}
          <div className="form-column-right">

            <h3 style={{ fontSize: '16px', fontWeight: '700', color: '#1e293b', marginBottom: '12px' }}>
              Imagem do Abrigo
            </h3>

            <>
              {editando ? (
                <div className="upload-container">
                  {fotoExibida ? (
                    <div className="image-preview">
                      <img src={fotoExibida} alt="Preview do abrigo" />
                      <button
                        type="button"
                        onClick={() => { setNovaFoto(false); setFotoUrl(null); }}
                        className="btn-remove-image"
                      >
                        Remover Foto
                      </button>
                    </div>
                  ) : (
                    <label className="upload-dropzone">
                      <input type="file" accept="image/*" onChange={handleImagem} style={{ display: 'none' }} />
                      <FaUpload className="upload-icon" />
                      <p>Faça upload da foto principal do abrigo</p>
                      <span className="btn-upload-trigger">Selecionar arquivo do computador</span>
                    </label>
                  )}
                </div>
              ) : (
                <div className="upload-container">
                  {fotoExibida ? (
                    <img src={fotoExibida} alt={nomeAbrigo} style={{ maxWidth: '100%', maxHeight: '100%', borderRadius: '8px' }} />
                  ) : (
                    <p style={{ color: '#94a3b8', fontSize: '14px' }}>Sem foto cadastrada</p>
                  )}
                </div>
              )}
            </>

            <div className="form-actions">
              {editando ? (
                <>
                  <button type="submit" className="btn-action salvar">Salvar Alterações</button>
                  <div className="danger-actions">
                    <button type="button" onClick={handleExcluir} className="btn-action excluir">Excluir Registro</button>
                    <button type="button" onClick={handleCancelExcluir} className="btn-action cancelar">Cancelar edição</button>
                  </div>
                </>
              ) : null}
              {editando ? null : (
                <button type="button" onClick={handleEditar} className="btn-action cancelar">
                  Editar Abrigo
                </button>
              )}
            </div>

            {/* ── Vítimas Recentes — só no modo visualização ── */}
            {!editando && (
              <div style={{ marginTop: '24px' }}>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                  <h3 style={{ fontSize: '16px', fontWeight: '700', color: '#1e293b', margin: 0 }}>
                    Vítimas Presentes
                  </h3>
                  <button
                    type="button"
                    onClick={() => navigate(`/abrigos/${id}/vitimas`)}
                    style={{
                      fontSize: '13px', padding: '5px 12px', borderRadius: '6px',
                      border: '1px solid #cbd5e1', background: '#f8fafc',
                      color: '#334155', cursor: 'pointer', fontWeight: '500'
                    }}
                  >
                    Ver todas →
                  </button>
                </div>

                {vitimasRecentes.length > 0 ? (
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                    <thead>
                      <tr style={{ borderBottom: '2px solid #e2e8f0' }}>
                        <th style={{ textAlign: 'left', padding: '6px 8px', color: '#64748b', fontWeight: '600' }}>Nome</th>
                        <th style={{ textAlign: 'center', padding: '6px 8px', color: '#64748b', fontWeight: '600' }}>Idade</th>
                        <th style={{ textAlign: 'center', padding: '6px 8px', color: '#64748b', fontWeight: '600' }}>Entrada</th>
                      </tr>
                    </thead>
                    <tbody>
                      {vitimasRecentes.map((vitima) => (
                        <tr key={vitima.id_vitima} style={{ borderBottom: '1px solid #f1f5f9' }}>
                          <td style={{ padding: '8px 8px', color: '#0f172a', fontWeight: '500' }}>{vitima.nome}</td>
                          <td style={{ padding: '8px 8px', color: '#475569', textAlign: 'center' }}>{calcularIdade(vitima.dataNascimento)}</td>
                          <td style={{ padding: '8px 8px', color: '#475569', textAlign: 'center' }}>{formatarData(vitima.dataEntrada ?? vitima.createdAt)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                ) : (
                  <p style={{ fontSize: '13px', color: '#94a3b8', textAlign: 'center', padding: '16px 0' }}>
                    Nenhuma vítima vinculada a este abrigo.
                  </p>
                )}

                {/* ── Solicitações de Ajuda ── */}
                <div style={{ marginTop: '32px' }}>

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                    <h3 style={{ fontSize: '16px', fontWeight: '700', color: '#1e293b', margin: 0 }}>
                      Solicitações de Ajuda
                    </h3>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <button
                        type="button"
                        onClick={() => navigate(`/abrigos/${id}/cadastrar-solicitacao-ajuda`)}
                        style={{
                          fontSize: '13px', padding: '5px 12px', borderRadius: '6px',
                          border: 'none', background: '#0f172a', color: '#fff',
                          cursor: 'pointer', fontWeight: '600'
                        }}
                      >
                        + Nova Solicitação
                      </button>
                      <button
                        type="button"
                        onClick={() => navigate(`/abrigos/${id}/solicitacoes-ajuda`)}
                        style={{
                          fontSize: '13px', padding: '5px 12px', borderRadius: '6px',
                          border: '1px solid #cbd5e1', background: '#f8fafc',
                          color: '#334155', cursor: 'pointer', fontWeight: '500'
                        }}
                      >
                        Ver todas →
                      </button>
                    </div>
                  </div>

                  {solicitacoesAjuda.length > 0 ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      {solicitacoesAjuda.map((s) => {
                        const badge = badgeAjuda[s.status] ?? { label: s.status, bg: '#f1f5f9', cor: '#64748b' }
                        return (
                          <div
                            key={s.id_solicitacao}
                            onClick={() => navigate(`/visualizar-solicitacao-ajuda/${s.id_solicitacao}`)}
                            style={{
                              display: 'flex', alignItems: 'center', gap: '10px',
                              padding: '10px 12px', borderRadius: '8px',
                              border: '1px solid #e2e8f0', background: '#f8fafc',
                              cursor: 'pointer', transition: 'background 0.15s'
                            }}
                            onMouseEnter={e => e.currentTarget.style.background = '#f1f5f9'}
                            onMouseLeave={e => e.currentTarget.style.background = '#f8fafc'}
                          >
                            {/* Ícone */}
                            <div style={{
                              width: '34px', height: '34px', flexShrink: 0,
                              borderRadius: '8px', background: '#ede9fe',
                              display: 'flex', alignItems: 'center', justifyContent: 'center',
                              color: '#7c3aed', fontSize: '15px'
                            }}>
                              <FaHandHoldingHeart />
                            </div>

                            {/* Título + categoria */}
                            <div style={{ flex: 1, minWidth: 0 }}>
                              <p style={{ fontWeight: '600', color: '#0f172a', fontSize: '13px', margin: 0, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                {s.titulo}
                              </p>
                              <p style={{ fontSize: '11px', color: '#94a3b8', margin: '2px 0 0' }}>
                                {categoriaLabel[s.categoria] ?? s.categoria}
                              </p>
                            </div>

                            {/* Badge status */}
                            <span style={{
                              background: badge.bg, color: badge.cor,
                              padding: '3px 10px', borderRadius: '20px',
                              fontSize: '11px', fontWeight: '600', flexShrink: 0
                            }}>
                              {badge.label}
                            </span>
                          </div>
                        )
                      })}
                    </div>
                  ) : (
                    <p style={{ fontSize: '13px', color: '#94a3b8', textAlign: 'center', padding: '16px 0' }}>
                      Nenhuma solicitação de ajuda cadastrada.
                    </p>
                  )}
                </div>
                {/* ── fim Solicitações de Ajuda ── */}

              </div>
            )}

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