import React, { useEffect, useMemo, useState } from 'react';

type Intent = 'criar_projeto' | 'alterar_projeto' | 'corrigir_erro' | 'automatizar' | 'analisar';
type Risk = 'baixo' | 'médio' | 'alto';
type Status = 'fila' | 'processando' | 'aguardando_aprovacao' | 'executado';

interface Mission {
  id: string;
  command: string;
  intent: Intent;
  target: string;
  risk: Risk;
  status: Status;
  createdAt: string;
  plan: string[];
}

interface Project {
  id: string;
  name: string;
  label: string;
  status: 'online' | 'atenção' | 'build';
  progress: number;
}

interface Execution {
  id: string;
  title: string;
  project: string;
  status: 'sucesso' | 'fila' | 'atenção';
  time: string;
}

interface AppState {
  missions: Mission[];
  projects: Project[];
  executions: Execution[];
  logs: string[];
}

const STORAGE_KEY = 'ai_factory_unified_mission_center_v2';

const now = () => new Date().toISOString();
const uid = () => Math.random().toString(36).slice(2, 10);

const initialState: AppState = {
  missions: [],
  projects: [
    { id: 'topac', name: 'TOPAC RH', label: 'Projeto externo conectado', status: 'online', progress: 82 },
    { id: 'pulzr', name: 'PULZR', label: 'Projeto fitness', status: 'online', progress: 23 },
    { id: 'flow', name: 'Flow Louvor', label: 'Assistente musical/louvor', status: 'online', progress: 31 },
    { id: 'nexus', name: 'Nexus Lead IA', label: 'Motor comercial', status: 'build', progress: 54 },
  ],
  executions: [
    { id: uid(), title: 'feat(topac): novo cliente inteligente no faturamento', project: 'TOPAC', status: 'sucesso', time: 'agora' },
    { id: uid(), title: 'core(factory): autopilot pro + watchdog', project: 'FACTORY', status: 'sucesso', time: 'recente' },
    { id: uid(), title: 'squad(factory): agentes operacionais', project: 'FACTORY', status: 'sucesso', time: 'recente' },
  ],
  logs: ['Núcleo IA online · modo missão única ativado', 'Worker operacional · GitHub conectado', 'Autopilot PRO pronto para fila'],
};

function loadState(): AppState {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    return raw ? { ...initialState, ...JSON.parse(raw) } : initialState;
  } catch {
    return initialState;
  }
}

function classify(command: string): { intent: Intent; target: string; risk: Risk; plan: string[] } {
  const t = command.toLowerCase();
  const intent: Intent = /corrigir|erro|bug|falha|quebrou|arruma/.test(t)
    ? 'corrigir_erro'
    : /automat|rotina|sozinh|fila|webhook|worker/.test(t)
      ? 'automatizar'
      : /criar|novo|do zero|projeto novo|app novo|sistema novo/.test(t)
        ? 'criar_projeto'
        : /analis|verificar|auditar|monitorar|diagnóstico|diagnostico/.test(t)
          ? 'analisar'
          : 'alterar_projeto';

  const target = /topac|faturamento|rh/.test(t)
    ? 'TOPAC RH'
    : /pulzr|fitness|corrida/.test(t)
      ? 'PULZR'
      : /louvor|flow|cifra|culto|ensaio/.test(t)
        ? 'Flow Louvor'
        : /nexus|lead|comercial/.test(t)
          ? 'Nexus Lead IA'
          : 'AI Factory';

  const risk: Risk = /login|senha|permiss|banco|supabase|financeiro|salário|salario|excluir|produção|producao|pagamento/.test(t) ? 'alto' : /api|integra|github|deploy|worker|automação|automacao/.test(t) ? 'médio' : 'baixo';

  const plan = [
    `Identificar intenção: ${intent.replace('_', ' ')}`,
    `Detectar projeto/módulo alvo: ${target}`,
    risk === 'alto' ? 'Pausar execução sensível e pedir aprovação humana' : 'Executar alteração incremental segura',
    'Gerar registro de execução e checklist final',
  ];
  return { intent, target, risk, plan };
}

