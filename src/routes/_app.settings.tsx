import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import {
  useFactorySettings,
  updateSettings,
  updateNotificationType,
  ACCENT_PRESETS,
  type Theme,
  type AccentColor,
  type Density,
  type NotificationKind,
} from "@/lib/factory-settings";
import { testNotification, ensureNotificationPermission } from "@/lib/notifications";
import { Switch } from "@/components/ui/switch";

export const Route = createFileRoute("/_app/settings")({
  component: SettingsPage,
});

const THEMES: { value: Theme; label: string }[] = [
  { value: "dark", label: "Escuro" },
  { value: "light", label: "Claro" },
  { value: "system", label: "Sistema" },
];

const DENSITIES: { value: Density; label: string }[] = [
  { value: "compact", label: "Compacto" },
  { value: "normal", label: "Normal" },
  { value: "large", label: "Grande" },
];

const NOTIF_TYPES: { key: NotificationKind; label: string }[] = [
  { key: "mission_created", label: "Missão criada" },
  { key: "mission_started", label: "Missão iniciada" },
  { key: "mission_completed", label: "Missão concluída" },
  { key: "critical_error", label: "Erro crítico" },
  { key: "approval_needed", label: "Aprovação necessária" },
  { key: "worker_status", label: "Worker offline/online" },
];

function Section({ title, desc, children }: { title: string; desc?: string; children: React.ReactNode }) {
  return (
    <section className="rounded-2xl border border-border bg-card/60 p-5 sm:p-6 space-y-4">
      <div>
        <h3 className="font-semibold text-base">{title}</h3>
        {desc && <p className="text-xs text-muted-foreground mt-1">{desc}</p>}
      </div>
      {children}
    </section>
  );
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-3 py-1">
      <span className="text-sm">{label}</span>
      {children}
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <label className="text-[11px] uppercase tracking-wider text-muted-foreground">{label}</label>
      {children}
    </div>
  );
}

const inputCls =
  "w-full rounded-lg bg-background/60 border border-border px-3 py-2 text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary transition";

