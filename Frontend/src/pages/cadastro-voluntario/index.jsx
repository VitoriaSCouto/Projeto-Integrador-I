import React, { useState } from "react";
import { FaEnvelope, FaLock, FaUser, FaPhone, FaIdCard } from "react-icons/fa";
import { useNavigate, Link } from 'react-router-dom';
import { API_URL, hojeISO } from '../../services/api';
import { LIMITES, EXEMPLOS, somenteNome, mascaraCpf, mascaraTelefone, erroDosCampos } from '../../utils/campos';
import { Obrigatorio, Opcional, AvisoObrigatorios } from '../../components/MarcasCampo';
// Importada (e não "src/assets/logo.png"): o caminho de texto quebrava no build
import logo from '../../assets/logo.png';

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

        // Confere CPF (dígitos verificadores) e telefone antes de enviar
        const erroCampos = erroDosCampos({ cpf, telefone });
        if (erroCampos) {
            setErro(erroCampos);
            return;
        }

        setCarregando(true);

        try {
            const response = await fetch(`${API_URL}/api/voluntarios/cadastrar`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    nome:           nome.trim(),
                    email:          email.trim(),
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
                navigate('/login-voluntario');
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
                        <img src={logo} width="120" alt="Logo S.O.S Vale" />
                    </div>
                    <h1>Cadastro de Voluntário</h1>
                    <p className="subtitle">Preencha seus dados para se cadastrar</p>
                </div>

                <form onSubmit={fazerCadastro}>
                    <AvisoObrigatorios />
                    {/* Nome — obrigatório */}
                    <div className="input-group">
                        <label htmlFor="nome-vol">Nome completo<Obrigatorio /></label>
                        <div className="box1">
                            <FaUser className="icon" />
                            <input
                                id="nome-vol"
                                type="text"
                                placeholder="Seu nome completo"
                                maxLength={LIMITES.nomePessoa}
                                minLength={2}
                                value={nome}
                                onChange={(e) => setNome(somenteNome(e.target.value))}
                                required
                            />
                        </div>
                    </div>

                    {/* E-mail — obrigatório e único no banco */}
                    <div className="input-group">
                        <label htmlFor="email-vol">E-mail<Obrigatorio /></label>
                        <div className="box1">
                            <FaEnvelope className="icon" />
                            <input
                                id="email-vol"
                                type="email"
                                placeholder={EXEMPLOS.email}
                                maxLength={LIMITES.email}
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                            />
                        </div>
                    </div>

                    {/* Senha — obrigatório, criptografada no backend com bcrypt */}
                    <div className="input-group">
                        <label htmlFor="senha-vol">Senha<Obrigatorio /></label>
                        <div className="box1">
                            <FaLock className="icon" />
                            <input
                                id="senha-vol"
                                type="password"
                                placeholder={`De ${LIMITES.senhaMin} a ${LIMITES.senhaMax} caracteres`}
                                minLength={LIMITES.senhaMin}
                                maxLength={LIMITES.senhaMax}
                                autoComplete="new-password"
                                value={senha}
                                onChange={(e) => setSenha(e.target.value)}
                                required
                            />
                        </div>
                    </div>

                    {/* Telefone — opcional no banco (VarChar 15) */}
                    <div className="input-group">
                        <label htmlFor="telefone-vol">Telefone<Opcional /></label>
                        <div className="box1">
                            <FaPhone className="icon" />
                            <input
                                id="telefone-vol"
                                type="tel"
                                maxLength={LIMITES.telefone}
                                inputMode="numeric"
                                placeholder={EXEMPLOS.telefone}
                                value={telefone}
                                onChange={(e) => setTelefone(mascaraTelefone(e.target.value))}
                            />
                        </div>
                    </div>

                    {/* CPF — opcional no banco (VarChar 14) */}
                    <div className="input-group">
                        <label htmlFor="cpf-vol">CPF<Opcional /></label>
                        <div className="box1">
                            <FaIdCard className="icon" />
                            <input
                                id="cpf-vol"
                                type="text"
                                maxLength={LIMITES.cpf}
                                inputMode="numeric"
                                placeholder={EXEMPLOS.cpf}
                                value={cpf}
                                onChange={(e) => setCpf(mascaraCpf(e.target.value))}
                            />
                        </div>
                    </div>

                    {/* Data de nascimento — obrigatório no schema */}
                    <div className="input-group">
                        <label htmlFor="nascimento-vol">Data de nascimento<Obrigatorio /></label>
                        <div className="box1">
                            <input
                                id="nascimento-vol"
                                type="date"
                                min="1900-01-01"
                                max={hojeISO()}
                                value={dataNascimento}
                                onChange={(e) => setDataNascimento(e.target.value)}
                                required
                            />
                        </div>
                    </div>

                    {/* Gênero — obrigatório no schema */}
                    <div className="input-group">
                        <label htmlFor="genero-vol">Gênero<Obrigatorio /></label>
                        <div className="box1">
                            <select
                                id="genero-vol"
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
                    {erro && <p className="mensagem-erro" role="alert">{erro}</p>}

                    <div className="button-cad1">
                        {/* Desabilita o botão enquanto aguarda resposta da API */}
                        <button type="submit" disabled={carregando}>
                            {carregando ? "Cadastrando..." : "Cadastrar"}
                        </button>
                    </div>
                </form>

                {/* Link para quem já tem conta (Link = <a>: dá para usar pelo teclado) */}
                <p className="link-secundario">
                    Já tem uma conta?{" "}
                    <Link to="/login-voluntario">Faça login</Link>
                </p>
            </div>
        </div>
    );
}

export default CadastroVoluntario;