import React, { useEffect, useMemo, useState } from 'react';

type MissionStatus = 'fila' | 'processando' | 'concluida' | 'parcial' | 'falha' | 'worker_offline';
type MissionMode = 'auditoria' | 'correcao' | 'revalidacao';
type MissionResult = { status: 'corrigido' | 'parcial' | 'falha'; fixed: string[]; pending: string[]; failed: string[]; files: string[]; next: string[]; finishedAt: string; };
type Mission = { id: string; project: string; command: string; status: MissionStatus; createdAt: string; mode?: MissionMode; result?: MissionResult; workerTaskId?: string; };
type Log = { time: string; level: 'INFO' | 'WARN' | 'OK' | 'ERROR'; text: string };
type Analysis = { project: string; title: string; answer: string; prepared: string[]; pending: string[]; failed: string[]; command: string; mode: MissionMode; };

declare global { interface Window { __FACTORY_WORKER_URL__?: string; } }

const STORE = 'ai_factory_real_worker_v1';
const DEFAULT_WORKER_URL = 'http://localhost:8787';
const uid = () => Math.random().toString(36).slice(2, 10);
const time = () => new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
const n = (text: string) => text.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
const workerUrl = () => window.__FACTORY_WORKER_URL__ || localStorage.getItem('FACTORY_WORKER_URL') || DEFAULT_WORKER_URL;

function detectProject(text: string) {
  const t = n(text);
  if (t.includes('mec') || t.includes('ponto') || t.includes('abaste')) return 'App dos Mecânicos (TOPAC)';
  if (t.includes('nexus') || t.includes('lead')) return 'NEXUS LEAD IA';
  if (t.includes('document') || t.includes('epi') || t.includes('recibo')) return 'Documentos ImplantaRH';
  return 'AI Factory / Doctor PRO';
}

function analyzeRequest(text: string): Analysis {
  const t = n(text);
  const project = detectProject(text);
  const isLunch = t.includes('almoco') || t.includes('intervalo') || t.includes('refeicao');
  const isEntryExit = t.includes('entrada') || t.includes('saida') || t.includes('retorno');
  if (project.includes('Mecânicos') && isLunch) {
    return { project, title: 'Análise específica — intervalo de almoço', answer: 'Pergunta específica reconhecida: saída e entrada do almoço no App dos Mecânicos. A correção real deve verificar/implementar SAÍDA ALMOÇO e RETORNO ALMOÇO, com gravação no banco e reflexo no relatório.', prepared: ['Pedido específico identificado: almoço/intervalo', 'Projeto identificado: App dos Mecânicos', 'Fluxo esperado: entrada, saída almoço, retorno almoço e saída final'], pending: ['Verificar se existem botões de saída almoço e retorno almoço', 'Verificar se o banco aceita tipos de batida de almoço', 'Verificar relatório/fechamento do intervalo', 'Testar no mobile publicado'], failed: [], command: 'CORREÇÃO REAL — App dos Mecânicos / Ponto: verificar e implementar, se faltar, os eventos de SAÍDA ALMOÇO e RETORNO ALMOÇO no fluxo de ponto. Garantir botões mobile, gravação no banco, relatório de ponto e validação de jornada. Não marcar como pronto sem teste real.', mode: 'correcao' };
  }
  if (project.includes('Mecânicos') && isEntryExit) {
    return { project, title: 'Análise específica — entrada e saída', answer: 'Pergunta específica reconhecida: batidas de ponto. Validar botões de entrada, saída e eventos intermediários.', prepared: ['Pedido de ponto identificado', 'Projeto identificado: App dos Mecânicos'], pending: ['Validar botões de entrada/saída', 'Validar gravação', 'Validar relatório'], failed: [], command: 'AUDITORIA REAL — App dos Mecânicos / Ponto: validar botões de entrada, saída, saída almoço e retorno almoço, gravação no banco e exibição no relatório.', mode: 'auditoria' };
  }
  return { project, title: `Análise — ${project}`, answer: 'Análise geral criada. A missão será enviada ao worker real. Se o worker estiver offline, o sistema deve avisar e não fingir execução.', prepared: ['Projeto identificado', 'Missão estruturada', 'Status pronto bloqueado sem validação'], pending: ['Enviar para worker real', 'Validar retorno da fila', 'Checar logs reais'], failed: [], command: `AUDITORIA REAL — ${project}: validar fluxo principal, versão publicada, gravação, erros reais e gerar correção dos itens pendentes. Pedido original: ${text}`, mode: 'auditoria' };
}

