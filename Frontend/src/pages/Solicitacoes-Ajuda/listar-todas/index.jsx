// --------- Imports -----------
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaHandHoldingHeart, FaBuilding, FaClock, FaHeart, FaUser, FaPlus, FaPhoneAlt } from 'react-icons/fa';
import { FaLocationDot } from 'react-icons/fa6';
import SidebarAdm from '../../../components/SidebarAdm';
import { LIMITES } from '../../../utils/campos';
import { API_URL, fetchAdmin, formatarTempo } from '../../../services/api';
import '../../pg_adm/style.css';
import '../../alertas/alertas.css';

// ─── Rótulos (mesmos valores dos enums do banco) ──────────────────────────────
const STATUS = {
  aberto:       'Aberto',
  em_andamento: 'Em andamento',
  concluido:    'Concluído',
  cancelado:    'Cancelado',
}

const CATEGORIAS = {
  doacao:         'Doação',
  medicamento:    'Medicamento',
  voluntariado:   'Voluntariado',
  infraestrutura: 'Infraestrutura',
  outro:          'Outro',
}

const URGENCIAS = {
  critica: 'Crítica',
  alta:    'Alta',
  media:   'Média',
  baixa:   'Baixa',
}

// Minúsculo e sem acento — para a busca achar "agua" em "Água"
const normalizar = (texto) => String(texto ?? '')
  .normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase()

