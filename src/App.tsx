import React, { useEffect, useMemo, useState } from 'react';

type Platform = 'Lovable' | 'GitHub/Codespaces' | 'Supabase' | 'Canva/Figma' | 'OpenAI/ChatGPT' | 'AppSheet/Bubble';
type Risk = 'baixo' | 'médio' | 'alto';
type Priority = 'baixa' | 'média' | 'alta' | 'crítica';
type MissionStatus = 'rascunho' | 'aprovada' | 'concluída';

interface Project {
  id: string;
  name: string;
  area: string;
  status: string;
  source: 'local' | 'sync';
}

interface Agent {
  id: string;
  name: string;
  role: string;
  platform: Platform | 'Interno';
  status: 'ativo' | 'standby';
}

interface Mission {
  id: string;
  title: string;
  platform: Platform;
  type: string;
  priority: Priority;
  risk: Risk;
  objective: string;
  prompt: string;
  protect: string[];
  successCriteria: string;
  finalTest: string;
  requiresApproval: boolean;
  status: MissionStatus;
  createdAt: string;
}

interface FactoryState {
  projects: Project[];
  agents: Agent[];
  missions: Mission[];
  logs: string[];
  memories: string[];
}

const STORAGE_KEY = 'ai_factory_local_command_center_v1';

const initialState: FactoryState = {
  projects: [
    { id: 'topac-rh-pro', name: 'TOPAC RH PRO', area: 'Cliente real · RH operacional', status: 'em organização', source: 'local' },
    { id: 'ai-factory', name: 'AI Factory', area: 'Núcleo de criação e correção', status: 'ativo', source: 'local' },
    { id: 'doctor-pro', name: 'Doctor PRO', area: 'Diagnóstico e correção', status: 'ativo', source: 'local' },
    { id: 'nexus-lead', name: 'Nexus Lead IA', area: 'Comercial e prospecção', status: 'planejado', source: 'local' },
    { id: 'pulzr', name: 'PULZR', area: 'Fitness / comunidade', status: 'planejado', source: 'local' },
    { id: 'flow-louvor', name: 'Flow Louvor', area: 'Assistente musical', status: 'planejado', source: 'local' },
  ],
  agents: [
    { id: 'architect', name: 'Arquiteto', role: 'organiza escopo, módulos e sequência de execução', platform: 'Interno', status: 'ativo' },
    { id: 'lovable-specialist', name: 'Especialista Lovable', role: 'gera prompts curtos, seguros e econômicos para o Lovable', platform: 'Lovable', status: 'ativo' },
    { id: 'doctor', name: 'Doctor PRO', role: 'detecta erro, risco e correção provável', platform: 'Interno', status: 'ativo' },
    { id: 'frontend', name: 'Dev Frontend', role: 'telas, mobile, layout, UX e componentes', platform: 'GitHub/Codespaces', status: 'ativo' },
    { id: 'backend', name: 'Dev Backend', role: 'regras, APIs, filas, automações e integrações', platform: 'GitHub/Codespaces', status: 'ativo' },
    { id: 'database', name: 'Especialista Banco', role: 'tabelas, permissões, políticas e migrações', platform: 'Supabase', status: 'ativo' },
    { id: 'qa', name: 'QA/Testes', role: 'testes finais, regressão e checklist de segurança', platform: 'Interno', status: 'ativo' },
    { id: 'docs', name: 'Documentador', role: 'registra decisões, padrões e histórico operacional', platform: 'OpenAI/ChatGPT', status: 'ativo' },
  ],
  missions: [],
  logs: ['Núcleo local iniciado. Lovable permanece como executor principal, mas não recebe prompt cru.'],
  memories: [
    'Regra fixa: proteger layout, login, menus, permissões e telas já aprovadas.',
    'Regra fixa: Lovable só recebe pacote técnico revisado para economizar crédito.',
    'Regra fixa: ações sensíveis exigem aprovação antes de execução.',
  ],
};

const now = () => new Date().toISOString();
const uid = () => Math.random().toString(36).slice(2, 10);

function loadFactory(): FactoryState {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return initialState;
    const parsed = JSON.parse(raw) as FactoryState;
    return {
      ...initialState,
      ...parsed,
      projects: parsed.projects?.length ? parsed.projects : initialState.projects,
      agents: parsed.agents?.length ? parsed.agents : initialState.agents,
      missions: parsed.missions ?? [],
      logs: parsed.logs?.length ? parsed.logs : initialState.logs,
      memories: parsed.memories?.length ? parsed.memories : initialState.memories,
    };
  } catch {
    return initialState;
  }
}

