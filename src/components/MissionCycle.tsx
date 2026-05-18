import { useState } from "react";
import {
  Rocket, Play, RefreshCw, Loader2, CheckCircle2, AlertTriangle,
  Clock, ShieldCheck, Sparkles, ListChecks,
} from "lucide-react";
import { analyzeMissionLocal, type Diagnosis } from "@/lib/factory-analyze";
import { factoryData } from "@/lib/factory-data";
import { notify } from "@/lib/notifications";
import { buildScopedMission } from "@/config/factoryModules";

type StepStatus = "pendente" | "preparado" | "corrigido" | "falha";
interface Step {
  id: string;
  text: string;
  status: StepStatus;
  note?: string;
}

type Phase = "idle" | "analyzing" | "ready" | "executing" | "done";

const stepMeta: Record<StepStatus, { label: string; Icon: any; cls: string }> = {
  corrigido: { label: "Corrigido",  Icon: CheckCircle2,  cls: "text-success border-success/40 bg-success/10" },
  preparado: { label: "Preparado",  Icon: ShieldCheck,   cls: "text-primary border-primary/40 bg-primary/10" },
  pendente:  { label: "Pendente",   Icon: Clock,         cls: "text-warning border-warning/40 bg-warning/10" },
  falha:     { label: "Falha",      Icon: AlertTriangle, cls: "text-destructive border-destructive/40 bg-destructive/10" },
};

function classify(text: string, diag: Diagnosis): StepStatus {
  const t = text.toLowerCase();
  if (diag.risks?.some((r) => t.includes(r.toLowerCase().slice(0, 12)))) return "falha";
  if (/login|autentic|permiss|banco|gravação|publicad|deploy/.test(t)) return "pendente";
  if (/console|rota|tela|checklist|histórico|módulo/.test(t)) return "preparado";
  return "pendente";
}