// ─── Todas as solicitações de ajuda, com o abrigo de cada uma ─────────────────
function ListarSolicitacoesAjuda() {

  const navigate = useNavigate();

  // ─── ESTADOS ────────────────────────────────────────────────
  const [solicitacoes, setSolicitacoes] = useState([])
  const [abrigos, setAbrigos] = useState([])
  const [carregando, setCarregando] = useState(true)
  const [erro, setErro] = useState('')

  const [filtroStatus, setFiltroStatus] = useState('')
  const [filtroCategoria, setFiltroCategoria] = useState('')
  const [filtroUrgencia, setFiltroUrgencia] = useState('')
  const [filtroAbrigo, setFiltroAbrigo] = useState('')
  const [busca, setBusca] = useState('')

  // 'lista' mostra uma linha por solicitação; 'abrigos' agrupa por abrigo
  const [visao, setVisao] = useState('lista')

  // Abrigo escolhido para criar uma nova solicitação
  const [abrigoNovaSolicitacao, setAbrigoNovaSolicitacao] = useState('')

  // ─── BUSCA DA API ────────────────────────────────────────────
  useEffect(() => {
    const buscar = async () => {
      try {
        const [resSolicitacoes, resAbrigos] = await Promise.all([
          fetchAdmin('/solicitacoes-ajuda/listar'),
          fetch(`${API_URL}/api/abrigos/listar`),
        ])
        if (!resSolicitacoes.ok || !resAbrigos.ok) throw new Error('Não foi possível carregar as solicitações.')

        setSolicitacoes((await resSolicitacoes.json()).solicitacoes)
        setAbrigos((await resAbrigos.json()).abrigos)
      } catch (e) {
        setErro(e.message)
      } finally {
        setCarregando(false)
      }
    }
    buscar()
  }, [])

  // ─── DERIVAÇÕES ──────────────────────────────────────────────
  // Os filtros de categoria, urgência, abrigo e busca valem para tudo;
  // o status filtra só a lista (os cards mostram o total de cada status)
  const termo = normalizar(busca.trim())
  const doFiltro = solicitacoes.filter(s =>
    (!filtroCategoria || s.categoria === filtroCategoria) &&
    (!filtroUrgencia  || s.urgencia === filtroUrgencia) &&
    (!filtroAbrigo    || s.abrigoId === Number(filtroAbrigo)) &&
    (!termo || normalizar(s.titulo).includes(termo) || normalizar(s.descricao).includes(termo) || normalizar(s.abrigo?.nome).includes(termo))
  )

  const filtradas = filtroStatus ? doFiltro.filter(s => s.status === filtroStatus) : doFiltro

  const contagem = (status) => doFiltro.filter(s => s.status === status).length

  // Agrupa por abrigo, com os abrigos com mais pedidos em aberto primeiro
  const porAbrigo = Object.values(filtradas.reduce((grupos, s) => {
    grupos[s.abrigoId] ??= { abrigoId: s.abrigoId, abrigo: s.abrigo, solicitacoes: [] }
    grupos[s.abrigoId].solicitacoes.push(s)
    return grupos
  }, {})).sort((a, b) =>
    b.solicitacoes.filter(s => s.status === 'aberto').length - a.solicitacoes.filter(s => s.status === 'aberto').length
  )

  // Só abrigos que têm solicitações aparecem no filtro
  const abrigosComSolicitacoes = abrigos.filter(a => solicitacoes.some(s => s.abrigoId === a.id))

  // ─── LINHA DE UMA SOLICITAÇÃO ───────────────────────────────
  const linha = (s, mostrarAbrigo = true) => (
    <div className="linha-lista" key={s.id_solicitacao}>
      <div className="linha-icone"><FaHandHoldingHeart /></div>

      <div className="linha-info">
        <p className="linha-titulo">{s.titulo}</p>
        <p className="linha-subtitulo">
          <span>{CATEGORIAS[s.categoria] ?? s.categoria}</span>
          {mostrarAbrigo && (
            <span>
              <FaBuilding />{' '}
              <a href={`/detalhes-abrigos/${s.abrigoId}`}>{s.abrigo?.nome}</a>
              {s.abrigo?.cidade && ` — ${s.abrigo.cidade}`}
            </span>
          )}
          <span title="Voluntários interessados"><FaHeart /> {s._count?.interesses ?? 0}</span>
          {s.voluntario && <span title="Voluntário responsável"><FaUser /> {s.voluntario.nome}</span>}
          <span><FaClock /> {formatarTempo(s.createdAt)}</span>
        </p>
      </div>

      <span className={`badge urgencia-${s.urgencia}`}>{URGENCIAS[s.urgencia] ?? s.urgencia}</span>
      <span className={`badge ${s.status}`}>{STATUS[s.status] ?? s.status}</span>

      <button
        onClick={() => navigate(`/visualizar-solicitacao-ajuda/${s.id_solicitacao}`)}
        className="btn-action cancelar"
        style={{ width: 'auto', padding: '8px 16px', fontSize: '13px', flexShrink: 0 }}
      >
        Ver detalhes
      </button>
    </div>
  )

  // ─── TELA ────────────────────────────────────────────────────
  return (
    <div className="dashboard">
      <SidebarAdm ativo="ajuda" />

      <main className="main">

        <header className="top">
          <div>
            <p className="modulo-breadcrumb"><a href="/pg_adm">Home</a> &gt; <span>Solicitações de ajuda</span></p>
            <h1 className="modulo-titulo">Solicitações de ajuda</h1>
            <p className="subtitle">Pedidos de doações, medicamentos, voluntários e reparos de todos os abrigos</p>
          </div>

          {/* Nova solicitação: a solicitação sempre pertence a um abrigo */}
          <div className="modulo-acoes-topo">
            <div className="barra-filtros" style={{ margin: 0 }}>
              <select value={abrigoNovaSolicitacao} onChange={e => setAbrigoNovaSolicitacao(e.target.value)}>
                <option value="">Escolha o abrigo...</option>
                {abrigos.map(a => <option key={a.id} value={a.id}>{a.nome} — {a.cidade}</option>)}
              </select>
            </div>
            <button
              className="botao-primario"
              disabled={!abrigoNovaSolicitacao}
              onClick={() => navigate(`/abrigos/${abrigoNovaSolicitacao}/cadastrar-solicitacao-ajuda`)}
            >
              <FaPlus /> Nova solicitação
            </button>
          </div>
        </header>

        {/* Cards de resumo por status — clicar filtra a lista */}
        <section className="resumo-alertas">
          {Object.entries(STATUS).map(([status, label]) => (
            <button
              key={status}
              className={`resumo-alerta-card ${filtroStatus === status ? 'selecionado' : ''}`}
              onClick={() => setFiltroStatus(filtroStatus === status ? '' : status)}
            >
              <div className="resumo-alerta-valor">{contagem(status)}</div>
              <div className="resumo-alerta-label"><span className={`badge ${status}`}>{label}</span></div>
            </button>
          ))}
        </section>

        <div className="panel">

          <div className="barra-filtros">
            <input
              placeholder="Buscar por título, descrição ou abrigo..."
              aria-label="Buscar"
              maxLength={LIMITES.busca}
              value={busca}
              onChange={e => setBusca(e.target.value)}
            />

            <select value={filtroStatus} onChange={e => setFiltroStatus(e.target.value)}>
              <option value="">Todos os status</option>
              {Object.entries(STATUS).map(([valor, label]) => <option key={valor} value={valor}>{label}</option>)}
            </select>

            <select value={filtroCategoria} onChange={e => setFiltroCategoria(e.target.value)}>
              <option value="">Todas as categorias</option>
              {Object.entries(CATEGORIAS).map(([valor, label]) => <option key={valor} value={valor}>{label}</option>)}
            </select>

            <select value={filtroUrgencia} onChange={e => setFiltroUrgencia(e.target.value)}>
              <option value="">Todas as urgências</option>
              {Object.entries(URGENCIAS).map(([valor, label]) => <option key={valor} value={valor}>{label}</option>)}
            </select>

            <select value={filtroAbrigo} onChange={e => setFiltroAbrigo(e.target.value)}>
              <option value="">Todos os abrigos</option>
              {abrigosComSolicitacoes.map(a => <option key={a.id} value={a.id}>{a.nome}</option>)}
            </select>

            <div className="alternar-visao">
              <button className={visao === 'lista' ? 'selecionado' : ''} onClick={() => setVisao('lista')}>Lista</button>
              <button className={visao === 'abrigos' ? 'selecionado' : ''} onClick={() => setVisao('abrigos')}>Por abrigo</button>
            </div>

            <span className="contador-resultados">
              {filtradas.length} solicitaç{filtradas.length !== 1 ? 'ões' : 'ão'}
            </span>
          </div>

          {erro && <p className="mensagem-erro" style={{ marginBottom: '12px' }}>{erro}</p>}

          {carregando ? (
            <p style={{ color: '#64748b' }}>Carregando solicitações...</p>
          ) : filtradas.length === 0 ? (
            <div className="lista-vazia">
              <FaHandHoldingHeart />
              <p>Nenhuma solicitação encontrada.</p>
            </div>
          ) : visao === 'lista' ? (
            filtradas.map(s => linha(s))
          ) : (
            porAbrigo.map(grupo => (
              <div className="grupo-abrigo" key={grupo.abrigoId}>
                <div className="grupo-abrigo-cabecalho">
                  <div>
                    <h4><FaBuilding /> {grupo.abrigo?.nome}</h4>
                    <small>
                      <FaLocationDot /> {[grupo.abrigo?.bairro, grupo.abrigo?.cidade].filter(Boolean).join(', ')}
                      {grupo.abrigo?.telefone && <> · <FaPhoneAlt /> {grupo.abrigo.telefone}</>}
                      {' · '}{grupo.solicitacoes.filter(s => s.status === 'aberto').length} em aberto
                    </small>
                  </div>
                  <div className="modulo-acoes-topo">
                    <a className="botao-secundario" href={`/abrigos/${grupo.abrigoId}/solicitacoes-ajuda`}>Solicitações do abrigo</a>
                    <a className="botao-secundario" href={`/detalhes-abrigos/${grupo.abrigoId}`}>Ver abrigo</a>
                  </div>
                </div>
                {grupo.solicitacoes.map(s => linha(s, false))}
              </div>
            ))
          )}
        </div>

        <footer style={{ marginTop: 'auto', paddingTop: '20px', display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: '#94a3b8' }}>
          <p>© 2026 S.O.S Vale. Todos os direitos reservados.</p>
          <p>Versão 1.0.0</p>
        </footer>

      </main>
    </div>
  )
}

export default ListarSolicitacoesAjuda;
