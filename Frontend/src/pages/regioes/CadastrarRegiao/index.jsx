import { useState } from "react";
import {
  FaHome, FaBoxOpen, FaUser, FaDonate,
  FaMap, FaMapMarkedAlt, FaExclamationTriangle,
  FaUsers, FaRulerCombined
} from 'react-icons/fa';
import { GoAlertFill } from "react-icons/go";
import { FaGear } from "react-icons/fa6";
import "../../pg_adm/style.css";
import "./CadastrarRegiao.css";

// ── Opções fixas de nível de risco ───────────────────────────────────────────
// Espelha o enum do banco de dados
const opcoesRisco = [
  { value: 'baixo',  label: 'Baixo'  },
  { value: 'medio',  label: 'Médio'  },
  { value: 'alto',   label: 'Alto'   },
  { value: 'critico',label: 'Crítico'},
]

// ── Estados brasileiros ───────────────────────────────────────────────────────
// Lista fixa para não depender do banco (região pode ser cadastrada antes de qualquer abrigo)
const estadosBR = [
  'SP'
]

const CadastrarRegiao = () => {

  // ── Estados do formulário ─────────────────────────────────────────────────
  const [mensagem, setMensagem]           = useState('')
  const [tipoMensagem, setTipoMensagem]   = useState('') // 'sucesso' | 'erro'
  const [enviando, setEnviando]           = useState(false)

  // Campos da tabela Regiao
  const [bairro, setBairro]               = useState('')
  const [cidade, setCidade]               = useState('')
  const [estado, setEstado]               = useState('')
  const [populacaoEstimada, setPopulacaoEstimada] = useState('')
  const [areaKm2, setAreaKm2]             = useState('')
  const [nivelRisco, setNivelRisco]       = useState('baixo')
  const [statusAlerta, setStatusAlerta]   = useState(false)

  // ── Validação simples ─────────────────────────────────────────────────────
  const [erros, setErros] = useState({})

  const validar = () => {
    const novosErros = {}
    if (!bairro.trim())  novosErros.bairro  = 'Informe o nome do bairro.'
    if (!cidade.trim())  novosErros.cidade  = 'Informe a cidade.'
    if (!estado)         novosErros.estado  = 'Selecione o estado.'
    if (populacaoEstimada !== '' && Number(populacaoEstimada) < 0)
      novosErros.populacaoEstimada = 'Valor não pode ser negativo.'
    if (areaKm2 !== '' && Number(areaKm2) < 0)
      novosErros.areaKm2 = 'Valor não pode ser negativo.'
    setErros(novosErros)
    return Object.keys(novosErros).length === 0
  }

  // ── Submit ────────────────────────────────────────────────────────────────
  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!validar()) return

    setEnviando(true)
    setMensagem('')

    try {
      const dados = {
        bairro:            bairro.trim(),
        cidade:            cidade.trim(),
        estado,
        // Envia null se o campo estiver vazio — o banco aceita null nesses campos
        populacaoEstimada: populacaoEstimada !== '' ? Number(populacaoEstimada) : null,
        areaKm2:           areaKm2 !== ''           ? Number(areaKm2)           : null,
        nivelRisco,
        statusAlerta,
      }

      const resposta = await fetch('http://localhost:3000/api/regioes/cadastrar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(dados)
      })

      const resultado = await resposta.json()

      if (resposta.status === 201) {
        // Sucesso — limpa o formulário
        setTipoMensagem('sucesso')
        setMensagem(resultado.mensagem)
        setBairro('')
        setCidade('')
        setEstado('')
        setPopulacaoEstimada('')
        setAreaKm2('')
        setNivelRisco('baixo')
        setStatusAlerta(false)
        setErros({})
      } else {
        // Erro do servidor (ex: região já cadastrada)
        setTipoMensagem('erro')
        setMensagem(resultado.mensagem)
      }
    } catch (erro) {
      console.error('Erro ao cadastrar região:', erro)
      setTipoMensagem('erro')
      setMensagem('Erro de conexão. Tente novamente.')
    } finally {
      setEnviando(false)
    }
  }

  return (
    <div className="dashboard">

      {/* Sidebar */}
      <aside className="sidebar">
        <ul>
          <a href="/pg_adm"><li><FaHome className="icon" /> Home</li></a>
          <a href="/abrigos"><li><FaBoxOpen className="icon" /> Abrigos</li></a>
          <a href="/vitimas"><li><FaUser className="icon" /> Vítimas</li></a>
          <li><FaDonate className="icon" /> Doações</li>
          <a href="/mapa"><li><FaMap className="icon" /> Mapa</li></a>
          <li className="active"><GoAlertFill className="icon" /> Ocorrências</li>
          <li><FaGear className="icon" /> Configurações</li>
        </ul>
      </aside>

      <main className="main">

        {/* Header */}
        <header className="top">
          <div>
            <p style={{ fontSize: '14px', color: '#64748b', margin: 0 }}>
              Regiões &gt; <span>Nova Região</span>
            </p>
            <h1 style={{ fontSize: '26px', fontWeight: '700', color: '#0f172a', marginTop: '4px' }}>
              Cadastro de Região
            </h1>
            <p className="subtitle">Cadastre uma nova região monitorada pelo sistema</p>
          </div>
          <div className="top-icons">
            <img src="/src/assets/logo.png" width="80px" alt="Logo" />
          </div>
        </header>

        {/* Formulário */}
        <form onSubmit={handleSubmit} className="cadastro-form-container">

          {/* ── Coluna esquerda: campos principais ── */}
          <div className="form-column-left">

            {/* Nome do Bairro */}
            <div className="form-group">
              <label><FaMapMarkedAlt /> Nome do Bairro</label>
              <input
                type="text"
                placeholder="Ex: Centro, Vila Nova, Jardim das Flores"
                value={bairro}
                onChange={(e) => setBairro(e.target.value)}
              />
              {erros.bairro && <p className="erro-campo">{erros.bairro}</p>}
            </div>

            {/* Cidade */}
            <div className="form-group">
              <label><FaMapMarkedAlt /> Cidade</label>
              <input
                type="text"
                placeholder="Ex: Taubaté, Caçapava, Pindamonhangaba"
                value={cidade}
                onChange={(e) => setCidade(e.target.value)}
              />
              {erros.cidade && <p className="erro-campo">{erros.cidade}</p>}
            </div>

            {/* Estado */}
            <div className="form-group">
              <label><FaMapMarkedAlt /> Estado</label>
              <select
                className="select-cidade"
                value={estado}
                onChange={(e) => setEstado(e.target.value)}
              >
                <option value="" disabled>Selecione o estado</option>
                {estadosBR.map((uf) => (
                  <option key={uf} value={uf}>{uf}</option>
                ))}
              </select>
              {erros.estado && <p className="erro-campo">{erros.estado}</p>}
            </div>

            {/* Separador visual */}
            <div style={{ borderTop: '1px solid #e2e8f0', margin: '8px 0 16px' }} />

            {/* População Estimada */}
            <div className="form-group">
              <label><FaUsers /> População Estimada</label>
              <input
                type="number"
                placeholder="Ex: 15000"
                min="0"
                value={populacaoEstimada}
                onChange={(e) => setPopulacaoEstimada(e.target.value)}
              />
              {erros.populacaoEstimada && <p className="erro-campo">{erros.populacaoEstimada}</p>}
              <span style={{ fontSize: '12px', color: '#94a3b8', marginTop: '4px', display: 'block' }}>
                Campo opcional
              </span>
            </div>

            {/* Área em km² */}
            <div className="form-group">
              <label><FaRulerCombined /> Área (km²)</label>
              <input
                type="number"
                placeholder="Ex: 12.5"
                min="0"
                step="0.01"
                value={areaKm2}
                onChange={(e) => setAreaKm2(e.target.value)}
              />
              {erros.areaKm2 && <p className="erro-campo">{erros.areaKm2}</p>}
              <span style={{ fontSize: '12px', color: '#94a3b8', marginTop: '4px', display: 'block' }}>
                Campo opcional
              </span>
            </div>

            {/* Nível de Risco */}
            <div className="form-group">
              <label><FaExclamationTriangle /> Nível de Risco</label>
              <select
                className={`select-risco ${nivelRisco}`}
                value={nivelRisco}
                onChange={(e) => setNivelRisco(e.target.value)}
              >
                {opcoesRisco.map((op) => (
                  <option key={op.value} value={op.value}>{op.label}</option>
                ))}
              </select>
            </div>

            {/* Status de Alerta — card toggle igual ao estilo dos checkboxes do CadastrarAbrigo */}
            <div className="infraestrutura-section">
              <h3 style={{ fontSize: '16px', fontWeight: '700', color: '#1e293b', marginBottom: '12px' }}>
                Alerta
              </h3>

              <label className="checkbox-card">
                <input
                  type="checkbox"
                  checked={statusAlerta}
                  onChange={(e) => setStatusAlerta(e.target.checked)}
                />
                <div className="checkbox-content">
                  <GoAlertFill className="icon" />
                  <span>Região em estado de alerta</span>
                </div>
              </label>

              <p style={{ fontSize: '12px', color: '#94a3b8', marginTop: '8px' }}>
                Ative se a região estiver com risco iminente ou em situação de emergência ativa.
              </p>
            </div>

          </div>

          {/* ── Coluna direita: resumo + botão ── */}
          <div className="form-column-right">

            <h3 style={{ fontSize: '16px', fontWeight: '700', color: '#1e293b', marginBottom: '12px' }}>
              Resumo
            </h3>

            {/*
              Card de pré-visualização — mostra os dados conforme o usuário preenche.
              Não é um preview real de mapa, apenas um resumo textual dos campos.
              Isso dá feedback visual imediato sem precisar de mapa ou API extra.
            */}
            <div className="resumo-card">

              {/* Localização */}
              <div className="resumo-linha">
                <span className="resumo-label"><FaMapMarkedAlt /> Localização</span>
                <span className="resumo-valor">
                  {bairro || cidade || estado
                    ? [bairro, cidade, estado].filter(Boolean).join(', ')
                    : <span className="resumo-vazio">Não informado</span>
                  }
                </span>
              </div>

              {/* População */}
              <div className="resumo-linha">
                <span className="resumo-label"><FaUsers /> População</span>
                <span className="resumo-valor">
                  {populacaoEstimada
                    ? Number(populacaoEstimada).toLocaleString('pt-BR') + ' hab.'
                    : <span className="resumo-vazio">Não informado</span>
                  }
                </span>
              </div>

              {/* Área */}
              <div className="resumo-linha">
                <span className="resumo-label"><FaRulerCombined /> Área</span>
                <span className="resumo-valor">
                  {areaKm2
                    ? Number(areaKm2).toLocaleString('pt-BR') + ' km²'
                    : <span className="resumo-vazio">Não informado</span>
                  }
                </span>
              </div>

              {/* Nível de risco */}
              <div className="resumo-linha">
                <span className="resumo-label"><FaExclamationTriangle /> Risco</span>
                <span className={`badge-risco ${nivelRisco}`}>
                  {opcoesRisco.find(o => o.value === nivelRisco)?.label}
                </span>
              </div>

              {/* Alerta */}
              <div className="resumo-linha">
                <span className="resumo-label"><GoAlertFill /> Alerta</span>
                <span className={`badge-alerta ${statusAlerta ? 'ativo' : 'inativo'}`}>
                  {statusAlerta ? 'Em alerta' : 'Normal'}
                </span>
              </div>

            </div>

            {/* Botão de envio */}
            <div className="form-actions">
              <button
                type="submit"
                className="btn-action salvar"
                disabled={enviando}
                style={enviando ? { opacity: 0.7, cursor: 'not-allowed' } : {}}
              >
                {enviando ? 'Cadastrando...' : 'Cadastrar Região'}
              </button>

              {/* Mensagem de retorno da API */}
              {mensagem && (
                <p style={{
                  color: tipoMensagem === 'sucesso' ? '#10b981' : '#ef4444',
                  fontSize: '14px',
                  textAlign: 'center',
                  marginTop: '8px'
                }}>
                  {mensagem}
                </p>
              )}
            </div>

          </div>
        </form>

        <footer style={{ marginTop: 'auto', paddingTop: '20px', display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: '#94a3b8' }}>
          <p>© 2026 S.O.S Vale. Todos os direitos reservados.</p>
          <p>Versão 1.0.0</p>
        </footer>

      </main>
    </div>
  );
};

export default CadastrarRegiao;
