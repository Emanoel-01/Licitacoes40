import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Upload, Building2, Save, X } from "lucide-react";
import { base44 } from "@/api/base44Client";

export default function EmpresaForm({ empresa, onSave, onCancel }) {
  const [formData, setFormData] = useState(empresa || {
    nome_fantasia: "",
    razao_social: "",
    cnpj: "",
    objeto_social: "",
    endereco: "",
    telefone: "",
    email: "",
    responsavel_legal: "",
    cpf_responsavel: "",
    status: "ativo",
    logo_url: "",
    observacoes: ""
  });
  const [isLoading, setIsLoading] = useState(false);
  const [uploading, setUploading] = useState(false);

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const formatCNPJ = (value) => {
    const numbers = value.replace(/\D/g, '');
    return numbers
      .replace(/^(\d{2})(\d)/, '$1.$2')
      .replace(/^(\d{2})\.(\d{3})(\d)/, '$1.$2.$3')
      .replace(/\.(\d{3})(\d)/, '.$1/$2')
      .replace(/(\d{4})(\d)/, '$1-$2')
      .slice(0, 18);
  };

  const handleLogoUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    setUploading(true);
    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      handleChange("logo_url", file_url);
    } catch (error) {
      console.error("Erro no upload:", error);
    }
    setUploading(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      await onSave(formData);
    } catch (error) {
      console.error("Erro ao salvar:", error);
    }
    setIsLoading(false);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <Card className="border-slate-200">
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Building2 className="w-5 h-5 text-slate-600" />
            Dados da Empresa
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Logo Upload */}
          <div className="flex items-center gap-6">
            <div className="relative">
              {formData.logo_url ? (
                <img 
                  src={formData.logo_url} 
                  alt="Logo" 
                  className="w-24 h-24 rounded-xl object-cover border-2 border-slate-200"
                />
              ) : (
                <div className="w-24 h-24 rounded-xl bg-slate-100 flex items-center justify-center border-2 border-dashed border-slate-300">
                  <Building2 className="w-8 h-8 text-slate-400" />
                </div>
              )}
            </div>
            <div className="flex-1">
              <Label className="text-sm font-medium text-slate-700">Logo da Empresa</Label>
              <p className="text-xs text-slate-500 mb-2">PNG ou JPG, máximo 2MB</p>
              <label className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-slate-300 rounded-lg cursor-pointer hover:bg-slate-50 transition-colors">
                <Upload className="w-4 h-4 text-slate-600" />
                <span className="text-sm font-medium text-slate-700">
                  {uploading ? "Enviando..." : "Escolher arquivo"}
                </span>
                <input 
                  type="file" 
                  accept="image/*" 
                  className="hidden" 
                  onChange={handleLogoUpload}
                  disabled={uploading}
                />
              </label>
            </div>
          </div>

          {/* Dados Principais */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="nome_fantasia">Nome Fantasia *</Label>
              <Input
                id="nome_fantasia"
                value={formData.nome_fantasia}
                onChange={(e) => handleChange("nome_fantasia", e.target.value)}
                placeholder="Nome comercial"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="cnpj">CNPJ *</Label>
              <Input
                id="cnpj"
                value={formData.cnpj}
                onChange={(e) => handleChange("cnpj", formatCNPJ(e.target.value))}
                placeholder="00.000.000/0000-00"
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="razao_social">Razão Social</Label>
            <Input
              id="razao_social"
              value={formData.razao_social}
              onChange={(e) => handleChange("razao_social", e.target.value)}
              placeholder="Razão social completa"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="objeto_social">Objeto Social</Label>
            <Textarea
              id="objeto_social"
              value={formData.objeto_social}
              onChange={(e) => handleChange("objeto_social", e.target.value)}
              placeholder="Descreva as atividades da empresa (importante para filtro de editais)"
              rows={4}
            />
            <p className="text-xs text-slate-500">
              Seja detalhado - este campo é usado para filtrar oportunidades compatíveis
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="responsavel_legal">Responsável Legal</Label>
              <Input
                id="responsavel_legal"
                value={formData.responsavel_legal}
                onChange={(e) => handleChange("responsavel_legal", e.target.value)}
                placeholder="Nome do representante"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="cpf_responsavel">CPF do Responsável</Label>
              <Input
                id="cpf_responsavel"
                value={formData.cpf_responsavel}
                onChange={(e) => handleChange("cpf_responsavel", e.target.value)}
                placeholder="000.000.000-00"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="endereco">Endereço Completo</Label>
            <Input
              id="endereco"
              value={formData.endereco}
              onChange={(e) => handleChange("endereco", e.target.value)}
              placeholder="Rua, número, bairro, cidade, UF, CEP"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="telefone">Telefone</Label>
              <Input
                id="telefone"
                value={formData.telefone}
                onChange={(e) => handleChange("telefone", e.target.value)}
                placeholder="(81) 99999-9999"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">E-mail</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => handleChange("email", e.target.value)}
                placeholder="contato@empresa.com"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="status">Status</Label>
              <Select 
                value={formData.status} 
                onValueChange={(v) => handleChange("status", v)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ativo">Ativo</SelectItem>
                  <SelectItem value="inativo">Inativo</SelectItem>
                  <SelectItem value="suspenso">Suspenso</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="contrato_social_url">Contrato Social (URL do PDF)</Label>
            <Input
              id="contrato_social_url"
              value={formData.contrato_social_url || ""}
              onChange={(e) => handleChange("contrato_social_url", e.target.value)}
              placeholder="URL do arquivo PDF do contrato social"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="documentos_socios_url">Documentos dos Sócios (URL do PDF/ZIP)</Label>
            <Input
              id="documentos_socios_url"
              value={formData.documentos_socios_url || ""}
              onChange={(e) => handleChange("documentos_socios_url", e.target.value)}
              placeholder="URL dos documentos RG/CPF dos sócios"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="observacoes">Observações</Label>
            <Textarea
              id="observacoes"
              value={formData.observacoes}
              onChange={(e) => handleChange("observacoes", e.target.value)}
              placeholder="Notas internas sobre a empresa"
              rows={2}
            />
          </div>
        </CardContent>
      </Card>

      {/* Actions */}
      <div className="flex items-center justify-end gap-3">
        {onCancel && (
          <Button type="button" variant="outline" onClick={onCancel}>
            <X className="w-4 h-4 mr-2" />
            Cancelar
          </Button>
        )}
        <Button type="submit" disabled={isLoading} className="bg-slate-900 hover:bg-slate-800">
          <Save className="w-4 h-4 mr-2" />
          {isLoading ? "Salvando..." : "Salvar Empresa"}
        </Button>
      </div>
    </form>
  );
}