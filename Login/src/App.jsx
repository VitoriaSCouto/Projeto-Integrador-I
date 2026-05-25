import './App.css'
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
//importa as rotas das paginas 
import Sosvale from './pages/sosvale'; 
import LoginAdm from './pages/login_adm'; 
import Login from './pages/login'; 
import PgAdm from './pages/pg_adm';
import Cadastro from './pages/cadastro';
import CadastroAbrigo from './pages/cadastro_abrigo';
import ListarAbrigos from './pages/listarabrigo'

function App() {
  return (
    <div className="App">
      <Router>
        <Routes>
          <Route path="/" element={<Sosvale />} />
          
          <Route path="/login-adm" element={<LoginAdm />} />
          
          <Route path="/login" element={<Login />} /> 
          
          <Route path="/pg_adm" element={<PgAdm />} />
          
          <Route path="/cadastro" element={<Cadastro />} /> 

          <Route path="/cadastro-abrigo" element={<CadastroAbrigo />} /> 
          
          <Route path="/abrigos" element={<ListarAbrigos />} /> 
        </Routes>
      </Router>
    </div>
  );
}

export default App;