// AI FACTORY — Mapeamento rígido de módulos e escopo
// Cada missão é restrita aos arquivos e tabelas do módulo identificado.

export interface FactoryModule {
  /** id estável (slug) */
  id: string;
  /** nome humano exibido em tags */
  name: string;
  /** projeto/app a que pertence */
  project: string;
  /** palavras-chave que disparam a detecção a partir do prompt */
  keywords: string[];
  /** arquivos exatos que a missão pode tocar */
  targetFiles: string[];
  /** tabelas Supabase manipuladas pelo módulo */
  databaseTables: string[];
  /** texto de proibição anexado ao prompt final */
  restrictions: string;
}

export const FACTORY_MODULES: FactoryModule[] = [
  {
    id: "ponto",
    name: "Controle de Ponto",
    project: "Mecânicos",
    keywords: ["ponto", "bater ponto", "jornada", "frequência", "presença"],
    targetFiles: [
      "src/modules/ponto/PontoPage.tsx",
      "src/modules/ponto/registrarPonto.ts",
      "src/modules/ponto/hooks/useJornada.ts",
    ],
    databaseTables: ["registros_ponto", "jornadas", "funcionarios"],
    restrictions:
      "Proibido alterar arquivos fora de src/modules/ponto/** ou tabelas fora de [registros_ponto, jornadas, funcionarios].",
  },
  {
    id: "os",
    name: "Ordens de Serviço",
    project: "Mecânicos",
    keywords: ["ordem de serviço", "os ", "chamado", "atendimento", "ordem", "ordens"],
    targetFiles: [
      "src/modules/os/OrdensPage.tsx",
      "src/modules/os/criarOS.ts",
      "src/modules/os/components/OSCard.tsx",
    ],
    databaseTables: ["ordens_servico", "os_itens", "veiculos"],
    restrictions:
      "Proibido alterar arquivos fora de src/modules/os/** ou tabelas fora de [ordens_servico, os_itens, veiculos].",
  },
  {
    id: "estoque",
    name: "Estoque",
    project: "Mecânicos",
    keywords: ["estoque", "almoxarifado", "peça", "peças", "inventário", "saldo"],
    targetFiles: [
      "src/modules/almoxarifado/Almoxarifado.tsx",
      "src/modules/estoque/movimentacoes.ts",
    ],
    databaseTables: ["estoque_itens", "movimentacoes_estoque"],
    restrictions:
      "Proibido alterar arquivos fora de src/modules/almoxarifado/** e src/modules/estoque/** ou tabelas fora de [estoque_itens, movimentacoes_estoque].",
  },
  {
    id: "beneficios",
    name: "Benefícios (VR/VT)",
    project: "TOPAC RH",
    keywords: ["vr", "vt", "vale", "benefício", "benefícios", "topac"],
    targetFiles: [
      "src/modules/benefits/VRReport.tsx",
      "src/modules/benefits/VTReport.tsx",
    ],
    databaseTables: ["beneficios_vr", "beneficios_vt", "funcionarios"],
    restrictions:
      "Proibido alterar arquivos fora de src/modules/benefits/** ou tabelas fora de [beneficios_vr, beneficios_vt, funcionarios].",
  },
  {
    id: "factory-core",
    name: "Factory Core",
    project: "AI FACTORY",
    keywords: ["factory", "missão", "missao", "ai factory", "fab", "log"],
    targetFiles: [
      "src/components/MissionCycle.tsx",
      "src/components/FactoryFab.tsx",
      "src/lib/factory-analyze.ts",
      "src/lib/factory-data.ts",
    ],
    databaseTables: ["ai_execution_queue", "smart_logs", "missions"],
    restrictions:
      "Proibido alterar arquivos fora de src/components/MissionCycle.tsx, src/components/FactoryFab.tsx, src/lib/factory-*.ts ou tabelas fora de [ai_execution_queue, smart_logs, missions].",
  },
];

const GENERIC_MODULE: FactoryModule = {
  id: "generic",
  name: "Sem módulo identificado",
  project: "Indefinido",
  keywords: [],
  targetFiles: [],
  databaseTables: [],
  restrictions:
    "Módulo não identificado. Proibido alterar qualquer arquivo até que o operador defina escopo explícito.",
};

/** Detecta o módulo a partir do texto digitado pelo usuário. */
export function detectModule(prompt: string): FactoryModule {
  const t = prompt.toLowerCase();
  let best: { mod: FactoryModule; score: number } | null = null;
  for (const mod of FACTORY_MODULES) {
    let score = 0;
    for (const k of mod.keywords) if (t.includes(k.toLowerCase())) score += k.length;
    if (score > 0 && (!best || score > best.score)) best = { mod, score };
  }
  return best?.mod ?? GENERIC_MODULE;
}

/** Interceptador: monta payload final aplicando escopo rígido. */
export interface ScopedMissionPayload {
  module: FactoryModule;
  project: string;
  originalPrompt: string;
  finalPrompt: string;
  targetFiles: string[];
  databaseTables: string[];
  restrictions: string;
}

export function buildScopedMission(originalPrompt: string): ScopedMissionPayload {
  const mod = detectModule(originalPrompt);
  const finalPrompt = [
    `[MÓDULO: ${mod.name}]`,
    `[PROJETO: ${mod.project}]`,
    "",
    "PEDIDO ORIGINAL:",
    originalPrompt.trim(),
    "",
    "ESCOPO RÍGIDO — arquivos permitidos:",
    mod.targetFiles.length ? mod.targetFiles.map((f) => `- ${f}`).join("\n") : "- (nenhum)",
    "",
    "ESCOPO RÍGIDO — tabelas permitidas:",
    mod.databaseTables.length ? mod.databaseTables.map((t) => `- ${t}`).join("\n") : "- (nenhuma)",
    "",
    "RESTRIÇÕES:",
    mod.restrictions,
  ].join("\n");

  return {
    module: mod,
    project: mod.project,
    originalPrompt,
    finalPrompt,
    targetFiles: mod.targetFiles,
    databaseTables: mod.databaseTables,
    restrictions: mod.restrictions,
  };
}
