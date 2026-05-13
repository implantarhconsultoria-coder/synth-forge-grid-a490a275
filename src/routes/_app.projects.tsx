import { createFileRoute } from "@tanstack/react-router";
import { PROJECTS } from "@/lib/mock-data";
import { ExternalLink, Activity, Workflow } from "lucide-react";

export const Route = createFileRoute("/_app/projects")({
  component: ProjectsPage,
});

const statusStyles = {
  online: { dot: "bg-success text-success", label: "Online" },
  build: { dot: "bg-primary text-primary", label: "Em build" },
  alert: { dot: "bg-warning text-warning", label: "Atenção" },
  offline: { dot: "bg-muted-foreground text-muted-foreground", label: "Offline" },
} as const;

function ProjectsPage() {
  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-3xl font-bold tracking-tight">Projetos</h1>
        <p className="text-muted-foreground mt-1">Ecossistema operacional sob comando do núcleo IA.</p>
      </header>

      <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-5">
        {PROJECTS.map((p) => {
          const s = statusStyles[p.status];
          return (
            <article key={p.id} className="rounded-xl glass p-5 flex flex-col gap-4 hover:glow-border transition-shadow">
              <div className="flex items-start justify-between">
                <div>
                  <div className="text-xs uppercase tracking-wider text-muted-foreground">{p.category}</div>
                  <h2 className="text-lg font-semibold mt-1">{p.name}</h2>
                </div>
                <span className="inline-flex items-center gap-2 text-xs">
                  <span className={`size-2 rounded-full pulse-dot ${s.dot}`} />
                  {s.label}
                </span>
              </div>
              <p className="text-sm text-muted-foreground">{p.description}</p>

              <div>
                <div className="flex justify-between text-xs">
                  <span className="text-muted-foreground">Progresso</span>
                  <span className="font-mono">{p.progress}%</span>
                </div>
                <div className="mt-1 h-1.5 rounded-full bg-secondary overflow-hidden">
                  <div className="h-full bg-gradient-primary" style={{ width: `${p.progress}%` }} />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2 mt-auto">
                <button className="inline-flex items-center justify-center gap-1 rounded-md bg-gradient-primary py-2 text-xs font-medium text-primary-foreground">
                  <ExternalLink className="size-3" /> Abrir
                </button>
                <button className="inline-flex items-center justify-center gap-1 rounded-md glass py-2 text-xs">
                  <Activity className="size-3" /> Monitorar
                </button>
                <button className="inline-flex items-center justify-center gap-1 rounded-md glass py-2 text-xs">
                  <Workflow className="size-3" /> Automatizar
                </button>
              </div>
            </article>
          );
        })}
      </div>
    </div>
  );
}
