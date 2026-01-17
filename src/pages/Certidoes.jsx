import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import CertidaoAlert from "@/components/dashboard/CertidaoAlert";
import { 
  FileCheck, 
  Plus, 
  Search, 
  AlertTriangle,
  CheckCircle,
  Clock,
  XCircle,
  Building2,
  ExternalLink,
  Upload,
  MoreVertical,
  Pencil,
  Trash2,
  RefreshCw
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
import moment from "moment";

const TIPOS_CERTIDAO = [
  "FGTS - CRF",
  "INSS - CND",
  "Federal - PGFN",
  "Estadual - SEFAZ",
  "Municipal - ISS",
  "Trabalhista - CNDT",
  "Falência - TJPE",
  "CREA - CRQ",
  "CAU - CRQ",
  "SICAF",
  "Recife em Dia",
  "TCE",
  "Outro"
];

const LINKS_EMISSAO = {
  "FGTS - CRF": "https://consulta-crf.caixa.gov.br/consultacrf/pages/consultaEmpregador.jsf",
  "INSS - CND": "https://solucoes.receita.fazenda.gov.br/Servicos/CertidaoInternet/PJ/Emitir",
  "Federal - PGFN": "https://solucoes.receita.fazenda.gov.br/Servicos/CertidaoInternet/PJ/Emitir",
  "Trabalhista - CNDT": "https://www.tst.jus.br/certidao",
  "Falência - TJPE": "https://srv01.tjpe.jus.br/certidaonegativadebito/",
  "SICAF": "https://www3.comprasnet.gov.br/sicaf-web/",
  "Recife em Dia": "https://recifeemdia.recife.pe.gov.br/"
};

export default function Certidoes() {
  const [showForm, setShowForm] = useState(false);
  const [editingCertidao, setEditingCertidao] = useState(null);
  const [deletingCertidao, setDeletingCertidao] = useState(null);
  const [statusFilter, setStatusFilter] = useState("all");
  const [empresaFilter, setEmpresaFilter] = useState("all");
  const [uploading, setUploading] = useState(false);
  
  const [formData, setFormData] = useState({
    empresa_id: "",
    tipo: "",
    orgao_emissor: "",
    numero_certidao: "",
    data_emissao: "",
    data_validade: "",
    arquivo_url: "",
    link_emissao: "",
    observacoes: ""
  });
  
  const queryClient = useQueryClient();

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const empresaId = params.get('empresa');
    if (empresaId) {
      setEmpresaFilter(empresaId);
    }
  }, []);

  const { data: certidoes = [], isLoading } = useQuery({
    queryKey: ['certidoes'],
    queryFn: () => base44.entities.Certidao.list()
  });

  const { data: empresas = [] } = useQuery({
    queryKey: ['empresas'],
    queryFn: () => base44.entities.Empresa.list()
  });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.Certidao.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['certidoes'] });
      resetForm();
    }
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Certidao.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['certidoes'] });
      resetForm();
    }
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.Certidao.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['certidoes'] });
      setDeletingCertidao(null);
    }
  });

  const resetForm = () => {
    setShowForm(false);
    setEditingCertidao(null);
    setFormData({
      empresa_id: "",
      tipo: "",
      orgao_emissor: "",
      numero_certidao: "",
      data_emissao: "",
      data_validade: "",
      arquivo_url: "",
      link_emissao: "",
      observacoes: ""
    });
  };

  const handleEdit = (certidao) => {
    setEditingCertidao(certidao);
    setFormData({
      empresa_id: certidao.empresa_id || "",
      tipo: certidao.tipo || "",
      orgao_emissor: certidao.orgao_emissor || "",
      numero_certidao: certidao.numero_certidao || "",
      data_emissao: certidao.data_emissao || "",
      data_validade: certidao.data_validade || "",
      arquivo_url: certidao.arquivo_url || "",
      link_emissao: certidao.link_emissao || "",
      observacoes: certidao.observacoes || ""
    });
    setShowForm(true);
  };

  const handleTipoChange = (tipo) => {
    setFormData(f => ({
      ...f,
      tipo,
      link_emissao: LINKS_EMISSAO[tipo] || ""
    }));
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    setUploading(true);
    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      setFormData(f => ({ ...f, arquivo_url: file_url }));
    } catch (error) {
      console.error("Erro no upload:", error);
    }
    setUploading(false);
  };

  const getStatus = (certidao) => {
    if (!certidao.data_validade) return { status: "pendente", label: "Pendente" };
    const dias = moment(certidao.data_validade).diff(moment(), 'days');
    if (dias < 0) return { status: "vencido", label: "Vencido" };
    if (dias <= 10) return { status: "critico", label: "Crítico" };
    if (dias <= 30) return { status: "alerta", label: "Alerta" };
    return { status: "valida", label: "Válida" };
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const status = getStatus({ data_validade: formData.data_validade });
    const data = { ...formData, status: status.status === "valida" ? "valida" : status.status };
    
    if (editingCertidao) {
      await updateMutation.mutateAsync({ id: editingCertidao.id, data });
    } else {
      await createMutation.mutateAsync(data);
    }
  };

  const filteredCertidoes = certidoes.filter(c => {
    const matchEmpresa = empresaFilter === "all" || c.empresa_id === empresaFilter;
    const status = getStatus(c);
    const matchStatus = statusFilter === "all" || status.status === statusFilter;
    return matchEmpresa && matchStatus;
  });

  const getEmpresaNome = (empresaId) => {
    return empresas.find(e => e.id === empresaId)?.nome_fantasia || "—";
  };

  const statusCounts = {
    all: certidoes.length,
    valida: certidoes.filter(c => getStatus(c).status === "valida").length,
    alerta: certidoes.filter(c => ["alerta", "critico"].includes(getStatus(c).status)).length,
    vencido: certidoes.filter(c => getStatus(c).status === "vencido").length,
    pendente: certidoes.filter(c => getStatus(c).status === "pendente").length
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-50">
      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-slate-900 tracking-tight">
              Gestão de Certidões
            </h1>
            <p className="text-slate-500 mt-1">
              Monitore validades e mantenha a conformidade
            </p>
          </div>
          <Button 
            onClick={() => setShowForm(true)}
            className="gap-2 bg-slate-900 hover:bg-slate-800"
          >
            <Plus className="w-4 h-4" />
            Nova Certidão
          </Button>
        </div>

        {/* Filters */}
        <div className="flex flex-col lg:flex-row gap-4 mb-6">
          <Select value={empresaFilter} onValueChange={setEmpresaFilter}>
            <SelectTrigger className="w-full lg:w-64 h-12 bg-white">
              <Building2 className="w-4 h-4 mr-2 text-slate-400" />
              <SelectValue placeholder="Filtrar por empresa" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas as empresas</SelectItem>
              {empresas.map(e => (
                <SelectItem key={e.id} value={e.id}>{e.nome_fantasia}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Tabs value={statusFilter} onValueChange={setStatusFilter} className="flex-1 bg-white rounded-lg border border-slate-200">
            <TabsList className="h-12 p-1 bg-transparent w-full justify-start">
              <TabsTrigger value="all" className="gap-1">
                Todas <Badge variant="secondary">{statusCounts.all}</Badge>
              </TabsTrigger>
              <TabsTrigger value="valida" className="gap-1 data-[state=active]:bg-emerald-100 data-[state=active]:text-emerald-700">
                <CheckCircle className="w-3 h-3" />
                Válidas <Badge variant="secondary" className="bg-emerald-100 text-emerald-700">{statusCounts.valida}</Badge>
              </TabsTrigger>
              <TabsTrigger value="alerta" className="gap-1 data-[state=active]:bg-amber-100 data-[state=active]:text-amber-700">
                <AlertTriangle className="w-3 h-3" />
                Alerta <Badge variant="secondary" className="bg-amber-100 text-amber-700">{statusCounts.alerta}</Badge>
              </TabsTrigger>
              <TabsTrigger value="vencido" className="gap-1 data-[state=active]:bg-red-100 data-[state=active]:text-red-700">
                <XCircle className="w-3 h-3" />
                Vencidas <Badge variant="secondary" className="bg-red-100 text-red-700">{statusCounts.vencido}</Badge>
              </TabsTrigger>
              <TabsTrigger value="pendente" className="gap-1">
                <Clock className="w-3 h-3" />
                Pendentes <Badge variant="secondary">{statusCounts.pendente}</Badge>
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>

        {/* Content */}
        {isLoading ? (
          <div className="space-y-4">
            {[1, 2, 3, 4].map((i) => (
              <Card key={i} className="animate-pulse">
                <CardContent className="p-4">
                  <div className="h-6 bg-slate-200 rounded w-1/3" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : filteredCertidoes.length === 0 ? (
          <Card className="border-dashed border-2 border-slate-300">
            <CardContent className="py-16 text-center">
              <FileCheck className="w-16 h-16 text-slate-300 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-slate-700 mb-2">
                {statusFilter !== "all" || empresaFilter !== "all"
                  ? "Nenhuma certidão encontrada" 
                  : "Nenhuma certidão cadastrada"
                }
              </h3>
              <p className="text-slate-500 mb-6">
                {statusFilter !== "all" || empresaFilter !== "all"
                  ? "Ajuste os filtros para ver mais resultados"
                  : "Comece cadastrando as certidões das empresas"
                }
              </p>
              {statusFilter === "all" && empresaFilter === "all" && (
                <Button onClick={() => setShowForm(true)} className="gap-2">
                  <Plus className="w-4 h-4" />
                  Cadastrar Certidão
                </Button>
              )}
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {/* Agrupar por empresa */}
            {empresaFilter === "all" ? (
              empresas.map(empresa => {
                const empresaCertidoes = filteredCertidoes.filter(c => c.empresa_id === empresa.id);
                if (empresaCertidoes.length === 0) return null;
                
                return (
                  <Card key={empresa.id} className="border-slate-200">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-lg flex items-center gap-2">
                        <Building2 className="w-5 h-5 text-slate-400" />
                        {empresa.nome_fantasia}
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      {empresaCertidoes.map((certidao) => (
                        <CertidaoRow 
                          key={certidao.id} 
                          certidao={certidao}
                          onEdit={() => handleEdit(certidao)}
                          onDelete={() => setDeletingCertidao(certidao)}
                        />
                      ))}
                    </CardContent>
                  </Card>
                );
              })
            ) : (
              <Card className="border-slate-200">
                <CardContent className="p-4 space-y-3">
                  {filteredCertidoes.map((certidao) => (
                    <CertidaoRow 
                      key={certidao.id} 
                      certidao={certidao}
                      onEdit={() => handleEdit(certidao)}
                      onDelete={() => setDeletingCertidao(certidao)}
                    />
                  ))}
                </CardContent>
              </Card>
            )}
          </div>
        )}

        {/* Modal de Criação/Edição */}
        <Dialog open={showForm} onOpenChange={(open) => !open && resetForm()}>
          <DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {editingCertidao ? "Editar Certidão" : "Nova Certidão"}
              </DialogTitle>
            </DialogHeader>
            
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <Label>Empresa *</Label>
                <Select 
                  value={formData.empresa_id} 
                  onValueChange={(v) => setFormData(f => ({ ...f, empresa_id: v }))}
                  required
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione a empresa" />
                  </SelectTrigger>
                  <SelectContent>
                    {empresas.map(e => (
                      <SelectItem key={e.id} value={e.id}>{e.nome_fantasia}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Tipo de Certidão *</Label>
                  <Select 
                    value={formData.tipo} 
                    onValueChange={handleTipoChange}
                    required
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione o tipo" />
                    </SelectTrigger>
                    <SelectContent>
                      {TIPOS_CERTIDAO.map(tipo => (
                        <SelectItem key={tipo} value={tipo}>{tipo}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Órgão Emissor</Label>
                  <Input
                    value={formData.orgao_emissor}
                    onChange={(e) => setFormData(f => ({ ...f, orgao_emissor: e.target.value }))}
                    placeholder="Ex: Receita Federal"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Número da Certidão</Label>
                <Input
                  value={formData.numero_certidao}
                  onChange={(e) => setFormData(f => ({ ...f, numero_certidao: e.target.value }))}
                  placeholder="Código/número de controle"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Data de Emissão</Label>
                  <Input
                    type="date"
                    value={formData.data_emissao}
                    onChange={(e) => setFormData(f => ({ ...f, data_emissao: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Data de Validade *</Label>
                  <Input
                    type="date"
                    value={formData.data_validade}
                    onChange={(e) => setFormData(f => ({ ...f, data_validade: e.target.value }))}
                    required
                  />
                </div>
              </div>

              {/* Upload */}
              <div className="space-y-2">
                <Label>Arquivo PDF</Label>
                <div className="flex items-center gap-4">
                  <label className="flex-1 flex items-center justify-center gap-2 p-4 border-2 border-dashed border-slate-300 rounded-lg cursor-pointer hover:bg-slate-50 transition-colors">
                    <Upload className="w-5 h-5 text-slate-400" />
                    <span className="text-sm text-slate-600">
                      {uploading ? "Enviando..." : formData.arquivo_url ? "Substituir arquivo" : "Fazer upload do PDF"}
                    </span>
                    <input 
                      type="file" 
                      accept=".pdf" 
                      className="hidden" 
                      onChange={handleFileUpload}
                      disabled={uploading}
                    />
                  </label>
                  {formData.arquivo_url && (
                    <a 
                      href={formData.arquivo_url} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="flex items-center gap-1 text-sm text-blue-600 hover:underline"
                    >
                      <FileCheck className="w-4 h-4" />
                      Ver
                    </a>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <Label>Link para Emissão</Label>
                <Input
                  type="url"
                  value={formData.link_emissao}
                  onChange={(e) => setFormData(f => ({ ...f, link_emissao: e.target.value }))}
                  placeholder="https://..."
                />
              </div>

              <div className="flex justify-end gap-3 pt-4">
                <Button type="button" variant="outline" onClick={resetForm}>
                  Cancelar
                </Button>
                <Button type="submit" className="bg-slate-900 hover:bg-slate-800">
                  {editingCertidao ? "Salvar Alterações" : "Cadastrar Certidão"}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>

        {/* Alert de Exclusão */}
        <AlertDialog open={!!deletingCertidao} onOpenChange={(open) => !open && setDeletingCertidao(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Excluir certidão?</AlertDialogTitle>
              <AlertDialogDescription>
                Tem certeza que deseja excluir esta certidão "{deletingCertidao?.tipo}"? 
                Esta ação não pode ser desfeita.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancelar</AlertDialogCancel>
              <AlertDialogAction 
                onClick={() => deleteMutation.mutate(deletingCertidao?.id)}
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

function CertidaoRow({ certidao, onEdit, onDelete }) {
  const diasRestantes = certidao.data_validade 
    ? moment(certidao.data_validade).diff(moment(), 'days')
    : null;

  const getStatus = () => {
    if (!diasRestantes && diasRestantes !== 0) return { color: "slate", label: "Pendente", icon: Clock };
    if (diasRestantes < 0) return { color: "red", label: "VENCIDO", icon: XCircle };
    if (diasRestantes <= 10) return { color: "red", label: `${diasRestantes}d - CRÍTICO`, icon: AlertTriangle };
    if (diasRestantes <= 30) return { color: "amber", label: `${diasRestantes} dias`, icon: AlertTriangle };
    return { color: "emerald", label: `${diasRestantes} dias`, icon: CheckCircle };
  };

  const status = getStatus();
  const StatusIcon = status.icon;

  const colorClasses = {
    red: "bg-red-50 border-red-200",
    amber: "bg-amber-50 border-amber-200",
    emerald: "bg-emerald-50 border-emerald-200",
    slate: "bg-slate-50 border-slate-200"
  };

  const badgeClasses = {
    red: "bg-red-100 text-red-700 border-red-200",
    amber: "bg-amber-100 text-amber-700 border-amber-200",
    emerald: "bg-emerald-100 text-emerald-700 border-emerald-200",
    slate: "bg-slate-100 text-slate-600 border-slate-200"
  };

  return (
    <div className={cn(
      "flex items-center justify-between p-4 rounded-xl border transition-all",
      colorClasses[status.color]
    )}>
      <div className="flex items-center gap-4">
        <StatusIcon className={cn(
          "w-5 h-5",
          status.color === "red" && "text-red-600",
          status.color === "amber" && "text-amber-600",
          status.color === "emerald" && "text-emerald-600",
          status.color === "slate" && "text-slate-400"
        )} />
        
        <div>
          <p className="font-semibold text-slate-900">{certidao.tipo}</p>
          <p className="text-sm text-slate-500">
            {certidao.orgao_emissor || "—"} 
            {certidao.data_validade && ` • Vence em ${moment(certidao.data_validade).format("DD/MM/YYYY")}`}
          </p>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <Badge className={cn("border", badgeClasses[status.color])}>
          {status.label}
        </Badge>

        {certidao.arquivo_url && (
          <a 
            href={certidao.arquivo_url} 
            target="_blank" 
            rel="noopener noreferrer"
            className="p-2 hover:bg-white rounded-lg transition-colors"
          >
            <FileCheck className="w-4 h-4 text-blue-600" />
          </a>
        )}

        {certidao.link_emissao && (
          <a 
            href={certidao.link_emissao} 
            target="_blank" 
            rel="noopener noreferrer"
            className="p-2 hover:bg-white rounded-lg transition-colors"
          >
            <RefreshCw className="w-4 h-4 text-slate-600" />
          </a>
        )}

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="h-8 w-8">
              <MoreVertical className="w-4 h-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={onEdit}>
              <Pencil className="w-4 h-4 mr-2" />
              Editar
            </DropdownMenuItem>
            <DropdownMenuItem onClick={onDelete} className="text-red-600">
              <Trash2 className="w-4 h-4 mr-2" />
              Excluir
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
}