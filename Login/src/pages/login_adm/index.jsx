import React, { useState } from "react";
import { FaUser, FaLock } from "react-icons/fa";
import { useNavigate } from 'react-router-dom';

const LoginAdm = () => {
    const navigate = useNavigate();

    const [email, setEmail] = useState("");
    const [senha, setSenha] = useState("");

    // Rodando quando o admin clica em Entrar
    const fazerLogin = (e) => {
        e.preventDefault(); // impede a página de recarregar
        


        // Pulando o fetch e simulando que deu certo
        console.log("Login simulado com sucesso!");


        navigate('/pg_adm');
    };

    return (
        <div className="containerLogin">
            <div className="img-logo">
                <img src="src/assets/logo.png" width= "160"/>
            </div>
            <form onSubmit={fazerLogin}>
                <h1>Login</h1>
                <div className="box">
                    <FaUser className= "icon" />
                    <input type="email" placeholder="E-mail" value={email} onChange={(e) => setEmail(e.target.value)} required/>
                </div>
                <div className="box">
                    <FaLock className= "icon" />
                    <input type="password" placeholder="Senha" value={senha} onChange={(e) => setSenha(e.target.value)} required/>
                </div>

                <div className="button-cad">
                    <button>Entrar</button>
                </div>

            </form>
        </div>
    );
    };

    export default LoginAdm;