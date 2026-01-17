import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import StatusCard from "@/components/dashboard/StatusCard";
import CertidaoAlert from "@/components/dashboard/CertidaoAlert";
import OportunidadeCard from "@/components/dashboard/OportunidadeCard";
import { 
  Building2, 
  Users, 
  FileCheck, 
  Target, 
  AlertTriangle, 
  TrendingUp,
  Calendar,
  ArrowRight,
  Search,
  Filter
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import moment from "moment";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

export default function Dashboard() {
  const { data: empresas = [] } = useQuery({
    queryKey: ['empresas'],
    queryFn: () => base44.entities.Empresa.list()
  });

  const { data: profissionais = [] } = useQuery({
    queryKey: ['profissionais'],
    queryFn: () => base44.entities.Profissional.list()
  });

  const { data: certidoes = [] } = useQuery({
    queryKey: ['certidoes'],
    queryFn: () => base44.entities.Certidao.list()
  });

  const { data: oportunidades = [] } = useQuery({
    queryKey: ['oportunidades'],
    queryFn: () => base44.entities.Oportunidade.list('-created_date', 10)
  });

  // Cálculos de métricas
  const certidoesVencidas = certidoes.filter(c => {
    if (!c.data_validade) return false;
    return moment(c.data_validade).isBefore(moment());
  });

  const certidoesAlerta = certidoes.filter(c => {
    if (!c.data_validade) return false;
    const dias = moment(c.data_validade).diff(moment(), 'days');
    return dias >= 0 && dias <= 30;
  });

  const oportunidadesNovas = oportunidades.filter(o => o.status === "nova");
  const oportunidadesEmAnalise = oportunidades.filter(o => o.status === "em_analise" || o.status === "aprovada");

  const valorTotalOportunidades = oportunidades
    .filter(o => ["nova", "em_analise", "aprovada", "proposta_enviada"].includes(o.status))
    .reduce((sum, o) => sum + (o.valor_estimado || 0), 0);

  const getStatusGeral = () => {
    if (certidoesVencidas.length > 0) return "danger";
    if (certidoesAlerta.length > 0) return "warning";
    return "success";
  };

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('pt-BR', { 
      style: 'currency', 
      currency: 'BRL',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(value);
  };

  const alertasCriticos = [...certidoesVencidas, ...certidoesAlerta]
    .slice(0, 2)
    .map(c => {
      const empresa = empresas.find(e => e.id === c.empresa_id);
      const diasRestantes = c.data_validade ? moment(c.data_validade).diff(moment(), 'days') : 0;
      return {
        nome: c.tipo,
        empresa: empresa?.nome_fantasia || "Empresa não identificada",
        dias: diasRestantes
      };
    });

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
        {/* ALERTA CRÍTICO - Só aparece se houver risco */}
        {(certidoesVencidas.length > 0 || certidoesAlerta.length > 0) && (
          <Alert variant="destructive" className="mb-6 sm:mb-8 border-red-600/50 bg-red-950/30 shadow-lg shadow-red-900/10">
            <AlertTriangle className="h-4 sm:h-5 w-4 sm:w-5 text-red-500 flex-shrink-0" />
            <AlertTitle className="text-red-500 font-bold text-base sm:text-lg ml-2">
              Atenção: Risco de Inabilitação
            </AlertTitle>
            <AlertDescription className="ml-2 mt-2 text-sm">
              <p className="text-red-200 mb-3">
                O Robô Auditor identificou <strong>{certidoesVencidas.length + certidoesAlerta.length} documentos</strong> próximos do vencimento ou vencidos. 
                Renove imediatamente para não perder licitações.
              </p>
              <div className="space-y-2 mb-4">
                {alertasCriticos.map((alerta, i) => (
                  <div key={i} className="flex items-center justify-between bg-red-950/50 p-2 sm:p-3 rounded tech-border border-red-900/50 text-xs sm:text-sm gap-2">
                    <span className="text-red-100 truncate">
                      {alerta.nome} - <span className="opacity-70">{alerta.empresa}</span>
                    </span>
                    <span className="font-bold text-red-400 font-mono text-xs whitespace-nowrap flex-shrink-0">
                      {alerta.dias <= 0 ? "VENCIDO" : `${alerta.dias}d`}
                    </span>
                  </div>
                ))}
              </div>
              <Link to="/Certidoes" className="block">
                <Button size="sm" className="bg-red-600 hover:bg-red-700 text-white w-full">
                  <AlertTriangle className="mr-2 h-3.5 w-3.5" />
                  <span className="text-xs sm:text-sm">Resolver Pendências Agora</span>
                </Button>
              </Link>
            </AlertDescription>
          </Alert>
        )}

        {/* Header */}
        <div className="mb-6 sm:mb-8">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="min-w-0 flex-1">
              <h1 className="text-2xl sm:text-3xl font-bold text-foreground tracking-tight">
                Central de Licitações
              </h1>
              <p className="text-muted-foreground mt-1 font-mono text-xs sm:text-sm">
                Visão geral do portfólio e conformidade documental
              </p>
            </div>
            <div className="flex items-center gap-2 sm:gap-3 w-full sm:w-auto">
              <Link to="/Oportunidades" className="flex-1 sm:flex-none">
                <Button variant="outline" className="gap-2 w-full sm:w-auto text-xs sm:text-sm">
                  <Search className="w-3.5 sm:w-4 h-3.5 sm:h-4" />
                  <span className="hidden sm:inline">Buscar Editais</span>
                  <span className="sm:hidden">Buscar</span>
                </Button>
              </Link>
              <Link to="/Empresas" className="flex-1 sm:flex-none">
                <Button className="gap-2 w-full sm:w-auto text-xs sm:text-sm">
                  <Building2 className="w-3.5 sm:w-4 h-3.5 sm:h-4" />
                  <span className="hidden sm:inline">Nova Empresa</span>
                  <span className="sm:hidden">Empresa</span>
                </Button>
              </Link>
            </div>
          </div>
        </div>

        {/* Status Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 md:gap-6 mb-6 sm:mb-8">
          <StatusCard
            title="Empresas Ativas"
            value={empresas.filter(e => e.status === "ativo").length}
            subtitle={`${empresas.length} cadastradas`}
            icon={Building2}
            status="info"
          />
          <StatusCard
            title="Profissionais"
            value={profissionais.length}
            subtitle={`${profissionais.filter(p => p.is_responsavel_tecnico).length} RTs`}
            icon={Users}
            status="neutral"
          />
          <StatusCard
            title="Certidões"
            value={`${certidoes.filter(c => c.status === "valida").length}/${certidoes.length}`}
            subtitle={certidoesVencidas.length > 0 ? `${certidoesVencidas.length} vencidas` : "Todas regulares"}
            icon={FileCheck}
            status={getStatusGeral()}
          />
          <StatusCard
            title="Oportunidades"
            value={oportunidadesNovas.length + oportunidadesEmAnalise.length}
            subtitle={formatCurrency(valorTotalOportunidades)}
            icon={Target}
            status="success"
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6 md:gap-8">
          {/* Coluna Principal - Oportunidades */}
          <div className="lg:col-span-2 space-y-4 sm:space-y-6">
            <Card className="glass-panel tech-border shadow-sm">
              <CardHeader className="flex flex-col sm:flex-row items-start sm:items-center justify-between pb-3 sm:pb-4 space-y-2 sm:space-y-0">
                <CardTitle className="text-base sm:text-lg font-semibold flex items-center gap-2">
                  <Target className="w-4 sm:w-5 h-4 sm:h-5 text-blue-600 flex-shrink-0" />
                  <span className="truncate">Oportunidades Recentes</span>
                </CardTitle>
                <Link to="/Oportunidades" className="w-full sm:w-auto">
                  <Button variant="ghost" size="sm" className="gap-1 text-slate-600 text-xs w-full sm:w-auto justify-center sm:justify-start">
                    Ver todas
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Button>
                </Link>
              </CardHeader>
              <CardContent>
                {oportunidades.length === 0 ? (
                  <div className="text-center py-8 sm:py-12">
                    <Target className="w-10 sm:w-12 h-10 sm:h-12 text-slate-300 mx-auto mb-4" />
                    <p className="text-slate-500 mb-4 text-sm">Nenhuma oportunidade cadastrada</p>
                    <Link to="/Oportunidades">
                      <Button variant="outline" size="sm" className="text-xs">
                        Buscar Editais
                      </Button>
                    </Link>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 gap-3 sm:gap-4">
                    {oportunidades.slice(0, 4).map((oportunidade) => (
                      <OportunidadeCard 
                        key={oportunidade.id} 
                        oportunidade={oportunidade}
                        onClick={() => window.location.href = `/OportunidadeDetalhe?id=${oportunidade.id}`}
                      />
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Próximas Aberturas */}
            <Card className="glass-panel tech-border shadow-sm">
              <CardHeader className="pb-3 sm:pb-4">
                <CardTitle className="text-base sm:text-lg font-semibold flex items-center gap-2">
                  <Calendar className="w-4 sm:w-5 h-4 sm:h-5 text-amber-600 flex-shrink-0" />
                  <span className="truncate">Próximas Aberturas</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                {oportunidades.filter(o => o.data_abertura && moment(o.data_abertura).isAfter(moment())).length === 0 ? (
                  <p className="text-slate-500 text-center py-6 sm:py-8 text-sm">
                    Nenhuma licitação com data de abertura próxima
                  </p>
                ) : (
                  <div className="space-y-2 sm:space-y-3">
                    {oportunidades
                      .filter(o => o.data_abertura && moment(o.data_abertura).isAfter(moment()))
                      .sort((a, b) => moment(a.data_abertura).diff(moment(b.data_abertura)))
                      .slice(0, 5)
                      .map((o) => (
                        <div 
                          key={o.id}
                          className="flex items-center justify-between p-3 sm:p-4 bg-slate-50 rounded-xl hover:bg-slate-100 transition-colors cursor-pointer gap-2"
                          onClick={() => window.location.href = `/OportunidadeDetalhe?id=${o.id}`}
                        >
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-slate-900 truncate text-sm">{o.objeto}</p>
                            <p className="text-xs text-slate-500 truncate">{o.orgao_licitante}</p>
                          </div>
                          <div className="text-right whitespace-nowrap text-xs sm:text-sm flex-shrink-0">
                            <p className="font-semibold text-slate-900">
                              {moment(o.data_abertura).format("DD/MM")}
                            </p>
                            <p className="text-xs text-slate-500">
                              {moment(o.data_abertura).format("HH:mm")}
                            </p>
                          </div>
                        </div>
                      ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Sidebar - Alertas */}
          <div className="space-y-4 sm:space-y-6">
            {/* Alertas de Certidões */}
            <Card className="glass-panel tech-border shadow-sm">
              <CardHeader className="pb-3 sm:pb-4">
                <CardTitle className="text-base sm:text-lg font-semibold flex items-center gap-2">
                  <AlertTriangle className="w-4 sm:w-5 h-4 sm:h-5 text-amber-600 flex-shrink-0" />
                  <span className="truncate">Alertas de Conformidade</span>
                  {(certidoesVencidas.length + certidoesAlerta.length) > 0 && (
                    <Badge variant="destructive" className="ml-2 text-xs">
                      {certidoesVencidas.length + certidoesAlerta.length}
                    </Badge>
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {certidoesVencidas.length === 0 && certidoesAlerta.length === 0 ? (
                  <div className="text-center py-6 sm:py-8">
                    <FileCheck className="w-10 sm:w-12 h-10 sm:h-12 text-emerald-300 mx-auto mb-4" />
                    <p className="text-emerald-600 font-medium text-sm">Tudo em dia!</p>
                    <p className="text-xs text-slate-500">Nenhuma certidão vencida ou próxima do vencimento</p>
                  </div>
                ) : (
                  <div className="space-y-2 sm:space-y-3">
                    {[...certidoesVencidas, ...certidoesAlerta].slice(0, 5).map((certidao) => (
                      <CertidaoAlert 
                        key={certidao.id} 
                        certidao={certidao}
                      />
                    ))}
                    {(certidoesVencidas.length + certidoesAlerta.length) > 5 && (
                      <Link to="/Certidoes" className="block">
                        <Button variant="ghost" size="sm" className="w-full gap-1 text-xs">
                          Ver todos os {certidoesVencidas.length + certidoesAlerta.length} alertas
                          <ArrowRight className="w-3.5 h-3.5" />
                        </Button>
                      </Link>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Quick Stats */}
            <Card className="tech-border shadow-sm glass-panel">
              <CardHeader className="pb-3 sm:pb-4">
                <CardTitle className="text-base sm:text-lg font-semibold flex items-center gap-2">
                  <TrendingUp className="w-4 sm:w-5 h-4 sm:h-5 text-emerald-400 flex-shrink-0" />
                  <span className="truncate">Pipeline de Vendas</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 sm:space-y-4">
                <div className="flex justify-between items-center text-sm">
                  <span className="text-muted-foreground">Novas</span>
                  <span className="font-bold font-mono">{oportunidadesNovas.length}</span>
                </div>
                <div className="flex justify-between items-center text-sm">
                  <span className="text-muted-foreground">Em Análise</span>
                  <span className="font-bold font-mono">{oportunidadesEmAnalise.length}</span>
                </div>
                <div className="flex justify-between items-center text-sm">
                  <span className="text-muted-foreground">Propostas Enviadas</span>
                  <span className="font-bold font-mono">
                    {oportunidades.filter(o => o.status === "proposta_enviada").length}
                  </span>
                </div>
                <hr className="border-slate-700/50" />
                <div className="flex justify-between items-center text-sm">
                  <span className="text-primary font-medium">Valor Total</span>
                  <span className="font-bold font-mono text-sm">{formatCurrency(valorTotalOportunidades)}</span>
                </div>
              </CardContent>
            </Card>

            {/* Links Rápidos */}
            <Card className="glass-panel tech-border shadow-sm">
              <CardHeader className="pb-3 sm:pb-4">
                <CardTitle className="text-base sm:text-lg font-semibold">Acesso Rápido</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <Link to="/Empresas" className="block">
                  <Button variant="outline" className="w-full justify-start gap-3 text-xs sm:text-sm">
                    <Building2 className="w-3.5 sm:w-4 h-3.5 sm:h-4 flex-shrink-0" />
                    <span className="truncate">Gerenciar Empresas</span>
                  </Button>
                </Link>
                <Link to="/Profissionais" className="block">
                  <Button variant="outline" className="w-full justify-start gap-3 text-xs sm:text-sm">
                    <Users className="w-3.5 sm:w-4 h-3.5 sm:h-4 flex-shrink-0" />
                    <span className="truncate">Equipe Técnica</span>
                  </Button>
                </Link>
                <Link to="/Certidoes" className="block">
                  <Button variant="outline" className="w-full justify-start gap-3 text-xs sm:text-sm">
                    <FileCheck className="w-3.5 sm:w-4 h-3.5 sm:h-4 flex-shrink-0" />
                    <span className="truncate">Gestão de Certidões</span>
                  </Button>
                </Link>
                <Link to="/Filtros" className="block">
                  <Button variant="outline" className="w-full justify-start gap-3 text-xs sm:text-sm">
                    <Filter className="w-3.5 sm:w-4 h-3.5 sm:h-4 flex-shrink-0" />
                    <span className="truncate">Filtros de Busca</span>
                  </Button>
                </Link>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}