import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { factoryData, useFactoryData } from "@/lib/factory-data";
import { supabaseApi } from "@/lib/supabase-api";
import { SourceBadge, DataSourceFooter } from "@/components/SourceBadge";
import { toast } from "sonner";
import { Brain, FolderKanban, Target, Database, FileText, CheckCircle2, CircleDotDashed } from "lucide-react";

export const Route = createFileRoute("/_app/admin")({
  component: AdminPage,
});

type MissionTask = {
  id: string;
  projectName: string;
  taskTitle: string;
  taskType: string;
  status: string;
  priority: string;
  notes?: string;
  createdAt?: string;
};

function AdminPage() {
  useFactoryData();
  const projects = factoryData.getProjects();
  const missions = factoryData.getMissions();
  const memories = factoryData.getMemories();
  const [tasks, setTasks] = useState<MissionTask[]>([]);

  const [pName, setPName] = useState("");
  const [pCat, setPCat] = useState("");
  const [pDesc, setPDesc] = useState("");

  const [mTitle, setMTitle] = useState("");
  const [mDesc, setMDesc] = useState("");

  const [memKey, setMemKey] = useState("");
  const [memVal, setMemVal] = useState("");

  const [logMsg, setLogMsg] = useState("");

  const loadTasks = async () => {
    const data = await supabaseApi.listMissionTasks();
    if (Array.isArray(data)) setTasks(data as MissionTask[]);
  };

  useEffect(() => {
    loadTasks();
    const timer = window.setInterval(loadTasks, 15000);
    return () => window.clearInterval(timer);
  }, []);

  const handleProject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pName.trim()) return;
    const p = await factoryData.createProject({ name: pName, category: pCat, description: pDesc });
    toast.success(`Projeto criado · ${p.name}`);
    setPName(""); setPCat(""); setPDesc("");
  };

  const handleMission = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!mTitle.trim()) return;
    const m = await factoryData.createMission({ title: mTitle, description: mDesc });
    toast.success(`Missão registrada · ${m.title}`);
    setMTitle(""); setMDesc("");
    void loadTasks();
  };

  const handleMemory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!memKey.trim() || !memVal.trim()) return;
    const m = await factoryData.saveMemory({ key: memKey, value: memVal });
    toast.success(`Memória salva · ${m.key}`);
    setMemKey(""); setMemVal("");
  };

  const handleLog = (e: React.FormEvent) => {
    e.preventDefault();
    if (!logMsg.trim()) return;
    factoryData.addLog({ type: "system", level: "info", message: logMsg });
    toast.success("Log registrado");
    setLogMsg("");
  };

  const totalTasks = tasks.length;
  const doneTasks = tasks.filter((t) => ["concluido", "concluído", "done", "feito"].includes(t.status?.toLowerCase())).length;
  const progress = totalTasks ? Math.round((doneTasks / totalTasks) * 100) : 0;
  const criticalTasks = tasks.filter((t) => ["critico", "crítico", "critical"].includes(t.priority?.toLowerCase())).length;

  return (
    <div className="space-y-8 pb-24 lg:pb-8">
      <header className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <div className="inline-flex items-center gap-2 rounded-full glass px-3 py-1 text-xs">
            <Brain className="size-3 text-primary" /> NÚCLEO FACTORY
          </div>
          <h1 className="mt-3 text-3xl font-bold tracking-tight">Administração</h1>
          <p className="text-muted-foreground mt-1">
            Cérebro operacional · projetos, missões e memória da AI Factory.
          </p>
        </div>
        <SourceBadge source={factoryData.source} />
      </header>

      <section className="grid lg:grid-cols-2 gap-5">
        <form onSubmit={handleProject} className="rounded-xl glass p-5 space-y-3">
          <div className="flex items-center gap-2 text-sm font-medium">
            <FolderKanban className="size-4 text-primary" /> Criar projeto
          </div>
          <Input value={pName} onChange={setPName} placeholder="Nome do projeto" />
          <Input value={pCat} onChange={setPCat} placeholder="Categoria" />
          <Textarea value={pDesc} onChange={setPDesc} placeholder="Descrição" />
          <button className="w-full min-h-12 rounded-xl bg-gradient-to-r from-primary to-accent py-3 text-sm font-bold text-primary-foreground shadow-[0_6px_20px_rgba(56,189,248,0.28)] active:scale-[0.98]">
            Registrar projeto
          </button>
        </form>

        <form onSubmit={handleMission} className="rounded-xl glass p-5 space-y-3">
          <div className="flex items-center gap-2 text-sm font-medium">
            <Target className="size-4 text-primary" /> Nova missão IA
          </div>
          <Input value={mTitle} onChange={setMTitle} placeholder="Título da missão" />
          <Textarea value={mDesc} onChange={setMDesc} placeholder="Objetivo" />
          <button className="w-full min-h-12 rounded-xl bg-gradient-to-r from-primary to-accent py-3 text-sm font-bold text-primary-foreground shadow-[0_6px_20px_rgba(56,189,248,0.28)] active:scale-[0.98]">
            Disparar missão
          </button>
        </form>

        <form onSubmit={handleMemory} className="rounded-xl glass p-5 space-y-3">
          <div className="flex items-center gap-2 text-sm font-medium">
            <Database className="size-4 text-primary" /> Memória operacional
          </div>
          <Input value={memKey} onChange={setMemKey} placeholder="Chave (ex: regra-financeiro)" />
          <Textarea value={memVal} onChange={setMemVal} placeholder="Conteúdo da memória" />
          <button className="w-full min-h-12 rounded-xl bg-gradient-to-r from-primary to-accent py-3 text-sm font-bold text-primary-foreground shadow-[0_6px_20px_rgba(56,189,248,0.28)] active:scale-[0.98]">
            Salvar memória
          </button>
        </form>

        <form onSubmit={handleLog} className="rounded-xl glass p-5 space-y-3">
          <div className="flex items-center gap-2 text-sm font-medium">
            <FileText className="size-4 text-primary" /> Log manual
          </div>
          <Textarea value={logMsg} onChange={setLogMsg} placeholder="Mensagem do log" />
          <button className="w-full min-h-12 rounded-xl bg-gradient-to-r from-primary to-accent py-3 text-sm font-bold text-primary-foreground shadow-[0_6px_20px_rgba(56,189,248,0.28)] active:scale-[0.98]">
            Registrar log
          </button>
        </form>
      </section>

      <section className="grid lg:grid-cols-3 gap-5">
        <ListCard title="Projetos" count={projects.length}>
          {projects.map((p) => (
            <Row key={p.id} title={p.name} subtitle={p.category} source={p.source} />
          ))}
          {!projects.length && <Empty />}
        </ListCard>

        <ListCard title="Missões" count={missions.length}>
          {missions.map((m) => (
            <Row key={m.id} title={m.title} subtitle={m.status} source={m.source} />
          ))}
          {!missions.length && <Empty />}
        </ListCard>

        <ListCard title="Memórias" count={memories.length}>
          {memories.map((m) => (
            <Row key={m.id} title={m.key} subtitle={m.value.slice(0, 60)} source={m.source} />
          ))}
          {!memories.length && <Empty />}
        </ListCard>
      </section>

      <section className="rounded-xl glass overflow-hidden">
        <div className="flex items-center justify-between gap-3 px-4 py-3 border-b border-border/60 flex-wrap">
          <div>
            <div className="text-sm font-medium">Checklist de execução · TOPAC RH PRO</div>
            <div className="text-xs text-muted-foreground">Tarefas reais vindas da tabela ai_mission_tasks</div>
          </div>
          <div className="flex items-center gap-2 text-xs">
            <span className="rounded-full border border-emerald-500/30 bg-emerald-500/10 text-emerald-300 px-3 py-1">{doneTasks}/{totalTasks} concluídas</span>
            <span className="rounded-full border border-amber-500/30 bg-amber-500/10 text-amber-300 px-3 py-1">{criticalTasks} críticas</span>
            <SourceBadge source="real" />
          </div>
        </div>

        <div className="px-4 pt-4">
          <div className="flex items-center justify-between text-xs text-muted-foreground mb-2">
            <span>Progresso operacional</span>
            <span>{progress}%</span>
          </div>
          <div className="h-2 rounded-full bg-secondary overflow-hidden">
            <div className="h-full bg-gradient-primary transition-all" style={{ width: `${progress}%` }} />
          </div>
        </div>

        <ul className="divide-y divide-border/40 max-h-[460px] overflow-auto mt-4">
          {tasks.map((task) => {
            const done = ["concluido", "concluído", "done", "feito"].includes(task.status?.toLowerCase());
            return (
              <li key={task.id} className="px-4 py-3 flex items-start gap-3">
                {done ? <CheckCircle2 className="size-4 text-emerald-400 mt-0.5" /> : <CircleDotDashed className="size-4 text-primary mt-0.5" />}
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-sm font-medium">{task.taskTitle}</span>
                    <span className="text-[10px] uppercase tracking-wide text-muted-foreground border border-border/60 rounded-full px-2 py-0.5">{task.taskType}</span>
                    <span className="text-[10px] uppercase tracking-wide text-amber-300 border border-amber-500/30 rounded-full px-2 py-0.5">{task.priority}</span>
                  </div>
                  {task.notes && <p className="text-xs text-muted-foreground mt-1">{task.notes}</p>}
                  <p className="text-xs text-primary mt-1">Status: {task.status}</p>
                </div>
              </li>
            );
          })}
          {!tasks.length && <Empty />}
        </ul>
      </section>

      <DataSourceFooter />
    </div>
  );
}

