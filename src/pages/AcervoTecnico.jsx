import { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { FileText, Plus, Upload, Trash2, ExternalLink, Briefcase } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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

export default function AcervoTecnico() {
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [deletingAcervo, setDeletingAcervo] = useState(null);
  const [selectedProfissional, setSelectedProfissional] = useState("");
  
  const [formData, setFormData] = useState({
    profissional_id: "",
    titulo: "",
    descricao: "",
    arquivo_cat_urls: [],
    tipo_documento: "CAT",
    data_execucao: "",
    valor_obra: "",
    orgao_contratante: ""
  });

  const { data: acervos = [], isLoading: loadingAcervos } = useQuery({
    queryKey: ['acervos'],
    queryFn: () => base44.entities.AcervoTecnico.list()
  });

  const { data: profissionais = [] } = useQuery({
    queryKey: ['profissionais'],
    queryFn: () => base44.entities.Profissional.list()
  });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.AcervoTecnico.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['acervos'] });
      setShowForm(false);
      setFormData({
        profissional_id: "",
        titulo: "",
        descricao: "",
        arquivo_cat_urls: [],
        tipo_documento: "CAT",
        data_execucao: "",
        valor_obra: "",
        orgao_contratante: ""
      });
    }
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.AcervoTecnico.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['acervos'] });
      setDeletingAcervo(null);
    }
  });

  const handleFileUpload = async (e) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    setUploading(true);
    try {
      const uploadedUrls = [];
      for (const file of files) {
        const { file_url } = await base44.integrations.Core.UploadFile({ file });
        uploadedUrls.push(file_url);
      }
      setFormData(prev => ({ 
        ...prev, 
        arquivo_cat_urls: [...(prev.arquivo_cat_urls || []), ...uploadedUrls] 
      }));
    } catch (error) {
      alert("Erro ao fazer upload dos arquivos");
    } finally {
      setUploading(false);
    }
  };

  const removeFile = (index) => {
    setFormData(prev => {
      const newUrls = [...(prev.arquivo_cat_urls || [])];
      newUrls.splice(index, 1);
      return { ...prev, arquivo_cat_urls: newUrls };
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    await createMutation.mutateAsync(formData);
  };

  const getProfissionalNome = (profissionalId) => {
    const prof = profissionais.find(p => p.id === profissionalId);
    return prof?.nome || "Desconhecido";
  };

  const filteredAcervos = selectedProfissional 
    ? acervos.filter(a => a.profissional_id === selectedProfissional)
    : acervos;

  const tipoColors = {
    CAT: "bg-blue-100 text-blue-700 border-blue-200",
    ART: "bg-purple-100 text-purple-700 border-purple-200",
    RRT: "bg-green-100 text-green-700 border-green-200",
    Atestado: "bg-amber-100 text-amber-700 border-amber-200",
    Outro: "bg-slate-100 text-slate-700 border-slate-200"
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6 md:mb-8 gap-4">
          <div className="min-w-0 flex-1">
            <h1 className="text-2xl sm:text-3xl font-bold text-foreground tracking-tight flex items-center gap-2 sm:gap-3">
              <Briefcase className="w-7 h-7 sm:w-8 sm:h-8 text-primary flex-shrink-0" />
              <span className="truncate">Biblioteca de Acervo Técnico</span>
            </h1>
            <p className="text-muted-foreground mt-2 text-sm sm:text-base">
              Centralize todos os CATs, Atestados e RRTs da equipe
            </p>
          </div>
          <Button 
            onClick={() => setShowForm(true)}
            className="gap-2 bg-primary text-primary-foreground hover:bg-primary/90 shadow-lg shadow-primary/20 w-full sm:w-auto flex-shrink-0"
          >
            <Plus className="w-4 h-4 flex-shrink-0" />
            <span className="hidden sm:inline">Novo Documento</span>
            <span className="sm:hidden">Novo</span>
          </Button>
        </div>

        {/* Filtro por Profissional */}
        <Card className="mb-6 glass-panel tech-border">
          <CardContent className="pt-4 sm:pt-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-4">
              <Label className="sm:min-w-[150px] text-sm sm:text-base">Filtrar por Profissional:</Label>
              <Select value={selectedProfissional} onValueChange={setSelectedProfissional}>
                <SelectTrigger className="w-full sm:max-w-md text-sm">
                  <SelectValue placeholder="Todos os profissionais" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={null}>Todos os profissionais</SelectItem>
                  {profissionais.map(prof => (
                    <SelectItem key={prof.id} value={prof.id}>
                      {prof.nome} - {prof.cargo}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {selectedProfissional && (
                <Button variant="outline" size="sm" onClick={() => setSelectedProfissional("")} className="w-full sm:w-auto">
                  Limpar Filtro
                </Button>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Grid de Acervos */}
        {loadingAcervos ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            {[1, 2, 3].map((i) => (
              <Card key={i} className="animate-pulse">
                <CardContent className="p-4 sm:p-6">
                  <div className="h-20 bg-slate-200 rounded mb-4" />
                  <div className="h-4 bg-slate-200 rounded w-2/3 mb-2" />
                  <div className="h-4 bg-slate-200 rounded w-1/2" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : filteredAcervos.length === 0 ? (
          <Card className="border-dashed border-2 border-slate-300">
            <CardContent className="py-12 sm:py-16 text-center px-4">
              <Briefcase className="w-12 sm:w-16 h-12 sm:h-16 text-slate-300 mx-auto mb-4" />
              <h3 className="text-lg sm:text-xl font-semibold text-slate-700 mb-2">
                {selectedProfissional ? "Nenhum acervo encontrado" : "Nenhum acervo cadastrado"}
              </h3>
              <p className="text-slate-500 mb-6 text-sm sm:text-base">
                {selectedProfissional ? "Este profissional ainda não possui documentos" : "Comece adicionando o primeiro documento técnico"}
              </p>
              <Button onClick={() => setShowForm(true)} className="gap-2 w-full sm:w-auto">
                <Plus className="w-4 h-4" />
                Adicionar Documento
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            {filteredAcervos.map((acervo) => (
              <Card key={acervo.id} className="group hover:shadow-xl transition-all glass-panel tech-border hover:border-primary/50">
                <CardHeader className="border-b border-slate-100">
                  <div className="flex items-start justify-between">
                    <Badge variant="outline" className={cn(tipoColors[acervo.tipo_documento])}>
                      {acervo.tipo_documento}
                    </Badge>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setDeletingAcervo(acervo)}
                      className="opacity-0 group-hover:opacity-100"
                    >
                      <Trash2 className="w-4 h-4 text-red-500" />
                    </Button>
                  </div>
                  <CardTitle className="text-lg mt-2">{acervo.titulo}</CardTitle>
                </CardHeader>
                <CardContent className="pt-4 space-y-3">
                  <div className="text-sm text-slate-600">
                    <strong>Profissional:</strong> {getProfissionalNome(acervo.profissional_id)}
                  </div>
                  
                  {acervo.orgao_contratante && (
                    <div className="text-sm text-slate-600">
                      <strong>Contratante:</strong> {acervo.orgao_contratante}
                    </div>
                  )}
                  
                  {acervo.valor_obra && (
                    <div className="text-sm text-slate-600">
                      <strong>Valor:</strong> R$ {Number(acervo.valor_obra).toLocaleString('pt-BR')}
                    </div>
                  )}
                  
                  {acervo.data_execucao && (
                    <div className="text-sm text-slate-600">
                      <strong>Data:</strong> {new Date(acervo.data_execucao).toLocaleDateString('pt-BR')}
                    </div>
                  )}

                  {acervo.descricao && (
                    <p className="text-sm text-slate-500 line-clamp-2">{acervo.descricao}</p>
                  )}

                  {acervo.arquivo_cat_urls && acervo.arquivo_cat_urls.length > 0 && (
                    <div className="space-y-1">
                      {acervo.arquivo_cat_urls.map((url, idx) => (
                        <a
                          key={idx}
                          href={url}
                          target="_blank"
                          rel="noreferrer"
                          className="flex items-center gap-2 text-sm text-blue-600 hover:text-blue-700 hover:underline"
                        >
                          <FileText className="w-4 h-4" />
                          Documento {idx + 1}
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Modal de Criação */}
        <Dialog open={showForm} onOpenChange={setShowForm}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto w-full mx-4 sm:mx-0">
            <DialogHeader>
              <DialogTitle className="text-lg sm:text-xl">Novo Documento Técnico</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label className="text-sm sm:text-base">Profissional *</Label>
                <Select 
                  value={formData.profissional_id} 
                  onValueChange={(val) => setFormData(prev => ({...prev, profissional_id: val}))}
                  required
                >
                  <SelectTrigger className="text-sm">
                    <SelectValue placeholder="Selecione o profissional" />
                  </SelectTrigger>
                  <SelectContent>
                    {profissionais.map(prof => (
                      <SelectItem key={prof.id} value={prof.id}>
                        {prof.nome} - {prof.cargo}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label className="text-sm sm:text-base">Tipo de Documento *</Label>
                <Select 
                  value={formData.tipo_documento} 
                  onValueChange={(val) => setFormData(prev => ({...prev, tipo_documento: val}))}
                >
                  <SelectTrigger className="text-sm">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="CAT">CAT - Certidão de Acervo Técnico</SelectItem>
                    <SelectItem value="ART">ART - Anotação de Responsabilidade Técnica</SelectItem>
                    <SelectItem value="RRT">RRT - Registro de Responsabilidade Técnica</SelectItem>
                    <SelectItem value="Atestado">Atestado de Capacidade Técnica</SelectItem>
                    <SelectItem value="Outro">Outro</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label className="text-sm sm:text-base">Título da Obra/Serviço *</Label>
                <Input
                  value={formData.titulo}
                  onChange={(e) => setFormData(prev => ({...prev, titulo: e.target.value}))}
                  placeholder="Ex: Reforma do Hospital Municipal"
                  required
                  className="text-sm"
                />
              </div>

              <div className="space-y-2">
                <Label className="text-sm sm:text-base">Descrição</Label>
                <Textarea
                  value={formData.descricao}
                  onChange={(e) => setFormData(prev => ({...prev, descricao: e.target.value}))}
                  placeholder="Descrição detalhada da obra/serviço executado"
                  rows={3}
                  className="text-sm"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                <div className="space-y-2">
                  <Label className="text-sm sm:text-base">Data de Execução</Label>
                  <Input
                    type="date"
                    value={formData.data_execucao}
                    onChange={(e) => setFormData(prev => ({...prev, data_execucao: e.target.value}))}
                    className="text-sm"
                  />
                </div>

                <div className="space-y-2">
                  <Label className="text-sm sm:text-base">Valor da Obra (R$)</Label>
                  <Input
                    type="number"
                    value={formData.valor_obra}
                    onChange={(e) => setFormData(prev => ({...prev, valor_obra: e.target.value}))}
                    placeholder="0.00"
                    className="text-sm"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-sm sm:text-base">Órgão/Empresa Contratante</Label>
                <Input
                  value={formData.orgao_contratante}
                  onChange={(e) => setFormData(prev => ({...prev, orgao_contratante: e.target.value}))}
                  placeholder="Ex: Prefeitura de Recife"
                  className="text-sm"
                />
              </div>

              <div className="space-y-2">
                <Label className="text-sm sm:text-base">Arquivos PDF do Documento (múltiplos)</Label>
                <Input
                  type="file"
                  accept=".pdf"
                  multiple
                  onChange={handleFileUpload}
                  disabled={uploading}
                  className="text-sm"
                />
                {uploading && <p className="text-xs sm:text-sm text-slate-500">Enviando arquivos...</p>}
                {formData.arquivo_cat_urls && formData.arquivo_cat_urls.length > 0 && (
                  <div className="space-y-2 mt-2">
                    {formData.arquivo_cat_urls.map((url, index) => (
                      <div key={index} className="flex items-center gap-2 p-2 border border-slate-200 rounded-lg text-xs sm:text-sm">
                        <FileText className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-slate-500 flex-shrink-0" />
                        <a href={url} target="_blank" rel="noreferrer" className="flex-1 text-blue-600 hover:underline truncate">
                          Documento {index + 1}
                        </a>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={() => removeFile(index)}
                          className="h-6 w-6 flex-shrink-0"
                        >
                          <Trash2 className="w-3 h-3 text-red-500" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="flex gap-2 sm:gap-3 pt-4">
                <Button type="button" variant="outline" onClick={() => setShowForm(false)} className="flex-1 text-sm">
                  Cancelar
                </Button>
                <Button type="submit" disabled={createMutation.isPending} className="flex-1 text-sm">
                  {createMutation.isPending ? "Salvando..." : "Salvar Documento"}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>

        {/* Alert de Exclusão */}
        <AlertDialog open={!!deletingAcervo} onOpenChange={(open) => !open && setDeletingAcervo(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Excluir documento?</AlertDialogTitle>
              <AlertDialogDescription>
                Tem certeza que deseja excluir "{deletingAcervo?.titulo}"? Esta ação não pode ser desfeita.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancelar</AlertDialogCancel>
              <AlertDialogAction 
                onClick={() => deleteMutation.mutate(deletingAcervo?.id)}
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