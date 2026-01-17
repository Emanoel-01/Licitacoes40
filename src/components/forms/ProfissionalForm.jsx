import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Upload, User, FileText, Save, X } from "lucide-react";
import { base44 } from "@/api/base44Client";

export default function ProfissionalForm({ profissional, empresaId, onSave, onCancel }) {
  const [uploadingCRQ, setUploadingCRQ] = useState(false);

  const [formData, setFormData] = useState(profissional || {
    empresa_id: empresaId || "",
    nome: "",
    cargo: "Engenheiro Civil",
    registro_profissional: "",
    orgao_classe: "CREA",
    cpf: "",
    email: "",
    telefone: "",
    especialidades: "",
    acervo_tecnico_url: "",
    certidao_crq_url: "",
    validade_crq: "",
    status_crq: "pendente",
    is_responsavel_tecnico: false,
    observacoes: ""
  });
  const [isLoading, setIsLoading] = useState(false);
  const [uploadingAcervo, setUploadingAcervo] = useState(false);
  const [uploadingCRQ, setUploadingCRQ] = useState(false);

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleFileUpload = async (e, field, setUploading) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    setUploading(true);
    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      handleChange(field, file_url);
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
            <User className="w-5 h-5 text-slate-600" />
            Dados do Profissional
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Dados Pessoais */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="nome">Nome Completo *</Label>
              <Input
                id="nome"
                value={formData.nome}
                onChange={(e) => handleChange("nome", e.target.value)}
                placeholder="Nome completo"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="cpf">CPF</Label>
              <Input
                id="cpf"
                value={formData.cpf}
                onChange={(e) => handleChange("cpf", e.target.value)}
                placeholder="000.000.000-00"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="cargo">Cargo/Formação *</Label>
              <Select 
                value={formData.cargo} 
                onValueChange={(v) => handleChange("cargo", v)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Engenheiro Civil">Engenheiro Civil</SelectItem>
                  <SelectItem value="Arquiteto">Arquiteto</SelectItem>
                  <SelectItem value="Engenheiro Eletricista">Engenheiro Eletricista</SelectItem>
                  <SelectItem value="Engenheiro Mecânico">Engenheiro Mecânico</SelectItem>
                  <SelectItem value="Técnico em Edificações">Técnico em Edificações</SelectItem>
                  <SelectItem value="Técnico em Segurança">Técnico em Segurança</SelectItem>
                  <SelectItem value="Outro">Outro</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="orgao_classe">Conselho</Label>
              <Select 
                value={formData.orgao_classe} 
                onValueChange={(v) => handleChange("orgao_classe", v)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="CREA">CREA</SelectItem>
                  <SelectItem value="CAU">CAU</SelectItem>
                  <SelectItem value="Outro">Outro</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="registro_profissional">Registro</Label>
              <Input
                id="registro_profissional"
                value={formData.registro_profissional}
                onChange={(e) => handleChange("registro_profissional", e.target.value)}
                placeholder="CREA 12345-PE"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="email">E-mail</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => handleChange("email", e.target.value)}
                placeholder="profissional@email.com"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="telefone">Telefone</Label>
              <Input
                id="telefone"
                value={formData.telefone}
                onChange={(e) => handleChange("telefone", e.target.value)}
                placeholder="(81) 99999-9999"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="especialidades">Especialidades / Áreas de Atuação</Label>
            <Textarea
              id="especialidades"
              value={formData.especialidades}
              onChange={(e) => handleChange("especialidades", e.target.value)}
              placeholder="Patologia das Construções, BIM, Restauro, Manutenção Predial..."
              rows={2}
            />
          </div>

          <div className="flex items-center gap-3 p-4 bg-slate-50 rounded-lg">
            <Switch
              checked={formData.is_responsavel_tecnico}
              onCheckedChange={(checked) => handleChange("is_responsavel_tecnico", checked)}
            />
            <div>
              <Label className="font-medium">Responsável Técnico Principal</Label>
              <p className="text-xs text-slate-500">Marque se este é o RT da empresa</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Documentos */}
      <Card className="border-slate-200">
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center gap-2 text-lg">
            <FileText className="w-5 h-5 text-slate-600" />
            Documentos Técnicos
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Acervo Técnico */}
          <div className="p-4 border border-dashed border-slate-300 rounded-xl">
            <div className="flex items-center justify-between mb-3">
              <div>
                <Label className="font-medium">Acervo Técnico (CAT/RRT)</Label>
                <p className="text-xs text-slate-500">PDF com certidões de acervo técnico</p>
              </div>
              <label className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-slate-300 rounded-lg cursor-pointer hover:bg-slate-50 transition-colors">
                <Upload className="w-4 h-4 text-slate-600" />
                <span className="text-sm font-medium text-slate-700">
                  {uploadingAcervo ? "Enviando..." : "Upload PDF"}
                </span>
                <input 
                  type="file" 
                  accept=".pdf" 
                  className="hidden" 
                  onChange={(e) => handleFileUpload(e, "acervo_tecnico_url", setUploadingAcervo)}
                  disabled={uploadingAcervo}
                />
              </label>
            </div>
            {formData.acervo_tecnico_url && (
              <a 
                href={formData.acervo_tecnico_url} 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-sm text-blue-600 hover:underline"
              >
                📄 Ver documento anexado
              </a>
            )}
          </div>

          {/* CRQ */}
          <div className="p-4 border border-dashed border-slate-300 rounded-xl">
            <div className="flex items-center justify-between mb-3">
              <div>
                <Label className="font-medium">Certidão de Registro e Quitação (CRQ)</Label>
                <p className="text-xs text-slate-500">PDF atualizado do CREA/CAU</p>
              </div>
              <label className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-slate-300 rounded-lg cursor-pointer hover:bg-slate-50 transition-colors">
                <Upload className="w-4 h-4 text-slate-600" />
                <span className="text-sm font-medium text-slate-700">
                  {uploadingCRQ ? "Enviando..." : "Upload PDF"}
                </span>
                <input 
                  type="file" 
                  accept=".pdf" 
                  className="hidden" 
                  onChange={(e) => handleFileUpload(e, "certidao_crq_url", setUploadingCRQ)}
                  disabled={uploadingCRQ}
                />
              </label>
            </div>
            {formData.certidao_crq_url && (
              <a 
                href={formData.certidao_crq_url} 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-sm text-blue-600 hover:underline"
              >
                📄 Ver documento anexado
              </a>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="validade_crq">Validade da CRQ</Label>
              <Input
                id="validade_crq"
                type="date"
                value={formData.validade_crq}
                onChange={(e) => handleChange("validade_crq", e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="status_crq">Status</Label>
              <Select 
                value={formData.status_crq} 
                onValueChange={(v) => handleChange("status_crq", v)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="regular">Regular</SelectItem>
                  <SelectItem value="alerta">Alerta</SelectItem>
                  <SelectItem value="vencido">Vencido</SelectItem>
                  <SelectItem value="pendente">Pendente</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="observacoes">Observações</Label>
            <Textarea
              id="observacoes"
              value={formData.observacoes}
              onChange={(e) => handleChange("observacoes", e.target.value)}
              placeholder="Notas internas"
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
          {isLoading ? "Salvando..." : "Salvar Profissional"}
        </Button>
      </div>
    </form>
  );
}