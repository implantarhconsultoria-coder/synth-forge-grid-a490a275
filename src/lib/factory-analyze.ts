// AI Factory — diagnóstico local. Zero dependência de API externa.

export type DiagnosisStatus = "wrong" | "ready" | "missing" | "needs_validation";

export interface Diagnosis {
  status: DiagnosisStatus;
  headline: string;
  reason?: string;
  risk?: string;
  suggestion?: string;
  whereToUse?: string;
  canRelease?: boolean;
  missing?: string[];
  needsConfig?: string[];
  impact?: string;
  askToStart?: boolean;
  knownFacts?: string[];
  toValidate?: string[];
  risks?: string[];
  impacts?: string[];
  realCommand?: string;
  project?: string;
}

interface ProjectPreset {
  match: RegExp;
  project: string;
  knownFacts: string[];
  toValidate: string[];
  risks: string[];
  impacts: string[];
}

const PRESETS: ProjectPreset[] = [
  {
    match: /mec[âa]nic|oficina|frota|abastec/i,
    project: "App dos Mecânicos (TOPAC)",
    knownFacts: [
      "Existe no projeto TOPAC",
      "Possui rotas de acesso mecânico",
      "Telas de ponto, chamados, veículo, histórico e abastecimento",
    ],
    toValidate: [
      "Versão publicada no Lovable x GitHub",
      "Login por PIN/CPF",
      "Gravação real do ponto",
      "Abertura e finalização de chamados",
      "Abastecimento vinculado ao mecânico e veículo",
      "Histórico de atendimentos",
      "Erros de tela, console e banco",
    ],
    risks: [
      "Liberar versão sem auditoria pode quebrar registro de ponto",
      "Chamados não persistidos geram retrabalho operacional",
    ],
    impacts: [
      "Mecânicos em campo sem registro confiável",
      "Gestão sem visibilidade de chamados e abastecimento",
    ],
  },
  {
    match: /topac|rh\b|implantarh|prospera/i,
    project: "TOPAC RH",
    knownFacts: [
      "Plataforma operacional de RH da ImplantaRH",
      "Módulos: dashboard, folha, benefícios, almoxarifado",
      "Conectado ao núcleo da AI Factory",
    ],
    toValidate: [
      "Versão publicada x branch main",
      "Login e permissões por perfil",
      "Rotas críticas do RH (folha, ponto, benefícios)",
      "Gravação no banco e RLS",
      "Erros de console e build",
    ],
    risks: [
      "Mudança sem validar permissões expõe dados sensíveis",
      "Quebra em folha/ponto impacta operação",
    ],
    impacts: ["RH operacional", "Gestão de pessoas", "Compliance"],
  },
  {
    match: /nexus|lead|comercial|crm/i,
    project: "Nexus Lead",
    knownFacts: [
      "Plataforma de geração e qualificação de leads com IA",
      "Integração com WhatsApp e CRM",
    ],
    toValidate: [
      "Captura de leads ativa",
      "Qualificação por IA",
      "Sincronização CRM x WhatsApp",
      "Métricas do dashboard comerciais",
    ],
    risks: ["Perda de leads se a captura falhar", "Dados duplicados no CRM"],
    impacts: ["Funil comercial", "Receita", "Equipe de vendas"],
  },
  {
    match: /pulzr|monitor|métric/i,
    project: "PULZR",
    knownFacts: ["Monitoramento em tempo real", "Coletor de métricas externo"],
    toValidate: [
      "Worker de métricas online",
      "Latência dos endpoints",
      "Alertas críticos pendentes",
    ],
    risks: ["Latência elevada não detectada", "Alertas perdidos"],
    impacts: ["Operação", "SRE", "Disponibilidade"],
  },
];

const GENERIC: ProjectPreset = {
  match: /.*/,
  project: "Projeto genérico",
  knownFacts: [
    "Pedido recebido pela AI Factory",
    "Sem identificação automática de projeto específico",
  ],
  toValidate: [
    "Versão publicada x GitHub",
    "Login e rotas principais",
    "Gravações reais no banco",
    "Erros de console e tela",
    "Checklist final de aprovação",
  ],
  risks: [
    "Liberar sem auditoria pode quebrar fluxos existentes",
    "Mudanças não revisadas podem afetar dados em produção",
  ],
  impacts: ["Usuários da aplicação", "Operação geral", "Integrações conectadas"],
};

function pick(prompt: string): ProjectPreset {
  return PRESETS.find((p) => p.match.test(prompt)) ?? GENERIC;
}

function detectWrong(prompt: string): { reason: string; risk: string; suggestion: string } | null {
  const p = prompt.toLowerCase();
  if (/deleta tudo|drop database|apagar banco|remover usu[aá]rios/.test(p)) {
    return {
      reason: "Pedido destrutivo sem reversão segura.",
      risk: "Perda irreversível de dados em produção.",
      suggestion: "Especifique escopo, backup e ambiente antes de qualquer remoção.",
    };
  }
  return null;
}

function detectMissing(prompt: string): string[] {
  const missing: string[] = [];
  if (prompt.trim().split(/\s+/).length < 3) missing.push("Descrição do alvo (qual app/módulo)");
  if (!/(corrigir|analisar|validar|verificar|auditar|criar|publicar|deploy|testar)/i.test(prompt)) {
    missing.push("Ação clara (analisar, corrigir, validar, publicar...)");
  }
  return missing;
}

export function analyzeMissionLocal(prompt: string): Diagnosis {
  const text = (prompt || "").trim();
  if (!text) {
    return {
      status: "missing",
      headline: "Pedido vazio",
      missing: ["Descreva o que a Factory deve analisar"],
      impact: "Sem pedido, nada pode ser planejado.",
    };
  }

  const wrong = detectWrong(text);
  if (wrong) {
    return {
      status: "wrong",
      headline: `Caminho errado — ${text.slice(0, 60)}`,
      reason: wrong.reason,
      risk: wrong.risk,
      suggestion: wrong.suggestion,
    };
  }

  const missing = detectMissing(text);
  if (missing.length >= 2) {
    return {
      status: "missing",
      headline: "Faltam informações para planejar",
      missing,
      needsConfig: ["Reescreva incluindo o alvo e a ação desejada"],
      impact: "Sem alvo claro, a Factory não pode auditar com segurança.",
    };
  }

  const preset = pick(text);
  const realCommand = `AUDITORIA REAL — ${preset.project}: ${preset.toValidate.join(", ")}.`;

  return {
    status: "needs_validation",
    headline: `PRECISA VALIDAR — ${preset.project}`,
    project: preset.project,
    canRelease: false,
    knownFacts: preset.knownFacts,
    toValidate: preset.toValidate,
    risks: preset.risks,
    impacts: preset.impacts,
    realCommand,
    askToStart: true,
  };
}
