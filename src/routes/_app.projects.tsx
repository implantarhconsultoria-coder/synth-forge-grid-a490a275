import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { factoryData, useFactoryData, type Project } from "@/lib/factory-data";
import { SourceBadge, DataSourceFooter } from "@/components/SourceBadge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { toast } from "sonner";
import { ExternalLink, Activity, Workflow, Wrench } from "lucide-react";

export const Route = createFileRoute("/_app/projects")({ component: ProjectsPage });

const TOPAC_REPOSITORY = "implantarhconsultoria-coder/rh-prospera-hub-70cb89a5";
const TOPAC_CLIENTES_FILE = "src/pages/faturamento/ClientesFatPage.tsx";
const DEFAULT_WORKER_URL = "https://stunning-train-r7ggp5447rj93ppw6-8787.app.github.dev";

const statusStyles = {
  online: { dot: "bg-success text-success", label: "Online" },
  build: { dot: "bg-primary text-primary", label: "Em build" },
  alert: { dot: "bg-warning text-warning", label: "Atenção" },
  offline: { dot: "bg-muted-foreground text-muted-foreground", label: "Offline" },
} as const;

function workerUrl() {
  const origin = window.location.origin;
  if (origin.includes("-8081.app.github.dev")) return origin.replace("-8081.app.github.dev", "-8787.app.github.dev");
  if (origin.includes("-8080.app.github.dev")) return origin.replace("-8080.app.github.dev", "-8787.app.github.dev");
  if (origin.includes("localhost")) return "http://localhost:8787";
  const saved = localStorage.getItem("ai_factory_worker_url");
  if (saved && !saved.includes("localhost")) return saved;
  return DEFAULT_WORKER_URL;
}

async function sendToWorker(payload: Record<string, unknown>) {
  const response = await fetch(`${workerUrl()}/queue`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!response.ok) throw new Error("worker offline");
  return response.json();
}

function buildTopacPayload(p: Project, action: string, label: string) {
  const base = {
    type: action,
    projectId: p.id,
    projectName: p.name,
    action,
    command: `${label} ${p.name}`,
  };

  if (p.id !== "topac") return base;

  if (action === "analyze_and_patch") {
    return {
      ...base,
      repository: TOPAC_REPOSITORY,
      branch: "main",
      filePath: TOPAC_CLIENTES_FILE,
      commitMessage: "AI Factory: register real correction attempt for TOPAC billing clients",
      replacements: [
        {
          search: "Cliente iniciado pelo Cadastro Inteligente. Envie o documento, confira os dados e salve somente após validação.",
          replace: "Cliente iniciado pelo Cadastro Inteligente via AI Factory. Envie PDF, foto ou print, confira os dados e salve somente após validação.",
        },
      ],
    };
  }

  return {
    ...base,
    repository: TOPAC_REPOSITORY,
    branch: "main",
    filePath: "ai-factory-logs/topac-execucao.md",
    commitMessage: `AI Factory: ${label} TOPAC`,
    content: `# Execução AI Factory - TOPAC RH\n\nAção: ${label}\nTipo: ${action}\nData: ${new Date().toISOString()}\nOrigem: AI Factory\n\nStatus: tarefa enviada pelo painel e registrada no repositório real.\n`,
  };
}

