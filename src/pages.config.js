import AcervoTecnico from './pages/AcervoTecnico';
import Certidoes from './pages/Certidoes';
import Dashboard from './pages/Dashboard';
import Empresas from './pages/Empresas';
import Filtros from './pages/Filtros';
import FontesConsultas from './pages/FontesConsultas';
import LandingPage from './pages/LandingPage';
import OportunidadeDetalhe from './pages/OportunidadeDetalhe';
import Oportunidades from './pages/Oportunidades';
import Profissionais from './pages/Profissionais';
import Home from './pages/Home';
import Perfil from './pages/Perfil';
import __Layout from './Layout.jsx';


export const PAGES = {
    "AcervoTecnico": AcervoTecnico,
    "Certidoes": Certidoes,
    "Dashboard": Dashboard,
    "Empresas": Empresas,
    "Filtros": Filtros,
    "FontesConsultas": FontesConsultas,
    "LandingPage": LandingPage,
    "OportunidadeDetalhe": OportunidadeDetalhe,
    "Oportunidades": Oportunidades,
    "Profissionais": Profissionais,
    "Home": Home,
    "Perfil": Perfil,
}

export const pagesConfig = {
    mainPage: "Dashboard",
    Pages: PAGES,
    Layout: __Layout,
};