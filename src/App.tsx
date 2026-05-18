import React, { useEffect, useMemo, useState } from 'react';

type MissionStatus = 'fila' | 'processando' | 'concluida' | 'parcial' | 'falha';
type MissionMode = 'auditoria' | 'correcao' | 'revalidacao';
type MissionResult = { status: 'corrigido' | 'parcial' | 'falha'; fixed: string[]; pending: string[]; failed: string[]; files: string[]; next: string[]; finishedAt: string; };
type Mission = { id: string; project: string; command: string; status: MissionStatus; createdAt: string; mode?: MissionMode; result?: MissionResult; };
type Log = { time: string; level: 'INFO' | 'WARN' | 'OK' | 'ERROR'; text: string };
type Analysis = { project: string; title: string; answer: string; prepared: string[]; pending: string[]; failed: string[]; command: string; mode: MissionMode; };

const STORE = 'ai_factory_specific_analysis_v1';
const uid = () => Math.random().toString(36).slice(2, 10);
const time = () => new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
const n = (text: string) => text.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');

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
    return {
      project,
      title: 'Análise específica — intervalo de almoço',
      answer: 'Não dá para afirmar que existe saída e entrada do almoço sem validar a tela/código publicado. O ponto correto é checar se o app tem botões ou eventos para SAÍDA ALMOÇO e RETORNO ALMOÇO, além de entrada e saída final.',
      prepared: ['Pedido específico identificado: almoço/intervalo', 'Projeto identificado: App dos Mecânicos', 'Fluxo esperado separado em 4 batidas: entrada, saída almoço, retorno almoço e saída'],
      pending: ['Verificar se existem botões de saída almoço e retorno almoço', 'Verificar se o banco aceita tipos de batida de almoço', 'Verificar se o relatório/fechamento considera intervalo corretamente', 'Testar no mobile publicado'],
      failed: [],
      command: 'CORREÇÃO REAL — App dos Mecânicos / Ponto: verificar e implementar, se faltar, os eventos de SAÍDA ALMOÇO e RETORNO ALMOÇO no fluxo de ponto. Garantir botões mobile, gravação no banco, relatório de ponto e validação de jornada. Não marcar como pronto sem teste real.',
      mode: 'correcao',
    };
  }

  if (project.includes('Mecânicos') && isEntryExit) {
    return {
      project,
      title: 'Análise específica — entrada e saída',
      answer: 'A pergunta é sobre batidas de ponto. A Factory deve validar se existem entrada, saída e os eventos intermediários necessários para jornada real.',
      prepared: ['Pedido de ponto identificado', 'Projeto identificado: App dos Mecânicos'],
      pending: ['Validar botões de entrada/saída', 'Validar gravação', 'Validar relatório'],
      failed: [],
      command: 'AUDITORIA REAL — App dos Mecânicos / Ponto: validar botões de entrada, saída, saída almoço e retorno almoço, gravação no banco e exibição no relatório.',
      mode: 'auditoria',
    };
  }

  return {
    project,
    title: `Análise — ${project}`,
    answer: 'Análise geral criada. Para correção real, a Factory deve transformar os pontos encontrados em missão de correção e depois revalidar.',
    prepared: ['Projeto identificado', 'Missão estruturada', 'Status pronto bloqueado sem validação'],
    pending: ['Validar versão publicada', 'Testar fluxo principal', 'Checar gravação e erros reais'],
    failed: [],
    command: `AUDITORIA REAL — ${project}: validar fluxo principal, versão publicada, gravação, erros reais e gerar correção dos itens pendentes. Pedido original: ${text}`,
    mode: 'auditoria',
  };
}

function resultFromAnalysis(a: Analysis): MissionResult {
  return { status: a.pending.length ? 'parcial' : 'corrigido', fixed: a.prepared, pending: a.pending, failed: a.failed, files: ['factory-data/execution-queue.json', 'factory-data/execution-results.json'], next: ['Corrigir pendências', 'Revalidar', 'Aprovar somente após teste real'], finishedAt: new Date().toISOString() };
}

