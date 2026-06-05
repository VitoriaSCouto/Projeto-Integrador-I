import React, { useState } from "react";
import { FaEnvelope, FaLock, FaEye } from "react-icons/fa";
import { useNavigate } from 'react-router-dom';
import { FiLogOut } from 'react-icons/fi'; // Ícone de login/entrar parecido com o da imagem


const LoginAdm = () => {
    const navigate = useNavigate();

    const [email, setEmail] = useState("");
    const [senha, setSenha] = useState("");

    // Rodando quando o admin clica em Entrar (LÓGICA INTACTA)
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
        <div className="container-page">
            <div className="card-cadastro">
                <div className="header-card">
                    <div className="icon-user-header">
                        <img src="src/assets/logo.png" width= "120"/> 
                    </div>
                    <h1>Login</h1>
                    <p className="subtitle">Acesse sua conta para continuar</p>
                </div>

                <form onSubmit={fazerLogin}>
                    <div className="input-group">
                        <label>E-mail</label>
                        <div className="box1">
                            <FaEnvelope className="icon" />
                            <input 
                                type="email" 
                                placeholder="seu@email.com" 
                                value={email} 
                                onChange={(e) => setEmail(e.target.value)} 
                                required
                            />
                        </div>
                    </div>
                    <div className="input-group">
                        <label>Senha</label>
                        <div className="box1">
                            <FaLock className="icon" />
                            <input 
                                type="password" 
                                placeholder="Sua senha" 
                                value={senha} 
                                onChange={(e) => setSenha(e.target.value)} 
                                required
                            />
                        </div>
                    </div>
                    <div className="button-cad1">
                        <button type="submit">Entrar</button>
                    </div>
                </form>
            </div>
        </div>
    );
}

export default LoginAdm;