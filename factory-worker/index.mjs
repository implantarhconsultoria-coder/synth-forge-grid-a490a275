import fs from "fs";
import path from "path";
import http from "http";
import { execSync } from "child_process";

const ROOT = process.cwd();
const DATA_DIR = path.join(ROOT, "factory-data");
const QUEUE_FILE = path.join(DATA_DIR, "execution-queue.json");
const LOG_FILE = path.join(DATA_DIR, "execution-logs.json");
const OUTPUT_DIR = path.join(ROOT, "factory-output");
const BACKUP_DIR = path.join(ROOT, "factory-backups");
const PORT = Number(process.env.FACTORY_PORT || 8787);
const GITHUB_TOKEN = process.env.GITHUB_TOKEN || process.env.GH_TOKEN || "";
const AUTOPILOT_FILE = path.join(DATA_DIR, "autopilot.json");
const AUTOPILOT_DEFAULT = process.env.FACTORY_AUTOPILOT !== "false";

function ensure() {
  fs.mkdirSync(DATA_DIR, { recursive: true });
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  fs.mkdirSync(BACKUP_DIR, { recursive: true });
  if (!fs.existsSync(QUEUE_FILE)) fs.writeFileSync(QUEUE_FILE, "[]");
  if (!fs.existsSync(LOG_FILE)) fs.writeFileSync(LOG_FILE, "[]");
  if (!fs.existsSync(AUTOPILOT_FILE)) fs.writeFileSync(AUTOPILOT_FILE, JSON.stringify({ enabled: AUTOPILOT_DEFAULT, lastSeedAt: null }, null, 2));
}

function readJson(file, fallback = []) {
  try { return JSON.parse(fs.readFileSync(file, "utf8")); } catch { return fallback; }
}
function writeJson(file, value) { fs.writeFileSync(file, JSON.stringify(value, null, 2)); }

function send(res, code, data) {
  res.writeHead(code, {
    "Content-Type": "application/json; charset=utf-8",
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "Content-Type",
    "Access-Control-Allow-Methods": "GET,POST,OPTIONS",
  });
  res.end(JSON.stringify(data, null, 2));
}

function getAutopilot() {
  return readJson(AUTOPILOT_FILE, { enabled: AUTOPILOT_DEFAULT, lastSeedAt: null });
}
function setAutopilot(enabled) {
  const current = getAutopilot();
  writeJson(AUTOPILOT_FILE, { ...current, enabled, updatedAt: new Date().toISOString() });
  return getAutopilot();
}

function statusPayload() {
  const autopilot = getAutopilot();
  const queue = readJson(QUEUE_FILE, []);
  return {
    ok: true,
    worker: "AI Factory Local",
    trabalhador: "Fábrica de IA Local",
    status: "online",
    autopilot: autopilot.enabled ? "ativo" : "pausado",
    executorGithub: Boolean(GITHUB_TOKEN),
    port: PORT,
    porta: PORT,
    queue: queue.length,
    fila: queue.length,
    pendentes: queue.filter((t) => ["queued", "pending", "pendente"].includes(t.status)).length,
    logs: readJson(LOG_FILE, []).length,
    routes: ["/", "/health", "/saude", "/status", "/queue", "/fila", "/logs", "/autopilot/start", "/autopilot/stop", "POST /queue", "POST /fila"],
    rotas: ["/", "/health", "/saude", "/status", "/queue", "/fila", "/logs", "/autopilot/start", "/autopilot/stop", "POST /queue", "POST /fila"],
  };
}

function log(entry) {
  const logs = readJson(LOG_FILE, []);
  logs.unshift({ id: crypto.randomUUID(), createdAt: new Date().toISOString(), ...entry });
  writeJson(LOG_FILE, logs.slice(0, 500));
  console.log(`[${entry.level || "info"}] ${entry.message}`);
}

