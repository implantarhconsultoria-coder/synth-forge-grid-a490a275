import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useFactoryData, factoryData, type SmartLog } from "@/lib/factory-data";
import { Activity, ChevronDown, Clock } from "lucide-react";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_app/logs")({
  component: LogsPage,
});

type FilterKey = "all" | "alert" | "info" | "ok";

const tone: Record<string, string> = {
  ok: "text-success",
  warn: "text-warning",
  info: "text-primary",
  error: "text-destructive",
};

const levelBadge: Record<string, string> = {
  ok: "bg-success/15 text-success border-success/30",
  warn: "bg-warning/15 text-warning border-warning/30",
  info: "bg-primary/15 text-primary border-primary/30",
  error: "bg-destructive/15 text-destructive border-destructive/30",
};

// paleta de cores estável por projeto
const projectPalette = [
  "bg-fuchsia-500/15 text-fuchsia-300 border-fuchsia-500/30 shadow-[0_0_8px_-2px_hsl(var(--primary)/0.4)]",
  "bg-cyan-500/15 text-cyan-300 border-cyan-500/30",
  "bg-emerald-500/15 text-emerald-300 border-emerald-500/30",
  "bg-amber-500/15 text-amber-300 border-amber-500/30",
  "bg-violet-500/15 text-violet-300 border-violet-500/30",
  "bg-rose-500/15 text-rose-300 border-rose-500/30",
];

function projectColor(key: string) {
  let h = 0;
  for (let i = 0; i < key.length; i++) h = (h * 31 + key.charCodeAt(i)) >>> 0;
  return projectPalette[h % projectPalette.length];
}

// extrai nome do projeto + remove menção bruta do texto
function deriveProject(log: SmartLog): { tag: string | null; cleanMessage: string } {
  if (log.projectName) {
    const re = new RegExp(`\\b${log.projectName}\\b[\\s:·-]*`, "i");
    return { tag: log.projectName, cleanMessage: log.message.replace(re, "").trim() };
  }
  if (log.projectId) {
    const p = factoryData.getProject(log.projectId);
    if (p) {
      const re = new RegExp(`\\b${p.name}\\b[\\s:·-]*`, "i");
      return { tag: p.name, cleanMessage: log.message.replace(re, "").trim() };
    }
    return { tag: log.projectId.toUpperCase(), cleanMessage: log.message };
  }
  return { tag: null, cleanMessage: log.message };
}

// extrai duração se vier embutida no texto ("em 42s", "1.2min")
function extractDuration(log: SmartLog): { label: string | null; cleaned: string } {
  if (log.durationMs != null) {
    const s = log.durationMs / 1000;
    return { label: s >= 60 ? `${(s / 60).toFixed(1)}min` : `${Math.round(s)}s`, cleaned: log.message };
  }
  const m = log.message.match(/\bem\s+(\d+(?:[.,]\d+)?)\s*(s|seg|segundos|min|minutos)\b/i);
  if (!m) return { label: null, cleaned: log.message };
  const unit = m[2].toLowerCase().startsWith("min") ? "min" : "s";
  return {
    label: `${m[1]}${unit}`,
    cleaned: log.message.replace(m[0], "").replace(/\s{2,}/g, " ").trim(),
  };
}

const PAGE = 50;