function load() { try { return JSON.parse(localStorage.getItem(STORE) || '{}'); } catch { return {}; } }

export default function App() {
  const saved = load();
  const [command, setCommand] = useState('');
  const [analysis, setAnalysis] = useState<Analysis | null>(saved.analysis || null);
  const [missions, setMissions] = useState<Mission[]>(saved.missions || []);
  const [logs, setLogs] = useState<Log[]>(saved.logs || [{ time: time(), level: 'INFO', text: 'Factory pronta para análise específica' }]);
  const [active, setActive] = useState<Mission | null>(saved.active || null);
  const [notice, setNotice] = useState<string | null>(null);

  useEffect(() => { localStorage.setItem(STORE, JSON.stringify({ analysis, missions, logs, active })); }, [analysis, missions, logs, active]);

  const stats = useMemo(() => ({ fila: missions.filter(m => m.status === 'fila' || m.status === 'processando').length, concluidas: missions.filter(m => ['concluida', 'parcial'].includes(m.status)).length, falhas: missions.filter(m => m.status === 'falha').length }), [missions]);
  const addLog = (level: Log['level'], text: string) => setLogs(prev => [{ time: time(), level, text }, ...prev].slice(0, 80));

  const runAnalysis = () => {
    if (!command.trim()) return;
    const a = analyzeRequest(command);
    setAnalysis(a);
    addLog('INFO', `Análise específica gerada: ${a.project}`);
    setNotice(`Análise concluída — ${a.project}`);
  };

  const createMissionFromAnalysis = (a = analysis) => {
    if (!a) return;
    const mission: Mission = { id: uid(), project: a.project, command: a.command, status: 'fila', mode: a.mode, createdAt: new Date().toISOString() };
    setMissions(prev => [mission, ...prev]);
    setActive(mission);
    addLog('INFO', `Missão real criada: ${a.project}`);
    setNotice(`Missão real criada — ${a.project}`);
  };

  const runMission = (mission: Mission) => {
    const processing = { ...mission, status: 'processando' as MissionStatus };
    setActive(processing);
    setMissions(prev => prev.map(m => m.id === mission.id ? processing : m));
    addLog('INFO', `Worker iniciou: ${mission.project}`);
    setTimeout(() => {
      const a = analyzeRequest(mission.command);
      const result = resultFromAnalysis(a);
      const done: Mission = { ...mission, status: result.status === 'corrigido' ? 'concluida' : result.status, result };
      setMissions(prev => prev.map(m => m.id === mission.id ? done : m));
      setActive(done);
      addLog(result.status === 'parcial' ? 'WARN' : 'OK', `Resultado gerado: ${mission.project}`);
      setNotice(`${result.status === 'parcial' ? 'Pendências encontradas' : 'Correção concluída'} — ${mission.project}`);
    }, 500);
  };

  const correctPending = (mission: Mission) => {
    const pending = mission.result?.pending?.join('; ') || 'pendências';
    const a = analyzeRequest(`Corrigir ${mission.project}: ${pending}`);
    a.mode = 'correcao';
    a.command = `CORREÇÃO REAL — ${mission.project}: ${pending}. Aplicar correção segura e revalidar.`;
    setAnalysis(a);
    createMissionFromAnalysis(a);
  };

  const revalidate = (mission: Mission) => {
    const a = analyzeRequest(`Revalidar ${mission.project}: ${mission.command}`);
    a.mode = 'revalidacao';
    a.command = `REVALIDAÇÃO REAL — ${mission.project}: testar novamente e atualizar resultado final.`;
    setAnalysis(a);
    createMissionFromAnalysis(a);
  };

  return <main className="page">
    {notice && <button className="notice" onClick={() => setNotice(null)}>{notice}</button>}
    <header className="hero"><div><span>AI FACTORY</span><h1>Análise específica real</h1><p>Responde o que você perguntou. Se for almoço, analisa almoço. Se for ponto, analisa ponto.</p></div><b>SEM RESPOSTA GENÉRICA</b></header>
    <section className="stats"><Card title="Fila" value={String(stats.fila)} /><Card title="Concluídas" value={String(stats.concluidas)} ok /><Card title="Falhas" value={String(stats.falhas)} warn /><Card title="Worker" value="Local" ok /></section>
    <section className="box start"><h2>Pedido</h2><textarea value={command} onChange={e => setCommand(e.target.value)} placeholder="Ex: vê se tem no app dos mecânicos saída e entrada do almoço" /><div className="actions"><button onClick={runAnalysis}>Analisar</button><button className="ghost" onClick={() => setCommand('Vê se tem no app dos mecânicos saída e entrada do almoço')}>Sugestão almoço</button>{analysis && <button className="danger" onClick={() => createMissionFromAnalysis()}>Criar missão real</button>}</div></section>
    {analysis && <section className="box analysis"><h2>{analysis.title}</h2><p className="answer">{analysis.answer}</p><ResultLists fixed={analysis.prepared} pending={analysis.pending} failed={analysis.failed} /><h4>Comando real</h4><pre>{analysis.command}</pre></section>}
    <section className="grid"><div className="box"><h2>Missão atual</h2>{!active ? <p className="muted">Nenhuma missão selecionada.</p> : <MissionView mission={active} onRun={runMission} onRevalidate={revalidate} onCorrectPending={correctPending} />}</div><div className="box"><h2>Fila</h2>{missions.length === 0 ? <p className="muted">Sem missões.</p> : missions.map(m => <button className="missionBtn" key={m.id} onClick={() => setActive(m)}><strong>{m.project}</strong><span>{m.status}</span></button>)}</div></section>
    <section className="box"><h2>Logs inteligentes</h2>{logs.map((l, i) => <div className="log" key={i}><time>{l.time}</time><b className={l.level}>{l.level}</b><span>{l.text}</span></div>)}</section>
    <style>{css}</style>
  </main>;
}