function SettingsPage() {
  const s = useFactorySettings();
  const [testingWorker, setTestingWorker] = useState(false);

  async function testWorker() {
    const base = s.workerUrl?.trim();
    if (!base) {
      toast.error("Informe a URL do Worker antes de testar.");
      return;
    }
    setTestingWorker(true);
    const url = base.replace(/\/+$/, "") + (base.match(/:\d+/) ? "" : `:${s.workerPort}`);
    const endpoints = ["/status", "/health", "/saude"];
    try {
      for (const ep of endpoints) {
        try {
          const r = await fetch(url + ep, { method: "GET" });
          if (r.ok) {
            toast.success(`Worker ONLINE (${ep})`);
            setTestingWorker(false);
            return;
          }
        } catch {}
      }
      toast.error("Worker não respondeu em /status, /health ou /saude");
    } finally {
      setTestingWorker(false);
    }
  }

  return (
    <div className="space-y-6 max-w-3xl pb-12">
      <header>
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Configurações</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Tudo é salvo localmente e aplicado em tempo real.
        </p>
      </header>

      {/* APARÊNCIA */}
      <Section title="Aparência" desc="Tema, cor principal e densidade.">
        <Field label="Tema">
          <div className="grid grid-cols-3 gap-2">
            {THEMES.map((t) => (
              <button
                key={t.value}
                onClick={() => updateSettings({ theme: t.value })}
                className={`rounded-lg border px-3 py-2 text-sm transition ${
                  s.theme === t.value
                    ? "border-primary bg-primary/10 text-foreground"
                    : "border-border bg-background/40 text-muted-foreground hover:text-foreground"
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>
        </Field>

        <Field label="Cor principal">
          <div className="grid grid-cols-4 gap-2">
            {(Object.keys(ACCENT_PRESETS) as AccentColor[]).map((c) => {
              const p = ACCENT_PRESETS[c];
              const active = s.accent === c;
              return (
                <button
                  key={c}
                  onClick={() => updateSettings({ accent: c })}
                  className={`rounded-lg border px-2 py-2 text-xs flex flex-col items-center gap-1.5 transition ${
                    active ? "border-primary bg-primary/10" : "border-border hover:border-primary/50"
                  }`}
                >
                  <span
                    className="block h-6 w-6 rounded-full ring-2 ring-background"
                    style={{ background: p.swatch, boxShadow: `0 0 12px ${p.swatch}66` }}
                  />
                  {p.label}
                </button>
              );
            })}
          </div>
        </Field>

        <Field label="Densidade">
          <div className="grid grid-cols-3 gap-2">
            {DENSITIES.map((d) => (
              <button
                key={d.value}
                onClick={() => updateSettings({ density: d.value })}
                className={`rounded-lg border px-3 py-2 text-sm transition ${
                  s.density === d.value
                    ? "border-primary bg-primary/10"
                    : "border-border bg-background/40 text-muted-foreground hover:text-foreground"
                }`}
              >
                {d.label}
              </button>
            ))}
          </div>
        </Field>
      </Section>

      {/* NOTIFICAÇÕES */}
      <Section title="Notificações" desc="Controle alertas, som e vibração.">
        <Row label="Ativar notificações">
          <Switch
            checked={s.notificationsEnabled}
            onCheckedChange={async (v) => {
              if (v) await ensureNotificationPermission();
              updateSettings({ notificationsEnabled: v });
            }}
          />
        </Row>

        <div className={`space-y-2 rounded-lg border border-border/60 p-3 ${s.notificationsEnabled ? "" : "opacity-50 pointer-events-none"}`}>
          <p className="text-[11px] uppercase tracking-wider text-muted-foreground">Tipos</p>
          {NOTIF_TYPES.map((n) => (
            <Row key={n.key} label={n.label}>
              <Switch
                checked={!!s.notificationTypes[n.key]}
                onCheckedChange={(v) => updateNotificationType(n.key, v)}
              />
            </Row>
          ))}
        </div>

        <Row label="Som">
          <Switch checked={s.soundEnabled} onCheckedChange={(v) => updateSettings({ soundEnabled: v })} />
        </Row>
        <Row label="Vibração">
          <Switch checked={s.vibrationEnabled} onCheckedChange={(v) => updateSettings({ vibrationEnabled: v })} />
        </Row>

        <button
          onClick={async () => {
            const ok = await testNotification();
            if (!ok) toast.error("Notificações bloqueadas ou desativadas.");
          }}
          className="w-full rounded-lg bg-gradient-to-r from-primary to-accent px-4 py-2.5 text-sm font-medium text-primary-foreground hover:opacity-90 transition"
        >
          Testar notificação
        </button>
      </Section>

      {/* FACTORY */}
      <Section title="Factory" desc="Worker, autopilot e modo seguro.">
        <Row label="Autopilot">
          <Switch checked={s.autopilot} onCheckedChange={(v) => updateSettings({ autopilot: v })} />
        </Row>
        <Row label="Modo seguro">
          <Switch checked={s.safeMode} onCheckedChange={(v) => updateSettings({ safeMode: v })} />
        </Row>

        <div className="grid sm:grid-cols-[1fr_120px] gap-3">
          <Field label="Worker URL">
            <input
              value={s.workerUrl}
              onChange={(e) => updateSettings({ workerUrl: e.target.value })}
              placeholder="https://worker.exemplo.com"
              className={inputCls}
            />
          </Field>
          <Field label="Porta">
            <input
              type="number"
              value={s.workerPort}
              onChange={(e) => updateSettings({ workerPort: Number(e.target.value) || 8787 })}
              className={inputCls}
            />
          </Field>
        </div>

        <button
          onClick={testWorker}
          disabled={testingWorker}
          className="w-full rounded-lg border border-primary/50 bg-primary/10 px-4 py-2.5 text-sm font-medium text-foreground hover:bg-primary/20 transition disabled:opacity-50"
        >
          {testingWorker ? "Testando..." : "Testar conexão"}
        </button>
      </Section>

      {/* PROJETOS */}
      <Section title="Projetos" desc="Padrões e canal de alerta.">
        <Field label="Projeto padrão">
          <input
            value={s.defaultProject}
            onChange={(e) => updateSettings({ defaultProject: e.target.value })}
            placeholder="AI FACTORY"
            className={inputCls}
          />
        </Field>
        <Field label="Repositório padrão">
          <input
            value={s.defaultRepo}
            onChange={(e) => updateSettings({ defaultRepo: e.target.value })}
            placeholder="org/repo"
            className={inputCls}
          />
        </Field>
        <Field label="WhatsApp de alerta">
          <input
            value={s.whatsappAlert}
            onChange={(e) => updateSettings({ whatsappAlert: e.target.value })}
            placeholder="11991860102"
            className={inputCls}
          />
        </Field>
      </Section>

      <p className="text-xs text-muted-foreground text-center">
        Alterações salvas automaticamente.
      </p>
    </div>
  );
}
