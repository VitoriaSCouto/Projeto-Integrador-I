
import { FaUser, FaEnvelope, FaIdBadge, FaPhone} from "react-icons/fa";

const Cadastro = () => {
  return (
    <div className="container-page">
      <div className="card-cadastro">
        
        {/* Ícone azul superior e títulos do Card */}
        <div className="header-card">
          <div className="icon-user-header">
            {/* Ícone de adicionar usuário combinando com a imagem */}
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" width="48" height="48">
              <path strokeLinecap="round" strokeLinejoin="round" d="M18 7.5v3m0 0v3m0-3h3m-3 0h-3m-2.25-4.125a3.375 3.375 0 1 1-6.75 0 3.375 3.375 0 0 1 6.75 0ZM3 19.235v-.11a6.375 6.375 0 0 1 12.75 0v.109A12.318 12.318 0 0 1 9.374 21c-2.331 0-4.512-.645-6.374-1.766Z" />
            </svg>
          </div>
          <h1>Cadastrar</h1>
          <p className="subtitle">Crie sua conta para começar</p>
        </div>

        <form>
          {/* Campo: Nome Completo */}
          <div className="input-group">
            <label>Nome completo</label>
            <div className="box">
              <FaUser className="icon" />
              <input type="text" placeholder="Seu nome completo" />
            </div>
          </div>

          {/* Campo: E-mail */}
          <div className="input-group">
            <label>E-mail</label>
            <div className="box">
              <FaEnvelope className="icon" />
              <input type="email" placeholder="seu@email.com" />
            </div>
          </div>

          {/* Campo: Senha */}
          <div className="input-group">
            <label>Senha</label>
            <div className="box">
              <FaLock className="icon" />
              <input type="password" placeholder="Crie uma senha" />
              <FaEye className="icon-eye" />
            </div>
            <small className="hint-text">
              A senha deve ter pelo menos 8 caracteres, com letras e números.
            </small>
          </div>

          {/* Campo: Tipo de Acesso */}
          <div className="input-group">
            <label>Tipo de acesso</label>
            <div className="box">
              <FaUsers className="icon" />
              <select defaultValue="">
                <option value="" disabled hidden>Selecione uma opção</option>
                <option value="usuario">Usuário Comum</option>
                <option value="admin">Administrador</option>
              </select>
            </div>
          </div>

          {/* Checkbox de Termos e Políticas */}
          <div className="checkbox-group">
            <input type="checkbox" id="termos" />
            <label htmlFor="termos">
              Li e concordo com os <a href="/termos">Termos de Uso</a> e <a href="/politica">Política de Privacidade</a>.
            </label>
          </div>

          {/* Botão de Enviar */}
          <div className="button-cad">
            <button type="submit">Cadastrar</button>
          </div>

          {/* Link para Login fora do botão */}
          <div className="signup-link">
            <span>Já tem uma conta? <a href="/login">Entrar</a></span>
          </div>
        </form>
        
      </div>
    </div>
  );
};

export default Cadastro;