function packageText(task) {
  const project = task.projectName || task.projetoNome || task.project || "AI Factory";
  const action = task.command || task.comando || task.objective || task.action || task.acao || "executar missão";
  const target = task.repository ? "GitHub" : /supabase|banco|login|permiss|auth|tabela|rls/i.test(action) ? "Supabase" : /github|codigo|código|arquivo|worker|commit|repo/i.test(action) ? "GitHub/Codespaces" : "Lovable";
  const risk = /login|permiss|banco|financeiro|rh|sal[aá]rio|excluir|cliente|produção|producao/i.test(action) ? "ALTO - exige aprovação" : "MÉDIO";
  return [
    "PACOTE AI FACTORY - EXECUÇÃO CONTROLADA",
    `Projeto: ${project}`,
    `Destino sugerido: ${target}`,
    `Risco: ${risk}`,
    `Tarefa: ${task.id}`,
    "",
    "OBJETIVO",
    action,
    "",
    "REGRAS DE PROTEÇÃO",
    "- Não refazer o projeto do zero.",
    "- Não alterar login, menus, permissões ou telas aprovadas sem necessidade.",
    "- Não apagar dados, histórico, integrações ou layout validado.",
    "- Fazer a menor alteração possível.",
    "- Se envolver banco, RH, financeiro, permissões ou cliente real, pedir aprovação antes de aplicar.",
    "",
    "CRITÉRIO DE SUCESSO",
    "- Resultado visível e testável.",
    "- Build sem erro quando houver código.",
    "- Mobile e desktop conferidos quando houver interface.",
    "",
    "TESTE FINAL",
    "- Abrir a tela afetada.",
    "- Conferir menu, login, permissões e dados existentes.",
    "- Registrar conclusão na Factory.",
  ].join("\n");
}

function backupFiles(projectRoot, files) {
  if (!projectRoot || !files?.length) return null;
  const stamp = new Date().toISOString().replace(/[:.]/g, "-");
  const targetDir = path.join(BACKUP_DIR, stamp);
  fs.mkdirSync(targetDir, { recursive: true });
  for (const file of files) {
    const source = path.join(projectRoot, file);
    if (!fs.existsSync(source)) continue;
    const dest = path.join(targetDir, file);
    fs.mkdirSync(path.dirname(dest), { recursive: true });
    fs.copyFileSync(source, dest);
  }
  return targetDir;
}

function safePath(filePath) {
  if (!filePath || typeof filePath !== "string") throw new Error("Arquivo inválido");
  if (filePath.includes("..") || filePath.startsWith("/") || filePath.includes("\\")) throw new Error(`Caminho bloqueado: ${filePath}`);
  return filePath;
}

function assertSafeTask(task) {
  const text = JSON.stringify(task).toLowerCase();
  const dangerous = ["delete from", "drop table", "truncate", "rm -rf", "service_role", "private key", "password", "senha", "secret"];
  const hit = dangerous.find((word) => text.includes(word));
  if (hit) throw new Error(`Tarefa bloqueada por segurança: ${hit}`);
}

async function githubRequest(endpoint, options = {}) {
  if (!GITHUB_TOKEN) throw new Error("GITHUB_TOKEN/GH_TOKEN não configurado no worker");
  const response = await fetch(`https://api.github.com${endpoint}`, {
    ...options,
    headers: {
      "Accept": "application/vnd.github+json",
      "Authorization": `Bearer ${GITHUB_TOKEN}`,
      "X-GitHub-Api-Version": "2022-11-28",
      ...(options.headers || {}),
    },
  });
  const text = await response.text();
  const data = text ? JSON.parse(text) : null;
  if (!response.ok) throw new Error(data?.message || `GitHub API ${response.status}`);
  return data;
}

function encodeBase64Utf8(content) {
  return Buffer.from(content, "utf8").toString("base64");
}

async function fetchGithubFile(repo, filePath, branch) {
  const safe = safePath(filePath);
  try {
    return await githubRequest(`/repos/${repo}/contents/${encodeURIComponent(safe).replaceAll("%2F", "/")}?ref=${encodeURIComponent(branch)}`);
  } catch (error) {
    if (/not found/i.test(error.message)) return null;
    throw error;
  }
}

async function commitGithubFile({ repo, branch = "main", filePath, content, message }) {
  const safe = safePath(filePath);
  const current = await fetchGithubFile(repo, safe, branch);
  const body = {
    message: message || `AI Factory update ${safe}`,
    content: encodeBase64Utf8(content),
    branch,
    ...(current?.sha ? { sha: current.sha } : {}),
  };
  const result = await githubRequest(`/repos/${repo}/contents/${encodeURIComponent(safe).replaceAll("%2F", "/")}`, {
    method: "PUT",
    body: JSON.stringify(body),
  });
  return {
    path: safe,
    commitSha: result?.commit?.sha,
    htmlUrl: result?.content?.html_url,
  };
}

