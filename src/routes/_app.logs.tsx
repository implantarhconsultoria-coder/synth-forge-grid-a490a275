import { createFileRoute } from "@tanstack/react-router";
import { useFactoryData, factoryData } from "@/lib/factory-data";
import { Activity } from "lucide-react";

export const Route = createFileRoute("/_app/logs")({
  component: LogsPage,
});

const tone: Record<string, string> = {
  ok: "text-success",
  warn: "text-warning",
  info: "text-primary",
  error: "text-destructive",
};

function LogsPage() {
  useFactoryData();
  const logs = factoryData.getLogs();
  return (
    <div className="mx-auto w-full max-w-4xl space-y-5 pb-28 lg:pb-10">
      <header className="flex items-center gap-3">
        <Activity className="size-6 text-primary" />
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Logs</h1>
          <p className="text-sm text-muted-foreground">Eventos do sistema em tempo real.</p>
        </div>
      </header>
      <ul className="rounded-2xl glass border border-border/40 divide-y divide-border/40 font-mono text-xs sm:text-sm overflow-hidden">
        {logs.map((l) => (
          <li key={l.id} className="grid grid-cols-[70px_50px_1fr] gap-2 px-3 py-2.5 sm:px-4 sm:py-3">
            <span className="text-[10px] sm:text-xs text-muted-foreground">
              {new Date(l.createdAt).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}
            </span>
            <span className={`text-[10px] sm:text-xs uppercase ${tone[l.level] || ""}`}>{l.level}</span>
            <span className="break-words text-foreground/90">{l.message}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
