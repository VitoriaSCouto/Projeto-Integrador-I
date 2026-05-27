import React, { useState } from "react";
import { FaUser, FaLock } from "react-icons/fa";
import { useNavigate } from 'react-router-dom';

const LoginAdm = () => {
    const navigate = useNavigate();

    const [email, setEmail] = useState("");
    const [senha, setSenha] = useState("");

    // Rodando quando o admin clica em Entrar
    const fazerLogin = async (e) => {
    e.preventDefault(); // impede a página de recarregar

    try {
        const response = await fetch("http://localhost:3000/api/auth/login", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({ email, senha }),
        });

        const data = await response.json();

            if (response.ok) {
                console.log("Login realizado com sucesso!");
                
                // Salva o token JWT retornado pelo Fastify no localStorage
                localStorage.setItem("token_adm", data.token); 

                // Redireciona para a página do administrador
                navigate('/pg_adm');
            }
        } catch (error) {
            console.error("Erro ao conectar com a API:", error);
            
        }
    }
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
}
    

    export default LoginAdm;