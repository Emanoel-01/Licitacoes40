import AcervoTecnico from './pages/AcervoTecnico';
import BibliotecaCompliance from './pages/BibliotecaCompliance';
import Dashboard from './pages/Dashboard';
import EditorPropostas from './pages/EditorPropostas';
import Empresas from './pages/Empresas';
import Filtros from './pages/Filtros';
import FontesConsultas from './pages/FontesConsultas';
import Home from './pages/Home';
import LandingPage from './pages/LandingPage';
import OportunidadeDetalhe from './pages/OportunidadeDetalhe';
import Oportunidades from './pages/Oportunidades';
import Perfil from './pages/Perfil';
import Profissionais from './pages/Profissionais';
import DashboardCompliance from './pages/DashboardCompliance';
import __Layout from './Layout.jsx';


export const PAGES = {
    "AcervoTecnico": AcervoTecnico,
    "BibliotecaCompliance": BibliotecaCompliance,
    "Dashboard": Dashboard,
    "EditorPropostas": EditorPropostas,
    "Empresas": Empresas,
    "Filtros": Filtros,
    "FontesConsultas": FontesConsultas,
    "Home": Home,
    "LandingPage": LandingPage,
    "OportunidadeDetalhe": OportunidadeDetalhe,
    "Oportunidades": Oportunidades,
    "Perfil": Perfil,
    "Profissionais": Profissionais,
    "DashboardCompliance": DashboardCompliance,
}

export const pagesConfig = {
    mainPage: "LandingPage",
    Pages: PAGES,
    Layout: __Layout,
};