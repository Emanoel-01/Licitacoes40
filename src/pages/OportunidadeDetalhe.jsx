import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Link } from "react-router-dom";

import { 
  ArrowLeft, 
  Building2, 
  Calendar, 
  MapPin, 
  ExternalLink,
  FileText,
  Users,
  Save,
  Trash2,
  CheckCircle,
  Clock,
  TrendingUp,
  Sparkles,
  Upload,
  File,
  Loader2,
  ClipboardList,
  Plus
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
import { toast } from "sonner";
import { createPageUrl } from "@/utils";
import ModalTipoProposta from "@/components/editor/ModalTipoProposta";

export default function OportunidadeDetalhe() {
  const [oportunidadeId, setOportunidadeId] = useState(null);
  const [showDeleteAlert, setShowDeleteAlert] = useState(false);
  const [showModalTipoProposta, setShowModalTipoProposta] = useState(false);
  const [editData, setEditData] = useState({});
  const [selectedProfissionais, setSelectedProfissionais] = useState([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  
  const queryClient = useQueryClient();

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const id = params.get('id');
    if (id) setOportunidadeId(id);
  }, []);

  const { data: oportunidade, isLoading } = useQuery({
    queryKey: ['oportunidade', oportunidadeId],
    queryFn: async () => {
      if (!oportunidadeId) return null;
      const items = await base44.entities.Oportunidade.filter({ id: oportunidadeId });
      return items[0] || null;
    },
    enabled: !!oportunidadeId
  });

  const { data: empresas = [] } = useQuery({
    queryKey: ['empresas'],
    queryFn: () => base44.entities.Empresa.list()
  });

  const { data: profissionais = [] } = useQuery({
    queryKey: ['profissionais'],
    queryFn: () => base44.entities.Profissional.list()
  });

  useEffect(() => {
    if (oportunidade) {
      setEditData(oportunidade);
      if (oportunidade.profissionais_vinculados) {
        setSelectedProfissionais(oportunidade.profissionais_vinculados.split(',').filter(Boolean));
      }
    }
  }, [oportunidade]);

  const updateMutation = useMutation({
    mutationFn: (data) => base44.entities.Oportunidade.update(oportunidadeId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['oportunidade', oportunidadeId] });
    }
  });

  const deleteMutation = useMutation({
    mutationFn: () => base44.entities.Oportunidade.delete(oportunidadeId),
    onSuccess: () => {
      window.location.href = "/Oportunidades";
    }
  });

  const handleSave = async () => {
    await updateMutation.mutateAsync({
      ...editData,
      profissionais_vinculados: selectedProfissionais.join(',')
    });
  };

  const handleUploadEdital = async (file) => {
    if (!file) return;
    
    setIsUploading(true);
    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      await updateMutation.mutateAsync({ edital_pdf_url: file_url });
      toast.success("Edital enviado com sucesso!");
    } catch (error) {
      console.error("Erro ao enviar edital:", error);
      toast.error("Erro ao enviar arquivo.");
    } finally {
      setIsUploading(false);
    }
  };

  const handleNovaProposta = (tipo) => {
    window.location.href = createPageUrl("EditorPropostas") + `?oportunidade_id=${oportunidadeId}&tipo=${tipo}`;
  };

  const handleAnalyzeWithPDF = async () => {
    setIsAnalyzing(true);
    toast.info("Agente está analisando o edital... Aguarde.");
    
    try {
      const fileUrls = oportunidade.edital_pdf_url ? [oportunidade.edital_pdf_url] : undefined;
      
      const result = await base44.integrations.Core.InvokeLLM({
        prompt: `Você é um especialista em licitações e análise de editais. Analise este edital e extraia as seguintes informações estruturadas:

IMPORTANTE: Se o arquivo PDF foi fornecido, extraia as informações DIRETAMENTE do documento. Senão, use as informações fornecidas.

Contexto atual:
- OBJETO: ${oportunidade.objeto}
- ÓRGÃO: ${oportunidade.orgao_licitante}
- MODALIDADE: ${oportunidade.modalidade}
- VALOR ESTIMADO: R$ ${oportunidade.valor_estimado?.toLocaleString('pt-BR') || 'Não informado'}
- LOCAL: ${oportunidade.municipio || ''}, ${oportunidade.uf || ''}

Extraia e forneça em JSON:
1. numero_edital: Número exato do edital
2. data_abertura: Data e hora da abertura (ISO format)
3. data_limite_proposta: Prazo limite para propostas (ISO format)
4. valor_estimado: Valor estimado (número)
5. requisitos_tecnicos: Lista dos principais requisitos técnicos
6. documentacao_necessaria: Lista de documentos obrigatórios
7. analise_viabilidade: Análise estratégica da oportunidade
8. score_compatibilidade: Score de 0-100
9. checklist_tarefas: Array com tarefas necessárias para montar a proposta

Seja preciso e objetivo.`,
        response_json_schema: {
          type: "object",
          properties: {
            numero_edital: { type: "string" },
            data_abertura: { type: "string" },
            data_limite_proposta: { type: "string" },
            valor_estimado: { type: "number" },
            requisitos_tecnicos: { type: "array", items: { type: "string" } },
            documentacao_necessaria: { type: "array", items: { type: "string" } },
            analise_viabilidade: { type: "string" },
            score_compatibilidade: { type: "number" },
            checklist_tarefas: { 
              type: "array",
              items: {
                type: "object",
                properties: {
                  categoria: { type: "string" },
                  tarefa: { type: "string" },
                  obrigatorio: { type: "boolean" }
                }
              }
            }
          }
        },
        file_urls: fileUrls
      });

      // Estruturar o checklist
      const checklistFormatado = result.checklist_tarefas?.map((item, idx) => ({
        id: `task-${idx}`,
        categoria: item.categoria,
        tarefa: item.tarefa,
        obrigatorio: item.obrigatorio ?? true,
        concluido: false
      })) || [];

      await updateMutation.mutateAsync({
        numero_edital: result.numero_edital,
        data_abertura: result.data_abertura,
        data_limite_proposta: result.data_limite_proposta,
        valor_estimado: result.valor_estimado,
        analise_ia: result.analise_viabilidade,
        score_compatibilidade: result.score_compatibilidade,
        checklist_proposta: checklistFormatado,
        observacoes: `Requisitos técnicos: ${result.requisitos_tecnicos?.join(', ')}\nDocumentação: ${result.documentacao_necessaria?.join(', ')}`
      });
      
      toast.success("Edital analisado e dados preenchidos automaticamente!");
    } catch (error) {
      console.error("Erro na análise:", error);
      toast.error("Erro ao analisar edital.");
    }
    setIsAnalyzing(false);
  };

  const formatCurrency = (value) => {
    if (!value) return "A definir";
    return new Intl.NumberFormat('pt-BR', { 
      style: 'currency', 
      currency: 'BRL',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(value);
  };

  const statusConfig = {
    nova: { label: "Nova", color: "bg-blue-100 text-blue-700 border-blue-200" },
    em_analise: { label: "Em Análise", color: "bg-amber-100 text-amber-700 border-amber-200" },
    aprovada: { label: "Aprovada", color: "bg-emerald-100 text-emerald-700 border-emerald-200" },
    proposta_enviada: { label: "Proposta Enviada", color: "bg-purple-100 text-purple-700 border-purple-200" },
    vencida: { label: "Vencida", color: "bg-green-100 text-green-700 border-green-200" },
    perdida: { label: "Perdida", color: "bg-red-100 text-red-700 border-red-200" },
    descartada: { label: "Descartada", color: "bg-slate-100 text-slate-700 border-slate-200" }
  };

  if (isLoading || !oportunidade) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-50 p-6">
        <div className="max-w-5xl mx-auto">
          <div className="animate-pulse space-y-6">
            <div className="h-8 bg-slate-200 rounded w-1/3" />
            <div className="h-64 bg-slate-200 rounded" />
          </div>
        </div>
      </div>
    );
  }

  const config = statusConfig[oportunidade.status] || statusConfig.nova;

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-5xl mx-auto px-6 py-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start justify-between mb-6 md:mb-8 gap-4">
          <div>
            <Link 
              to={createPageUrl("Oportunidades")}
              className="inline-flex items-center gap-2 text-slate-600 hover:text-slate-900 mb-4"
            >
              <ArrowLeft className="w-4 h-4" />
              Voltar para oportunidades
            </Link>
            <h1 className="text-2xl font-bold text-slate-900 mb-2">
              {oportunidade.objeto}
            </h1>
            <div className="flex flex-wrap items-center gap-2 md:gap-3">
              <Badge variant="outline" className={cn("border", config.color)}>
                {config.label}
              </Badge>
              {oportunidade.modalidade && (
                <Badge variant="secondary">{oportunidade.modalidade}</Badge>
              )}
              {oportunidade.score_compatibilidade && (
                <Badge className="bg-emerald-100 text-emerald-700 gap-1">
                  <TrendingUp className="w-3 h-3" />
                  {oportunidade.score_compatibilidade}%
                </Badge>
              )}
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 md:gap-3 w-full sm:w-auto">
            <Button 
              onClick={() => setShowModalTipoProposta(true)}
              className="gap-2 bg-emerald-600 hover:bg-emerald-700 flex-1 sm:flex-none"
            >
              <Plus className="w-4 h-4" />
              <span className="hidden sm:inline">Nova Proposta</span>
              <span className="sm:hidden">Proposta</span>
            </Button>
            <Button 
              variant="outline" 
              onClick={handleAnalyzeWithPDF}
              disabled={isAnalyzing}
              className="gap-2 flex-1 sm:flex-none"
            >
              {isAnalyzing ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span className="hidden sm:inline">Analisando...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  <span className="hidden sm:inline">Analisar Edital</span>
                  <span className="sm:hidden">IA</span>
                </>
              )}
            </Button>
            <Button 
              onClick={handleSave}
              disabled={updateMutation.isPending}
              className="gap-2 bg-slate-900 hover:bg-slate-800 flex-1 sm:flex-none"
            >
              <Save className="w-4 h-4" />
              <span className="hidden sm:inline">{updateMutation.isPending ? "Salvando..." : "Salvar"}</span>
              <span className="sm:hidden">Salvar</span>
            </Button>
            <Button 
              variant="outline" 
              onClick={() => setShowDeleteAlert(true)}
              className="text-red-600 hover:text-red-700 hover:bg-red-50"
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          </div>
        </div>

        <Tabs defaultValue="info" className="space-y-4 md:space-y-6">
          <TabsList className="bg-white border border-slate-200 p-1 w-full sm:w-auto grid grid-cols-4 sm:inline-grid sm:grid-cols-none">
            <TabsTrigger value="info">Informações</TabsTrigger>
            <TabsTrigger value="proposta">Checklist</TabsTrigger>
            <TabsTrigger value="tecnica">Proposta</TabsTrigger>
            <TabsTrigger value="equipe">Equipe</TabsTrigger>
          </TabsList>

          {/* Tab: Informações */}
          <TabsContent value="info" className="space-y-4 md:space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-6">
              {/* Dados Principais */}
              <div className="lg:col-span-2 space-y-4 md:space-y-6">
                <Card className="border-slate-200">
                  <CardHeader className="pb-4">
                    <CardTitle className="text-lg">Dados do Edital</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Número do Edital</Label>
                        <Input
                          value={editData.numero_edital || ""}
                          onChange={(e) => setEditData(d => ({ ...d, numero_edital: e.target.value }))}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Status</Label>
                        <Select 
                          value={editData.status || "nova"} 
                          onValueChange={(v) => setEditData(d => ({ ...d, status: v }))}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="nova">Nova</SelectItem>
                            <SelectItem value="em_analise">Em Análise</SelectItem>
                            <SelectItem value="aprovada">Aprovada</SelectItem>
                            <SelectItem value="proposta_enviada">Proposta Enviada</SelectItem>
                            <SelectItem value="vencida">Vencida</SelectItem>
                            <SelectItem value="perdida">Perdida</SelectItem>
                            <SelectItem value="descartada">Descartada</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label>Órgão Licitante</Label>
                      <Input
                        value={editData.orgao_licitante || ""}
                        onChange={(e) => setEditData(d => ({ ...d, orgao_licitante: e.target.value }))}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>Objeto</Label>
                      <Textarea
                        value={editData.objeto || ""}
                        onChange={(e) => setEditData(d => ({ ...d, objeto: e.target.value }))}
                        rows={3}
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Valor Estimado (R$)</Label>
                        <Input
                          type="number"
                          value={editData.valor_estimado || ""}
                          onChange={(e) => setEditData(d => ({ ...d, valor_estimado: parseFloat(e.target.value) || null }))}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Modalidade</Label>
                        <Select 
                          value={editData.modalidade || ""} 
                          onValueChange={(v) => setEditData(d => ({ ...d, modalidade: v }))}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Pregão Eletrônico">Pregão Eletrônico</SelectItem>
                            <SelectItem value="Pregão Presencial">Pregão Presencial</SelectItem>
                            <SelectItem value="Concorrência">Concorrência</SelectItem>
                            <SelectItem value="Tomada de Preços">Tomada de Preços</SelectItem>
                            <SelectItem value="RDC">RDC</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>UF</Label>
                        <Input
                          value={editData.uf || ""}
                          onChange={(e) => setEditData(d => ({ ...d, uf: e.target.value.toUpperCase() }))}
                          maxLength={2}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Município</Label>
                        <Input
                          value={editData.municipio || ""}
                          onChange={(e) => setEditData(d => ({ ...d, municipio: e.target.value }))}
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label>Link do Edital</Label>
                      <div className="flex gap-2">
                        <Input
                          type="url"
                          value={editData.link_edital || ""}
                          onChange={(e) => setEditData(d => ({ ...d, link_edital: e.target.value }))}
                          className="flex-1"
                        />
                        {editData.link_edital && (
                          <Button 
                            variant="outline" 
                            size="icon"
                            onClick={() => window.open(editData.link_edital, '_blank')}
                          >
                            <ExternalLink className="w-4 h-4" />
                          </Button>
                        )}
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label>PDF do Edital</Label>
                      <div className="border-2 border-dashed border-slate-300 rounded-lg p-4 text-center hover:border-slate-400 transition-colors">
                        {editData.edital_pdf_url ? (
                          <div className="space-y-2">
                            <div className="flex items-center justify-center gap-2 text-emerald-600">
                              <File className="w-5 h-5" />
                              <span className="text-sm font-medium">Edital enviado</span>
                            </div>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => window.open(editData.edital_pdf_url, '_blank')}
                              className="w-full"
                            >
                              <ExternalLink className="w-3 h-3 mr-2" />
                              Visualizar PDF
                            </Button>
                          </div>
                        ) : (
                          <label className="cursor-pointer block">
                            <div className="flex flex-col items-center gap-2">
                              <Upload className="w-5 h-5 text-slate-400" />
                              <p className="text-sm text-slate-600">
                                Clique para enviar PDF do edital
                              </p>
                              <p className="text-xs text-slate-500">
                                A IA analisará automaticamente
                              </p>
                            </div>
                            <input
                              type="file"
                              accept=".pdf"
                              className="hidden"
                              onChange={(e) => handleUploadEdital(e.target.files?.[0])}
                              disabled={isUploading}
                            />
                          </label>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Análise IA - Painel de Inteligência */}
                <Card className={cn(
                  "tech-border transition-all",
                  oportunidade.analise_ia ? "border-primary/30 bg-primary/5" : "border-slate-700/50 glass-panel"
                )}>
                  <CardHeader className="flex flex-row items-center justify-between pb-4">
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Sparkles className="w-5 h-5 text-primary" />
                      Análise de Viabilidade (IA Agent)
                    </CardTitle>

                  </CardHeader>
                  <CardContent>
                    {oportunidade.analise_ia ? (
                      <div className="space-y-4">
                        <div className="p-4 rounded-md glass-panel tech-border text-sm leading-relaxed whitespace-pre-line text-foreground font-mono">
                          {oportunidade.analise_ia}
                        </div>

                      </div>
                    ) : (
                      <div className="text-center py-8 text-muted-foreground">
                        <Sparkles className="h-10 w-10 mx-auto mb-3 opacity-20" />
                        <p>O Agente ainda não processou este edital.</p>
                        <p className="text-xs mt-2">Clique em "Gerar Análise" para iniciar</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>

              {/* Sidebar */}
              <div className="space-y-4 md:space-y-6">
                <Card className="border-slate-200">
                  <CardHeader className="pb-4">
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Calendar className="w-5 h-5 text-slate-400" />
                      Datas
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <Label>Data/Hora de Abertura</Label>
                      <Input
                        type="datetime-local"
                        value={editData.data_abertura || ""}
                        onChange={(e) => setEditData(d => ({ ...d, data_abertura: e.target.value }))}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Prazo para Proposta</Label>
                      <Input
                        type="datetime-local"
                        value={editData.data_limite_proposta || ""}
                        onChange={(e) => setEditData(d => ({ ...d, data_limite_proposta: e.target.value }))}
                      />
                    </div>
                    
                    {oportunidade.data_abertura && (
                      <div className="p-4 bg-slate-50 rounded-lg text-center">
                        <p className="text-sm text-slate-500">Abertura em</p>
                        <p className="text-2xl font-bold text-slate-900">
                          {moment(oportunidade.data_abertura).diff(moment(), 'days')}
                        </p>
                        <p className="text-sm text-slate-500">dias</p>
                      </div>
                    )}
                  </CardContent>
                </Card>

                <Card className="border-slate-200">
                  <CardHeader className="pb-4">
                    <CardTitle className="text-lg">Valor da Proposta</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <Label>Valor (R$)</Label>
                      <Input
                        type="number"
                        value={editData.valor_proposta || ""}
                        onChange={(e) => setEditData(d => ({ ...d, valor_proposta: parseFloat(e.target.value) || null }))}
                        placeholder="0,00"
                      />
                    </div>
                    {editData.valor_estimado && editData.valor_proposta && (
                      <div className="p-3 bg-slate-50 rounded-lg">
                        <p className="text-xs text-slate-500">Desconto</p>
                        <p className="text-lg font-bold text-emerald-600">
                          {((1 - editData.valor_proposta / editData.valor_estimado) * 100).toFixed(1)}%
                        </p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>

          {/* Tab: Checklist */}
          <TabsContent value="proposta" className="space-y-4">
            {editData.checklist_proposta && editData.checklist_proposta.length > 0 ? (
              <>
                <Card className="border-slate-200">
                  <CardHeader className="pb-4">
                    <CardTitle className="text-lg flex items-center gap-2">
                      <ClipboardList className="w-5 h-5 text-slate-400" />
                      Checklist de Documentos e Tarefas
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {editData.checklist_proposta.map((item) => (
                      <div 
                        key={item.id}
                        className="flex items-start gap-3 p-3 rounded-lg border border-slate-200 hover:bg-slate-50 transition-colors"
                      >
                        <Checkbox
                          checked={item.concluido || false}
                          onCheckedChange={(checked) => {
                            const updated = editData.checklist_proposta.map(i =>
                              i.id === item.id ? { ...i, concluido: checked } : i
                            );
                            setEditData(d => ({ ...d, checklist_proposta: updated }));
                          }}
                        />
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <p className={cn(
                              "font-medium text-slate-900",
                              item.concluido && "line-through text-slate-500"
                            )}>
                              {item.tarefa}
                            </p>
                            <Badge variant="outline" className="text-xs">
                              {item.categoria}
                            </Badge>
                            {item.obrigatorio && (
                              <Badge className="bg-red-100 text-red-700 text-xs">
                                Obrigatório
                              </Badge>
                            )}
                          </div>
                          {item.observacoes && (
                            <p className="text-xs text-slate-500 mt-1">
                              {item.observacoes}
                            </p>
                          )}
                        </div>
                        {item.concluido && (
                          <CheckCircle className="w-5 h-5 text-emerald-600 flex-shrink-0" />
                        )}
                      </div>
                    ))}
                  </CardContent>
                </Card>

                <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  <p className="text-sm text-blue-900">
                    <span className="font-semibold">💡 Dica:</span> Marque as tarefas conforme forem concluídas. Próximo passo: adicionar propostas técnicas e documentos.
                  </p>
                </div>
              </>
            ) : (
              <Card className="border-dashed border-2 border-slate-300">
                <CardContent className="py-12 text-center">
                  <ClipboardList className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                  <p className="text-slate-600 mb-3">Nenhum checklist gerado ainda</p>
                  <p className="text-sm text-slate-500 mb-4">
                    Envie o PDF do edital e clique em "Analisar Edital" para gerar automaticamente o checklist de documentos necessários
                  </p>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Tab: Proposta Técnica */}
          <TabsContent value="tecnica">
            <Card className="border-slate-200">
              <CardHeader className="pb-4">
                <CardTitle className="text-lg flex items-center gap-2">
                  <FileText className="w-5 h-5 text-slate-400" />
                  Proposta Técnica
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Textarea
                  value={editData.proposta_tecnica || ""}
                  onChange={(e) => setEditData(d => ({ ...d, proposta_tecnica: e.target.value }))}
                  placeholder="Escreva aqui a proposta técnica..."
                  rows={20}
                  className="font-mono text-sm"
                />
              </CardContent>
            </Card>
          </TabsContent>

          {/* Tab: Equipe */}
          <TabsContent value="equipe">
            <Card className="border-slate-200">
              <CardHeader className="pb-4">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Users className="w-5 h-5 text-slate-400" />
                  Equipe Técnica
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-slate-500 mb-4">
                  Selecione os profissionais que participarão desta licitação:
                </p>
                <div className="space-y-3">
                  {profissionais.map((prof) => (
                    <div 
                      key={prof.id}
                      className={cn(
                        "flex items-center gap-4 p-4 rounded-xl border transition-all cursor-pointer",
                        selectedProfissionais.includes(prof.id) 
                          ? "bg-blue-50 border-blue-200" 
                          : "bg-white border-slate-200 hover:border-slate-300"
                      )}
                      onClick={() => {
                        setSelectedProfissionais(prev => 
                          prev.includes(prof.id)
                            ? prev.filter(id => id !== prof.id)
                            : [...prev, prof.id]
                        );
                      }}
                    >
                      <Checkbox checked={selectedProfissionais.includes(prof.id)} />
                      <div className="flex-1">
                        <p className="font-medium text-slate-900">{prof.nome}</p>
                        <p className="text-sm text-slate-500">
                          {prof.cargo} • {prof.registro_profissional}
                        </p>
                      </div>
                      {prof.is_responsavel_tecnico && (
                        <Badge variant="outline" className="border-blue-200 text-blue-700">
                          RT
                        </Badge>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Modal Tipo Proposta */}
        <ModalTipoProposta
          open={showModalTipoProposta}
          onClose={() => setShowModalTipoProposta(false)}
          onSelect={handleNovaProposta}
        />

        {/* Delete Alert */}
        <AlertDialog open={showDeleteAlert} onOpenChange={setShowDeleteAlert}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Excluir oportunidade?</AlertDialogTitle>
              <AlertDialogDescription>
                Tem certeza que deseja excluir esta oportunidade? 
                Esta ação não pode ser desfeita.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancelar</AlertDialogCancel>
              <AlertDialogAction 
                onClick={() => deleteMutation.mutate()}
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