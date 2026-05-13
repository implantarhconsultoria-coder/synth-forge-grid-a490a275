export const STATUS_CARDS = [
  { label: "Projetos conectados", value: 24, delta: "+3 esta semana", tone: "primary" as const },
  { label: "Projetos online", value: 19, delta: "99.98% uptime", tone: "success" as const },
  { label: "Correções geradas", value: 142, delta: "+12 hoje", tone: "violet" as const },
  { label: "Alertas ativos", value: 3, delta: "2 críticos", tone: "warning" as const },
  { label: "APIs conectadas", value: 37, delta: "5 sincronizando", tone: "primary" as const },
  { label: "Sistemas monitorados", value: 58, delta: "tempo real", tone: "success" as const },
];

export const LIVE_LOGS = [
  { t: "agora", k: "info", m: "Projeto TOPAC RH conectado ao núcleo IA" },
  { t: "12s", k: "ok", m: "Correção aplicada em Nexus Lead · módulo dashboard" },
  { t: "34s", k: "info", m: "API WhatsApp sincronizada · 1.2k eventos" },
  { t: "1m", k: "ok", m: "Monitoramento ativo · Doctor PRO" },
  { t: "2m", k: "warn", m: "Alerta detectado · latência elevada em PULZR" },
  { t: "3m", k: "info", m: "Forge gerou nova arquitetura · módulo financeiro" },
  { t: "5m", k: "ok", m: "Patch automático aplicado em Flow" },
  { t: "8m", k: "info", m: "GitHub sync · 14 commits indexados" },
  { t: "12m", k: "ok", m: "Backup íntegro · armazenamento criptografado" },
];

export type Project = {
  id: string;
  name: string;
  category: string;
  status: "online" | "build" | "alert" | "offline";
  progress: number;
  description: string;
};

export const PROJECTS: Project[] = [
  { id: "topac", name: "TOPAC RH", category: "Recursos Humanos", status: "online", progress: 92, description: "Plataforma operacional de RH" },
  { id: "nexus", name: "Nexus Lead", category: "Comercial", status: "online", progress: 78, description: "Geração e qualificação de leads com IA" },
  { id: "doctor", name: "Doctor PRO", category: "Diagnóstico", status: "build", progress: 64, description: "Diagnóstico e correção autônoma" },
  { id: "forge", name: "Forge", category: "Engenharia", status: "online", progress: 88, description: "Fábrica de sistemas e módulos" },
  { id: "pulzr", name: "PULZR", category: "Monitoramento", status: "alert", progress: 41, description: "Pulso operacional em tempo real" },
  { id: "flow", name: "Flow", category: "Automação", status: "online", progress: 71, description: "Orquestração de fluxos inteligentes" },
];

export const INTEGRATIONS = [
  { name: "GitHub", status: "connected", desc: "32 repositórios indexados" },
  { name: "Lovable", status: "connected", desc: "Ambiente de build sincronizado" },
  { name: "Supabase", status: "syncing", desc: "Schema sendo replicado" },
  { name: "WhatsApp", status: "connected", desc: "API oficial · 1.2k eventos/h" },
  { name: "Google Drive", status: "warning", desc: "Permissão a renovar em 3 dias" },
  { name: "Stripe", status: "offline", desc: "Aguardando reconexão manual" },
] as const;

export const DOCTOR_LOGS = [
  { level: "critical", project: "PULZR", message: "Latência > 1.5s no endpoint /metrics" },
  { level: "warn", project: "Nexus Lead", message: "Cache desatualizado · invalidação sugerida" },
  { level: "info", project: "TOPAC RH", message: "Healthcheck verde · sem ações necessárias" },
  { level: "warn", project: "Flow", message: "Job assíncrono atrasado em 12s" },
  { level: "info", project: "Forge", message: "Build estável · 0 warnings" },
];
