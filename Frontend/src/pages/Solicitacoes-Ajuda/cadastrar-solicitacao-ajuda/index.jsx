// ─── Imports ──────────────────────────────────────────────────────────────────
import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  FaHome, FaBoxOpen, FaUser, FaDonate, FaMap, FaHandHoldingHeart
} from 'react-icons/fa';
import { FaGear } from 'react-icons/fa6';
import { GoAlertFill } from 'react-icons/go';
import '../../pg_adm/style.css';
import SidebarAdm from '../../../components/SidebarAdm';
import { fetchAdmin } from '../../../services/api';
import { LIMITES } from '../../../utils/campos';
import { Obrigatorio, AvisoObrigatorios, ContadorCaracteres } from '../../../components/MarcasCampo';

// ─── Sidebar reutilizável ─────────────────────────────────────────────────────
const Sidebar = () => (
  <SidebarAdm ativo="ajuda" />
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
      // Quem criou (criadoPorId) não vai mais daqui: a API pega o admin logado
      // pelo token (antes era "criadoPorId: 1" fixo)
      const body = {
        titulo:      titulo.trim(),
        descricao:   descricao.trim(),
        categoria,
        urgencia,
        abrigoId:    Number(id),
      }

      const resposta = await fetchAdmin('/solicitacoes-ajuda/cadastrar', {
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
                onClick={() => navigate(`/detalhes-abrigos/${id}`)}
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

            <AvisoObrigatorios />

            {/* Título */}
            <div style={groupStyle}>
              <label htmlFor="titulo-ajuda" style={labelStyle}>Título da solicitação<Obrigatorio /></label>
              <input
                id="titulo-ajuda"
                style={inputStyle}
                value={titulo}
                onChange={e => setTitulo(e.target.value)}
                placeholder="Ex: Precisamos de cobertores para 50 pessoas"
                maxLength={LIMITES.titulo}
                required
              />
              <ContadorCaracteres valor={titulo} limite={LIMITES.titulo} />
            </div>

            {/* Descrição */}
            <div style={groupStyle}>
              <label htmlFor="descricao-ajuda" style={labelStyle}>Descrição detalhada<Obrigatorio /></label>
              <textarea
                id="descricao-ajuda"
                style={{ ...inputStyle, resize: 'vertical', minHeight: '110px', fontFamily: 'inherit' }}
                value={descricao}
                onChange={e => setDescricao(e.target.value)}
                placeholder="Descreva o que é necessário, quantidade, prazo ou qualquer detalhe relevante..."
                maxLength={LIMITES.descricao}
                required
              />
              <ContadorCaracteres valor={descricao} limite={LIMITES.descricao} />
            </div>

            {/* Linha: categoria + urgência lado a lado */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>

              {/* Categoria */}
              <div style={groupStyle}>
                <label htmlFor="categoria-ajuda" style={labelStyle}>Categoria<Obrigatorio /></label>
                <select id="categoria-ajuda" required style={inputStyle} value={categoria} onChange={e => setCategoria(e.target.value)}>
                  <option value="doacao">Doação (roupas, alimentos, etc.)</option>
                  <option value="medicamento">Medicamento</option>
                  <option value="voluntariado">Voluntariado</option>
                  <option value="infraestrutura">Infraestrutura</option>
                  <option value="outro">Outro</option>
                </select>
              </div>

              {/* Urgência */}
              <div style={groupStyle}>
                <label htmlFor="urgencia-ajuda" style={labelStyle}>Urgência<Obrigatorio /></label>
                <select id="urgencia-ajuda" required style={inputStyle} value={urgencia} onChange={e => setUrgencia(e.target.value)}>
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