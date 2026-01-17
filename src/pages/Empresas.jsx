import { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import EmpresaForm from "@/components/forms/EmpresaForm";
import { 
  Building2, 
  Plus, 
  Search, 
  MoreVertical, 
  Pencil, 
  Trash2,
  Users,
  FileCheck,
  ExternalLink
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
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
import { Link } from "react-router-dom";
import { createPageUrl } from "@/pages/utils";

export default function Empresas() {
  const [showForm, setShowForm] = useState(false);
  const [editingEmpresa, setEditingEmpresa] = useState(null);
  const [deletingEmpresa, setDeletingEmpresa] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  
  const queryClient = useQueryClient();

  const { data: empresas = [], isLoading } = useQuery({
    queryKey: ['empresas'],
    queryFn: () => base44.entities.Empresa.list()
  });

  const { data: profissionais = [] } = useQuery({
    queryKey: ['profissionais'],
    queryFn: () => base44.entities.Profissional.list()
  });

  const { data: certidoes = [] } = useQuery({
    queryKey: ['certidoes'],
    queryFn: () => base44.entities.Certidao.list()
  });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.Empresa.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['empresas'] });
      setShowForm(false);
    }
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Empresa.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['empresas'] });
      setEditingEmpresa(null);
    }
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.Empresa.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['empresas'] });
      setDeletingEmpresa(null);
    }
  });

  const handleSave = async (data) => {
    if (editingEmpresa) {
      await updateMutation.mutateAsync({ id: editingEmpresa.id, data });
    } else {
      await createMutation.mutateAsync(data);
    }
  };

  const filteredEmpresas = empresas.filter(e => 
    e.nome_fantasia?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    e.cnpj?.includes(searchTerm)
  );

  const getProfissionaisCount = (empresaId) => {
    return profissionais.filter(p => p.empresa_id === empresaId).length;
  };

  const getCertidoesStatus = (empresaId) => {
    const empresaCertidoes = certidoes.filter(c => c.empresa_id === empresaId);
    const vencidas = empresaCertidoes.filter(c => c.status === "vencida").length;
    const alerta = empresaCertidoes.filter(c => c.status === "alerta").length;
    return { total: empresaCertidoes.length, vencidas, alerta };
  };

  const statusColors = {
    ativo: "bg-emerald-100 text-emerald-700 border-emerald-200",
    inativo: "bg-slate-100 text-slate-700 border-slate-200",
    suspenso: "bg-red-100 text-red-700 border-red-200"
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-50">
      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-slate-900 tracking-tight">
              Empresas
            </h1>
            <p className="text-slate-500 mt-1">
              Gerencie as empresas do portfólio
            </p>
          </div>
          <Button 
            onClick={() => setShowForm(true)}
            className="gap-2 bg-slate-900 hover:bg-slate-800"
          >
            <Plus className="w-4 h-4" />
            Nova Empresa
          </Button>
        </div>

        {/* Search */}
        <div className="relative mb-6">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
          <Input
            placeholder="Buscar por nome ou CNPJ..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-12 h-12 bg-white border-slate-200 text-lg"
          />
        </div>

        {/* Grid de Empresas */}
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <Card key={i} className="animate-pulse">
                <CardContent className="p-6">
                  <div className="h-16 bg-slate-200 rounded-lg mb-4" />
                  <div className="h-4 bg-slate-200 rounded w-2/3 mb-2" />
                  <div className="h-4 bg-slate-200 rounded w-1/2" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : filteredEmpresas.length === 0 ? (
          <Card className="border-dashed border-2 border-slate-300">
            <CardContent className="py-16 text-center">
              <Building2 className="w-16 h-16 text-slate-300 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-slate-700 mb-2">
                {searchTerm ? "Nenhuma empresa encontrada" : "Nenhuma empresa cadastrada"}
              </h3>
              <p className="text-slate-500 mb-6">
                {searchTerm ? "Tente buscar com outros termos" : "Comece cadastrando a primeira empresa"}
              </p>
              {!searchTerm && (
                <Button onClick={() => setShowForm(true)} className="gap-2">
                  <Plus className="w-4 h-4" />
                  Cadastrar Empresa
                </Button>
              )}
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredEmpresas.map((empresa) => {
              const certStatus = getCertidoesStatus(empresa.id);
              const profCount = getProfissionaisCount(empresa.id);
              
              return (
                <Card 
                  key={empresa.id}
                  className="group hover:shadow-xl transition-all duration-300 border-slate-200 overflow-hidden"
                >
                  <CardContent className="p-0">
                    {/* Header com Logo */}
                    <div className="p-6 pb-4">
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-4">
                          {empresa.logo_url ? (
                            <img 
                              src={empresa.logo_url} 
                              alt={empresa.nome_fantasia}
                              className="w-14 h-14 rounded-xl object-cover border border-slate-200"
                            />
                          ) : (
                            <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-slate-100 to-slate-200 flex items-center justify-center">
                              <Building2 className="w-7 h-7 text-slate-400" />
                            </div>
                          )}
                          <div>
                            <h3 className="font-semibold text-slate-900 line-clamp-1">
                              {empresa.nome_fantasia}
                            </h3>
                            <p className="text-sm text-slate-500">{empresa.cnpj}</p>
                          </div>
                        </div>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="opacity-0 group-hover:opacity-100">
                              <MoreVertical className="w-4 h-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => setEditingEmpresa(empresa)}>
                              <Pencil className="w-4 h-4 mr-2" />
                              Editar
                            </DropdownMenuItem>
                            <DropdownMenuItem 
                              onClick={() => setDeletingEmpresa(empresa)}
                              className="text-red-600"
                            >
                              <Trash2 className="w-4 h-4 mr-2" />
                              Excluir
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </div>

                    {/* Status e Métricas */}
                    <div className="px-6 pb-4">
                      <Badge 
                        variant="outline" 
                        className={cn("mb-4", statusColors[empresa.status])}
                      >
                        {empresa.status === "ativo" ? "Ativo" : 
                         empresa.status === "inativo" ? "Inativo" : "Suspenso"}
                      </Badge>

                      <div className="grid grid-cols-2 gap-4">
                        <Link 
                          to={createPageUrl("Profissionais") + `?empresa=${empresa.id}`}
                          className="flex items-center gap-2 text-sm text-slate-600 hover:text-blue-600 transition-colors"
                        >
                          <Users className="w-4 h-4" />
                          <span>{profCount} profissionais</span>
                        </Link>
                        <Link 
                          to={createPageUrl("Certidoes") + `?empresa=${empresa.id}`}
                          className={cn(
                            "flex items-center gap-2 text-sm transition-colors",
                            certStatus.vencidas > 0 ? "text-red-600" : 
                            certStatus.alerta > 0 ? "text-amber-600" : "text-slate-600 hover:text-blue-600"
                          )}
                        >
                          <FileCheck className="w-4 h-4" />
                          <span>
                            {certStatus.vencidas > 0 
                              ? `${certStatus.vencidas} vencidas` 
                              : certStatus.alerta > 0 
                                ? `${certStatus.alerta} em alerta`
                                : `${certStatus.total} certidões`
                            }
                          </span>
                        </Link>
                      </div>
                    </div>

                    {/* Footer */}
                    <div className="px-6 py-3 bg-slate-50 border-t border-slate-100">
                      <Link 
                        to={createPageUrl("EmpresaDetalhe") + `?id=${empresa.id}`}
                        className="flex items-center justify-between text-sm text-slate-600 hover:text-blue-600"
                      >
                        <span>Ver detalhes</span>
                        <ExternalLink className="w-4 h-4" />
                      </Link>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}

        {/* Modal de Criação/Edição */}
        <Dialog open={showForm || !!editingEmpresa} onOpenChange={(open) => {
          if (!open) {
            setShowForm(false);
            setEditingEmpresa(null);
          }
        }}>
          <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {editingEmpresa ? "Editar Empresa" : "Nova Empresa"}
              </DialogTitle>
            </DialogHeader>
            <EmpresaForm 
              empresa={editingEmpresa}
              onSave={handleSave}
              onCancel={() => {
                setShowForm(false);
                setEditingEmpresa(null);
              }}
            />
          </DialogContent>
        </Dialog>

        {/* Alert de Exclusão */}
        <AlertDialog open={!!deletingEmpresa} onOpenChange={(open) => !open && setDeletingEmpresa(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Excluir empresa?</AlertDialogTitle>
              <AlertDialogDescription>
                Tem certeza que deseja excluir "{deletingEmpresa?.nome_fantasia}"? 
                Esta ação não pode ser desfeita e removerá todos os dados associados.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancelar</AlertDialogCancel>
              <AlertDialogAction 
                onClick={() => deleteMutation.mutate(deletingEmpresa?.id)}
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