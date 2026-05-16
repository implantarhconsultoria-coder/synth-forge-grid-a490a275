import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { factoryData, useFactoryData, type Project } from "@/lib/factory-data";
import { SourceBadge, DataSourceFooter } from "@/components/SourceBadge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { toast } from "sonner";
import { ExternalLink, Activity, Workflow, Wrench } from "lucide-react";

export const Route = createFileRoute("/_app/projects")({
  component: ProjectsPage,
});

const EXECUTION_KEY = "ai_factory_execution_queue";

const statusStyles = {
  online: { dot: "bg-success text-success", label: "Online" },
  build: { dot: "bg-primary text-primary", label: "Em build" },
  alert: { dot: "bg-warning text-warning", label: "Atenção" },
  offline: { dot: "bg-muted-foreground text-muted-foreground", label: "Offline" },
} as const;

function queueExecution(payload: Record<string, unknown>) {
  const current = JSON.parse(localStorage.getItem(EXECUTION_KEY) || "[]");
  const execution = {
    id: crypto.randomUUID(),
    createdAt: new Date().toISOString(),
    status: "queued",
    ...payload,
  };

  current.unshift(execution);
  localStorage.setItem(EXECUTION_KEY, JSON.stringify(current));

  return execution;
}

function ProjectsPage() {
  useFactoryData();
  const [open, setOpen] = useState<Project | null>(null);
  const [, force] = useState(0);
  const projects = factoryData.getProjects();

  const handleMonitor = (p: Project) => {
    const exec = queueExecution({
      type: "monitor",
      projectId: p.id,
      projectName: p.name,
      action: "deep_monitor_scan",
    });

    factoryData.addLog({
      projectId: p.id,
      type: "monitor",
      level: "info",
      message: `Monitoramento real enfileirado em ${p.name}`,
    });

    toast.success(`Monitoramento iniciado · ${exec.id.slice(0, 6)}`);
    force((n) => n + 1);
  };

  const handleCorrect = (p: Project) => {
    const correction = factoryData.addCorrection({
      projectId: p.id,
      title: `Correção operacional em ${p.name}`,
      description: "Missão enviada ao núcleo executor.",
      riskLevel: "low",
    });

    const exec = queueExecution({
      type: "correction",
      projectId: p.id,
      projectName: p.name,
      correctionId: correction.id,
      action: "analyze_and_patch",
    });

    factoryData.addLog({
      projectId: p.id,
      type: "correction",
      level: "warn",
      message: `Patch solicitado para ${p.name}`,
    });

    toast.success(`Correção enviada · ${exec.id.slice(0, 6)}`);
    force((n) => n + 1);
  };

  const handleAutomate = (p: Project) => {
    const command = factoryData.addCommand({
      commandText: `automatizar ${p.name}`,
      interpretedAction: `automation.start(${p.id})`,
    });

    const exec = queueExecution({
      type: "automation",
      projectId: p.id,
      projectName: p.name,
      commandId: command.id,
      action: "start_operational_automation",
    });

    factoryData.addLog({
      projectId: p.id,
      type: "automation",
      level: "info",
      message: `Automação operacional iniciada em ${p.name}`,
    });

    toast.success(`Executor acionado · ${exec.id.slice(0, 6)}`);
    force((n) => n + 1);
  };

  const handleOpen = (p: Project) => {
    queueExecution({
      type: "open_project",
      projectId: p.id,
      projectName: p.name,
      action: "inspect_project_context",
    });

    setOpen(p);
  };

  return (
    <div className="space-y-6">
      <header className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Projetos</h1>
          <p className="text-muted-foreground mt-1">Ecossistema operacional sob comando do núcleo IA.</p>
        </div>
        <SourceBadge source={factoryData.source} />
      </header>

      <div className="rounded-xl glass p-4 text-xs text-muted-foreground border border-primary/20">
        Executor local ativo · comandos agora entram na fila operacional real do navegador.
      </div>

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
                  onClick={() => handleOpen(p)}
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
                  <Wrench className="size-3" /> Corrigir
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
