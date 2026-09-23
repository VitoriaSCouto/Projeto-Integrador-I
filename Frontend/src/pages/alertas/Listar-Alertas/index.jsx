// --------- Imports -----------
import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaUsers, FaMapMarkedAlt, FaSyncAlt, FaClock } from 'react-icons/fa';
import { FaLocationDot } from 'react-icons/fa6';
import { GoAlertFill } from 'react-icons/go';
import SidebarAdm from '../../../components/SidebarAdm';
import { apiAdmin, formatarTempo } from '../../../services/api';
import { STATUS_ALERTA } from '../constantes';
import '../../pg_adm/style.css';
import '../alertas.css';

// Recarrega a lista sozinha para acompanhar os relatos chegando
const INTERVALO_ATUALIZACAO_MS = 30000

function ListarAlertas() {

  const navigate = useNavigate();

  // ─── ESTADOS ────────────────────────────────────────────────
  const [alertas, setAlertas] = useState([])
  const [opcoes, setOpcoes] = useState({ tipos: [], confirmacoesNecessarias: 3 })
  const [cidades, setCidades] = useState([])
  const [carregando, setCarregando] = useState(true)
  const [erro, setErro] = useState('')

  const [filtroStatus, setFiltroStatus] = useState('todos')
  const [filtroCidade, setFiltroCidade] = useState('')
  const [filtroTipo, setFiltroTipo] = useState('')

  // ─── BUSCA DA API ────────────────────────────────────────────
  const buscarAlertas = useCallback(async () => {
    try {
      const dados = await apiAdmin('/alertas/listar')
      setAlertas(dados.alertas)
      setErro('')
    } catch (e) {
      setErro(e.message)
    } finally {
      setCarregando(false)
    }
  }, [])

  useEffect(() => {
    apiAdmin('/alertas/opcoes').then(setOpcoes).catch(e => setErro(e.message))
    apiAdmin('/cidades/listar').then(d => setCidades(d.cidades)).catch(console.error)

    buscarAlertas()
    const intervalo = setInterval(buscarAlertas, INTERVALO_ATUALIZACAO_MS)
    return () => clearInterval(intervalo)
  }, [buscarAlertas])

  // ─── DERIVAÇÕES ──────────────────────────────────────────────
  // Cidade e tipo filtram tudo; o status filtra só a lista (os cards
  // continuam mostrando o total de cada status)
  const alertasDoFiltro = alertas.filter(a =>
    (!filtroCidade || a.cidadeId === Number(filtroCidade)) &&
    (!filtroTipo || a.tipo === filtroTipo)
  )

  const alertasFiltrados = filtroStatus === 'todos'
    ? alertasDoFiltro
    : alertasDoFiltro.filter(a => a.status === filtroStatus)

  const contagem = (status) => alertasDoFiltro.filter(a => a.status === status).length

  const emojiDoTipo = (tipo) => opcoes.tipos.find(t => t.valor === tipo)?.emoji ?? '⚠️'

  // ─── TELA ────────────────────────────────────────────────────
  return (
    <div className="dashboard">
      <SidebarAdm ativo="alertas" />

      <main className="main">

        <header className="top">
          <div>
            <p className="modulo-breadcrumb"><a href="/pg_adm">Home</a> &gt; <span>Alertas</span></p>
            <h1 className="modulo-titulo">Alertas</h1>
            <p className="subtitle">
              Ocorrências relatadas pelos moradores no WhatsApp. O alerta é enviado automaticamente
              quando {opcoes.confirmacoesNecessarias} pessoas diferentes relatam a mesma ocorrência no mesmo bairro.
            </p>
          </div>
          <div className="modulo-acoes-topo">
            <button className="botao-secundario" onClick={buscarAlertas}><FaSyncAlt /> Atualizar</button>
            <a className="botao-secundario" href="/inscritos"><FaUsers /> Inscritos</a>
            <a className="botao-secundario" href="/regioes"><FaMapMarkedAlt /> Regiões e grupos</a>
          </div>
        </header>

        {/* Cards de resumo — clicar filtra a lista */}
        <section className="resumo-alertas">
          {Object.entries(STATUS_ALERTA).map(([status, label]) => (
            <button
              key={status}
              className={`resumo-alerta-card ${filtroStatus === status ? 'selecionado' : ''}`}
              onClick={() => setFiltroStatus(filtroStatus === status ? 'todos' : status)}
            >
              <div className="resumo-alerta-valor">{contagem(status)}</div>
              <div className="resumo-alerta-label"><span className={`badge ${status}`}>{label}</span></div>
            </button>
          ))}
        </section>

        <div className="panel">

          <div className="barra-filtros">
            <select value={filtroStatus} onChange={e => setFiltroStatus(e.target.value)}>
              <option value="todos">Todos os status</option>
              {Object.entries(STATUS_ALERTA).map(([valor, label]) => (
                <option key={valor} value={valor}>{label}</option>
              ))}
            </select>

            <select value={filtroCidade} onChange={e => setFiltroCidade(e.target.value)}>
              <option value="">Todas as cidades</option>
              {cidades.map(c => (
                <option key={c.id_cidade} value={c.id_cidade}>{c.nome}/{c.estado}</option>
              ))}
            </select>

            <select value={filtroTipo} onChange={e => setFiltroTipo(e.target.value)}>
              <option value="">Todos os tipos</option>
              {opcoes.tipos.map(t => (
                <option key={t.valor} value={t.valor}>{t.emoji} {t.label}</option>
              ))}
            </select>

            <span className="contador-resultados">
              {alertasFiltrados.length} resultado{alertasFiltrados.length !== 1 ? 's' : ''}
            </span>
          </div>

          {erro && <p className="mensagem-erro" style={{ marginBottom: '12px' }}>{erro}</p>}

          {carregando ? (
            <p style={{ color: '#64748b' }}>Carregando alertas...</p>
          ) : alertasFiltrados.length === 0 ? (
            <div className="lista-vazia">
              <GoAlertFill />
              <p>Nenhum alerta encontrado.</p>
            </div>
          ) : (
            alertasFiltrados.map(a => {
              const porcentagem = Math.min(100, (a.totalRelatos / a.confirmacoesNecessarias) * 100)

              return (
                <div className="linha-lista" key={a.id_alerta}>
                  <div className="linha-icone">{emojiDoTipo(a.tipo)}</div>

                  <div className="linha-info">
                    <p className="linha-titulo">#{a.id_alerta} · {a.tipoLabel}</p>
                    <p className="linha-subtitulo">
                      <span><FaLocationDot /> {a.bairro} — {a.cidade}/{a.estado}</span>
                      <span><FaClock /> {formatarTempo(a.createdAt)}</span>
                    </p>
                  </div>

                  <span className={`badge ${a.gravidade}`}>{a.gravidadeLabel}</span>

                  {/* Enquanto está em verificação mostra quantos relatos faltam */}
                  <div className="confirmacoes">
                    {a.status === 'em_verificacao'
                      ? `${a.totalRelatos}/${a.confirmacoesNecessarias} relatos`
                      : `${a.totalRelatos} relato${a.totalRelatos !== 1 ? 's' : ''}`}
                    {a.status === 'em_verificacao' && (
                      <div className="confirmacoes-barra">
                        <div style={{ width: `${porcentagem}%` }} />
                      </div>
                    )}
                  </div>

                  <span className={`badge ${a.status}`}>{STATUS_ALERTA[a.status]}</span>

                  <button
                    onClick={() => navigate(`/alertas/${a.id_alerta}`)}
                    className="btn-action cancelar"
                    style={{ width: 'auto', padding: '8px 16px', fontSize: '13px', flexShrink: 0 }}
                  >
                    Ver detalhes
                  </button>
                </div>
              )
            })
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

export default ListarAlertas;
