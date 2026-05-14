import { Link, Outlet, useRouterState } from "@tanstack/react-router";
import {
  LayoutDashboard,
  FolderKanban,
  Hammer,
  Stethoscope,
  Cable,
  Mic,
  Lock,
  Settings,
  Activity,
  Sparkles,
  Brain,
} from "lucide-react";
import { useEffect, useState } from "react";
import { factoryData, useFactoryData } from "@/lib/factory-data";

const NAV = [
  { to: "/", label: "Command Center", icon: LayoutDashboard },
  { to: "/projects", label: "Projetos", icon: FolderKanban },
  { to: "/forge", label: "Forge", icon: Hammer },
  { to: "/doctor", label: "Doctor", icon: Stethoscope },
  { to: "/connect", label: "Connect", icon: Cable },
  { to: "/voice", label: "Voice Command", icon: Mic },
  { to: "/admin", label: "Núcleo Factory", icon: Brain },
  { to: "/private", label: "Private Mode", icon: Lock },
  { to: "/settings", label: "Configurações", icon: Settings },
] as const;

export function AppShell() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const [mobileOpen, setMobileOpen] = useState(false);
  useFactoryData();
  useEffect(() => {
    void factoryData.hydrate();
  }, []);

  return (
    <div className="min-h-screen flex w-full">
      {/* Sidebar */}
      <aside
        className={`fixed lg:sticky top-0 h-screen z-40 w-64 shrink-0 transition-transform lg:translate-x-0 ${
          mobileOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="h-full glass border-r border-border/60 flex flex-col">
          <div className="px-5 py-5 border-b border-border/60">
            <Link to="/" className="flex items-center gap-3">
              <div className="relative size-9 rounded-lg bg-gradient-primary grid place-items-center glow-border">
                <Sparkles className="size-5 text-primary-foreground" />
              </div>
              <div>
                <div className="font-semibold tracking-tight leading-none">AI FACTORY</div>
                <div className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground mt-1">
                  ImplantaRH PRO
                </div>
              </div>
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
          className="fixed inset-0 z-30 bg-background/70 lg:hidden"
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
            <LayoutDashboard className="size-4" />
          </button>
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <span className="size-1.5 rounded-full bg-success pulse-dot text-success" />
            <span>Núcleo IA online</span>
            <span className="hidden sm:inline">· região: br-sp · v2.4.1</span>
          </div>
          <div className="ml-auto flex items-center gap-2">
            <div className="hidden md:flex items-center gap-2 rounded-md glass px-3 py-1.5 text-xs text-muted-foreground">
              <kbd className="font-mono">⌘</kbd>
              <kbd className="font-mono">K</kbd>
              <span>Buscar / executar</span>
            </div>
            <div className="size-8 rounded-full bg-gradient-primary grid place-items-center text-xs font-semibold text-primary-foreground">
              IR
            </div>
          </div>
        </header>

        <main className="flex-1 px-4 lg:px-8 py-6 lg:py-10 max-w-[1400px] w-full mx-auto">
          <Outlet />
        </main>

        <footer className="px-4 lg:px-8 py-6 text-xs text-muted-foreground border-t border-border/60">
          AI FACTORY · Inteligência operacional by{" "}
          <span className="text-foreground">ImplantaRH ConsultoriaPRO Ltda.</span>
        </footer>
      </div>
    </div>
  );
}
