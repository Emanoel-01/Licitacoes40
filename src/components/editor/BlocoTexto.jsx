import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Trash2, GripVertical, ChevronDown } from "lucide-react";
import ReactQuill from "react-quill";
import "react-quill/dist/quill.snow.css";

const VARIAVEIS = [
  { id: "cliente", label: "Cliente", icon: "🏢" },
  { id: "objeto", label: "Objeto", icon: "🏗️" },
  { id: "data", label: "Data", icon: "📅" },
  { id: "empresa", label: "Empresa", icon: "🏭" },
  { id: "valor", label: "Valor", icon: "💰" },
];

export default function BlocoTexto({ bloco, onUpdate, onDelete, isDragging }) {
  const [isExpanded, setIsExpanded] = useState(true);
  const quillRef = useRef(null);

  const insertVariable = (varId) => {
    const varText = `{{${varId.toUpperCase()}}}`;
    if (quillRef.current) {
      const editor = quillRef.current.getEditor();
      const selection = editor.getSelection();
      if (selection) {
        editor.insertText(selection.index, varText);
      } else {
        editor.insertText(editor.getLength(), varText);
      }
      editor.setSelection(editor.getLength());
    }
  };

  return (
    <div className={`border rounded-lg bg-white transition-all ${isDragging ? "opacity-50" : ""}`}>
      <div className="flex items-center gap-3 p-4 bg-gradient-to-r from-blue-50 to-blue-100 border-b rounded-t-lg">
        <GripVertical className="w-5 h-5 text-blue-500 cursor-grab" />
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="flex-1 text-left"
        >
          <div className="flex items-center gap-2">
            <ChevronDown
              className={`w-4 h-4 transition-transform ${isExpanded ? "" : "-rotate-90"}`}
            />
            <span className="font-medium text-slate-900">
              {bloco.titulo_bloco || "Bloco de Texto"}
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
          <input
            type="text"
            placeholder="Título do bloco"
            value={bloco.titulo_bloco || ""}
            onChange={(e) => onUpdate({ ...bloco, titulo_bloco: e.target.value })}
            className="w-full px-3 py-2 border rounded text-sm"
          />
          
          {/* Barra de Variáveis */}
          <div className="flex flex-wrap gap-2 p-3 bg-slate-50 rounded border border-slate-200">
            <span className="text-xs font-medium text-slate-600 self-center whitespace-nowrap">
              Inserir:
            </span>
            {VARIAVEIS.map((v) => (
              <button
                key={v.id}
                onClick={() => insertVariable(v.id)}
                type="button"
                className="hover:opacity-80 transition-opacity"
              >
                <Badge variant="outline" className="cursor-pointer gap-1">
                  <span>{v.icon}</span>
                  <span className="hidden sm:inline">{v.label}</span>
                </Badge>
              </button>
            ))}
          </div>

          <ReactQuill
            ref={quillRef}
            value={bloco.conteudo_html || ""}
            onChange={(html) => onUpdate({ ...bloco, conteudo_html: html })}
            theme="snow"
            modules={{
              toolbar: [
                ["bold", "italic", "underline", "strike"],
                [{ header: 1 }, { header: 2 }],
                [{ list: "ordered" }, { list: "bullet" }],
                ["link", "table"],
              ],
            }}
            style={{ height: "200px" }}
          />
        </div>
      )}
    </div>
  );
}