function LogsPage() {
  useFactoryData();
  const all = factoryData.getLogs();
  const [filter, setFilter] = useState<FilterKey>("all");
  const [expanded, setExpanded] = useState<string | null>(null);
  const [limit, setLimit] = useState(PAGE);

  const counts = useMemo(() => {
    let alert = 0, info = 0, ok = 0;
    for (const l of all) {
      if (l.level === "error" || l.level === "warn") alert++;
      else if (l.level === "info") info++;
      else if (l.level === "ok") ok++;
    }
    return { all: all.length, alert, info, ok };
  }, [all]);

  const filtered = useMemo(() => {
    if (filter === "all") return all;
    if (filter === "alert") return all.filter((l) => l.level === "error" || l.level === "warn");
    return all.filter((l) => l.level === filter);
  }, [all, filter]);

  const visible = filtered.slice(0, limit);

  const filters: { key: FilterKey; label: string; count: number; cls: string }[] = [
    { key: "all", label: "Todos", count: counts.all, cls: "border-border/60 text-foreground" },
    { key: "alert", label: "Erros/Avisos", count: counts.alert, cls: "border-destructive/40 text-destructive" },
    { key: "info", label: "Informações", count: counts.info, cls: "border-primary/40 text-primary" },
    { key: "ok", label: "Sucessos", count: counts.ok, cls: "border-success/40 text-success" },
  ];

  return (
    <div className="mx-auto w-full max-w-4xl space-y-5 pb-28 lg:pb-10">
      <header className="flex items-center gap-3">
        <Activity className="size-6 text-primary" />
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Logs</h1>
          <p className="text-sm text-muted-foreground">Eventos do sistema em tempo real.</p>
        </div>
      </header>

      {/* Filtros */}
      <div className="flex flex-wrap gap-2">
        {filters.map((f) => {
          const active = filter === f.key;
          return (
            <button
              key={f.key}
              onClick={() => { setFilter(f.key); setLimit(PAGE); }}
              className={cn(
                "px-3 py-1.5 rounded-full border text-xs font-medium transition-all",
                "hover:bg-foreground/5",
                active ? `${f.cls} bg-foreground/5 shadow-[0_0_12px_-4px_currentColor]` : "border-border/40 text-muted-foreground",
              )}
            >
              {f.label} <span className="opacity-70">({f.count})</span>
            </button>
          );
        })}
      </div>

      {/* Lista */}
      <ul className="rounded-2xl glass border border-border/40 divide-y divide-border/40 font-mono text-xs sm:text-sm overflow-hidden">
        {visible.length === 0 && (
          <li className="px-4 py-8 text-center text-muted-foreground">Nenhum log para este filtro.</li>
        )}
        {visible.map((l) => {
          const { tag, cleanMessage } = deriveProject(l);
          const baseMsg = tag ? cleanMessage : l.message;
          const { label: dur, cleaned } = extractDuration({ ...l, message: baseMsg });
          const isOpen = expanded === l.id;
          const hasDetails = !!(l.metadataDetails?.prompt || l.metadataDetails?.response || l.metadataDetails?.stackTrace);

          return (
            <li key={l.id}>
              <button
                onClick={() => setExpanded(isOpen ? null : l.id)}
                className={cn(
                  "w-full text-left grid grid-cols-[60px_1fr_auto] gap-2 px-3 py-2.5 sm:px-4 sm:py-3",
                  "hover:bg-foreground/5 focus:bg-foreground/5 focus:outline-none transition-colors",
                  isOpen && "bg-foreground/5",
                )}
              >
                <span className="text-[10px] sm:text-xs text-muted-foreground tabular-nums self-start pt-0.5">
                  {new Date(l.createdAt).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}
                </span>

                <div className="min-w-0 flex flex-wrap items-center gap-1.5">
                  <span className={cn("px-1.5 py-0.5 rounded border text-[9px] uppercase tracking-wide", levelBadge[l.level])}>
                    {l.level}
                  </span>
                  {tag && (
                    <span className={cn("px-1.5 py-0.5 rounded border text-[9px] uppercase tracking-wide font-semibold", projectColor(tag))}>
                      {tag}
                    </span>
                  )}
                  <span className={cn("break-words", tone[l.level] || "text-foreground/90")}>
                    {cleaned}
                  </span>
                </div>

                <div className="flex items-center gap-2 self-start pt-0.5">
                  {dur && (
                    <span className="inline-flex items-center gap-1 text-[10px] text-muted-foreground/70">
                      <Clock className="size-3" /> {dur}
                    </span>
                  )}
                  <ChevronDown className={cn("size-3.5 text-muted-foreground transition-transform", isOpen && "rotate-180")} />
                </div>
              </button>

              {isOpen && (
                <div className="px-4 pb-4 pt-1 space-y-2 bg-background/40 border-t border-border/30">
                  {hasDetails ? (
                    <>
                      {l.metadataDetails?.prompt && (
                        <DetailBlock title="Prompt" content={l.metadataDetails.prompt} />
                      )}
                      {l.metadataDetails?.response && (
                        <DetailBlock title="Resposta" content={l.metadataDetails.response} />
                      )}
                      {l.metadataDetails?.stackTrace && (
                        <DetailBlock title="Stack trace" content={l.metadataDetails.stackTrace} variant="error" />
                      )}
                    </>
                  ) : (
                    <DetailBlock
                      title="Detalhes"
                      content={JSON.stringify(
                        { id: l.id, type: l.type, projectId: l.projectId, createdAt: l.createdAt, source: l.source, message: l.message },
                        null,
                        2,
                      )}
                    />
                  )}
                </div>
              )}
            </li>
          );
        })}
      </ul>

      {filtered.length > limit && (
        <div className="flex justify-center">
          <button
            onClick={() => setLimit((n) => n + PAGE)}
            className="px-4 py-2 rounded-full border border-border/40 text-xs text-muted-foreground hover:bg-foreground/5 hover:text-foreground transition-colors"
          >
            Carregar mais ({filtered.length - limit} restantes)
          </button>
        </div>
      )}
    </div>
  );
}

function DetailBlock({ title, content, variant }: { title: string; content: string; variant?: "error" }) {
  return (
    <div>
      <div className={cn("text-[10px] uppercase tracking-wider mb-1", variant === "error" ? "text-destructive" : "text-muted-foreground")}>
        {title}
      </div>
      <pre className={cn(
        "text-[11px] leading-relaxed whitespace-pre-wrap break-words rounded-md p-3 border",
        variant === "error"
          ? "bg-destructive/5 border-destructive/30 text-destructive/90"
          : "bg-background/60 border-border/40 text-foreground/80",
      )}>
        {content}
      </pre>
    </div>
  );
}
