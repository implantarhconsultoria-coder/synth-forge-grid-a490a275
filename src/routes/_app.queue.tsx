import { createFileRoute } from "@tanstack/react-router";
import { factoryData, useFactoryData } from "@/lib/factory-data";
import { ListChecks } from "lucide-react";

export const Route = createFileRoute("/_app/queue")({
  component: QueuePage,
});

function QueuePage() {
  useFactoryData();
  const missions = factoryData.getMissions();
  const commands = factoryData.getCommands();

  const items = [
    ...missions.map((m) => ({
      id: m.id,
      title: m.title,
      sub: m.description || "Missão",
      status: m.status,
      time: m.createdAt,
    })),
    ...commands.map((c) => ({
      id: c.id,
      title: c.commandText,
      sub: c.interpretedAction,
      status: c.status,
      time: c.createdAt,
    })),
  ].sort((a, b) => (a.time < b.time ? 1 : -1));

  return (
    <div className="space-y-6 pb-24 lg:pb-8 max-w-4xl">
      <header>
        <h1 className="text-3xl font-bold tracking-tight flex items-center gap-3">
          <ListChecks className="size-7 text-primary" /> Fila
        </h1>
        <p className="text-muted-foreground mt-1 text-sm">
          Missões e comandos aguardando ou em execução.
        </p>
      </header>

      <section className="rounded-2xl glass border border-border/40 overflow-hidden">
        {items.length === 0 ? (
          <div className="p-10 text-center text-sm text-muted-foreground">
            Nenhuma missão na fila.
          </div>
        ) : (
          <ul className="divide-y divide-border/40">
            {items.map((it) => (
              <li key={it.id} className="px-4 py-3 sm:px-5 sm:py-4 flex items-start gap-3">
                <div className="flex-1 min-w-0">
                  <div className="font-medium truncate">{it.title}</div>
                  <div className="text-xs text-muted-foreground truncate">{it.sub}</div>
                </div>
                <span className="shrink-0 text-[10px] font-mono uppercase tracking-wider rounded-full px-2 py-1 bg-primary/15 text-primary">
                  {it.status}
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
