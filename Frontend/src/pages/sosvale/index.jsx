import { useNavigate } from 'react-router-dom'; 
import { FaShieldAlt, FaHandshake } from "react-icons/fa"; 
import { BsFillPeopleFill } from "react-icons/bs"; 

const Sosvale = () => { 
const navigate = useNavigate(); 
return ( 
    <div className="container_M"> 
        <div className="img-logo"> 
            <img src="src/assets/logo.png" width= "160"/> 
        </div> 
        <h1>Bem-vindo ao S.O.S Vale</h1> 
        <p className="subtitulo_M"> Para continuar, selecione o tipo de acesso que melhor descreve o seu papel na plataforma. </p> 
        <div className="card_M"> 
            <div className="icone_M"><FaShieldAlt /></div> 
            <div className="conteudo_M"> 
                <h2>Sou Administrador</h2> 
                <p>Acesso especial para gerenciar o sistema.</p> 
            </div> 
            <button className="btnEntrar_M" onClick={() => { navigate('/login-adm')} }>Entrar</button> 
        </div> 
        <div className="card_M"> 
            <div className="icone_M"><FaHandshake /></div> 
            <div className="conteudo_M"> 
            <h2>Sou Voluntário</h2> 
            <p>Quero oferecer ajuda.</p> 
        </div> 
        <button className="btnEntrar_M" onClick={() => { navigate('/login')} }>Entrar</button> 
        </div> 
        <div className="card_M"> 
            <div className="icone_M"><BsFillPeopleFill /></div> 
                <div className="conteudo_M"> 
                    <h2>Sou Munícipe</h2> 
                    <p>Sou um cidadão e quero me informar.</p> 
                </div> 
        <a href="#"><button className="btnEntrar_M">Entrar</button></a> 
        </div> 
    </div> 
    ); 
}; 
export default Sosvale; 