import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Trash2, GripVertical, ChevronDown } from "lucide-react";
import ReactQuill from "react-quill";
import "react-quill/dist/quill.snow.css";

export default function BlocoTexto({ bloco, onUpdate, onDelete, isDragging }) {
  const [isExpanded, setIsExpanded] = useState(true);

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
        <div className="p-4">
          <input
            type="text"
            placeholder="Título do bloco"
            value={bloco.titulo_bloco || ""}
            onChange={(e) => onUpdate({ ...bloco, titulo_bloco: e.target.value })}
            className="w-full mb-4 px-3 py-2 border rounded text-sm"
          />
          <ReactQuill
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