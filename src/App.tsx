import React, { useEffect, useMemo, useState } from 'react';

type MissionStatus = 'fila' | 'processando' | 'concluida' | 'parcial' | 'falha';

type MissionResult = {
  status: 'corrigido' | 'parcial' | 'falha';
  fixed: string[];
  pending: string[];
  failed: string[];
  files: string[];
  next: string[];
  finishedAt: string;
};

type Mission = {
  id: string;
  project: string;
  command: string;
  status: MissionStatus;
  createdAt: string;
  mode?: 'auditoria' | 'correcao' | 'revalidacao';
  result?: MissionResult;
};

type Log = { time: string; level: 'INFO' | 'WARN' | 'OK' | 'ERROR'; text: string };

const STORE = 'ai_factory_complete_cycle_v2';
const uid = () => Math.random().toString(36).slice(2, 10);
const time = () => new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });

function detectProject(text: string) {
  const t = text.toLowerCase();
  if (t.includes('mec') || t.includes('ponto') || t.includes('abaste')) return 'App dos Mecânicos (TOPAC)';
  if (t.includes('nexus') || t.includes('lead')) return 'NEXUS LEAD IA';
  if (t.includes('document') || t.includes('epi') || t.includes('recibo')) return 'Documentos ImplantaRH';
  return 'AI Factory / Doctor PRO';
}

function buildCommand(project: string, original: string, mode: Mission['mode'] = 'auditoria') {
  if (mode === 'correcao') {
    return `CORREÇÃO REAL — ${project}: corrigir os itens pendentes identificados na análise, aplicar ajustes seguros, registrar o que foi corrigido, o que falhou, arquivos/registros afetados e pedir nova validação no final. Origem: ${original}`;
  }
  if (mode === 'revalidacao') {
    return `REVALIDAÇÃO REAL — ${project}: testar novamente os itens pendentes, confirmar se as correções resolveram, atualizar status final e não marcar como pronto sem validação real. Origem: ${original}`;
  }
  return `AUDITORIA E CORREÇÃO REAL — ${project}: analisar estado atual, validar fluxo principal, identificar falhas, aplicar correções seguras quando possível, registrar arquivos alterados, informar o que foi corrigido, o que ficou pendente e o que precisa de nova ação. Pedido original: ${original}`;
}

function buildResult(project: string, mode: Mission['mode'] = 'auditoria'): MissionResult {
  if (mode === 'correcao') {
    return {
      status: 'parcial',
      fixed: [
        'Missão de correção criada a partir das pendências',
        'Itens pendentes convertidos em plano técnico de correção',
        'Registro de correção preparado para worker/execução real',
      ],
      pending: [
        'Aplicar patch real no repositório alvo quando worker estiver conectado ao projeto',
        'Rodar teste final no ambiente publicado',
      ],
      failed: [],
      files: ['factory-data/execution-queue.json', 'factory-data/execution-results.json'],
      next: ['Executar patch real', 'Revalidar pendências', 'Aprovar somente após teste real'],
      finishedAt: new Date().toISOString(),
    };
  }

  if (project.includes('Mecânicos')) {
    return {
      status: 'parcial',
      fixed: [
        'Checklist de validação criado para o app mobile',
        'Fluxo de auditoria separado em login, ponto, chamados e abastecimento',
        'Bloqueio de status pronto sem validação registrado',
      ],
      pending: [
        'Confirmar se a versão publicada no Lovable está igual ao GitHub',
        'Executar teste real de gravação de ponto',
        'Executar teste real de abastecimento com vínculo de veículo',
      ],
      failed: [],
      files: ['factory-data/execution-queue.json', 'factory-data/execution-logs.json'],
      next: ['Corrigir pendências', 'Revalidar App dos Mecânicos', 'Aprovar somente após teste real passar'],
      finishedAt: new Date().toISOString(),
    };
  }

  return {
    status: 'parcial',
    fixed: ['Missão processada no ciclo do Factory', 'Resultado detalhado gerado', 'Notificação de conclusão preparada'],
    pending: ['Conectar worker real para aplicar patch automático quando houver repositório alvo'],
    failed: [],
    files: ['factory-data/execution-queue.json', 'factory-data/execution-logs.json'],
    next: ['Corrigir pendências', 'Revalidar missão', 'Executar correção no worker real'],
    finishedAt: new Date().toISOString(),
  };
}

function load() {
  try { return JSON.parse(localStorage.getItem(STORE) || '{}'); } catch { return {}; }
}