function Input({ value, onChange, placeholder }: { value: string; onChange: (v: string) => void; placeholder?: string }) {
  return (
    <input
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      className="w-full rounded-md bg-secondary/40 border border-border/60 px-3 py-2 text-sm outline-none focus:border-primary/60"
    />
  );
}

function Textarea({ value, onChange, placeholder }: { value: string; onChange: (v: string) => void; placeholder?: string }) {
  return (
    <textarea
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      rows={3}
      className="w-full rounded-md bg-secondary/40 border border-border/60 px-3 py-2 text-sm outline-none focus:border-primary/60 resize-none"
    />
  );
}

function ListCard({ title, count, children }: { title: string; count: number; children: React.ReactNode }) {
  return (
    <div className="rounded-xl glass overflow-hidden">
      <div className="flex items-center justify-between px-4 py-3 border-b border-border/60">
        <span className="text-sm font-medium">{title}</span>
        <span className="text-xs font-mono text-muted-foreground">{count}</span>
      </div>
      <ul className="divide-y divide-border/40 max-h-[360px] overflow-auto">{children}</ul>
    </div>
  );
}

function Row({ title, subtitle, source }: { title: string; subtitle?: string; source: "mock" | "real" }) {
  return (
    <li className="px-4 py-3 flex items-center justify-between gap-3">
      <div className="min-w-0">
        <div className="text-sm truncate">{title}</div>
        {subtitle && <div className="text-xs text-muted-foreground truncate">{subtitle}</div>}
      </div>
      <SourceBadge source={source} />
    </li>
  );
}

function Empty() {
  return <li className="px-4 py-6 text-center text-xs text-muted-foreground">Sem registros ainda.</li>;
}
