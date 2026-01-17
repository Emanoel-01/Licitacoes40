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
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-50">
      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-slate-900 tracking-tight">
              Acervo Técnico
            </h1>
            <p className="text-slate-500 mt-1">
              Gestão de CAT, ART e documentos técnicos dos profissionais
            </p>
          </div>
          <Button 
            onClick={() => setShowForm(true)}
            className="gap-2 bg-slate-900 hover:bg-slate-800"
          >
            <Plus className="w-4 h-4" />
            Novo Documento
          </Button>
        </div>

        {/* Filtro por Profissional */}
        <Card className="mb-6 border-slate-200">
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <Label className="min-w-[150px]">Filtrar por Profissional:</Label>
              <Select value={selectedProfissional} onValueChange={setSelectedProfissional}>
                <SelectTrigger className="max-w-md">
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
                <Button variant="outline" size="sm" onClick={() => setSelectedProfissional("")}>
                  Limpar Filtro
                </Button>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Grid de Acervos */}
        {loadingAcervos ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <Card key={i} className="animate-pulse">
                <CardContent className="p-6">
                  <div className="h-20 bg-slate-200 rounded mb-4" />
                  <div className="h-4 bg-slate-200 rounded w-2/3 mb-2" />
                  <div className="h-4 bg-slate-200 rounded w-1/2" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : filteredAcervos.length === 0 ? (
          <Card className="border-dashed border-2 border-slate-300">
            <CardContent className="py-16 text-center">
              <Briefcase className="w-16 h-16 text-slate-300 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-slate-700 mb-2">
                {selectedProfissional ? "Nenhum acervo encontrado" : "Nenhum acervo cadastrado"}
              </h3>
              <p className="text-slate-500 mb-6">
                {selectedProfissional ? "Este profissional ainda não possui documentos" : "Comece adicionando o primeiro documento técnico"}
              </p>
              <Button onClick={() => setShowForm(true)} className="gap-2">
                <Plus className="w-4 h-4" />
                Adicionar Documento
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredAcervos.map((acervo) => (
              <Card key={acervo.id} className="group hover:shadow-xl transition-all border-slate-200">
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
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Novo Documento Técnico</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label>Profissional *</Label>
                <Select 
                  value={formData.profissional_id} 
                  onValueChange={(val) => setFormData(prev => ({...prev, profissional_id: val}))}
                  required
                >
                  <SelectTrigger>
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
                <Label>Tipo de Documento *</Label>
                <Select 
                  value={formData.tipo_documento} 
                  onValueChange={(val) => setFormData(prev => ({...prev, tipo_documento: val}))}
                >
                  <SelectTrigger>
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
                <Label>Título da Obra/Serviço *</Label>
                <Input
                  value={formData.titulo}
                  onChange={(e) => setFormData(prev => ({...prev, titulo: e.target.value}))}
                  placeholder="Ex: Reforma do Hospital Municipal"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label>Descrição</Label>
                <Textarea
                  value={formData.descricao}
                  onChange={(e) => setFormData(prev => ({...prev, descricao: e.target.value}))}
                  placeholder="Descrição detalhada da obra/serviço executado"
                  rows={3}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Data de Execução</Label>
                  <Input
                    type="date"
                    value={formData.data_execucao}
                    onChange={(e) => setFormData(prev => ({...prev, data_execucao: e.target.value}))}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Valor da Obra (R$)</Label>
                  <Input
                    type="number"
                    value={formData.valor_obra}
                    onChange={(e) => setFormData(prev => ({...prev, valor_obra: e.target.value}))}
                    placeholder="0.00"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Órgão/Empresa Contratante</Label>
                <Input
                  value={formData.orgao_contratante}
                  onChange={(e) => setFormData(prev => ({...prev, orgao_contratante: e.target.value}))}
                  placeholder="Ex: Prefeitura de Recife"
                />
              </div>

              <div className="space-y-2">
                <Label>Arquivos PDF do Documento (múltiplos)</Label>
                <Input
                  type="file"
                  accept=".pdf"
                  multiple
                  onChange={handleFileUpload}
                  disabled={uploading}
                />
                {uploading && <p className="text-sm text-slate-500">Enviando arquivos...</p>}
                {formData.arquivo_cat_urls && formData.arquivo_cat_urls.length > 0 && (
                  <div className="space-y-2 mt-2">
                    {formData.arquivo_cat_urls.map((url, index) => (
                      <div key={index} className="flex items-center gap-2 p-2 border border-slate-200 rounded-lg">
                        <FileText className="w-4 h-4 text-slate-500" />
                        <a href={url} target="_blank" rel="noreferrer" className="flex-1 text-sm text-blue-600 hover:underline truncate">
                          Documento {index + 1}
                        </a>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={() => removeFile(index)}
                          className="h-6 w-6"
                        >
                          <Trash2 className="w-3 h-3 text-red-500" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="flex gap-3 pt-4">
                <Button type="button" variant="outline" onClick={() => setShowForm(false)} className="flex-1">
                  Cancelar
                </Button>
                <Button type="submit" disabled={createMutation.isPending} className="flex-1">
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