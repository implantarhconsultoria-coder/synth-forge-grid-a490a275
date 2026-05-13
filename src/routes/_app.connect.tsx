import { createFileRoute } from "@tanstack/react-router";
import { INTEGRATIONS } from "@/lib/mock-data";
import { Cable, CheckCircle2, RefreshCw, AlertTriangle, PowerOff } from "lucide-react";

export const Route = createFileRoute("/_app/connect")({
  component: ConnectPage,
});

const statusMap = {
  connected: { i: CheckCircle2, c: "text-success", label: "Conectado" },
  syncing: { i: RefreshCw, c: "text-primary", label: "Sincronizando" },
  warning: { i: AlertTriangle, c: "text-warning", label: "Atenção" },
  offline: { i: PowerOff, c: "text-muted-foreground", label: "Offline" },
} as const;

function ConnectPage() {
  return (
    <div className="space-y-8">
      <header>
        <div className="inline-flex items-center gap-2 rounded-full glass px-3 py-1 text-xs">
          <Cable className="size-3 text-primary" /> AI CONNECT
        </div>
        <h1 className="mt-3 text-3xl font-bold tracking-tight">Integrações</h1>
        <p className="text-muted-foreground mt-1">Conexões ativas entre o núcleo IA e ecossistemas externos.</p>
      </header>

      <section className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
        {INTEGRATIONS.map((it) => {
          const s = statusMap[it.status];
          const Icon = s.i;
          return (
            <div key={it.name} className="rounded-xl glass p-5 flex items-start gap-4">
              <div className="size-12 rounded-lg bg-secondary grid place-items-center text-lg font-bold text-gradient">
                {it.name[0]}
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold">{it.name}</h3>
                  <span className={`inline-flex items-center gap-1 text-xs ${s.c}`}>
                    <Icon className={`size-3.5 ${it.status === "syncing" ? "animate-spin" : ""}`} />
                    {s.label}
                  </span>
                </div>
                <p className="mt-1 text-xs text-muted-foreground">{it.desc}</p>
                <button className="mt-3 text-xs text-primary hover:underline">Gerenciar conexão</button>
              </div>
            </div>
          );
        })}
      </section>
    </div>
  );
}
