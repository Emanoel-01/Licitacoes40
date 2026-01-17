import Dashboard from './pages/Dashboard';
import Empresas from './pages/Empresas';
import Profissionais from './pages/Profissionais';
import Oportunidades from './pages/Oportunidades';
import Certidoes from './pages/Certidoes';
import OportunidadeDetalhe from './pages/OportunidadeDetalhe';
import Filtros from './pages/Filtros';
import __Layout from './Layout.jsx';


export const PAGES = {
    "Dashboard": Dashboard,
    "Empresas": Empresas,
    "Profissionais": Profissionais,
    "Oportunidades": Oportunidades,
    "Certidoes": Certidoes,
    "OportunidadeDetalhe": OportunidadeDetalhe,
    "Filtros": Filtros,
}

export const pagesConfig = {
    mainPage: "Dashboard",
    Pages: PAGES,
    Layout: __Layout,
};