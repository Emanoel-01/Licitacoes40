import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Search } from "lucide-react";

export default function ModalSelecionarAnexo({ open, onClose, onSelect, empresaId }) {
  const [searchTerm, setSearchTerm] = useState("");

  const { data: documentos = [] } = useQuery({
    queryKey: ["biblioteca-compliance", empresaId],
    queryFn: async () => {
      const filters = empresaId ? { empresa_id: empresaId } : {};
      const docs = await base44.entities.BibliotecaCompliance.filter(filters, "-updated_date");
      return Array.isArray(docs) ? docs : [];
    },
    enabled: open,
  });

  const isExpired = (doc) => doc.data_validade && new Date(doc.data_validade) < new Date();

  const filtered = (Array.isArray(documentos) ? documentos : []).filter(
    (doc) =>
      doc.nome_documento?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      doc.categoria?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getStatusColor = (status) => {
    switch (status) {
      case "valida":
        return "bg-green-100 text-green-800 border-green-300";
      case "alerta":
        return "bg-amber-100 text-amber-800 border-amber-300";
      case "vencida":
        return "bg-red-100 text-red-800 border-red-300";
      default:
        return "bg-slate-100 text-slate-800 border-slate-300";
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Selecionar Arquivo da Biblioteca</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <Input
              placeholder="Buscar documento..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>

          <div className="space-y-2">
            {filtered.length === 0 ? (
              <p className="text-center text-slate-500 py-8">
                Nenhum documento encontrado
              </p>
            ) : (
              filtered.map((doc) => {
                const status = isExpired(doc) ? "vencida" : (doc.status || "pendente");
                return (
                  <button
                    key={doc.id}
                    onClick={() => onSelect(doc)}
                    disabled={status === "vencida"}
                    className={`w-full p-4 border-2 rounded-lg transition-all text-left ${
                      status === "vencida"
                        ? "opacity-60 cursor-not-allowed bg-slate-50"
                        : "hover:shadow-md bg-white"
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h4 className="font-medium text-slate-900">
                          {doc.nome_documento}
                        </h4>
                        <div className="flex items-center gap-2 mt-2">
                          <p className="text-sm text-slate-500">{doc.categoria}</p>
                          {doc.data_validade && (
                            <p
                              className={`text-xs font-medium ${
                                status === "vencida"
                                  ? "text-red-600"
                                  : "text-slate-600"
                              }`}
                            >
                              {status === "vencida" ? "Vencido" : "Válido até"}{" "}
                              {new Date(doc.data_validade).toLocaleDateString(
                                "pt-BR"
                              )}
                            </p>
                          )}
                        </div>
                      </div>
                      <Badge
                        className={`${getStatusColor(status)} border ml-2`}
                      >
                        {status}
                      </Badge>
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}