export default function App() {
  const [state, setState] = useState<AppState>(() => loadState());
  const [command, setCommand] = useState('');
  const [activeMission, setActiveMission] = useState<Mission | null>(null);

  useEffect(() => {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }, [state]);

  const stats = useMemo(() => ({
    worker: 100,
    github: 100,
    fila: state.missions.filter(m => m.status === 'fila' || m.status === 'processando').length,
    execucoes: state.executions.length + 124,
    uptime: '2d 14h',
  }), [state]);

  const createMission = () => {
    if (!command.trim()) return;
    const classified = classify(command);
    const mission: Mission = {
      id: uid(),
      command: command.trim(),
      ...classified,
      status: classified.risk === 'alto' ? 'aguardando_aprovacao' : 'fila',
      createdAt: now(),
    };
    setState(prev => ({
      ...prev,
      missions: [mission, ...prev.missions],
      logs: [`Missão reconhecida · ${mission.target} · ${mission.intent}`, ...prev.logs].slice(0, 80),
    }));
    setActiveMission(mission);
    setCommand('');
  };

  const runMission = (mission: Mission) => {
    const updated: Mission = { ...mission, status: 'executado' };
    const execution: Execution = {
      id: uid(),
      title: `${mission.intent.replace('_', ' ')}: ${mission.command.slice(0, 70)}`,
      project: mission.target,
      status: 'sucesso',
      time: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
    };
    setState(prev => ({
      ...prev,
      missions: prev.missions.map(m => m.id === mission.id ? updated : m),
      executions: [execution, ...prev.executions].slice(0, 12),
      logs: [`Execução registrada · ${mission.target}`, ...prev.logs].slice(0, 80),
    }));
    setActiveMission(updated);
  };

  return (
    <main className="factory-page">
      <aside className="sidebar">
        <div className="brand">
          <div className="brand-icon">◇</div>
          <div><strong>AI FACTORY</strong><span>by ImplantaRH PRO</span></div>
        </div>
        <nav>
          <a className="active">Dashboard</a>
          <a>Missões</a>
          <a>Fila de Tarefas</a>
          <a>Execuções</a>
          <a>Logs</a>
          <a>Agents</a>
          <a>Configurações</a>
        </nav>
        <div className="worker-card"><span>WORKER STATUS</span><strong>● ONLINE</strong><small>Autopilot PRO · Production</small></div>
      </aside>

      <section className="content">
        <header className="topbar">
          <div><h1>Dashboard</h1><p>Centro único de missão da AI Factory</p></div>
          <div className="system-ok">● SISTEMA OPERACIONAL</div>
          <div className="clock">{new Date().toLocaleTimeString('pt-BR')}<small>Horário de Brasília</small></div>
        </header>

        <section className="status-grid">
          <Status title="WORKER" value="ONLINE" note={`${stats.worker}%`} green />
          <Status title="GITHUB" value="CONECTADO" note={`${stats.github}%`} green />
          <Status title="FILA" value={String(stats.fila)} note="pendentes" />
          <Status title="EXECUÇÕES" value={String(stats.execucoes)} note="hoje" purple />
          <Status title="UPTIME" value={stats.uptime} note="99.98%" />
        </section>

        <section className="mission-box">
          <div className="mission-head"><span>🚀</span><div><h2>Iniciar missão</h2><p>Digite qualquer comando. A Factory reconhece se é criar, corrigir, alterar, automatizar ou analisar.</p></div></div>
          <textarea value={command} onChange={e => setCommand(e.target.value)} placeholder="Ex: no faturamento da TOPAC, criar cadastro inteligente de clientes que leia PDF/foto e preencha sozinho..." />
          <button onClick={createMission}>Enviar ao núcleo IA</button>
        </section>

        <section className="ok-alert"><strong>✓ Todos os sistemas operacionais</strong><span>Worker online, GitHub conectado e missão única ativada.</span></section>

        <section className="two-cols">
          <div className="panel">
            <div className="panel-head"><h2>Projetos ativos</h2><button>Ver todos</button></div>
            <div className="project-grid">
              {state.projects.slice(0, 4).map(project => <ProjectCard key={project.id} project={project} />)}
            </div>
          </div>
          <div className="panel">
            <div className="panel-head"><h2>Missão atual</h2><span className="pill">Nexus Command</span></div>
            {!activeMission ? <p className="muted">Envie um comando para a Factory transformar em execução.</p> : (
              <div className="mission-detail">
                <h3>{activeMission.target}</h3>
                <p>{activeMission.command}</p>
                <div className="tags"><span>{activeMission.intent}</span><span>{activeMission.risk}</span><span>{activeMission.status}</span></div>
                <ul>{activeMission.plan.map((p, i) => <li key={i}>{p}</li>)}</ul>
                <button onClick={() => runMission(activeMission)} disabled={activeMission.status === 'executado'}>{activeMission.risk === 'alto' ? 'Aprovar e executar' : 'Executar missão'}</button>
              </div>
            )}
          </div>
        </section>

        <section className="panel">
          <div className="panel-head"><h2>Execuções recentes</h2><button>Ver todas</button></div>
          <div className="exec-list">
            {state.executions.map(item => <div className="exec-row" key={item.id}><span className="check">✓</span><p>{item.title}</p><b>{item.project}</b><strong>{item.status}</strong><time>{item.time}</time></div>)}
          </div>
        </section>
      </section>

      <style>{css}</style>
    </main>
  );
}

