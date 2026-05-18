import { useEffect, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command";
import { factoryData } from "@/lib/factory-data";
import { toast } from "sonner";
import { Rocket, ListChecks, Activity, Settings, RefreshCw, Plus, Play } from "lucide-react";

export function CommandPalette({ open, onOpenChange }: { open: boolean; onOpenChange: (v: boolean) => void }) {
  const navigate = useNavigate();
  const [query, setQuery] = useState("");

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        onOpenChange(!open);
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [open, onOpenChange]);

  const run = (fn: () => void | Promise<void>) => async () => {
    onOpenChange(false);
    try { await fn(); } catch (e: any) { toast.error(e?.message ?? "Falha ao executar"); }
  };

  const go = (to: string) => run(() => { navigate({ to }); });

  const trimmed = query.trim();
  const isCommand = trimmed.length > 0;

  return (
    <CommandDialog open={open} onOpenChange={onOpenChange}>
      <CommandInput
        placeholder="Buscar ou digitar comando… (ex: 'criar missão deploy beta')"
        value={query}
        onValueChange={setQuery}
      />
      <CommandList>
        <CommandEmpty>Nenhum resultado.</CommandEmpty>

        {isCommand && (
          <>
            <CommandGroup heading="Executar">
              <CommandItem
                onSelect={run(async () => {
                  const m = await factoryData.createExecutionMission({ title: trimmed, objective: trimmed });
                  toast.success(`Missão enfileirada: ${m.title}`);
                })}
              >
                <Play className="mr-2 size-4" />
                Executar missão: <span className="ml-1 font-medium">{trimmed}</span>
              </CommandItem>
              <CommandItem
                onSelect={run(async () => {
                  await factoryData.createMission({ title: trimmed });
                  toast.success("Missão criada");
                })}
              >
                <Plus className="mr-2 size-4" />
                Criar missão simples: <span className="ml-1 font-medium">{trimmed}</span>
              </CommandItem>
              <CommandItem
                onSelect={run(() => {
                  factoryData.addCommand({ commandText: trimmed });
                  toast.success("Comando registrado");
                })}
              >
                <Activity className="mr-2 size-4" />
                Registrar comando bruto
              </CommandItem>
            </CommandGroup>
            <CommandSeparator />
          </>
        )}

        <CommandGroup heading="Navegar">
          <CommandItem onSelect={go("/")}><Rocket className="mr-2 size-4" />Missão (Home)</CommandItem>
          <CommandItem onSelect={go("/queue")}><ListChecks className="mr-2 size-4" />Fila</CommandItem>
          <CommandItem onSelect={go("/logs")}><Activity className="mr-2 size-4" />Logs</CommandItem>
          <CommandItem onSelect={go("/settings")}><Settings className="mr-2 size-4" />Configurações</CommandItem>
        </CommandGroup>

        <CommandSeparator />
        <CommandGroup heading="Sistema">
          <CommandItem
            onSelect={run(async () => {
              await factoryData.refresh();
              toast.success("Dados atualizados");
            })}
          >
            <RefreshCw className="mr-2 size-4" />Atualizar dados
          </CommandItem>
          <CommandItem
            onSelect={run(async () => {
              const r = await fetch("/api/public/factory/tick", { method: "POST" });
              toast[r.ok ? "success" : "error"](`Worker tick: ${r.status}`);
            })}
          >
            <Play className="mr-2 size-4" />Disparar worker (/factory/tick)
          </CommandItem>
        </CommandGroup>
      </CommandList>
    </CommandDialog>
  );
}
