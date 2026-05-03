import React, { useState } from "react";
import { FaUser, FaLock } from "react-icons/fa";
import { useNavigate } from 'react-router-dom';

const LoginAdm = () => {
    const navigate = useNavigate();

    // Guardam os valores dos campos e mensagens
    const [email, setEmail] = useState("");
    const [senha, setSenha] = useState("");
    const [erro, setErro] = useState("");
    const [carregando, setCarregando] = useState(false);

    // Faz rodar quando o admin clica em Entrar
    const fazerLogin = async (e) => {
        e.preventDefault(); // impede a página de recarregar
        setErro(""); // limpa erros anteriores
        setCarregando(true); // ativa o estado de carregando

        try {
            // Manda email e senha para o backend Node.js
            const resposta = await fetch("http://localhost:3000/api/auth/login", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email, senha })
            });

            const dados = await resposta.json();

            if (resposta.ok) {
                // Salva o token no localStorage para usar nas próximas requisições
                localStorage.setItem("token", dados.token);
                // Salva os dados do admin também
                localStorage.setItem("admin", JSON.stringify(dados.admin));
                // Manda para o painel do admin
                navigate('/pg_adm');
            } else {
                // Mostra a mensagem de erro retornada pelo backend
                setErro(dados.mensagem);
            }

        } catch (err) {
            // Erro de conexão — backend pode estar desligado
            setErro("Erro ao conectar com o servidor. Verifique se o backend está rodando.");
        } finally {
            setCarregando(false); // desativa o carregando
        }
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