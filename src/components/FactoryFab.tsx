import { useState } from "react";
import { Sparkles, X, Search, CheckCircle2 } from "lucide-react";
import { factoryData } from "@/lib/factory-data";
import { notify } from "@/lib/notifications";

export function FactoryFab() {
  const [open, setOpen] = useState(false);

  const openAnalysis = () => {
    setOpen(false);
    factoryData.addLog({
      type: "system",
      level: "info",
      message: "Análise da AI Factory iniciada pelo operador",
    });
    notify("mission_started", "AI Factory", "Análise iniciada");
    window.dispatchEvent(new CustomEvent("factory:open-analysis"));
  };

  const approveApp = () => {
    setOpen(false);
    factoryData.addLog({
      type: "system",
      level: "ok",
      message: "App aprovado pelo operador — release liberado",
    });
    notify("mission_completed", "AI Factory", "App aprovado ✅");
  };

  return (
    <div className="fixed right-4 bottom-24 lg:bottom-6 z-40 flex flex-col items-end gap-2">
      {open && (
        <div className="flex flex-col items-end gap-2 animate-in fade-in slide-in-from-bottom-2 duration-200">
          <button
            onClick={openAnalysis}
            className="flex items-center gap-2 rounded-full bg-background/95 border border-primary/40 backdrop-blur-xl pl-4 pr-3 py-2.5 text-sm font-semibold shadow-[0_8px_30px_rgba(56,189,248,0.35)] hover:border-primary transition"
          >
            <span>Abrir análise</span>
            <span className="size-7 rounded-full bg-primary/15 grid place-items-center">
              <Search className="size-3.5 text-primary" />
            </span>
          </button>
          <button
            onClick={approveApp}
            className="flex items-center gap-2 rounded-full bg-background/95 border border-success/40 backdrop-blur-xl pl-4 pr-3 py-2.5 text-sm font-semibold shadow-[0_8px_30px_rgba(34,197,94,0.35)] hover:border-success transition"
          >
            <span>App aprovado</span>
            <span className="size-7 rounded-full bg-success/15 grid place-items-center">
              <CheckCircle2 className="size-3.5 text-success" />
            </span>
          </button>
        </div>
      )}

      <button
        onClick={() => setOpen((v) => !v)}
        aria-label="AI Factory"
        className="size-14 rounded-full bg-gradient-to-br from-primary to-accent grid place-items-center glow-border shadow-[0_10px_40px_rgba(139,92,246,0.55)] active:scale-95 transition"
      >
        {open ? (
          <X className="size-6 text-primary-foreground" />
        ) : (
          <Sparkles className="size-6 text-primary-foreground" />
        )}
      </button>
    </div>
  );
}
