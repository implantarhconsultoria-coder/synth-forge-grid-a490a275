import type { DataSource } from "@/lib/factory-data";
import { sourceLabel } from "@/lib/factory-data";

export function SourceBadge({ source, className = "" }: { source: DataSource; className?: string }) {
  const isReal = source === "real";
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] uppercase tracking-wider ${
        isReal
          ? "border-success/40 bg-success/10 text-success"
          : "border-border bg-secondary/40 text-muted-foreground"
      } ${className}`}
      title={isReal ? "Dado vindo de API real" : "Dado simulado (mock local)"}
    >
      <span className={`size-1.5 rounded-full ${isReal ? "bg-success" : "bg-muted-foreground"}`} />
      {sourceLabel(source)}
    </span>
  );
}

export function DataSourceFooter() {
  return (
    <div className="text-[11px] text-muted-foreground flex items-center gap-2">
      <span className="size-1.5 rounded-full bg-muted-foreground" />
      Fonte dos dados: <span className="text-foreground/80">Mock local ativo</span>
    </div>
  );
}
