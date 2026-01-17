import { AlertTriangle, CheckCircle, XCircle, Clock, ExternalLink } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import moment from "moment";

export default function CertidaoAlert({ certidao, onRenovar }) {
  const diasRestantes = certidao.data_validade 
    ? moment(certidao.data_validade).diff(moment(), 'days')
    : null;

  const getStatus = () => {
    if (!diasRestantes) return { status: "pendente", color: "slate", icon: Clock };
    if (diasRestantes < 0) return { status: "vencido", color: "red", icon: XCircle };
    if (diasRestantes <= 10) return { status: "crítico", color: "red", icon: AlertTriangle };
    if (diasRestantes <= 30) return { status: "alerta", color: "amber", icon: AlertTriangle };
    return { status: "regular", color: "emerald", icon: CheckCircle };
  };

  const { status, color, icon: StatusIcon } = getStatus();

  const colorClasses = {
    red: "bg-red-50 border-red-200 text-red-800",
    amber: "bg-amber-50 border-amber-200 text-amber-800",
    emerald: "bg-emerald-50 border-emerald-200 text-emerald-800",
    slate: "bg-slate-50 border-slate-200 text-slate-800"
  };

  const badgeColors = {
    red: "bg-red-100 text-red-700 border-red-200",
    amber: "bg-amber-100 text-amber-700 border-amber-200",
    emerald: "bg-emerald-100 text-emerald-700 border-emerald-200",
    slate: "bg-slate-100 text-slate-700 border-slate-200"
  };

  return (
    <div className={cn(
      "flex items-center justify-between p-4 rounded-xl border transition-all",
      colorClasses[color]
    )}>
      <div className="flex items-center gap-4">
        <StatusIcon className={cn("w-5 h-5", {
          "text-red-600": color === "red",
          "text-amber-600": color === "amber",
          "text-emerald-600": color === "emerald",
          "text-slate-600": color === "slate"
        })} />
        
        <div>
          <p className="font-semibold">{certidao.tipo}</p>
          <p className="text-sm opacity-75">
            {certidao.orgao_emissor || "Órgão não especificado"}
          </p>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <Badge className={cn("border", badgeColors[color])}>
          {status === "pendente" && "Pendente"}
          {status === "vencido" && "VENCIDO"}
          {status === "crítico" && `${diasRestantes}d - CRÍTICO`}
          {status === "alerta" && `${diasRestantes} dias`}
          {status === "regular" && `${diasRestantes} dias`}
        </Badge>

        {certidao.link_emissao && (
          <Button 
            size="sm" 
            variant="outline"
            onClick={() => window.open(certidao.link_emissao, '_blank')}
            className="gap-1"
          >
            <ExternalLink className="w-3 h-3" />
            Renovar
          </Button>
        )}
      </div>
    </div>
  );
}