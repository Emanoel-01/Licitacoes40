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
    success: "from-emerald-500/10 to-emerald-500/5 border-emerald-500/20",
    warning: "from-amber-500/10 to-amber-500/5 border-amber-500/20",
    danger: "from-red-500/10 to-red-500/5 border-red-500/20",
    neutral: "from-slate-500/10 to-slate-500/5 border-slate-200",
    info: "from-blue-500/10 to-blue-500/5 border-blue-500/20"
  };

  const iconColors = {
    success: "text-emerald-600 bg-emerald-100",
    warning: "text-amber-600 bg-amber-100",
    danger: "text-red-600 bg-red-100",
    neutral: "text-slate-600 bg-slate-100",
    info: "text-blue-600 bg-blue-100"
  };

  return (
    <div 
      onClick={onClick}
      className={cn(
        "relative overflow-hidden rounded-2xl border p-6 bg-gradient-to-br transition-all duration-300",
        statusColors[status],
        onClick && "cursor-pointer hover:shadow-lg hover:scale-[1.02]"
      )}
    >
      <div className="flex items-start justify-between">
        <div className="space-y-3">
          <p className="text-sm font-medium text-slate-500 uppercase tracking-wider">
            {title}
          </p>
          <p className="text-4xl font-bold text-slate-900 tracking-tight">
            {value}
          </p>
          {subtitle && (
            <p className="text-sm text-slate-600">{subtitle}</p>
          )}
          {trend && (
            <div className={cn(
              "inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium",
              trend > 0 ? "bg-emerald-100 text-emerald-700" : "bg-red-100 text-red-700"
            )}>
              {trend > 0 ? "↑" : "↓"} {Math.abs(trend)}%
            </div>
          )}
        </div>
        {Icon && (
          <div className={cn("p-3 rounded-xl", iconColors[status])}>
            <Icon className="w-6 h-6" />
          </div>
        )}
      </div>
    </div>
  );
}