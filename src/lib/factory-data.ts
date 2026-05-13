// AI FACTORY — central data service
// Estrutura preparada para futura conexão Supabase/API.
// Hoje: mock local + persistência em localStorage para histórico de ações.

export type DataSource = "mock" | "real";

export type ProjectStatus = "online" | "build" | "alert" | "offline";

export interface Project {
  id: string;
  name: string;
  category: string;
  status: ProjectStatus;
  progress: number;
  source: DataSource;
  isPrivate: boolean;
  isExternal: boolean;
  lastUpdate: string; // ISO
  description: string;
}

export interface SmartLog {
  id: string;
  projectId: string | null;
  type: "system" | "monitor" | "forge" | "doctor" | "connect" | "voice";
  level: "info" | "ok" | "warn" | "error";
  message: string;
  createdAt: string;
  source: DataSource;
}

export interface Integration {
  id: string;
  name: string;
  provider: string;
  status: "connected" | "syncing" | "warning" | "offline";
  lastSync: string;
  errorMessage: string | null;
  source: DataSource;
}

export interface Alert {
  id: string;
  projectId: string;
  severity: "low" | "medium" | "high" | "critical";
  title: string;
  description: string;
  status: "open" | "ack" | "resolved";
  createdAt: string;
  source: DataSource;
}

export interface Correction {
  id: string;
  projectId: string;
  title: string;
  description: string;
  status: "suggested" | "applied" | "rejected";
  riskLevel: "low" | "medium" | "high";
  requiresApproval: boolean;
  createdAt: string;
  source: DataSource;
}

export interface CommandRecord {
  id: string;
  commandText: string;
  interpretedAction: string;
  status: "queued" | "executed" | "failed";
  createdAt: string;
  source: DataSource;
}

// ---------- Mock seed ----------

const now = () => new Date().toISOString();
const uid = () => Math.random().toString(36).slice(2, 10);

const seedProjects: Project[] = [
  { id: "topac", name: "TOPAC RH", category: "Recursos Humanos", status: "online", progress: 92, source: "mock", isPrivate: false, isExternal: false, lastUpdate: now(), description: "Plataforma operacional de RH" },
  { id: "nexus", name: "Nexus Lead", category: "Comercial", status: "online", progress: 78, source: "mock", isPrivate: false, isExternal: false, lastUpdate: now(), description: "Geração e qualificação de leads com IA" },
  { id: "doctor", name: "Doctor PRO", category: "Diagnóstico", status: "build", progress: 64, source: "mock", isPrivate: false, isExternal: false, lastUpdate: now(), description: "Diagnóstico e correção autônoma" },
  { id: "forge", name: "Forge", category: "Engenharia", status: "online", progress: 88, source: "mock", isPrivate: false, isExternal: false, lastUpdate: now(), description: "Fábrica de sistemas e módulos" },
  { id: "pulzr", name: "PULZR", category: "Monitoramento", status: "alert", progress: 41, source: "mock", isPrivate: false, isExternal: true, lastUpdate: now(), description: "Pulso operacional em tempo real" },
  { id: "flow", name: "Flow", category: "Automação", status: "online", progress: 71, source: "mock", isPrivate: false, isExternal: false, lastUpdate: now(), description: "Orquestração de fluxos inteligentes" },
];

const seedLogs: SmartLog[] = [
  { id: uid(), projectId: "topac", type: "connect", level: "info", message: "Projeto TOPAC RH conectado ao núcleo IA", createdAt: now(), source: "mock" },
  { id: uid(), projectId: "nexus", type: "doctor", level: "ok", message: "Correção aplicada em Nexus Lead · módulo dashboard", createdAt: now(), source: "mock" },
  { id: uid(), projectId: null, type: "connect", level: "info", message: "API WhatsApp sincronizada · 1.2k eventos", createdAt: now(), source: "mock" },
  { id: uid(), projectId: "doctor", type: "monitor", level: "ok", message: "Monitoramento ativo · Doctor PRO", createdAt: now(), source: "mock" },
  { id: uid(), projectId: "pulzr", type: "monitor", level: "warn", message: "Alerta detectado · latência elevada em PULZR", createdAt: now(), source: "mock" },
  { id: uid(), projectId: null, type: "forge", level: "info", message: "Forge gerou nova arquitetura · módulo financeiro", createdAt: now(), source: "mock" },
  { id: uid(), projectId: "flow", type: "doctor", level: "ok", message: "Patch automático aplicado em Flow", createdAt: now(), source: "mock" },
];

const seedIntegrations: Integration[] = [
  { id: uid(), name: "GitHub", provider: "github", status: "connected", lastSync: now(), errorMessage: null, source: "mock" },
  { id: uid(), name: "Lovable", provider: "lovable", status: "connected", lastSync: now(), errorMessage: null, source: "mock" },
  { id: uid(), name: "Supabase", provider: "supabase", status: "syncing", lastSync: now(), errorMessage: null, source: "mock" },
  { id: uid(), name: "WhatsApp", provider: "meta", status: "connected", lastSync: now(), errorMessage: null, source: "mock" },
  { id: uid(), name: "Google Drive", provider: "google", status: "warning", lastSync: now(), errorMessage: "Permissão a renovar em 3 dias", source: "mock" },
  { id: uid(), name: "Stripe", provider: "stripe", status: "offline", lastSync: now(), errorMessage: "Aguardando reconexão manual", source: "mock" },
];

