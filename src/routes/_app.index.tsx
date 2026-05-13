import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { STATUS_CARDS, LIVE_LOGS } from "@/lib/mock-data";
import { ArrowUpRight, Activity, Cpu, Zap, Radio } from "lucide-react";

export const Route = createFileRoute("/_app/")({
  component: CommandCenter,
});

const toneClass: Record<string, string> = {
  primary: "from-primary/20 to-transparent text-primary",
  success: "from-success/20 to-transparent text-success",
  violet: "from-accent/25 to-transparent text-accent",
  warning: "from-warning/20 to-transparent text-warning",
};

const logColor: Record<string, string> = {
  ok: "text-success",
  warn: "text-warning",
  info: "text-primary",
};

function CommandCenter() {
  const [logs, setLogs] = useState(LIVE_LOGS);

  useEffect(() => {
    const id = setInterval(() => {
      setLogs((prev) => {
        const next = [
          {
            t: "agora",
            k: ["ok", "info", "warn"][Math.floor(Math.random() * 3)],
            m: [
              "Núcleo IA processou 248 eventos",
              "Forge sugeriu refator em módulo auth",
              "Doctor escaneou 12 projetos",
              "Connect renovou token GitHub",
              "PULZR registrou pico de tráfego",
            ][Math.floor(Math.random() * 5)],
          },
          ...prev.slice(0, 11).map((l, i) => ({ ...l, t: i === 0 ? "5s" : l.t })),
        ];
        return next;
      });
    }, 3500);
    return () => clearInterval(id);
  }, []);

  return (
    <div className="space-y-8">
      {/* Hero */}
      <section className="relative overflow-hidden rounded-2xl glass p-8 lg:p-10 scanline">
        <div className="absolute inset-0 grid-bg opacity-60" />
        <div className="relative">
          <div className="inline-flex items-center gap-2 rounded-full glass px-3 py-1 text-xs text-muted-foreground">
            <Radio className="size-3 text-primary" />
            AI FACTORY · Command Center
          </div>
          <h1 className="mt-4 text-4xl lg:text-5xl font-bold tracking-tight">
            <span className="text-gradient">Crie, conecte, corrija</span>
            <br />e comande projetos com IA.
          </h1>
          <p className="mt-3 max-w-2xl text-muted-foreground">
            Central inteligente da ImplantaRH ConsultoriaPRO para criar, monitorar, corrigir,
            conectar e comandar projetos digitais, automações e ecossistemas operacionais.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <button className="inline-flex items-center gap-2 rounded-md bg-gradient-primary px-4 py-2.5 text-sm font-medium text-primary-foreground glow-border">
              <Zap className="size-4" /> Iniciar nova missão
            </button>
            <button className="inline-flex items-center gap-2 rounded-md glass px-4 py-2.5 text-sm">
              <Cpu className="size-4" /> Ver núcleo IA
            </button>
          </div>
        </div>
      </section>

      {/* Status grid */}
      <section className="grid grid-cols-2 md:grid-cols-3 gap-4">
        {STATUS_CARDS.map((c) => (
          <div
            key={c.label}
            className={`relative overflow-hidden rounded-xl glass p-5 hover:translate-y-[-2px] transition-transform`}
          >
            <div className={`absolute inset-x-0 top-0 h-24 bg-gradient-to-b ${toneClass[c.tone]} opacity-30 pointer-events-none`} />
            <div className="relative">
              <div className="text-xs uppercase tracking-wider text-muted-foreground">{c.label}</div>
              <div className="mt-2 text-3xl font-semibold font-mono">{c.value}</div>
              <div className={`mt-1 text-xs ${toneClass[c.tone].split(" ").pop()}`}>{c.delta}</div>
            </div>
          </div>
        ))}
      </section>

      {/* Logs */}
      <section className="grid lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 rounded-xl glass overflow-hidden">
          <div className="flex items-center justify-between px-5 py-3 border-b border-border/60">
            <div className="flex items-center gap-2 text-sm">
              <Activity className="size-4 text-primary" />
              <span className="font-medium">Logs inteligentes · tempo real</span>
            </div>
            <span className="text-xs text-muted-foreground font-mono">stream://core</span>
          </div>
          <ul className="divide-y divide-border/40 font-mono text-sm">
            {logs.map((l, i) => (
              <li key={i} className="flex items-start gap-3 px-5 py-3">
                <span className="w-12 shrink-0 text-xs text-muted-foreground">{l.t}</span>
                <span className={`w-12 shrink-0 text-xs uppercase ${logColor[l.k]}`}>{l.k}</span>
                <span className="text-foreground/90">{l.m}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="rounded-xl glass p-5">
          <div className="text-sm font-medium">Núcleo IA</div>
          <div className="text-xs text-muted-foreground">Saúde dos subsistemas</div>
          <div className="mt-5 space-y-4">
            {[
              { name: "Inferência", v: 92 },
              { name: "Orquestração", v: 88 },
              { name: "Memória vetorial", v: 76 },
              { name: "Connectors", v: 81 },
              { name: "Observabilidade", v: 95 },
            ].map((s) => (
              <div key={s.name}>
                <div className="flex justify-between text-xs">
                  <span className="text-muted-foreground">{s.name}</span>
                  <span className="font-mono">{s.v}%</span>
                </div>
                <div className="mt-1 h-1.5 rounded-full bg-secondary overflow-hidden">
                  <div
                    className="h-full bg-gradient-primary"
                    style={{ width: `${s.v}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
          <button className="mt-6 w-full inline-flex items-center justify-center gap-1 rounded-md glass px-3 py-2 text-xs">
            Inspecionar núcleo <ArrowUpRight className="size-3" />
          </button>
        </div>
      </section>
    </div>
  );
}
