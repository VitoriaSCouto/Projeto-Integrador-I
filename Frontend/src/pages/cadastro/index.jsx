
import { FaUser, FaEnvelope, FaIdBadge, FaPhone} from "react-icons/fa";

const Cadastro = () => {
  return (
    <div className="container">
        <div className="img-logo">
            <img src="src/assets/logo.png" width= "160"/>
        </div>
        <form>
            <h1>Cadastro</h1>
            <div className="box">
                <FaEnvelope className= "icon" />
                <input type="email" placeholder="E-mail"/>
            </div>
            <div className="box">
                <FaUser className= "icon" />
                <input type="text" placeholder="Nome"/>
            </div>
            <div className="box">
                <FaIdBadge className= "icon" />
                <input type="password" placeholder="CPF"/>
            </div>
            <div className="box">
                <FaPhone className= "icon" />
                <input type="number" placeholder="Telefone"/>
            </div>

            <div className="button-cad">
                    <button>Enviar</button>
                <div className="signup-link">
                    <a href="/login">Já possui uma conta? Faça LOGIN.</a>
                </div>
            </div>

        </form>
    </div>
  );
};

export default Cadastro;