const seedAlerts: Alert[] = [
  { id: uid(), projectId: "pulzr", severity: "critical", title: "Latência elevada", description: "Endpoint /metrics > 1.5s", status: "open", createdAt: now(), source: "mock" },
  { id: uid(), projectId: "nexus", severity: "medium", title: "Cache desatualizado", description: "Invalidação sugerida", status: "open", createdAt: now(), source: "mock" },
  { id: uid(), projectId: "flow", severity: "medium", title: "Job atrasado", description: "Fila assíncrona +12s", status: "ack", createdAt: now(), source: "mock" },
];

const seedCorrections: Correction[] = [
  { id: uid(), projectId: "nexus", title: "Otimizar query do dashboard", description: "Adicionar índice composto", status: "applied", riskLevel: "low", requiresApproval: false, createdAt: now(), source: "mock" },
  { id: uid(), projectId: "pulzr", title: "Reiniciar worker de métricas", description: "Worker travado em loop", status: "suggested", riskLevel: "medium", requiresApproval: true, createdAt: now(), source: "mock" },
];

const seedCommands: CommandRecord[] = [];

// ---------- Persistência local ----------

const LS_KEYS = {
  logs: "factory.logs",
  commands: "factory.commands",
  corrections: "factory.corrections",
} as const;

function readLS<T>(key: string): T[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T[]) : [];
  } catch {
    return [];
  }
}
function writeLS<T>(key: string, value: T[]) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(key, JSON.stringify(value.slice(0, 200)));
  } catch {
    /* ignore */
  }
}

// ---------- Service ----------

export const factoryData = {
  source: "mock" as DataSource, // troque para "real" quando conectar API

  // Reads (mock + local)
  getProjects(): Project[] {
    return seedProjects;
  },
  getProject(id: string): Project | undefined {
    return seedProjects.find((p) => p.id === id);
  },
  getIntegrations(): Integration[] {
    return seedIntegrations;
  },
  getAlerts(): Alert[] {
    return seedAlerts;
  },
  getCorrections(): Correction[] {
    return [...readLS<Correction>(LS_KEYS.corrections), ...seedCorrections];
  },
  getLogs(): SmartLog[] {
    return [...readLS<SmartLog>(LS_KEYS.logs), ...seedLogs];
  },
  getCommands(): CommandRecord[] {
    return [...readLS<CommandRecord>(LS_KEYS.commands), ...seedCommands];
  },

  // Stats (derivadas)
  getStats() {
    const projects = this.getProjects();
    const integrations = this.getIntegrations();
    const alerts = this.getAlerts();
    return {
      projectsConnected: projects.length,
      projectsOnline: projects.filter((p) => p.status === "online").length,
      corrections: this.getCorrections().length,
      alertsActive: alerts.filter((a) => a.status !== "resolved").length,
      alertsCritical: alerts.filter((a) => a.severity === "critical").length,
      apisConnected: integrations.length,
      apisSyncing: integrations.filter((i) => i.status === "syncing").length,
      monitored: projects.length + integrations.length,
    };
  },

  // Writes (localStorage)
  addLog(input: Partial<SmartLog> & { message: string }): SmartLog {
    const log: SmartLog = {
      id: uid(),
      projectId: input.projectId ?? null,
      type: input.type ?? "system",
      level: input.level ?? "info",
      message: input.message,
      createdAt: now(),
      source: "mock",
    };
    const list = readLS<SmartLog>(LS_KEYS.logs);
    writeLS(LS_KEYS.logs, [log, ...list]);
    return log;
  },
  addCorrection(input: Partial<Correction> & { projectId: string; title: string }): Correction {
    const c: Correction = {
      id: uid(),
      projectId: input.projectId,
      title: input.title,
      description: input.description ?? "Correção simulada gerada pela AI Factory.",
      status: input.status ?? "suggested",
      riskLevel: input.riskLevel ?? "low",
      requiresApproval: input.requiresApproval ?? false,
      createdAt: now(),
      source: "mock",
    };
    const list = readLS<Correction>(LS_KEYS.corrections);
    writeLS(LS_KEYS.corrections, [c, ...list]);
    this.addLog({ projectId: c.projectId, type: "doctor", level: "ok", message: `Correção sugerida: ${c.title}` });
    return c;
  },
  addCommand(input: Partial<CommandRecord> & { commandText: string }): CommandRecord {
    const cmd: CommandRecord = {
      id: uid(),
      commandText: input.commandText,
      interpretedAction: input.interpretedAction ?? "automation.run",
      status: input.status ?? "queued",
      createdAt: now(),
      source: "mock",
    };
    const list = readLS<CommandRecord>(LS_KEYS.commands);
    writeLS(LS_KEYS.commands, [cmd, ...list]);
    this.addLog({ type: "voice", level: "info", message: `Comando registrado: ${cmd.commandText}` });
    return cmd;
  },
};

export function sourceLabel(src: DataSource) {
  return src === "real" ? "Real" : "Simulado";
}
