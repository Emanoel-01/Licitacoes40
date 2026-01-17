import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Trash2, Plus, Globe, Database, Lock, AlertCircle, CheckCircle, Clock, Pencil, MoreVertical } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
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

export default function FontesConsultas() {
  const queryClient = useQueryClient();

  const [deletingFonte, setDeletingFonte] = useState(null);
  const [editingFonte, setEditingFonte] = useState(null);
  const [showForm, setShowForm] = useState(false);
  
  const [formData, setFormData] = useState({
    nome_fonte: "",
    esfera: "Municipal",
    uf: "PE",
    municipio: "",
    tipo_documento: "Certidão FGTS",
    url: "",
    requer_autenticacao: false,
    usuario_login: "",
    senha_login: "",
    tipo_autenticacao: "Nenhuma",
    instrucoes_ia: "",
    status_integracao: "Ativo",
    observacoes: ""
  });

  const { data: fontes = [], isLoading } = useQuery({
    queryKey: ['fontes'],
    queryFn: () => base44.entities.FonteConsulta.list()
  });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.FonteConsulta.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['fontes'] });
      resetForm();
    }
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.FonteConsulta.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['fontes'] });
      resetForm();
    }
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.FonteConsulta.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['fontes'] });
      setDeletingFonte(null);
    }
  });

  useEffect(() => {
    if (formData.esfera === "Federal") {
      setFormData(prev => ({ ...prev, uf: "", municipio: "" }));
    } else if (formData.esfera === "Estadual") {
      setFormData(prev => ({ ...prev, municipio: "" }));
    }
  }, [formData.esfera]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSelectChange = (name, value) => {
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const resetForm = () => {
    setShowForm(false);
    setEditingFonte(null);
    setFormData({
      nome_fonte: "",
      esfera: "Municipal",
      uf: "PE",
      municipio: "",
      tipo_documento: "Certidão FGTS",
      url: "",
      requer_autenticacao: false,
      usuario_login: "",
      senha_login: "",
      tipo_autenticacao: "Nenhuma",
      instrucoes_ia: "",
      status_integracao: "Ativo",
      observacoes: ""
    });
  };

  const handleEdit = (fonte) => {
    setEditingFonte(fonte);
    setFormData({
      nome_fonte: fonte.nome_fonte || "",
      esfera: fonte.esfera || "Municipal",
      uf: fonte.uf || "",
      municipio: fonte.municipio || "",
      tipo_documento: fonte.tipo_documento || "Certidão FGTS",
      url: fonte.url || "",
      requer_autenticacao: fonte.requer_autenticacao || false,
      usuario_login: fonte.usuario_login || "",
      senha_login: fonte.senha_login || "",
      tipo_autenticacao: fonte.tipo_autenticacao || "Nenhuma",
      instrucoes_ia: fonte.instrucoes_ia || "",
      status_integracao: fonte.status_integracao || "Ativo",
      observacoes: fonte.observacoes || ""
    });
    setShowForm(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (editingFonte) {
      await updateMutation.mutateAsync({ id: editingFonte.id, data: formData });
    } else {
      await createMutation.mutateAsync(formData);
    }
  };

  const esferaColors = {
    Federal: "bg-blue-100 text-blue-700 border-blue-200",
    Estadual: "bg-purple-100 text-purple-700 border-purple-200",
    Municipal: "bg-green-100 text-green-700 border-green-200",
    Outros: "bg-slate-100 text-slate-700 border-slate-200"
  };

  const statusColors = {
    Ativo: { color: "bg-emerald-100 text-emerald-700 border-emerald-300", icon: CheckCircle },
    Inativo: { color: "bg-slate-100 text-slate-700 border-slate-300", icon: AlertCircle },
    "Em Testes": { color: "bg-amber-100 text-amber-700 border-amber-300", icon: Clock },
    Erro: { color: "bg-red-100 text-red-700 border-red-300", icon: AlertCircle },
    "Manutenção": { color: "bg-orange-100 text-orange-700 border-orange-300", icon: Clock }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-50">
      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-slate-900 tracking-tight">
              Gerenciador de Fontes de Busca
            </h1>
            <p className="text-slate-500 mt-1">
              Ensine o Robô onde buscar certidões e editais
            </p>
          </div>
          <div className="flex items-center gap-2 text-slate-600">
            <Database className="w-5 h-5" />
            <span className="font-medium">{fontes.length} fontes cadastradas</span>
          </div>
        </div>

        {/* Listagem de Fontes */}
        <div className="space-y-4">
          {isLoading ? (
            [1, 2, 3].map((i) => (
              <Card key={i} className="animate-pulse">
                <CardContent className="p-6">
                  <div className="h-6 bg-slate-200 rounded w-1/3" />
                </CardContent>
              </Card>
            ))
          ) : fontes.length === 0 ? (
            <Card className="border-dashed border-2 border-slate-300">
              <CardContent className="py-16 text-center">
                <Database className="w-16 h-16 text-slate-300 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-slate-700 mb-2">
                  Nenhuma fonte cadastrada
                </h3>
                <p className="text-slate-500 mb-6">
                  Adicione a primeira fonte para começar
                </p>
                <Button onClick={() => setShowForm(true)} className="gap-2">
                  <Plus className="w-4 h-4" />
                  Criar Primeira Fonte
                </Button>
              </CardContent>
            </Card>
          ) : (
            fontes.map((fonte) => {
              const statusConfig = statusColors[fonte.status_integracao] || statusColors["Inativo"];
              const StatusIcon = statusConfig.icon;
              
              return (
                <Card key={fonte.id} className="border-slate-200">
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-3">
                          <h3 className="text-lg font-semibold text-slate-900">
                            {fonte.nome_fonte || `Fonte ${fonte.tipo_documento}`}
                          </h3>
                          <Badge variant="outline" className={cn("border", esferaColors[fonte.esfera])}>
                            {fonte.esfera}
                          </Badge>
                          <Badge variant="outline" className={cn("border flex items-center gap-1", statusConfig.color)}>
                            <StatusIcon className="w-3 h-3" />
                            {fonte.status_integracao}
                          </Badge>
                          {fonte.requer_autenticacao && (
                            <Badge variant="outline" className="text-amber-600 border-amber-300">
                              <Lock className="w-3 h-3 mr-1" />
                              Login
                            </Badge>
                          )}
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm text-slate-600 mb-3">
                          <div>
                            <span className="text-slate-500">Tipo:</span> {fonte.tipo_documento}
                          </div>
                          <div>
                            <span className="text-slate-500">Local:</span>{" "}
                            {fonte.esfera === "Federal" ? "Brasil" : 
                             fonte.esfera === "Estadual" ? `${fonte.uf}` : 
                             `${fonte.municipio} - ${fonte.uf}`}
                          </div>
                          {fonte.tipo_autenticacao && fonte.tipo_autenticacao !== "Nenhuma" && (
                            <div>
                              <span className="text-slate-500">Autenticação:</span> {fonte.tipo_autenticacao}
                            </div>
                          )}
                        </div>

                        <a 
                          href={fonte.url} 
                          target="_blank" 
                          rel="noreferrer" 
                          className="text-blue-600 hover:underline text-sm flex items-center gap-1"
                        >
                          <Globe className="w-4 h-4" />
                          {fonte.url}
                        </a>
                      </div>

                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreVertical className="w-4 h-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => handleEdit(fonte)}>
                            <Pencil className="w-4 h-4 mr-2" />
                            Editar
                          </DropdownMenuItem>
                          <DropdownMenuItem 
                            onClick={() => setDeletingFonte(fonte)}
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
            })
          )}
        </div>

        {/* Modal de Criação/Edição */}
        <Dialog open={showForm} onOpenChange={(open) => !open && resetForm()}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {editingFonte ? "Editar Fonte" : "Nova Fonte de Consulta"}
              </DialogTitle>
            </DialogHeader>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <Label>Nome da Fonte *</Label>
                <Input
                  name="nome_fonte"
                  value={formData.nome_fonte}
                  onChange={handleInputChange}
                  placeholder="Ex: Portal FGTS Nacional"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Esfera Administrativa</Label>
                  <Select 
                    value={formData.esfera} 
                    onValueChange={(val) => handleSelectChange("esfera", val)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Federal">🇧🇷 Federal</SelectItem>
                      <SelectItem value="Estadual">📍 Estadual</SelectItem>
                      <SelectItem value="Municipal">🏛️ Municipal</SelectItem>
                      <SelectItem value="Outros">📋 Outros</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Status da Integração</Label>
                  <Select 
                    value={formData.status_integracao} 
                    onValueChange={(val) => handleSelectChange("status_integracao", val)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Ativo">Ativo</SelectItem>
                      <SelectItem value="Inativo">Inativo</SelectItem>
                      <SelectItem value="Em Testes">Em Testes</SelectItem>
                      <SelectItem value="Erro">Erro</SelectItem>
                      <SelectItem value="Manutenção">Manutenção</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>UF (Estado)</Label>
                  <Input 
                    name="uf" 
                    value={formData.uf} 
                    onChange={handleInputChange} 
                    maxLength={2}
                    disabled={formData.esfera === "Federal"}
                    placeholder={formData.esfera === "Federal" ? "N/A" : "Ex: PE"}
                    className={cn(formData.esfera === "Federal" && "bg-slate-100")}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Município</Label>
                  <Input 
                    name="municipio" 
                    value={formData.municipio} 
                    onChange={handleInputChange}
                    disabled={formData.esfera !== "Municipal"} 
                    placeholder={formData.esfera !== "Municipal" ? "N/A" : "Ex: Recife"}
                    className={cn(formData.esfera !== "Municipal" && "bg-slate-100")}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Tipo de Documento *</Label>
                <Select 
                  value={formData.tipo_documento} 
                  onValueChange={(val) => handleSelectChange("tipo_documento", val)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Certidão FGTS">Certidão FGTS</SelectItem>
                    <SelectItem value="Certidão INSS">Certidão INSS</SelectItem>
                    <SelectItem value="Certidão Federal Conjunta - PGFN">Certidão Federal Conjunta - PGFN</SelectItem>
                    <SelectItem value="Certidão Negativa Débitos Estaduais">Certidão Negativa Débitos Estaduais</SelectItem>
                    <SelectItem value="Certidão Negativa Débitos Municipais - ISS">Certidão Negativa Débitos Municipais - ISS</SelectItem>
                    <SelectItem value="Certidão Negativa Débitos Trabalhistas - CNDT">Certidão Negativa Débitos Trabalhistas - CNDT</SelectItem>
                    <SelectItem value="Certidão de Falência e Recuperação Judicial">Certidão de Falência e Recuperação Judicial</SelectItem>
                    <SelectItem value="CRQ - CREA/CAU">CRQ - CREA/CAU</SelectItem>
                    <SelectItem value="SICAF">SICAF</SelectItem>
                    <SelectItem value="Edital de Licitação">Edital de Licitação</SelectItem>
                    <SelectItem value="Contrato Social">Contrato Social</SelectItem>
                    <SelectItem value="Balanço Patrimonial">Balanço Patrimonial</SelectItem>
                    <SelectItem value="Certidão Específica Municipal">Certidão Específica Municipal</SelectItem>
                    <SelectItem value="Outro">Outro</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>URL do Portal *</Label>
                <div className="relative">
                  <Globe className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                  <Input 
                    name="url" 
                    className="pl-10"
                    value={formData.url} 
                    onChange={handleInputChange} 
                    placeholder="https://..."
                    required
                  />
                </div>
              </div>

              <div className="space-y-3 p-4 bg-slate-50 rounded-lg">
                <div className="flex items-center gap-3">
                  <Switch
                    checked={formData.requer_autenticacao}
                    onCheckedChange={(checked) => setFormData(f => ({ ...f, requer_autenticacao: checked }))}
                  />
                  <div>
                    <Label className="font-medium">Requer Autenticação</Label>
                    <p className="text-xs text-slate-500">A fonte exige login para acesso</p>
                  </div>
                </div>

                {formData.requer_autenticacao && (
                  <>
                    <div className="space-y-2 pt-2">
                      <Label>Tipo de Autenticação</Label>
                      <Select 
                        value={formData.tipo_autenticacao} 
                        onValueChange={(val) => handleSelectChange("tipo_autenticacao", val)}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Nenhuma">Nenhuma</SelectItem>
                          <SelectItem value="Usuário/Senha">Usuário/Senha</SelectItem>
                          <SelectItem value="Certificado Digital">Certificado Digital</SelectItem>
                          <SelectItem value="Gov.br">Gov.br</SelectItem>
                          <SelectItem value="API Key">API Key</SelectItem>
                          <SelectItem value="OAuth">OAuth</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    {formData.tipo_autenticacao === "Usuário/Senha" && (
                      <div className="grid grid-cols-2 gap-4 pt-2">
                        <div className="space-y-2">
                          <Label>Usuário/Login</Label>
                          <Input
                            name="usuario_login"
                            value={formData.usuario_login}
                            onChange={handleInputChange}
                            placeholder="usuário"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Senha</Label>
                          <Input
                            name="senha_login"
                            type="password"
                            value={formData.senha_login}
                            onChange={handleInputChange}
                            placeholder="••••••"
                          />
                          <p className="text-xs text-amber-600">⚠️ Use secrets em produção</p>
                        </div>
                      </div>
                    )}
                  </>
                )}
              </div>

              <div className="space-y-2">
                <Label>Instruções para a IA</Label>
                <Textarea 
                  name="instrucoes_ia" 
                  value={formData.instrucoes_ia} 
                  onChange={handleInputChange} 
                  placeholder="Ex: Clicar em 'Emitir Certidão', preencher CNPJ e resolver Captcha..."
                  rows={3}
                />
              </div>

              <div className="space-y-2">
                <Label>Observações</Label>
                <Textarea 
                  name="observacoes" 
                  value={formData.observacoes} 
                  onChange={handleInputChange} 
                  placeholder="Notas adicionais sobre esta fonte"
                  rows={2}
                />
              </div>

              <div className="flex justify-end gap-3 pt-4">
                <Button type="button" variant="outline" onClick={resetForm}>
                  Cancelar
                </Button>
                <Button type="submit">
                  {editingFonte ? "Salvar Alterações" : "Criar Fonte"}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>

        <Card className="hidden">

        </div>
      </div>

      {/* Alert de Exclusão */}
      <AlertDialog open={!!deletingFonte} onOpenChange={(open) => !open && setDeletingFonte(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir fonte?</AlertDialogTitle>
            <AlertDialogDescription>
              O robô deixará de monitorar esta fonte. Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction 
              onClick={() => deleteMutation.mutate(deletingFonte?.id)}
              className="bg-red-600 hover:bg-red-700"
            >
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}