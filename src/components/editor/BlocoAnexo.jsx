import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Trash2, GripVertical, ChevronDown, File, AlertCircle } from "lucide-react";
import { useState } from "react";

export default function BlocoAnexo({ bloco, onDelete, documento, isDragging }) {
  const [isExpanded, setIsExpanded] = useState(true);

  const getStatusColor = (status) => {
    switch (status) {
      case "valida":
        return "bg-green-100 text-green-800";
      case "alerta":
        return "bg-amber-100 text-amber-800";
      case "vencida":
        return "bg-red-100 text-red-800";
      default:
        return "bg-slate-100 text-slate-800";
    }
  };

  return (
    <div className={`border rounded-lg bg-white transition-all ${isDragging ? "opacity-50" : ""}`}>
      <div className="flex items-center gap-3 p-4 bg-gradient-to-r from-amber-50 to-amber-100 border-b rounded-t-lg">
        <GripVertical className="w-5 h-5 text-amber-600 cursor-grab" />
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="flex-1 text-left"
        >
          <div className="flex items-center gap-2">
            <ChevronDown
              className={`w-4 h-4 transition-transform ${isExpanded ? "" : "-rotate-90"}`}
            />
            <File className="w-4 h-4 text-amber-600" />
            <span className="font-medium text-slate-900">
              {documento?.nome_documento || "Anexo"}
            </span>
          </div>
        </button>
        <Button
          variant="ghost"
          size="icon"
          onClick={onDelete}
          className="text-red-500 hover:bg-red-50"
        >
          <Trash2 className="w-4 h-4" />
        </Button>
      </div>

      {isExpanded && (
        <div className="p-4 space-y-3">
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div>
              <p className="text-slate-600">Categoria</p>
              <p className="font-medium">{documento?.categoria}</p>
            </div>
            <div>
              <p className="text-slate-600">Status</p>
              <Badge className={getStatusColor(documento?.status)}>
                {documento?.status}
              </Badge>
            </div>
            {documento?.data_validade && (
              <div>
                <p className="text-slate-600">Validade</p>
                <p className="font-medium">{new Date(documento.data_validade).toLocaleDateString('pt-BR')}</p>
              </div>
            )}
          </div>

          {documento?.status === "vencida" && (
            <div className="flex gap-2 p-3 bg-red-50 border border-red-200 rounded text-sm text-red-800">
              <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
              <span>Este documento está vencido. Considere renová-lo.</span>
            </div>
          )}

          {documento?.status === "alerta" && (
            <div className="flex gap-2 p-3 bg-amber-50 border border-amber-200 rounded text-sm text-amber-800">
              <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
              <span>Este documento vence em breve.</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}