function Status({ title, value, note, green, purple }: { title: string; value: string; note: string; green?: boolean; purple?: boolean }) {
  return <div className="status-card"><span>{title}</span><strong className={green ? 'green' : purple ? 'purple' : ''}>{value}</strong><small>{note}</small></div>;
}

function ProjectCard({ project }: { project: Project }) {
  return <div className="project-card"><div><span>{project.label}</span><i>● {project.status}</i></div><h3>{project.name}</h3><p>Progresso</p><div className="bar"><em style={{ width: `${project.progress}%` }} /></div><small>{project.progress}%</small></div>;
}

const css = `
*{box-sizing:border-box}body{margin:0;background:#020611;color:#f8fafc;font-family:Inter,system-ui,Arial,sans-serif}.factory-page{min-height:100vh;display:grid;grid-template-columns:280px 1fr;background:radial-gradient(circle at top left,#122145,#020611 42%,#030712)}.sidebar{border-right:1px solid rgba(148,163,184,.16);padding:26px 20px;display:flex;flex-direction:column;gap:26px;background:rgba(2,6,23,.68)}.brand{display:flex;gap:12px;align-items:center}.brand-icon{width:36px;height:36px;border:1px solid #38bdf8;border-radius:10px;display:grid;place-items:center;color:#a855f7}.brand strong{display:block;letter-spacing:.08em}.brand span{display:block;color:#38bdf8;font-size:12px;letter-spacing:.22em}nav{display:grid;gap:9px}nav a{padding:12px 14px;border-radius:12px;color:#cbd5e1;text-decoration:none}.active{background:linear-gradient(90deg,rgba(124,58,237,.35),rgba(14,165,233,.08));border:1px solid rgba(168,85,247,.42);color:#e9d5ff}.worker-card{margin-top:auto;border:1px solid rgba(34,197,94,.5);background:rgba(22,163,74,.1);border-radius:16px;padding:16px;display:grid;gap:8px}.worker-card span{font-size:12px;letter-spacing:.16em;color:#86efac}.worker-card strong{color:#22c55e}.worker-card small{color:#cbd5e1}.content{padding:26px 34px 40px}.topbar{display:flex;align-items:flex-start;justify-content:space-between;gap:18px;margin-bottom:18px}.topbar h1{font-size:32px;margin:0}.topbar p{margin:4px 0;color:#94a3b8}.system-ok{border:1px solid rgba(34,197,94,.4);background:rgba(34,197,94,.12);color:#4ade80;border-radius:12px;padding:13px 18px;font-weight:900;font-size:13px}.clock{border:1px solid rgba(148,163,184,.18);background:rgba(15,23,42,.85);border-radius:12px;padding:12px 18px;text-align:center;font-weight:900}.clock small{display:block;color:#94a3b8;font-weight:500;font-size:11px}.status-grid{display:grid;grid-template-columns:repeat(5,1fr);border:1px solid rgba(148,163,184,.18);border-radius:16px;background:rgba(15,23,42,.72);padding:18px;margin-bottom:18px}.status-card{border-right:1px solid rgba(148,163,184,.16);padding:0 18px}.status-card:last-child{border-right:0}.status-card span{display:block;color:#94a3b8;font-size:12px;letter-spacing:.18em}.status-card strong{display:block;font-size:22px;color:#38bdf8;margin:8px 0 3px}.status-card small{color:#cbd5e1;text-transform:uppercase;font-size:11px}.green{color:#22c55e!important}.purple{color:#a855f7!important}.mission-box{border:1px solid rgba(56,189,248,.26);background:linear-gradient(135deg,rgba(14,165,233,.12),rgba(124,58,237,.10));border-radius:18px;padding:22px;margin-bottom:18px}.mission-head{display:flex;gap:14px;align-items:center}.mission-head span{font-size:34px}.mission-head h2{margin:0;font-size:26px}.mission-head p{margin:4px 0 14px;color:#94a3b8}.mission-box textarea{width:100%;min-height:116px;background:#06101f;border:1px solid rgba(148,163,184,.22);border-radius:14px;color:#f8fafc;padding:16px;outline:none;resize:vertical;font-size:15px}.mission-box button,.mission-detail button{margin-top:12px;border:0;border-radius:12px;padding:13px 18px;background:linear-gradient(135deg,#38bdf8,#8b5cf6);color:white;font-weight:900;cursor:pointer}.ok-alert{display:grid;gap:4px;border:1px solid rgba(34,197,94,.45);background:rgba(21,128,61,.18);border-radius:16px;padding:16px 20px;margin-bottom:18px}.ok-alert span{color:#cbd5e1}.two-cols{display:grid;grid-template-columns:1.25fr .75fr;gap:18px;margin-bottom:18px}.panel{border:1px solid rgba(148,163,184,.18);background:rgba(15,23,42,.72);border-radius:18px;padding:20px}.panel-head{display:flex;align-items:center;justify-content:space-between;gap:12px;margin-bottom:16px}.panel h2{margin:0}.panel button{border:1px solid rgba(148,163,184,.22);background:#0f172a;color:#f8fafc;border-radius:10px;padding:9px 12px;font-weight:800}.project-grid{display:grid;grid-template-columns:repeat(2,1fr);gap:14px}.project-card{border:1px solid rgba(148,163,184,.18);background:#060d1b;border-radius:16px;padding:18px;position:relative}.project-card div:first-child{display:flex;justify-content:space-between;gap:10px;color:#94a3b8;font-size:12px;text-transform:uppercase}.project-card i{color:#4ade80;font-style:normal;text-transform:none}.project-card h3{font-size:24px;margin:18px 0}.project-card p{color:#94a3b8;margin-bottom:8px}.bar{height:10px;background:#1e293b;border-radius:999px;overflow:hidden}.bar em{display:block;height:100%;background:linear-gradient(90deg,#38bdf8,#8b5cf6)}.project-card small{position:absolute;right:18px;bottom:16px}.mission-detail p,.muted{color:#94a3b8}.tags{display:flex;flex-wrap:wrap;gap:8px;margin:12px 0}.tags span,.pill{border:1px solid rgba(56,189,248,.28);background:rgba(56,189,248,.1);color:#7dd3fc;border-radius:999px;padding:6px 9px;font-size:11px;font-weight:900}.mission-detail li{color:#cbd5e1;margin-bottom:7px}.exec-list{display:grid}.exec-row{display:grid;grid-template-columns:36px 1fr 90px 90px 70px;align-items:center;gap:12px;padding:14px 0;border-top:1px solid rgba(148,163,184,.14)}.check{width:24px;height:24px;border-radius:999px;background:#22c55e;color:#052e16;display:grid;place-items:center;font-weight:900}.exec-row p{margin:0}.exec-row b{background:#172554;color:#93c5fd;border-radius:8px;padding:6px 8px;text-align:center;font-size:12px}.exec-row strong{background:rgba(34,197,94,.14);color:#4ade80;border-radius:999px;padding:6px 8px;text-align:center;font-size:12px}.exec-row time{color:#cbd5e1}@media(max-width:900px){.factory-page{display:block}.sidebar{display:none}.content{padding:18px}.topbar{display:grid}.status-grid{grid-template-columns:repeat(2,1fr)}.status-card{border-right:0;border-bottom:1px solid rgba(148,163,184,.12);padding:12px}.two-cols,.project-grid{grid-template-columns:1fr}.exec-row{grid-template-columns:28px 1fr}.exec-row b,.exec-row strong,.exec-row time{display:none}}`;
