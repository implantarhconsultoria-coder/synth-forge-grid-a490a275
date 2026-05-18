import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import {
  factorySettings,
  useFactorySettings,
  DEFAULT_SETTINGS,
  type FactorySettings,
} from "@/lib/factory-settings";
import {
  notificationPermission,
  notificationsSupported,
  requestNotificationPermission,
  checkWorkerHealth,
  type WorkerStatus,
} from "@/lib/notifications";
import { Bell, BellOff, Server, Shield, Github, Database, Save, RefreshCw } from "lucide-react";

export const Route = createFileRoute("/_app/settings")({
  component: SettingsPage,
});

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground">{label}</span>
      <div className="mt-1.5">{children}</div>
    </label>
  );
}

function Toggle({
  checked,
  onChange,
  label,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  label: string;
}) {
  return (
    <button
      type="button"
      onClick={() => onChange(!checked)}
      className={`w-full flex items-center justify-between rounded-xl border px-4 py-3 transition ${
        checked ? "border-primary/50 bg-primary/10" : "border-border/60 bg-secondary/30"
      }`}
    >
      <span className="text-sm font-medium">{label}</span>
      <span
        className={`relative inline-flex h-6 w-11 rounded-full transition ${
          checked ? "bg-gradient-to-r from-primary to-accent" : "bg-secondary"
        }`}
      >
        <span
          className={`absolute top-0.5 size-5 rounded-full bg-white transition ${
            checked ? "left-[22px]" : "left-0.5"
          }`}
        />
      </span>
    </button>
  );
}

