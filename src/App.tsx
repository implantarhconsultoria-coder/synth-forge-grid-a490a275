import React, { useEffect, useMemo, useState } from 'react';

type Intent = 'criar' | 'alterar' | 'corrigir' | 'automatizar' | 'analisar';
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

interface Execution {
  id: string;
  title: string;
  project: string;
  status: 'sucesso' | 'fila' | 'atenção';
  time: string;
}

interface AppState {
  missions: Mission[];
  executions: Execution[];
  logs: string[];
}

const STORAGE_KEY = 'ai_factory_single_command_center_v3';
const now = () => new Date().toISOString();
const uid = () => Math.random().toString(36).slice(2, 10);

const initialState: AppState = {
  missions: [],
  executions: [
    { id: uid(), title: 'feat(topac): novo cliente inteligente no faturamento', project: 'TOPAC', status: 'sucesso', time: 'agora' },
    { id: uid(), title: 'core(factory): autopilot pro + watchdog', project: 'FACTORY', status: 'sucesso', time: 'recente' },
    { id: uid(), title: 'squad(factory): agentes operacionais', project: 'FACTORY', status: 'sucesso', time: 'recente' },
  ],
  logs: ['Modo missão única ativado', 'Worker operacional', 'GitHub conectado', 'Autopilot PRO pronto'],
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
    ? 'corrigir'
    : /automat|rotina|sozinh|fila|webhook|worker/.test(t)
      ? 'automatizar'
      : /criar|novo|do zero|projeto novo|app novo|sistema novo/.test(t)
        ? 'criar'
        : /analis|verificar|auditar|monitorar|diagnóstico|diagnostico/.test(t)
          ? 'analisar'
          : 'alterar';

  const target = /topac|faturamento|rh/.test(t)
    ? 'TOPAC RH'
    : /pulzr|fitness|corrida/.test(t)
      ? 'PULZR'
      : /louvor|flow|cifra|culto|ensaio/.test(t)
        ? 'Flow Louvor'
        : /nexus|lead|comercial/.test(t)
          ? 'Nexus Lead IA'
          : 'AI Factory';

  const risk: Risk = /login|senha|permiss|banco|supabase|financeiro|salário|salario|excluir|produção|producao|pagamento/.test(t)
    ? 'alto'
    : /api|integra|github|deploy|worker|automação|automacao/.test(t)
      ? 'médio'
      : 'baixo';

  return {
    intent,
    target,
    risk,
    plan: [
      `Entender comando como: ${intent}`,
      `Usar projeto alvo: ${target}`,
      risk === 'alto' ? 'Pedir aprovação antes de mexer em área sensível' : 'Executar alteração incremental segura',
      'Registrar execução, logs e checklist final',
    ],
  };
}

