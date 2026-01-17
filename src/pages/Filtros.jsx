import { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { 
  Filter, 
  Plus, 
  MoreVertical, 
  Pencil, 
  Trash2,
  Building2,
  Check,
  X,
  Search,
  Target
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

export default function Filtros() {
  const [showForm, setShowForm] = useState(false);
  const [editingFiltro, setEditingFiltro] = useState(null);
  const [deletingFiltro, setDeletingFiltro] = useState(null);
  
  const [formData, setFormData] = useState({
    nome_filtro: "",
    empresa_id: "",
    palavras_positivas: "",
    palavras_negativas: "",
    valor_minimo: "",
    valor_maximo: "",
    estados_atuacao: "",
    modalidades: "",
    ativo: true
  });
  
  const queryClient = useQueryClient();

  const { data: filtros = [], isLoading } = useQuery({
    queryKey: ['filtros'],
    queryFn: () => base44.entities.FiltroLicitacao.list()
  });

  const { data: empresas = [] } = useQuery({
    queryKey: ['empresas'],
    queryFn: () => base44.entities.Empresa.list()
  });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.FiltroLicitacao.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['filtros'] });
      resetForm();
    }
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.FiltroLicitacao.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['filtros'] });
      resetForm();
    }
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.FiltroLicitacao.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['filtros'] });
      setDeletingFiltro(null);
    }
  });

  const resetForm = () => {
    setShowForm(false);
    setEditingFiltro(null);
    setFormData({
      nome_filtro: "",
      empresa_id: "",
      palavras_positivas: "",
      palavras_negativas: "",
      valor_minimo: "",
      valor_maximo: "",
      estados_atuacao: "",
      modalidades: "",
      ativo: true
    });
  };

  const handleEdit = (filtro) => {
    setEditingFiltro(filtro);
    setFormData({
      nome_filtro: filtro.nome_filtro || "",
      empresa_id: filtro.empresa_id || "",
      palavras_positivas: filtro.palavras_positivas || "",
      palavras_negativas: filtro.palavras_negativas || "",
      valor_minimo: filtro.valor_minimo || "",
      valor_maximo: filtro.valor_maximo || "",
      estados_atuacao: filtro.estados_atuacao || "",
      modalidades: filtro.modalidades || "",
      ativo: filtro.ativo !== false
    });
    setShowForm(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const data = {
      ...formData,
      valor_minimo: formData.valor_minimo ? parseFloat(formData.valor_minimo) : null,
      valor_maximo: formData.valor_maximo ? parseFloat(formData.valor_maximo) : null
    };
    
    if (editingFiltro) {
      await updateMutation.mutateAsync({ id: editingFiltro.id, data });
    } else {
      await createMutation.mutateAsync(data);
    }
  };

  const toggleFiltro = async (filtro) => {
    await updateMutation.mutateAsync({
      id: filtro.id,
      data: { ativo: !filtro.ativo }
    });
  };

  const getEmpresaNome = (empresaId) => {
    if (!empresaId) return "Global (todas empresas)";
    return empresas.find(e => e.id === empresaId)?.nome_fantasia || "—";
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
      <div className="max-w-5xl mx-auto px-6 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-slate-900 tracking-tight">
              Filtros de Busca
            </h1>
            <p className="text-slate-500 mt-1">
              Configure critérios para busca automática de editais
            </p>
          </div>
          <Button 
            onClick={() => setShowForm(true)}
            className="gap-2 bg-slate-900 hover:bg-slate-800"
          >
            <Plus className="w-4 h-4" />
            Novo Filtro
          </Button>
        </div>

        {/* Info Card */}
        <Card className="mb-6 border-blue-200 bg-blue-50">
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              <Target className="w-5 h-5 text-blue-600 mt-0.5" />
              <div>
                <p className="font-medium text-blue-900">Como funcionam os filtros</p>
                <p className="text-sm text-blue-700 mt-1">
                  Os filtros são usados para identificar automaticamente oportunidades compatíveis.
                  <strong> Palavras positivas</strong> aumentam a relevância, 
                  <strong> palavras negativas</strong> descartam editais indesejados.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Lista de Filtros */}
        {isLoading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <Card key={i} className="animate-pulse">
                <CardContent className="p-6">
                  <div className="h-6 bg-slate-200 rounded w-1/3" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : filtros.length === 0 ? (
          <Card className="border-dashed border-2 border-slate-300">
            <CardContent className="py-16 text-center">
              <Filter className="w-16 h-16 text-slate-300 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-slate-700 mb-2">
                Nenhum filtro configurado
              </h3>
              <p className="text-slate-500 mb-6">
                Crie filtros para automatizar a busca de oportunidades
              </p>
              <Button onClick={() => setShowForm(true)} className="gap-2">
                <Plus className="w-4 h-4" />
                Criar Primeiro Filtro
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {filtros.map((filtro) => (
              <Card 
                key={filtro.id}
                className={cn(
                  "border-slate-200 transition-all",
                  !filtro.ativo && "opacity-60"
                )}
              >
                <CardContent className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-3">
                        <h3 className="text-lg font-semibold text-slate-900">
                          {filtro.nome_filtro}
                        </h3>
                        <Badge 
                          variant={filtro.ativo ? "default" : "secondary"}
                          className={filtro.ativo ? "bg-emerald-100 text-emerald-700" : ""}
                        >
                          {filtro.ativo ? "Ativo" : "Inativo"}
                        </Badge>
                      </div>

                      <div className="flex items-center gap-2 text-sm text-slate-500 mb-4">
                        <Building2 className="w-4 h-4" />
                        {getEmpresaNome(filtro.empresa_id)}
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {filtro.palavras_positivas && (
                          <div>
                            <p className="text-xs text-slate-500 uppercase tracking-wider mb-2">
                              Palavras Positivas
                            </p>
                            <div className="flex flex-wrap gap-1">
                              {filtro.palavras_positivas.split(',').map((p, i) => (
                                <Badge 
                                  key={i} 
                                  variant="outline" 
                                  className="bg-emerald-50 text-emerald-700 border-emerald-200"
                                >
                                  <Check className="w-3 h-3 mr-1" />
                                  {p.trim()}
                                </Badge>
                              ))}
                            </div>
                          </div>
                        )}

                        {filtro.palavras_negativas && (
                          <div>
                            <p className="text-xs text-slate-500 uppercase tracking-wider mb-2">
                              Palavras Negativas (Descarte)
                            </p>
                            <div className="flex flex-wrap gap-1">
                              {filtro.palavras_negativas.split(',').map((p, i) => (
                                <Badge 
                                  key={i} 
                                  variant="outline" 
                                  className="bg-red-50 text-red-700 border-red-200"
                                >
                                  <X className="w-3 h-3 mr-1" />
                                  {p.trim()}
                                </Badge>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>

                      <div className="flex items-center gap-6 mt-4 text-sm text-slate-600">
                        {(filtro.valor_minimo || filtro.valor_maximo) && (
                          <span>
                            Valor: {formatCurrency(filtro.valor_minimo)} - {formatCurrency(filtro.valor_maximo)}
                          </span>
                        )}
                        {filtro.estados_atuacao && (
                          <span>UFs: {filtro.estados_atuacao}</span>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <Switch
                        checked={filtro.ativo}
                        onCheckedChange={() => toggleFiltro(filtro)}
                      />
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreVertical className="w-4 h-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => handleEdit(filtro)}>
                            <Pencil className="w-4 h-4 mr-2" />
                            Editar
                          </DropdownMenuItem>
                          <DropdownMenuItem 
                            onClick={() => setDeletingFiltro(filtro)}
                            className="text-red-600"
                          >
                            <Trash2 className="w-4 h-4 mr-2" />
                            Excluir
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Modal de Criação/Edição */}
        <Dialog open={showForm} onOpenChange={(open) => !open && resetForm()}>
          <DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {editingFiltro ? "Editar Filtro" : "Novo Filtro de Busca"}
              </DialogTitle>
            </DialogHeader>
            
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <Label>Nome do Filtro *</Label>
                <Input
                  value={formData.nome_filtro}
                  onChange={(e) => setFormData(f => ({ ...f, nome_filtro: e.target.value }))}
                  placeholder="Ex: Obras de Engenharia PE"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label>Empresa (opcional)</Label>
                <Select 
                  value={formData.empresa_id || "global"} 
                  onValueChange={(v) => setFormData(f => ({ ...f, empresa_id: v === "global" ? "" : v }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="global">Global (todas empresas)</SelectItem>
                    {empresas.map(e => (
                      <SelectItem key={e.id} value={e.id}>{e.nome_fantasia}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-xs text-slate-500">
                  Deixe vazio para aplicar a todas as empresas
                </p>
              </div>

              <div className="space-y-2">
                <Label>Palavras-Chave Positivas</Label>
                <Textarea
                  value={formData.palavras_positivas}
                  onChange={(e) => setFormData(f => ({ ...f, palavras_positivas: e.target.value }))}
                  placeholder="Restauro, Reforma, Projeto Executivo, Consultoria"
                  rows={2}
                />
                <p className="text-xs text-slate-500">
                  Separe por vírgulas. Editais com essas palavras terão prioridade.
                </p>
              </div>

              <div className="space-y-2">
                <Label>Palavras-Chave Negativas (Descarte)</Label>
                <Textarea
                  value={formData.palavras_negativas}
                  onChange={(e) => setFormData(f => ({ ...f, palavras_negativas: e.target.value }))}
                  placeholder="Limpeza Urbana, Locação de Mão de Obra, Pavimentação"
                  rows={2}
                />
                <p className="text-xs text-slate-500">
                  Editais com essas palavras serão descartados automaticamente.
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Valor Mínimo (R$)</Label>
                  <Input
                    type="number"
                    value={formData.valor_minimo}
                    onChange={(e) => setFormData(f => ({ ...f, valor_minimo: e.target.value }))}
                    placeholder="50000"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Valor Máximo (R$)</Label>
                  <Input
                    type="number"
                    value={formData.valor_maximo}
                    onChange={(e) => setFormData(f => ({ ...f, valor_maximo: e.target.value }))}
                    placeholder="5000000"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Estados de Atuação</Label>
                <Input
                  value={formData.estados_atuacao}
                  onChange={(e) => setFormData(f => ({ ...f, estados_atuacao: e.target.value.toUpperCase() }))}
                  placeholder="PE, PB, AL, RN"
                />
                <p className="text-xs text-slate-500">
                  Siglas separadas por vírgula. Deixe vazio para nacional.
                </p>
              </div>

              <div className="space-y-2">
                <Label>Modalidades Aceitas</Label>
                <Input
                  value={formData.modalidades}
                  onChange={(e) => setFormData(f => ({ ...f, modalidades: e.target.value }))}
                  placeholder="Pregão, Concorrência, Tomada de Preços"
                />
              </div>

              <div className="flex items-center gap-3 p-4 bg-slate-50 rounded-lg">
                <Switch
                  checked={formData.ativo}
                  onCheckedChange={(checked) => setFormData(f => ({ ...f, ativo: checked }))}
                />
                <div>
                  <Label className="font-medium">Filtro Ativo</Label>
                  <p className="text-xs text-slate-500">Filtros inativos não são usados na busca</p>
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4">
                <Button type="button" variant="outline" onClick={resetForm}>
                  Cancelar
                </Button>
                <Button type="submit" className="bg-slate-900 hover:bg-slate-800">
                  {editingFiltro ? "Salvar Alterações" : "Criar Filtro"}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>

        {/* Alert de Exclusão */}
        <AlertDialog open={!!deletingFiltro} onOpenChange={(open) => !open && setDeletingFiltro(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Excluir filtro?</AlertDialogTitle>
              <AlertDialogDescription>
                Tem certeza que deseja excluir o filtro "{deletingFiltro?.nome_filtro}"? 
                Esta ação não pode ser desfeita.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancelar</AlertDialogCancel>
              <AlertDialogAction 
                onClick={() => deleteMutation.mutate(deletingFiltro?.id)}
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