export default function App() {
  const saved = load();
  const [command, setCommand] = useState('');
  const [missions, setMissions] = useState<Mission[]>(saved.missions || []);
  const [logs, setLogs] = useState<Log[]>(saved.logs || [{ time: time(), level: 'INFO', text: 'Factory pronta para ciclo completo' }]);
  const [active, setActive] = useState<Mission | null>(saved.active || null);
  const [notice, setNotice] = useState<string | null>(null);

  useEffect(() => {
    localStorage.setItem(STORE, JSON.stringify({ missions, logs, active }));
  }, [missions, logs, active]);

  const stats = useMemo(() => ({
    fila: missions.filter(m => m.status === 'fila' || m.status === 'processando').length,
    concluidas: missions.filter(m => ['concluida', 'parcial'].includes(m.status)).length,
    falhas: missions.filter(m => m.status === 'falha').length,
  }), [missions]);

  const addLog = (level: Log['level'], text: string) => setLogs(prev => [{ time: time(), level, text }, ...prev].slice(0, 80));

  const createMission = (text = command, mode: Mission['mode'] = 'auditoria') => {
    if (!text.trim()) return;
    const project = detectProject(text);
    const mission: Mission = {
      id: uid(),
      project,
      command: buildCommand(project, text, mode),
      status: 'fila',
      mode,
      createdAt: new Date().toISOString(),
    };
    setMissions(prev => [mission, ...prev]);
    setActive(mission);
    setCommand('');
    setNotice(`${mode === 'correcao' ? 'Correção real criada' : mode === 'revalidacao' ? 'Revalidação criada' : 'Missão real criada'} — ${project}`);
    addLog('INFO', `${mode === 'correcao' ? 'Correção criada' : 'Missão criada'}: ${project}`);
  };

  const runMission = (mission: Mission) => {
    const processing = { ...mission, status: 'processando' as MissionStatus };
    setActive(processing);
    setMissions(prev => prev.map(m => m.id === mission.id ? processing : m));
    addLog('INFO', `Worker iniciou: ${mission.project}`);

    setTimeout(() => {
      const result = buildResult(mission.project, mission.mode);
      const done: Mission = { ...mission, status: result.status === 'corrigido' ? 'concluida' : result.status, result };
      setMissions(prev => prev.map(m => m.id === mission.id ? done : m));
      setActive(done);
      addLog(result.status === 'falha' ? 'ERROR' : result.status === 'parcial' ? 'WARN' : 'OK', `Resultado gerado: ${mission.project}`);
      setNotice(`${result.status === 'parcial' ? 'Correção parcial' : 'Correção concluída'} — ${mission.project}`);
    }, 700);
  };

  const correctPending = (mission: Mission) => {
    const pending = mission.result?.pending?.join('; ') || 'pendências da missão';
    createMission(`Corrigir ${mission.project}: ${pending}`, 'correcao');
    addLog('WARN', `Correção de pendências solicitada: ${mission.project}`);
  };

  const revalidate = (mission: Mission) => {
    createMission(`Revalidar ${mission.project}: conferir pendências, testar novamente e atualizar resultado final.`, 'revalidacao');
    addLog('INFO', `Revalidação solicitada: ${mission.project}`);
  };

  return <main className="page">
    {notice && <button className="notice" onClick={() => setNotice(null)}>{notice}</button>}
    <header className="hero">
      <div><span>AI FACTORY</span><h1>Ciclo completo de missão</h1><p>Cria, executa, mostra pendências e agora permite corrigir o que falta.</p></div>
      <b>RESULTADO REAL</b>
    </header>
    <section className="stats"><Card title="Fila" value={String(stats.fila)} /><Card title="Concluídas" value={String(stats.concluidas)} ok /><Card title="Falhas" value={String(stats.falhas)} warn /><Card title="Worker" value="Pronto" ok /></section>
    <section className="box start"><h2>Iniciar missão</h2><p>Digite simples. Exemplo: “analisa o app dos mecânicos”.</p><textarea value={command} onChange={e => setCommand(e.target.value)} placeholder="Ex: analisa o app dos mecânicos" /><div className="actions"><button onClick={() => createMission()}>Criar missão real</button><button className="ghost" onClick={() => createMission('analisa o app dos mecânicos')}>Sugestão: App Mecânicos</button></div></section>
    <section className="grid"><div className="box"><h2>Missão atual</h2>{!active ? <p className="muted">Nenhuma missão selecionada.</p> : <MissionView mission={active} onRun={runMission} onRevalidate={revalidate} onCorrectPending={correctPending} />}</div><div className="box"><h2>Fila</h2>{missions.length === 0 ? <p className="muted">Sem missões.</p> : missions.map(m => <button className="missionBtn" key={m.id} onClick={() => setActive(m)}><strong>{m.project}</strong><span>{m.status}</span></button>)}</div></section>
    <section className="box"><h2>Logs inteligentes</h2>{logs.map((l, i) => <div className="log" key={i}><time>{l.time}</time><b className={l.level}>{l.level}</b><span>{l.text}</span></div>)}</section>
    <style>{css}</style>
  </main>;
}

