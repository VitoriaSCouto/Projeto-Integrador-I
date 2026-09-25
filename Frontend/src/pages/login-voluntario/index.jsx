import React, { useState } from "react";
import { FaEnvelope, FaLock } from "react-icons/fa";
import { useNavigate, Link } from 'react-router-dom';
import { API_URL } from '../../services/api';
import { LIMITES, EXEMPLOS } from '../../utils/campos';
// Importada (e não "src/assets/logo.png"): o caminho de texto quebrava no build
import logo from '../../assets/logo.png';

const LoginVoluntario = () => {
    const navigate = useNavigate();

    const [email, setEmail] = useState("");
    const [senha, setSenha] = useState("");
    const [erro, setErro] = useState("");

    // Rodando quando o voluntário clica em Entrar
    const fazerLogin = async (e) => {
        e.preventDefault(); // impede a página de recarregar
        setErro(""); // limpa erro anterior antes de tentar

        try {
            const response = await fetch(`${API_URL}/api/voluntarios/login`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ email, senha }),
            });

            const data = await response.json();

            if (response.ok) {
                console.log("Login do voluntário realizado com sucesso!");

                // Salva o token JWT do voluntário separado do token do admin
                // token_voluntario é usado pelo PainelVoluntario para verificar acesso
                localStorage.setItem("token_voluntario", data.token);

                // Salva os dados básicos do voluntário para exibir no painel sem nova requisição
                localStorage.setItem("voluntario", JSON.stringify(data.voluntario));

                // Redireciona para o painel do voluntário
                navigate('/painel-voluntario');
            } else {
                // Exibe a mensagem de erro retornada pelo backend (ex: "Email ou senha incorretos.")
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
                        <img src={logo} width="120" alt="Logo S.O.S Vale" />
                    </div>
                    <h1>Login Voluntário</h1>
                    <p className="subtitle">Acesse sua conta para continuar</p>
                </div>

                <form onSubmit={fazerLogin}>
                    <div className="input-group">
                        <label htmlFor="email-voluntario">E-mail</label>
                        <div className="box1">
                            <FaEnvelope className="icon" />
                            <input
                                id="email-voluntario"
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
                        <label htmlFor="senha-voluntario">Senha</label>
                        <div className="box1">
                            <FaLock className="icon" />
                            <input
                                id="senha-voluntario"
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

                {/* Link para quem ainda não tem conta (Link = <a>: dá para usar pelo teclado) */}
                <p className="link-secundario">
                    Ainda não tem conta?{" "}
                    <Link to="/cadastro-voluntario">Cadastre-se</Link>
                </p>
            </div>
        </div>
    );
}

export default LoginVoluntario;