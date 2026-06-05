import { FaUser, FaLock, FaPhone } from "react-icons/fa";

const Login = () => {
  return (
    <div className="containerLogin">
        <div className="img-logo">
            <img src="src/assets/logo.png" width= "160"/>
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