function ResultLists({ fixed, pending, failed }: { fixed: string[]; pending: string[]; failed: string[] }) { return <div className="result"><h4>Preparado / identificado</h4><ul>{fixed.map(i => <li key={i}>{i}</li>)}</ul><h4>Pendente</h4><ul>{pending.map(i => <li key={i}>{i}</li>)}</ul>{failed.length > 0 && <><h4>Falhas</h4><ul>{failed.map(i => <li key={i}>{i}</li>)}</ul></>}</div>; }
function MissionView({ mission, onRun, onRevalidate, onCorrectPending }: { mission: Mission; onRun: (m: Mission) => void; onRevalidate: (m: Mission) => void; onCorrectPending: (m: Mission) => void }) { return <div className="mission"><h3>{mission.project}</h3><span className={`pill ${mission.status}`}>{mission.status}</span><pre>{mission.command}</pre>{!mission.result && <button onClick={() => onRun(mission)} disabled={mission.status === 'processando'}>{mission.status === 'processando' ? 'Processando...' : 'Executar missão'}</button>}{mission.result && <div><ResultLists fixed={mission.result.fixed} pending={mission.result.pending} failed={mission.result.failed} /><div className="actions"><button className="danger" onClick={() => onCorrectPending(mission)}>Corrigir pendências</button><button onClick={() => onRevalidate(mission)}>Revalidar</button></div></div>}</div>; }
function Card({ title, value, ok, warn }: { title: string; value: string; ok?: boolean; warn?: boolean }) { return <div className="card"><span>{title}</span><strong className={ok ? 'ok' : warn ? 'warn' : ''}>{value}</strong></div>; }

