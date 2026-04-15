import { useState } from "react";
import { FaUser, FaLock } from "react-icons/fa";
import { initializeApp } from "firebase/app";
import { getAuth, signInWithEmailAndPassword } from "firebase/auth";
import "./Login.css";


const firebaseConfig = {
  apiKey: "AIzaSyBBj6aCgmBkQHewM0I5tMn4tPHlK_1q11Q",
  authDomain: "sos-vale.firebaseapp.com",
  projectId: "sos-vale",
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

const Login = () => {
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [erro, setErro] = useState("");
  const [carregando, setCarregando] = useState(false);

  const fazerLogin = async (e) => {
    e.preventDefault(); // impede a página de recarregar
    setErro("");
    setCarregando(true);

    try {
      // Firebase verifica email e senha
      const resultado = await signInWithEmailAndPassword(auth, email, senha);
      const token = await resultado.user.getIdToken();

      //Manda o token para o backend C# validar
      const resposta = await fetch("http://localhost:5168/api/auth/validar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token: token }),
      });

      if (resposta.ok) {
        localStorage.setItem("token", token);
            setErro(""); 
        // Mostra mensagem de sucesso
        document.getElementById("msg-sucesso").style.display = "block";
        // Aguarda 2 segundos antes de redirecionar
        setTimeout(() => {
        window.location.href = "/painel";
        }, 2000);
}

    } catch (e) {
      setErro("Email ou senha incorretos.");
    } finally {
      setCarregando(false);
    }
  };

  return (
    <div className="container">
      <div className="img-logo">
        <img src="src/assets/logo.png" width="160" />
      </div>
      <form onSubmit={fazerLogin}>
        <h1>Login</h1>

        <div className="box">
          <FaUser className="icon" />
          <input
            type="email"
            placeholder="E-mail"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>

        <div className="box">
          <FaLock className="icon" />
          <input
            type="password"
            placeholder="Senha"
            value={senha}
            onChange={(e) => setSenha(e.target.value)}
            required
          />
        </div>

        <div className="recall-forget">
          <label>
            <input type="checkbox" />
            Lembre de mim
          </label>
          <a href="#">Esqueceu a senha?</a>
        </div>

        {erro && <p style={{ color: "red", fontSize: "13px" }}>{erro}</p>}

        <div className="button-cad">
          <button type="submit" disabled={carregando}>
            {carregando ? "Entrando..." : "Entrar"}
          </button>
          <div className="signup-link">
            <a href="#">Cadastrar-se</a>
          </div>
        </div>

      </form>
    </div>
  );
};

export default Login;