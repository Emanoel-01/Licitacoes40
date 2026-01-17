import { cn } from "@/lib/utils";

export default function StatusCard({ 
  title, 
  value, 
  subtitle, 
  icon: Icon, 
  status = "neutral",
  trend,
  onClick 
}) {
  const statusColors = {
    success: "from-emerald-600/10 to-emerald-600/5 tech-border border-emerald-500/30",
    warning: "from-primary/10 to-primary/5 tech-border border-primary/30",
    danger: "from-red-600/10 to-red-600/5 tech-border border-red-500/30",
    neutral: "from-slate-700/10 to-slate-700/5 tech-border",
    info: "from-blue-600/10 to-blue-600/5 tech-border border-blue-500/30"
  };

  const iconColors = {
    success: "text-emerald-400 bg-emerald-500/10",
    warning: "text-primary bg-primary/10",
    danger: "text-red-400 bg-red-500/10",
    neutral: "text-slate-400 bg-slate-500/10",
    info: "text-blue-400 bg-blue-500/10"
  };

  return (
    <div 
      onClick={onClick}
      className={cn(
        "relative overflow-hidden rounded p-6 bg-gradient-to-br transition-all duration-300 bg-card/50 backdrop-blur-sm",
        statusColors[status],
        onClick && "cursor-pointer hover:shadow-xl hover:shadow-primary/5 hover:border-primary/30"
      )}
    >
      <div className="flex items-start justify-between">
        <div className="space-y-3">
          <p className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
            {title}
          </p>
          <p className="text-4xl font-bold text-foreground tracking-tight font-mono">
            {value}
          </p>
          {subtitle && (
            <p className="text-sm text-muted-foreground font-mono">{subtitle}</p>
          )}
          {trend && (
            <div className={cn(
              "inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-medium font-mono",
              trend > 0 ? "bg-emerald-500/10 text-emerald-400" : "bg-red-500/10 text-red-400"
            )}>
              {trend > 0 ? "↑" : "↓"} {Math.abs(trend)}%
            </div>
          )}
        </div>
        {Icon && (
          <div className={cn("p-3 rounded tech-border", iconColors[status])}>
            <Icon className="w-6 h-6" />
          </div>
        )}
      </div>
    </div>
  );
}