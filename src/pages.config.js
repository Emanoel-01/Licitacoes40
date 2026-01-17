import AcervoTecnico from './pages/AcervoTecnico';
import Certidoes from './pages/Certidoes';
import Dashboard from './pages/Dashboard';
import Empresas from './pages/Empresas';
import Filtros from './pages/Filtros';
import FontesConsultas from './pages/FontesConsultas';
import Home from './pages/Home';
import LandingPage from './pages/LandingPage';
import OportunidadeDetalhe from './pages/OportunidadeDetalhe';
import Oportunidades from './pages/Oportunidades';
import Perfil from './pages/Perfil';
import Profissionais from './pages/Profissionais';
import BibliotecaCompliance from './pages/BibliotecaCompliance';
import __Layout from './Layout.jsx';


export const PAGES = {
    "AcervoTecnico": AcervoTecnico,
    "Certidoes": Certidoes,
    "Dashboard": Dashboard,
    "Empresas": Empresas,
    "Filtros": Filtros,
    "FontesConsultas": FontesConsultas,
    "Home": Home,
    "LandingPage": LandingPage,
    "OportunidadeDetalhe": OportunidadeDetalhe,
    "Oportunidades": Oportunidades,
    "Perfil": Perfil,
    "Profissionais": Profissionais,
    "BibliotecaCompliance": BibliotecaCompliance,
}

export const pagesConfig = {
    mainPage: "LandingPage",
    Pages: PAGES,
    Layout: __Layout,
};