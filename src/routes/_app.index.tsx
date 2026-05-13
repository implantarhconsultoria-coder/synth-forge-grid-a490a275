import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { factoryData } from "@/lib/factory-data";
import { SourceBadge, DataSourceFooter } from "@/components/SourceBadge";
import { ArrowUpRight, Activity, Cpu, Zap, Radio } from "lucide-react";

export const Route = createFileRoute("/_app/")({
  component: CommandCenter,
});

const logColor: Record<string, string> = {
  ok: "text-success",
  warn: "text-warning",
  info: "text-primary",
  error: "text-destructive",
};

function CommandCenter() {
  const [tick, setTick] = useState(0);
  const stats = factoryData.getStats();
  const logs = factoryData.getLogs().slice(0, 12);

  const cards = [
    { label: "Projetos conectados", value: stats.projectsConnected, delta: "ecossistema", tone: "primary" },
    { label: "Projetos online", value: stats.projectsOnline, delta: "99.98% uptime", tone: "success" },
    { label: "Correções geradas", value: stats.corrections, delta: "histórico local", tone: "violet" },
    { label: "Alertas ativos", value: stats.alertsActive, delta: `${stats.alertsCritical} críticos`, tone: "warning" },
    { label: "APIs conectadas", value: stats.apisConnected, delta: `${stats.apisSyncing} sincronizando`, tone: "primary" },
    { label: "Sistemas monitorados", value: stats.monitored, delta: "tempo real", tone: "success" },
  ];

  const toneClass: Record<string, string> = {
    primary: "from-primary/20 to-transparent text-primary",
    success: "from-success/20 to-transparent text-success",
    violet: "from-accent/25 to-transparent text-accent",
    warning: "from-warning/20 to-transparent text-warning",
  };

  useEffect(() => {
    const id = setInterval(() => {
      const msgs = [
        "Núcleo IA processou 248 eventos",
        "Forge sugeriu refator em módulo auth",
        "Doctor escaneou 12 projetos",
        "Connect renovou token GitHub",
        "PULZR registrou pico de tráfego",
      ];
      const levels = ["ok", "info", "warn"] as const;
      factoryData.addLog({
        type: "system",
        level: levels[Math.floor(Math.random() * 3)],
        message: msgs[Math.floor(Math.random() * msgs.length)],
      });
      setTick((t) => t + 1);
    }, 4000);
    return () => clearInterval(id);
  }, []);

  return (
    <div className="space-y-8" data-tick={tick}>
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

      <section className="grid grid-cols-2 md:grid-cols-3 gap-4">
        {cards.map((c) => (
          <div key={c.label} className="relative overflow-hidden rounded-xl glass p-5 hover:translate-y-[-2px] transition-transform">
            <div className={`absolute inset-x-0 top-0 h-24 bg-gradient-to-b ${toneClass[c.tone]} opacity-30 pointer-events-none`} />
            <div className="relative">
              <div className="flex items-center justify-between">
                <div className="text-xs uppercase tracking-wider text-muted-foreground">{c.label}</div>
                <SourceBadge source="mock" />
              </div>
              <div className="mt-2 text-3xl font-semibold font-mono">{c.value}</div>
              <div className={`mt-1 text-xs ${toneClass[c.tone].split(" ").pop()}`}>{c.delta}</div>
            </div>
          </div>
        ))}
      </section>

      <section className="grid lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 rounded-xl glass overflow-hidden">
          <div className="flex items-center justify-between px-5 py-3 border-b border-border/60">
            <div className="flex items-center gap-2 text-sm">
              <Activity className="size-4 text-primary" />
              <span className="font-medium">Logs inteligentes · tempo real</span>
              <SourceBadge source="mock" className="ml-2" />
            </div>
            <span className="text-xs text-muted-foreground font-mono">stream://core</span>
          </div>
          <ul className="divide-y divide-border/40 font-mono text-sm max-h-[440px] overflow-auto">
            {logs.map((l) => (
              <li key={l.id} className="flex items-start gap-3 px-5 py-3">
                <span className="w-16 shrink-0 text-xs text-muted-foreground">
                  {new Date(l.createdAt).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit", second: "2-digit" })}
                </span>
                <span className={`w-12 shrink-0 text-xs uppercase ${logColor[l.level]}`}>{l.level}</span>
                <span className="text-foreground/90 break-words">{l.message}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="rounded-xl glass p-5">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm font-medium">Núcleo IA</div>
              <div className="text-xs text-muted-foreground">Saúde dos subsistemas</div>
            </div>
            <SourceBadge source="mock" />
          </div>
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
                  <div className="h-full bg-gradient-primary" style={{ width: `${s.v}%` }} />
                </div>
              </div>
            ))}
          </div>
          <button className="mt-6 w-full inline-flex items-center justify-center gap-1 rounded-md glass px-3 py-2 text-xs">
            Inspecionar núcleo <ArrowUpRight className="size-3" />
          </button>
        </div>
      </section>

      <DataSourceFooter />
    </div>
  );
}
