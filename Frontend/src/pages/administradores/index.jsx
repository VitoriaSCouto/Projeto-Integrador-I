// --------- Imports -----------
import { useState, useEffect } from 'react';
import { FaUserShield, FaUserPlus } from 'react-icons/fa';
import SidebarAdm from '../../components/SidebarAdm';
import { apiAdmin, formatarDataHora } from '../../services/api';
import { LIMITES, EXEMPLOS, somenteNome } from '../../utils/campos';
import { Obrigatorio, Opcional, AvisoObrigatorios } from '../../components/MarcasCampo';
import '../pg_adm/style.css';
import '../alertas/alertas.css';

// Tela "Administradores": um admin logado cadastra outros admins.
// (O cadastro de admin pela API só é aberto enquanto não existe nenhum — ver auth.js)
const formularioVazio = { nome: '', email: '', senha: '', cargo: '' }

function Administradores() {

  // ─── ESTADOS ────────────────────────────────────────────────
  const [admins, setAdmins] = useState([])
  const [carregando, setCarregando] = useState(true)
  const [erro, setErro] = useState('')

  const [formulario, setFormulario] = useState(formularioVazio)
  const [salvando, setSalvando] = useState(false)
  const [mensagem, setMensagem] = useState(null) // { tipo: 'sucesso' | 'erro', texto }

  // ─── BUSCA DA API ────────────────────────────────────────────
  const carregar = () =>
    apiAdmin('/auth/listar')
      .then(dados => setAdmins(dados.admins))
      .catch(e => setErro(e.message))
      .finally(() => setCarregando(false))

  useEffect(() => { carregar() }, [])

  // ─── HANDLERS ────────────────────────────────────────────────
  // O nome não aceita números (mesmo padrão dos outros cadastros de pessoa)
  const alterarCampo = (e) => {
    const { name, value } = e.target
    setFormulario({ ...formulario, [name]: name === 'nome' ? somenteNome(value) : value })
  }

  const cadastrar = async (e) => {
    e.preventDefault()
    setMensagem(null)
    setSalvando(true)
    try {
      const dados = await apiAdmin('/auth/cadastrar', { metodo: 'POST', corpo: formulario })
      setMensagem({ tipo: 'sucesso', texto: `${dados.mensagem} ${dados.nome} já pode entrar com o e-mail ${dados.email}.` })
      setFormulario(formularioVazio)
      carregar()
    } catch (err) {
      setMensagem({ tipo: 'erro', texto: err.message })
    } finally {
      setSalvando(false)
    }
  }

  // ─── TELA ────────────────────────────────────────────────────
  return (
    <div className="dashboard">
      <SidebarAdm ativo="administradores" />

      <main className="main">

        <header className="top">
          <div>
            <p className="modulo-breadcrumb">Home &gt; <span>Administradores</span></p>
            <h1 className="modulo-titulo">Administradores</h1>
            <p className="subtitle">Cadastre as pessoas que podem acessar o painel. Todos os administradores têm as mesmas permissões.</p>
          </div>
        </header>

        <div className="panel" style={{ marginBottom: '20px' }}>
          <h3 className="secao-titulo"><FaUserPlus /> Novo administrador</h3>
          <AvisoObrigatorios />

          <form className="formulario-linha" onSubmit={cadastrar}>
            <label htmlFor="adm-nome">
              <span>Nome<Obrigatorio /></span>
              <input id="adm-nome" name="nome" value={formulario.nome} onChange={alterarCampo}
                maxLength={LIMITES.nomePessoa} minLength={2} required />
            </label>
            <label htmlFor="adm-email">
              <span>E-mail<Obrigatorio /></span>
              <input id="adm-email" name="email" type="email" value={formulario.email} onChange={alterarCampo}
                placeholder={EXEMPLOS.email} maxLength={LIMITES.email} required />
            </label>
            <label htmlFor="adm-senha">
              <span>Senha<Obrigatorio /></span>
              <input id="adm-senha" name="senha" type="password" value={formulario.senha} onChange={alterarCampo}
                placeholder={`${LIMITES.senhaMin} a ${LIMITES.senhaMax} caracteres`}
                minLength={LIMITES.senhaMin} maxLength={LIMITES.senhaMax} required autoComplete="new-password" />
            </label>
            <label htmlFor="adm-cargo">
              <span>Cargo<Opcional /></span>
              <input id="adm-cargo" name="cargo" placeholder="Ex: Defesa Civil" value={formulario.cargo} onChange={alterarCampo}
                maxLength={LIMITES.cargo} />
            </label>
            <button type="submit" className="botao-primario" disabled={salvando}>
              {salvando ? 'Salvando...' : 'Cadastrar'}
            </button>
          </form>

          {mensagem && (
            <p className={mensagem.tipo === 'erro' ? 'mensagem-erro' : 'mensagem-sucesso'} role="alert">
              {mensagem.texto}
            </p>
          )}
        </div>

        <div className="panel">
          <h3 className="secao-titulo"><FaUserShield /> Administradores cadastrados</h3>

          {erro && <p className="mensagem-erro" style={{ marginBottom: '12px' }}>{erro}</p>}

          {carregando ? (
            <p style={{ color: '#64748b' }}>Carregando administradores...</p>
          ) : (
            <table className="tabela">
              <thead>
                <tr><th>Nome</th><th>E-mail</th><th>Cargo</th><th>Cadastrado em</th></tr>
              </thead>
              <tbody>
                {admins.map(a => (
                  <tr key={a.id}>
                    <td>{a.nome}</td>
                    <td>{a.email}</td>
                    <td>{a.cargo}</td>
                    <td>{formatarDataHora(a.createdAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
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

export default Administradores;