function load() { try { return JSON.parse(localStorage.getItem(STORE) || '{}'); } catch { return {}; } }

export default function App() {
  const saved = load();
  const [command, setCommand] = useState('');
  const [analysis, setAnalysis] = useState<Analysis | null>(saved.analysis || null);
  const [missions, setMissions] = useState<Mission[]>(saved.missions || []);
  const [logs, setLogs] = useState<Log[]>(saved.logs || [{ time: time(), level: 'INFO', text: 'Factory aguardando worker real' }]);
  const [active, setActive] = useState<Mission | null>(saved.active || null);
  const [notice, setNotice] = useState<string | null>(null);
  const [workerOnline, setWorkerOnline] = useState(false);

  useEffect(() => { localStorage.setItem(STORE, JSON.stringify({ analysis, missions, logs, active })); }, [analysis, missions, logs, active]);

  const addLog = (level: Log['level'], text: string) => setLogs(prev => [{ time: time(), level, text }, ...prev].slice(0, 100));
  const stats = useMemo(() => ({ fila: missions.filter(m => m.status === 'fila' || m.status === 'processando').length, concluidas: missions.filter(m => ['concluida', 'parcial'].includes(m.status)).length, falhas: missions.filter(m => m.status === 'falha' || m.status === 'worker_offline').length }), [missions]);

  const syncWorker = async () => {
    try {
      const res = await fetch(`${workerUrl()}/status`);
      if (!res.ok) throw new Error('worker sem resposta');
      setWorkerOnline(true);
      const queue = await fetch(`${workerUrl()}/fila`).then(r => r.json()).catch(() => []);
      const workerLogs = await fetch(`${workerUrl()}/logs`).then(r => r.json()).catch(() => []);
      addLog('OK', `Worker real online · fila ${Array.isArray(queue) ? queue.length : 0}`);
      if (Array.isArray(workerLogs) && workerLogs[0]?.message) addLog(workerLogs[0].level === 'error' ? 'ERROR' : 'INFO', `Worker: ${workerLogs[0].message}`);
    } catch {
      setWorkerOnline(false);
      addLog('ERROR', `Worker real offline em ${workerUrl()}. Nada será marcado como executado.`);
    }
  };

  useEffect(() => { void syncWorker(); const id = setInterval(syncWorker, 15000); return () => clearInterval(id); }, []);

  const runAnalysis = () => {
    if (!command.trim()) return;
    const a = analyzeRequest(command);
    setAnalysis(a);
    addLog('INFO', `Análise específica gerada: ${a.project}`);
    setNotice(`Análise concluída — ${a.project}`);
  };

  const createMissionFromAnalysis = async (a = analysis) => {
    if (!a) return;
    const mission: Mission = { id: uid(), project: a.project, command: a.command, status: 'fila', mode: a.mode, createdAt: new Date().toISOString() };
    setMissions(prev => [mission, ...prev]);
    setActive(mission);
    addLog('INFO', `Missão criada localmente: ${a.project}`);
    try {
      const payload = { projectName: a.project, command: a.command, priority: 'high', type: 'github_commit', repository: a.project.includes('TOPAC') ? 'implantarhconsultoria-coder/rh-prospera-hub-70cb89a5' : 'implantarhconsultoria-coder/synth-forge-grid' };
      const res = await fetch(`${workerUrl()}/fila`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
      if (!res.ok) throw new Error('falha ao enviar para worker');
      const task = await res.json();
      const next = { ...mission, workerTaskId: task.id };
      setMissions(prev => prev.map(m => m.id === mission.id ? next : m));
      setActive(next);
      setNotice(`Enviado ao worker real — ${a.project}`);
      addLog('OK', `Tarefa enviada ao worker real: ${task.id}`);
    } catch {
      const offline = { ...mission, status: 'worker_offline' as MissionStatus };
      setMissions(prev => prev.map(m => m.id === mission.id ? offline : m));
      setActive(offline);
      setNotice('Worker offline — missão não executada');
      addLog('ERROR', 'Worker offline. A missão ficou salva localmente, mas NÃO foi executada.');
    }
  };

  const runMission = async (mission: Mission) => {
    if (mission.workerTaskId) {
      addLog('INFO', `Missão já enviada ao worker: ${mission.workerTaskId}`);
      await syncWorker();
      return;
    }
    await createMissionFromAnalysis({ project: mission.project, title: 'Execução real', answer: '', prepared: [], pending: [], failed: [], command: mission.command, mode: mission.mode || 'auditoria' });
  };

  const correctPending = (mission: Mission) => {
    const text = `Corrigir ${mission.project}: ${mission.command}`;
    const a = analyzeRequest(text);
    a.mode = 'correcao';
    a.command = `CORREÇÃO REAL — ${mission.project}: aplicar correção no repositório alvo e registrar diff/resultado. Origem: ${text}`;
    setAnalysis(a);
    void createMissionFromAnalysis(a);
  };

  const revalidate = (mission: Mission) => {
    const a = analyzeRequest(`Revalidar ${mission.project}: ${mission.command}`);
    a.mode = 'revalidacao';
    a.command = `REVALIDAÇÃO REAL — ${mission.project}: consultar worker, checar status da fila/logs, validar resultado e atualizar pendências.`;
    setAnalysis(a);
    void createMissionFromAnalysis(a);
  };

  return <main className="page">
    {notice && <button className="notice" onClick={() => setNotice(null)}>{notice}</button>}
    <header className="hero"><div><span>AI FACTORY</span><h1>Worker real conectado</h1><p>Agora a tela envia missão para o worker. Se ele estiver offline, avisa. Não simula execução.</p></div><b className={workerOnline ? 'online' : 'offline'}>{workerOnline ? 'WORKER ONLINE' : 'WORKER OFFLINE'}</b></header>
    <section className="stats"><Card title="Fila local" value={String(stats.fila)} /><Card title="Concluídas" value={String(stats.concluidas)} ok /><Card title="Falhas/offline" value={String(stats.falhas)} warn /><Card title="Worker" value={workerOnline ? 'Real' : 'Offline'} ok={workerOnline} warn={!workerOnline} /></section>
    <section className="box start"><h2>Pedido</h2><textarea value={command} onChange={e => setCommand(e.target.value)} placeholder="Ex: vê se tem no app dos mecânicos saída e entrada do almoço" /><div className="actions"><button onClick={runAnalysis}>Analisar</button><button className="ghost" onClick={() => setCommand('Vê se tem no app dos mecânicos saída e entrada do almoço')}>Sugestão almoço</button>{analysis && <button className="danger" onClick={() => void createMissionFromAnalysis()}>Enviar ao worker real</button>}<button className="ghost" onClick={() => void syncWorker()}>Sincronizar worker</button></div></section>
    {analysis && <section className="box analysis"><h2>{analysis.title}</h2><p className="answer">{analysis.answer}</p><ResultLists fixed={analysis.prepared} pending={analysis.pending} failed={analysis.failed} /><h4>Comando real</h4><pre>{analysis.command}</pre></section>}
    <section className="grid"><div className="box"><h2>Missão atual</h2>{!active ? <p className="muted">Nenhuma missão selecionada.</p> : <MissionView mission={active} onRun={runMission} onRevalidate={revalidate} onCorrectPending={correctPending} />}</div><div className="box"><h2>Fila local</h2>{missions.length === 0 ? <p className="muted">Sem missões.</p> : missions.map(m => <button className="missionBtn" key={m.id} onClick={() => setActive(m)}><strong>{m.project}</strong><span>{m.status}</span></button>)}</div></section>
    <section className="box"><h2>Logs inteligentes</h2>{logs.map((l, i) => <div className="log" key={i}><time>{l.time}</time><b className={l.level}>{l.level}</b><span>{l.text}</span></div>)}</section>
    <style>{css}</style>
  </main>;
}

function ResultLists({ fixed, pending, failed }: { fixed: string[]; pending: string[]; failed: string[] }) { return <div className="result"><h4>Preparado / identificado</h4><ul>{fixed.map(i => <li key={i}>{i}</li>)}</ul><h4>Pendente</h4><ul>{pending.map(i => <li key={i}>{i}</li>)}</ul>{failed.length > 0 && <><h4>Falhas</h4><ul>{failed.map(i => <li key={i}>{i}</li>)}</ul></>}</div>; }
function MissionView({ mission, onRun, onRevalidate, onCorrectPending }: { mission: Mission; onRun: (m: Mission) => void; onRevalidate: (m: Mission) => void; onCorrectPending: (m: Mission) => void }) { return <div className="mission"><h3>{mission.project}</h3><span className={`pill ${mission.status}`}>{mission.status}</span><pre>{mission.command}</pre><div className="actions"><button onClick={() => void onRun(mission)}>{mission.workerTaskId ? 'Consultar worker' : 'Enviar/Executar no worker'}</button><button className="danger" onClick={() => onCorrectPending(mission)}>Corrigir pendências</button><button onClick={() => onRevalidate(mission)}>Revalidar</button></div></div>; }
function Card({ title, value, ok, warn }: { title: string; value: string; ok?: boolean; warn?: boolean }) { return <div className="card"><span>{title}</span><strong className={ok ? 'ok' : warn ? 'warn' : ''}>{value}</strong></div>; }

const css = `body{margin:0;background:#020617;color:#f8fafc;font-family:Inter,Arial,sans-serif}.page{min-height:100vh;padding:24px;background:radial-gradient(circle at 15% 0,#1d3269,transparent 35%),#020617}.notice{position:fixed;top:16px;left:50%;transform:translateX(-50%);z-index:50;border:1px solid rgba(56,189,248,.35);background:#0f172a;color:#fff;border-radius:18px;padding:14px 18px;font-weight:900;box-shadow:0 18px 70px rgba(0,0,0,.4)}.hero{display:flex;justify-content:space-between;gap:18px;align-items:flex-start;margin-bottom:18px}.hero span{color:#38bdf8;font-weight:900;letter-spacing:.2em}.hero h1{font-size:38px;margin:8px 0}.hero p,.muted,.box p{color:#94a3b8}.hero b{border-radius:14px;padding:12px 16px}.online{border:1px solid rgba(34,197,94,.38);background:rgba(34,197,94,.12);color:#4ade80}.offline{border:1px solid rgba(239,68,68,.38);background:rgba(239,68,68,.12);color:#f87171}.stats{display:grid;grid-template-columns:repeat(4,1fr);gap:12px;margin-bottom:18px}.card,.box{border:1px solid rgba(148,163,184,.18);background:rgba(15,23,42,.78);border-radius:20px;padding:20px}.card span{display:block;color:#94a3b8;font-size:12px;text-transform:uppercase;letter-spacing:.12em}.card strong{display:block;margin-top:8px;font-size:24px;color:#38bdf8}.ok{color:#4ade80!important}.warn{color:#facc15!important}.start{margin-bottom:18px}.box h2{margin:0 0 8px}.box textarea{width:100%;min-height:130px;background:#030712;color:white;border:1px solid rgba(56,189,248,.34);border-radius:16px;padding:16px;font-size:16px}.actions{display:flex;gap:10px;flex-wrap:wrap;margin-top:14px}button{border:0;border-radius:14px;padding:13px 18px;background:linear-gradient(135deg,#38bdf8,#8b5cf6);color:#020617;font-weight:900;cursor:pointer}.danger{background:linear-gradient(135deg,#22c55e,#facc15,#ec4899)!important}.ghost{background:transparent!important;color:#e5e7eb!important;border:1px solid rgba(226,232,240,.28)!important}.grid{display:grid;grid-template-columns:1.1fr .9fr;gap:18px;margin-bottom:18px}.analysis{margin-bottom:18px}.answer{font-size:18px;line-height:1.5;color:#e5e7eb!important}.missionBtn{width:100%;display:flex;justify-content:space-between;gap:10px;background:#020617;color:#fff;border:1px solid rgba(148,163,184,.18);margin-bottom:10px}.mission h3{font-size:24px;margin:0 0 8px}.pill{display:inline-block;border-radius:999px;padding:7px 10px;background:rgba(56,189,248,.12);color:#7dd3fc}.worker_offline,.falha{background:rgba(239,68,68,.13);color:#f87171}pre{white-space:pre-wrap;background:#020617;border:1px solid rgba(148,163,184,.18);border-radius:14px;padding:14px;color:#c4b5fd}.result{margin-top:14px;border-top:1px solid rgba(148,163,184,.16);padding-top:14px}.result h4,.analysis h4{color:#94a3b8;text-transform:uppercase;letter-spacing:.12em;font-size:12px}.result li{margin-bottom:8px}.log{display:grid;grid-template-columns:70px 70px 1fr;gap:12px;border-top:1px solid rgba(148,163,184,.12);padding:12px 0}.log time{color:#94a3b8}.log b{color:#38bdf8}.log .OK{color:#4ade80}.log .WARN{color:#facc15}.log .ERROR{color:#f87171}@media(max-width:800px){.page{padding:16px}.hero{display:block}.hero h1{font-size:30px}.hero b{display:inline-block;margin-top:12px}.stats,.grid{grid-template-columns:1fr}.log{grid-template-columns:54px 58px 1fr}.actions button{flex:1}}`;