function classifyPlatform(text: string): Platform {
  const t = text.toLowerCase();
  if (/(layout|tela|dashboard|app|sistema|interface|mobile|botão|menu|lovable)/.test(t)) return 'Lovable';
  if (/(código|codigo|github|codespaces|arquivo|component|bug técnico|commit|repo)/.test(t)) return 'GitHub/Codespaces';
  if (/(supabase|banco|tabela|rls|permissão|permissao|login|auth|storage)/.test(t)) return 'Supabase';
  if (/(canva|figma|design|apresentação|apresentacao|post|logo|imagem|identidade)/.test(t)) return 'Canva/Figma';
  if (/(appsheet|bubble|planilha|mobile simples|operacional simples)/.test(t)) return 'AppSheet/Bubble';
  return 'OpenAI/ChatGPT';
}

function classifyType(text: string) {
  const t = text.toLowerCase();
  if (/(corrigir|erro|bug|quebrou|arrumar|falha)/.test(t)) return 'correção';
  if (/(criar|novo|construir|desenvolver|montar)/.test(t)) return 'criação';
  if (/(melhorar|ajustar|layout|mobile|visual)/.test(t)) return 'melhoria';
  if (/(automatizar|automação|automatico|automático|fila)/.test(t)) return 'automação';
  return 'planejamento técnico';
}

function classifyRisk(text: string, platform: Platform): Risk {
  const t = text.toLowerCase();
  if (/(banco|login|permissão|permissao|financeiro|rh|salário|salario|excluir|deletar|cliente real|produção|producao)/.test(t)) return 'alto';
  if (platform === 'Supabase' || /(integração|integracao|api|automação|automacao)/.test(t)) return 'médio';
  return 'baixo';
}

function priorityFromRisk(risk: Risk): Priority {
  if (risk === 'alto') return 'crítica';
  if (risk === 'médio') return 'alta';
  return 'média';
}

function buildPrompt(input: string, platform: Platform, type: string, risk: Risk) {
  const baseProtect = [
    'Não refazer o projeto do zero.',
    'Não alterar login, permissões, menus e telas já aprovadas sem necessidade.',
    'Não remover dados, módulos ou integrações existentes.',
    'Manter padrão visual AI Factory / ImplantaRH ConsultoriaPRO.',
  ];

  const platformRule: Record<Platform, string> = {
    Lovable: 'Ajustar somente o necessário dentro do app visual. Entregar alteração pequena, segura e testável. Evitar prompt amplo que reconstrua tudo.',
    'GitHub/Codespaces': 'Aplicar alteração em código real com arquivos claros, commit lógico e teste de build.',
    Supabase: 'Gerar SQL/política/migração com rollback lógico e sem tocar dados sensíveis sem aprovação.',
    'Canva/Figma': 'Criar proposta visual editável, mantendo identidade premium e linguagem ImplantaRH.',
    'OpenAI/ChatGPT': 'Gerar análise, documentação, roteiro técnico e checklist de execução.',
    'AppSheet/Bubble': 'Criar fluxo simples, operacional, mobile-first e fácil de manter.',
  };

  const prompt = [
    `MISSÃO AI FACTORY PARA ${platform.toUpperCase()}`,
    '',
    `Tipo: ${type}`,
    `Risco: ${risk}`,
    '',
    'Pedido original:',
    input.trim(),
    '',
    'Objetivo técnico:',
    `Resolver exatamente o pedido acima usando a função correta da plataforma ${platform}.`,
    '',
    'Regra da plataforma:',
    platformRule[platform],
    '',
    'Proteções obrigatórias:',
    ...baseProtect.map((item) => `- ${item}`),
    '',
    'Critério de sucesso:',
    '- A alteração precisa funcionar sem quebrar o que já existe.',
    '- O resultado deve ser validável em tela ou por checklist.',
    '- Se envolver dado sensível, apenas preparar e pedir aprovação antes de executar.',
    '',
    'Teste final obrigatório:',
    '- Abrir a tela/módulo afetado.',
    '- Conferir mobile e desktop quando houver interface.',
    '- Confirmar que não houve regressão no menu, login, permissões e dados existentes.',
  ].join('\n');

  return { prompt, protect: baseProtect };
}

