import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { Sparkles, X, Send, AlertTriangle, CheckCircle2, AlertCircle, Loader2, ShieldAlert, Rocket } from "lucide-react";
import { analyzeMission, type Diagnosis } from "@/lib/factory-analyze.functions";
import { factoryData } from "@/lib/factory-data";
import { notify } from "@/lib/notifications";

type Phase = "closed" | "ask" | "loading" | "result";

const statusMeta = {
  wrong: {
    label: "Caminho errado",
    Icon: AlertTriangle,
    ring: "border-destructive/50",
    chip: "bg-destructive/15 text-destructive border-destructive/30",
  },
  ready: {
    label: "Pronto",
    Icon: CheckCircle2,
    ring: "border-success/50",
    chip: "bg-success/15 text-success border-success/30",
  },
  missing: {
    label: "Falta configurar",
    Icon: AlertCircle,
    ring: "border-warning/50",
    chip: "bg-warning/15 text-warning border-warning/30",
  },
  needs_validation: {
    label: "Precisa validar",
    Icon: ShieldAlert,
    ring: "border-warning/60",
    chip: "bg-warning/15 text-warning border-warning/40",
  },
} as const;

export function FactoryFab() {
  const [phase, setPhase] = useState<Phase>("closed");
  const [prompt, setPrompt] = useState("");
  const [diag, setDiag] = useState<Diagnosis | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const analyze = useServerFn(analyzeMission);

  const reset = () => {
    setPhase("closed");
    setPrompt("");
    setDiag(null);
    setError(null);
    setCreating(false);
  };

  const submit = async () => {
    if (!prompt.trim()) return;
    setPhase("loading");
    setError(null);
    factoryData.addLog({ type: "system", level: "info", message: `Pergunta enviada à AI Factory: "${prompt.slice(0, 80)}"` });
    try {
      const result = await analyze({ data: { prompt } });
      setDiag(result);
      setPhase("result");
      const lvl = result.status === "wrong" ? "error" : result.status === "ready" ? "ok" : "warn";
      factoryData.addLog({ type: "system", level: lvl as any, message: `Diagnóstico: ${result.headline}` });
      notify({
        kind: result.status === "wrong" ? "critical_error" : "mission_started",
        title: "Análise concluída",
        body: result.headline,
      });
    } catch (e: any) {
      setError(e?.message || "Falha na análise");
      setPhase("ask");
    }
  };

  const createRealMission = async () => {
    if (!diag) return;
    setCreating(true);
    const objective =
      diag.realCommand ||
      `AUDITORIA REAL — ${diag.headline}: validar versão publicada x GitHub, login, rotas, gravação no banco, erros de console e checklist final.`;
    try {
      await factoryData.createExecutionMission({
        title: diag.headline || "Missão de auditoria",
        objective,
      });
      notify({ kind: "mission_created", title: "Missão real criada", body: diag.headline });
      reset();
    } catch (e: any) {
      setError(e?.message || "Falha ao criar missão");
      setCreating(false);
    }
  };

  return (
    <>
      <button
        onClick={() => setPhase((p) => (p === "closed" ? "ask" : "closed"))}
        aria-label="AI Factory"
        className="fixed right-4 bottom-24 lg:bottom-6 z-40 size-14 rounded-full bg-gradient-to-br from-primary to-accent grid place-items-center glow-border shadow-[0_10px_40px_rgba(139,92,246,0.55)] active:scale-95 transition"
      >
        {phase === "closed" ? <Sparkles className="size-6 text-primary-foreground" /> : <X className="size-6 text-primary-foreground" />}
      </button>

      {phase !== "closed" && (
        <div className="fixed inset-0 z-40 bg-background/80 backdrop-blur-md grid place-items-center p-4" onClick={reset}>
          <div
            className="w-full max-w-lg rounded-3xl bg-card border border-border/60 shadow-2xl overflow-hidden max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            {phase === "ask" && (
              <div className="p-5 space-y-4">
                <div className="flex items-center gap-2">
                  <Sparkles className="size-5 text-primary" />
                  <h2 className="text-lg font-bold">Pergunte à AI Factory</h2>
                </div>
                <p className="text-xs text-muted-foreground">
                  Descreva sua ideia, pedido ou dúvida. A Factory devolve um diagnóstico real — nada é dado como "pronto" sem validação executada.
                </p>
                <textarea
                  autoFocus
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  placeholder="Ex.: analisa o app dos mecânicos"
                  rows={5}
                  className="w-full rounded-xl bg-background border border-border/60 px-3 py-2.5 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-primary/40"
                />
                {error && <div className="text-xs text-destructive">{error}</div>}
                <div className="flex gap-2">
                  <button
                    onClick={reset}
                    className="flex-1 rounded-xl border border-border/60 py-2.5 text-sm font-semibold hover:bg-secondary/50 transition"
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={submit}
                    disabled={!prompt.trim()}
                    className="flex-1 inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-primary to-accent text-primary-foreground py-2.5 text-sm font-bold disabled:opacity-40"
                  >
                    <Send className="size-4" /> Analisar
                  </button>
                </div>
              </div>
            )}

            {phase === "loading" && (
              <div className="p-10 flex flex-col items-center gap-3 text-sm text-muted-foreground">
                <Loader2 className="size-8 text-primary animate-spin" />
                <span>Analisando…</span>
              </div>
            )}

            {phase === "result" && diag && (
              <ResultView
                diag={diag}
                creating={creating}
                error={error}
                onClose={reset}
                onCreateMission={createRealMission}
              />
            )}
          </div>
        </div>
      )}
    </>
  );
}

