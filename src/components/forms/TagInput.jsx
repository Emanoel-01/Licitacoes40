import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { X, Plus } from "lucide-react";
import { cn } from "@/lib/utils";

export default function TagInput({ 
  value = "", 
  onChange, 
  placeholder = "Digite e pressione Enter",
  variant = "default",
  suggestions = []
}) {
  const [inputValue, setInputValue] = useState("");
  const tags = value ? value.split(',').map(t => t.trim()).filter(Boolean) : [];

  const addTag = (tag) => {
    const trimmed = tag.trim();
    if (!trimmed || tags.includes(trimmed)) return;
    
    const newTags = [...tags, trimmed];
    onChange(newTags.join(', '));
    setInputValue("");
  };

  const removeTag = (tagToRemove) => {
    const newTags = tags.filter(t => t !== tagToRemove);
    onChange(newTags.join(', '));
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && inputValue.trim()) {
      e.preventDefault();
      addTag(inputValue);
    } else if (e.key === 'Backspace' && !inputValue && tags.length > 0) {
      removeTag(tags[tags.length - 1]);
    }
  };

  const variantStyles = {
    default: "bg-slate-100 text-slate-700 border-slate-300",
    positive: "bg-emerald-50 text-emerald-700 border-emerald-300",
    negative: "bg-red-50 text-red-700 border-red-300"
  };

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap gap-2 p-3 border rounded-md min-h-[44px] bg-background focus-within:ring-1 focus-within:ring-ring">
        {tags.map((tag, index) => (
          <Badge 
            key={index}
            variant="outline"
            className={cn("flex items-center gap-1", variantStyles[variant])}
          >
            {tag}
            <button
              type="button"
              onClick={() => removeTag(tag)}
              className="hover:bg-black/10 rounded-full p-0.5 transition-colors"
            >
              <X className="w-3 h-3" />
            </button>
          </Badge>
        ))}
        <Input
          type="text"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={tags.length === 0 ? placeholder : ""}
          className="flex-1 min-w-[120px] border-0 focus-visible:ring-0 focus-visible:ring-offset-0 p-0 h-auto"
        />
      </div>

      {suggestions.length > 0 && (
        <div className="flex flex-wrap gap-1">
          <span className="text-xs text-muted-foreground">Sugestões:</span>
          {suggestions.map((suggestion, index) => (
            <Button
              key={index}
              type="button"
              variant="ghost"
              size="sm"
              className="h-6 px-2 text-xs"
              onClick={() => addTag(suggestion)}
            >
              <Plus className="w-3 h-3 mr-1" />
              {suggestion}
            </Button>
          ))}
        </div>
      )}

      <p className="text-xs text-muted-foreground">
        Digite e pressione Enter para adicionar. Clique no X para remover.
      </p>
    </div>
  );
}