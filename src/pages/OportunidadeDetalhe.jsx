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
  Sparkles
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

export default function OportunidadeDetalhe() {
  const [oportunidadeId, setOportunidadeId] = useState(null);
  const [showDeleteAlert, setShowDeleteAlert] = useState(false);
  const [editData, setEditData] = useState({});
  const [selectedProfissionais, setSelectedProfissionais] = useState([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  
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

  const handleAnalyze = async () => {
    setIsAnalyzing(true);
    toast.info("Agente está lendo o edital... Aguarde.");
    
    try {
      const result = await base44.integrations.Core.InvokeLLM({
        prompt: `Analise esta oportunidade de licitação e forneça uma avaliação estratégica detalhada:

OBJETO: ${oportunidade.objeto}
ÓRGÃO: ${oportunidade.orgao_licitante}
MODALIDADE: ${oportunidade.modalidade}
VALOR ESTIMADO: R$ ${oportunidade.valor_estimado?.toLocaleString('pt-BR')}
LOCAL: ${oportunidade.municipio || ''}, ${oportunidade.uf || ''}

Forneça uma análise completa com:
1. QUALIFICAÇÃO TÉCNICA: Requisitos técnicos prováveis e documentação necessária
2. HABILITAÇÃO: Pontos de atenção para documentação jurídica e fiscal
3. CRONOGRAMA: Análise do prazo e viabilidade de execução
4. RISCOS: Principais riscos identificados
5. CONCLUSÃO: Classificação de risco (Baixo/Médio/Alto) e recomendação

Seja objetivo, técnico e forneça um score de 0 a 100.`,
        response_json_schema: {
          type: "object",
          properties: {
            analise: { type: "string" },
            score: { type: "number" },
            recomendacao: { type: "string" }
          }
        }
      });

      await updateMutation.mutateAsync({
        analise_ia: result.analise,
        score_compatibilidade: result.score
      });
      
      toast.success("Análise de Viabilidade concluída!");
    } catch (error) {
      console.error("Erro na análise:", error);
      toast.error("Erro ao solicitar análise.");
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
        <div className="flex items-start justify-between mb-8">
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
            <div className="flex items-center gap-3">
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

          <div className="flex items-center gap-3">
            <Button 
              variant="outline" 
              onClick={handleAnalyze}
              disabled={isAnalyzing}
              className="gap-2"
            >
              <Sparkles className="w-4 h-4" />
              {isAnalyzing ? "Analisando..." : "Analisar com IA"}
            </Button>
            <Button 
              onClick={handleSave}
              disabled={updateMutation.isPending}
              className="gap-2 bg-slate-900 hover:bg-slate-800"
            >
              <Save className="w-4 h-4" />
              {updateMutation.isPending ? "Salvando..." : "Salvar"}
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

        <Tabs defaultValue="info" className="space-y-6">
          <TabsList className="bg-white border border-slate-200 p-1">
            <TabsTrigger value="info">Informações</TabsTrigger>
            <TabsTrigger value="proposta">Proposta</TabsTrigger>
            <TabsTrigger value="equipe">Equipe Técnica</TabsTrigger>
          </TabsList>

          {/* Tab: Informações */}
          <TabsContent value="info" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Dados Principais */}
              <div className="lg:col-span-2 space-y-6">
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
                    {!oportunidade.analise_ia && (
                      <Button 
                        size="sm" 
                        onClick={handleAnalyze}
                        disabled={isAnalyzing}
                        className="bg-primary text-primary-foreground hover:bg-primary/90"
                      >
                        {isAnalyzing ? (
                          <>
                            <Clock className="mr-2 h-4 w-4 animate-spin" />
                            Processando...
                          </>
                        ) : (
                          <>
                            <Sparkles className="mr-2 h-4 w-4" />
                            Gerar Análise
                          </>
                        )}
                      </Button>
                    )}
                  </CardHeader>
                  <CardContent>
                    {oportunidade.analise_ia ? (
                      <div className="space-y-4">
                        <div className="p-4 rounded-md glass-panel tech-border text-sm leading-relaxed whitespace-pre-line text-foreground font-mono">
                          {oportunidade.analise_ia}
                        </div>
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={handleAnalyze}
                          disabled={isAnalyzing}
                          className="w-full"
                        >
                          <Sparkles className="mr-2 h-4 w-4" />
                          Atualizar Análise
                        </Button>
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
              <div className="space-y-6">
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

          {/* Tab: Proposta */}
          <TabsContent value="proposta">
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