function ResultView({
  diag,
  creating,
  error,
  onClose,
  onCreateMission,
}: {
  diag: Diagnosis;
  creating: boolean;
  error: string | null;
  onClose: () => void;
  onCreateMission: () => void;
}) {
  const meta = statusMeta[diag.status] ?? statusMeta.needs_validation;
  const Icon = meta.Icon;
  const isValidation = diag.status === "needs_validation";

  return (
    <div className={`border-t-4 ${meta.ring}`}>
      <div className="p-5 space-y-4">
        <div className="flex items-center justify-between">
          <span className="text-[10px] font-bold uppercase tracking-[0.18em] text-muted-foreground">
            Análise concluída
          </span>
          <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-semibold ${meta.chip}`}>
            <Icon className="size-3.5" /> {meta.label}
          </span>
        </div>

        <h3 className="text-base font-bold leading-snug">{diag.headline}</h3>

        <div className="space-y-3 text-sm">
          {isValidation && (
            <>
              {diag.knownFacts?.length ? <ListField label="O que sei" items={diag.knownFacts} /> : null}
              {diag.toValidate?.length ? <ListField label="O que falta validar" items={diag.toValidate} /> : null}
              {diag.risks?.length ? <ListField label="Riscos" items={diag.risks} tone="destructive" /> : null}
              {diag.impacts?.length ? <ListField label="Impacto" items={diag.impacts} tone="warning" /> : null}
              {diag.realCommand && <Field label="Comando real" value={diag.realCommand} tone="primary" />}
            </>
          )}

          {diag.status === "wrong" && (
            <>
              {diag.reason && <Field label="Motivo" value={diag.reason} />}
              {diag.risk && <Field label="Risco" value={diag.risk} tone="destructive" />}
              {diag.suggestion && <Field label="Caminho sugerido" value={diag.suggestion} tone="primary" />}
            </>
          )}

          {diag.status === "missing" && (
            <>
              {diag.missing?.length ? <ListField label="O que falta" items={diag.missing} /> : null}
              {diag.needsConfig?.length ? <ListField label="Configurar" items={diag.needsConfig} /> : null}
              {diag.impact && <Field label="Impacto" value={diag.impact} tone="warning" />}
            </>
          )}

          {diag.status === "ready" && diag.whereToUse && (
            <Field label="Onde usar" value={diag.whereToUse} />
          )}
        </div>

        {error && <div className="text-xs text-destructive">{error}</div>}

        <div className="grid grid-cols-3 gap-2 pt-2">
          <button
            onClick={onCreateMission}
            disabled={creating}
            className="rounded-xl bg-gradient-to-r from-primary to-accent text-primary-foreground py-2.5 text-xs font-bold active:scale-95 transition inline-flex items-center justify-center gap-1.5 disabled:opacity-50"
          >
            {creating ? <Loader2 className="size-3.5 animate-spin" /> : <Rocket className="size-3.5" />}
            Criar missão real
          </button>
          <button
            onClick={onClose}
            className="rounded-xl border border-destructive/40 text-destructive py-2.5 text-xs font-bold hover:bg-destructive/10 transition"
          >
            Recusar
          </button>
          <button
            onClick={onClose}
            className="rounded-xl border border-border/60 py-2.5 text-xs font-bold hover:bg-secondary/50 transition"
          >
            OK, entendi
          </button>
        </div>
      </div>
    </div>
  );
}

function Field({ label, value, tone }: { label: string; value: string; tone?: "destructive" | "primary" | "success" | "warning" }) {
  const color =
    tone === "destructive" ? "text-destructive" :
    tone === "primary" ? "text-primary" :
    tone === "success" ? "text-success" :
    tone === "warning" ? "text-warning" : "text-foreground";
  return (
    <div>
      <div className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-0.5">{label}</div>
      <div className={`text-sm leading-snug ${color}`}>{value}</div>
    </div>
  );
}

function ListField({ label, items, tone }: { label: string; items: string[]; tone?: "destructive" | "warning" }) {
  const color = tone === "destructive" ? "text-destructive" : tone === "warning" ? "text-warning" : "text-foreground";
  return (
    <div>
      <div className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-1">{label}</div>
      <ul className="space-y-1">
        {items.map((it, i) => (
          <li key={i} className={`text-sm leading-snug flex gap-2 ${color}`}>
            <span className="text-primary mt-0.5">›</span>
            <span>{it}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