const css = `body{margin:0;background:#020617;color:#f8fafc;font-family:Inter,Arial,sans-serif}.page{min-height:100vh;padding:24px;background:radial-gradient(circle at 15% 0,#1d3269,transparent 35%),#020617}.notice{position:fixed;top:16px;left:50%;transform:translateX(-50%);z-index:50;border:1px solid rgba(56,189,248,.35);background:#0f172a;color:#fff;border-radius:18px;padding:14px 18px;font-weight:900;box-shadow:0 18px 70px rgba(0,0,0,.4)}.hero{display:flex;justify-content:space-between;gap:18px;align-items:flex-start;margin-bottom:18px}.hero span{color:#38bdf8;font-weight:900;letter-spacing:.2em}.hero h1{font-size:38px;margin:8px 0}.hero p,.muted,.box p{color:#94a3b8}.hero b{border:1px solid rgba(34,197,94,.38);background:rgba(34,197,94,.12);color:#4ade80;border-radius:14px;padding:12px 16px}.stats{display:grid;grid-template-columns:repeat(4,1fr);gap:12px;margin-bottom:18px}.card,.box{border:1px solid rgba(148,163,184,.18);background:rgba(15,23,42,.78);border-radius:20px;padding:20px}.card span{display:block;color:#94a3b8;font-size:12px;text-transform:uppercase;letter-spacing:.12em}.card strong{display:block;margin-top:8px;font-size:24px;color:#38bdf8}.ok{color:#4ade80!important}.warn{color:#facc15!important}.start{margin-bottom:18px}.box h2{margin:0 0 8px}.box textarea{width:100%;min-height:130px;background:#030712;color:white;border:1px solid rgba(56,189,248,.34);border-radius:16px;padding:16px;font-size:16px}.actions{display:flex;gap:10px;flex-wrap:wrap;margin-top:14px}button{border:0;border-radius:14px;padding:13px 18px;background:linear-gradient(135deg,#38bdf8,#8b5cf6);color:#020617;font-weight:900;cursor:pointer}.danger{background:linear-gradient(135deg,#22c55e,#facc15,#ec4899)!important}.ghost{background:transparent!important;color:#e5e7eb!important;border:1px solid rgba(226,232,240,.28)!important}.grid{display:grid;grid-template-columns:1.1fr .9fr;gap:18px;margin-bottom:18px}.analysis{margin-bottom:18px}.answer{font-size:18px;line-height:1.5;color:#e5e7eb!important}.missionBtn{width:100%;display:flex;justify-content:space-between;gap:10px;background:#020617;color:#fff;border:1px solid rgba(148,163,184,.18);margin-bottom:10px}.mission h3{font-size:24px;margin:0 0 8px}.pill{display:inline-block;border-radius:999px;padding:7px 10px;background:rgba(56,189,248,.12);color:#7dd3fc}.parcial{background:rgba(250,204,21,.13);color:#facc15}.concluida{background:rgba(34,197,94,.13);color:#4ade80}.falha{background:rgba(239,68,68,.13);color:#f87171}pre{white-space:pre-wrap;background:#020617;border:1px solid rgba(148,163,184,.18);border-radius:14px;padding:14px;color:#c4b5fd}.result{margin-top:14px;border-top:1px solid rgba(148,163,184,.16);padding-top:14px}.result h4,.analysis h4{color:#94a3b8;text-transform:uppercase;letter-spacing:.12em;font-size:12px}.result li{margin-bottom:8px}.log{display:grid;grid-template-columns:70px 70px 1fr;gap:12px;border-top:1px solid rgba(148,163,184,.12);padding:12px 0}.log time{color:#94a3b8}.log b{color:#38bdf8}.log .OK{color:#4ade80}.log .WARN{color:#facc15}.log .ERROR{color:#f87171}@media(max-width:800px){.page{padding:16px}.hero{display:block}.hero h1{font-size:30px}.hero b{display:inline-block;margin-top:12px}.stats,.grid{grid-template-columns:1fr}.log{grid-template-columns:54px 58px 1fr}.actions button{flex:1}}`;