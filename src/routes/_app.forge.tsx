import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Hammer, Sparkles, Smartphone, LayoutDashboard, Workflow, MessageSquare, Boxes, ArrowRight } from "lucide-react";

export const Route = createFileRoute("/_app/forge")({
  component: ForgePage,
});

const QUICK = [
  { label: "Criar app", icon: Boxes },
  { label: "Criar dashboard", icon: LayoutDashboard },
  { label: "Criar automação", icon: Workflow },
  { label: "Criar módulo", icon: Hammer },
  { label: "Criar prompt", icon: MessageSquare },
  { label: "Criar interface mobile", icon: Smartphone },
];

function ForgePage() {
  const [prompt, setPrompt] = useState("");
  const [generated, setGenerated] = useState(false);

  return (
    <div className="space-y-8">
      <header>
        <div className="inline-flex items-center gap-2 rounded-full glass px-3 py-1 text-xs">
          <Hammer className="size-3 text-primary" /> AI FACTORY FORGE
        </div>
        <h1 className="mt-3 text-3xl font-bold tracking-tight">Console de execução da Factory</h1>
        <p className="text-muted-foreground mt-1">
          Descreva uma ação. O núcleo prepara um pacote de execução seguro antes de enviar para qualquer plataforma.
        </p>
      </header>

      <section className="rounded-2xl glass p-6 glow-border">
        <label className="text-xs uppercase tracking-wider text-muted-foreground">Comando</label>
        <textarea
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder="Descreva o sistema, correção ou melhoria que deseja preparar..."
          rows={4}
          className="mt-2 w-full bg-transparent resize-none outline-none text-lg placeholder:text-muted-foreground/60"
        />
        <div className="mt-4 flex flex-wrap items-center gap-2">
          {QUICK.map((q) => {
            const Icon = q.icon;
            return (
              <button
                key={q.label}
                onClick={() => setPrompt((p) => (p ? p + " · " : "") + q.label)}
                className="inline-flex items-center gap-2 rounded-full glass px-3 py-1.5 text-xs hover:text-primary"
              >
                <Icon className="size-3" /> {q.label}
              </button>
            );
          })}
          <button
            onClick={() => setGenerated(true)}
            className="ml-auto inline-flex items-center gap-2 rounded-md bg-gradient-primary px-4 py-2 text-sm font-medium text-primary-foreground"
          >
            <Sparkles className="size-4" /> Preparar pacote
          </button>
        </div>
      </section>

      {generated && (
        <section className="grid md:grid-cols-2 gap-4">
          {[
            { title: "Pacote Lovable", body: "Prompt curto, protegido e pronto para copiar quando houver crédito." },
            { title: "Pacote GitHub", body: "Resumo técnico para alteração em código com teste de build." },
            { title: "Pacote Supabase", body: "Checklist de banco e permissões com aprovação obrigatória." },
            { title: "Próximo passo", body: "Ligar esta tela ao worker para processar comandos em fila." },
          ].map((c) => (
            <div key={c.title} className="rounded-xl glass p-5">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold">{c.title}</h3>
                <ArrowRight className="size-4 text-primary" />
              </div>
              <p className="mt-2 text-sm text-muted-foreground">{c.body}</p>
            </div>
          ))}
        </section>
      )}
    </div>
  );
}