function applyReplacements(base, replacements = []) {
  let next = base;
  for (const item of replacements) {
    if (!item?.search || typeof item.replace !== "string") throw new Error("replacement inválido");
    if (!next.includes(item.search)) throw new Error(`Trecho não encontrado: ${item.search.slice(0, 80)}`);
    next = next.replace(item.search, item.replace);
  }
  return next;
}

async function executeGithubTask(task) {
  assertSafeTask(task);
  const repo = task.repository || task.repo;
  const branch = task.branch || "main";
  const filePath = task.filePath || task.path || task.files?.[0];
  if (!repo || !filePath) return null;

  log({ level: "info", taskId: task.id, message: `Executor GitHub iniciado: ${repo}/${filePath}` });

  let content = task.content;
  if (!content && Array.isArray(task.replacements)) {
    const current = await fetchGithubFile(repo, filePath, branch);
    if (!current?.content) throw new Error("Arquivo base não encontrado para replacements");
    const decoded = Buffer.from(current.content, "base64").toString("utf8");
    content = applyReplacements(decoded, task.replacements);
  }

  if (typeof content !== "string") {
    const payload = packageText(task);
    const out = path.join(OUTPUT_DIR, `${task.id}-github-plan.txt`);
    fs.writeFileSync(out, payload);
    log({ level: "warn", taskId: task.id, message: "Tarefa GitHub sem content/replacements. Gerado plano, sem commit." });
    return { planned: true, outputPath: out };
  }

  const result = await commitGithubFile({
    repo,
    branch,
    filePath,
    content,
    message: task.commitMessage || task.message || `AI Factory: ${task.title || task.command || task.action || "update"}`,
  });
  log({ level: "ok", taskId: task.id, message: `Commit aplicado pela Factory: ${result.commitSha}` });
  return result;
}

function seedAutopilotBacklog() {
  const autopilot = getAutopilot();
  if (!autopilot.enabled) return;
  const queue = readJson(QUEUE_FILE, []);
  const hasPending = queue.some((t) => ["queued", "pending", "pendente", "processing"].includes(t.status));
  if (hasPending) return;

  const existingIds = new Set(queue.map((t) => t.id));
  const backlog = [
    {
      id: "auto-topac-faturamento-checklist",
      status: "queued",
      type: "github_commit",
      projectName: "TOPAC RH",
      module: "Faturamento",
      repository: "implantarhconsultoria-coder/rh-prospera-hub-70cb89a5",
      filePath: "docs/AI_FACTORY_AUTOPILOT.md",
      commitMessage: "AI Factory: registrar plano autônomo de execução",
      command: "Registrar plano autônomo da Factory para Faturamento, Clientes, Cadastro Inteligente, validação e próximos passos.",
      content: `# AI Factory Autopilot\n\nStatus: ativo\n\n## Prioridade atual\n- Faturamento > Clientes\n- Novo Cliente Inteligente\n- Upload de PDF/foto/print\n- Conferência antes de salvar\n- Não quebrar cadastro manual\n\n## Próximos ciclos automáticos\n1. Mapear arquivos do módulo de Faturamento.\n2. Aplicar pequenas mudanças seguras por commit.\n3. Registrar logs e resultados.\n4. Deixar tarefas sensíveis aguardando aprovação.\n\nGerado automaticamente pela AI Factory.\n`,
    },
  ].filter((task) => !existingIds.has(task.id));

  if (!backlog.length) return;
  const stamped = backlog.map((task) => ({ ...task, createdAt: new Date().toISOString(), autopilot: true }));
  writeJson(QUEUE_FILE, [...queue, ...stamped]);
  writeJson(AUTOPILOT_FILE, { ...autopilot, lastSeedAt: new Date().toISOString() });
  log({ level: "info", message: `Autopilot criou ${stamped.length} tarefa(s) automática(s)` });
}

