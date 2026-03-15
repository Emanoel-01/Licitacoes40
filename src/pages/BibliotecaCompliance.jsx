import { useState, useMemo } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
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
  ResponsiveContainer
} from "recharts";
import { 
  FileCheck, 
  Plus, 
  Upload,
  Calendar,
  AlertCircle,
  CheckCircle,
  Clock,
  Trash2,
  Pencil,
  MoreVertical,
  Building2,
  ExternalLink,
  TrendingUp,
  Brain
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import IAComplianceAssistant from "@/components/compliance/IAComplianceAssistant";
import ExtrairDadosCertidao from "@/components/compliance/ExtrairDadosCertidao";

export default function BibliotecaCompliance() {
  const [showForm, setShowForm] = useState(false);
  const [editingDoc, setEditingDoc] = useState(null);
  const [deletingDoc, setDeletingDoc] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [filterCategoria, setFilterCategoria] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");
  const [showIAAssistant, setShowIAAssistant] = useState(false);
  
  const [formData, setFormData] = useState({
    empresa_id: "",
    nome_documento: "",
    categoria: "Jurídica",
    arquivo_url: "",
    data_emissao: "",
    data_validade: "",
    orgao_emissor: "",
    link_renovacao: "",
    numero_documento: "",
    renovacao_automatica: false,
    observacoes: ""
  });
  
  const queryClient = useQueryClient();

  const { data: documentos = [], isLoading } = useQuery({
    queryKey: ['biblioteca-compliance'],
    queryFn: () => base44.entities.BibliotecaCompliance.list()
  });

  const { data: empresas = [] } = useQuery({
    queryKey: ['empresas'],
    queryFn: () => base44.entities.Empresa.list()
  });

  // Função para determinar status
  const getStatusDetail = (dataValidade) => {
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
  const statusChartData = useMemo(() => {
    const docs = Array.isArray(documentos) ? documentos : [];
    const vencidos = docs.filter(d => getStatusDetail(d.data_validade).status === "vencido").length;
    const vencendo = docs.filter(d => getStatusDetail(d.data_validade).status === "vencendo").length;
    const vigentes = docs.filter(d => getStatusDetail(d.data_validade).status === "vigente").length;
    const unknown = docs.filter(d => getStatusDetail(d.data_validade).status === "unknown").length;

    return [
      { name: "Vigentes", value: vigentes, color: "#10b981" },
      { name: "Vencendo", value: vencendo, color: "#f59e0b" },
      { name: "Vencidos", value: vencidos, color: "#ef4444" },
      { name: "Sem Validade", value: unknown, color: "#6b7280" }
    ];
  }, [documentos]);

  const categoryChartData = useMemo(() => {
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

  const criticalDocs = useMemo(() => {
    const docs = Array.isArray(documentos) ? documentos : [];
    return docs
      .filter(d => getStatusDetail(d.data_validade).status === "vencido")
      .slice(0, 5);
  }, [documentos]);

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.BibliotecaCompliance.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['biblioteca-compliance'] });
      resetForm();
      toast.success("Documento adicionado com sucesso!");
    }
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.BibliotecaCompliance.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['biblioteca-compliance'] });
      resetForm();
      toast.success("Documento atualizado!");
    }
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.BibliotecaCompliance.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['biblioteca-compliance'] });
      setDeletingDoc(null);
      toast.success("Documento excluído!");
    }
  });

  const resetForm = () => {
    setShowForm(false);
    setEditingDoc(null);
    setFormData({
      empresa_id: "",
      nome_documento: "",
      categoria: "Jurídica",
      arquivo_url: "",
      data_emissao: "",
      data_validade: "",
      orgao_emissor: "",
      link_renovacao: "",
      numero_documento: "",
      renovacao_automatica: false,
      observacoes: ""
    });
  };

  const handleEdit = (doc) => {
    setEditingDoc(doc);
    setFormData({
      empresa_id: doc.empresa_id || "",
      nome_documento: doc.nome_documento || "",
      categoria: doc.categoria || "Jurídica",
      arquivo_url: doc.arquivo_url || "",
      data_emissao: doc.data_emissao || "",
      data_validade: doc.data_validade || "",
      orgao_emissor: doc.orgao_emissor || "",
      link_renovacao: doc.link_renovacao || "",
      numero_documento: doc.numero_documento || "",
      renovacao_automatica: doc.renovacao_automatica || false,
      observacoes: doc.observacoes || ""
    });
    setShowForm(true);
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setUploading(true);
    try {
      const { data } = await base44.integrations.Core.UploadFile({ file });
      setFormData(f => ({ ...f, arquivo_url: data.file_url }));
      toast.success("Arquivo enviado!");
    } catch (error) {
      toast.error("Erro ao enviar arquivo");
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (editingDoc) {
      await updateMutation.mutateAsync({ id: editingDoc.id, data: formData });
    } else {
      await createMutation.mutateAsync(formData);
    }
  };

  const getStatus = (dataValidade) => {
    if (!dataValidade) return { label: "Sem Validade", color: "bg-slate-100 text-slate-700", icon: Clock };
    
    const hoje = new Date();
    const validade = new Date(dataValidade);
    const diasRestantes = Math.ceil((validade - hoje) / (1000 * 60 * 60 * 24));

    if (diasRestantes < 0) {
      return { label: "Vencido", color: "bg-red-100 text-red-700 border-red-300", icon: AlertCircle };
    } else if (diasRestantes <= 30) {
      return { label: `Vence em ${diasRestantes}d`, color: "bg-amber-100 text-amber-700 border-amber-300", icon: Clock };
    } else {
      return { label: "Vigente", color: "bg-emerald-100 text-emerald-700 border-emerald-300", icon: CheckCircle };
    }
  };

  const getEmpresaNome = (empresaId) => {
    if (!empresaId) return "Todas as empresas";
    return empresas.find(e => e.id === empresaId)?.nome_fantasia || "—";
  };

  const categoriaColors = {
    "Jurídica": "bg-blue-100 text-blue-700 border-blue-300",
    "Fiscal/Trabalhista": "bg-purple-100 text-purple-700 border-purple-300",
    "Econômica": "bg-green-100 text-green-700 border-green-300",
    "Técnica/Institucional": "bg-orange-100 text-orange-700 border-orange-300"
  };

  // Ordenar e filtrar documentos
  const sortedDocs = Array.isArray(documentos) ? [...documentos].sort((a, b) => {
    const statusA = getStatus(a.data_validade).label;
    const statusB = getStatus(b.data_validade).label;
    const priority = { "Vencido": 0, "Vence em": 1, "Vigente": 2, "Sem Validade": 3 };
    return (priority[statusA] || 4) - (priority[statusB] || 4);
  }) : [];

  const filteredDocs = sortedDocs.filter(doc => {
    if (filterCategoria !== "all" && doc.categoria !== filterCategoria) return false;
    
    if (filterStatus !== "all") {
      const status = getStatus(doc.data_validade);
      if (filterStatus === "vencido" && status.label !== "Vencido") return false;
      if (filterStatus === "vencendo" && !status.label.includes("Vence em")) return false;
      if (filterStatus === "vigente" && status.label !== "Vigente") return false;
    }
    
    return true;
  });

  // Estatísticas
  const stats = {
    total: documentos.length,
    vencidos: documentos.filter(d => getStatus(d.data_validade).label === "Vencido").length,
    vencendo: documentos.filter(d => getStatus(d.data_validade).label.includes("Vence em")).length,
    vigentes: documentos.filter(d => getStatus(d.data_validade).label === "Vigente").length
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 p-4 sm:p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6 sm:mb-8 gap-4">
          <div className="min-w-0 flex-1">
            <h1 className="text-2xl sm:text-3xl font-bold text-foreground tracking-tight">
              Biblioteca de Compliance
            </h1>
            <p className="text-muted-foreground mt-1 text-sm">
              Gestão de documentos de habilitação e conformidade
            </p>
          </div>
          <div className="flex gap-2 w-full sm:w-auto">
            <Button 
              variant="outline"
              onClick={() => setShowIAAssistant(v => !v)}
              className="gap-2 flex-1 sm:flex-none border-primary/40 text-primary hover:bg-primary/10"
            >
              <Brain className="w-4 h-4" />
              <span className="hidden sm:inline">Assistente IA</span>
              <span className="sm:hidden">IA</span>
            </Button>
            <Button 
              onClick={() => setShowForm(true)}
              className="gap-2 flex-1 sm:flex-none"
            >
              <Plus className="w-4 h-4" />
              <span className="hidden sm:inline">Adicionar Documento</span>
              <span className="sm:hidden">Adicionar</span>
            </Button>
          </div>
        </div>

        {/* Estatísticas */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-6">
          <Card className="glass-panel">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Total</p>
                  <p className="text-2xl font-bold text-foreground">{stats.total}</p>
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
                  <p className="text-2xl font-bold text-emerald-300">{stats.vigentes}</p>
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
                  <p className="text-2xl font-bold text-amber-300">{stats.vencendo}</p>
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
                  <p className="text-2xl font-bold text-red-300">{stats.vencidos}</p>
                </div>
                <AlertCircle className="w-8 h-8 text-red-500" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Gráficos de Análise */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 mb-6">
          {/* Pizza de Status */}
          <Card className="glass-panel">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-primary" />
                Distribuição por Status
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={250}>
                <PieChart>
                  <Pie
                    data={statusChartData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, value }) => `${name}: ${value}`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {statusChartData.map((entry, index) => (
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
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={categoryChartData}>
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
          <Card className="glass-panel border-red-500/20 bg-red-950/10 mb-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-red-400">
                <AlertCircle className="w-5 h-5" />
                Alertas Críticos - Documentos Vencidos
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
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

        {/* Filtros */}
        <Card className="glass-panel mb-6">
          <CardContent className="p-3 sm:p-4">
            <div className="flex flex-col sm:flex-row flex-wrap gap-3 sm:gap-4 items-start sm:items-end">
              <div className="flex-1 min-w-full sm:min-w-[200px]">
                <Label className="text-xs sm:text-sm text-muted-foreground mb-2 block">Categoria</Label>
                <Select value={filterCategoria} onValueChange={setFilterCategoria}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todas</SelectItem>
                    <SelectItem value="Jurídica">Jurídica</SelectItem>
                    <SelectItem value="Fiscal/Trabalhista">Fiscal/Trabalhista</SelectItem>
                    <SelectItem value="Econômica">Econômica</SelectItem>
                    <SelectItem value="Técnica/Institucional">Técnica/Institucional</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex-1 min-w-full sm:min-w-[200px]">
                <Label className="text-xs sm:text-sm text-muted-foreground mb-2 block">Status</Label>
                <Select value={filterStatus} onValueChange={setFilterStatus}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos</SelectItem>
                    <SelectItem value="vigente">Vigentes</SelectItem>
                    <SelectItem value="vencendo">Vencendo (30 dias)</SelectItem>
                    <SelectItem value="vencido">Vencidos</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <Button 
                variant="outline" 
                onClick={() => { setFilterCategoria("all"); setFilterStatus("all"); }}
                className="w-full sm:w-auto"
              >
                Limpar Filtros
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Lista de Documentos */}
        {isLoading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <Card key={i} className="glass-panel animate-pulse">
                <CardContent className="p-6">
                  <div className="h-6 bg-slate-700 rounded w-1/3" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : filteredDocs.length === 0 ? (
          <Card className="glass-panel border-dashed border-2">
            <CardContent className="py-16 text-center">
              <FileCheck className="w-16 h-16 text-slate-600 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-foreground mb-2">
                Nenhum documento encontrado
              </h3>
              <p className="text-muted-foreground mb-6">
                Adicione documentos à biblioteca de compliance
              </p>
              <Button onClick={() => setShowForm(true)} className="gap-2">
                <Plus className="w-4 h-4" />
                Adicionar Primeiro Documento
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {filteredDocs.map((doc) => {
              const status = getStatus(doc.data_validade);
              const StatusIcon = status.icon;

              return (
                <Card key={doc.id} className="glass-panel tech-border">
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-3">
                          <h3 className="text-lg font-semibold text-foreground">
                            {doc.nome_documento}
                          </h3>
                          <Badge className={cn("border", categoriaColors[doc.categoria])}>
                            {doc.categoria}
                          </Badge>
                          <Badge className={cn("border flex items-center gap-1", status.color)}>
                            <StatusIcon className="w-3 h-3" />
                            {status.label}
                          </Badge>
                          {doc.renovacao_automatica && (
                            <Badge variant="outline" className="text-blue-400 border-blue-500">
                              Auto-Renovação
                            </Badge>
                          )}
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-muted-foreground mb-3">
                          {doc.orgao_emissor && (
                            <div>
                              <span className="text-slate-500">Emissor:</span> {doc.orgao_emissor}
                            </div>
                          )}
                          {doc.numero_documento && (
                            <div className="font-mono">
                              <span className="text-slate-500">Nº:</span> {doc.numero_documento}
                            </div>
                          )}
                          {doc.data_emissao && (
                            <div>
                              <span className="text-slate-500">Emissão:</span>{" "}
                              {new Date(doc.data_emissao).toLocaleDateString('pt-BR')}
                            </div>
                          )}
                          {doc.data_validade && (
                            <div>
                              <span className="text-slate-500">Validade:</span>{" "}
                              {new Date(doc.data_validade).toLocaleDateString('pt-BR')}
                            </div>
                          )}
                          <div className="flex items-center gap-2">
                            <Building2 className="w-4 h-4" />
                            {getEmpresaNome(doc.empresa_id)}
                          </div>
                        </div>

                        <div className="flex items-center gap-3">
                          {doc.arquivo_url && (
                            <Button
                              variant="outline"
                              size="sm"
                              className="gap-2"
                              onClick={() => window.open(doc.arquivo_url, '_blank')}
                            >
                              <FileCheck className="w-4 h-4" />
                              Ver Documento
                            </Button>
                          )}
                          {doc.link_renovacao && (
                            <Button
                              variant="ghost"
                              size="sm"
                              className="gap-2 text-blue-400"
                              onClick={() => window.open(doc.link_renovacao, '_blank')}
                            >
                              <ExternalLink className="w-4 h-4" />
                              Portal de Renovação
                            </Button>
                          )}
                        </div>
                      </div>

                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreVertical className="w-4 h-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => handleEdit(doc)}>
                            <Pencil className="w-4 h-4 mr-2" />
                            Editar
                          </DropdownMenuItem>
                          <DropdownMenuItem 
                            onClick={() => setDeletingDoc(doc)}
                            className="text-red-600"
                          >
                            <Trash2 className="w-4 h-4 mr-2" />
                            Excluir
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}

        {/* Modal de Criação/Edição */}
        <Dialog open={showForm} onOpenChange={(open) => !open && resetForm()}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto w-full mx-4 sm:mx-0">
            <DialogHeader>
              <DialogTitle>
                {editingDoc ? "Editar Documento" : "Novo Documento de Compliance"}
              </DialogTitle>
            </DialogHeader>
            
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <Label>Nome do Documento *</Label>
                <Input
                  value={formData.nome_documento}
                  onChange={(e) => setFormData(f => ({ ...f, nome_documento: e.target.value }))}
                  placeholder="Ex: Certidão Federal Conjunta"
                  required
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                <div className="space-y-2">
                  <Label className="text-sm">Categoria *</Label>
                  <Select 
                    value={formData.categoria} 
                    onValueChange={(v) => setFormData(f => ({ ...f, categoria: v }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Jurídica">Jurídica</SelectItem>
                      <SelectItem value="Fiscal/Trabalhista">Fiscal/Trabalhista</SelectItem>
                      <SelectItem value="Econômica">Econômica</SelectItem>
                      <SelectItem value="Técnica/Institucional">Técnica/Institucional</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label className="text-sm">Empresa (opcional)</Label>
                  <Select 
                    value={formData.empresa_id || "global"} 
                    onValueChange={(v) => setFormData(f => ({ ...f, empresa_id: v === "global" ? "" : v }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="global">Todas as empresas</SelectItem>
                      {empresas.map(e => (
                        <SelectItem key={e.id} value={e.id}>{e.nome_fantasia}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Upload do Documento (PDF/Imagem)</Label>
                <div className="flex items-center gap-3">
                  <Input
                    type="file"
                    accept=".pdf,.jpg,.jpeg,.png"
                    onChange={handleFileUpload}
                    disabled={uploading}
                  />
                  {uploading && <span className="text-sm text-muted-foreground">Enviando...</span>}
                </div>
                {formData.arquivo_url && (
                  <p className="text-xs text-emerald-400">✓ Arquivo anexado</p>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Órgão Emissor</Label>
                  <Input
                    value={formData.orgao_emissor}
                    onChange={(e) => setFormData(f => ({ ...f, orgao_emissor: e.target.value }))}
                    placeholder="Ex: Receita Federal"
                  />
                </div>

                <div className="space-y-2">
                  <Label>Número do Documento</Label>
                  <Input
                    value={formData.numero_documento}
                    onChange={(e) => setFormData(f => ({ ...f, numero_documento: e.target.value }))}
                    placeholder="Ex: 123.456.789-00"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                <div className="space-y-2">
                  <Label className="text-sm">Data de Emissão</Label>
                  <Input
                    type="date"
                    value={formData.data_emissao}
                    onChange={(e) => setFormData(f => ({ ...f, data_emissao: e.target.value }))}
                  />
                </div>

                <div className="space-y-2">
                  <Label className="text-sm">Data de Validade</Label>
                  <Input
                    type="date"
                    value={formData.data_validade}
                    onChange={(e) => setFormData(f => ({ ...f, data_validade: e.target.value }))}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Link de Renovação (Portal)</Label>
                <Input
                  type="url"
                  value={formData.link_renovacao}
                  onChange={(e) => setFormData(f => ({ ...f, link_renovacao: e.target.value }))}
                  placeholder="https://..."
                />
                <p className="text-xs text-slate-500">
                  URL do portal para renovação automática
                </p>
              </div>

              <div className="space-y-2">
                <Label>Observações</Label>
                <Textarea
                  value={formData.observacoes}
                  onChange={(e) => setFormData(f => ({ ...f, observacoes: e.target.value }))}
                  rows={3}
                  placeholder="Informações adicionais sobre o documento"
                />
              </div>

              <div className="flex items-center gap-3 p-4 bg-slate-800 rounded-lg">
                <Switch
                  checked={formData.renovacao_automatica}
                  onCheckedChange={(checked) => setFormData(f => ({ ...f, renovacao_automatica: checked }))}
                />
                <div>
                  <Label className="font-medium">Renovação Automática</Label>
                  <p className="text-xs text-slate-400">Permitir que o robô renove este documento automaticamente</p>
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4">
                <Button type="button" variant="outline" onClick={resetForm}>
                  Cancelar
                </Button>
                <Button type="submit">
                  {editingDoc ? "Salvar Alterações" : "Adicionar Documento"}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>

        {/* Alert de Exclusão */}
        <AlertDialog open={!!deletingDoc} onOpenChange={(open) => !open && setDeletingDoc(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Excluir documento?</AlertDialogTitle>
              <AlertDialogDescription>
                Tem certeza que deseja excluir "{deletingDoc?.nome_documento}"? 
                Esta ação não pode ser desfeita.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancelar</AlertDialogCancel>
              <AlertDialogAction 
                onClick={() => deleteMutation.mutate(deletingDoc?.id)}
                className="bg-red-600 hover:bg-red-700"
              >
                Excluir
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  );
}