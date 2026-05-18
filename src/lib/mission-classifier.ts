// AI Factory — auto-classifier for natural-language missions
// Pure heuristics, runs locally. Returns project, action, priority, risk, approval needed.

export type MissionAction =
  | "create"
  | "fix"
  | "alter"
  | "automate"
  | "analyze"
  | "monitor";

export type MissionRisk = "low" | "medium" | "high";
export type MissionPriority = "low" | "normal" | "high" | "critical";

export interface ClassifiedMission {
  raw: string;
  project: string;
  action: MissionAction;
  priority: MissionPriority;
  risk: MissionRisk;
  requiresApproval: boolean;
  tags: string[];
}

const PROJECT_ALIASES: Array<{ name: string; patterns: RegExp[] }> = [
  { name: "TOPAC RH", patterns: [/topac/i, /\brh\b/i, /vr\b/i, /vt\b/i, /folha/i, /benef[ií]cio/i] },
  { name: "PULZR", patterns: [/pulzr/i, /pulsar/i] },
  { name: "Flow Louvor", patterns: [/flow/i, /louvor/i, /culto/i] },
  { name: "Nexus Lead IA", patterns: [/nexus/i, /lead/i, /prospec/i, /crm/i] },
  { name: "Praia Grande", patterns: [/praia grande/i] },
  { name: "AI FACTORY", patterns: [/factory/i, /n[uú]cleo/i, /worker/i] },
];

const ACTION_PATTERNS: Array<{ a: MissionAction; r: RegExp }> = [
  { a: "fix",      r: /(arrum|corrig|conserta|consert[oa]|bug|quebr|errad|falha|n[ãa]o funciona|n[ãa]o ta)/i },
  { a: "create",   r: /(cria|criar|novo|nova|gerar|montar|adicion|implementa)/i },
  { a: "alter",    r: /(altera|muda|deixa igual|igual ao|troca|substitui|remove|remov|excluir|tira)/i },
  { a: "automate", r: /(automatiza|automa[cç][ãa]o|agendar|cron|robô|robo|sozinh)/i },
  { a: "analyze",  r: /(analisa|relat[oó]rio|insight|estat[ií]stica|m[eé]trica)/i },
  { a: "monitor",  r: /(monitora|acompanha|observa|vigia|alerta)/i },
];

const HIGH_RISK = /(deletar|apagar|drop|truncate|produ[cç][ãa]o|financeiro|pagamento|senha|sensível|sensivel|migra[cç][ãa]o|banco)/i;
const MED_RISK  = /(altera.*tabela|schema|deploy|publicar|migrar|rollback|reset)/i;
const CRITICAL  = /(urgente|cr[ií]tico|parou|fora do ar|caiu|emerg[eê]ncia|agora|imediato)/i;
const HIGH_PRI  = /(hoje|r[aá]pido|prioridade)/i;

function detectProject(text: string): string {
  for (const p of PROJECT_ALIASES) {
    if (p.patterns.some((re) => re.test(text))) return p.name;
  }
  return "AI FACTORY";
}

function detectAction(text: string): MissionAction {
  for (const { a, r } of ACTION_PATTERNS) {
    if (r.test(text)) return a;
  }
  return "alter";
}

function detectTags(text: string): string[] {
  const tags: string[] = [];
  if (/mobile|celular|iphone|android/i.test(text)) tags.push("mobile");
  if (/pdf/i.test(text)) tags.push("pdf");
  if (/layout|visual|tela|design|ui/i.test(text)) tags.push("ui");
  if (/api|webhook|endpoint/i.test(text)) tags.push("api");
  if (/whatsapp|wpp|zap/i.test(text)) tags.push("whatsapp");
  if (/email|e-mail/i.test(text)) tags.push("email");
  return tags;
}

export function classifyMission(raw: string): ClassifiedMission {
  const text = raw.trim();
  const action = detectAction(text);
  const project = detectProject(text);
  const tags = detectTags(text);

  const isHigh = HIGH_RISK.test(text);
  const isMed = !isHigh && MED_RISK.test(text);
  const risk: MissionRisk = isHigh ? "high" : isMed ? "medium" : "low";

  const priority: MissionPriority = CRITICAL.test(text)
    ? "critical"
    : HIGH_PRI.test(text)
      ? "high"
      : action === "fix"
        ? "high"
        : "normal";

  const requiresApproval = risk !== "low" || priority === "critical";

  return { raw: text, project, action, priority, risk, requiresApproval, tags };
}

export function actionLabel(a: MissionAction): string {
  return {
    create: "Criar",
    fix: "Corrigir",
    alter: "Alterar",
    automate: "Automatizar",
    analyze: "Analisar",
    monitor: "Monitorar",
  }[a];
}

export function riskColor(r: MissionRisk): string {
  return r === "high" ? "text-destructive" : r === "medium" ? "text-warning" : "text-success";
}
