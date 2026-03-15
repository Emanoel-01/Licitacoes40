import { useState } from "react";
import { base44 } from "@/api/base44Client";
import { 
  Brain, 
  AlertTriangle, 
  CheckCircle, 
  Lightbulb, 
  RefreshCw,
  ChevronDown,
  ChevronUp,
  Shield,
  ShieldAlert,
  ShieldCheck,
  FileQuestion,
  X
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

const riskConfig = {
  baixo: { label: "Risco Baixo", icon: ShieldCheck, color: "text-emerald-400", bg: "bg-emerald-950/30 border-emerald-500/30" },
  medio: { label: "Risco Médio", icon: Shield, color: "text-amber-400", bg: "bg-amber-950/30 border-amber-500/30" },
  alto: { label: "Risco Alto", icon: ShieldAlert, color: "text-red-400", bg: "bg-red-950/30 border-red-500/30" }
};

export default function IAComplianceAssistant({ empresaId, onClose }) {
  const [analise, setAnalise] = useState(null);
  const [loading, setLoading] = useState(false);
  const [expandedSection, setExpandedSection] = useState("alertas");

  const analisarRiscos = async () => {
    setLoading(true);
    try {
      const response = await base44.functions.invoke('analisarCertidaoIA', {
        modo: 'analisar_riscos',
        empresa_id: empresaId || null
      });
      setAnalise(response.data.analise);
    } catch (error) {
      toast.error("Erro ao gerar análise de IA: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  const risk = analise ? riskConfig[analise.nivel_risco] || riskConfig.medio : null;

  const Section = ({ id, title, icon: Icon, items, color }) => {
    const isOpen = expandedSection === id;
    return (
      <div className="border border-slate-700/50 rounded-lg overflow-hidden">
        <button
          onClick={() => setExpandedSection(isOpen ? null : id)}
          className="w-full flex items-center justify-between p-3 bg-slate-800/50 hover:bg-slate-800 transition-colors"
        >
          <span className={cn("flex items-center gap-2 font-medium text-sm", color)}>
            <Icon className="w-4 h-4" />
            {title}
            <Badge variant="outline" className="ml-1 text-xs py-0">{items?.length || 0}</Badge>
          </span>
          {isOpen ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
        </button>
        {isOpen && items?.length > 0 && (
          <div className="p-3 space-y-2">
            {items.map((item, i) => (
              <div key={i} className="flex items-start gap-2 text-sm text-slate-300">
                <span className={cn("mt-1 w-1.5 h-1.5 rounded-full flex-shrink-0", color.replace("text-", "bg-"))} />
                {item}
              </div>
            ))}
          </div>
        )}
        {isOpen && (!items || items.length === 0) && (
          <div className="p-3 text-sm text-slate-500 text-center">Nenhum item identificado.</div>
        )}
      </div>
    );
  };

  return (
    <Card className="glass-panel border-primary/20">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-primary">
            <Brain className="w-5 h-5" />
            Assistente IA de Compliance
          </CardTitle>
          {onClose && (
            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={onClose}>
              <X className="w-4 h-4" />
            </Button>
          )}
        </div>
        <p className="text-xs text-muted-foreground">
          Análise inteligente de riscos e sugestões de renovação
        </p>
      </CardHeader>

      <CardContent className="space-y-4">
        {!analise && !loading && (
          <div className="text-center py-6">
            <Brain className="w-12 h-12 text-slate-600 mx-auto mb-3" />
            <p className="text-sm text-muted-foreground mb-4">
              Clique para a IA analisar todos os documentos, detectar riscos e sugerir ações de renovação.
            </p>
            <Button onClick={analisarRiscos} className="gap-2 w-full">
              <Brain className="w-4 h-4" />
              Analisar Compliance com IA
            </Button>
          </div>
        )}

        {loading && (
          <div className="text-center py-8 space-y-3">
            <div className="w-10 h-10 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
            <p className="text-sm text-muted-foreground">Analisando documentos...</p>
          </div>
        )}

        {analise && !loading && (
          <div className="space-y-4">
            {/* Nível de Risco */}
            <div className={cn("p-4 rounded-lg border", risk.bg)}>
              <div className="flex items-center gap-3">
                <risk.icon className={cn("w-8 h-8", risk.color)} />
                <div>
                  <p className={cn("font-bold text-lg", risk.color)}>{risk.label}</p>
                  <p className="text-sm text-slate-300">{analise.resumo}</p>
                </div>
              </div>
            </div>

            {/* Seções expansíveis */}
            <Section
              id="alertas"
              title="Alertas Urgentes"
              icon={AlertTriangle}
              items={analise.alertas}
              color="text-red-400"
            />
            <Section
              id="sugestoes"
              title="Sugestões de Renovação"
              icon={Lightbulb}
              items={analise.sugestoes}
              color="text-amber-400"
            />
            <Section
              id="faltantes"
              title="Documentos que Podem Faltar"
              icon={FileQuestion}
              items={analise.documentos_faltantes}
              color="text-blue-400"
            />

            <Button 
              variant="outline" 
              onClick={analisarRiscos} 
              className="w-full gap-2 text-sm"
              size="sm"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              Reanalisar
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}