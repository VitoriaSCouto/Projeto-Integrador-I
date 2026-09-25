// TELA DESCONTINUADA — era só um teste de layout, sem lógica de login.
// Não tem rota: "/login" redireciona para a tela inicial (ver App.jsx).
import { FaUser, FaLock } from "react-icons/fa";
import logo from "../../../assets/logo.png";

const Login = () => {
  return (
    <div className="containerLogin">
        <div className="img-logo">
            <img src={logo} width= "160" alt="Logo S.O.S Vale"/>
        </div>
        <form>
            <h1>Login</h1>
            <div className="box">
                <FaUser className= "icon" />
                <input type="email" placeholder="E-mail"/>
            </div>
            <div className="box">
                <FaLock className= "icon" />
                <input type="password" placeholder="Senha"/>
            </div>


            <div className="button-cad">
                    <button>Entrar</button>
                <div className="signup-link">
                    <a href="cadastro/index.jsx">Cadastre-se</a>
                </div>
            </div>

        </form>
    </div>
  );
};

export default Login;
