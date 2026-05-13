import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Mic, Waves } from "lucide-react";

export const Route = createFileRoute("/_app/voice")({
  component: VoicePage,
});

const EXAMPLES = [
  "Crie um sistema de RH.",
  "Corrija o projeto TOPAC.",
  "Gere um prompt para o módulo financeiro.",
  "Crie um dashboard operacional.",
];

function VoicePage() {
  const [active, setActive] = useState(false);

  return (
    <div className="space-y-8">
      <header>
        <h1 className="text-3xl font-bold tracking-tight">Voice Command</h1>
        <p className="text-muted-foreground mt-1">Comande a fábrica por voz.</p>
      </header>

      <section className="relative overflow-hidden rounded-2xl glass p-10 text-center scanline">
        <div className="absolute inset-0 grid-bg opacity-50 pointer-events-none" />
        <div className="relative flex flex-col items-center gap-6">
          <button
            onClick={() => setActive((v) => !v)}
            className={`relative size-32 rounded-full grid place-items-center transition-all ${
              active ? "bg-gradient-primary glow-border scale-105" : "glass"
            }`}
          >
            <Mic className={`size-12 ${active ? "text-primary-foreground" : "text-primary"}`} />
            {active && (
              <span className="absolute inset-0 rounded-full border-2 border-primary animate-ping" />
            )}
          </button>
          <div>
            <div className="text-lg font-semibold">
              {active ? "Ouvindo..." : "🎙️ Ativar comando por voz"}
            </div>
            <div className="text-xs text-muted-foreground mt-1">
              {active ? "Diga uma instrução para o núcleo IA" : "Toque no microfone para iniciar"}
            </div>
          </div>

          {active && (
            <div className="flex items-end gap-1 h-12">
              {Array.from({ length: 24 }).map((_, i) => (
                <span
                  key={i}
                  className="w-1 rounded-full bg-gradient-primary"
                  style={{
                    height: `${20 + Math.abs(Math.sin((Date.now() / 200 + i) * 0.4)) * 30}px`,
                    animation: `pulse 1.${i % 6}s ease-in-out infinite`,
                  }}
                />
              ))}
            </div>
          )}
        </div>
      </section>

      <section>
        <div className="text-sm text-muted-foreground flex items-center gap-2 mb-3">
          <Waves className="size-4 text-primary" /> Exemplos de comandos
        </div>
        <div className="grid md:grid-cols-2 gap-3">
          {EXAMPLES.map((e) => (
            <div key={e} className="rounded-lg glass p-4 text-sm font-mono">
              <span className="text-primary">›</span> {e}
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
