import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { Sparkles, X, Send, AlertTriangle, CheckCircle2, AlertCircle, Loader2 } from "lucide-react";
import { analyzeMission, type Diagnosis } from "@/lib/factory-analyze.functions";
import { factoryData } from "@/lib/factory-data";
import { notify } from "@/lib/notifications";

type Phase = "closed" | "ask" | "loading" | "result";

const statusMeta = {
  wrong: {
    label: "Caminho errado",
    color: "destructive",
    Icon: AlertTriangle,
    ring: "border-destructive/50 shadow-[0_10px_40px_rgba(239,68,68,0.35)]",
    chip: "bg-destructive/15 text-destructive border-destructive/30",
  },
  ready: {
    label: "Pronto",
    color: "success",
    Icon: CheckCircle2,
    ring: "border-success/50 shadow-[0_10px_40px_rgba(34,197,94,0.35)]",
    chip: "bg-success/15 text-success border-success/30",
  },
  missing: {
    label: "Falta configurar",
    color: "warning",
    Icon: AlertCircle,
    ring: "border-warning/50 shadow-[0_10px_40px_rgba(234,179,8,0.35)]",
    chip: "bg-warning/15 text-warning border-warning/30",
  },
} as const;

export function FactoryFab() {
  const [phase, setPhase] = useState<Phase>("closed");
  const [prompt, setPrompt] = useState("");
  const [diag, setDiag] = useState<Diagnosis | null>(null);
  const [error, setError] = useState<string | null>(null);
  const analyze = useServerFn(analyzeMission);

  const reset = () => {
    setPhase("closed");
    setPrompt("");
    setDiag(null);
    setError(null);
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
        kind: result.status === "wrong" ? "critical_error" : "mission_completed",
        title: "Análise concluída",
        body: result.headline,
      });
    } catch (e: any) {
      setError(e?.message || "Falha na análise");
      setPhase("ask");
    }
  };

  return (
    <>
      {/* Floating action button */}
      <button
        onClick={() => setPhase((p) => (p === "closed" ? "ask" : "closed"))}
        aria-label="AI Factory"
        className="fixed right-4 bottom-24 lg:bottom-6 z-40 size-14 rounded-full bg-gradient-to-br from-primary to-accent grid place-items-center glow-border shadow-[0_10px_40px_rgba(139,92,246,0.55)] active:scale-95 transition"
      >
        {phase === "closed" ? <Sparkles className="size-6 text-primary-foreground" /> : <X className="size-6 text-primary-foreground" />}
      </button>

      {/* Backdrop + sheet */}
      {phase !== "closed" && (
        <div className="fixed inset-0 z-40 bg-background/80 backdrop-blur-md grid place-items-center p-4" onClick={reset}>
          <div
            className="w-full max-w-lg rounded-3xl bg-card border border-border/60 shadow-2xl overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {phase === "ask" && (
              <div className="p-5 space-y-4">
                <div className="flex items-center gap-2">
                  <Sparkles className="size-5 text-primary" />
                  <h2 className="text-lg font-bold">Pergunte à AI Factory</h2>
                </div>
                <p className="text-xs text-muted-foreground">
                  Descreva sua ideia, pedido ou dúvida. A Factory devolve um diagnóstico real.
                </p>
                <textarea
                  autoFocus
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  placeholder="Ex.: Quero soltar a feature de holerite digital ainda hoje, posso?"
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

            {phase === "result" && diag && <ResultView diag={diag} onClose={reset} onFix={() => { setPhase("ask"); setPrompt(`Corrigir: ${prompt}`); }} />}
          </div>
        </div>
      )}
    </>
  );
}

function ResultView({ diag, onClose, onFix }: { diag: Diagnosis; onClose: () => void; onFix: () => void }) {
  const meta = statusMeta[diag.status];
  const Icon = meta.Icon;

  return (
    <div className={`border-t-4 ${meta.ring.replace("shadow-", "")}`}>
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
          {diag.status === "wrong" && (
            <>
              {diag.reason && <Field label="Motivo" value={diag.reason} />}
              {diag.risk && <Field label="Risco" value={diag.risk} tone="destructive" />}
              {diag.suggestion && <Field label="Caminho sugerido" value={diag.suggestion} tone="primary" />}
            </>
          )}
          {diag.status === "ready" && (
            <>
              {diag.whereToUse && <Field label="Onde usar" value={diag.whereToUse} />}
              {typeof diag.canRelease === "boolean" && (
                <Field
                  label="Liberação"
                  value={diag.canRelease ? "Pode liberar agora." : "Aguardar antes de liberar."}
                  tone={diag.canRelease ? "success" : "warning"}
                />
              )}
            </>
          )}
          {diag.status === "missing" && (
            <>
              {diag.missing && diag.missing.length > 0 && <ListField label="O que falta" items={diag.missing} />}
              {diag.needsConfig && diag.needsConfig.length > 0 && <ListField label="Configurar" items={diag.needsConfig} />}
              {diag.impact && <Field label="Impacto" value={diag.impact} tone="warning" />}
              {diag.askToStart && <Field label="Próximo passo" value="Posso iniciar mesmo assim?" tone="primary" />}
            </>
          )}
        </div>

        <div className="grid grid-cols-3 gap-2 pt-2">
          <button
            onClick={onFix}
            className="rounded-xl bg-gradient-to-r from-primary to-accent text-primary-foreground py-2.5 text-xs font-bold active:scale-95 transition"
          >
            Bora corrigir
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

function ListField({ label, items }: { label: string; items: string[] }) {
  return (
    <div>
      <div className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-1">{label}</div>
      <ul className="space-y-1">
        {items.map((it, i) => (
          <li key={i} className="text-sm leading-snug flex gap-2">
            <span className="text-primary mt-0.5">›</span>
            <span>{it}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
