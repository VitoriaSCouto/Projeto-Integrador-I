// --------- Imports -----------
import { useState, useEffect } from 'react';
import { useParams, useNavigate } from "react-router-dom";
import {
  FaHome, FaBoxOpen, FaUser, FaDonate, FaMap,
  FaMapMarkerAlt, FaPhoneAlt, FaDog, FaUserNurse,
  FaWheelchair, FaUtensils, FaBuilding, FaPeopleArrows,
  FaMedkit, FaMapMarkedAlt, FaEnvelope, FaIdCard, FaLocationArrow
} from 'react-icons/fa';
import { FaGear, FaClipboardList } from "react-icons/fa6";
import { GoAlertFill } from "react-icons/go";
import "../../pg_adm/style.css";
import './DetalhesSolicitacao.css';

function DetalhesSolicitacao() {

  // ─── ESTADOS ────────────────────────────────────────────────
  const { id } = useParams();
  const navigate = useNavigate();

  // Backup dos dados originais (igual ao dadosAbrigo no DetalhesAbrigo)
  const [dadosSolicitacao, setDadosSolicitacao] = useState({})

  // Tela de loading
  const [carregando, setCarregando] = useState(true);

  // Campos da solicitação — espelha os campos do modelo
  const [nomeSolicitacao, setNomeSolicitacao] = useState('');
  const [cep, setCep] = useState('');
  const [endereco, setEndereco] = useState('');
  const [cidade, setCidade] = useState('');
  const [estado, setEstado] = useState('');
  const [bairro, setBairro] = useState('');
  const [telefone, setTelefone] = useState('');
  const [responsavel, setResponsavel] = useState('');
  const [tipoAbrigo, setTipoAbrigo] = useState('');
  const [capacidadeTotal, setCapacidadeTotal] = useState(0);
  const [status, setStatus] = useState('pendente');
  const [motivoRecusa, setMotivoRecusa] = useState('');

  // Coordenadas — vindas do geocoding feito no cadastro
  // Só leitura aqui, exibidas como informação para o admin
  const [latitude, setLatitude] = useState(null);
  const [longitude, setLongitude] = useState(null);

  // Dados do solicitante (quem pediu)
  const [solicitanteNome, setSolicitanteNome] = useState('');
  const [solicitanteEmail, setSolicitanteEmail] = useState('');
  const [solicitanteTelefone, setSolicitanteTelefone] = useState('');

  // Foto
  const [fotoUrl, setFotoUrl] = useState(null);

  // Infraestrutura (igual ao DetalhesAbrigo)
  const [infraestrutura, setInfraestrutura] = useState({
    possuiAtendimentoMedico: false,
    possuiEnfermagem: false,
    possuiPets: false,
    possuiAcessibilidade: false,
    possuiCozinha: false
  });

  // Controla qual painel de decisão está aberto: null | 'aprovar' | 'recusar'
  // Só abre o painel quando o admin clica, para não poluir a tela
  const [painelDecisao, setPainelDecisao] = useState(null);


  // ─── BUSCA DOS DADOS ────────────────────────────────────────
  // Mesma lógica do DetalhesAbrigo: roda uma vez quando o :id da URL aparece
  useEffect(() => {
    const buscarSolicitacao = async () => {
      try {
        const resposta = await fetch(`http://localhost:3000/api/solicitacoes/listar/${id}`)
        const dados = await resposta.json()

        // Guarda backup para o cancelar (igual ao DetalhesAbrigo)
        setDadosSolicitacao(dados)

        // Preenche os estados com o que veio da API
        setNomeSolicitacao(dados.nome ?? '')
        setCep(dados.cep ?? '')
        setEndereco(dados.endereco ?? '')
        setCidade(dados.cidade ?? '')
        setEstado(dados.estado ?? '')
        setBairro(dados.bairro ?? '')
        setTelefone(dados.telefone ?? '')
        setResponsavel(dados.responsavel ?? '')
        setTipoAbrigo(dados.tipoAbrigo ?? '')
        setCapacidadeTotal(dados.capacidadeTotal ?? 0)
        setStatus(dados.status ?? 'pendente')
        setMotivoRecusa(dados.motivoRecusa ?? '')
        setSolicitanteNome(dados.solicitanteNome ?? '')
        setSolicitanteEmail(dados.solicitanteEmail ?? '')
        setSolicitanteTelefone(dados.solicitanteTelefone ?? '')
        setFotoUrl(dados.fotoAbrigo ? dados.fotoAbrigo + '?t=' + Date.now() : null)

        // Carrega as coordenadas se existirem
        setLatitude(dados.latitude ?? null)
        setLongitude(dados.longitude ?? null)

        setInfraestrutura({
          possuiAtendimentoMedico: dados.possuiAtendimentoMedico ?? false,
          possuiEnfermagem:        dados.possuiEnfermagem        ?? false,
          possuiPets:              dados.possuiPets              ?? false,
          possuiAcessibilidade:    dados.possuiAcessibilidade    ?? false,
          possuiCozinha:           dados.possuiCozinha           ?? false
        })

      } catch (erro) {
        console.error('Erro ao buscar solicitação:', erro)
      } finally {
        setCarregando(false)
      }
    }

    buscarSolicitacao()
  }, [id])


  // ─── HANDLERS ───────────────────────────────────────────────

  // Aprovar: chama a rota /analisar com status "aprovado"
  // Quando aprovado, a API cria o Abrigo automaticamente e vincula o abrigo_id
  const handleAprovar = async () => {
    if (!confirm('Confirmar aprovação desta solicitação? Um abrigo será criado automaticamente.')) return

    try {
      const resposta = await fetch(`http://localhost:3000/api/solicitacoes/analisar/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: 'aprovado',
          adminId: 1 // TODO: substituir pelo ID do admin logado quando tiver autenticação
        })
      })

      const dados = await resposta.json()

      if (!resposta.ok) {
        alert(dados.mensagem)
        return
      }

      // Atualiza o status na tela sem precisar recarregar
      setStatus('aprovado')
      setDadosSolicitacao(prev => ({ ...prev, status: 'aprovado' }))
      setPainelDecisao(null)
      alert(`Solicitação aprovada! Abrigo criado com ID ${dados.abrigoCriado.id_abrigo}.`)

    } catch (erro) {
      console.error('Erro ao aprovar:', erro)
    }
  }

  // Recusar: chama a rota /analisar com status "recusado" + motivoRecusa obrigatório
  const handleRecusar = async () => {
    if (!motivoRecusa.trim()) {
      alert('Informe o motivo da recusa antes de continuar.')
      return
    }

    if (!confirm('Confirmar recusa desta solicitação?')) return

    try {
      const resposta = await fetch(`http://localhost:3000/api/solicitacoes/analisar/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: 'recusado',
          motivoRecusa,
          adminId: 1 // TODO: substituir pelo ID do admin logado
        })
      })

      const dados = await resposta.json()

      if (!resposta.ok) {
        alert(dados.mensagem)
        return
      }

      setStatus('recusado')
      setDadosSolicitacao(prev => ({ ...prev, status: 'recusado', motivoRecusa }))
      setPainelDecisao(null)
      alert('Solicitação recusada.')

    } catch (erro) {
      console.error('Erro ao recusar:', erro)
    }
  }

  // Excluir a solicitação (só disponível se já foi analisada)
  const handleExcluir = async () => {
    if (!confirm('Tem certeza que deseja excluir esta solicitação?')) return

    try {
      await fetch(`http://localhost:3000/api/solicitacoes/excluir/${id}`, { method: 'DELETE' })
      navigate('../listar-solicitação-abrigo')
    } catch (erro) {
      console.error('Erro ao excluir:', erro)
    }
  }

  // Badge colorido do status — igual ao padrão visual do projeto
  const badgeStatus = {
    pendente:  { label: 'Pendente',  cor: '#f59e0b' },
    aprovado:  { label: 'Aprovado',  cor: '#22c55e' },
    recusado:  { label: 'Recusado',  cor: '#ef4444' },
  }[status] ?? { label: status, cor: '#94a3b8' }


  // ─── TELA DE LOADING ────────────────────────────────────────
  if (carregando) {
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
            <a href="/vitimas"><li><FaUser className="icon" /> Vítimas</li></a>
            <li><FaDonate className="icon" /> Doações</li>
            <a href="/mapa"><li><FaMap className="icon" /> Mapa</li></a>
            <a href="/alertas"><li><GoAlertFill className="icon" /> Alertas</li></a>
            <li><FaGear className="icon" /> Configurações</li>
          </ul>
        </aside>
        <main className="main">
          <p style={{ padding: '40px', color: '#64748b' }}>Carregando dados da solicitação...</p>
        </main>
      </div>
    )
  }


  // ─── TELA PRINCIPAL ─────────────────────────────────────────
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
          <a href="/vitimas"><li><FaUser className="icon" /> Vítimas</li></a>
          <li><FaDonate className="icon" /> Doações</li>
          <a href="/mapa"><li><FaMap className="icon" /> Mapa</li></a>
          <a href="/alertas"><li><GoAlertFill className="icon" /> Alertas</li></a>
          <li className="active"><FaGear className="icon" /> Configurações</li>
        </ul>
      </aside>

      <main className="main">
        <header className="top">
          <div>
            <p style={{ fontSize: '14px', color: '#64748b', margin: 0 }}>
              Solicitações &gt; <span>{nomeSolicitacao}</span>
            </p>
            <h1 style={{ fontSize: '26px', fontWeight: '700', color: '#0f172a', marginTop: '4px' }}>
              Detalhes da Solicitação
            </h1>
            <p className="subtitle">Analise e tome uma decisão sobre este pedido</p>
          </div>

          {/* Badge de status no canto direito do header */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <span style={{
              background: badgeStatus.cor,
              color: '#fff',
              padding: '6px 16px',
              borderRadius: '20px',
              fontWeight: '600',
              fontSize: '14px'
            }}>
              {badgeStatus.label}
            </span>
          </div>
        </header>

        {/* Tudo aqui é só leitura — diferente do DetalhesAbrigo, não tem modo edição
            O admin não edita a solicitação, apenas aprova ou recusa */}
        <div className="cadastro-form-container">

          {/* ── COLUNA ESQUERDA ── */}
          <div className="form-column-left">

            {/* Dados do Abrigo Proposto */}
            <h3 style={{ fontSize: '15px', fontWeight: '700', color: '#1e293b', marginBottom: '12px' }}>
              Dados do Abrigo Proposto
            </h3>

            <div className="form-group">
              <label><FaBuilding /> Nome do Abrigo</label>
              <p>{nomeSolicitacao}</p>
            </div>

            {/* CEP separado — igual ao padrão do DetalhesAbrigo */}
            <div className="form-group">
              <label><FaMapMarkedAlt /> CEP</label>
              <p>{cep || '—'}</p>
            </div>

            {/* Estado separado */}
            <div className="form-group">
              <label><FaMapMarkedAlt /> Estado</label>
              <p>{estado || '—'}</p>
            </div>

            {/* Cidade separada */}
            <div className="form-group">
              <label><FaMapMarkedAlt /> Cidade</label>
              <p>{cidade || '—'}</p>
            </div>

            {/* Bairro separado */}
            <div className="form-group">
              <label><FaMapMarkedAlt /> Bairro</label>
              <p>{bairro || '—'}</p>
            </div>

            {/* Endereço + coordenadas juntos na mesma seção */}
            <div className="form-group">
              <label><FaMapMarkerAlt /> Endereço</label>
              <p>{endereco || '—'}</p>

              {/*
                Exibe as coordenadas se o solicitante as gerou durante o cadastro.
                Aqui é só informativo para o admin — ajuda a validar se o local é real.
                A mesma cor azul (#0ea5e9) usada no DetalhesAbrigo para "existente".
              */}
              {latitude && longitude ? (
                <p style={{
                  fontSize: '12px',
                  marginTop: '4px',
                  color: '#0ea5e9',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px'
                }}>
                  <FaLocationArrow />
                  Localização mapeada: ({Number(latitude).toFixed(5)}, {Number(longitude).toFixed(5)})
                </p>
              ) : (
                <p style={{ fontSize: '12px', marginTop: '4px', color: '#94a3b8' }}>
                  Sem localização mapeada
                </p>
              )}
            </div>

            <div className="form-group">
              <label><FaPhoneAlt /> Telefone</label>
              <p>{telefone || '—'}</p>
            </div>

            <div className="form-group">
              <label><FaUser /> Responsável</label>
              <p>{responsavel}</p>
            </div>

            <div className="form-group">
              <label><FaBuilding /> Tipo de Abrigo</label>
              <p>{tipoAbrigo}</p>
            </div>

            <div className="form-group">
              <label><FaPeopleArrows /> Capacidade Total</label>
              <p>{capacidadeTotal} pessoas</p>
            </div>

            {/* Infraestrutura — só leitura, checkboxes desabilitados */}
            <div className="infraestrutura-section">
              <h3 style={{ fontSize: '16px', fontWeight: '700', color: '#1e293b', marginBottom: '12px' }}>
                Infraestrutura
              </h3>

              {[
                { name: 'possuiAtendimentoMedico', label: 'Atendimento Médico',  icon: <FaMedkit />    },
                { name: 'possuiEnfermagem',        label: 'Enfermagem',          icon: <FaUserNurse /> },
                { name: 'possuiPets',              label: 'Pets Bem-Vindos',     icon: <FaDog />       },
                { name: 'possuiAcessibilidade',    label: 'Acessibilidade',      icon: <FaWheelchair />},
                { name: 'possuiCozinha',           label: 'Cozinha Comunitária', icon: <FaUtensils />  },
              ].map(item => (
                <label key={item.name} className="checkbox-card" style={{ pointerEvents: 'none' }}>
                  <input type="checkbox" checked={infraestrutura[item.name]} readOnly />
                  <div className="checkbox-content">
                    {item.icon}<span>{item.label}</span>
                  </div>
                </label>
              ))}
            </div>

            {/* Dados do Solicitante — seção exclusiva desta tela */}
            <h3 style={{ fontSize: '15px', fontWeight: '700', color: '#1e293b', margin: '24px 0 12px' }}>
              Dados do Solicitante
            </h3>

            <div className="form-group">
              <label><FaIdCard /> Nome</label>
              <p>{solicitanteNome}</p>
            </div>

            <div className="form-group">
              <label><FaEnvelope /> E-mail</label>
              <p>{solicitanteEmail}</p>
            </div>

            <div className="form-group">
              <label><FaPhoneAlt /> Telefone</label>
              <p>{solicitanteTelefone || '—'}</p>
            </div>

            {/* Motivo da recusa — aparece só se já foi recusado */}
            {status === 'recusado' && dadosSolicitacao.motivoRecusa && (
              <div className="form-group" style={{ marginTop: '16px' }}>
                <label style={{ color: '#ef4444' }}>Motivo da Recusa</label>
                <p style={{ color: '#ef4444' }}>{dadosSolicitacao.motivoRecusa}</p>
              </div>
            )}

          </div>

          {/* ── COLUNA DIREITA ── */}
          <div className="form-column-right">

            <h3 style={{ fontSize: '16px', fontWeight: '700', color: '#1e293b', marginBottom: '12px' }}>
              Imagem do Abrigo
            </h3>

            {/* Foto — só visualização, sem upload */}
            <div className="upload-container">
              {fotoUrl ? (
                <img src={fotoUrl} alt={nomeSolicitacao} style={{ maxWidth: '100%', maxHeight: '100%', borderRadius: '8px' }} />
              ) : (
                <p style={{ color: '#94a3b8', fontSize: '14px' }}>Sem foto cadastrada</p>
              )}
            </div>

            {/* ── PAINEL DE DECISÃO ──
                Só aparece se a solicitação ainda está pendente.
                Quando o admin clica em Aprovar ou Recusar, abre o painel correspondente.
                Isso evita ações acidentais — o admin precisa confirmar antes. */}
            {status === 'pendente' && (
              <div className="form-actions" style={{ marginTop: '24px' }}>

                {/* Nenhum painel aberto: mostra os dois botões */}
                {painelDecisao === null && (
                  <>
                    <button
                      type="button"
                      className="btn-action salvar"
                      onClick={() => setPainelDecisao('aprovar')}
                    >
                      Aprovar Solicitação
                    </button>
                    <button
                      type="button"
                      className="btn-action excluir"
                      onClick={() => setPainelDecisao('recusar')}
                    >
                      Recusar Solicitação
                    </button>
                  </>
                )}

                {/* Painel de aprovação aberto */}
                {painelDecisao === 'aprovar' && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    <p style={{ fontSize: '14px', color: '#1e293b' }}>
                      Ao aprovar, um abrigo será criado automaticamente com estes dados.
                      {latitude && longitude && (
                        <span style={{ display: 'block', marginTop: '6px', color: '#0ea5e9', fontSize: '12px' }}>
                          <FaLocationArrow style={{ marginRight: '4px' }} />
                          O abrigo já terá localização no mapa.
                        </span>
                      )}
                    </p>
                    <button type="button" className="btn-action salvar" onClick={handleAprovar}>
                      Confirmar Aprovação
                    </button>
                    <button type="button" className="btn-action cancelar" onClick={() => setPainelDecisao(null)}>
                      Voltar
                    </button>
                  </div>
                )}

                {/* Painel de recusa aberto — exige motivo antes de confirmar */}
                {painelDecisao === 'recusar' && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    <label style={{ fontSize: '14px', fontWeight: '600', color: '#1e293b' }}>
                      Motivo da recusa (obrigatório)
                    </label>
                    <textarea
                      value={motivoRecusa}
                      onChange={(e) => setMotivoRecusa(e.target.value)}
                      placeholder="Descreva o motivo..."
                      rows={4}
                      style={{
                        borderRadius: '8px', border: '1px solid #e2e8f0',
                        padding: '10px', fontSize: '14px', resize: 'vertical'
                      }}
                    />
                    <button type="button" className="btn-action excluir" onClick={handleRecusar}>
                      Confirmar Recusa
                    </button>
                    <button type="button" className="btn-action cancelar" onClick={() => setPainelDecisao(null)}>
                      Voltar
                    </button>
                  </div>
                )}

              </div>
            )}

            {/* Se já foi analisada, mostra só o botão de excluir */}
            {status !== 'pendente' && (
              <div className="form-actions" style={{ marginTop: '24px' }}>
                <button type="button" className="btn-action excluir" onClick={handleExcluir}>
                  Excluir Solicitação
                </button>
              </div>
            )}

          </div>
        </div>

        <footer style={{ marginTop: 'auto', paddingTop: '20px', display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: '#94a3b8' }}>
          <p>© 2026 S.O.S Vale. Todos os direitos reservados.</p>
          <p>Versão 1.0.0</p>
        </footer>
      </main>
    </div>
  )
}

export default DetalhesSolicitacao;