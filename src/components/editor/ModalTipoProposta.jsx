import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { FileCheck, FileText, DollarSign } from "lucide-react";

export default function ModalTipoProposta({ open, onClose, onSelect }) {
  const tipos = [
    {
      id: "habilitacao",
      titulo: "Habilitação Técnica",
      descricao: "Certidões, declarações e documentos de qualificação",
      icon: FileCheck,
      color: "bg-blue-50 border-blue-200",
      iconColor: "text-blue-600",
    },
    {
      id: "tecnica",
      titulo: "Proposta Técnica",
      descricao: "Metodologia, cronograma e argumentos técnicos",
      icon: FileText,
      color: "bg-purple-50 border-purple-200",
      iconColor: "text-purple-600",
    },
    {
      id: "preco",
      titulo: "Proposta de Preço",
      descricao: "Planilha de custos e valores de serviços",
      icon: DollarSign,
      color: "bg-emerald-50 border-emerald-200",
      iconColor: "text-emerald-600",
    },
  ];

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Criar Nova Proposta</DialogTitle>
          <DialogDescription>
            Selecione o tipo de proposta que deseja criar
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {tipos.map((tipo) => {
            const Icon = tipo.icon;
            return (
              <button
                key={tipo.id}
                onClick={() => onSelect(tipo.id)}
                className="w-full"
              >
                <Card
                  className={`p-6 cursor-pointer transition-all hover:shadow-lg border-2 ${tipo.color}`}
                >
                  <div className="flex flex-col items-center gap-3 text-center">
                    <Icon className={`w-8 h-8 ${tipo.iconColor}`} />
                    <h3 className="font-semibold text-slate-900">
                      {tipo.titulo}
                    </h3>
                    <p className="text-sm text-slate-600">
                      {tipo.descricao}
                    </p>
                  </div>
                </Card>
              </button>
            );
          })}
        </div>
      </DialogContent>
    </Dialog>
  );
}