import { Link, Outlet, useRouterState } from "@tanstack/react-router";
import {
  Rocket,
  ListChecks,
  Settings,
  Activity,
  RefreshCw,
  Menu,
} from "lucide-react";
import { useEffect, useState } from "react";
import { factoryData, useFactoryData } from "@/lib/factory-data";
import { MobileBottomNav } from "@/components/layout/MobileBottomNav";
import { FactoryFab } from "@/components/FactoryFab";
import aiFactoryLogo from "@/assets/ai-factory-logo.png";

const NAV = [
  { to: "/", label: "Missão", icon: Rocket },
  { to: "/queue", label: "Fila", icon: ListChecks },
  { to: "/logs", label: "Logs", icon: Activity },
  { to: "/settings", label: "Configurações", icon: Settings },
] as const;

export function AppShell() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const [mobileOpen, setMobileOpen] = useState(false);
  const [now, setNow] = useState(() => new Date());
  useFactoryData();
  useEffect(() => {
    void factoryData.hydrate();
    const stop = factoryData.startRealtime();
    const t = setInterval(() => setNow(new Date()), 1000);
    return () => { stop?.(); clearInterval(t); };
  }, []);

  return (
    <div className="min-h-screen flex w-full">
      {/* Sidebar */}
      <aside
        className={`fixed lg:sticky top-0 h-screen z-40 w-64 shrink-0 transition-transform lg:translate-x-0 ${
          mobileOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="h-full flex flex-col bg-[#050b18] border-r border-primary/20 shadow-[12px_0_60px_rgba(0,0,0,0.6)]">
          <div className="px-4 py-5 border-b border-border/60">
            <Link to="/" className="block">
              <img
                src={aiFactoryLogo}
                alt="AI Factory · ImplantaRH"
                width={1024}
                height={1024}
                className="w-full h-auto rounded-2xl"
              />
            </Link>
          </div>

          <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
            {NAV.map((item) => {
              const Icon = item.icon;
              const active = pathname === item.to;
              return (
                <Link
                  key={item.to}
                  to={item.to}
                  onClick={() => setMobileOpen(false)}
                  className={`group flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-all ${
                    active
                      ? "bg-secondary/80 text-foreground glow-border"
                      : "text-muted-foreground hover:text-foreground hover:bg-secondary/40"
                  }`}
                >
                  <Icon className={`size-4 ${active ? "text-primary" : ""}`} />
                  <span className="font-medium">{item.label}</span>
                  {active && <span className="ml-auto size-1.5 rounded-full bg-primary pulse-dot text-primary" />}
                </Link>
              );
            })}
          </nav>

          <div className="p-3 border-t border-border/60">
            <div className="glass rounded-lg p-3 text-xs">
              <div className="flex items-center gap-2 text-success">
                <Activity className="size-3.5" />
                <span className="font-medium">Sistema operacional</span>
              </div>
              <div className="mt-1 text-muted-foreground">Latência 12ms · Uptime 99.98%</div>
            </div>
          </div>
        </div>
      </aside>

      {mobileOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/70 backdrop-blur-sm lg:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Main */}
      <div className="flex-1 min-w-0 flex flex-col">
        <header className="sticky top-0 z-20 h-14 border-b border-border/60 glass flex items-center px-4 lg:px-8 gap-4">
          <button
            onClick={() => setMobileOpen((v) => !v)}
            className="lg:hidden rounded-md p-2 hover:bg-secondary/50"
            aria-label="Menu"
          >
            <Menu className="size-4" />
          </button>
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <span className="size-1.5 rounded-full bg-success pulse-dot text-success" />
            <span>Núcleo IA online</span>
            <span className="hidden sm:inline">· região: br-sp · v2.4.1</span>
          </div>
          <div className="ml-auto flex items-center gap-3">
            <div className="hidden md:flex items-center gap-2 rounded-md glass px-3 py-1.5 text-xs text-muted-foreground">
              <kbd className="font-mono">⌘</kbd>
              <kbd className="font-mono">K</kbd>
              <span>Buscar / executar</span>
            </div>
            <button
              onClick={() => factoryData.refresh()}
              className="flex items-center gap-1.5 rounded-md glass px-2.5 py-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
              title="Atualizar dados"
            >
              <RefreshCw className="size-3.5" />
              <span className="hidden sm:inline">Atualizar</span>
            </button>
            <div className="hidden sm:flex items-center gap-1.5 rounded-md glass px-2.5 py-1.5 text-xs font-mono text-foreground">
              <span className="size-1.5 rounded-full bg-primary animate-pulse" />
              {now.toLocaleTimeString("pt-BR")}
            </div>
            <div className="size-8 rounded-full bg-gradient-primary grid place-items-center text-xs font-semibold text-primary-foreground">
              IR
            </div>
          </div>
        </header>

        <main className="flex-1 px-4 lg:px-8 py-6 lg:py-10 max-w-[1400px] w-full mx-auto">
          <Outlet />
        </main>

        <footer className="px-4 lg:px-8 py-6 pb-24 lg:pb-6 text-xs text-muted-foreground border-t border-border/60">
          AI FACTORY · Inteligência operacional by{" "}
          <span className="text-foreground">ImplantaRH ConsultoriaPRO Ltda.</span>
        </footer>
      </div>
      <MobileBottomNav />
      <FactoryFab />
    </div>
  );
}
