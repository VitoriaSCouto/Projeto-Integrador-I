import './App.css';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';

import Sosvale from './pages/sosvale';
import LoginAdm from './pages/login_adm';
import Login from './pages/login';
import PgAdm from './pages/pg_adm';
import Cadastro from './pages/cadastro';
import ListarAbrigos from './pages/abrigos/Hub-Abrigos';
import CadastroVitima from './pages/vitimas/cadastro-vitima';
import ListarVitimas from './pages/vitimas/Hub-Vitimas';
import CadastrarAbrigo from './pages/abrigos/Cadastrar-Abrigo';
import DetalhesAbrigo from './pages/abrigos/Detalhes-Abrigo';
import DetalhesVitimas from './pages/vitimas/Detalhes-vitima';
import DetalhesSolicitacaoAbrigo from './pages/Solicitacoes-Abrigo/Detalhes-solicitacao'
import ListaSolicitacoesAbrigo from './pages/Solicitacoes-Abrigo/Listar-Solicitacoes'
import CadastrarRegiao from './pages/regioes/CadastrarRegiao'
import Mapa from './pages/regioes/mapa';
import CadastroVoluntario from './pages/cadastro-voluntario';
import LoginVoluntario from './pages/login-voluntario';
import PainelVoluntario from './pages/pg-voluntario';
import VitimasDoAbrigo from './pages/abrigos/Vitimas-Abrigo';
import SolicitacoesAjudaDoAbrigo from './pages/Solicitacoes-Ajuda/listar-solicitacoes-do-abrigo';
import CadastrarSolicitacaoAjuda from './pages/Solicitacoes-Ajuda/cadastrar-solicitacao-ajuda';
import DetalhesSolicitacaoAjuda from './pages/Solicitacoes-Ajuda/detalhes-solicitacao-ajuda';
import SolicitacoesAjudaVoluntario from './pages/Solicitacoes-Ajuda/solicitacoes-ajuda-voluntario';

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
          <Route path="/abrigos" element={<ListarAbrigos />} />
          <Route path="/cadastro-vitima" element={<CadastroVitima />} />
          <Route path="/vitimas" element={<ListarVitimas />} />
          <Route path="/cadastrar-abrigos" element={<CadastrarAbrigo />} />
          <Route path="/detalhes-abrigos/:id" element={<DetalhesAbrigo />} />
          <Route path="/detalhes-vitimas/:id" element={<DetalhesVitimas/>}/>
          <Route path="/mapa" element={<Mapa/>}/>
          <Route path="/visualizar-solicitação-abrigo/:id" element={<DetalhesSolicitacaoAbrigo/>}/>
          <Route path="/listar-solicitação-abrigo" element={<ListaSolicitacoesAbrigo/>}/>
          <Route path="/cadastrar-regiao" element={<CadastrarRegiao/>}/>
          <Route path="/cadastro-voluntario" element={<CadastroVoluntario/>}/>
          <Route path="/login-voluntario" element={<LoginVoluntario/>}/>
          <Route path="/painel-voluntario" element={<PainelVoluntario/>}/>
          <Route path="/abrigos/:id/vitimas" element={<VitimasDoAbrigo/>}/>
          <Route path="/abrigos/:id/solicitacoes-ajuda" element={<SolicitacoesAjudaDoAbrigo/>}/>
          <Route path="/abrigos/:id/cadastrar-solicitacao-ajuda" element={<CadastrarSolicitacaoAjuda/>}/>
          <Route path="/visualizar-solicitacao-ajuda/:id" element={<DetalhesSolicitacaoAjuda/>}/>
          <Route path="/solicitacoes-ajuda-voluntario" element={<SolicitacoesAjudaVoluntario/>}/>


        </Routes>
      </Router>
    </div>
  );
}

export default App;