export function MissionCycle() {
  const analyze = (p: string) => Promise.resolve(analyzeMissionLocal(p));
  const [prompt, setPrompt] = useState("");
  const [phase, setPhase] = useState<Phase>("idle");
  const [diag, setDiag] = useState<Diagnosis | null>(null);
  const [steps, setSteps] = useState<Step[]>([]);
  const [error, setError] = useState<string | null>(null);

  const counts = steps.reduce(
    (acc, s) => ({ ...acc, [s.status]: acc[s.status] + 1 }),
    { corrigido: 0, preparado: 0, pendente: 0, falha: 0 } as Record<StepStatus, number>,
  );

  async function runAnalysis() {
    if (!prompt.trim()) return;
    setPhase("analyzing");
    setError(null);
    factoryData.addLog({ type: "system", level: "info", message: `Ciclo de missão iniciado: "${prompt.slice(0, 80)}"` });
    try {
      const result = await analyze(prompt);
      setDiag(result);
      const toCheck = result.toValidate?.length ? result.toValidate : [result.headline];
      setSteps(toCheck.map((t: string, i: number) => ({ id: `s${i}`, text: t, status: "pendente" })));
      setPhase("ready");
    } catch (e: any) {
      setError(e?.message || "Falha na análise");
      setPhase("idle");
    }
  }

  async function createReal() {
    if (!diag) return;
    // INTERCEPTADOR: aplica escopo rígido do módulo antes de despachar
    const scoped = buildScopedMission(prompt);
    const objective = `${diag.realCommand || `AUDITORIA REAL — ${diag.headline}`}\n\n${scoped.finalPrompt}`;
    try {
      await factoryData.createExecutionMission({
        title: `[${scoped.module.name}] ${diag.headline}`,
        objective,
        project: scoped.project,
      });
      notify({ kind: "mission_created", title: "Missão real criada", body: `${scoped.module.name} · ${diag.headline}` });
      factoryData.addLog({
        type: "system",
        level: "ok",
        module: scoped.module.name,
        projectName: scoped.project,
        message: `Missão real enviada à fila: ${diag.headline}`,
        metadataDetails: {
          prompt: scoped.finalPrompt,
          response: `Arquivos: ${scoped.targetFiles.join(", ") || "—"}\nTabelas: ${scoped.databaseTables.join(", ") || "—"}`,
        },
      });
    } catch (e: any) {
      setError(e?.message || "Falha ao criar missão");
    }
  }

  async function execute() {
    if (!diag || !steps.length) return;
    setPhase("executing");
    for (let i = 0; i < steps.length; i++) {
      await new Promise((r) => setTimeout(r, 450));
      setSteps((prev) => {
        const next = [...prev];
        next[i] = { ...next[i], status: classify(next[i].text, diag) };
        return next;
      });
    }
    factoryData.addLog({ type: "system", level: "ok", message: `Execução simulada concluída: ${diag.headline}` });
    setPhase("done");
  }

  async function revalidate() {
    setSteps((prev) => prev.map((s) => ({ ...s, status: "pendente" })));
    setPhase("analyzing");
    try {
      const result = await analyze(prompt);
      setDiag(result);
      const toCheck = result.toValidate?.length ? result.toValidate : [result.headline];
      setSteps(toCheck.map((t: string, i: number) => ({ id: `s${i}`, text: t, status: "pendente" })));
      setPhase("ready");
      factoryData.addLog({ type: "system", level: "info", message: `Revalidação executada: ${result.headline}` });
    } catch (e: any) {
      setError(e?.message || "Falha ao revalidar");
      setPhase("ready");
    }
  }

  function reset() {
    setPrompt("");
    setDiag(null);
    setSteps([]);
    setError(null);
    setPhase("idle");
  }

  return (
    <section className="rounded-3xl glass border border-primary/20 overflow-hidden">
      <header className="flex items-center justify-between gap-3 border-b border-border/60 px-5 py-4">
        <div className="flex items-center gap-2">
          <Sparkles className="size-4 text-primary" />
          <h2 className="text-sm font-bold">Ciclo completo de missão</h2>
        </div>
        {phase !== "idle" && (
          <button onClick={reset} className="text-[11px] font-semibold text-muted-foreground hover:text-foreground">
            Nova missão
          </button>
        )}
      </header>

      <div className="p-5 space-y-4">
        {/* prompt */}
        <div className="space-y-2">
          <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Pedido</label>
          <textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            disabled={phase === "analyzing" || phase === "executing"}
            placeholder="Ex.: analisa o app dos mecânicos"
            rows={2}
            className="w-full rounded-xl bg-background border border-border/60 px-3 py-2.5 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-primary/40 disabled:opacity-60"
          />
        </div>

        {/* actions */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
          <button
            onClick={runAnalysis}
            disabled={!prompt.trim() || phase === "analyzing" || phase === "executing"}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-primary to-accent text-primary-foreground py-2.5 text-xs font-bold disabled:opacity-40 active:scale-95 transition"
          >
            {phase === "analyzing" ? <Loader2 className="size-3.5 animate-spin" /> : <ListChecks className="size-3.5" />}
            Analisar
          </button>
          <button
            onClick={createReal}
            disabled={!diag || phase === "analyzing" || phase === "executing"}
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-primary/40 text-primary py-2.5 text-xs font-bold disabled:opacity-40 hover:bg-primary/10 transition"
          >
            <Rocket className="size-3.5" /> Criar missão real
          </button>
          <button
            onClick={execute}
            disabled={!steps.length || phase === "executing" || phase === "analyzing"}
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-success/40 text-success py-2.5 text-xs font-bold disabled:opacity-40 hover:bg-success/10 transition"
          >
            {phase === "executing" ? <Loader2 className="size-3.5 animate-spin" /> : <Play className="size-3.5" />}
            Executar missão
          </button>
        </div>

        {error && <div className="text-xs text-destructive">{error}</div>}

        {/* counters */}
        {steps.length > 0 && (
          <div className="grid grid-cols-4 gap-2">
            {(Object.keys(stepMeta) as StepStatus[]).map((k) => {
              const m = stepMeta[k];
              const Icon = m.Icon;
              return (
                <div key={k} className={`rounded-xl border px-2 py-2.5 text-center ${m.cls}`}>
                  <Icon className="size-4 mx-auto mb-1" />
                  <div className="text-lg font-black leading-none">{counts[k]}</div>
                  <div className="text-[10px] font-bold uppercase tracking-wider mt-0.5">{m.label}</div>
                </div>
              );
            })}
          </div>
        )}

        {/* steps list */}
        {steps.length > 0 && (
          <ul className="space-y-1.5">
            {steps.map((s) => {
              const m = stepMeta[s.status];
              const Icon = m.Icon;
              return (
                <li
                  key={s.id}
                  className={`flex items-start gap-2 rounded-xl border px-3 py-2 text-sm ${m.cls}`}
                >
                  <Icon className="size-4 mt-0.5 shrink-0" />
                  <span className="flex-1 text-foreground/90">{s.text}</span>
                  <span className="text-[10px] font-bold uppercase tracking-wider shrink-0">{m.label}</span>
                </li>
              );
            })}
          </ul>
        )}

        {/* revalidar */}
        {phase === "done" && (
          <button
            onClick={revalidate}
            className="w-full inline-flex items-center justify-center gap-2 rounded-xl border border-border/60 py-2.5 text-xs font-bold hover:bg-secondary/50 transition"
          >
            <RefreshCw className="size-3.5" /> Revalidar
          </button>
        )}
      </div>
    </section>
  );
}