function createMissionsFromInput(input: string): Mission[] {
  const platform = classifyPlatform(input);
  const type = classifyType(input);
  const risk = classifyRisk(input, platform);
  const { prompt, protect } = buildPrompt(input, platform, type, risk);

  const missions: Mission[] = [
    {
      id: uid(),
      title: `${type.toUpperCase()} · ${platform}`,
      platform,
      type,
      priority: priorityFromRisk(risk),
      risk,
      objective: input.trim(),
      prompt,
      protect,
      successCriteria: 'Entrega pequena, funcional, sem reconstruir o projeto e sem desperdiçar crédito.',
      finalTest: 'Validar tela/fluxo afetado, mobile, menu, dados e ausência de regressão.',
      requiresApproval: risk === 'alto',
      status: 'rascunho',
      createdAt: now(),
    },
  ];

  if (platform === 'Lovable') {
    const qaPrompt = buildPrompt(`Revisar e testar a missão Lovable antes de gastar crédito: ${input}`, 'OpenAI/ChatGPT', 'QA preventivo', 'baixo');
    missions.unshift({
      id: uid(),
      title: 'QA PREVENTIVO · antes do Lovable',
      platform: 'OpenAI/ChatGPT',
      type: 'revisão preventiva',
      priority: 'alta',
      risk: 'baixo',
      objective: 'Revisar o pacote antes de enviar ao Lovable para evitar prompt ruim.',
      prompt: qaPrompt.prompt,
      protect: qaPrompt.protect,
      successCriteria: 'Prompt Lovable fica curto, específico, seguro e econômico.',
      finalTest: 'Conferir se o prompt tem objetivo, proteções e teste final.',
      requiresApproval: false,
      status: 'rascunho',
      createdAt: now(),
    });
  }

  return missions;
}

const copy = async (text: string) => {
  await navigator.clipboard.writeText(text);
};

