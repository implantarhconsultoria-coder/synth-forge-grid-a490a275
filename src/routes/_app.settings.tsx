import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/_app/settings")({
  component: SettingsPage,
});

function SettingsPage() {
  return (
    <div className="space-y-8 max-w-3xl">
      <header>
        <h1 className="text-3xl font-bold tracking-tight">Configurações</h1>
        <p className="text-muted-foreground mt-1">Preferências da AI Factory.</p>
      </header>

      {[
        { t: "Organização", f: [["Razão social", "ImplantaRH ConsultoriaPRO Ltda."], ["Domínio", "implantarh.pro"]] },
        { t: "Núcleo IA", f: [["Modelo padrão", "factory-core-v2"], ["Região", "br-sp"]] },
        { t: "Notificações", f: [["E-mail de alertas", "ops@implantarh.pro"], ["Webhook", "https://hooks.factory/ops"]] },
      ].map((s) => (
        <section key={s.t} className="rounded-xl glass p-6">
          <h3 className="font-semibold">{s.t}</h3>
          <div className="mt-4 grid sm:grid-cols-2 gap-4">
            {s.f.map(([label, val]) => (
              <div key={label}>
                <label className="text-xs text-muted-foreground uppercase tracking-wider">{label}</label>
                <input
                  defaultValue={val}
                  className="mt-1 w-full rounded-md bg-input/40 border border-border px-3 py-2 text-sm outline-none focus:border-primary"
                />
              </div>
            ))}
          </div>
        </section>
      ))}

      <button className="rounded-md bg-gradient-primary px-5 py-2.5 text-sm font-medium text-primary-foreground">
        Salvar alterações
      </button>
    </div>
  );
}
