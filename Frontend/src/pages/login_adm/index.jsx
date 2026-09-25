import React, { useState } from "react";
import { FaEnvelope, FaLock } from "react-icons/fa";
import { useNavigate } from 'react-router-dom';
import { API_URL } from '../../services/api';
import { LIMITES, EXEMPLOS } from '../../utils/campos';
// Importada (e não "src/assets/logo.png"): o caminho de texto quebrava no build
import logo from '../../assets/logo.png';


const LoginAdm = () => {
    const navigate = useNavigate();

    const [email, setEmail] = useState("");
    const [senha, setSenha] = useState("");
    const [erro, setErro] = useState("");

    // Rodando quando o admin clica em Entrar
    const fazerLogin = async (e) => {
        e.preventDefault(); // impede a página de recarregar
        setErro(""); // limpa erro anterior antes de tentar

        try {
            const response = await fetch(`${API_URL}/api/auth/login`, {
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
            } else {
                // Antes nada aparecia com e-mail ou senha errados
                setErro(data.mensagem || "Erro ao fazer login.");
            }
        } catch (error) {
            console.error("Erro ao conectar com a API:", error);
            setErro("Erro ao conectar com o servidor. Tente novamente.");
        }
    }

    return (
        <div className="container-page">
            <div className="card-cadastro">
                <div className="header-card">
                    <div className="icon-user-header">
                        <img src={logo} width= "120" alt="Logo S.O.S Vale"/>
                    </div>
                    <h1>Login</h1>
                    <p className="subtitle">Acesse sua conta para continuar</p>
                </div>

                <form onSubmit={fazerLogin}>
                    <div className="input-group">
                        <label htmlFor="email-adm">E-mail</label>
                        <div className="box1">
                            <FaEnvelope className="icon" />
                            <input
                                id="email-adm"
                                type="email"
                                placeholder={EXEMPLOS.email}
                                maxLength={LIMITES.email}
                                autoComplete="username"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                            />
                        </div>
                    </div>
                    <div className="input-group">
                        <label htmlFor="senha-adm">Senha</label>
                        <div className="box1">
                            <FaLock className="icon" />
                            <input
                                id="senha-adm"
                                type="password"
                                placeholder="Sua senha"
                                maxLength={LIMITES.senhaMax}
                                autoComplete="current-password"
                                value={senha}
                                onChange={(e) => setSenha(e.target.value)}
                                required
                            />
                        </div>
                    </div>

                    {/* Exibe mensagem de erro se o login falhar */}
                    {erro && <p className="mensagem-erro" role="alert">{erro}</p>}

                    <div className="button-cad1">
                        <button type="submit">Entrar</button>
                    </div>
                </form>
            </div>
        </div>
    );
}

export default LoginAdm;