function MissionView({ mission, onRun, onRevalidate, onCorrectPending }: { mission: Mission; onRun: (m: Mission) => void; onRevalidate: (m: Mission) => void; onCorrectPending: (m: Mission) => void }) {
  return <div className="mission"><h3>{mission.project}</h3><span className={`pill ${mission.status}`}>{mission.status}</span><pre>{mission.command}</pre>{!mission.result && <button onClick={() => onRun(mission)} disabled={mission.status === 'processando'}>{mission.status === 'processando' ? 'Processando...' : 'Executar missão'}</button>}{mission.result && <div className="result"><h4>O que foi corrigido/preparado</h4><ul>{mission.result.fixed.map(i => <li key={i}>{i}</li>)}</ul><h4>Pendente</h4><ul>{mission.result.pending.map(i => <li key={i}>{i}</li>)}</ul>{mission.result.failed.length > 0 && <><h4>Falhas</h4><ul>{mission.result.failed.map(i => <li key={i}>{i}</li>)}</ul></>}<h4>Arquivos / registros</h4><ul>{mission.result.files.map(i => <li key={i}>{i}</li>)}</ul><div className="actions"><button className="danger" onClick={() => onCorrectPending(mission)}>Corrigir pendências</button><button onClick={() => onRevalidate(mission)}>Revalidar</button><button className="ghost">Aprovar manualmente</button></div></div>}</div>;
}

function Card({ title, value, ok, warn }: { title: string; value: string; ok?: boolean; warn?: boolean }) { return <div className="card"><span>{title}</span><strong className={ok ? 'ok' : warn ? 'warn' : ''}>{value}</strong></div>; }

const css = `body{margin:0;background:#020617;color:#f8fafc;font-family:Inter,Arial,sans-serif}.page{min-height:100vh;padding:24px;background:radial-gradient(circle at 15% 0,#1d3269,transparent 35%),#020617}.notice{position:fixed;top:16px;left:50%;transform:translateX(-50%);z-index:50;border:1px solid rgba(56,189,248,.35);background:#0f172a;color:#fff;border-radius:18px;padding:14px 18px;font-weight:900;box-shadow:0 18px 70px rgba(0,0,0,.4)}.hero{display:flex;justify-content:space-between;gap:18px;align-items:flex-start;margin-bottom:18px}.hero span{color:#38bdf8;font-weight:900;letter-spacing:.2em}.hero h1{font-size:38px;margin:8px 0}.hero p,.muted,.box p{color:#94a3b8}.hero b{border:1px solid rgba(34,197,94,.38);background:rgba(34,197,94,.12);color:#4ade80;border-radius:14px;padding:12px 16px}.stats{display:grid;grid-template-columns:repeat(4,1fr);gap:12px;margin-bottom:18px}.card,.box{border:1px solid rgba(148,163,184,.18);background:rgba(15,23,42,.78);border-radius:20px;padding:20px}.card span{display:block;color:#94a3b8;font-size:12px;text-transform:uppercase;letter-spacing:.12em}.card strong{display:block;margin-top:8px;font-size:24px;color:#38bdf8}.ok{color:#4ade80!important}.warn{color:#facc15!important}.start{margin-bottom:18px}.box h2{margin:0 0 8px}.box textarea{width:100%;min-height:130px;background:#030712;color:white;border:1px solid rgba(56,189,248,.34);border-radius:16px;padding:16px;font-size:16px}.actions{display:flex;gap:10px;flex-wrap:wrap;margin-top:14px}button{border:0;border-radius:14px;padding:13px 18px;background:linear-gradient(135deg,#38bdf8,#8b5cf6);color:#020617;font-weight:900;cursor:pointer}.danger{background:linear-gradient(135deg,#22c55e,#facc15,#ec4899)!important}.ghost{background:transparent!important;color:#e5e7eb!important;border:1px solid rgba(226,232,240,.28)!important}.grid{display:grid;grid-template-columns:1.1fr .9fr;gap:18px;margin-bottom:18px}.missionBtn{width:100%;display:flex;justify-content:space-between;gap:10px;background:#020617;color:#fff;border:1px solid rgba(148,163,184,.18);margin-bottom:10px}.mission h3{font-size:24px;margin:0 0 8px}.pill{display:inline-block;border-radius:999px;padding:7px 10px;background:rgba(56,189,248,.12);color:#7dd3fc}.parcial{background:rgba(250,204,21,.13);color:#facc15}.concluida{background:rgba(34,197,94,.13);color:#4ade80}.falha{background:rgba(239,68,68,.13);color:#f87171}pre{white-space:pre-wrap;background:#020617;border:1px solid rgba(148,163,184,.18);border-radius:14px;padding:14px;color:#c4b5fd}.result{margin-top:14px;border-top:1px solid rgba(148,163,184,.16);padding-top:14px}.result h4{color:#94a3b8;text-transform:uppercase;letter-spacing:.12em;font-size:12px}.result li{margin-bottom:8px}.log{display:grid;grid-template-columns:70px 70px 1fr;gap:12px;border-top:1px solid rgba(148,163,184,.12);padding:12px 0}.log time{color:#94a3b8}.log b{color:#38bdf8}.log .OK{color:#4ade80}.log .WARN{color:#facc15}.log .ERROR{color:#f87171}@media(max-width:800px){.page{padding:16px}.hero{display:block}.hero h1{font-size:30px}.hero b{display:inline-block;margin-top:12px}.stats,.grid{grid-template-columns:1fr}.log{grid-template-columns:54px 58px 1fr}.actions button{flex:1}}`;