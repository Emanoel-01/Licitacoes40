import { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Upload, Sparkles, CheckCircle, Loader2, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";

export default function ExtrairDadosCertidao({ onDadosExtraidos }) {
  const [uploading, setUploading] = useState(false);
  const [extraindo, setExtraindo] = useState(false);
  const [arquivoUrl, setArquivoUrl] = useState(null);
  const [nomeArquivo, setNomeArquivo] = useState(null);

  const handleUploadEExtrair = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setNomeArquivo(file.name);
    setUploading(true);

    try {
      // 1. Upload do arquivo
      const uploadResult = await base44.integrations.Core.UploadFile({ file });
      const url = uploadResult.file_url;
      setArquivoUrl(url);
      setUploading(false);

      // 2. Extrair dados com IA
      setExtraindo(true);
      toast.info("IA analisando o documento...");

      const response = await base44.functions.invoke('analisarCertidaoIA', {
        modo: 'extrair_dados',
        arquivo_url: url
      });

      const dados = response.data.dados;

      // Passar os dados extraídos para o formulário pai
      onDadosExtraidos({
        ...dados,
        arquivo_url: url
      });

      toast.success("Dados extraídos automaticamente pela IA!");
    } catch (error) {
      toast.error("Erro ao processar: " + error.message);
    } finally {
      setUploading(false);
      setExtraindo(false);
    }
  };

  const isLoading = uploading || extraindo;

  return (
    <div className="p-4 bg-primary/5 border border-primary/20 rounded-lg space-y-3">
      <div className="flex items-center gap-2">
        <Sparkles className="w-4 h-4 text-primary" />
        <span className="text-sm font-medium text-primary">Upload Inteligente com IA</span>
      </div>
      <p className="text-xs text-muted-foreground">
        Envie o PDF da certidão e a IA preencherá os campos automaticamente (nome, datas, órgão emissor etc.)
      </p>

      <label className={`flex items-center justify-center gap-2 w-full h-12 border-2 border-dashed rounded-lg cursor-pointer transition-colors ${isLoading ? 'border-slate-600 opacity-50 cursor-not-allowed' : 'border-primary/40 hover:border-primary hover:bg-primary/5'}`}>
        {isLoading ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin text-primary" />
            <span className="text-sm text-muted-foreground">
              {uploading ? "Enviando arquivo..." : "IA extraindo dados..."}
            </span>
          </>
        ) : arquivoUrl ? (
          <>
            <CheckCircle className="w-4 h-4 text-emerald-400" />
            <span className="text-sm text-emerald-300 truncate max-w-[200px]">{nomeArquivo}</span>
            <Badge variant="outline" className="text-xs text-emerald-400 border-emerald-500">Processado</Badge>
          </>
        ) : (
          <>
            <Upload className="w-4 h-4 text-primary" />
            <span className="text-sm text-primary">Enviar PDF para análise automática</span>
          </>
        )}
        <input
          type="file"
          accept=".pdf,.jpg,.jpeg,.png"
          onChange={handleUploadEExtrair}
          disabled={isLoading}
          className="hidden"
        />
      </label>

      {arquivoUrl && !isLoading && (
        <button
          type="button"
          onClick={() => { setArquivoUrl(null); setNomeArquivo(null); }}
          className="text-xs text-slate-500 hover:text-slate-300 underline"
        >
          Trocar arquivo
        </button>
      )}
    </div>
  );
}