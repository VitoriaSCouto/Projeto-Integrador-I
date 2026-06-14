import './App.css';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';

import Sosvale from './pages/sosvale';
import LoginAdm from './pages/login_adm';
import Login from './pages/login';
import PgAdm from './pages/pg_adm';
import Cadastro from './pages/cadastro';
import ListarAbrigos from './pages/abrigos/HubAbrigo';
import CadastroVitima from './pages/vitimas/cadastro_vitima';
import ListarVitimas from './pages/vitimas/listarvitima';
import CadastrarAbrigo from './pages/abrigos/cadastrar-abrigos';
import DetalhesAbrigo from './pages/abrigos/detalhes-abrigos';

function App() {
  return (
    <div className="App">
      <Router>
        <Routes>
          {/* 2. DEFINIÇÃO DAS ROTAS */}
          <Route path="/" element={<Sosvale />} />
          <Route path="/login-adm" element={<LoginAdm />} />
          <Route path="/login" element={<Login />} />
          <Route path="/pg_adm" element={<PgAdm />} />
          <Route path="/cadastro" element={<Cadastro />} />
          <Route path="/abrigo" element={<ListarAbrigos />} />
          <Route path="/cadastro_vitima" element={<CadastroVitima />} />
          <Route path="/listar_vitimas" element={<ListarVitimas />} />
          <Route path="/cadastrar-abrigos" element={<CadastrarAbrigo />} />
          <Route path="/detalhes-abrigos/:id" element={<DetalhesAbrigo />} />
        </Routes>
      </Router>
    </div>
  );
}

export default App;