// --------- Imports -----------
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaUsers, FaEnvelope, FaPhoneAlt, FaHome, FaEye } from 'react-icons/fa';
import { GoAlertFill } from 'react-icons/go';
import SidebarAdm from '../../../components/SidebarAdm';
import { LIMITES } from '../../../utils/campos';
import { apiAdmin, formatarTelefone } from '../../../services/api';
import '../../pg_adm/style.css';
import '../../alertas/alertas.css';

// Minúsculo e sem acento — para a busca achar "joao" em "João"
const normalizar = (texto) => String(texto ?? '')
  .normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase()

function ListarInscritos() {

  const navigate = useNavigate();

  // ─── ESTADOS ────────────────────────────────────────────────
  const [inscritos, setInscritos] = useState([])
  const [cidades, setCidades] = useState([])
  const [carregando, setCarregando] = useState(true)
  const [erro, setErro] = useState('')

  const [busca, setBusca] = useState('')
  const [filtroCidade, setFiltroCidade] = useState('')
  const [filtroAtivo, setFiltroAtivo] = useState('')

  // ─── BUSCA DA API ────────────────────────────────────────────
  useEffect(() => {
    apiAdmin('/inscritos/listar')
      .then(dados => setInscritos(dados.inscritos))
      .catch(e => setErro(e.message))
      .finally(() => setCarregando(false))

    apiAdmin('/cidades/listar').then(d => setCidades(d.cidades)).catch(console.error)
  }, [])

  // ─── DERIVAÇÕES ──────────────────────────────────────────────
  // O filtro de cidade considera onde a pessoa mora E os bairros que ela acompanha
  const inscritosFiltrados = inscritos.filter(i => {
    const termo = normalizar(busca.trim())
    const digitos = termo.replace(/\D/g, '')
    const bateBusca = !termo ||
      normalizar(i.nome).includes(termo) ||
      normalizar(i.email).includes(termo) ||
      (digitos !== '' && (i.telefone ?? '').includes(digitos))

    const bateCidade = !filtroCidade ||
      i.cidadeId === Number(filtroCidade) ||
      i.bairrosInteresse.some(b => b.cidadeId === Number(filtroCidade))

    const bateAtivo = !filtroAtivo || String(i.ativo) === filtroAtivo

    return bateBusca && bateCidade && bateAtivo
  })

  const totalAtivos = inscritos.filter(i => i.ativo).length

  // ─── TELA ────────────────────────────────────────────────────
  return (
    <div className="dashboard">
      <SidebarAdm ativo="inscritos" />

      <main className="main">

        <header className="top">
          <div>
            <p className="modulo-breadcrumb"><a href="/alertas">Alertas</a> &gt; <span>Inscritos</span></p>
            <h1 className="modulo-titulo">Inscritos nos alertas</h1>
            <p className="subtitle">
              Moradores que se inscreveram pelo WhatsApp. {totalAtivos} ativo{totalAtivos !== 1 ? 's' : ''} de {inscritos.length}.
            </p>
          </div>
          <div className="modulo-acoes-topo">
            <a className="botao-secundario" href="/alertas"><GoAlertFill /> Alertas</a>
          </div>
        </header>

        <div className="panel">

          <div className="barra-filtros">
            <input
              placeholder="Buscar por nome, e-mail ou telefone..."
              aria-label="Buscar"
              maxLength={LIMITES.busca}
              value={busca}
              onChange={e => setBusca(e.target.value)}
            />

            <select value={filtroCidade} onChange={e => setFiltroCidade(e.target.value)}>
              <option value="">Todas as cidades</option>
              {cidades.map(c => (
                <option key={c.id_cidade} value={c.id_cidade}>{c.nome}/{c.estado}</option>
              ))}
            </select>

            <select value={filtroAtivo} onChange={e => setFiltroAtivo(e.target.value)}>
              <option value="">Ativos e inativos</option>
              <option value="true">Só ativos</option>
              <option value="false">Só inativos</option>
            </select>

            <span className="contador-resultados">
              {inscritosFiltrados.length} resultado{inscritosFiltrados.length !== 1 ? 's' : ''}
            </span>
          </div>

          {erro && <p className="mensagem-erro" style={{ marginBottom: '12px' }}>{erro}</p>}

          {carregando ? (
            <p style={{ color: '#64748b' }}>Carregando inscritos...</p>
          ) : inscritosFiltrados.length === 0 ? (
            <div className="lista-vazia">
              <FaUsers />
              <p>Nenhum inscrito encontrado.</p>
              <p style={{ fontSize: '13px' }}>As inscrições são feitas pelo WhatsApp (opção 1 do menu do bot).</p>
            </div>
          ) : (
            inscritosFiltrados.map(i => (
              <div className="linha-lista" key={i.id_inscrito}>
                <div className="linha-icone">{i.nome.charAt(0).toUpperCase()}</div>

                <div className="linha-info">
                  <p className="linha-titulo">{i.nome}</p>
                  <p className="linha-subtitulo">
                    <span><FaEnvelope /> {i.email}</span>
                    {i.telefone && !(i.whatsappId.endsWith('@lid') && i.telefone === i.whatsappId.split('@')[0]) && <span><FaPhoneAlt /> {formatarTelefone(i.telefone)}</span>}
                    <span><FaHome /> {i.bairro} — {i.cidade}/{i.estado}</span>
                    {i.bairrosInteresse.length > 0 && (
                      <span><FaEye /> +{i.bairrosInteresse.length} bairro{i.bairrosInteresse.length !== 1 ? 's' : ''}</span>
                    )}
                  </p>
                </div>

                <span style={{ fontSize: '12px', color: '#64748b', flexShrink: 0 }}>
                  {i.totalRelatos} relato{i.totalRelatos !== 1 ? 's' : ''}<br />
                  desde {new Date(i.createdAt).toLocaleDateString('pt-BR')}
                </span>

                <span className={`badge ${i.ativo ? 'inscrito-ativo' : 'inscrito-inativo'}`}>
                  {i.ativo ? 'Ativo' : 'Inativo'}
                </span>

                <button
                  onClick={() => navigate(`/inscritos/${i.id_inscrito}`)}
                  className="btn-action cancelar"
                  style={{ width: 'auto', padding: '8px 16px', fontSize: '13px', flexShrink: 0 }}
                >
                  Ver / editar
                </button>
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

export default ListarInscritos;
