import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { factoryData, useFactoryData } from "@/lib/factory-data";
import { SourceBadge, DataSourceFooter } from "@/components/SourceBadge";
import { MissionModal } from "@/components/MissionModal";
import { MissionCycle } from "@/components/MissionCycle";
import {
  Activity, Radio, Rocket, ListChecks, Settings as SettingsIcon, ArrowUpRight,
} from "lucide-react";
import aiFactoryIcon from "@/assets/ai-factory-icon.png";

export const Route = createFileRoute("/_app/")({
  component: CommandCenter,
});

const logColor: Record<string, string> = {
  ok: "text-success",
  warn: "text-warning",
  info: "text-primary",
  error: "text-destructive",
};

function useClock() {
  const [t, setT] = useState(() => new Date());
  useEffect(() => {
    const id = setInterval(() => setT(new Date()), 1000);
    return () => clearInterval(id);
  }, []);
  return t;
}

function CommandCenter() {
  useFactoryData();
  const [missionOpen, setMissionOpen] = useState(false);
  const clock = useClock();
  const logs = factoryData.getLogs().slice(0, 8);

  useEffect(() => {
    const id = setInterval(() => {
      const msgs = [
        "Núcleo IA processou eventos",
        "Worker sincronizou fila",
        "Missão concluída",
        "Heartbeat OK",
      ];
      const levels = ["ok", "info", "warn"] as const;
      factoryData.addLog({
        type: "system",
        level: levels[Math.floor(Math.random() * 3)],
        message: msgs[Math.floor(Math.random() * msgs.length)],
      });
    }, 6000);
    return () => clearInterval(id);
  }, []);

  const quickActions: Array<{
    label: string; sub: string; icon: any; to?: string; onClick?: () => void; primary?: boolean;
  }> = [
    { label: "Iniciar missão", sub: "Enviar ao núcleo IA", icon: Rocket, onClick: () => setMissionOpen(true), primary: true },
    { label: "Ver fila", sub: "Missões enfileiradas", icon: ListChecks, to: "/queue" },
    { label: "Logs", sub: "Eventos ao vivo", icon: Activity, to: "/logs" },
    { label: "Configurações", sub: "Worker · Notificações", icon: SettingsIcon, to: "/settings" },
  ];

  return (
    <div className="mx-auto w-full max-w-6xl space-y-5 pb-28 sm:space-y-8 lg:pb-10">
      <MissionModal open={missionOpen} onOpenChange={setMissionOpen} />

      {/* HERO */}
      <section className="relative overflow-hidden rounded-3xl border border-primary/20 bg-gradient-to-br from-[#0a1428] via-[#0b1a2e] to-[#11102a] p-6 sm:p-10 lg:p-12">
        <div className="absolute -top-20 -right-20 size-64 rounded-full bg-primary/20 blur-3xl" />
        <div className="absolute -bottom-24 -left-10 size-72 rounded-full bg-accent/20 blur-3xl" />
        <div className="absolute inset-0 grid-bg opacity-30" />

        <div className="relative flex flex-col items-center text-center space-y-6">
          <div className="inline-flex items-center gap-2 rounded-full border border-success/30 bg-success/10 px-4 py-1.5 text-[11px] font-semibold uppercase tracking-[0.18em] text-success">
            <Radio className="size-3 animate-pulse" /> Núcleo IA online
          </div>

          <div className="relative">
            <div className="absolute inset-0 blur-3xl bg-gradient-to-br from-primary/30 to-accent/30 rounded-full" />
            <img
              src={aiFactoryLogo}
              alt="AI Factory · Inteligência Operacional · ImplantaRH"
              width={1024}
              height={1024}
              className="relative w-56 sm:w-72 lg:w-80 aspect-square object-contain rounded-3xl drop-shadow-[0_0_60px_rgba(139,92,246,0.45)]"
            />
          </div>

          <p className="max-w-2xl text-sm leading-relaxed text-muted-foreground sm:text-base">
            Centro de comando inteligente da ImplantaRH para criar, monitorar, corrigir e automatizar projetos digitais em tempo real.
          </p>

          <div className="grid gap-3 sm:flex sm:flex-wrap sm:justify-center pt-2">
            <button
              onClick={() => setMissionOpen(true)}
              className="inline-flex min-h-14 w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-primary to-accent px-8 text-base font-bold text-primary-foreground glow-border shadow-[0_10px_40px_rgba(139,92,246,0.4)] active:scale-[0.98] sm:w-auto"
            >
              <Rocket className="size-5" /> Iniciar missão
            </button>
            <Link
              to="/queue"
              className="inline-flex min-h-14 w-full items-center justify-center gap-2 rounded-2xl glass border border-primary/30 px-8 text-base font-bold sm:w-auto"
            >
              <ListChecks className="size-5 text-primary" /> Ver fila
            </Link>
          </div>
        </div>
      </section>

      {/* MISSION CYCLE */}
      <MissionCycle />

      {/* QUICK ACTIONS */}
      <section className="grid grid-cols-2 gap-3 sm:grid-cols-4 sm:gap-4">
        {quickActions.map((a) => {
          const Icon = a.icon;
          const cls = a.primary
            ? "bg-gradient-to-br from-primary/90 to-accent text-primary-foreground glow-border shadow-[0_8px_30px_rgba(139,92,246,0.35)]"
            : "glass border border-border/40 hover:border-primary/40";
          const inner = (
            <>
              <div className="flex items-center justify-between">
                <Icon className="size-6" />
                <ArrowUpRight className="size-4 opacity-70" />
              </div>
              <div className="mt-3 text-sm sm:text-base font-bold">{a.label}</div>
              <div className={`text-[11px] sm:text-xs ${a.primary ? "text-primary-foreground/80" : "text-muted-foreground"}`}>{a.sub}</div>
            </>
          );
          const className = `${cls} min-h-28 rounded-2xl p-4 text-left transition active:scale-[0.98] block`;
          return a.to ? (
            <Link key={a.label} to={a.to} className={className}>{inner}</Link>
          ) : (
            <button key={a.label} onClick={a.onClick} className={className}>{inner}</button>
          );
        })}
      </section>

      {/* LOGS + NÚCLEO */}
      <section className="grid gap-4 lg:grid-cols-3">
        <div className="rounded-2xl glass overflow-hidden lg:col-span-2 border border-border/40">
          <div className="flex items-center justify-between gap-3 border-b border-border/60 px-4 py-3">
            <div className="flex items-center gap-2 text-sm font-semibold">
              <Activity className="size-4 text-primary" /> Logs inteligentes
            </div>
            <span className="text-[10px] font-mono uppercase tracking-wider text-success flex items-center gap-1.5">
              <span className="size-1.5 rounded-full bg-success animate-pulse" /> tempo real
            </span>
          </div>
          <ul className="max-h-[360px] divide-y divide-border/40 overflow-auto font-mono text-xs sm:text-sm">
            {logs.map((l) => (
              <li key={l.id} className="grid grid-cols-[60px_42px_1fr] gap-2 px-3 py-2.5 sm:px-4 sm:py-3">
                <span className="text-[10px] sm:text-xs text-muted-foreground">
                  {new Date(l.createdAt).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}
                </span>
                <span className={`text-[10px] sm:text-xs uppercase ${logColor[l.level]}`}>{l.level}</span>
                <span className="break-words text-foreground/90">{l.message}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="rounded-2xl glass p-5 border border-border/40">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-base font-bold">Núcleo IA</div>
              <div className="text-xs text-muted-foreground">Saúde dos subsistemas</div>
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
                  <div className="h-full bg-gradient-to-r from-primary to-accent" style={{ width: `${s.v}%` }} />
                </div>
              </div>
            ))}
          </div>
          <Link
            to="/logs"
            className="mt-6 inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-xl glass border border-primary/30 px-3 text-sm font-bold"
          >
            Ver logs <ArrowUpRight className="size-4" />
          </Link>
        </div>
      </section>

      <DataSourceFooter />
    </div>
  );
}
