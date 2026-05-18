import { Link, useRouterState } from "@tanstack/react-router";
import { Rocket, ListChecks, Activity, Settings } from "lucide-react";

const ITEMS = [
  { to: "/", label: "Missão", icon: Rocket, primary: true },
  { to: "/queue", label: "Fila", icon: ListChecks },
  { to: "/logs", label: "Logs", icon: Activity },
  { to: "/settings", label: "Config", icon: Settings },
] as const;

export function MobileBottomNav() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  return (
    <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-30 px-2 pb-2 pt-2">
      <div className="rounded-2xl border border-border/60 backdrop-blur-xl bg-[#050b18]/95 grid grid-cols-4 gap-1 px-1 py-1.5 shadow-[0_-8px_30px_rgba(56,189,248,0.15)]">
        {ITEMS.map((it) => {
          const Icon = it.icon;
          const active = pathname === it.to;
          if ("primary" in it && it.primary) {
            return (
              <Link
                key={it.to}
                to={it.to}
                className="flex flex-col items-center justify-center -mt-5"
              >
                <span className="size-12 rounded-2xl bg-gradient-to-br from-primary to-accent grid place-items-center glow-border shadow-[0_8px_24px_rgba(139,92,246,0.45)]">
                  <Icon className="size-5 text-primary-foreground" />
                </span>
                <span className="mt-1 text-[10px] font-semibold tracking-wide text-foreground">{it.label}</span>
              </Link>
            );
          }
          return (
            <Link
              key={it.to}
              to={it.to}
              className={`flex flex-col items-center justify-center py-1.5 rounded-xl text-[10px] font-medium transition ${
                active ? "text-primary bg-primary/10" : "text-muted-foreground"
              }`}
            >
              <Icon className={`size-5 mb-0.5 ${active ? "text-primary" : ""}`} />
              {it.label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
