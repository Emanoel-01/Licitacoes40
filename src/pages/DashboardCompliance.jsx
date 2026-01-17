import { useState, useMemo } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import {
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  LineChart,
  Line
} from "recharts";
import {
  FileCheck,
  AlertCircle,
  TrendingUp,
  Calendar,
  Building2,
  CheckCircle,
  Clock
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

export default function DashboardCompliance() {
  const { data: documentos = [] } = useQuery({
    queryKey: ['biblioteca-compliance'],
    queryFn: () => base44.entities.BibliotecaCompliance.list()
  });

  const { data: empresas = [] } = useQuery({
    queryKey: ['empresas'],
    queryFn: () => base44.entities.Empresa.list()
  });

  // Função para determinar status
  const getStatus = (dataValidade) => {
    if (!dataValidade) return { label: "Sem Validade", status: "unknown" };
    
    const hoje = new Date();
    const validade = new Date(dataValidade);
    const diasRestantes = Math.ceil((validade - hoje) / (1000 * 60 * 60 * 24));

    if (diasRestantes < 0) {
      return { label: "Vencido", status: "vencido", dias: diasRestantes };
    } else if (diasRestantes <= 30) {
      return { label: "Vencendo", status: "vencendo", dias: diasRestantes };
    } else {
      return { label: "Vigente", status: "vigente", dias: diasRestantes };
    }
  };

  // Dados para gráficos
  const statusData = useMemo(() => {
    const docs = Array.isArray(documentos) ? documentos : [];
    const vencidos = docs.filter(d => getStatus(d.data_validade).status === "vencido").length;
    const vencendo = docs.filter(d => getStatus(d.data_validade).status === "vencendo").length;
    const vigentes = docs.filter(d => getStatus(d.data_validade).status === "vigente").length;
    const unknown = docs.filter(d => getStatus(d.data_validade).status === "unknown").length;

    return [
      { name: "Vigentes", value: vigentes, color: "#10b981" },
      { name: "Vencendo", value: vencendo, color: "#f59e0b" },
      { name: "Vencidos", value: vencidos, color: "#ef4444" },
      { name: "Sem Validade", value: unknown, color: "#6b7280" }
    ];
  }, [documentos]);

  // Dados por categoria
  const categoryData = useMemo(() => {
    const docs = Array.isArray(documentos) ? documentos : [];
    const categories = {
      "Jurídica": 0,
      "Fiscal/Trabalhista": 0,
      "Econômica": 0,
      "Técnica/Institucional": 0
    };

    docs.forEach(doc => {
      if (doc.categoria in categories) {
        categories[doc.categoria]++;
      }
    });

    return Object.entries(categories).map(([name, value]) => ({ name, value }));
  }, [documentos]);

  // Conformidade por empresa
  const complianceByCompany = useMemo(() => {
    const docs = Array.isArray(documentos) ? documentos : [];
    const empresasMap = {};

    // Inicializar com todas as empresas
    empresas.forEach(emp => {
      empresasMap[emp.id] = {
        nome: emp.nome_fantasia,
        total: 0,
        vigentes: 0,
        vencendo: 0,
        vencidos: 0,
        score: 0
      };
    });

    // Contar documentos
    docs.forEach(doc => {
      const empId = doc.empresa_id || "global";
      if (empId === "global") return; // Ignorar documentos globais

      if (!empresasMap[empId]) {
        empresasMap[empId] = {
          nome: "Desconhecida",
          total: 0,
          vigentes: 0,
          vencendo: 0,
          vencidos: 0,
          score: 0
        };
      }

      empresasMap[empId].total++;

      const status = getStatus(doc.data_validade);
      if (status.status === "vigente") empresasMap[empId].vigentes++;
      else if (status.status === "vencendo") empresasMap[empId].vencendo++;
      else if (status.status === "vencido") empresasMap[empId].vencidos++;
    });

    // Calcular score de conformidade
    Object.keys(empresasMap).forEach(empId => {
      const emp = empresasMap[empId];
      if (emp.total > 0) {
        emp.score = Math.round((emp.vigentes / emp.total) * 100);
      }
    });

    return Object.values(empresasMap)
      .filter(e => e.total > 0)
      .sort((a, b) => b.total - a.total);
  }, [documentos, empresas]);

  // Timeline de vencimentos
  const upcomingExpirations = useMemo(() => {
    const docs = Array.isArray(documentos) ? documentos : [];
    return docs
      .filter(d => {
        const status = getStatus(d.data_validade);
        return status.status === "vencendo";
      })
      .sort((a, b) => new Date(a.data_validade) - new Date(b.data_validade))
      .slice(0, 5);
  }, [documentos]);

  // Documentos críticos (vencidos)
  const criticalDocs = useMemo(() => {
    const docs = Array.isArray(documentos) ? documentos : [];
    return docs
      .filter(d => getStatus(d.data_validade).status === "vencido")
      .slice(0, 5);
  }, [documentos]);

  const COLORS = ["#10b981", "#f59e0b", "#ef4444", "#6b7280"];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 p-6">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div>
          <h1 className="text-4xl font-bold text-foreground tracking-tight">
            Dashboard de Compliance
          </h1>
          <p className="text-muted-foreground mt-2">
            Visão geral de documentos, alertas críticos e conformidade por empresa
          </p>
        </div>

        {/* KPIs */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="glass-panel">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Total de Docs</p>
                  <p className="text-3xl font-bold text-foreground">
                    {documentos.length}
                  </p>
                </div>
                <FileCheck className="w-8 h-8 text-primary" />
              </div>
            </CardContent>
          </Card>

          <Card className="glass-panel border-emerald-500/20">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-emerald-400">Vigentes</p>
                  <p className="text-3xl font-bold text-emerald-300">
                    {documentos.filter(d => getStatus(d.data_validade).status === "vigente").length}
                  </p>
                </div>
                <CheckCircle className="w-8 h-8 text-emerald-500" />
              </div>
            </CardContent>
          </Card>

          <Card className="glass-panel border-amber-500/20">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-amber-400">Vencendo</p>
                  <p className="text-3xl font-bold text-amber-300">
                    {documentos.filter(d => getStatus(d.data_validade).status === "vencendo").length}
                  </p>
                </div>
                <Clock className="w-8 h-8 text-amber-500" />
              </div>
            </CardContent>
          </Card>

          <Card className="glass-panel border-red-500/20">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-red-400">Vencidos</p>
                  <p className="text-3xl font-bold text-red-300">
                    {documentos.filter(d => getStatus(d.data_validade).status === "vencido").length}
                  </p>
                </div>
                <AlertCircle className="w-8 h-8 text-red-500" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Gráficos principais */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Pizza de Status */}
          <Card className="glass-panel">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-primary" />
                Distribuição por Status
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={statusData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, value }) => `${name}: ${value}`}
                    outerRadius={100}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {statusData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Barras de Categoria */}
          <Card className="glass-panel">
            <CardHeader>
              <CardTitle>Documentos por Categoria</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={categoryData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#444" />
                  <XAxis dataKey="name" stroke="#999" />
                  <YAxis stroke="#999" />
                  <Tooltip contentStyle={{ backgroundColor: "#1f2937", border: "1px solid #444" }} />
                  <Bar dataKey="value" fill="#f59e0b" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>

        {/* Alertas Críticos */}
        {criticalDocs.length > 0 && (
          <Card className="glass-panel border-red-500/20 bg-red-950/10">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-red-400">
                <AlertCircle className="w-5 h-5" />
                Alertas Críticos - Documentos Vencidos
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {criticalDocs.map((doc) => (
                  <div key={doc.id} className="flex items-center justify-between p-3 bg-red-950/20 rounded border border-red-500/30">
                    <div className="flex-1">
                      <p className="font-medium text-red-200">{doc.nome_documento}</p>
                      <p className="text-sm text-red-300">
                        Vencido desde: {new Date(doc.data_validade).toLocaleDateString('pt-BR')}
                      </p>
                    </div>
                    <Badge className="bg-red-600 text-white">Vencido</Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Próximos Vencimentos */}
        {upcomingExpirations.length > 0 && (
          <Card className="glass-panel border-amber-500/20">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-amber-400">
                <Calendar className="w-5 h-5" />
                Próximos Vencimentos (30 dias)
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {upcomingExpirations.map((doc) => {
                  const dias = getStatus(doc.data_validade).dias;
                  return (
                    <div key={doc.id} className="flex items-center justify-between p-3 bg-amber-950/20 rounded border border-amber-500/30">
                      <div className="flex-1">
                        <p className="font-medium text-amber-200">{doc.nome_documento}</p>
                        <p className="text-sm text-amber-300">
                          Vence em: {new Date(doc.data_validade).toLocaleDateString('pt-BR')}
                        </p>
                      </div>
                      <Badge className="bg-amber-600 text-white">{dias}d</Badge>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Conformidade por Empresa */}
        {complianceByCompany.length > 0 && (
          <Card className="glass-panel">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building2 className="w-5 h-5 text-primary" />
                Conformidade por Empresa
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {complianceByCompany.map((emp) => (
                  <div key={emp.nome} className="p-4 bg-slate-800/50 rounded-lg border border-slate-700/50">
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="font-semibold text-foreground">{emp.nome}</h4>
                      <div className={cn(
                        "px-3 py-1 rounded-full text-sm font-bold",
                        emp.score >= 80 ? "bg-emerald-500/20 text-emerald-300" :
                        emp.score >= 50 ? "bg-amber-500/20 text-amber-300" :
                        "bg-red-500/20 text-red-300"
                      )}>
                        {emp.score}%
                      </div>
                    </div>

                    <div className="grid grid-cols-4 gap-2 text-sm">
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full bg-emerald-500" />
                        <span className="text-muted-foreground">
                          {emp.vigentes} Vigentes
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full bg-amber-500" />
                        <span className="text-muted-foreground">
                          {emp.vencendo} Vencendo
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full bg-red-500" />
                        <span className="text-muted-foreground">
                          {emp.vencidos} Vencidos
                        </span>
                      </div>
                      <div className="text-right text-muted-foreground">
                        Total: {emp.total}
                      </div>
                    </div>

                    {/* Barra de progresso */}
                    <div className="mt-3 w-full h-2 bg-slate-700 rounded-full overflow-hidden">
                      <div
                        className={cn(
                          "h-full transition-all",
                          emp.score >= 80 ? "bg-emerald-500" :
                          emp.score >= 50 ? "bg-amber-500" :
                          "bg-red-500"
                        )}
                        style={{ width: `${emp.score}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}