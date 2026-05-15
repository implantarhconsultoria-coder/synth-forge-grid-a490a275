import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { factoryData, useFactoryData } from "@/lib/factory-data";
import { SourceBadge, DataSourceFooter } from "@/components/SourceBadge";
import { Activity, Cpu, Zap, Radio, Plus, Bot, ShieldCheck, Wrench, ArrowUpRight } from "lucide-react";

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
  useFactoryData();
  const [tick, setTick] = useState(0);
  const stats = factoryData.getStats();
  const logs = factoryData.getLogs().slice(0, 8);

  const cards = [
    { label: "Projetos", value: stats.projectsConnected, delta: "conectados", tone: "text-primary" },
    { label: "Online", value: stats.projectsOnline, delta: "99.98% uptime", tone: "text-success" },
    { label: "Correções", value: stats.corrections, delta: "geradas", tone: "text-accent" },
    { label: "Alertas", value: stats.alertsActive, delta: `${stats.alertsCritical} críticos`, tone: "text-warning" },
  ];

  const actions = [
    { label: "Nova missão", sub: "Criar projeto", icon: Plus, tone: "bg-gradient-primary text-primary-foreground" },
    { label: "Doctor", sub: "Corrigir erro", icon: Wrench, tone: "glass" },
    { label: "Núcleo IA", sub: "Monitorar", icon: Bot, tone: "glass" },
    { label: "Segurança", sub: "Validar risco", icon: ShieldCheck, tone: "glass" },
  ];

  useEffect(() => {
    const id = setInterval(() => {
      const msgs = [
        "Núcleo IA processou eventos",
        "Forge preparou nova estrutura",
        "Doctor escaneou projetos",
        "Connect validou integração",
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
    <div className="mx-auto w-full max-w-6xl space-y-5 pb-24 sm:space-y-8" data-tick={tick}>
      <section className="relative overflow-hidden rounded-3xl glass p-5 sm:p-8 lg:p-10">
        <div className="absolute inset-0 grid-bg opacity-40" />
        <div className="relative space-y-5">
          <div className="flex items-center justify-between gap-3">
            <div className="inline-flex min-h-11 items-center gap-2 rounded-full glass px-3 text-xs text-muted-foreground">
              <Radio className="size-3 text-primary" />
              <span className="whitespace-nowrap">Núcleo IA online</span>
            </div>
            <button className="inline-flex min-h-11 items-center justify-center rounded-full bg-gradient-primary px-5 text-sm font-bold text-primary-foreground">
              IR
            </button>
          </div>

          <div>
            <p className="text-xs uppercase tracking-[0.28em] text-primary">AI FACTORY</p>
            <h1 className="mt-3 text-4xl font-black leading-[0.95] tracking-tight sm:text-6xl">
              Fábrica de sistemas no seu bolso.
            </h1>
            <p className="mt-4 max-w-2xl text-base leading-relaxed text-muted-foreground sm:text-lg">
              Crie, monitore, corrija e comande projetos digitais da ImplantaRH direto pelo celular.
            </p>
          </div>

          <div className="grid gap-3 sm:flex sm:flex-wrap">
            <button className="inline-flex min-h-14 w-full items-center justify-center gap-2 rounded-2xl bg-gradient-primary px-5 text-base font800 text-primary-foreground glow-border sm:w-auto">
              <Zap className="size-5" /> Iniciar nova missão
            </button>
            <button className="inline-flex min-h-14 w-full items-center justify-center gap-2 rounded-2xl glass px-5 text-base font700 sm:w-auto">
              <Cpu className="size-5" /> Ver núcleo IA
            </button>
          </div>
        </div>
      </section>

      <section className="grid grid-cols-2 gap-3 sm:grid-cols-4 sm:gap-4">
        {cards.map((c) => (
          <button key={c.label} className="glass min-h-32 rounded-3xl p-4 text-left transition active:scale-[0.98] sm:p-5">
            <div className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground">{c.label}</div>
            <div className="mt-3 font-mono text-4xl font-bold">{c.value}</div>
            <div className={`mt-1 text-sm ${c.tone}`}>{c.delta}</div>
          </button>
        ))}
      </section>

      <section className="grid gap-3 sm:grid-cols-4 sm:gap-4">
        {actions.map((a) => {
          const Icon = a.icon;
          return (
            <button key={a.label} className={`${a.tone} min-h-24 rounded-3xl p-4 text-left transition active:scale-[0.98]`}>
              <Icon className="size-6" />
              <div className="mt-3 text-base font-bold">{a.label}</div>
              <div className="text-sm text-muted-foreground">{a.sub}</div>
            </button>
          );
        })}
      </section>

      <section className="grid gap-4 lg:grid-cols-3">
        <div className="rounded-3xl glass overflow-hidden lg:col-span-2">
          <div className="flex items-center justify-between gap-3 border-b border-border/60 px-4 py-4">
            <div className="flex items-center gap-2 text-sm font700">
              <Activity className="size-4 text-primary" /> Logs inteligentes
            </div>
            <span className="text-xs text-muted-foreground font-mono">tempo real</span>
          </div>
          <ul className="max-h-[360px] divide-y divide-border/40 overflow-auto font-mono text-sm">
            {logs.map((l) => (
              <li key={l.id} className="grid grid-cols-[64px_42px_1fr] gap-2 px-4 py-3">
                <span className="text-xs text-muted-foreground">
                  {new Date(l.createdAt).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}
                </span>
                <span className={`text-xs uppercase ${logColor[l.level]}`}>{l.level}</span>
                <span className="break-words text-foreground/90">{l.message}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="rounded-3xl glass p-5">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-base font-bold">Núcleo IA</div>
              <div className="text-sm text-muted-foreground">Saúde dos subsistemas</div>
            </div>
            <SourceBadge source={factoryData.source} />
          </div>
          <div className="mt-5 space-y-4">
            {[
              { name: "Inferência", v: 92 },
              { name: "Orquestração", v: 88 },
              { name: "Memória", v: 76 },
              { name: "Connectors", v: 81 },
            ].map((s) => (
              <div key={s.name}>
                <div className="flex justify-between text-xs">
                  <span className="text-muted-foreground">{s.name}</span>
                  <span className="font-mono">{s.v}%</span>
                </div>
                <div className="mt-1 h-2 rounded-full bg-secondary overflow-hidden">
                  <div className="h-full bg-gradient-primary" style={{ width: `${s.v}%` }} />
                </div>
              </div>
            ))}
          </div>
          <button className="mt-6 inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-2xl glass px-3 text-sm font-bold">
            Inspecionar núcleo <ArrowUpRight className="size-4" />
          </button>
        </div>
      </section>

      <DataSourceFooter />
    </div>
  );
}