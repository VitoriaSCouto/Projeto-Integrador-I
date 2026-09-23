// ─── Imports ──────────────────────────────────────────────────────────────────
import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  FaHome, FaBoxOpen, FaUser, FaDonate, FaMap, FaHandHoldingHeart
} from 'react-icons/fa';
import { FaGear } from 'react-icons/fa6';
import { GoAlertFill } from 'react-icons/go';
import '../../pg_adm/style.css';

// ─── Sidebar reutilizável ─────────────────────────────────────────────────────
const Sidebar = () => (
  <aside className="sidebar">
    <div className="top-icons">
      <img src="../../src/assets/logo.png" width="70px" />
      <p>S.O.S. Vale</p>
    </div>
    <ul>
      <a href="/pg_adm"><li><FaHome className="icon" /> Home</li></a>
      <a href="/abrigos"><li className="active"><FaBoxOpen className="icon" /> Abrigos</li></a>
      <a href="/vitimas"><li><FaUser className="icon" /> Vítimas</li></a>
      <li><FaDonate className="icon" /> Doações</li>
      <a href="/mapa"><li><FaMap className="icon" /> Mapa</li></a>
      <a href="/alertas"><li><GoAlertFill className="icon" /> Alertas</li></a>
      <li><FaGear className="icon" /> Configurações</li>
    </ul>
  </aside>
)

// ─── Estilos inline reutilizáveis ─────────────────────────────────────────────
const inputStyle = {
  width: '100%',
  padding: '10px 12px',
  borderRadius: '8px',
  border: '1px solid #e2e8f0',
  fontSize: '14px',
  color: '#0f172a',
  background: '#fff',
  outline: 'none',
}

const labelStyle = {
  fontSize: '13px',
  fontWeight: '600',
  color: '#475569',
  marginBottom: '6px',
  display: 'block'
}

const groupStyle = {
  display: 'flex',
  flexDirection: 'column',
  marginBottom: '18px'
}

