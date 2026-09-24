import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  FaHome, FaBoxOpen, FaUser, FaDonate, FaMap,
  FaSearch, FaLink, FaUnlink, FaArrowLeft, FaExternalLinkAlt
} from 'react-icons/fa';
import { GoAlertFill } from 'react-icons/go';
import { FaGear } from 'react-icons/fa6';
import "../../pg_adm/style.css";
import SidebarAdm from '../../../components/SidebarAdm';

// ── Utilitários ────────────────────────────────────────────────────────────
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
// ──────────────────────────────────────────────────────────────────────────

function VitimasDoAbrigo() {
  const { id } = useParams()
  const navigate = useNavigate()

  // ── Estado central ────────────────────────────────────────────────────
  const [nomeAbrigo, setNomeAbrigo] = useState('')
  const [capacidade, setCapacidade] = useState({ total: 0, ocupada: 0 })
  const [vitimasDoAbrigo, setVitimasDoAbrigo] = useState([])
  const [todasVitimas, setTodasVitimas] = useState([])
  const [carregando, setCarregando] = useState(true)

  const [painelVincular, setPainelVincular] = useState(false)
  const [busca, setBusca] = useState('')
  const [vinculando, setVinculando] = useState(null)
  // ──────────────────────────────────────────────────────────────────────

  // ── Carga inicial ─────────────────────────────────────────────────────
  const carregarDados = async () => {
    try {
      const resAbrigo = await fetch(`http://localhost:3000/api/abrigos/listar/${id}`)
      const dadosAbrigo = await resAbrigo.json()
      setNomeAbrigo(dadosAbrigo.nome ?? `Abrigo #${id}`)
      setCapacidade({
        total:   dadosAbrigo.capacidadeTotal   ?? 0,
        ocupada: dadosAbrigo.capacidadeOcupada ?? 0,
      })

      // Vítimas já vinculadas — vêm do GET do abrigo com dataNascimento e dataEntrada
      setVitimasDoAbrigo(dadosAbrigo.vitimas ?? [])

      // Todas as vítimas sem abrigo — para o painel de vincular
      const resTodas = await fetch('http://localhost:3000/api/vitimas/listar')
      const dadosTodas = await resTodas.json()
      setTodasVitimas((dadosTodas.vitimas ?? []).filter(v => !v.abrigoId))

    } catch (erro) {
      console.error('Erro ao carregar dados:', erro)
    } finally {
      setCarregando(false)
    }
  }

  useEffect(() => { carregarDados() }, [id])
  // ──────────────────────────────────────────────────────────────────────

  // ── Vincular ──────────────────────────────────────────────────────────
  const vincularVitima = async (vitima) => {
    setVinculando(vitima.id)
    try {
      const res = await fetch(`http://localhost:3000/api/vitimas/listar/${vitima.id}`)
      const dados = await res.json()

      const resposta = await fetch(`http://localhost:3000/api/vitimas/atualizar/${vitima.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nome:           dados.nome,
          cpf:            dados.cpf,
          telefone:       dados.telefone,
          dataNascimento: dados.dataNascimento,
          genero:         dados.genero,
          fotoVitima:     dados.fotoVitima,
          abrigoId:       Number(id),
        })
      })

      const resultado = await resposta.json()

      if (!resposta.ok) {
        alert(resultado.mensagem ?? 'Erro ao vincular.')
        return
      }

      await carregarDados()
      setBusca('')
    } catch (erro) {
      console.error('Erro ao vincular vítima:', erro)
      alert('Erro ao vincular. Tente novamente.')
    } finally {
      setVinculando(null)
    }
  }
  // ──────────────────────────────────────────────────────────────────────

  // ── Desvincular ───────────────────────────────────────────────────────
  const desvincularVitima = async (vitima) => {
    if (!confirm(`Desvincular "${vitima.nome}" deste abrigo?`)) return
    setVinculando(vitima.id_vitima)
    try {
      const res = await fetch(`http://localhost:3000/api/vitimas/listar/${vitima.id_vitima}`)
      const dados = await res.json()

      await fetch(`http://localhost:3000/api/vitimas/atualizar/${vitima.id_vitima}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nome:           dados.nome,
          cpf:            dados.cpf,
          telefone:       dados.telefone,
          dataNascimento: dados.dataNascimento,
          genero:         dados.genero,
          fotoVitima:     dados.fotoVitima,
          abrigoId:       null,
        })
      })

      await carregarDados()
    } catch (erro) {
      console.error('Erro ao desvincular vítima:', erro)
      alert('Erro ao desvincular. Tente novamente.')
    } finally {
      setVinculando(null)
    }
  }
  // ──────────────────────────────────────────────────────────────────────

  const vitmasFiltradas = todasVitimas.filter(v =>
    v.nome.toLowerCase().includes(busca.toLowerCase()) ||
    (v.cpf ?? '').includes(busca)
  )

  // ── Barra de capacidade ───────────────────────────────────────────────
  const pct = capacidade.total > 0
    ? Math.min(100, Math.round((capacidade.ocupada / capacidade.total) * 100))
    : 0
  const corBarra = pct >= 100 ? '#ef4444' : pct >= 80 ? '#f97316' : '#16a34a'
  // ──────────────────────────────────────────────────────────────────────

  const Sidebar = () => (
    <SidebarAdm ativo="abrigos" />
  )

  if (carregando) {
    return (
      <div className="dashboard">
        <Sidebar />
        <main className="main">
          <p style={{ padding: '40px', color: '#64748b' }}>Carregando vítimas do abrigo...</p>
        </main>
      </div>
    )
  }

  return (
    <div className="dashboard">
      <Sidebar />

      <main className="main">

        {/* ── Cabeçalho ──────────────────────────────────────────────────── */}
        <header className="top">
          <div>
            {/* Botão de voltar */}
            <button
              onClick={() => navigate(`/detalhes-abrigos/${id}`)}
              style={{
                display: 'inline-flex', alignItems: 'center', gap: '6px',
                background: 'none', border: 'none', cursor: 'pointer',
                color: '#64748b', fontSize: '14px', padding: 0, marginBottom: '6px'
              }}
            >
              <FaArrowLeft style={{ fontSize: '11px' }} />
              Voltar para {nomeAbrigo}
            </button>

            <h1 style={{ fontSize: '26px', fontWeight: '700', color: '#0f172a', margin: 0 }}>
              Vítimas do Abrigo
            </h1>
            <p className="subtitle">
              {vitimasDoAbrigo.length} vítima{vitimasDoAbrigo.length !== 1 ? 's' : ''} vinculada{vitimasDoAbrigo.length !== 1 ? 's' : ''}
            </p>
          </div>

          <button
            onClick={() => { setPainelVincular(true); setBusca('') }}
            disabled={pct >= 100}
            title={pct >= 100 ? 'Abrigo lotado' : 'Vincular vítima'}
            style={{
              display: 'flex', alignItems: 'center', gap: '8px',
              padding: '10px 18px', borderRadius: '8px', border: 'none',
              background: pct >= 100 ? '#94a3b8' : '#16a34a',
              color: '#fff', fontWeight: '600', fontSize: '14px',
              cursor: pct >= 100 ? 'not-allowed' : 'pointer'
            }}
          >
            <FaLink /> Vincular Vítima
          </button>
        </header>
        {/* ─────────────────────────────────────────────────────────────── */}

        {/* ── Card de capacidade ─────────────────────────────────────────── */}
        <div style={{
          background: '#fff', borderRadius: '12px', border: '1px solid #e2e8f0',
          padding: '16px 20px', marginBottom: '16px',
          display: 'flex', alignItems: 'center', gap: '20px'
        }}>
          <div style={{ flex: 1 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
              <span style={{ fontSize: '13px', fontWeight: '600', color: '#475569' }}>
                Capacidade do abrigo
              </span>
              <span style={{ fontSize: '13px', fontWeight: '700', color: corBarra }}>
                {capacidade.ocupada} / {capacidade.total}
                {pct >= 100 && ' — Lotado'}
              </span>
            </div>
            <div style={{ height: '8px', background: '#e2e8f0', borderRadius: '99px', overflow: 'hidden' }}>
              <div style={{ height: '100%', width: `${pct}%`, background: corBarra, borderRadius: '99px', transition: 'width 0.3s' }} />
            </div>
          </div>
        </div>
        {/* ─────────────────────────────────────────────────────────────── */}

        {/* ── Tabela de vítimas vinculadas ──────────────────────────────── */}
        <div style={{
          background: '#fff', borderRadius: '12px',
          border: '1px solid #e2e8f0', overflow: 'hidden'
        }}>
          {vitimasDoAbrigo.length > 0 ? (
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '14px' }}>
              <thead>
                <tr style={{ background: '#f8fafc', borderBottom: '2px solid #e2e8f0' }}>
                  <th style={{ textAlign: 'left',   padding: '12px 16px', color: '#64748b', fontWeight: '600' }}>Nome</th>
                  <th style={{ textAlign: 'center', padding: '12px 16px', color: '#64748b', fontWeight: '600' }}>Idade</th>
                  <th style={{ textAlign: 'center', padding: '12px 16px', color: '#64748b', fontWeight: '600' }}>Gênero</th>
                  <th style={{ textAlign: 'center', padding: '12px 16px', color: '#64748b', fontWeight: '600' }}>Data de Entrada</th>
                  <th style={{ textAlign: 'center', padding: '12px 16px', color: '#64748b', fontWeight: '600' }}>Ações</th>
                </tr>
              </thead>
              <tbody>
                {vitimasDoAbrigo.map((vitima) => (
                  <tr
                    key={vitima.id_vitima}
                    style={{ borderBottom: '1px solid #f1f5f9', transition: 'background 0.15s' }}
                    onMouseEnter={e => e.currentTarget.style.background = '#f8fafc'}
                    onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                  >
                    {/* Nome — clicável para abrir os detalhes da vítima */}
                    <td style={{ padding: '12px 16px' }}>
                      <button
                        onClick={() => navigate(`/detalhes-vitimas/${vitima.id_vitima}`)}
                        style={{
                          background: 'none', border: 'none', cursor: 'pointer',
                          color: '#0f172a', fontWeight: '600', fontSize: '14px',
                          padding: 0, textAlign: 'left',
                          display: 'inline-flex', alignItems: 'center', gap: '6px'
                        }}
                      >
                        {vitima.nome}
                        <FaExternalLinkAlt style={{ fontSize: '10px', color: '#94a3b8' }} />
                      </button>
                    </td>

                    <td style={{ padding: '12px 16px', color: '#475569', textAlign: 'center' }}>
                      {calcularIdade(vitima.dataNascimento)}
                    </td>

                    <td style={{ padding: '12px 16px', color: '#475569', textAlign: 'center' }}>
                      {vitima.genero}
                    </td>

                    <td style={{ padding: '12px 16px', color: '#475569', textAlign: 'center' }}>
                      {formatarData(vitima.dataEntrada)}
                    </td>

                    {/* Botão desvincular */}
                    <td style={{ padding: '12px 16px', textAlign: 'center' }}>
                      <button
                        onClick={() => desvincularVitima(vitima)}
                        disabled={vinculando === vitima.id_vitima}
                        title="Desvincular deste abrigo"
                        style={{
                          display: 'inline-flex', alignItems: 'center', gap: '5px',
                          padding: '5px 12px', borderRadius: '6px',
                          border: '1px solid #fca5a5', background: '#fff5f5',
                          color: '#dc2626', fontSize: '12px', fontWeight: '500',
                          cursor: vinculando === vitima.id_vitima ? 'not-allowed' : 'pointer',
                          opacity: vinculando === vitima.id_vitima ? 0.6 : 1,
                        }}
                      >
                        <FaUnlink style={{ fontSize: '10px' }} />
                        {vinculando === vitima.id_vitima ? 'Aguarde...' : 'Desvincular'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <div style={{ padding: '48px 24px', textAlign: 'center' }}>
              <FaUser style={{ fontSize: '32px', color: '#cbd5e1', marginBottom: '12px' }} />
              <p style={{ fontSize: '15px', color: '#64748b', fontWeight: '500', margin: '0 0 4px' }}>
                Nenhuma vítima vinculada
              </p>
              <p style={{ fontSize: '13px', color: '#94a3b8', margin: 0 }}>
                Clique em "Vincular Vítima" para adicionar alguém a este abrigo.
              </p>
            </div>
          )}
        </div>
        {/* ─────────────────────────────────────────────────────────────── */}

        {/* ── Painel lateral: Vincular vítima ───────────────────────────── */}
        {painelVincular && (
          <>
            <div
              onClick={() => setPainelVincular(false)}
              style={{
                position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.35)',
                zIndex: 40, cursor: 'pointer'
              }}
            />

            <div style={{
              position: 'fixed', top: 0, right: 0, bottom: 0,
              width: '420px', background: '#fff', zIndex: 50,
              display: 'flex', flexDirection: 'column',
              boxShadow: '-4px 0 24px rgba(0,0,0,0.12)'
            }}>

              {/* Cabeçalho do painel */}
              <div style={{
                padding: '20px 24px', borderBottom: '1px solid #e2e8f0',
                display: 'flex', justifyContent: 'space-between', alignItems: 'center'
              }}>
                <div>
                  <h2 style={{ fontSize: '18px', fontWeight: '700', color: '#0f172a', margin: 0 }}>
                    Vincular Vítima
                  </h2>
                  <p style={{ fontSize: '13px', color: '#64748b', margin: '4px 0 0' }}>
                    {todasVitimas.length} vítima{todasVitimas.length !== 1 ? 's' : ''} sem abrigo
                  </p>
                </div>
                <button
                  onClick={() => setPainelVincular(false)}
                  style={{
                    background: 'none', border: 'none', fontSize: '20px',
                    color: '#64748b', cursor: 'pointer', padding: '4px'
                  }}
                >
                  ✕
                </button>
              </div>

              {/* Campo de busca */}
              <div style={{ padding: '16px 24px', borderBottom: '1px solid #f1f5f9' }}>
                <div style={{ position: 'relative' }}>
                  <FaSearch style={{
                    position: 'absolute', left: '12px', top: '50%',
                    transform: 'translateY(-50%)', color: '#94a3b8', fontSize: '13px'
                  }} />
                  <input
                    autoFocus
                    type="text"
                    placeholder="Buscar por nome ou CPF..."
                    value={busca}
                    onChange={(e) => setBusca(e.target.value)}
                    style={{
                      width: '100%', padding: '9px 12px 9px 34px',
                      borderRadius: '8px', border: '1px solid #e2e8f0',
                      fontSize: '14px', color: '#0f172a', outline: 'none',
                      boxSizing: 'border-box'
                    }}
                  />
                </div>
              </div>

              {/* Lista de vítimas disponíveis */}
              <div style={{ flex: 1, overflowY: 'auto', padding: '8px 0' }}>
                {vitmasFiltradas.length === 0 ? (
                  <div style={{ padding: '40px 24px', textAlign: 'center' }}>
                    <p style={{ fontSize: '14px', color: '#64748b' }}>
                      {busca
                        ? 'Nenhuma vítima encontrada com esse nome ou CPF.'
                        : 'Todas as vítimas já estão vinculadas a um abrigo.'
                      }
                    </p>
                  </div>
                ) : (
                  vitmasFiltradas.map((vitima) => (
                    <div
                      key={vitima.id}
                      style={{
                        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                        padding: '12px 24px', borderBottom: '1px solid #f8fafc',
                        transition: 'background 0.15s',
                      }}
                      onMouseEnter={e => e.currentTarget.style.background = '#f8fafc'}
                      onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                    >
                      <div>
                        <p style={{ margin: 0, fontWeight: '600', color: '#0f172a', fontSize: '14px' }}>
                          {vitima.nome}
                        </p>
                        <p style={{ margin: '2px 0 0', fontSize: '12px', color: '#64748b' }}>
                          {calcularIdade(vitima.dataNascimento)} anos
                          {vitima.cpf ? ` · CPF: ${vitima.cpf}` : ''}
                        </p>
                      </div>

                      <button
                        onClick={() => vincularVitima(vitima)}
                        disabled={vinculando === vitima.id}
                        style={{
                          display: 'flex', alignItems: 'center', gap: '5px',
                          padding: '6px 14px', borderRadius: '6px', border: 'none',
                          background: vinculando === vitima.id ? '#d1fae5' : '#16a34a',
                          color: '#fff', fontSize: '13px', fontWeight: '500',
                          cursor: vinculando === vitima.id ? 'not-allowed' : 'pointer',
                          flexShrink: 0
                        }}
                      >
                        <FaLink style={{ fontSize: '10px' }} />
                        {vinculando === vitima.id ? 'Vinculando...' : 'Vincular'}
                      </button>
                    </div>
                  ))
                )}
              </div>

            </div>
          </>
        )}
        {/* ─────────────────────────────────────────────────────────────── */}

        <footer style={{ marginTop: 'auto', paddingTop: '20px', display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: '#94a3b8' }}>
          <p>© 2026 S.O.S Vale. Todos os direitos reservados.</p>
          <p>Versão 1.0.0</p>
        </footer>
      </main>
    </div>
  )
}

export default VitimasDoAbrigo;