import { Link, useLocation } from "react-router-dom";

import { 
  LayoutDashboard, 
  Building2, 
  Users, 
  FileCheck, 
  Target, 
  Filter,
  Menu,
  X,
  ChevronRight,
  LogOut,
  UserCircle
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useState } from "react";
import { base44 } from "@/api/base44Client";

const navigation = [
        { name: "Dashboard", href: "/Dashboard", icon: LayoutDashboard },
        { name: "Dashboard Compliance", href: "/DashboardCompliance", icon: FileCheck },
        { name: "Empresas", href: "/Empresas", icon: Building2 },
        { name: "Equipe Técnica", href: "/Profissionais", icon: Users },
        { name: "Acervo Técnico", href: "/AcervoTecnico", icon: FileCheck },
        { name: "Biblioteca Compliance", href: "/BibliotecaCompliance", icon: FileCheck },
        { name: "Oportunidades", href: "/Oportunidades", icon: Target },
        { name: "Filtros de Busca", href: "/Filtros", icon: Filter },
        { name: "Editor de Propostas", href: "/EditorPropostas", icon: FileCheck },
        { name: "Fontes de Consulta", href: "/FontesConsultas", icon: Target },
      ];

export default function Layout({ children, currentPageName }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const handleLogout = () => {
    base44.auth.logout();
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Mobile sidebar backdrop */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/70 z-40 lg:hidden backdrop-blur-sm"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar - Titanium Construct */}
      <aside className={cn(
        "fixed top-0 left-0 h-full w-64 glass-panel z-50 transform transition-transform duration-300 lg:translate-x-0",
        sidebarOpen ? "translate-x-0" : "-translate-x-full"
      )}>
        <div className="flex flex-col h-full">
          {/* Logo */}
              <div className="p-4 md:p-6 border-b border-slate-700/50">
                <div className="flex items-center gap-2 md:gap-3">
                  <div className="w-8 md:w-10 h-8 md:h-10 rounded bg-gradient-to-br from-primary to-amber-600 flex items-center justify-center shadow-lg shadow-primary/20 flex-shrink-0">
                    <Target className="w-4 md:w-5 h-4 md:h-5 text-slate-950" />
                  </div>
                  <div className="min-w-0">
                    <h1 className="font-bold text-foreground tracking-tight text-sm md:text-base">Licitações 4.0</h1>
                    <p className="text-xs text-muted-foreground font-mono hidden sm:block">Engenharia de Precisão</p>
                  </div>
                </div>
              </div>

          {/* Navigation */}
          <nav className="flex-1 p-3 md:p-4 space-y-1 overflow-y-auto">
            {navigation.map((item) => {
              const isActive = currentPageName === item.href;
              return (
                <Link
                  key={item.name}
                  to={item.href}
                  onClick={() => setSidebarOpen(false)}
                  className={cn(
                    "flex items-center gap-2 md:gap-3 px-3 md:px-4 py-2.5 md:py-3 rounded text-sm md:text-base transition-all duration-200 tech-border",
                    isActive 
                      ? "bg-primary text-primary-foreground shadow-lg shadow-primary/20 border-primary/50" 
                      : "text-muted-foreground hover:bg-accent hover:text-accent-foreground border-transparent"
                  )}
                >
                  <item.icon className={cn(
                    "w-4 md:w-5 h-4 md:h-5 flex-shrink-0",
                    isActive ? "text-primary-foreground" : "text-muted-foreground"
                  )} />
                  <span className="font-medium tracking-wide truncate">{item.name}</span>
                  {isActive && <ChevronRight className="w-4 h-4 ml-auto flex-shrink-0" />}
                </Link>
              );
            })}
          </nav>

          {/* Footer */}
          <div className="p-3 md:p-4 border-t border-slate-700/50 space-y-1">
            <Link
              to="/Perfil"
              onClick={() => setSidebarOpen(false)}
              className={cn(
                "flex items-center gap-2 md:gap-3 px-3 md:px-4 py-2.5 md:py-3 rounded text-sm md:text-base transition-all duration-200 tech-border",
                currentPageName === "/Perfil"
                  ? "bg-primary text-primary-foreground shadow-lg shadow-primary/20 border-primary/50" 
                  : "text-muted-foreground hover:bg-accent hover:text-accent-foreground border-transparent"
              )}
            >
              <UserCircle className="w-4 md:w-5 h-4 md:h-5 flex-shrink-0" />
              <span className="font-medium tracking-wide truncate">Meu Perfil</span>
            </Link>
            <Button 
              variant="ghost" 
              className="w-full justify-start gap-2 md:gap-3 text-sm md:text-base text-muted-foreground hover:text-destructive hover:bg-destructive/10 border border-transparent hover:border-destructive/20 px-3 md:px-4"
              onClick={handleLogout}
            >
              <LogOut className="w-4 md:w-5 h-4 md:h-5 flex-shrink-0" />
              <span className="truncate">Sair</span>
            </Button>
          </div>
        </div>
      </aside>

      {/* Main content */}
      <div className="lg:pl-64">
        {/* Top bar - mobile */}
        <header className="lg:hidden sticky top-0 z-30 glass-panel px-3 py-2">
          <div className="flex items-center justify-between gap-2">
            <Button 
              variant="ghost" 
              size="icon"
              className="w-9 h-9"
              onClick={() => setSidebarOpen(true)}
            >
              <Menu className="w-5 h-5" />
            </Button>
            <div className="flex items-center gap-2 min-w-0 flex-1">
              <div className="w-7 h-7 rounded bg-gradient-to-br from-primary to-amber-600 flex items-center justify-center flex-shrink-0">
                <Target className="w-3.5 h-3.5 text-slate-950" />
              </div>
              <span className="font-semibold text-foreground text-sm truncate">Licitações 4.0</span>
            </div>
            <div className="w-9" /> {/* Spacer */}
          </div>
        </header>

        {/* Page content */}
        <main className="min-h-screen">
          {children}
        </main>
      </div>
    </div>
  );
}