// ─── Componente principal ─────────────────────────────────────────────────────
function CadastrarSolicitacaoAjuda() {

  const { id } = useParams()   // id do abrigo vindo da URL
  const navigate = useNavigate()

  // ─── Campos do formulário ────────────────────────────────────────────────────
  const [titulo, setTitulo]       = useState('')
  const [descricao, setDescricao] = useState('')
  const [categoria, setCategoria] = useState('doacao')
  const [urgencia, setUrgencia]   = useState('media')

  // ─── Controle de envio ───────────────────────────────────────────────────────
  const [enviando, setEnviando]   = useState(false)
  const [erro, setErro]           = useState(null)

  // ─── Submit ──────────────────────────────────────────────────────────────────
  const handleSalvar = async (e) => {
    e.preventDefault()
    setErro(null)

    // Validação básica
    if (!titulo.trim()) { setErro('O título é obrigatório.'); return }
    if (!descricao.trim()) { setErro('A descrição é obrigatória.'); return }

    setEnviando(true)
    try {
      // O criadoPorId deve vir do contexto de autenticação da sua aplicação.
      // Aqui está como placeholder — substitua pelo id real do admin logado.
      // Ex: const { admin } = useAuth()  →  criadoPorId: admin.id
      const body = {
        titulo:      titulo.trim(),
        descricao:   descricao.trim(),
        categoria,
        urgencia,
        abrigoId:    Number(id),
        criadoPorId: 1, // ← substituir pelo id do admin logado
      }

      const resposta = await fetch('http://localhost:3000/api/solicitacoes-ajuda/cadastrar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })

      if (!resposta.ok) {
        const dados = await resposta.json()
        throw new Error(dados.mensagem ?? 'Erro ao criar solicitação.')
      }

      // Volta para a lista do abrigo após criar
      navigate(`/abrigos/${id}/solicitacoes-ajuda`)

    } catch (err) {
      console.error('Erro ao cadastrar solicitação:', err)
      setErro(err.message)
    } finally {
      setEnviando(false)
    }
  }

  // ─── Render ──────────────────────────────────────────────────────────────────
  return (
    <div className="dashboard">
      <Sidebar />

      <main className="main">

        {/* Header */}
        <header className="top">
          <div>
            <p style={{ fontSize: '14px', color: '#64748b', margin: 0 }}>
              Abrigos &gt;{' '}
              <span
                style={{ cursor: 'pointer', textDecoration: 'underline' }}
                onClick={() => navigate(`/abrigos/${id}`)}
              >
                Detalhes do Abrigo
              </span>
              {' '}&gt; Nova Solicitação de Ajuda
            </p>
            <h1 style={{ fontSize: '26px', fontWeight: '700', color: '#0f172a', marginTop: '4px' }}>
              Nova Solicitação de Ajuda
            </h1>
            <p className="subtitle">Crie um pedido de ajuda vinculado a este abrigo</p>
          </div>
        </header>

        {/* Formulário */}
        <form onSubmit={handleSalvar} style={{ maxWidth: '680px' }}>
          <div className="panel" style={{ background: '#fff', borderRadius: '12px', padding: '28px', boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>

            {/* Título */}
            <div style={groupStyle}>
              <label style={labelStyle}>Título da solicitação *</label>
              <input
                style={inputStyle}
                value={titulo}
                onChange={e => setTitulo(e.target.value)}
                placeholder="Ex: Precisamos de cobertores para 50 pessoas"
                maxLength={120}
              />
              <span style={{ fontSize: '11px', color: '#94a3b8', marginTop: '4px', textAlign: 'right' }}>
                {titulo.length}/120
              </span>
            </div>

            {/* Descrição */}
            <div style={groupStyle}>
              <label style={labelStyle}>Descrição detalhada *</label>
              <textarea
                style={{ ...inputStyle, resize: 'vertical', minHeight: '110px', fontFamily: 'inherit' }}
                value={descricao}
                onChange={e => setDescricao(e.target.value)}
                placeholder="Descreva o que é necessário, quantidade, prazo ou qualquer detalhe relevante..."
              />
            </div>

            {/* Linha: categoria + urgência lado a lado */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>

              {/* Categoria */}
              <div style={groupStyle}>
                <label style={labelStyle}>Categoria</label>
                <select style={inputStyle} value={categoria} onChange={e => setCategoria(e.target.value)}>
                  <option value="doacao">Doação (roupas, alimentos, etc.)</option>
                  <option value="medicamento">Medicamento</option>
                  <option value="voluntariado">Voluntariado</option>
                  <option value="infraestrutura">Infraestrutura</option>
                  <option value="outro">Outro</option>
                </select>
              </div>

              {/* Urgência */}
              <div style={groupStyle}>
                <label style={labelStyle}>Urgência</label>
                <select style={inputStyle} value={urgencia} onChange={e => setUrgencia(e.target.value)}>
                  <option value="baixa">Baixa</option>
                  <option value="media">Média</option>
                  <option value="alta">Alta</option>
                  <option value="critica">Crítica</option>
                </select>
              </div>

            </div>

            {/* Erro */}
            {erro && (
              <p style={{ color: '#ef4444', fontSize: '13px', marginBottom: '12px' }}>
                {erro}
              </p>
            )}

            {/* Botões */}
            <div style={{ display: 'flex', gap: '12px', marginTop: '8px' }}>
              <button
                type="submit"
                disabled={enviando}
                style={{
                  padding: '10px 24px',
                  borderRadius: '8px',
                  border: 'none',
                  background: enviando ? '#94a3b8' : '#0f172a',
                  color: '#fff',
                  fontWeight: '700',
                  fontSize: '14px',
                  cursor: enviando ? 'not-allowed' : 'pointer'
                }}
              >
                {enviando ? 'Enviando...' : 'Criar Solicitação'}
              </button>

              <button
                type="button"
                onClick={() => navigate(`/abrigos/${id}/solicitacoes-ajuda`)}
                style={{
                  padding: '10px 24px',
                  borderRadius: '8px',
                  border: '1px solid #e2e8f0',
                  background: '#f8fafc',
                  color: '#334155',
                  fontWeight: '600',
                  fontSize: '14px',
                  cursor: 'pointer'
                }}
              >
                Cancelar
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

export default CadastrarSolicitacaoAjuda