import { useNavigate } from 'react-router-dom';

const Sosvale = () => {
  const navigate = useNavigate();
  return (
    <div className="containerSos">
        <div className="img-logo">
          <img src="src/assets/logo.png" width= "160"/>
        </div>

        <div className="buttonBox">
          <button onClick={() => { navigate('/login-adm')} }>Sou Administrador</button>
          <button onClick={() => { navigate('/login')} }>Sou Voluntário</button>
          <button><a href="#">Sou Munícipe</a></button>
        </div>
    </div>
  );
};

export default Sosvale;