import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { factoryData } from "@/lib/factory-data";
import { SourceBadge, DataSourceFooter } from "@/components/SourceBadge";
import { Stethoscope, ShieldAlert, Wrench, Activity, BadgeCheck } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/_app/doctor")({
  component: DoctorPage,
});

const sevStyle: Record<string, string> = {
  critical: "text-destructive border-destructive/40 bg-destructive/10",
  high: "text-destructive border-destructive/40 bg-destructive/10",
  medium: "text-warning border-warning/40 bg-warning/10",
  low: "text-primary border-primary/40 bg-primary/10",
};

function DoctorPage() {
  const [, force] = useState(0);
  const alerts = factoryData.getAlerts();
  const corrections = factoryData.getCorrections();
  const stats = factoryData.getStats();
  const projects = factoryData.getProjects();

  const summary = [
    { i: ShieldAlert, l: "Alertas críticos", v: stats.alertsCritical, c: "text-destructive" },
    { i: Wrench, l: "Correções sugeridas", v: corrections.filter((c) => c.status === "suggested").length, c: "text-primary" },
    { i: Activity, l: "Estabilidade média", v: "97%", c: "text-success" },
    { i: BadgeCheck, l: "Patches aplicados", v: corrections.filter((c) => c.status === "applied").length, c: "text-accent" },
  ];

  const handleFix = (projectId: string, title: string) => {
    factoryData.addCorrection({ projectId, title: `Patch: ${title}`, riskLevel: "low" });
    toast.success("Correção registrada no histórico local.");
    force((n) => n + 1);
  };

  return (
    <div className="space-y-8">
      <header className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <div className="inline-flex items-center gap-2 rounded-full glass px-3 py-1 text-xs">
            <Stethoscope className="size-3 text-primary" /> AI FACTORY DOCTOR
          </div>
          <h1 className="mt-3 text-3xl font-bold tracking-tight">Diagnóstico contínuo</h1>
          <p className="text-muted-foreground mt-1">
            Detecta, sugere e aplica correções nos projetos do ecossistema.
          </p>
        </div>
        <SourceBadge source={factoryData.source} />
      </header>

      <section className="grid md:grid-cols-4 gap-4">
        {summary.map((s) => {
          const Icon = s.i;
          return (
            <div key={s.l} className="rounded-xl glass p-5">
              <Icon className={`size-5 ${s.c}`} />
              <div className="mt-3 text-2xl font-semibold font-mono">{s.v}</div>
              <div className="text-xs text-muted-foreground">{s.l}</div>
            </div>
          );
        })}
      </section>

      <section className="rounded-xl glass overflow-hidden">
        <div className="px-5 py-3 border-b border-border/60 text-sm font-medium flex items-center justify-between">
          <span>Alertas detectados</span>
          <SourceBadge source={factoryData.source} />
        </div>
        <ul className="divide-y divide-border/40">
          {alerts.map((a) => {
            const proj = projects.find((p) => p.id === a.projectId);
            return (
              <li key={a.id} className="flex items-center gap-4 px-5 py-3 text-sm">
                <span className={`text-[10px] uppercase tracking-wider rounded-md border px-2 py-0.5 ${sevStyle[a.severity]}`}>
                  {a.severity}
                </span>
                <span className="font-mono text-xs text-muted-foreground w-24">{proj?.name ?? a.projectId}</span>
                <span className="flex-1">
                  <span className="font-medium">{a.title}</span>{" "}
                  <span className="text-muted-foreground">· {a.description}</span>
                </span>
                <button
                  onClick={() => handleFix(a.projectId, a.title)}
                  className="text-xs text-primary hover:underline"
                >
                  Corrigir
                </button>
              </li>
            );
          })}
        </ul>
      </section>

      <section className="rounded-xl glass overflow-hidden">
        <div className="px-5 py-3 border-b border-border/60 text-sm font-medium">
          Histórico de correções (local)
        </div>
        <ul className="divide-y divide-border/40 max-h-72 overflow-auto">
          {corrections.length === 0 && (
            <li className="px-5 py-6 text-sm text-muted-foreground">Nenhuma correção registrada ainda.</li>
          )}
          {corrections.map((c) => (
            <li key={c.id} className="flex items-center gap-3 px-5 py-3 text-sm">
              <span className="text-[10px] uppercase rounded-md border border-border bg-secondary/40 px-2 py-0.5 text-muted-foreground">
                {c.status}
              </span>
              <span className="font-mono text-xs text-muted-foreground w-24">{c.projectId}</span>
              <span className="flex-1">{c.title}</span>
              <span className="text-xs text-muted-foreground">
                {new Date(c.createdAt).toLocaleTimeString("pt-BR")}
              </span>
            </li>
          ))}
        </ul>
      </section>

      <div className="rounded-xl border border-warning/40 bg-warning/10 p-4 text-sm text-warning">
        Erros simples podem ser corrigidos automaticamente. Ações sensíveis exigem aprovação.
      </div>

      <DataSourceFooter />
    </div>
  );
}
