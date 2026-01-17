import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Building2, Calendar, MapPin, ArrowRight, TrendingUp } from "lucide-react";
import { cn } from "@/lib/utils";
import moment from "moment";

export default function OportunidadeCard({ oportunidade, onClick }) {
  const statusConfig = {
    nova: { label: "Nova", color: "bg-blue-100 text-blue-700 border-blue-200" },
    em_analise: { label: "Em Análise", color: "bg-amber-100 text-amber-700 border-amber-200" },
    aprovada: { label: "Aprovada", color: "bg-emerald-100 text-emerald-700 border-emerald-200" },
    proposta_enviada: { label: "Proposta Enviada", color: "bg-purple-100 text-purple-700 border-purple-200" },
    vencida: { label: "Vencida", color: "bg-green-100 text-green-700 border-green-200" },
    perdida: { label: "Perdida", color: "bg-red-100 text-red-700 border-red-200" },
    descartada: { label: "Descartada", color: "bg-slate-100 text-slate-700 border-slate-200" }
  };

  const config = statusConfig[oportunidade.status] || statusConfig.nova;
  const diasRestantes = oportunidade.data_abertura 
    ? moment(oportunidade.data_abertura).diff(moment(), 'days')
    : null;

  const formatCurrency = (value) => {
    if (!value) return "A definir";
    return new Intl.NumberFormat('pt-BR', { 
      style: 'currency', 
      currency: 'BRL',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(value);
  };

  return (
    <Card 
      className="group cursor-pointer hover:shadow-xl transition-all duration-300 border-slate-200 hover:border-slate-300 overflow-hidden"
      onClick={onClick}
    >
      <CardContent className="p-0">
        <div className="p-6 space-y-4">
          {/* Header */}
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-2">
                <Badge variant="outline" className={cn("border", config.color)}>
                  {config.label}
                </Badge>
                {oportunidade.modalidade && (
                  <Badge variant="secondary" className="bg-slate-100 text-slate-600">
                    {oportunidade.modalidade}
                  </Badge>
                )}
              </div>
              <h3 className="font-semibold text-slate-900 line-clamp-2 group-hover:text-blue-600 transition-colors">
                {oportunidade.objeto}
              </h3>
            </div>
            
            {oportunidade.score_compatibilidade && (
              <div className="flex items-center gap-1 px-3 py-1.5 bg-emerald-50 rounded-lg">
                <TrendingUp className="w-4 h-4 text-emerald-600" />
                <span className="text-sm font-bold text-emerald-700">
                  {oportunidade.score_compatibilidade}%
                </span>
              </div>
            )}
          </div>

          {/* Info Grid */}
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div className="flex items-center gap-2 text-slate-600">
              <Building2 className="w-4 h-4 text-slate-400" />
              <span className="truncate">{oportunidade.orgao_licitante}</span>
            </div>
            <div className="flex items-center gap-2 text-slate-600">
              <MapPin className="w-4 h-4 text-slate-400" />
              <span>{oportunidade.municipio || oportunidade.uf || "—"}</span>
            </div>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between pt-4 border-t border-slate-100">
            <div>
              <p className="text-xs text-slate-500 uppercase tracking-wider">Valor Estimado</p>
              <p className="text-lg font-bold text-slate-900">
                {formatCurrency(oportunidade.valor_estimado)}
              </p>
            </div>

            {diasRestantes !== null && (
              <div className={cn(
                "px-3 py-2 rounded-lg text-center",
                diasRestantes < 3 ? "bg-red-50" : diasRestantes < 7 ? "bg-amber-50" : "bg-blue-50"
              )}>
                <p className="text-xs text-slate-500">Abertura em</p>
                <p className={cn(
                  "text-lg font-bold",
                  diasRestantes < 3 ? "text-red-600" : diasRestantes < 7 ? "text-amber-600" : "text-blue-600"
                )}>
                  {diasRestantes}d
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Hover Action Bar */}
        <div className="px-6 py-3 bg-slate-50 border-t border-slate-100 flex items-center justify-between opacity-0 group-hover:opacity-100 transition-opacity">
          <span className="text-sm text-slate-600">Ver detalhes</span>
          <ArrowRight className="w-4 h-4 text-slate-400" />
        </div>
      </CardContent>
    </Card>
  );
}