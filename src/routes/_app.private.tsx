import { createFileRoute } from "@tanstack/react-router";
import { Lock, Shield, EyeOff, Folder } from "lucide-react";

export const Route = createFileRoute("/_app/private")({
  component: PrivatePage,
});

function PrivatePage() {
  return (
    <div className="space-y-8">
      <header className="flex items-start gap-4">
        <div className="size-12 rounded-lg bg-gradient-primary grid place-items-center glow-border">
          <Lock className="size-6 text-primary-foreground" />
        </div>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Private Mode</h1>
          <p className="text-muted-foreground mt-1 max-w-2xl">
            Controle projetos internos, pessoais e externos sem misturar com o ecossistema público.
          </p>
        </div>
      </header>

      <section className="grid md:grid-cols-3 gap-4">
        {[
          { i: Shield, t: "Isolamento total", d: "Dados criptografados em repouso e em trânsito." },
          { i: EyeOff, t: "Sem rastreamento", d: "Atividades fora do log público da fábrica." },
          { i: Folder, t: "Workspaces separados", d: "Cada projeto privado opera em sandbox próprio." },
        ].map((c) => {
          const Icon = c.i;
          return (
            <div key={c.t} className="rounded-xl glass p-5">
              <Icon className="size-5 text-accent" />
              <h3 className="mt-3 font-semibold">{c.t}</h3>
              <p className="mt-1 text-sm text-muted-foreground">{c.d}</p>
            </div>
          );
        })}
      </section>

      <section className="rounded-xl glass p-6">
        <h3 className="font-semibold">Workspaces privados</h3>
        <ul className="mt-4 divide-y divide-border/40">
          {[
            { n: "Vault Pessoal", d: "12 documentos · 3 fluxos" },
            { n: "Cliente · Projeto Aurora", d: "NDA ativo · acesso restrito" },
            { n: "Pesquisa interna RH 2026", d: "Equipe de 4 colaboradores" },
          ].map((w) => (
            <li key={w.n} className="flex items-center justify-between py-3">
              <div>
                <div className="font-medium">{w.n}</div>
                <div className="text-xs text-muted-foreground">{w.d}</div>
              </div>
              <button className="text-xs text-primary hover:underline">Abrir</button>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
