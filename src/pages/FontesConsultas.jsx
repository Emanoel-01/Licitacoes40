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
import { Trash2, Plus, Globe, Database } from "lucide-react";
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
  
  const [formData, setFormData] = useState({
    esfera: "Municipal",
    uf: "PE",
    municipio: "",
    tipo: "CND Tributos",
    url: "",
    instrucoes: "",
    ativo: true
  });

  const { data: fontes = [], isLoading } = useQuery({
    queryKey: ['fontes'],
    queryFn: () => base44.entities.FonteConsulta.list()
  });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.FonteConsulta.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['fontes'] });
      setFormData({
        esfera: "Municipal",
        uf: "PE",
        municipio: "",
        tipo: "CND Tributos",
        url: "",
        instrucoes: "",
        ativo: true
      });
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

  const handleSubmit = async (e) => {
    e.preventDefault();
    await createMutation.mutateAsync(formData);
  };

  const esferaColors = {
    Federal: "bg-blue-100 text-blue-700 border-blue-200",
    Estadual: "bg-purple-100 text-purple-700 border-purple-200",
    Municipal: "bg-green-100 text-green-700 border-green-200",
    Outros: "bg-slate-100 text-slate-700 border-slate-200"
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

        <div className="grid gap-6 lg:grid-cols-12">
          {/* Formulário de Cadastro */}
          <Card className="lg:col-span-5 border-slate-200">
            <CardHeader className="border-b border-slate-100">
              <CardTitle className="text-xl">Nova Fonte de Consulta</CardTitle>
            </CardHeader>
            <CardContent className="pt-6">
              <form onSubmit={handleSubmit} className="space-y-4">
                
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
                  <Label>UF (Estado)</Label>
                  <Input 
                    name="uf" 
                    value={formData.uf} 
                    onChange={handleInputChange} 
                    maxLength={2}
                    disabled={formData.esfera === "Federal"}
                    placeholder={formData.esfera === "Federal" ? "N/A" : "Ex: PE"}
                    className={cn(
                      formData.esfera === "Federal" && "bg-slate-100"
                    )}
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
                    className={cn(
                      formData.esfera !== "Municipal" && "bg-slate-100"
                    )}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Tipo de Documento</Label>
                  <Select 
                    value={formData.tipo} 
                    onValueChange={(val) => handleSelectChange("tipo", val)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="CND Tributos">CND Tributos</SelectItem>
                      <SelectItem value="CND Trabalhista">CND Trabalhista</SelectItem>
                      <SelectItem value="Certidão Falência">Certidão Falência</SelectItem>
                      <SelectItem value="Edital de Licitação">Edital de Licitação</SelectItem>
                      <SelectItem value="FGTS">FGTS</SelectItem>
                      <SelectItem value="INSS">INSS</SelectItem>
                      <SelectItem value="Federal - PGFN">Federal - PGFN</SelectItem>
                      <SelectItem value="Estadual - SEFAZ">Estadual - SEFAZ</SelectItem>
                      <SelectItem value="Municipal - ISS">Municipal - ISS</SelectItem>
                      <SelectItem value="CREA - CRQ">CREA - CRQ</SelectItem>
                      <SelectItem value="CAU - CRQ">CAU - CRQ</SelectItem>
                      <SelectItem value="SICAF">SICAF</SelectItem>
                      <SelectItem value="TCE">TCE</SelectItem>
                      <SelectItem value="Outro">Outro</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>URL Alvo (Onde o Robô deve ir)</Label>
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

                <div className="space-y-2">
                  <Label>Instruções para a IA</Label>
                  <Textarea 
                    name="instrucoes" 
                    value={formData.instrucoes} 
                    onChange={handleInputChange} 
                    placeholder="Ex: Clicar em 'Emitir' e resolver Captcha..."
                    rows={3}
                  />
                </div>

                <Button 
                  type="submit" 
                  className="w-full bg-slate-900 hover:bg-slate-800"
                  disabled={createMutation.isPending}
                >
                  <Plus className="mr-2 h-4 w-4" /> 
                  {createMutation.isPending ? "Adicionando..." : "Adicionar Fonte"}
                </Button>
              </form>
            </CardContent>
          </Card>

          {/* Listagem de Fontes (Matriz) */}
          <Card className="lg:col-span-7 border-slate-200">
            <CardHeader className="border-b border-slate-100">
              <CardTitle className="text-xl">Matriz de Links Ativos</CardTitle>
            </CardHeader>
            <CardContent className="pt-6">
              {isLoading ? (
                <div className="text-center py-12 text-slate-500">
                  Carregando fontes...
                </div>
              ) : fontes.length === 0 ? (
                <div className="text-center py-12">
                  <Database className="w-16 h-16 text-slate-300 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-slate-700 mb-2">
                    Nenhuma fonte cadastrada
                  </h3>
                  <p className="text-slate-500">
                    Adicione a primeira fonte para começar
                  </p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Esfera / Local</TableHead>
                        <TableHead>Documento</TableHead>
                        <TableHead>URL</TableHead>
                        <TableHead className="w-[50px]"></TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {fontes.map((fonte) => (
                        <TableRow key={fonte.id}>
                          <TableCell>
                            <Badge 
                              variant="outline" 
                              className={cn("mb-1", esferaColors[fonte.esfera])}
                            >
                              {fonte.esfera}
                            </Badge>
                            <div className="text-xs text-slate-600">
                              {fonte.esfera === "Federal" ? "Brasil" : 
                               fonte.esfera === "Estadual" ? `Estado: ${fonte.uf}` : 
                               `${fonte.municipio} - ${fonte.uf}`}
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge variant="secondary">{fonte.tipo}</Badge>
                          </TableCell>
                          <TableCell className="max-w-[250px]">
                            <a 
                              href={fonte.url} 
                              target="_blank" 
                              rel="noreferrer" 
                              className="text-blue-600 hover:underline text-sm flex items-center gap-1 truncate"
                            >
                              <Globe className="w-3 h-3 flex-shrink-0" />
                              <span className="truncate">{fonte.url}</span>
                            </a>
                          </TableCell>
                          <TableCell>
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              onClick={() => setDeletingFonte(fonte)}
                            >
                              <Trash2 className="h-4 w-4 text-red-500" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
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