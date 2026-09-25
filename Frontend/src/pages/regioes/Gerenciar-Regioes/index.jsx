// --------- Imports -----------
import { useState, useEffect, useCallback } from 'react';
import {
  FaPlus, FaTrash, FaEdit, FaSave, FaTimes, FaWhatsapp, FaSearch, FaMapMarkedAlt, FaCheckCircle
} from 'react-icons/fa';
import { GoAlertFill } from 'react-icons/go';
import SidebarAdm from '../../../components/SidebarAdm';
import { apiAdmin } from '../../../services/api';
import { LIMITES, EXEMPLOS, somenteNumeros, somenteDecimal, mascaraCep } from '../../../utils/campos';
import { Obrigatorio, Opcional } from '../../../components/MarcasCampo';
import { NIVEIS_RISCO } from '../../alertas/constantes';
import '../../pg_adm/style.css';
import '../../alertas/alertas.css';

const bairroVazio = { nome: '', nivelRisco: 'baixo', populacaoEstimada: '', areaKm2: '' }

function GerenciarRegioes() {

  // ─── ESTADOS ────────────────────────────────────────────────
  const [estados, setEstados] = useState([])
  const [cidades, setCidades] = useState([])
  const [cidadeSelecionadaId, setCidadeSelecionadaId] = useState(null)
  const [bairros, setBairros] = useState([])

  const [filtroEstado, setFiltroEstado] = useState('')
  const [erro, setErro] = useState('')
  const [mensagem, setMensagem] = useState('')

  // Formulário de nova cidade
  const [novaCidade, setNovaCidade] = useState({ nome: '', estadoId: '' })

  // Edição da cidade selecionada
  const [nomeCidade, setNomeCidade] = useState('')
  const [grupoCidade, setGrupoCidade] = useState('')
  const [linkGrupoCidade, setLinkGrupoCidade] = useState('')

  // Formulário de novo bairro + busca por CEP
  const [novoBairro, setNovoBairro] = useState(bairroVazio)
  const [cep, setCep] = useState('')
  const [resultadoCep, setResultadoCep] = useState(null)

  // Edição de um bairro na tabela
  const [editandoBairroId, setEditandoBairroId] = useState(null)
  const [bairroEditado, setBairroEditado] = useState(bairroVazio)

  const cidadeSelecionada = cidades.find(c => c.id_cidade === cidadeSelecionadaId) ?? null

  // Mostra a mensagem da API (sucesso ou erro)
  const avisar = (texto, ehErro = false) => {
    setErro(ehErro ? texto : '')
    setMensagem(ehErro ? '' : texto)
  }

  // ─── BUSCA DOS DADOS ────────────────────────────────────────
  const buscarCidades = useCallback(async () => {
    const dados = await apiAdmin('/cidades/listar')
    setCidades(dados.cidades)
    return dados.cidades
  }, [])

  const buscarBairros = useCallback(async (cidadeId) => {
    const dados = await apiAdmin(`/bairros/listar?cidadeId=${cidadeId}`)
    setBairros(dados.bairros)
  }, [])

  useEffect(() => {
    apiAdmin('/estados/listar').then(d => setEstados(d.estados)).catch(e => avisar(e.message, true))
    buscarCidades()
      .then(lista => { if (lista.length > 0) selecionarCidade(lista[0]) })
      .catch(e => avisar(e.message, true))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [buscarCidades])

  const selecionarCidade = (cidade) => {
    setCidadeSelecionadaId(cidade.id_cidade)
    setNomeCidade(cidade.nome)
    setGrupoCidade(cidade.grupoWhatsappId ?? '')
    setLinkGrupoCidade(cidade.grupoWhatsappLink ?? '')
    setEditandoBairroId(null)
    setNovoBairro(bairroVazio)
    setResultadoCep(null)
    setBairros([])
    buscarBairros(cidade.id_cidade).catch(e => avisar(e.message, true))
  }

  // ─── CIDADES ────────────────────────────────────────────────
  const handleCadastrarCidade = async (e) => {
    e.preventDefault()
    try {
      const dados = await apiAdmin('/cidades/cadastrar', { metodo: 'POST', corpo: novaCidade })
      avisar(dados.mensagem)
      setNovaCidade({ nome: '', estadoId: novaCidade.estadoId })
      await buscarCidades()
      selecionarCidade(dados.cidade)
    } catch (e) {
      avisar(e.message, true)
    }
  }

  const handleSalvarCidade = async () => {
    try {
      const dados = await apiAdmin(`/cidades/atualizar/${cidadeSelecionadaId}`, {
        metodo: 'PUT',
        corpo: {
          nome: nomeCidade,
          grupoWhatsappId: grupoCidade.trim() || null,
          grupoWhatsappLink: linkGrupoCidade.trim() || null,
        }
      })
      avisar(dados.mensagem)
      // O link volta normalizado pela API (ex: sem espaços, com https://)
      setLinkGrupoCidade(dados.cidade.grupoWhatsappLink ?? '')
      await buscarCidades()
    } catch (e) {
      avisar(e.message, true)
    }
  }

  const handleExcluirCidade = async () => {
    if (!confirm(`Excluir a cidade ${cidadeSelecionada.nome}?`)) return
    try {
      const dados = await apiAdmin(`/cidades/excluir/${cidadeSelecionadaId}`, { metodo: 'DELETE' })
      avisar(dados.mensagem)
      const lista = await buscarCidades()
      setCidadeSelecionadaId(null)
      if (lista.length > 0) selecionarCidade(lista[0])
    } catch (e) {
      avisar(e.message, true)
    }
  }

  // ─── BAIRROS ────────────────────────────────────────────────
  // Consulta o CEP e preenche o nome do bairro
  const handleBuscarCep = async () => {
    setResultadoCep(null)
    try {
      const dados = await apiAdmin(`/bairros/cep/${cep.replace(/\D/g, '')}`)
      setResultadoCep(dados)

      if (dados.cidadeId !== cidadeSelecionadaId) {
        avisar(`Este CEP é de ${dados.cidade}/${dados.uf}, não de ${cidadeSelecionada.nome}.`, true)
      } else if (dados.bairroId) {
        avisar(`O bairro ${dados.bairro} já está cadastrado.`, true)
      } else if (!dados.bairro) {
        avisar('Este CEP não informa o bairro.', true)
      } else {
        setNovoBairro({ ...novoBairro, nome: dados.bairro })
        avisar(`Bairro encontrado: ${dados.bairro}. Confira os dados e clique em Adicionar.`)
      }
    } catch (e) {
      avisar(e.message, true)
    }
  }

  const handleCadastrarBairro = async (e) => {
    e.preventDefault()
    try {
      const dados = await apiAdmin('/bairros/cadastrar', {
        metodo: 'POST',
        corpo: { ...novoBairro, cidadeId: cidadeSelecionadaId }
      })
      avisar(dados.mensagem)
      setNovoBairro(bairroVazio)
      setCep('')
      setResultadoCep(null)
      await Promise.all([buscarBairros(cidadeSelecionadaId), buscarCidades()])
    } catch (e) {
      avisar(e.message, true)
    }
  }

  const iniciarEdicaoBairro = (bairro) => {
    setEditandoBairroId(bairro.id_bairro)
    setBairroEditado({
      nome: bairro.nome,
      nivelRisco: bairro.nivelRisco,
      populacaoEstimada: bairro.populacaoEstimada ?? '',
      areaKm2: bairro.areaKm2 ?? '',
    })
  }

  const handleSalvarBairro = async () => {
    try {
      const dados = await apiAdmin(`/bairros/atualizar/${editandoBairroId}`, { metodo: 'PUT', corpo: bairroEditado })
      avisar(dados.mensagem)
      setEditandoBairroId(null)
      await buscarBairros(cidadeSelecionadaId)
    } catch (e) {
      avisar(e.message, true)
    }
  }

  const handleExcluirBairro = async (bairro) => {
    if (!confirm(`Excluir o bairro ${bairro.nome}?`)) return
    try {
      const dados = await apiAdmin(`/bairros/excluir/${bairro.id_bairro}`, { metodo: 'DELETE' })
      avisar(dados.mensagem)
      await Promise.all([buscarBairros(cidadeSelecionadaId), buscarCidades()])
    } catch (e) {
      avisar(e.message, true)
    }
  }

  // ─── DERIVAÇÕES ──────────────────────────────────────────────
  const cidadesFiltradas = filtroEstado
    ? cidades.filter(c => c.estadoId === Number(filtroEstado))
    : cidades

  const estadosComCidades = estados.filter(e => cidades.some(c => c.estadoId === e.id_estado))

  // ─── TELA ────────────────────────────────────────────────────
  return (
    <div className="dashboard">
      <SidebarAdm ativo="regioes" />

      <main className="main">
        <header className="top">
          <div>
            <p className="modulo-breadcrumb"><a href="/pg_adm">Home</a> &gt; <span>Regiões</span></p>
            <h1 className="modulo-titulo">Regiões</h1>
            <p className="subtitle">Cidades, bairros, nível de risco e o grupo de WhatsApp que recebe os alertas de cada cidade</p>
          </div>
          <div className="modulo-acoes-topo">
            <a className="botao-secundario" href="/alertas"><GoAlertFill /> Alertas</a>
            <a className="botao-secundario" href="/mapa"><FaMapMarkedAlt /> Mapa</a>
          </div>
        </header>

        {mensagem && <p className="mensagem-sucesso">{mensagem}</p>}
        {erro && <p className="mensagem-erro">{erro}</p>}

        <section className="regioes-grade">

          {/* ── CIDADES ── */}
          <div className="panel">
            <h3 className="secao-titulo">Cidades</h3>

            <div className="barra-filtros">
              <select value={filtroEstado} onChange={e => setFiltroEstado(e.target.value)} style={{ width: '100%' }}>
                <option value="">Todos os estados</option>
                {estadosComCidades.map(e => (
                  <option key={e.id_estado} value={e.id_estado}>{e.nome}</option>
                ))}
              </select>
            </div>

            {cidadesFiltradas.length === 0 && (
              <p style={{ fontSize: '14px', color: '#94a3b8', marginBottom: '16px' }}>Nenhuma cidade cadastrada.</p>
            )}

            {cidadesFiltradas.map(c => (
              <button
                key={c.id_cidade}
                className={`cidade-item ${c.id_cidade === cidadeSelecionadaId ? 'selecionada' : ''}`}
                onClick={() => selecionarCidade(c)}
              >
                <span>
                  {c.nome}/{c.estado}<br />
                  <small>{c.totalBairros} bairro{c.totalBairros !== 1 ? 's' : ''} · {c.totalAbrigos} abrigo{c.totalAbrigos !== 1 ? 's' : ''}</small>
                </span>
                {c.grupoWhatsappId && <FaWhatsapp title="Grupo de alertas vinculado" style={{ color: '#16a34a' }} />}
              </button>
            ))}

            <h3 className="secao-titulo">Nova cidade</h3>
            <form onSubmit={handleCadastrarCidade} className="painel-decisao">
              <select
                className="select-cidade"
                aria-label="Estado da nova cidade"
                value={novaCidade.estadoId}
                onChange={e => setNovaCidade({ ...novaCidade, estadoId: e.target.value })}
                required
              >
                <option value="" disabled>Estado</option>
                {estados.map(e => <option key={e.id_estado} value={e.id_estado}>{e.nome} ({e.sigla})</option>)}
              </select>
              <input
                className="select-cidade"
                aria-label="Nome da nova cidade"
                placeholder="Nome da cidade *"
                maxLength={LIMITES.nomeLocal}
                minLength={2}
                value={novaCidade.nome}
                onChange={e => setNovaCidade({ ...novaCidade, nome: e.target.value })}
                required
              />
              <button type="submit" className="botao-primario"><FaPlus /> Cadastrar cidade</button>
            </form>
          </div>

          {/* ── CIDADE SELECIONADA: dados, grupo e bairros ── */}
          <div className="panel">
            {!cidadeSelecionada ? (
              <p style={{ color: '#94a3b8' }}>Cadastre ou selecione uma cidade.</p>
            ) : (
              <>
                <h3 className="secao-titulo">{cidadeSelecionada.nome}/{cidadeSelecionada.estado}</h3>

                <div className="formulario-linha" style={{ gridTemplateColumns: '1fr 2fr auto auto' }}>
                  <label>
                    <span>Nome<Obrigatorio /></span>
                    <input value={nomeCidade} maxLength={LIMITES.nomeLocal} required onChange={e => setNomeCidade(e.target.value)} />
                  </label>
                  <label>
                    <span><FaWhatsapp /> Grupo de alertas (ID do grupo)<Opcional /></span>
                    <input
                      maxLength={LIMITES.grupoId}
                      value={grupoCidade}
                      onChange={e => setGrupoCidade(e.target.value)}
                      placeholder="Ex: 120363012345678901@g.us"
                    />
                  </label>
                  <button type="button" className="botao-primario" onClick={handleSalvarCidade}><FaSave /> Salvar</button>
                  <button type="button" className="botao-icone perigo" title="Excluir cidade" onClick={handleExcluirCidade}><FaTrash /></button>
                </div>

                {/* Link de convite: o bot envia para quem quiser entrar no grupo (menu Alertas) */}
                <div className="formulario-linha" style={{ gridTemplateColumns: '1fr' }}>
                  <label>
                    <span><FaWhatsapp /> Link de convite do grupo (enviado pelo bot a quem quiser entrar)<Opcional /></span>
                    <input
                      type="url"
                      maxLength={LIMITES.link}
                      value={linkGrupoCidade}
                      onChange={e => setLinkGrupoCidade(e.target.value)}
                      placeholder="Ex: https://chat.whatsapp.com/AbCdEf123456"
                    />
                  </label>
                </div>

                <p className="aviso">
                  {cidadeSelecionada.grupoWhatsappId
                    ? <><FaCheckCircle /> Os alertas confirmados desta cidade também são publicados no grupo vinculado.</>
                    : <>Para vincular um grupo: adicione o número do bot ao grupo e, como administrador do grupo, envie
                      <strong> !alertas vincular {cidadeSelecionada.nome}</strong>. Ou envie <strong>!alertas id</strong> e cole o ID aqui.</>}
                </p>

                <h3 className="secao-titulo">Bairros ({bairros.length})</h3>

                {/* Busca por CEP para preencher o nome do bairro */}
                <div className="barra-filtros">
                  <input
                    aria-label="CEP para preencher o bairro"
                    placeholder={`Preencher pelo CEP (${EXEMPLOS.cep.toLowerCase()})`}
                    inputMode="numeric"
                    maxLength={LIMITES.cep}
                    value={cep}
                    onChange={e => setCep(mascaraCep(e.target.value))}
                    style={{ maxWidth: '260px' }}
                  />
                  <button type="button" className="botao-secundario" onClick={handleBuscarCep} disabled={cep.replace(/\D/g, '').length !== 8}>
                    <FaSearch /> Buscar CEP
                  </button>
                  {resultadoCep && (
                    <span style={{ fontSize: '13px', color: '#64748b' }}>
                      {resultadoCep.logradouro ? `${resultadoCep.logradouro}, ` : ''}{resultadoCep.bairro ?? 'sem bairro'} — {resultadoCep.cidade}/{resultadoCep.uf}
                    </span>
                  )}
                </div>

                <form className="formulario-linha" onSubmit={handleCadastrarBairro}>
                  <label>
                    <span>Novo bairro<Obrigatorio /></span>
                    <input value={novoBairro.nome} onChange={e => setNovoBairro({ ...novoBairro, nome: e.target.value })} placeholder="Nome do bairro"
                      maxLength={LIMITES.nomeLocal} minLength={2} required />
                  </label>
                  <label>
                    <span>Risco<Obrigatorio /></span>
                    <select value={novoBairro.nivelRisco} onChange={e => setNovoBairro({ ...novoBairro, nivelRisco: e.target.value })}>
                      {NIVEIS_RISCO.map(n => <option key={n.valor} value={n.valor}>{n.label}</option>)}
                    </select>
                  </label>
                  <label>
                    <span>População<Opcional /></span>
                    {/* Só números (o type="number" aceitava "e", "+" e "-") */}
                    <input inputMode="numeric" maxLength={LIMITES.populacaoDigitos} value={novoBairro.populacaoEstimada} placeholder="Ex: 5000"
                      onChange={e => setNovoBairro({ ...novoBairro, populacaoEstimada: somenteNumeros(e.target.value, LIMITES.populacaoDigitos) })} />
                  </label>
                  <label>
                    <span>Área (km²)<Opcional /></span>
                    {/* Número com até 2 casas decimais; aceita vírgula */}
                    <input inputMode="decimal" value={novoBairro.areaKm2} placeholder="Ex: 2,5"
                      onChange={e => setNovoBairro({ ...novoBairro, areaKm2: somenteDecimal(e.target.value) })} />
                  </label>
                  <button type="submit" className="botao-primario"><FaPlus /> Adicionar</button>
                </form>

                <div style={{ overflowX: 'auto' }}>
                  <table className="tabela">
                    <thead>
                      <tr>
                        <th>Bairro</th>
                        <th>Risco</th>
                        <th>População</th>
                        <th>Área</th>
                        <th title="Moradores inscritos + pessoas que acompanham">Inscritos</th>
                        <th>Abrigos</th>
                        <th>Alertas abertos</th>
                        <th></th>
                      </tr>
                    </thead>
                    <tbody>
                      {bairros.length === 0 && (
                        <tr><td colSpan={8} style={{ color: '#94a3b8' }}>Nenhum bairro cadastrado nesta cidade.</td></tr>
                      )}
                      {bairros.map(b => editandoBairroId === b.id_bairro ? (
                        <tr key={b.id_bairro}>
                          <td><input aria-label="Nome do bairro" value={bairroEditado.nome} maxLength={LIMITES.nomeLocal} required onChange={e => setBairroEditado({ ...bairroEditado, nome: e.target.value })} /></td>
                          <td>
                            <select value={bairroEditado.nivelRisco} onChange={e => setBairroEditado({ ...bairroEditado, nivelRisco: e.target.value })}>
                              {NIVEIS_RISCO.map(n => <option key={n.valor} value={n.valor}>{n.label}</option>)}
                            </select>
                          </td>
                          <td><input aria-label="População" inputMode="numeric" maxLength={LIMITES.populacaoDigitos} value={bairroEditado.populacaoEstimada} onChange={e => setBairroEditado({ ...bairroEditado, populacaoEstimada: somenteNumeros(e.target.value, LIMITES.populacaoDigitos) })} /></td>
                          <td><input aria-label="Área em km²" inputMode="decimal" value={bairroEditado.areaKm2} onChange={e => setBairroEditado({ ...bairroEditado, areaKm2: somenteDecimal(e.target.value) })} /></td>
                          <td>{b.totalMoradores + b.totalInteressados}</td>
                          <td>{b.totalAbrigos}</td>
                          <td>{b.alertasAbertos}</td>
                          <td>
                            <div className="tabela-acoes">
                              <button type="button" className="botao-icone" title="Salvar" onClick={handleSalvarBairro}><FaSave /></button>
                              <button type="button" className="botao-icone" title="Cancelar" onClick={() => setEditandoBairroId(null)}><FaTimes /></button>
                            </div>
                          </td>
                        </tr>
                      ) : (
                        <tr key={b.id_bairro}>
                          <td>{b.nome}</td>
                          <td><span className={`badge ${b.nivelRisco}`}>{NIVEIS_RISCO.find(n => n.valor === b.nivelRisco)?.label}</span></td>
                          <td>{b.populacaoEstimada != null ? Number(b.populacaoEstimada).toLocaleString('pt-BR') : '—'}</td>
                          <td>{b.areaKm2 != null ? `${Number(b.areaKm2).toLocaleString('pt-BR')} km²` : '—'}</td>
                          <td>{b.totalMoradores + b.totalInteressados}</td>
                          <td>{b.totalAbrigos}</td>
                          <td>
                            {b.alertasAbertos > 0
                              ? <a href="/alertas" className="badge ativo">{b.alertasAbertos}</a>
                              : 0}
                          </td>
                          <td>
                            <div className="tabela-acoes">
                              <button type="button" className="botao-icone" title="Editar" onClick={() => iniciarEdicaoBairro(b)}><FaEdit /></button>
                              <button type="button" className="botao-icone perigo" title="Excluir" onClick={() => handleExcluirBairro(b)}><FaTrash /></button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </>
            )}
          </div>
        </section>

        <footer style={{ marginTop: 'auto', paddingTop: '20px', display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: '#94a3b8' }}>
          <p>© 2026 S.O.S Vale. Todos os direitos reservados.</p>
          <p>Versão 1.0.0</p>
        </footer>
      </main>
    </div>
  )
}

export default GerenciarRegioes;