export default function App() {
  const [state, setState] = useState<FactoryState>(() => loadFactory());
  const [input, setInput] = useState('');
  const [selectedMission, setSelectedMission] = useState<Mission | null>(null);
  const [memoryText, setMemoryText] = useState('');

  useEffect(() => {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }, [state]);

  const stats = useMemo(() => {
    const open = state.missions.filter((m) => m.status !== 'concluída').length;
    const lovable = state.missions.filter((m) => m.platform === 'Lovable').length;
    const sensitive = state.missions.filter((m) => m.requiresApproval).length;
    return { open, lovable, sensitive };
  }, [state.missions]);

  const addLog = (message: string) => {
    setState((prev) => ({ ...prev, logs: [`${new Date().toLocaleString('pt-BR')} · ${message}`, ...prev.logs].slice(0, 80) }));
  };

  const generatePlan = () => {
    if (!input.trim()) return;
    const missions = createMissionsFromInput(input);
    setState((prev) => ({ ...prev, missions: [...missions, ...prev.missions] }));
    setSelectedMission(missions[missions.length - 1]);
    addLog(`Orquestrador gerou ${missions.length} missão(ões) para: ${input.slice(0, 80)}`);
    setInput('');
  };

  const updateMission = (id: string, patch: Partial<Mission>) => {
    setState((prev) => ({ ...prev, missions: prev.missions.map((m) => (m.id === id ? { ...m, ...patch } : m)) }));
    setSelectedMission((prev) => (prev?.id === id ? { ...prev, ...patch } : prev));
  };

  const splitMission = (mission: Mission) => {
    const steps = [
      `Diagnosticar contexto antes de executar: ${mission.objective}`,
      `Aplicar somente a menor alteração segura na plataforma ${mission.platform}`,
      `Testar resultado e registrar validação final`,
    ].map((objective, index) => {
      const platform = index === 0 || index === 2 ? 'OpenAI/ChatGPT' : mission.platform;
      const risk = index === 1 ? mission.risk : 'baixo';
      const { prompt, protect } = buildPrompt(objective, platform, `${mission.type} etapa ${index + 1}`, risk);
      return {
        ...mission,
        id: uid(),
        title: `ETAPA ${index + 1} · ${mission.title}`,
        platform,
        objective,
        prompt,
        protect,
        risk,
        priority: priorityFromRisk(risk),
        status: 'rascunho' as MissionStatus,
        createdAt: now(),
      };
    });
    setState((prev) => ({ ...prev, missions: [...steps, ...prev.missions] }));
    addLog(`Missão dividida em ${steps.length} etapas: ${mission.title}`);
  };

  const exportBackup = () => {
    const blob = new Blob([JSON.stringify(state, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `ai-factory-backup-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
    addLog('Backup JSON exportado.');
  };

  const importBackup = (file: File) => {
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const parsed = JSON.parse(String(reader.result)) as FactoryState;
        setState({ ...initialState, ...parsed });
        addLog('Backup JSON importado.');
      } catch {
        addLog('Falha ao importar backup JSON.');
      }
    };
    reader.readAsText(file);
  };

  const addMemory = () => {
    if (!memoryText.trim()) return;
    setState((prev) => ({ ...prev, memories: [memoryText.trim(), ...prev.memories] }));
    addLog('Memória operacional salva.');
    setMemoryText('');
  };

  return (
    <main style={styles.page}>
      <section style={styles.hero}>
        <div>
          <div style={styles.kicker}>AI FACTORY · CENTRAL REAL LOCAL</div>
          <h1 style={styles.title}>Orquestrador de Elite para Lovable e plataformas</h1>
          <p style={styles.subtitle}>
            O Lovable continua sendo o executor principal. A Factory prepara, revisa, divide e guarda os pacotes antes de gastar crédito.
          </p>
        </div>
        <div style={styles.badge}>LOCAL ATIVO</div>
      </section>

      <section style={styles.statsGrid}>
        <Stat title="Projetos" value={state.projects.length} note="cadastro local" />
        <Stat title="Missões abertas" value={stats.open} note="fila operacional" />
        <Stat title="Pacotes Lovable" value={stats.lovable} note="prontos para copiar" />
        <Stat title="Aprovação sensível" value={stats.sensitive} note="banco/login/RH/cliente" />
      </section>

      <section style={styles.gridTwo}>
        <div style={styles.card}>
          <h2 style={styles.cardTitle}>Orquestrador IA</h2>
          <p style={styles.muted}>Fale simples. A Factory transforma em pacote técnico por plataforma.</p>
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ex: corrigir layout mobile do dashboard TOPAC sem mexer no login, menus ou permissões..."
            style={styles.textarea}
          />
          <button onClick={generatePlan} style={styles.primaryButton}>Gerar plano e missões</button>
        </div>

        <div style={styles.card}>
          <h2 style={styles.cardTitle}>Memória Operacional</h2>
          <p style={styles.muted}>Guarde regras fixas para os próximos pacotes.</p>
          <textarea
            value={memoryText}
            onChange={(e) => setMemoryText(e.target.value)}
            placeholder="Ex: nunca reconstruir layout aprovado da TOPAC..."
            style={styles.textareaSmall}
          />
          <button onClick={addMemory} style={styles.secondaryButton}>Salvar memória</button>
          <div style={styles.memoryList}>
            {state.memories.slice(0, 5).map((m, i) => <div key={i} style={styles.memoryItem}>{m}</div>)}
          </div>
        </div>
      </section>

      <section style={styles.gridTwo}>
        <div style={styles.card}>
          <div style={styles.cardHeader}>
            <h2 style={styles.cardTitle}>Equipe de agentes</h2>
            <span style={styles.smallBadge}>{state.agents.length} ativos</span>
          </div>
          <div style={styles.list}>
            {state.agents.map((agent) => (
              <div key={agent.id} style={styles.agentRow}>
                <div>
                  <strong>{agent.name}</strong>
                  <p style={styles.rowText}>{agent.role}</p>
                </div>
                <span style={styles.platformPill}>{agent.platform}</span>
              </div>
            ))}
          </div>
        </div>

        <div style={styles.card}>
          <div style={styles.cardHeader}>
            <h2 style={styles.cardTitle}>Projetos conectados</h2>
            <span style={styles.smallBadge}>local-first</span>
          </div>
          <div style={styles.list}>
            {state.projects.map((project) => (
              <div key={project.id} style={styles.agentRow}>
                <div>
                  <strong>{project.name}</strong>
                  <p style={styles.rowText}>{project.area}</p>
                </div>
                <span style={styles.platformPill}>{project.status}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section style={styles.gridTwoWide}>
        <div style={styles.card}>
          <div style={styles.cardHeader}>
            <h2 style={styles.cardTitle}>Fila de missões</h2>
            <button onClick={exportBackup} style={styles.miniButton}>Exportar backup</button>
          </div>
          <div style={styles.listTall}>
            {state.missions.length === 0 && <p style={styles.muted}>Nenhuma missão ainda. Gere pelo Orquestrador.</p>}
            {state.missions.map((mission) => (
              <button key={mission.id} onClick={() => setSelectedMission(mission)} style={styles.missionRow}>
                <div style={{ textAlign: 'left' }}>
                  <strong>{mission.title}</strong>
                  <p style={styles.rowText}>{mission.objective}</p>
                </div>
                <div style={styles.missionTags}>
                  <span style={styles.platformPill}>{mission.platform}</span>
                  <span style={mission.risk === 'alto' ? styles.riskHigh : styles.risk}>{mission.risk}</span>
                  <span style={styles.platformPill}>{mission.status}</span>
                </div>
              </button>
            ))}
          </div>
        </div>

        <div style={styles.card}>
          <h2 style={styles.cardTitle}>Pacote técnico</h2>
          {!selectedMission ? (
            <p style={styles.muted}>Selecione uma missão para ver o pacote.</p>
          ) : (
            <div>
              <div style={styles.packageTop}>
                <span style={styles.platformPill}>{selectedMission.platform}</span>
                <span style={selectedMission.requiresApproval ? styles.riskHigh : styles.risk}>aprovação: {selectedMission.requiresApproval ? 'sim' : 'não'}</span>
              </div>
              <h3>{selectedMission.title}</h3>
              <p style={styles.muted}>{selectedMission.successCriteria}</p>
              <textarea readOnly value={selectedMission.prompt} style={styles.promptBox} />
              <div style={styles.actions}>
                <button onClick={() => copy(selectedMission.prompt).then(() => addLog('Prompt copiado.'))} style={styles.primaryButton}>Copiar prompt</button>
                <button onClick={() => updateMission(selectedMission.id, { status: 'aprovada' })} style={styles.secondaryButton}>Aprovar</button>
                <button onClick={() => updateMission(selectedMission.id, { status: 'concluída' })} style={styles.secondaryButton}>Concluir</button>
                <button onClick={() => splitMission(selectedMission)} style={styles.secondaryButton}>Dividir etapas</button>
              </div>
            </div>
          )}
        </div>
      </section>

      <section style={styles.card}>
        <div style={styles.cardHeader}>
          <h2 style={styles.cardTitle}>Logs do núcleo</h2>
          <label style={styles.miniButton}>
            Importar backup
            <input type="file" accept="application/json" onChange={(e) => e.target.files?.[0] && importBackup(e.target.files[0])} hidden />
          </label>
        </div>
        <div style={styles.logList}>
          {state.logs.map((log, i) => <div key={i} style={styles.logItem}>{log}</div>)}
        </div>
      </section>
    </main>
  );
}

function Stat({ title, value, note }: { title: string; value: number; note: string }) {
  return (
    <div style={styles.statCard}>
      <div style={styles.statValue}>{value}</div>
      <div style={styles.statTitle}>{title}</div>
      <div style={styles.muted}>{note}</div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  page: { minHeight: '100vh', background: 'radial-gradient(circle at top left, #172554 0, #020617 38%, #030712 100%)', color: '#e5e7eb', padding: 24, fontFamily: 'Inter, system-ui, Arial, sans-serif' },
  hero: { display: 'flex', justifyContent: 'space-between', gap: 24, alignItems: 'center', padding: 24, border: '1px solid rgba(148,163,184,.22)', borderRadius: 24, background: 'rgba(15,23,42,.72)', boxShadow: '0 24px 80px rgba(0,0,0,.32)', marginBottom: 20 },
  kicker: { color: '#38bdf8', fontSize: 12, fontWeight: 800, letterSpacing: 2, textTransform: 'uppercase' },
  title: { fontSize: 38, lineHeight: 1.05, margin: '10px 0', maxWidth: 820 },
  subtitle: { color: '#94a3b8', fontSize: 16, maxWidth: 780 },
  badge: { border: '1px solid rgba(34,197,94,.4)', background: 'rgba(34,197,94,.12)', color: '#86efac', padding: '10px 14px', borderRadius: 999, fontWeight: 800, fontSize: 12, whiteSpace: 'nowrap' },
  statsGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 14, marginBottom: 20 },
  statCard: { padding: 18, borderRadius: 18, background: 'rgba(15,23,42,.72)', border: '1px solid rgba(148,163,184,.18)' },
  statValue: { fontSize: 32, fontWeight: 900, color: '#fff' },
  statTitle: { fontWeight: 700, marginBottom: 4 },
  gridTwo: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 16, marginBottom: 16 },
  gridTwoWide: { display: 'grid', gridTemplateColumns: 'minmax(320px, .9fr) minmax(360px, 1.1fr)', gap: 16, marginBottom: 16 },
  card: { padding: 18, borderRadius: 22, background: 'rgba(15,23,42,.78)', border: '1px solid rgba(148,163,184,.18)', boxShadow: '0 18px 60px rgba(0,0,0,.22)' },
  cardHeader: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, marginBottom: 12 },
  cardTitle: { margin: 0, fontSize: 20 },
  muted: { color: '#94a3b8', fontSize: 13 },
  textarea: { width: '100%', minHeight: 150, marginTop: 12, marginBottom: 12, background: 'rgba(2,6,23,.65)', color: '#e5e7eb', border: '1px solid rgba(148,163,184,.22)', borderRadius: 14, padding: 14, outline: 'none', resize: 'vertical' },
  textareaSmall: { width: '100%', minHeight: 82, marginTop: 12, marginBottom: 12, background: 'rgba(2,6,23,.65)', color: '#e5e7eb', border: '1px solid rgba(148,163,184,.22)', borderRadius: 14, padding: 14, outline: 'none', resize: 'vertical' },
  primaryButton: { border: 0, borderRadius: 12, padding: '11px 14px', background: 'linear-gradient(135deg, #2563eb, #7c3aed)', color: '#fff', fontWeight: 800, cursor: 'pointer' },
  secondaryButton: { border: '1px solid rgba(148,163,184,.22)', borderRadius: 12, padding: '10px 12px', background: 'rgba(30,41,59,.8)', color: '#e5e7eb', fontWeight: 700, cursor: 'pointer' },
  miniButton: { border: '1px solid rgba(148,163,184,.22)', borderRadius: 10, padding: '8px 10px', background: 'rgba(30,41,59,.8)', color: '#e5e7eb', fontWeight: 700, cursor: 'pointer', fontSize: 12 },
  list: { display: 'grid', gap: 10 },
  listTall: { display: 'grid', gap: 10, maxHeight: 560, overflow: 'auto', paddingRight: 4 },
  agentRow: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, padding: 12, borderRadius: 14, background: 'rgba(2,6,23,.42)', border: '1px solid rgba(148,163,184,.12)' },
  missionRow: { width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, padding: 12, borderRadius: 14, background: 'rgba(2,6,23,.42)', border: '1px solid rgba(148,163,184,.12)', color: '#e5e7eb', cursor: 'pointer' },
  rowText: { color: '#94a3b8', fontSize: 12, margin: '3px 0 0' },
  platformPill: { border: '1px solid rgba(56,189,248,.28)', background: 'rgba(56,189,248,.1)', color: '#7dd3fc', borderRadius: 999, padding: '5px 8px', fontSize: 11, fontWeight: 800, whiteSpace: 'nowrap' },
  smallBadge: { border: '1px solid rgba(148,163,184,.22)', borderRadius: 999, padding: '5px 8px', color: '#cbd5e1', fontSize: 11 },
  risk: { border: '1px solid rgba(234,179,8,.28)', background: 'rgba(234,179,8,.1)', color: '#fde68a', borderRadius: 999, padding: '5px 8px', fontSize: 11, fontWeight: 800 },
  riskHigh: { border: '1px solid rgba(248,113,113,.34)', background: 'rgba(248,113,113,.14)', color: '#fecaca', borderRadius: 999, padding: '5px 8px', fontSize: 11, fontWeight: 800 },
  missionTags: { display: 'flex', flexWrap: 'wrap', justifyContent: 'flex-end', gap: 6 },
  packageTop: { display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 10 },
  promptBox: { width: '100%', minHeight: 330, background: '#020617', color: '#dbeafe', border: '1px solid rgba(148,163,184,.18)', borderRadius: 14, padding: 14, outline: 'none', resize: 'vertical', fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace', fontSize: 12, lineHeight: 1.55 },
  actions: { display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 12 },
  memoryList: { display: 'grid', gap: 8, marginTop: 12 },
  memoryItem: { padding: 10, borderRadius: 12, background: 'rgba(2,6,23,.42)', color: '#cbd5e1', fontSize: 12 },
  logList: { display: 'grid', gap: 8, maxHeight: 260, overflow: 'auto' },
  logItem: { padding: 10, borderRadius: 12, background: 'rgba(2,6,23,.42)', color: '#cbd5e1', fontSize: 12 },
};
