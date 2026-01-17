import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Check, ChevronsUpDown, X } from "lucide-react";
import { cn } from "@/lib/utils";

export default function MultiSelect({ 
  value = "", 
  onChange, 
  options = [],
  placeholder = "Selecione...",
  variant = "default"
}) {
  const [open, setOpen] = useState(false);
  const selected = value ? value.split(',').map(t => t.trim()).filter(Boolean) : [];

  const toggleOption = (option) => {
    let newSelected;
    if (selected.includes(option)) {
      newSelected = selected.filter(s => s !== option);
    } else {
      newSelected = [...selected, option];
    }
    onChange(newSelected.join(', '));
  };

  const removeOption = (option) => {
    const newSelected = selected.filter(s => s !== option);
    onChange(newSelected.join(', '));
  };

  const variantStyles = {
    default: "bg-slate-100 text-slate-700 border-slate-300",
    positive: "bg-emerald-50 text-emerald-700 border-emerald-300",
    negative: "bg-red-50 text-red-700 border-red-300"
  };

  return (
    <div className="space-y-2">
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className="w-full justify-between min-h-[44px] h-auto"
          >
            <div className="flex flex-wrap gap-1 flex-1">
              {selected.length === 0 ? (
                <span className="text-muted-foreground">{placeholder}</span>
              ) : (
                selected.map((item, index) => (
                  <Badge 
                    key={index}
                    variant="outline"
                    className={cn("flex items-center gap-1", variantStyles[variant])}
                  >
                    {item}
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        removeOption(item);
                      }}
                      className="hover:bg-black/10 rounded-full p-0.5 transition-colors"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </Badge>
                ))
              )}
            </div>
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-full p-0" align="start">
          <div className="max-h-64 overflow-y-auto p-1">
            {options.map((option) => {
              const isSelected = selected.includes(option);
              return (
                <div
                  key={option}
                  onClick={() => toggleOption(option)}
                  className={cn(
                    "flex items-center gap-2 px-3 py-2 cursor-pointer rounded-sm hover:bg-accent",
                    isSelected && "bg-accent"
                  )}
                >
                  <div className={cn(
                    "w-4 h-4 border rounded flex items-center justify-center",
                    isSelected && "bg-primary border-primary"
                  )}>
                    {isSelected && <Check className="w-3 h-3 text-primary-foreground" />}
                  </div>
                  <span className="text-sm">{option}</span>
                </div>
              );
            })}
          </div>
        </PopoverContent>
      </Popover>

      {selected.length > 0 && (
        <p className="text-xs text-muted-foreground">
          {selected.length} item{selected.length !== 1 ? 's' : ''} selecionado{selected.length !== 1 ? 's' : ''}
        </p>
      )}
    </div>
  );
}