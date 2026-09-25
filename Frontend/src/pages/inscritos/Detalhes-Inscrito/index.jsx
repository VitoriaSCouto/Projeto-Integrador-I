// --------- Imports -----------
import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { FaIdCard, FaEnvelope, FaPhoneAlt, FaWhatsapp, FaPlus, FaClock } from 'react-icons/fa';
import SidebarAdm from '../../../components/SidebarAdm';
import SeletorLocalidade from '../../../components/SeletorLocalidade';
import { apiAdmin, formatarDataHora, formatarTempo, formatarTelefone } from '../../../services/api';
import { LIMITES, EXEMPLOS } from '../../../utils/campos';
import { Obrigatorio } from '../../../components/MarcasCampo';
import { STATUS_ALERTA } from '../../alertas/constantes';
import '../../pg_adm/style.css';
import '../../Solicitacoes-Abrigo/Detalhes-solicitacao/DetalhesSolicitacao.css';
import '../../alertas/alertas.css';

function DetalhesInscrito() {

  const { id } = useParams();
  const navigate = useNavigate();

  // ─── ESTADOS ────────────────────────────────────────────────
  const [inscrito, setInscrito] = useState(null)   // dados como vieram da API
  const [carregando, setCarregando] = useState(true)
  const [salvando, setSalvando] = useState(false)
  const [erro, setErro] = useState('')
  const [mensagem, setMensagem] = useState('')

  // Campos editáveis (o telefone NÃO é editável — vem do WhatsApp da pessoa)
  const [nome, setNome] = useState('')
  const [email, setEmail] = useState('')
  const [ativo, setAtivo] = useState(true)
  const [residencia, setResidencia] = useState({ cidadeId: null, bairroId: null })
  const [interesses, setInteresses] = useState([])

  // Bairro que está sendo escolhido para acompanhar
  const [novoInteresse, setNovoInteresse] = useState({ cidadeId: null, bairroId: null })

  // ─── BUSCA DOS DADOS ────────────────────────────────────────
  const preencher = (dados) => {
    setInscrito(dados)
    setNome(dados.nome)
    setEmail(dados.email)
    setAtivo(dados.ativo)
    setResidencia({ cidadeId: dados.cidadeId, bairroId: dados.bairroId })
    setInteresses(dados.bairrosInteresse)
  }

  const buscarInscrito = useCallback(async () => {
    try {
      preencher(await apiAdmin(`/inscritos/listar/${id}`))
    } catch (e) {
      setErro(e.message)
    } finally {
      setCarregando(false)
    }
  }, [id])

  useEffect(() => {
    buscarInscrito()
  }, [buscarInscrito])

  // ─── HANDLERS ───────────────────────────────────────────────
  const handleAdicionarInteresse = () => {
    const { bairroId, bairro, cidade, estado, cidadeId } = novoInteresse
    if (!bairroId) return

    if (bairroId === residencia.bairroId) {
      setErro('Este já é o bairro onde a pessoa mora.')
      return
    }
    if (interesses.some(b => b.id_bairro === bairroId)) {
      setErro('Este bairro já está na lista.')
      return
    }

    setErro('')
    setInteresses([...interesses, { id_bairro: bairroId, nome: bairro, cidade, estado, cidadeId }])
    setNovoInteresse({ cidadeId, bairroId: null })
  }

  const handleSalvar = async (e) => {
    e.preventDefault()
    if (!residencia.bairroId) {
      setErro('Selecione o bairro onde a pessoa mora.')
      return
    }

    setSalvando(true)
    setErro('')
    setMensagem('')

    try {
      const dados = await apiAdmin(`/inscritos/atualizar/${id}`, {
        metodo: 'PUT',
        corpo: {
          nome, email, ativo,
          bairroId: residencia.bairroId,
          bairrosInteresse: interesses.map(b => b.id_bairro),
        }
      })
      setMensagem(dados.mensagem)
      preencher({ ...inscrito, ...dados.inscrito })
    } catch (e) {
      setErro(e.message)
    } finally {
      setSalvando(false)
    }
  }

  const handleDescartar = () => {
    preencher(inscrito)
    setErro('')
    setMensagem('')
  }

  const handleExcluir = async () => {
    if (!confirm(`Excluir ${inscrito.nome}? A pessoa deixa de receber alertas. Os relatos já enviados continuam valendo, mas sem autor.`)) return

    try {
      await apiAdmin(`/inscritos/excluir/${id}`, { metodo: 'DELETE' })
      navigate('/inscritos')
    } catch (e) {
      setErro(e.message)
    }
  }

  // ─── TELA DE LOADING / ERRO ─────────────────────────────────
  if (carregando || !inscrito) {
    return (
      <div className="dashboard">
        <SidebarAdm ativo="inscritos" />
        <main className="main">
          <p style={{ padding: '40px', color: erro ? '#ef4444' : '#64748b' }}>
            {erro || 'Carregando inscrito...'}
          </p>
        </main>
      </div>
    )
  }

  // Contatos no formato "@lid" chegavam com o código interno do WhatsApp salvo no
  // lugar do telefone; o bot corrige ao ser reiniciado
  // (em "@c.us" o próprio ID é o telefone, então está certo)
  const telefoneIdentificado = Boolean(inscrito.telefone) &&
    !(inscrito.whatsappId.endsWith('@lid') && inscrito.telefone === inscrito.whatsappId.split('@')[0])

  // ─── TELA PRINCIPAL ─────────────────────────────────────────
  return (
    <div className="dashboard">
      <SidebarAdm ativo="inscritos" />

      <main className="main">
        <header className="top">
          <div>
            <p className="modulo-breadcrumb"><a href="/inscritos">Inscritos</a> &gt; <span>{inscrito.nome}</span></p>
            <h1 className="modulo-titulo">{inscrito.nome}</h1>
            <p className="subtitle">Inscrito desde {formatarDataHora(inscrito.createdAt)}</p>
          </div>
          <span className={`badge ${inscrito.ativo ? 'inscrito-ativo' : 'inscrito-inativo'}`} style={{ fontSize: '14px', padding: '6px 16px' }}>
            {inscrito.ativo ? 'Recebendo alertas' : 'Inativo'}
          </span>
        </header>

        <form className="cadastro-form-container" onSubmit={handleSalvar}>

          {/* ── COLUNA ESQUERDA: dados e bairro ── */}
          <div className="form-column-left">
            <h3 className="secao-titulo">Dados pessoais</h3>

            <div className="form-group">
              <label htmlFor="nome-inscrito"><FaIdCard /> Nome<Obrigatorio /></label>
              <input id="nome-inscrito" value={nome} onChange={e => setNome(e.target.value)} required minLength={2} maxLength={LIMITES.nomePessoa} />
            </div>

            <div className="form-group">
              <label htmlFor="email-inscrito"><FaEnvelope /> E-mail<Obrigatorio /></label>
              <input id="email-inscrito" type="email" value={email} onChange={e => setEmail(e.target.value)} required
                maxLength={LIMITES.email} placeholder={EXEMPLOS.email} />
            </div>

            {/* Telefone e WhatsApp só leitura: vêm do WhatsApp da pessoa e são o que
                identifica quem recebe os alertas — trocar por engano mandaria os avisos
                para outra pessoa */}
            <div className="form-group">
              <label><FaPhoneAlt /> Telefone</label>
              <p style={{ fontSize: '15px', color: '#0f172a', fontWeight: 600 }}>
                {telefoneIdentificado
                  ? formatarTelefone(inscrito.telefone)
                  : <span style={{ color: '#94a3b8', fontWeight: 400 }}>
                      Ainda não identificado — o bot descobre o número quando for reiniciado
                    </span>}
              </p>
            </div>

            <div className="form-group">
              <label><FaWhatsapp /> Código do WhatsApp (usado para enviar os alertas)</label>
              <p style={{ fontSize: '13px', color: '#64748b', fontFamily: 'monospace' }}>{inscrito.whatsappId}</p>
              <span style={{ fontSize: '12px', color: '#94a3b8' }}>
                Telefone e WhatsApp não podem ser alterados. Se a pessoa trocou de número, ela deve se inscrever de novo pelo bot.
              </span>
            </div>

            <label className="checkbox-card">
              <input type="checkbox" checked={ativo} onChange={e => setAtivo(e.target.checked)} />
              <div className="checkbox-content">
                <span>Recebendo alertas (inscrição ativa)</span>
              </div>
            </label>

            <h3 className="secao-titulo">Onde mora</h3>
            <SeletorLocalidade
              cidadeId={residencia.cidadeId}
              bairroId={residencia.bairroId}
              bairroObrigatorio
              onChange={setResidencia}
            />
          </div>

          {/* ── COLUNA DIREITA: bairros acompanhados e relatos ── */}
          <div className="form-column-right">
            <h3 className="secao-titulo">Bairros acompanhados</h3>
            <p style={{ fontSize: '13px', color: '#64748b', marginBottom: '10px' }}>
              Além do bairro onde mora, a pessoa recebe os alertas destes bairros.
            </p>

            {interesses.length === 0 ? (
              <p style={{ fontSize: '14px', color: '#94a3b8', marginBottom: '12px' }}>Nenhum bairro extra.</p>
            ) : (
              <div className="chips" style={{ marginBottom: '16px' }}>
                {interesses.map(b => (
                  <span className="chip" key={b.id_bairro}>
                    {b.nome} ({b.cidade}/{b.estado})
                    <button
                      type="button"
                      title="Remover"
                      onClick={() => setInteresses(interesses.filter(i => i.id_bairro !== b.id_bairro))}
                    >×</button>
                  </span>
                ))}
              </div>
            )}

            {/* obrigatorio={false}: escolher um bairro para adicionar é opcional —
                sem isso o navegador bloqueava o "Salvar" ao editar só o nome */}
            <SeletorLocalidade
              cidadeId={novoInteresse.cidadeId}
              bairroId={novoInteresse.bairroId}
              bairroObrigatorio
              obrigatorio={false}
              onChange={setNovoInteresse}
            />
            <button
              type="button"
              className="botao-secundario"
              disabled={!novoInteresse.bairroId}
              onClick={handleAdicionarInteresse}
              style={{ marginBottom: '24px' }}
            >
              <FaPlus /> Adicionar bairro
            </button>

            <h3 className="secao-titulo">Últimos relatos</h3>
            {inscrito.relatos.length === 0 ? (
              <p style={{ fontSize: '14px', color: '#94a3b8' }}>Nenhum relato enviado.</p>
            ) : (
              inscrito.relatos.map(r => (
                <div className="relato-item" key={r.id_relato}>
                  <div className="linha-info">
                    <p className="linha-titulo" style={{ fontSize: '14px' }}>
                      <a href={`/alertas/${r.alertaId}`}>#{r.alertaId} · {r.tipoLabel}</a>
                    </p>
                    <p className="linha-subtitulo">
                      <span>{r.local}</span>
                      <span><FaClock /> {formatarTempo(r.createdAt)}</span>
                    </p>
                  </div>
                  <span className={`badge ${r.statusAlerta}`}>{STATUS_ALERTA[r.statusAlerta]}</span>
                </div>
              ))
            )}

            {mensagem && <p className="mensagem-sucesso" style={{ margin: '16px 0 0' }}>{mensagem}</p>}
            {erro && <p className="mensagem-erro" style={{ margin: '16px 0 0' }}>{erro}</p>}

            <div className="form-actions" style={{ marginTop: '24px' }}>
              <button type="submit" className="btn-action salvar" disabled={salvando}>
                {salvando ? 'Salvando...' : 'Salvar alterações'}
              </button>
              <button type="button" className="btn-action cancelar" onClick={handleDescartar}>
                Descartar alterações
              </button>
              <button type="button" className="btn-action excluir" onClick={handleExcluir}>
                Excluir inscrito
              </button>
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

export default DetalhesInscrito;
