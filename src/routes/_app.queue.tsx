import { createFileRoute } from "@tanstack/react-router";
import { useFactoryData, factoryData } from "@/lib/factory-data";
import { ListChecks } from "lucide-react";

export const Route = createFileRoute("/_app/queue")({
  component: QueuePage,
});

function QueuePage() {
  useFactoryData();
  const missions = (factoryData.getMissions?.() ?? []) as any[];
  return (
    <div className="mx-auto w-full max-w-4xl space-y-5 pb-28 lg:pb-10">
      <header className="flex items-center gap-3">
        <ListChecks className="size-6 text-primary" />
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Fila de missões</h1>
          <p className="text-sm text-muted-foreground">Itens enfileirados para o núcleo IA.</p>
        </div>
      </header>
      <div className="rounded-2xl glass border border-border/40 divide-y divide-border/40">
        {missions.length === 0 ? (
          <div className="p-6 text-sm text-muted-foreground">Nenhuma missão na fila.</div>
        ) : (
          missions.map((m: any) => (
            <div key={m.id} className="p-4 flex items-center justify-between gap-3">
              <div className="min-w-0">
                <div className="font-medium truncate">{m.title || m.task_title || "Missão"}</div>
                <div className="text-xs text-muted-foreground truncate">{m.objective || ""}</div>
              </div>
              <span className="text-[10px] uppercase tracking-wider rounded-full bg-primary/10 text-primary px-2 py-1">
                {m.status || "pending"}
              </span>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