export default function App() {
  const [state, setState] = useState<AppState>(() => loadState());
  const [command, setCommand] = useState('');
  const [activeMission, setActiveMission] = useState<Mission | null>(null);

  useEffect(() => {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }, [state]);

  const stats = useMemo(() => ({
    fila: state.missions.filter(m => m.status === 'fila' || m.status === 'processando').length,
    execucoes: state.executions.length + 124,
    aprovacao: state.missions.filter(m => m.status === 'aguardando_aprovacao').length,
    uptime: '99.98%',
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
      title: `${mission.intent}: ${mission.command.slice(0, 78)}`,
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
          <a className="active">Missão</a>
          <a>Fila</a>
          <a>Logs</a>
          <a>Configurações</a>
        </nav>
        <div className="worker-card"><span>WORKER</span><strong>● ONLINE</strong><small>Autopilot PRO · Production</small></div>
      </aside>

      <section className="content">
        <header className="topbar">
          <div><h1>AI Factory by ImplantaRH ConsultoriaPRO</h1><p>Um comando. A Factory entende e decide o caminho.</p></div>
          <div className="system-ok">● SISTEMA OPERACIONAL</div>
        </header>

        <section className="status-grid">
          <Status title="WORKER" value="ONLINE" note="100%" green />
          <Status title="GITHUB" value="CONECTADO" note="100%" green />
          <Status title="FILA" value={String(stats.fila)} note="pendentes" />
          <Status title="EXECUÇÕES" value={String(stats.execucoes)} note="hoje" purple />
          <Status title="APROVAÇÃO" value={String(stats.aprovacao)} note="sensíveis" />
          <Status title="UPTIME" value={stats.uptime} note="estável" green />
        </section>

        <section className="mission-box">
          <div className="mission-head"><span>🚀</span><div><h2>Iniciar missão</h2><p>Crie projeto, corrija erro, altere layout ou automatize. Sem escolher módulo antes.</p></div></div>
          <textarea value={command} onChange={e => setCommand(e.target.value)} placeholder="Ex: no faturamento da TOPAC, criar cadastro inteligente que leia PDF/foto e preencha o cliente sozinho..." />
          <button onClick={createMission}>Enviar missão</button>
        </section>

        <section className="main-grid">
          <div className="panel current-mission">
            <div className="panel-head"><h2>Missão atual</h2><span className="pill">Nexus Command</span></div>
            {!activeMission ? <p className="muted">Digite um comando acima. A Factory classifica e prepara a execução.</p> : (
              <div className="mission-detail">
                <h3>{activeMission.target}</h3>
                <p>{activeMission.command}</p>
                <div className="tags"><span>{activeMission.intent}</span><span>{activeMission.risk}</span><span>{activeMission.status}</span></div>
                <ul>{activeMission.plan.map((p, i) => <li key={i}>{p}</li>)}</ul>
                <button onClick={() => runMission(activeMission)} disabled={activeMission.status === 'executado'}>{activeMission.risk === 'alto' ? 'Aprovar e executar' : 'Executar missão'}</button>
              </div>
            )}
          </div>

          <div className="panel">
            <div className="panel-head"><h2>Fila</h2><span className="pill">{state.missions.length}</span></div>
            <div className="mission-list">
              {state.missions.length === 0 && <p className="muted">Sem missões na fila.</p>}
              {state.missions.slice(0, 6).map(m => <button key={m.id} onClick={() => setActiveMission(m)}><b>{m.target}</b><span>{m.intent} · {m.status}</span></button>)}
            </div>
          </div>
        </section>

        <section className="panel">
          <div className="panel-head"><h2>Execuções recentes</h2></div>
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

const css = `
*{box-sizing:border-box}body{margin:0;background:#020611;color:#f8fafc;font-family:Inter,system-ui,Arial,sans-serif}.factory-page{min-height:100vh;display:grid;grid-template-columns:260px 1fr;background:radial-gradient(circle at top left,#14244c,#020611 42%,#030712)}.sidebar{border-right:1px solid rgba(148,163,184,.16);padding:26px 20px;display:flex;flex-direction:column;gap:26px;background:rgba(2,6,23,.68)}.brand{display:flex;gap:12px;align-items:center}.brand-icon{width:38px;height:38px;border:1px solid #38bdf8;border-radius:12px;display:grid;place-items:center;color:#a855f7}.brand strong{display:block;letter-spacing:.06em}.brand span{display:block;color:#38bdf8;font-size:11px;letter-spacing:.16em}nav{display:grid;gap:9px}nav a{padding:12px 14px;border-radius:12px;color:#cbd5e1;text-decoration:none}.active{background:linear-gradient(90deg,rgba(124,58,237,.35),rgba(14,165,233,.08));border:1px solid rgba(168,85,247,.42);color:#e9d5ff}.worker-card{margin-top:auto;border:1px solid rgba(34,197,94,.5);background:rgba(22,163,74,.1);border-radius:16px;padding:16px;display:grid;gap:8px}.worker-card span{font-size:12px;letter-spacing:.16em;color:#86efac}.worker-card strong{color:#22c55e}.worker-card small{color:#cbd5e1}.content{padding:28px 34px 42px}.topbar{display:flex;align-items:flex-start;justify-content:space-between;gap:18px;margin-bottom:18px}.topbar h1{font-size:34px;margin:0}.topbar p{margin:4px 0;color:#94a3b8}.system-ok{border:1px solid rgba(34,197,94,.4);background:rgba(34,197,94,.12);color:#4ade80;border-radius:12px;padding:13px 18px;font-weight:900;font-size:13px}.status-grid{display:grid;grid-template-columns:repeat(6,1fr);border:1px solid rgba(148,163,184,.18);border-radius:16px;background:rgba(15,23,42,.72);padding:18px;margin-bottom:18px}.status-card{border-right:1px solid rgba(148,163,184,.16);padding:0 16px}.status-card:last-child{border-right:0}.status-card span{display:block;color:#94a3b8;font-size:11px;letter-spacing:.18em}.status-card strong{display:block;font-size:20px;color:#38bdf8;margin:8px 0 3px}.status-card small{color:#cbd5e1;text-transform:uppercase;font-size:10px}.green{color:#22c55e!important}.purple{color:#a855f7!important}.mission-box{border:1px solid rgba(56,189,248,.26);background:linear-gradient(135deg,rgba(14,165,233,.14),rgba(124,58,237,.12));border-radius:22px;padding:26px;margin-bottom:18px}.mission-head{display:flex;gap:14px;align-items:center}.mission-head span{font-size:38px}.mission-head h2{margin:0;font-size:28px}.mission-head p{margin:4px 0 16px;color:#94a3b8}.mission-box textarea{width:100%;min-height:150px;background:#06101f;border:1px solid rgba(148,163,184,.22);border-radius:16px;color:#f8fafc;padding:18px;outline:none;resize:vertical;font-size:16px}.mission-box button,.mission-detail button{margin-top:14px;border:0;border-radius:14px;padding:14px 20px;background:linear-gradient(135deg,#38bdf8,#8b5cf6);color:white;font-weight:900;cursor:pointer}.main-grid{display:grid;grid-template-columns:1.05fr .95fr;gap:18px;margin-bottom:18px}.panel{border:1px solid rgba(148,163,184,.18);background:rgba(15,23,42,.72);border-radius:18px;padding:20px}.panel-head{display:flex;align-items:center;justify-content:space-between;gap:12px;margin-bottom:16px}.panel h2{margin:0}.current-mission{min-height:320px}.mission-detail p,.muted{color:#94a3b8}.tags{display:flex;flex-wrap:wrap;gap:8px;margin:12px 0}.tags span,.pill{border:1px solid rgba(56,189,248,.28);background:rgba(56,189,248,.1);color:#7dd3fc;border-radius:999px;padding:6px 9px;font-size:11px;font-weight:900}.mission-detail li{color:#cbd5e1;margin-bottom:7px}.mission-list{display:grid;gap:10px}.mission-list button{border:1px solid rgba(148,163,184,.14);background:#06101f;color:#e5e7eb;text-align:left;border-radius:14px;padding:14px;display:grid;gap:4px;cursor:pointer}.mission-list span{color:#94a3b8;font-size:12px}.exec-list{display:grid}.exec-row{display:grid;grid-template-columns:36px 1fr 100px 90px 70px;align-items:center;gap:12px;padding:14px 0;border-top:1px solid rgba(148,163,184,.14)}.check{width:24px;height:24px;border-radius:999px;background:#22c55e;color:#052e16;display:grid;place-items:center;font-weight:900}.exec-row p{margin:0}.exec-row b{background:#172554;color:#93c5fd;border-radius:8px;padding:6px 8px;text-align:center;font-size:12px}.exec-row strong{background:rgba(34,197,94,.14);color:#4ade80;border-radius:999px;padding:6px 8px;text-align:center;font-size:12px}.exec-row time{color:#cbd5e1}@media(max-width:900px){.factory-page{display:block}.sidebar{display:none}.content{padding:18px}.topbar{display:grid}.status-grid{grid-template-columns:repeat(2,1fr)}.status-card{border-right:0;border-bottom:1px solid rgba(148,163,184,.12);padding:12px}.main-grid{grid-template-columns:1fr}.exec-row{grid-template-columns:28px 1fr}.exec-row b,.exec-row strong,.exec-row time{display:none}}`;
