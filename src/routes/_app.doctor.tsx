import { createFileRoute } from "@tanstack/react-router";
import { DOCTOR_LOGS } from "@/lib/mock-data";
import { Stethoscope, ShieldAlert, Wrench, Activity, BadgeCheck } from "lucide-react";

export const Route = createFileRoute("/_app/doctor")({
  component: DoctorPage,
});

const levelStyle: Record<string, string> = {
  critical: "text-destructive border-destructive/40 bg-destructive/10",
  warn: "text-warning border-warning/40 bg-warning/10",
  info: "text-primary border-primary/40 bg-primary/10",
};

function DoctorPage() {
  return (
    <div className="space-y-8">
      <header>
        <div className="inline-flex items-center gap-2 rounded-full glass px-3 py-1 text-xs">
          <Stethoscope className="size-3 text-primary" /> AI FACTORY DOCTOR
        </div>
        <h1 className="mt-3 text-3xl font-bold tracking-tight">Diagnóstico contínuo</h1>
        <p className="text-muted-foreground mt-1">
          Detecta, sugere e aplica correções nos projetos do ecossistema.
        </p>
      </header>

      <section className="grid md:grid-cols-4 gap-4">
        {[
          { i: ShieldAlert, l: "Alertas críticos", v: "2", c: "text-destructive" },
          { i: Wrench, l: "Correções sugeridas", v: "9", c: "text-primary" },
          { i: Activity, l: "Estabilidade média", v: "97%", c: "text-success" },
          { i: BadgeCheck, l: "Patches aplicados", v: "142", c: "text-accent" },
        ].map((s) => {
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
        <div className="px-5 py-3 border-b border-border/60 text-sm font-medium">Logs de erro</div>
        <ul className="divide-y divide-border/40">
          {DOCTOR_LOGS.map((l, i) => (
            <li key={i} className="flex items-center gap-4 px-5 py-3 text-sm">
              <span className={`text-[10px] uppercase tracking-wider rounded-md border px-2 py-0.5 ${levelStyle[l.level]}`}>
                {l.level}
              </span>
              <span className="font-mono text-xs text-muted-foreground w-24">{l.project}</span>
              <span className="flex-1">{l.message}</span>
              <button className="text-xs text-primary hover:underline">Corrigir</button>
            </li>
          ))}
        </ul>
      </section>

      <section className="grid md:grid-cols-4 gap-3">
        {["Gerar patch", "Corrigir erro", "Monitorar projeto", "Analisar estabilidade"].map((b) => (
          <button key={b} className="rounded-lg glass py-3 text-sm hover:text-primary">{b}</button>
        ))}
      </section>

      <div className="rounded-xl border border-warning/40 bg-warning/10 p-4 text-sm text-warning">
        Erros simples podem ser corrigidos automaticamente. Ações sensíveis exigem aprovação.
      </div>
    </div>
  );
}
