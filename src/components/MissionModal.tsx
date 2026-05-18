import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { factoryData } from "@/lib/factory-data";
import { notify } from "@/lib/notifications";
import { factorySettings } from "@/lib/factory-settings";
import { toast } from "sonner";
import { Rocket, Loader2 } from "lucide-react";

export function MissionModal({ open, onOpenChange }: { open: boolean; onOpenChange: (v: boolean) => void }) {
  const [title, setTitle] = useState("");
  const [objective, setObjective] = useState("");
  const [project, setProject] = useState(() => factorySettings.get().defaultProject || "AI FACTORY");
  const [loading, setLoading] = useState(false);
  const projects = factoryData.getProjects();

  const submit = async () => {
    if (!title.trim()) {
      toast.error("Informe um título para a missão");
      return;
    }
    setLoading(true);
    try {
      await factoryData.createExecutionMission({ title: title.trim(), objective: objective.trim(), project });
      toast.success("Missão enviada ao núcleo IA");
      void notify("mission_queued", title.trim());
      if (factorySettings.get().safeMode && /senha|login|permiss|banco|supabase|financeiro|pagamento|exclu/i.test(`${title} ${objective}`)) {
        void notify("mission_needs_approval", title.trim());
      }
      setTitle(""); setObjective("");
      onOpenChange(false);
    } catch {
      toast.error("Falha ao enviar missão");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="glass border-primary/30 max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            <Rocket className="size-5 text-primary" /> Nova missão operacional
          </DialogTitle>
          <DialogDescription>
            A missão será enfileirada em <span className="font-mono text-primary">ai_execution_queue</span> e processada pelo núcleo IA.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 pt-2">
          <div>
            <label className="text-xs uppercase tracking-wider text-muted-foreground">Título</label>
            <input
              autoFocus
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Ex.: Corrigir dashboard mobile"
              className="mt-1 w-full rounded-lg bg-secondary/60 border border-border/60 px-3 py-3 text-sm focus:border-primary outline-none"
            />
          </div>
          <div>
            <label className="text-xs uppercase tracking-wider text-muted-foreground">Objetivo</label>
            <textarea
              value={objective}
              onChange={(e) => setObjective(e.target.value)}
              rows={3}
              placeholder="Descreva o que a IA deve executar..."
              className="mt-1 w-full rounded-lg bg-secondary/60 border border-border/60 px-3 py-3 text-sm focus:border-primary outline-none resize-none"
            />
          </div>
          <div>
            <label className="text-xs uppercase tracking-wider text-muted-foreground">Projeto alvo</label>
            <select
              value={project}
              onChange={(e) => setProject(e.target.value)}
              className="mt-1 w-full rounded-lg bg-secondary/60 border border-border/60 px-3 py-3 text-sm focus:border-primary outline-none"
            >
              <option>AI FACTORY</option>
              {projects.map((p) => <option key={p.id}>{p.name}</option>)}
            </select>
          </div>
          <button
            onClick={submit}
            disabled={loading}
            className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-primary to-accent py-4 text-base font-bold text-primary-foreground glow-border disabled:opacity-60"
          >
            {loading ? <Loader2 className="size-5 animate-spin" /> : <Rocket className="size-5" />}
            Enviar ao núcleo IA
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
