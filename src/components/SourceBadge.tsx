import { factoryData, sourceLabel } from "@/lib/factory-data";
import { useFactoryData } from "@/lib/factory-data";
import { RefreshCw, Database } from "lucide-react";

export function SourceBadge({ source }: { source: string }) {
  const label = sourceLabel(source as any);
  const isReal = source === "real";
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider border ${
        isReal
          ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
          : "bg-muted text-muted-foreground border-border"
      }`}
    >
      <span className={`size-1.5 rounded-full ${isReal ? "bg-emerald-400" : "bg-muted-foreground"}`} />
      {label}
    </span>
  );
}

export function DataSourceFooter() {
  useFactoryData();
  const label = sourceLabel(factoryData.source);
  const isReal = factoryData.source === "real";
  const lastSync = factoryData.getLastSyncAt();
  return (
    <div className="mt-6 flex items-center justify-between gap-3 rounded-lg border border-border/50 bg-secondary/30 px-3 py-2">
      <div className="flex items-center gap-2">
        <Database className="size-3.5 text-muted-foreground" />
        <span className="text-xs text-muted-foreground">
          Fonte: <span className={isReal ? "text-emerald-400 font-medium" : "text-foreground font-medium"}>{label}</span>
          {lastSync && (
            <span className="ml-2 opacity-70">· Sincronizado {new Date(lastSync).toLocaleTimeString("pt-BR")}</span>
          )}
        </span>
      </div>
    </div>
  );
}