function SettingsPage() {
  const settings = useFactorySettings();
  const [draft, setDraft] = useState<FactorySettings>(settings);
  const [perm, setPerm] = useState<NotificationPermission>("default");
  const [worker, setWorker] = useState<WorkerStatus>("unknown");
  const [testing, setTesting] = useState(false);

  useEffect(() => setDraft(settings), [settings]);
  useEffect(() => setPerm(notificationPermission()), []);

  const update = <K extends keyof FactorySettings>(key: K, value: FactorySettings[K]) =>
    setDraft((d) => ({ ...d, [key]: value }));

  const save = () => {
    factorySettings.set(draft);
    toast.success("Configurações salvas");
  };

  const enableNotifications = async () => {
    if (!notificationsSupported()) {
      toast.error("Navegador não suporta notificações");
      return;
    }
    const result = await requestNotificationPermission();
    setPerm(result);
    if (result === "granted") {
      update("notifications", true);
      toast.success("Notificações ativadas");
    } else {
      toast.error("Permissão negada");
    }
  };

  const testWorker = async () => {
    setTesting(true);
    factorySettings.set(draft); // apply URL/port before probe
    const status = await checkWorkerHealth();
    setWorker(status);
    setTesting(false);
    if (status === "online") toast.success("Worker ONLINE");
    else toast.error("Worker offline ou inacessível");
  };

  return (
    <div className="space-y-6 max-w-3xl pb-24 lg:pb-8">
      <header>
        <h1 className="text-3xl font-bold tracking-tight">Configurações</h1>
        <p className="text-muted-foreground mt-1 text-sm">
          Configurações reais da AI Factory. Salvas no dispositivo.
        </p>
      </header>

      {/* Worker */}
      <section className="rounded-2xl glass border border-border/40 p-5 space-y-4">
        <div className="flex items-center gap-2">
          <Server className="size-4 text-primary" />
          <h3 className="font-semibold">Worker / API</h3>
          <span
            className={`ml-auto text-[10px] font-mono uppercase tracking-wider px-2 py-1 rounded-full ${
              worker === "online"
                ? "bg-success/15 text-success"
                : worker === "offline"
                ? "bg-destructive/15 text-destructive"
                : "bg-secondary text-muted-foreground"
            }`}
          >
            {worker}
          </span>
        </div>
        <div className="grid sm:grid-cols-[1fr_120px] gap-3">
          <Field label="URL do Worker">
            <input
              value={draft.workerUrl}
              onChange={(e) => update("workerUrl", e.target.value)}
              placeholder="http://localhost"
              className="w-full rounded-md bg-input/40 border border-border px-3 py-2 text-sm outline-none focus:border-primary"
            />
          </Field>
          <Field label="Porta">
            <input
              type="number"
              value={draft.workerPort}
              onChange={(e) => update("workerPort", Number(e.target.value) || 8787)}
              className="w-full rounded-md bg-input/40 border border-border px-3 py-2 text-sm outline-none focus:border-primary"
            />
          </Field>
        </div>
        <button
          onClick={testWorker}
          disabled={testing}
          className="inline-flex items-center gap-2 rounded-xl glass border border-primary/30 px-4 py-2 text-sm font-bold disabled:opacity-60"
        >
          <RefreshCw className={`size-4 ${testing ? "animate-spin" : ""}`} /> Testar conexão
        </button>
      </section>

      {/* Modes */}
      <section className="rounded-2xl glass border border-border/40 p-5 space-y-3">
        <div className="flex items-center gap-2">
          <Shield className="size-4 text-primary" />
          <h3 className="font-semibold">Modos de operação</h3>
        </div>
        <Toggle
          label="Autopilot"
          checked={draft.autopilot}
          onChange={(v) => update("autopilot", v)}
        />
        <Toggle
          label="Modo seguro"
          checked={draft.safeMode}
          onChange={(v) => update("safeMode", v)}
        />
      </section>

      {/* Integrations */}
      <section className="rounded-2xl glass border border-border/40 p-5 space-y-3">
        <div className="flex items-center gap-2">
          <Github className="size-4 text-primary" />
          <h3 className="font-semibold">Integrações</h3>
        </div>
        <Toggle
          label="GitHub conectado"
          checked={draft.githubConnected}
          onChange={(v) => update("githubConnected", v)}
        />
        <Toggle
          label="Supabase conectado"
          checked={draft.supabaseConnected}
          onChange={(v) => update("supabaseConnected", v)}
        />
      </section>

      {/* Notifications */}
      <section className="rounded-2xl glass border border-border/40 p-5 space-y-4">
        <div className="flex items-center gap-2">
          {draft.notifications ? (
            <Bell className="size-4 text-primary" />
          ) : (
            <BellOff className="size-4 text-muted-foreground" />
          )}
          <h3 className="font-semibold">Notificações</h3>
          <span className="ml-auto text-[10px] font-mono uppercase tracking-wider text-muted-foreground">
            {perm}
          </span>
        </div>
        <Toggle
          label="Notificações ligadas"
          checked={draft.notifications}
          onChange={(v) => update("notifications", v)}
        />
        {perm !== "granted" && (
          <button
            onClick={enableNotifications}
            className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-primary to-accent px-4 py-3 text-sm font-bold text-primary-foreground"
          >
            <Bell className="size-4" /> Ativar notificações
          </button>
        )}
      </section>

      {/* Defaults */}
      <section className="rounded-2xl glass border border-border/40 p-5 space-y-3">
        <div className="flex items-center gap-2">
          <Database className="size-4 text-primary" />
          <h3 className="font-semibold">Padrões</h3>
        </div>
        <Field label="Projeto padrão">
          <input
            value={draft.defaultProject}
            onChange={(e) => update("defaultProject", e.target.value)}
            className="w-full rounded-md bg-input/40 border border-border px-3 py-2 text-sm outline-none focus:border-primary"
          />
        </Field>
        <Field label="Repositório padrão">
          <input
            value={draft.defaultRepo}
            onChange={(e) => update("defaultRepo", e.target.value)}
            className="w-full rounded-md bg-input/40 border border-border px-3 py-2 text-sm outline-none focus:border-primary"
          />
        </Field>
        <Field label="WhatsApp de alerta">
          <input
            value={draft.whatsappAlert}
            onChange={(e) => update("whatsappAlert", e.target.value)}
            className="w-full rounded-md bg-input/40 border border-border px-3 py-2 text-sm outline-none focus:border-primary font-mono"
          />
        </Field>
      </section>

      <div className="sticky bottom-20 lg:bottom-0 flex flex-col sm:flex-row gap-3">
        <button
          onClick={save}
          className="flex-1 inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-primary to-accent px-5 py-3 text-sm font-bold text-primary-foreground glow-border shadow-[0_10px_40px_rgba(56,189,248,0.35)]"
        >
          <Save className="size-4" /> Salvar alterações
        </button>
        <button
          onClick={() => {
            factorySettings.reset();
            toast("Restaurado para padrões");
          }}
          className="rounded-xl glass border border-border/60 px-5 py-3 text-sm font-medium"
        >
          Restaurar padrões
        </button>
      </div>
    </div>
  );
}
