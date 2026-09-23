import React, { useState } from "react";
import { FaEnvelope, FaLock, FaUser, FaPhone, FaIdCard } from "react-icons/fa";
import { useNavigate } from 'react-router-dom';

const CadastroVoluntario = () => {
    const navigate = useNavigate();

    const [nome, setNome] = useState("");
    const [email, setEmail] = useState("");
    const [senha, setSenha] = useState("");
    const [telefone, setTelefone] = useState("");
    const [cpf, setCpf] = useState("");
    const [dataNascimento, setDataNascimento] = useState("");
    const [genero, setGenero] = useState("");
    const [erro, setErro] = useState("");
    const [carregando, setCarregando] = useState(false);

    // Rodando quando o voluntário clica em Cadastrar
    const fazerCadastro = async (e) => {
        e.preventDefault(); // impede a página de recarregar
        setErro("");
        setCarregando(true);

        try {
            const response = await fetch("http://localhost:3000/api/voluntarios/cadastrar", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    nome,
                    email,
                    senha,
                    telefone:       telefone       || null, // opcional — manda null se vazio
                    cpf:            cpf            || null, // opcional — manda null se vazio
                    dataNascimento,
                    genero,
                }),
            });

            const data = await response.json();

            if (response.ok) {
                console.log("Voluntário cadastrado com sucesso!");

                // Após cadastro, redireciona para o login — o voluntário precisa entrar com as credenciais
                navigate('/login_voluntario');
            } else {
                // Exibe a mensagem de erro retornada pelo backend (ex: "Email já cadastrado.")
                setErro(data.mensagem || "Erro ao cadastrar.");
            }
        } catch (error) {
            console.error("Erro ao conectar com a API:", error);
            setErro("Erro ao conectar com o servidor. Tente novamente.");
        } finally {
            setCarregando(false);
        }
    }

    return (
        <div className="container-page">
            <div className="card-cadastro">
                <div className="header-card">
                    <div className="icon-user-header">
                        <img src="src/assets/logo.png" width="120" />
                    </div>
                    <h1>Cadastro de Voluntário</h1>
                    <p className="subtitle">Preencha seus dados para se cadastrar</p>
                </div>

                <form onSubmit={fazerCadastro}>
                    {/* Nome — obrigatório */}
                    <div className="input-group">
                        <label>Nome completo</label>
                        <div className="box1">
                            <FaUser className="icon" />
                            <input
                                type="text"
                                placeholder="Seu nome completo"
                                value={nome}
                                onChange={(e) => setNome(e.target.value)}
                                required
                            />
                        </div>
                    </div>

                    {/* E-mail — obrigatório e único no banco */}
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

                    {/* Senha — obrigatório, criptografada no backend com bcrypt */}
                    <div className="input-group">
                        <label>Senha</label>
                        <div className="box1">
                            <FaLock className="icon" />
                            <input
                                type="password"
                                placeholder="Crie uma senha"
                                value={senha}
                                onChange={(e) => setSenha(e.target.value)}
                                required
                            />
                        </div>
                    </div>

                    {/* Telefone — opcional no banco (VarChar 15) */}
                    <div className="input-group">
                        <label>Telefone <span className="opcional">(opcional)</span></label>
                        <div className="box1">
                            <FaPhone className="icon" />
                            <input
                                type="tel"
                                placeholder="(11) 99999-9999"
                                value={telefone}
                                onChange={(e) => setTelefone(e.target.value)}
                            />
                        </div>
                    </div>

                    {/* CPF — opcional no banco (VarChar 14) */}
                    <div className="input-group">
                        <label>CPF <span className="opcional">(opcional)</span></label>
                        <div className="box1">
                            <FaIdCard className="icon" />
                            <input
                                type="text"
                                placeholder="000.000.000-00"
                                value={cpf}
                                onChange={(e) => setCpf(e.target.value)}
                            />
                        </div>
                    </div>

                    {/* Data de nascimento — obrigatório no schema */}
                    <div className="input-group">
                        <label>Data de nascimento</label>
                        <div className="box1">
                            <input
                                type="date"
                                value={dataNascimento}
                                onChange={(e) => setDataNascimento(e.target.value)}
                                required
                            />
                        </div>
                    </div>

                    {/* Gênero — obrigatório no schema */}
                    <div className="input-group">
                        <label>Gênero</label>
                        <div className="box1">
                            <select
                                value={genero}
                                onChange={(e) => setGenero(e.target.value)}
                                required
                            >
                                <option value="">Selecione</option>
                                <option value="masculino">Masculino</option>
                                <option value="feminino">Feminino</option>
                                <option value="nao-binario">Não-binário</option>
                                <option value="prefiro-nao-informar">Prefiro não informar</option>
                            </select>
                        </div>
                    </div>

                    {/* Exibe mensagem de erro se o cadastro falhar */}
                    {erro && <p className="mensagem-erro">{erro}</p>}

                    <div className="button-cad1">
                        {/* Desabilita o botão enquanto aguarda resposta da API */}
                        <button type="submit" disabled={carregando}>
                            {carregando ? "Cadastrando..." : "Cadastrar"}
                        </button>
                    </div>
                </form>

                {/* Link para quem já tem conta */}
                <p className="link-secundario">
                    Já tem uma conta?{" "}
                    <span onClick={() => navigate('/login-voluntario')}>
                        Faça login
                    </span>
                </p>
            </div>
        </div>
    );
}

export default CadastroVoluntario;