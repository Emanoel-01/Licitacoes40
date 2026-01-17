import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { 
  Target, 
  Shield, 
  Zap, 
  CheckCircle, 
  ArrowRight, 
  FileCheck,
  Users,
  TrendingUp,
  Sparkles
} from "lucide-react";

export default function LandingPage() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const authenticated = await base44.auth.isAuthenticated();
      setIsAuthenticated(authenticated);
      if (authenticated) {
        window.location.href = "/Dashboard";
      }
    } catch (error) {
      setIsAuthenticated(false);
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = () => {
    base44.auth.redirectToLogin("/Dashboard");
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header - Titanium Construct */}
      <header className="glass-panel sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded bg-gradient-to-br from-primary to-amber-600 flex items-center justify-center shadow-lg shadow-primary/20">
              <Target className="w-6 h-6 text-slate-950" />
            </div>
            <div>
              <h1 className="font-bold text-foreground text-lg tracking-tight">Licitações 4.0</h1>
              <p className="text-xs text-muted-foreground font-mono">Engenharia de Precisão</p>
            </div>
          </div>
          <Button onClick={handleLogin} className="bg-primary text-primary-foreground hover:bg-primary/90">
            Acessar Sistema
            <ArrowRight className="w-4 h-4 ml-2" />
          </Button>
        </div>
      </header>

      {/* Hero Section */}
      <section className="py-20 px-6">
        <div className="max-w-7xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-primary/10 tech-border rounded-full mb-6">
            <Sparkles className="w-4 h-4 text-primary" />
            <span className="text-sm text-primary font-medium font-mono">POWERED BY AI</span>
          </div>
          
          <h1 className="text-5xl md:text-6xl font-bold text-foreground mb-6 leading-tight">
            Nunca mais perca uma<br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-amber-600">
              licitação por documentação
            </span>
          </h1>
          
          <p className="text-xl text-muted-foreground mb-10 max-w-2xl mx-auto">
            Sistema inteligente que monitora, audita e organiza toda documentação técnica 
            da sua empresa para garantir 100% de conformidade nos editais.
          </p>

          <div className="flex items-center justify-center gap-4">
            <Button 
              onClick={handleLogin}
              size="lg"
              className="bg-primary text-primary-foreground hover:bg-primary/90 px-8 py-6 text-lg shadow-lg shadow-primary/20"
            >
              Começar Agora
              <ArrowRight className="w-5 h-5 ml-2" />
            </Button>
            <Button 
              size="lg"
              variant="outline"
              className="tech-border px-8 py-6 text-lg"
            >
              Ver Demonstração
            </Button>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-20 px-6 bg-slate-900/50">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
              Como Funciona
            </h2>
            <p className="text-muted-foreground text-lg">
              Três pilares para sua empresa nunca mais ser desclassificada
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <Card className="glass-panel hover:border-primary/50 transition-all">
              <CardContent className="pt-6">
                <div className="w-12 h-12 rounded bg-primary/10 flex items-center justify-center mb-4">
                  <Shield className="w-6 h-6 text-primary" />
                </div>
                <h3 className="text-xl font-bold text-foreground mb-2">Auditoria Automática</h3>
                <p className="text-muted-foreground">
                  IA analisa 100% dos requisitos do edital e cruza com seu acervo técnico, 
                  certificações e certidões em tempo real.
                </p>
              </CardContent>
            </Card>

            <Card className="glass-panel hover:border-primary/50 transition-all">
              <CardContent className="pt-6">
                <div className="w-12 h-12 rounded bg-green-500/10 flex items-center justify-center mb-4">
                  <FileCheck className="w-6 h-6 text-green-400" />
                </div>
                <h3 className="text-xl font-bold text-foreground mb-2">Gestão de Documentos</h3>
                <p className="text-muted-foreground">
                  Centralize CATs, ARTs, certidões e toda documentação técnica. 
                  Alertas automáticos de vencimento.
                </p>
              </CardContent>
            </Card>

            <Card className="glass-panel hover:border-primary/50 transition-all">
              <CardContent className="pt-6">
                <div className="w-12 h-12 rounded bg-ring/10 flex items-center justify-center mb-4">
                  <Zap className="w-6 h-6 text-ring" />
                </div>
                <h3 className="text-xl font-bold text-foreground mb-2">Busca Inteligente</h3>
                <p className="text-muted-foreground">
                  Robô monitora portais de licitação 24/7 e filtra apenas oportunidades 
                  compatíveis com seu acervo.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Benefits */}
      <section className="py-20 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-6">
                Resultados Comprovados
              </h2>
              <div className="space-y-6">
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded bg-green-500/10 flex items-center justify-center flex-shrink-0">
                    <CheckCircle className="w-5 h-5 text-green-400" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-foreground mb-1">Zero Desclassificações</h3>
                    <p className="text-muted-foreground">
                      Auditoria prévia garante conformidade documental em 100% das propostas
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <TrendingUp className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-foreground mb-1">+60% Produtividade</h3>
                    <p className="text-muted-foreground">
                      Equipe foca em propostas técnicas enquanto o sistema cuida da documentação
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded bg-ring/10 flex items-center justify-center flex-shrink-0">
                    <Users className="w-5 h-5 text-ring" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-foreground mb-1">Gestão Centralizada</h3>
                    <p className="text-muted-foreground">
                      Toda equipe técnica, certidões e acervo em uma única plataforma
                    </p>
                  </div>
                </div>
              </div>

              <Button 
                onClick={handleLogin}
                size="lg"
                className="bg-primary text-primary-foreground hover:bg-primary/90 mt-8 px-8 py-6 text-lg shadow-lg shadow-primary/20"
              >
                Começar Gratuitamente
                <ArrowRight className="w-5 h-5 ml-2" />
              </Button>
            </div>

            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-r from-primary to-amber-600 rounded-2xl blur-3xl opacity-20" />
              <Card className="relative glass-panel p-8">
                <div className="space-y-6">
                  <div className="flex items-center justify-between p-4 bg-background/50 rounded tech-border">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded bg-green-500/10 flex items-center justify-center">
                        <FileCheck className="w-5 h-5 text-green-400" />
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Certidões Válidas</p>
                        <p className="text-lg font-bold text-foreground font-mono">12/12</p>
                      </div>
                    </div>
                    <CheckCircle className="w-6 h-6 text-green-400" />
                  </div>

                  <div className="flex items-center justify-between p-4 bg-background/50 rounded tech-border">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded bg-primary/10 flex items-center justify-center">
                        <Target className="w-5 h-5 text-primary" />
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Editais Monitorados</p>
                        <p className="text-lg font-bold text-foreground font-mono">47 ativos</p>
                      </div>
                    </div>
                    <Zap className="w-6 h-6 text-primary" />
                  </div>

                  <div className="flex items-center justify-between p-4 bg-background/50 rounded tech-border">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded bg-ring/10 flex items-center justify-center">
                        <Users className="w-5 h-5 text-ring" />
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Profissionais Ativos</p>
                        <p className="text-lg font-bold text-foreground font-mono">8 RT</p>
                      </div>
                    </div>
                    <TrendingUp className="w-6 h-6 text-ring" />
                  </div>
                </div>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Final */}
      <section className="py-20 px-6 bg-gradient-to-r from-primary to-amber-600">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-slate-950 mb-4">
            Pronto para vencer mais licitações?
          </h2>
          <p className="text-xl text-slate-900 mb-8">
            Junte-se às empresas que já eliminaram desclassificações por documentação
          </p>
          <Button 
            onClick={handleLogin}
            size="lg"
            className="bg-slate-950 text-white hover:bg-slate-900 px-8 py-6 text-lg shadow-2xl"
          >
            Começar Agora - É Grátis
            <ArrowRight className="w-5 h-5 ml-2" />
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="glass-panel py-8 px-6">
        <div className="max-w-7xl mx-auto text-center">
          <p className="text-muted-foreground font-mono text-sm">
            © 2026 Licitações 4.0 - Inteligência Artificial aplicada a Licitações Públicas
          </p>
        </div>
      </footer>
    </div>
  );
}