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

export default function ModalSelecionarAnexo({ open, onClose, onSelect }) {
  const [searchTerm, setSearchTerm] = useState("");

  const { data: documentos = [] } = useQuery({
    queryKey: ["biblioteca-compliance"],
    queryFn: () => base44.entities.BibliotecaCompliance.list("-updated_date"),
    enabled: open,
  });

  const filtered = documentos.filter(
    (doc) =>
      doc.nome_documento?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      doc.categoria?.toLowerCase().includes(searchTerm.toLowerCase())
  );

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
              filtered.map((doc) => (
                <button
                  key={doc.id}
                  onClick={() => onSelect(doc)}
                  className="w-full p-4 border rounded-lg hover:bg-slate-50 transition-colors text-left"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <h4 className="font-medium text-slate-900">
                        {doc.nome_documento}
                      </h4>
                      <p className="text-sm text-slate-500 mt-1">
                        {doc.categoria}
                      </p>
                    </div>
                    <Badge className={getStatusColor(doc.status)}>
                      {doc.status}
                    </Badge>
                  </div>
                </button>
              ))
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}