import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import ProfissionalForm from "@/components/forms/ProfissionalForm";
import { 
  Users, 
  Plus, 
  Search, 
  MoreVertical, 
  Pencil, 
  Trash2,
  FileText,
  AlertTriangle,
  CheckCircle,
  Clock,
  Building2
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
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
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
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

export default function Profissionais() {
  const [showForm, setShowForm] = useState(false);
  const [editingProfissional, setEditingProfissional] = useState(null);
  const [deletingProfissional, setDeletingProfissional] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [empresaFilter, setEmpresaFilter] = useState("all");
  
  const queryClient = useQueryClient();

  // Pegar filtro da URL
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const empresaId = params.get('empresa');
    if (empresaId) {
      setEmpresaFilter(empresaId);
    }
  }, []);

  const { data: profissionais = [], isLoading } = useQuery({
    queryKey: ['profissionais'],
    queryFn: () => base44.entities.Profissional.list()
  });

  const { data: empresas = [] } = useQuery({
    queryKey: ['empresas'],
    queryFn: () => base44.entities.Empresa.list()
  });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.Profissional.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['profissionais'] });
      setShowForm(false);
    }
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Profissional.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['profissionais'] });
      setEditingProfissional(null);
    }
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.Profissional.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['profissionais'] });
      setDeletingProfissional(null);
    }
  });

  const handleSave = async (data) => {
    if (editingProfissional) {
      await updateMutation.mutateAsync({ id: editingProfissional.id, data });
    } else {
      await createMutation.mutateAsync(data);
    }
  };

  const getEmpresaNome = (empresaId) => {
    return empresas.find(e => e.id === empresaId)?.nome_fantasia || "—";
  };

  const getCRQStatus = (profissional) => {
    if (!profissional.validade_crq) {
      return { status: "pendente", color: "slate", icon: Clock, label: "Pendente" };
    }
    const dias = moment(profissional.validade_crq).diff(moment(), 'days');
    if (dias < 0) return { status: "vencido", color: "red", icon: AlertTriangle, label: "Vencido" };
    if (dias <= 10) return { status: "critico", color: "red", icon: AlertTriangle, label: `${dias}d - Crítico` };
    if (dias <= 30) return { status: "alerta", color: "amber", icon: AlertTriangle, label: `${dias} dias` };
    return { status: "regular", color: "emerald", icon: CheckCircle, label: "Regular" };
  };

  const filteredProfissionais = profissionais.filter(p => {
    const matchSearch = p.nome?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                       p.registro_profissional?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchEmpresa = empresaFilter === "all" || p.empresa_id === empresaFilter;
    return matchSearch && matchEmpresa;
  });

  const cargoColors = {
    "Engenheiro Civil": "bg-blue-100 text-blue-700",
    "Arquiteto": "bg-purple-100 text-purple-700",
    "Engenheiro Eletricista": "bg-amber-100 text-amber-700",
    "Engenheiro Mecânico": "bg-orange-100 text-orange-700",
    "Técnico em Edificações": "bg-cyan-100 text-cyan-700",
    "Técnico em Segurança": "bg-rose-100 text-rose-700",
    "Outro": "bg-slate-100 text-slate-700"
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6 sm:mb-8 gap-4">
          <div className="min-w-0 flex-1">
            <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
              Equipe Técnica
            </h1>
            <p className="text-slate-500 mt-1 text-sm">
              Gerencie profissionais e acervo técnico
            </p>
          </div>
          <Button 
            onClick={() => setShowForm(true)}
            className="gap-2 bg-slate-900 hover:bg-slate-800 w-full sm:w-auto"
          >
            <Plus className="w-4 h-4" />
            <span className="hidden sm:inline">Novo Profissional</span>
            <span className="sm:hidden">Novo</span>
          </Button>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 sm:w-5 h-4 sm:h-5 text-slate-400" />
            <Input
              placeholder="Buscar por nome ou registro..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 sm:pl-12 h-10 sm:h-12 bg-white border-slate-200 text-sm"
            />
          </div>
          <Select value={empresaFilter} onValueChange={setEmpresaFilter}>
            <SelectTrigger className="w-full sm:w-64 h-10 sm:h-12 bg-white text-sm">
              <Building2 className="w-3.5 sm:w-4 h-3.5 sm:h-4 mr-2 text-slate-400" />
              <SelectValue placeholder="Filtrar por empresa" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas as empresas</SelectItem>
              {empresas.map(e => (
                <SelectItem key={e.id} value={e.id}>{e.nome_fantasia}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Grid */}
        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 lg:gap-6">
            {[1, 2, 3].map((i) => (
              <Card key={i} className="animate-pulse">
                <CardContent className="p-6">
                  <div className="h-16 bg-slate-200 rounded-lg mb-4" />
                  <div className="h-4 bg-slate-200 rounded w-2/3" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : filteredProfissionais.length === 0 ? (
          <Card className="border-dashed border-2 border-slate-300">
            <CardContent className="py-12 sm:py-16 text-center px-4">
              <Users className="w-10 sm:w-16 h-10 sm:h-16 text-slate-300 mx-auto mb-4" />
              <h3 className="text-lg sm:text-xl font-semibold text-slate-700 mb-2">
                {searchTerm || empresaFilter !== "all" 
                  ? "Nenhum profissional encontrado" 
                  : "Nenhum profissional cadastrado"
                }
              </h3>
              <p className="text-slate-500 mb-6">
                {searchTerm || empresaFilter !== "all"
                  ? "Tente ajustar os filtros"
                  : "Comece cadastrando o primeiro profissional"
                }
              </p>
              {!searchTerm && empresaFilter === "all" && (
                <Button onClick={() => setShowForm(true)} className="gap-2">
                  <Plus className="w-4 h-4" />
                  Cadastrar Profissional
                </Button>
              )}
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 lg:gap-6">
            {filteredProfissionais.map((profissional) => {
              const crqStatus = getCRQStatus(profissional);
              const StatusIcon = crqStatus.icon;
              
              return (
                <Card 
                  key={profissional.id}
                  className="group hover:shadow-xl transition-all duration-300 border-slate-200"
                >
                  <CardContent className="p-4 sm:p-6">
                    <div className="flex items-start justify-between mb-4 gap-2">
                      <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
                        <div className="w-9 sm:w-12 h-9 sm:h-12 rounded-full bg-gradient-to-br from-slate-100 to-slate-200 flex items-center justify-center flex-shrink-0">
                          <span className="text-sm sm:text-lg font-bold text-slate-600">
                            {profissional.nome?.charAt(0).toUpperCase()}
                          </span>
                        </div>
                        <div className="min-w-0 flex-1">
                          <h3 className="font-semibold text-slate-900 line-clamp-1 text-sm sm:text-base">
                            {profissional.nome}
                          </h3>
                          <p className="text-xs sm:text-sm text-slate-500 truncate">
                            {profissional.registro_profissional || "Sem registro"}
                          </p>
                        </div>
                      </div>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="opacity-0 group-hover:opacity-100">
                            <MoreVertical className="w-4 h-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => setEditingProfissional(profissional)}>
                            <Pencil className="w-4 h-4 mr-2" />
                            Editar
                          </DropdownMenuItem>
                          <DropdownMenuItem 
                            onClick={() => setDeletingProfissional(profissional)}
                            className="text-red-600"
                          >
                            <Trash2 className="w-4 h-4 mr-2" />
                            Excluir
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>

                    <div className="space-y-2 sm:space-y-3">
                      <div className="flex flex-wrap gap-2">
                        <Badge className={cn("border-0 text-xs sm:text-sm", cargoColors[profissional.cargo] || cargoColors["Outro"])}>
                          {profissional.cargo}
                        </Badge>
                        {profissional.is_responsavel_tecnico && (
                          <Badge variant="outline" className="border-blue-200 text-blue-700 bg-blue-50 text-xs">
                            RT
                          </Badge>
                        )}
                      </div>

                      <p className="text-xs sm:text-sm text-slate-500 truncate">
                        {getEmpresaNome(profissional.empresa_id)}
                      </p>

                      {/* Status CRQ */}
                      <div className={cn(
                        "flex items-center gap-2 p-2 sm:p-3 rounded-lg text-xs",
                        crqStatus.color === "red" && "bg-red-50",
                        crqStatus.color === "amber" && "bg-amber-50",
                        crqStatus.color === "emerald" && "bg-emerald-50",
                        crqStatus.color === "slate" && "bg-slate-50"
                      )}>
                        <StatusIcon className={cn(
                          "w-3.5 sm:w-4 h-3.5 sm:h-4 flex-shrink-0",
                          crqStatus.color === "red" && "text-red-600",
                          crqStatus.color === "amber" && "text-amber-600",
                          crqStatus.color === "emerald" && "text-emerald-600",
                          crqStatus.color === "slate" && "text-slate-400"
                        )} />
                        <span className={cn(
                          "font-medium",
                          crqStatus.color === "red" && "text-red-700",
                          crqStatus.color === "amber" && "text-amber-700",
                          crqStatus.color === "emerald" && "text-emerald-700",
                          crqStatus.color === "slate" && "text-slate-600"
                        )}>
                          CRQ: {crqStatus.label}
                        </span>
                      </div>

                      {/* Documentos */}
                      <div className="flex gap-2 pt-1 sm:pt-2">
                        {profissional.acervo_tecnico_url && (
                          <a 
                            href={profissional.acervo_tecnico_url} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="flex items-center gap-1 text-xs text-blue-600 hover:underline"
                          >
                            <FileText className="w-2.5 sm:w-3 h-2.5 sm:h-3" />
                            <span className="hidden sm:inline">Acervo</span>
                          </a>
                        )}
                        {profissional.certidao_crq_url && (
                          <a 
                            href={profissional.certidao_crq_url} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="flex items-center gap-1 text-xs text-blue-600 hover:underline"
                          >
                            <FileText className="w-2.5 sm:w-3 h-2.5 sm:h-3" />
                            <span className="hidden sm:inline">CRQ</span>
                          </a>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}

        {/* Sheet de Criação/Edição */}
        <Sheet open={showForm || !!editingProfissional} onOpenChange={(open) => {
          if (!open) {
            setShowForm(false);
            setEditingProfissional(null);
          }
        }}>
          <SheetContent className="w-full max-w-md sm:max-w-xl overflow-y-auto p-4 sm:p-6">
            <SheetHeader className="mb-6">
              <SheetTitle>
                {editingProfissional ? "Editar Profissional" : "Novo Profissional"}
              </SheetTitle>
            </SheetHeader>
            <ProfissionalForm 
              profissional={editingProfissional}
              empresaId={empresaFilter !== "all" ? empresaFilter : null}
              onSave={handleSave}
              onCancel={() => {
                setShowForm(false);
                setEditingProfissional(null);
              }}
            />
          </SheetContent>
        </Sheet>

        {/* Alert de Exclusão */}
        <AlertDialog open={!!deletingProfissional} onOpenChange={(open) => !open && setDeletingProfissional(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Excluir profissional?</AlertDialogTitle>
              <AlertDialogDescription>
                Tem certeza que deseja excluir "{deletingProfissional?.nome}"? 
                Esta ação não pode ser desfeita.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancelar</AlertDialogCancel>
              <AlertDialogAction 
                onClick={() => deleteMutation.mutate(deletingProfissional?.id)}
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