import { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import OportunidadeCard from "@/components/dashboard/OportunidadeCard";

import { 
  Target, 
  Plus, 
  Search, 
  Filter,
  SlidersHorizontal,
  LayoutGrid,
  List,
  Building2
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { createPageUrl } from "@/utils";
import { toast } from "sonner";

export default function Oportunidades() {
  const [showForm, setShowForm] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [viewMode, setViewMode] = useState("grid");
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [formData, setFormData] = useState({
    numero_edital: "",
    orgao_licitante: "",
    objeto: "",
    modalidade: "Pregão Eletrônico",
    valor_estimado: "",
    data_abertura: "",
    link_edital: "",
    uf: "",
    municipio: "",
    status: "nova",
    edital_pdf_file: null
  });
  
  const queryClient = useQueryClient();

  const { data: oportunidades = [], isLoading } = useQuery({
    queryKey: ['oportunidades'],
    queryFn: () => base44.entities.Oportunidade.list('-created_date')
  });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.Oportunidade.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['oportunidades'] });
      setShowForm(false);
      setFormData({
        numero_edital: "",
        orgao_licitante: "",
        objeto: "",
        modalidade: "Pregão Eletrônico",
        valor_estimado: "",
        data_abertura: "",
        link_edital: "",
        uf: "",
        municipio: "",
        status: "nova",
        edital_pdf_file: null
      });
    }
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    let edital_pdf_url = null;
    let aiAnalysisData = {};

    if (formData.edital_pdf_file) {
      try {
        const { file_url } = await base44.integrations.Core.UploadFile({ file: formData.edital_pdf_file });
        edital_pdf_url = file_url;
        
        // Análise automática com IA
        setIsAnalyzing(true);
        toast.info("IA analisando o edital...");
        
        const result = await base44.integrations.Core.InvokeLLM({
          prompt: `Você é um especialista em licitações e análise de editais. Analise este edital e extraia as seguintes informações estruturadas:

Contexto atual:
- OBJETO: ${formData.objeto}
- ÓRGÃO: ${formData.orgao_licitante}
- MODALIDADE: ${formData.modalidade}

Extraia e forneça em JSON:
1. numero_edital: Número exato do edital
2. data_abertura: Data e hora da abertura (ISO format)
3. data_limite_proposta: Prazo limite para propostas (ISO format)
4. valor_estimado: Valor estimado (número)
5. score_compatibilidade: Score de 0-100
6. checklist_tarefas: Array com tarefas necessárias para montar a proposta

Seja preciso e objetivo.`,
          response_json_schema: {
            type: "object",
            properties: {
              numero_edital: { type: "string" },
              data_abertura: { type: "string" },
              data_limite_proposta: { type: "string" },
              valor_estimado: { type: "number" },
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
          file_urls: [edital_pdf_url]
        });

        // Formatar checklist
        const checklistFormatado = result.checklist_tarefas?.map((item, idx) => ({
          id: `task-${idx}`,
          categoria: item.categoria,
          tarefa: item.tarefa,
          obrigatorio: item.obrigatorio ?? true,
          concluido: false
        })) || [];

        aiAnalysisData = {
          numero_edital: result.numero_edital,
          data_abertura: result.data_abertura,
          data_limite_proposta: result.data_limite_proposta,
          valor_estimado: result.valor_estimado,
          score_compatibilidade: result.score_compatibilidade,
          checklist_proposta: checklistFormatado
        };

        toast.success("Edital analisado com sucesso!");
      } catch (error) {
        console.error("Erro ao analisar PDF:", error);
        toast.error("Erro ao analisar edital. Continuando com dados manuais.");
      } finally {
        setIsAnalyzing(false);
      }
    }

    await createMutation.mutateAsync({
      ...formData,
      edital_pdf_file: undefined,
      valor_estimado: formData.valor_estimado ? parseFloat(formData.valor_estimado) : null,
      ...(edital_pdf_url && { edital_pdf_url }),
      ...aiAnalysisData
    });
  };

  const filteredOportunidades = oportunidades.filter(o => {
    const matchSearch = o.objeto?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                       o.orgao_licitante?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                       o.numero_edital?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchStatus = statusFilter === "all" || o.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const statusCounts = {
    all: oportunidades.length,
    nova: oportunidades.filter(o => o.status === "nova").length,
    em_analise: oportunidades.filter(o => o.status === "em_analise").length,
    aprovada: oportunidades.filter(o => o.status === "aprovada").length,
    proposta_enviada: oportunidades.filter(o => o.status === "proposta_enviada").length
  };

  const formatCurrency = (value) => {
    if (!value) return "—";
    return new Intl.NumberFormat('pt-BR', { 
      style: 'currency', 
      currency: 'BRL',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(value);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-50">
      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6 md:mb-8 gap-4">
          <div>
            <h1 className="text-3xl font-bold text-slate-900 tracking-tight">
              Oportunidades
            </h1>
            <p className="text-slate-500 mt-1">
              Gerencie editais e licitações
            </p>
          </div>
          <Button 
            onClick={() => setShowForm(true)}
            className="gap-2 bg-slate-900 hover:bg-slate-800"
          >
            <Plus className="w-4 h-4" />
            Nova Oportunidade
          </Button>
        </div>

        {/* Filters Bar */}
        <div className="flex flex-col lg:flex-row gap-4 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
            <Input
              placeholder="Buscar por objeto, órgão ou número..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-12 h-12 bg-white border-slate-200"
            />
          </div>
          
          <div className="flex gap-3">
            <Tabs value={statusFilter} onValueChange={setStatusFilter} className="bg-white rounded-lg border border-slate-200">
              <TabsList className="h-12 p-1 bg-transparent">
                <TabsTrigger value="all" className="gap-1 data-[state=active]:bg-slate-100">
                  Todas <Badge variant="secondary" className="ml-1">{statusCounts.all}</Badge>
                </TabsTrigger>
                <TabsTrigger value="nova" className="gap-1 data-[state=active]:bg-blue-100 data-[state=active]:text-blue-700">
                  Novas <Badge variant="secondary" className="ml-1 bg-blue-100 text-blue-700">{statusCounts.nova}</Badge>
                </TabsTrigger>
                <TabsTrigger value="em_analise" className="gap-1 data-[state=active]:bg-amber-100 data-[state=active]:text-amber-700">
                  Análise <Badge variant="secondary" className="ml-1">{statusCounts.em_analise}</Badge>
                </TabsTrigger>
                <TabsTrigger value="aprovada" className="gap-1 data-[state=active]:bg-emerald-100 data-[state=active]:text-emerald-700">
                  Aprovadas <Badge variant="secondary" className="ml-1">{statusCounts.aprovada}</Badge>
                </TabsTrigger>
              </TabsList>
            </Tabs>

            <div className="flex border border-slate-200 rounded-lg bg-white">
              <Button 
                variant="ghost" 
                size="icon"
                className={cn("rounded-r-none", viewMode === "grid" && "bg-slate-100")}
                onClick={() => setViewMode("grid")}
              >
                <LayoutGrid className="w-4 h-4" />
              </Button>
              <Button 
                variant="ghost" 
                size="icon"
                className={cn("rounded-l-none", viewMode === "list" && "bg-slate-100")}
                onClick={() => setViewMode("list")}
              >
                <List className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>

        {/* Content */}
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <Card key={i} className="animate-pulse">
                <CardContent className="p-6">
                  <div className="h-6 bg-slate-200 rounded mb-4" />
                  <div className="h-4 bg-slate-200 rounded w-2/3 mb-2" />
                  <div className="h-4 bg-slate-200 rounded w-1/2" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : filteredOportunidades.length === 0 ? (
          <Card className="border-dashed border-2 border-slate-300">
            <CardContent className="py-16 text-center">
              <Target className="w-16 h-16 text-slate-300 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-slate-700 mb-2">
                {searchTerm || statusFilter !== "all" 
                  ? "Nenhuma oportunidade encontrada" 
                  : "Nenhuma oportunidade cadastrada"
                }
              </h3>
              <p className="text-slate-500 mb-6">
                {searchTerm || statusFilter !== "all"
                  ? "Tente ajustar os filtros de busca"
                  : "Comece cadastrando ou buscando editais"
                }
              </p>
              {!searchTerm && statusFilter === "all" && (
                <Button onClick={() => setShowForm(true)} className="gap-2">
                  <Plus className="w-4 h-4" />
                  Cadastrar Oportunidade
                </Button>
              )}
            </CardContent>
          </Card>
        ) : viewMode === "grid" ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredOportunidades.map((oportunidade) => (
              <OportunidadeCard 
                key={oportunidade.id} 
                oportunidade={oportunidade}
                onClick={() => window.location.href = createPageUrl("OportunidadeDetalhe") + `?id=${oportunidade.id}`}
              />
            ))}
          </div>
        ) : (
          <Card className="border-slate-200">
            <CardContent className="p-0">
              <div className="divide-y divide-slate-100">
                {filteredOportunidades.map((oportunidade) => (
                  <div 
                    key={oportunidade.id}
                    className="flex items-center justify-between p-4 hover:bg-slate-50 cursor-pointer transition-colors"
                    onClick={() => window.location.href = createPageUrl("OportunidadeDetalhe") + `?id=${oportunidade.id}`}
                  >
                    <div className="flex-1 min-w-0 mr-4">
                      <h3 className="font-medium text-slate-900 truncate">{oportunidade.objeto}</h3>
                      <p className="text-sm text-slate-500">{oportunidade.orgao_licitante}</p>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <p className="font-semibold text-slate-900">
                          {formatCurrency(oportunidade.valor_estimado)}
                        </p>
                        <p className="text-xs text-slate-500">{oportunidade.modalidade}</p>
                      </div>
                      <Badge variant="outline">
                        {oportunidade.status?.replace(/_/g, ' ')}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Modal de Criação */}
        <Dialog open={showForm} onOpenChange={setShowForm}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Nova Oportunidade</DialogTitle>
            </DialogHeader>
            
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Número do Edital</Label>
                  <Input
                    value={formData.numero_edital}
                    onChange={(e) => setFormData(f => ({ ...f, numero_edital: e.target.value }))}
                    placeholder="PE 001/2024"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Modalidade</Label>
                  <Select 
                    value={formData.modalidade} 
                    onValueChange={(v) => setFormData(f => ({ ...f, modalidade: v }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Pregão Eletrônico">Pregão Eletrônico</SelectItem>
                      <SelectItem value="Pregão Presencial">Pregão Presencial</SelectItem>
                      <SelectItem value="Concorrência">Concorrência</SelectItem>
                      <SelectItem value="Tomada de Preços">Tomada de Preços</SelectItem>
                      <SelectItem value="Convite">Convite</SelectItem>
                      <SelectItem value="RDC">RDC</SelectItem>
                      <SelectItem value="Dispensa">Dispensa</SelectItem>
                      <SelectItem value="Inexigibilidade">Inexigibilidade</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Órgão Licitante *</Label>
                <Input
                  value={formData.orgao_licitante}
                  onChange={(e) => setFormData(f => ({ ...f, orgao_licitante: e.target.value }))}
                  placeholder="Prefeitura Municipal de..."
                  required
                />
              </div>

              <div className="space-y-2">
                <Label>Objeto *</Label>
                <Textarea
                  value={formData.objeto}
                  onChange={(e) => setFormData(f => ({ ...f, objeto: e.target.value }))}
                  placeholder="Descrição do objeto da licitação"
                  rows={3}
                  required
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Valor Estimado (R$)</Label>
                  <Input
                    type="number"
                    value={formData.valor_estimado}
                    onChange={(e) => setFormData(f => ({ ...f, valor_estimado: e.target.value }))}
                    placeholder="100000"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Data/Hora de Abertura</Label>
                  <Input
                    type="datetime-local"
                    value={formData.data_abertura}
                    onChange={(e) => setFormData(f => ({ ...f, data_abertura: e.target.value }))}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>UF</Label>
                  <Input
                    value={formData.uf}
                    onChange={(e) => setFormData(f => ({ ...f, uf: e.target.value.toUpperCase() }))}
                    placeholder="PE"
                    maxLength={2}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Município</Label>
                  <Input
                    value={formData.municipio}
                    onChange={(e) => setFormData(f => ({ ...f, municipio: e.target.value }))}
                    placeholder="Recife"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Link do Edital</Label>
                <Input
                  type="url"
                  value={formData.link_edital}
                  onChange={(e) => setFormData(f => ({ ...f, link_edital: e.target.value }))}
                  placeholder="https://..."
                />
              </div>

              <div className="space-y-2">
                <Label>PDF do Edital</Label>
                <Input
                  type="file"
                  accept=".pdf"
                  onChange={(e) => setFormData(f => ({ ...f, edital_pdf_file: e.target.files?.[0] || null }))}
                  className="cursor-pointer"
                />
                <p className="text-xs text-slate-500">A IA analisará o PDF automaticamente ao criar a oportunidade</p>
              </div>

              <div className="flex justify-end gap-3 pt-4">
                <Button type="button" variant="outline" onClick={() => setShowForm(false)} disabled={isAnalyzing}>
                  Cancelar
                </Button>
                <Button type="submit" className="bg-slate-900 hover:bg-slate-800" disabled={isAnalyzing || createMutation.isPending}>
                  {isAnalyzing ? "Analisando com IA..." : createMutation.isPending ? "Salvando..." : "Cadastrar Oportunidade"}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}