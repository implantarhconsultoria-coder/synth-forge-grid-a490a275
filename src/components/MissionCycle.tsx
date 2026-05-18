import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import {
  Rocket, Play, RefreshCw, Loader2, CheckCircle2, AlertTriangle,
  Clock, ShieldCheck, Sparkles, ListChecks,
} from "lucide-react";
import { aiAnalyze, getMissionStatus } from "@/lib/factory-analyze.functions";
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
interface Diagnosis {
  headline: string;
  toValidate: string[];
  risks: string[];
  realCommand: string;
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
  const analyzeFn = useServerFn(aiAnalyze);
  const statusFn = useServerFn(getMissionStatus);
  const [prompt, setPrompt] = useState("");
  const [phase, setPhase] = useState<Phase>("idle");
  const [diag, setDiag] = useState<Diagnosis | null>(null);
  const [steps, setSteps] = useState<Step[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [missionId, setMissionId] = useState<string | null>(null);

  const counts = steps.reduce(
    (acc, s) => ({ ...acc, [s.status]: acc[s.status] + 1 }),
    { corrigido: 0, preparado: 0, pendente: 0, falha: 0 } as Record<StepStatus, number>,
  );

  async function runAnalysis() {
    if (!prompt.trim()) return;
    setPhase("analyzing");
    setError(null);
    factoryData.addLog({ type: "system", level: "info", message: `Análise IA REAL iniciada: "${prompt.slice(0, 80)}"` });
    try {
      const result = await analyzeFn({ data: { prompt } });
      const d: Diagnosis = {
        headline: result.headline,
        toValidate: result.toValidate,
        risks: result.risks,
        realCommand: result.realCommand,
      };
      setDiag(d);
      const toCheck = d.toValidate?.length ? d.toValidate : [d.headline];
      setSteps(toCheck.map((t: string, i: number) => ({ id: `s${i}`, text: t, status: "pendente" })));
      setPhase("ready");
      factoryData.addLog({ type: "system", level: "ok", message: `IA real respondeu: ${d.headline}` });
    } catch (e: any) {
      const msg = e?.message || "Falha na análise IA";
      setError(msg);
      factoryData.addLog({ type: "system", level: "error", message: `Analisar: ${msg}` });
      setPhase("idle");
    }
  }

  async function createReal() {
    if (!diag) return;
    const scoped = buildScopedMission(prompt);
    const objective = `${diag.realCommand || `AUDITORIA REAL — ${diag.headline}`}\n\n${scoped.finalPrompt}`;
    try {
      const m = await factoryData.createExecutionMission({
        title: `[${scoped.module.name}] ${diag.headline}`,
        objective,
        project: scoped.project,
      });
      setMissionId(m.id);
      notify({ kind: "mission_created", title: "Missão real criada", body: `${scoped.module.name} · ${diag.headline}` });
    } catch (e: any) {
      const msg = e?.message || "Falha ao criar missão";
      setError(msg);
      factoryData.addLog({ type: "system", level: "error", message: `Criar missão: ${msg}` });
    }
  }

  async function execute() {
    if (!diag) return;
    setPhase("executing");
    setError(null);
    try {
      // Garante que a missão real foi criada
      let id = missionId;
      if (!id) {
        const scoped = buildScopedMission(prompt);
        const objective = `${diag.realCommand}\n\n${scoped.finalPrompt}`;
        const m = await factoryData.createExecutionMission({
          title: `[${scoped.module.name}] ${diag.headline}`,
          objective,
          project: scoped.project,
        });
        id = m.id;
        setMissionId(id);
      }

      // Dispara worker REAL (IA + commit GitHub)
      const tickRes = await fetch("/api/public/factory/tick", { method: "POST" });
      if (!tickRes.ok) throw new Error(`Worker HTTP ${tickRes.status}`);
      const tickJson = await tickRes.json();
      if (!tickJson.hasGithub) {
        factoryData.addLog({ type: "system", level: "warn", message: "GITHUB_TOKEN ausente — commit real desabilitado" });
      }

      // Poll status até concluir
      let row: any = null;
      for (let i = 0; i < 30; i++) {
        await new Promise((r) => setTimeout(r, 1500));
        row = await statusFn({ data: { id: id! } });
        if (row?.status === "done" || row?.status === "failed") break;
      }

      // Atualiza steps com base no resultado real
      setSteps((prev) =>
        prev.map((s) => ({
          ...s,
          status: row?.status === "failed" ? "falha" : classify(s.text, diag),
        })),
      );

      if (row?.status === "failed") {
        setError(row?.error || "Execução falhou");
        factoryData.addLog({ type: "system", level: "error", message: `Execução falhou: ${row?.error}` });
      } else if (row?.status === "done") {
        const commitUrl = row?.result?.commit?.url;
        factoryData.addLog({
          type: "system",
          level: "ok",
          message: commitUrl ? `Commit real: ${commitUrl}` : "Plano IA gerado (sem commit)",
        });
      }
      setPhase("done");
    } catch (e: any) {
      const msg = e?.message || "Falha na execução real";
      setError(msg);
      factoryData.addLog({ type: "system", level: "error", message: `Executar: ${msg}` });
      setPhase("ready");
    }
  }

  async function revalidate() {
    if (!missionId) {
      setError("Sem missão para revalidar");
      return;
    }
    setPhase("analyzing");
    setError(null);
    try {
      const row = await statusFn({ data: { id: missionId } });
      setSteps((prev) =>
        prev.map((s) => ({
          ...s,
          status: row?.status === "failed" ? "falha" : row?.status === "done" ? "corrigido" : "pendente",
        })),
      );
      factoryData.addLog({ type: "system", level: "info", message: `Revalidação real: status=${row?.status}` });
      setPhase(row?.status === "done" || row?.status === "failed" ? "done" : "ready");
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
    setMissionId(null);
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
            disabled={!diag || phase === "executing" || phase === "analyzing"}
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-success/40 text-success py-2.5 text-xs font-bold disabled:opacity-40 hover:bg-success/10 transition"
          >
            {phase === "executing" ? <Loader2 className="size-3.5 animate-spin" /> : <Play className="size-3.5" />}
            Executar missão
          </button>
        </div>

        {error && <div className="text-xs text-destructive">{error}</div>}

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

        {(phase === "done" || phase === "ready") && missionId && (
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