async function processTask(task) {
  log({ level: "info", taskId: task.id, message: `Processando tarefa: ${task.title || task.action || task.acao || task.command || task.comando}` });
  const output = packageText(task);
  const outputPath = path.join(OUTPUT_DIR, `${task.id}.txt`);
  fs.writeFileSync(outputPath, output);
  const backupDir = backupFiles(task.projectRoot, task.files || []);
  let githubResult = null;

  if (task.repository || task.repo) {
    githubResult = await executeGithubTask(task);
  }

  if (task.projectRoot && fs.existsSync(path.join(task.projectRoot, "package.json"))) {
    execSync("npm run build", { cwd: task.projectRoot, stdio: "inherit" });
    log({ level: "ok", taskId: task.id, message: "Build validado com sucesso" });
  }
  return { outputPath, backupDir, githubResult };
}

async function tick() {
  ensure();
  seedAutopilotBacklog();
  const queue = readJson(QUEUE_FILE, []);
  const next = [...queue];
  const task = next.find((item) => ["queued", "pending", "pendente"].includes(item.status));
  if (!task) return;
  try {
    task.status = "processing";
    task.startedAt = new Date().toISOString();
    writeJson(QUEUE_FILE, next);
    const result = await processTask(task);
    task.status = "done";
    task.finishedAt = new Date().toISOString();
    task.outputPath = result.outputPath;
    task.backupDir = result.backupDir;
    task.githubResult = result.githubResult;
    writeJson(QUEUE_FILE, next);
    log({ level: "ok", taskId: task.id, message: "Tarefa concluída pela AI Factory" });
  } catch (error) {
    task.status = "error";
    task.error = error.message;
    task.finishedAt = new Date().toISOString();
    writeJson(QUEUE_FILE, next);
    log({ level: "error", taskId: task.id, message: `Erro na tarefa: ${error.message}` });
  }
}

function normalizeUrl(url) {
  return (url || "/").split("?")[0].replace(/\/$/, "") || "/";
}

function receiveTask(req, res) {
  let body = "";
  req.on("data", (chunk) => body += chunk);
  req.on("end", () => {
    try {
      const payload = body ? JSON.parse(body) : {};
      const task = { id: crypto.randomUUID(), createdAt: new Date().toISOString(), status: "queued", ...payload };
      const queue = readJson(QUEUE_FILE, []);
      queue.unshift(task);
      writeJson(QUEUE_FILE, queue);
      log({ level: "info", taskId: task.id, message: `Tarefa recebida via API: ${task.projectName || task.projetoNome || task.project || task.action || task.acao || "sem título"}` });
      send(res, 201, task);
    } catch (error) {
      send(res, 400, { ok: false, error: error.message });
    }
  });
}

function startApi() {
  http.createServer((req, res) => {
    const route = normalizeUrl(req.url);
    if (req.method === "OPTIONS") return send(res, 200, { ok: true });
    if (req.method === "GET" && ["/", "/health", "/saude", "/status"].includes(route)) return send(res, 200, statusPayload());
    if (req.method === "GET" && ["/queue", "/fila"].includes(route)) return send(res, 200, readJson(QUEUE_FILE, []));
    if (req.method === "GET" && route === "/logs") return send(res, 200, readJson(LOG_FILE, []));
    if (req.method === "GET" && route === "/autopilot/start") return send(res, 200, { ok: true, autopilot: setAutopilot(true) });
    if (req.method === "GET" && route === "/autopilot/stop") return send(res, 200, { ok: true, autopilot: setAutopilot(false) });
    if (req.method === "POST" && ["/queue", "/fila"].includes(route)) return receiveTask(req, res);
    return send(res, 200, { ...statusPayload(), notice: `rota ${route} não existe, mas o worker está online` });
  }).listen(PORT, "0.0.0.0", () => console.log(`API worker ativa na porta ${PORT}`));
}

ensure();
console.log("AI Factory Worker LOCAL iniciado");
console.log(`Fila: ${QUEUE_FILE}`);
console.log(`Saídas: ${OUTPUT_DIR}`);
console.log(`Executor GitHub: ${GITHUB_TOKEN ? "ativo" : "sem token"}`);
console.log(`Autopilot: ${getAutopilot().enabled ? "ativo" : "pausado"}`);
startApi();
void tick();
setInterval(() => void tick(), 5000);