function ProjectsPage() {
  useFactoryData();
  const [open, setOpen] = useState<Project | null>(null);
  const [, force] = useState(0);
  const projects = factoryData.getProjects();

  const runAction = async (p: Project, action: string, label: string) => {
    try {
      const task = await sendToWorker(buildTopacPayload(p, action, label));
      factoryData.addLog({ projectId: p.id, type: "system", level: "info", message: `${label} enviado ao worker: ${p.name}` });
      toast.success(`${label} enviado · ${String(task.id).slice(0, 6)}`);
      force((n) => n + 1);
    } catch {
      factoryData.addLog({ projectId: p.id, type: "system", level: "error", message: `Worker offline ao executar ${label} em ${p.name}` });
      toast.error(`Worker offline. Usando: ${workerUrl()}`);
    }
  };

  const handleOpen = async (p: Project) => {
    await runAction(p, "inspect_project_context", "Inspecionar");
    setOpen(p);
  };

  return (
    <div className="space-y-6 pb-24 lg:pb-8">
      <header className="flex items-start justify-between gap-4 flex-wrap">
        <div className="min-w-0">
          <h1 className="text-3xl sm:text-4xl font-bold tracking-tight">Projetos</h1>
          <p className="text-muted-foreground mt-2 text-sm sm:text-base">Ecossistema operacional sob comando do núcleo IA.</p>
        </div>
        <SourceBadge source={factoryData.source} />
      </header>

      <div className="rounded-xl glass p-4 text-xs text-muted-foreground border border-primary/20">
        Worker conectado em <span className="text-primary font-mono break-all">{workerUrl()}</span> · TOPAC configurado para execução GitHub API no repo real.
      </div>

      <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-5">
        {projects.map((p) => {
          const s = statusStyles[p.status];
          return (
            <article key={p.id} className="rounded-2xl glass p-5 flex flex-col gap-4 border border-border/40 hover:border-primary/40 transition-colors">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="text-[10px] uppercase tracking-wider text-muted-foreground">{p.category}</div>
                  <h2 className="text-lg font-semibold mt-1 truncate">{p.name}</h2>
                </div>
                <div className="flex flex-col items-end gap-1.5 shrink-0">
                  <span className="inline-flex items-center gap-2 text-xs"><span className={`size-2 rounded-full pulse-dot ${s.dot}`} />{s.label}</span>
                  <SourceBadge source={p.source} />
                </div>
              </div>
              <p className="text-sm text-muted-foreground line-clamp-3">{p.description}</p>
              <div>
                <div className="flex justify-between text-xs"><span className="text-muted-foreground">Progresso</span><span className="font-mono">{p.progress}%</span></div>
                <div className="mt-1.5 h-2 rounded-full bg-secondary overflow-hidden"><div className="h-full bg-gradient-to-r from-primary to-accent" style={{ width: `${p.progress}%` }} /></div>
              </div>
              <div className="grid grid-cols-2 gap-2 mt-auto">
                <button onClick={() => handleOpen(p)} className="inline-flex min-h-11 items-center justify-center gap-1.5 rounded-xl bg-gradient-to-r from-primary to-accent text-primary-foreground text-xs font-bold shadow-[0_6px_20px_rgba(56,189,248,0.28)] active:scale-[0.98]"><ExternalLink className="size-3.5" /> Abrir</button>
                <button onClick={() => runAction(p, "deep_monitor_scan", "Monitorar")} className="inline-flex min-h-11 items-center justify-center gap-1.5 rounded-xl glass border border-primary/30 text-xs font-semibold text-foreground hover:border-primary/60"><Activity className="size-3.5 text-primary" /> Monitorar</button>
                <button onClick={() => runAction(p, "analyze_and_patch", "Corrigir")} className="inline-flex min-h-11 items-center justify-center gap-1.5 rounded-xl glass border border-accent/30 text-xs font-semibold text-foreground hover:border-accent/60"><Wrench className="size-3.5 text-accent" /> Corrigir</button>
                <button onClick={() => runAction(p, "start_operational_automation", "Automatizar")} className="inline-flex min-h-11 items-center justify-center gap-1.5 rounded-xl glass border border-primary/30 text-xs font-semibold text-foreground hover:border-primary/60"><Workflow className="size-3.5 text-primary" /> Automatizar</button>
              </div>
            </article>
          );
        })}
      </div>

      <DataSourceFooter />
      <Dialog open={!!open} onOpenChange={(v) => !v && setOpen(null)}>
        <DialogContent className="glass">
          {open && <><DialogHeader><DialogTitle className="flex items-center gap-2">{open.name}<SourceBadge source={open.source} /></DialogTitle><DialogDescription>{open.description}</DialogDescription></DialogHeader><div className="grid grid-cols-2 gap-3 text-sm"><Info label="Categoria" value={open.category} /><Info label="Status" value={statusStyles[open.status].label} /><Info label="Progresso" value={`${open.progress}%`} /><Info label="Privado" value={open.isPrivate ? "Sim" : "Não"} /><Info label="Externo" value={open.isExternal ? "Sim" : "Não"} /><Info label="Atualizado" value={new Date(open.lastUpdate).toLocaleString("pt-BR")} /></div><div className="text-xs font-mono text-muted-foreground">id: {open.id}</div></>}
        </DialogContent>
      </Dialog>
    </div>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return <div className="rounded-md glass p-3"><div className="text-[10px] uppercase tracking-wider text-muted-foreground">{label}</div><div className="mt-1 font-medium">{value}</div></div>;
}
