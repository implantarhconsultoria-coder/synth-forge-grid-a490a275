import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { factoryData, type Project } from "@/lib/factory-data";
import { SourceBadge, DataSourceFooter } from "@/components/SourceBadge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { toast } from "sonner";
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
  const [open, setOpen] = useState<Project | null>(null);
  const [, force] = useState(0);
  const projects = factoryData.getProjects();

  const handleMonitor = (p: Project) => {
    factoryData.addLog({
      projectId: p.id,
      type: "monitor",
      level: "info",
      message: `Monitoramento manual iniciado em ${p.name}`,
    });
    toast.success(`Monitoramento ativado em ${p.name}`);
    force((n) => n + 1);
  };

  const handleCorrect = (p: Project) => {
    const c = factoryData.addCorrection({
      projectId: p.id,
      title: `Correção sugerida em ${p.name}`,
      description: "Análise automática gerada pela AI Factory.",
      riskLevel: "low",
    });
    toast.success(`Correção criada · ${c.id.slice(0, 6)}`);
    force((n) => n + 1);
  };

  const handleAutomate = (p: Project) => {
    const cmd = factoryData.addCommand({
      commandText: `automatizar ${p.name}`,
      interpretedAction: `automation.start(${p.id})`,
    });
    toast.success(`Comando enfileirado · ${cmd.id.slice(0, 6)}`);
    force((n) => n + 1);
  };

  return (
    <div className="space-y-6">
      <header className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Projetos</h1>
          <p className="text-muted-foreground mt-1">Ecossistema operacional sob comando do núcleo IA.</p>
        </div>
        <SourceBadge source="mock" />
      </header>

      <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-5">
        {projects.map((p) => {
          const s = statusStyles[p.status];
          return (
            <article key={p.id} className="rounded-xl glass p-5 flex flex-col gap-4 hover:glow-border transition-shadow">
              <div className="flex items-start justify-between">
                <div>
                  <div className="text-xs uppercase tracking-wider text-muted-foreground">{p.category}</div>
                  <h2 className="text-lg font-semibold mt-1">{p.name}</h2>
                </div>
                <div className="flex flex-col items-end gap-1.5">
                  <span className="inline-flex items-center gap-2 text-xs">
                    <span className={`size-2 rounded-full pulse-dot ${s.dot}`} />
                    {s.label}
                  </span>
                  <SourceBadge source={p.source} />
                </div>
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

              <div className="grid grid-cols-2 gap-2 mt-auto">
                <button
                  onClick={() => setOpen(p)}
                  className="inline-flex items-center justify-center gap-1 rounded-md bg-gradient-primary py-2 text-xs font-medium text-primary-foreground"
                >
                  <ExternalLink className="size-3" /> Abrir
                </button>
                <button
                  onClick={() => handleMonitor(p)}
                  className="inline-flex items-center justify-center gap-1 rounded-md glass py-2 text-xs hover:text-primary"
                >
                  <Activity className="size-3" /> Monitorar
                </button>
                <button
                  onClick={() => handleCorrect(p)}
                  className="inline-flex items-center justify-center gap-1 rounded-md glass py-2 text-xs hover:text-primary"
                >
                  Corrigir
                </button>
                <button
                  onClick={() => handleAutomate(p)}
                  className="inline-flex items-center justify-center gap-1 rounded-md glass py-2 text-xs hover:text-primary"
                >
                  <Workflow className="size-3" /> Automatizar
                </button>
              </div>
            </article>
          );
        })}
      </div>

      <DataSourceFooter />

      <Dialog open={!!open} onOpenChange={(v) => !v && setOpen(null)}>
        <DialogContent className="glass">
          {open && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  {open.name}
                  <SourceBadge source={open.source} />
                </DialogTitle>
                <DialogDescription>{open.description}</DialogDescription>
              </DialogHeader>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <Info label="Categoria" value={open.category} />
                <Info label="Status" value={statusStyles[open.status].label} />
                <Info label="Progresso" value={`${open.progress}%`} />
                <Info label="Privado" value={open.isPrivate ? "Sim" : "Não"} />
                <Info label="Externo" value={open.isExternal ? "Sim" : "Não"} />
                <Info label="Atualizado" value={new Date(open.lastUpdate).toLocaleString("pt-BR")} />
              </div>
              <div className="text-xs font-mono text-muted-foreground">id: {open.id}</div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md glass p-3">
      <div className="text-[10px] uppercase tracking-wider text-muted-foreground">{label}</div>
      <div className="mt-1 font-medium">{value}</div>
    </div>
  );
}
