import Cadastro from "./pages/cadastro";
import Login from "./pages/login";
import LoginAdm from "./pages/login_adm";
import Sosvale from "./pages/sosvale";
import PgAdm from "./pages/pg_adm";

import { BrowserRouter, Routes, Route } from 'react-router-dom';

export const AppRoutes = () => {
    return (
        <BrowserRouter>
            <Routes>
                <Route path='/' element={<Sosvale />}/>
                <Route path='/login-adm' element={<LoginAdm />}/>
                <Route path='/login' element={<Login />}/>
                <Route path='/cadastro' element={<Cadastro />}/>
                <Route path='/pg-adm' element={<PgAdm />}/>
            </Routes>
        </BrowserRouter>
    )
}