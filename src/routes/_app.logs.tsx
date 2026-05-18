import { createFileRoute } from "@tanstack/react-router";
import { factoryData, useFactoryData } from "@/lib/factory-data";
import { Activity } from "lucide-react";

export const Route = createFileRoute("/_app/logs")({
  component: LogsPage,
});

const logColor: Record<string, string> = {
  ok: "text-success",
  warn: "text-warning",
  info: "text-primary",
  error: "text-destructive",
};

function LogsPage() {
  useFactoryData();
  const logs = factoryData.getLogs();

  return (
    <div className="space-y-6 pb-24 lg:pb-8 max-w-5xl">
      <header>
        <h1 className="text-3xl font-bold tracking-tight flex items-center gap-3">
          <Activity className="size-7 text-primary" /> Logs
        </h1>
        <p className="text-muted-foreground mt-1 text-sm">
          Eventos do núcleo, missões, correções e integrações em tempo real.
        </p>
      </header>

      <section className="rounded-2xl glass border border-border/40 overflow-hidden">
        <ul className="divide-y divide-border/40 font-mono text-xs sm:text-sm max-h-[70vh] overflow-auto">
          {logs.map((l) => (
            <li key={l.id} className="grid grid-cols-[70px_50px_1fr] gap-2 px-3 py-2.5 sm:px-4 sm:py-3">
              <span className="text-[10px] sm:text-xs text-muted-foreground">
                {new Date(l.createdAt).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}
              </span>
              <span className={`text-[10px] sm:text-xs uppercase ${logColor[l.level]}`}>{l.level}</span>
              <span className="break-words text-foreground/90">{l.message}</span>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
