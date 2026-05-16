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
const AUDIT_FILE = path.join(DATA_DIR, "factory-audit.json");
const AUTOPILOT_FILE = path.join(DATA_DIR, "autopilot.json");
const PORT = Number(process.env.FACTORY_PORT || 8787);
const GITHUB_TOKEN = process.env.GITHUB_TOKEN || process.env.GH_TOKEN || "";
const AUTOPILOT_DEFAULT = process.env.FACTORY_AUTOPILOT !== "false";

const HEARTBEAT = {
  startedAt: new Date().toISOString(),
  lastCycle: null,
  cycles: 0,
  mode: "AUTOPILOT_PRO",
  excellence: true,
};

function ensure() {
  fs.mkdirSync(DATA_DIR, { recursive: true });
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  fs.mkdirSync(BACKUP_DIR, { recursive: true });
  if (!fs.existsSync(QUEUE_FILE)) fs.writeFileSync(QUEUE_FILE, "[]");
  if (!fs.existsSync(LOG_FILE)) fs.writeFileSync(LOG_FILE, "[]");
  if (!fs.existsSync(AUDIT_FILE)) fs.writeFileSync(AUDIT_FILE, "[]");
  if (!fs.existsSync(AUTOPILOT_FILE)) fs.writeFileSync(AUTOPILOT_FILE, JSON.stringify({ enabled: AUTOPILOT_DEFAULT, level: "PRO", lastSeedAt: null }, null, 2));
}

function readJson(file, fallback = []) {
  try { return JSON.parse(fs.readFileSync(file, "utf8")); } catch { return fallback; }
}
function writeJson(file, value) { fs.writeFileSync(file, JSON.stringify(value, null, 2)); }

function log(entry) {
  const item = { id: crypto.randomUUID(), createdAt: new Date().toISOString(), ...entry };
  const logs = readJson(LOG_FILE, []);
  logs.unshift(item);
  writeJson(LOG_FILE, logs.slice(0, 700));
  console.log(`[${entry.level || "info"}] ${entry.message}`);
}

function audit(entry) {
  const item = { id: crypto.randomUUID(), createdAt: new Date().toISOString(), ...entry };
  const list = readJson(AUDIT_FILE, []);
  list.unshift(item);
  writeJson(AUDIT_FILE, list.slice(0, 1000));
}

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
  return readJson(AUTOPILOT_FILE, { enabled: AUTOPILOT_DEFAULT, level: "PRO", lastSeedAt: null });
}
function setAutopilot(enabled) {
  const current = getAutopilot();
  const next = { ...current, enabled, level: "PRO", updatedAt: new Date().toISOString() };
  writeJson(AUTOPILOT_FILE, next);
  audit({ type: "autopilot", action: enabled ? "start" : "stop" });
  return next;
}

function statusPayload() {
  const queue = readJson(QUEUE_FILE, []);
  return {
    ok: true,
    worker: "AI Factory Local",
    status: "online",
    mode: "AUTOPILOT_PRO_EXCELLENCE",
    autopilot: getAutopilot().enabled ? "ativo" : "pausado",
    executorGithub: Boolean(GITHUB_TOKEN),
    heartbeat: HEARTBEAT,
    port: PORT,
    fila: queue.length,
    pendentes: queue.filter((t) => ["queued", "pending", "pendente"].includes(t.status)).length,
    processando: queue.filter((t) => t.status === "processing").length,
    concluidas: queue.filter((t) => t.status === "done").length,
    erros: queue.filter((t) => t.status === "error").length,
    logs: readJson(LOG_FILE, []).length,
    audit: readJson(AUDIT_FILE, []).length,
    rotas: ["/status", "/fila", "/logs", "/audit", "/autopilot/start", "/autopilot/stop", "POST /fila"],
  };
}

function heartbeat() {
  HEARTBEAT.lastCycle = new Date().toISOString();
  HEARTBEAT.cycles += 1;
}

function normalizeUrl(url) {
  return (url || "/").split("?")[0].replace(/\/$/, "") || "/";
}

function safePath(filePath) {
  if (!filePath || typeof filePath !== "string") throw new Error("Arquivo inválido");
  if (filePath.includes("..") || filePath.startsWith("/") || filePath.includes("\\")) throw new Error(`Caminho bloqueado: ${filePath}`);
  return filePath;
}

function assertSafeTask(task) {
  const text = JSON.stringify(task).toLowerCase();
  const dangerous = ["delete from", "drop table", "truncate", "rm -rf", "service_role", "private key", "password", "senha", "secret", "token:"];
  const hit = dangerous.find((word) => text.includes(word));
  if (hit) throw new Error(`Tarefa bloqueada por segurança: ${hit}`);
}

function priorityWeight(task) {
  const map = { critical: 1, high: 2, medium: 3, low: 4 };
  return map[task.priority || "medium"] || 3;
}

function sortQueue(queue = []) {
  return [...queue].sort((a, b) => priorityWeight(a) - priorityWeight(b));
}

function selfHealQueue() {
  const queue = readJson(QUEUE_FILE, []);
  const now = Date.now();
  let changed = false;
  for (const task of queue) {
    if (task.status === "processing") {
      const started = new Date(task.startedAt || now).getTime();
      if (now - started > 1000 * 60 * 10) {
        task.status = "queued";
        task.recoveredAt = new Date().toISOString();
        task.recoveryReason = "watchdog_auto_recovery";
        changed = true;
        log({ level: "warn", taskId: task.id, message: `Watchdog recuperou tarefa travada: ${task.id}` });
      }
    }
  }
  if (changed) writeJson(QUEUE_FILE, sortQueue(queue));
}

function packageText(task) {
  const project = task.projectName || task.projetoNome || task.project || "AI Factory";
  const action = task.command || task.comando || task.objective || task.action || task.acao || "executar missão";
  return [
    "AI FACTORY PRO EXECUTION PACKET",
    `Projeto: ${project}`,
    `Tarefa: ${task.id}`,
    `Prioridade: ${task.priority || "medium"}`,
    "",
    "Objetivo:",
    action,
    "",
    "Guardrails:",
    "- Não refazer projeto do zero.",
    "- Não quebrar login, permissões, menus ou dados existentes.",
    "- Mudanças pequenas, auditáveis e reversíveis.",
    "- Produção sensível pede aprovação humana.",
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

async function githubRequest(endpoint, options = {}) {
  if (!GITHUB_TOKEN) throw new Error("GITHUB_TOKEN/GH_TOKEN não configurado no worker");
  const response = await fetch(`https://api.github.com${endpoint}`, {
    ...options,
    headers: {
      Accept: "application/vnd.github+json",
      Authorization: `Bearer ${GITHUB_TOKEN}`,
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

async function fetchGithubFile(repo, filePath, branch = "main") {
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
  const result = await githubRequest(`/repos/${repo}/contents/${encodeURIComponent(safe).replaceAll("%2F", "/")}`, {
    method: "PUT",
    body: JSON.stringify({
      message: message || `AI Factory PRO: update ${safe}`,
      content: encodeBase64Utf8(content),
      branch,
      ...(current?.sha ? { sha: current.sha } : {}),
    }),
  });
  return { path: safe, commitSha: result?.commit?.sha, htmlUrl: result?.content?.html_url };
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

  audit({ type: "github_task_started", taskId: task.id, repo, filePath });
  log({ level: "info", taskId: task.id, message: `Executor GitHub PRO: ${repo}/${filePath}` });

  let content = task.content;
  if (!content && Array.isArray(task.replacements)) {
    const current = await fetchGithubFile(repo, filePath, branch);
    if (!current?.content) throw new Error("Arquivo base não encontrado");
    content = applyReplacements(Buffer.from(current.content, "base64").toString("utf8"), task.replacements);
  }

  if (typeof content !== "string") {
    const out = path.join(OUTPUT_DIR, `${task.id}-plan.txt`);
    fs.writeFileSync(out, packageText(task));
    log({ level: "warn", taskId: task.id, message: "Sem content/replacements. Plano gerado, sem commit." });
    return { planned: true, outputPath: out };
  }

  const result = await commitGithubFile({
    repo,
    branch,
    filePath,
    content,
    message: task.commitMessage || task.message || `AI Factory PRO: ${task.title || task.command || task.action || "update"}`,
  });
  audit({ type: "github_commit_done", taskId: task.id, repo, filePath, commitSha: result.commitSha });
  log({ level: "ok", taskId: task.id, message: `Commit aplicado pela Factory PRO: ${result.commitSha}` });
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
      id: "auto-excellence-operational-map",
      status: "queued",
      priority: "high",
      type: "github_commit",
      projectName: "TOPAC RH",
      repository: "implantarhconsultoria-coder/rh-prospera-hub-70cb89a5",
      filePath: "docs/AI_FACTORY_EXCELLENCE_MAP.md",
      commitMessage: "AI Factory PRO: criar mapa de excelência operacional",
      command: "Criar mapa vivo de excelência operacional para módulos, riscos, próximos ciclos e melhorias contínuas.",
      content: `# AI Factory PRO - Excellence Map\n\nModo: Autopilot PRO\n\n## Prioridade imediata\n- Faturamento > Clientes\n- Cadastro Inteligente\n- Evolução incremental sem quebrar cadastro manual\n\n## Ciclo operacional\n1. Mapear telas e arquivos.\n2. Criar pequenas melhorias seguras.\n3. Registrar commit auditável.\n4. Separar tarefas sensíveis para aprovação.\n5. Manter build e navegação estáveis.\n\n## Guardrails\n- Não alterar login/permissões sem aprovação.\n- Não remover dados.\n- Não reescrever projeto do zero.\n- Toda mudança deve ser pequena, reversível e registrada.\n\nGerado automaticamente pela AI Factory PRO.\n`,
    },
  ].filter((t) => !existingIds.has(t.id));

  if (!backlog.length) return;
  writeJson(QUEUE_FILE, sortQueue([...queue, ...backlog.map((t) => ({ ...t, createdAt: new Date().toISOString(), autopilot: true }))]));
  writeJson(AUTOPILOT_FILE, { ...autopilot, lastSeedAt: new Date().toISOString() });
  log({ level: "info", message: `Autopilot PRO criou ${backlog.length} tarefa(s).` });
}

async function processTask(task) {
  log({ level: "info", taskId: task.id, message: `Processando: ${task.title || task.action || task.command || task.comando}` });
  fs.writeFileSync(path.join(OUTPUT_DIR, `${task.id}.txt`), packageText(task));
  const backupDir = backupFiles(task.projectRoot, task.files || []);
  const githubResult = (task.repository || task.repo) ? await executeGithubTask(task) : null;
  if (task.projectRoot && fs.existsSync(path.join(task.projectRoot, "package.json"))) {
    execSync("npm run build", { cwd: task.projectRoot, stdio: "inherit" });
    log({ level: "ok", taskId: task.id, message: "Build validado." });
  }
  return { backupDir, githubResult };
}

async function tick() {
  ensure();
  heartbeat();
  selfHealQueue();
  seedAutopilotBacklog();

  const queue = sortQueue(readJson(QUEUE_FILE, []));
  const task = queue.find((t) => ["queued", "pending", "pendente"].includes(t.status));
  if (!task) {
    writeJson(QUEUE_FILE, queue);
    return;
  }

  try {
    task.status = "processing";
    task.startedAt = new Date().toISOString();
    writeJson(QUEUE_FILE, queue);
    const result = await processTask(task);
    task.status = "done";
    task.finishedAt = new Date().toISOString();
    task.backupDir = result.backupDir;
    task.githubResult = result.githubResult;
    writeJson(QUEUE_FILE, queue);
    audit({ type: "task_done", taskId: task.id });
    log({ level: "ok", taskId: task.id, message: "Tarefa concluída pela Factory PRO." });
  } catch (error) {
    task.status = "error";
    task.error = error.message;
    task.finishedAt = new Date().toISOString();
    writeJson(QUEUE_FILE, queue);
    audit({ type: "task_error", taskId: task.id, error: error.message });
    log({ level: "error", taskId: task.id, message: `Erro: ${error.message}` });
  }
}

function receiveTask(req, res) {
  let body = "";
  req.on("data", (chunk) => body += chunk);
  req.on("end", () => {
    try {
      const payload = body ? JSON.parse(body) : {};
      const task = { id: crypto.randomUUID(), createdAt: new Date().toISOString(), status: "queued", priority: payload.priority || "medium", ...payload };
      const queue = sortQueue([task, ...readJson(QUEUE_FILE, [])]);
      writeJson(QUEUE_FILE, queue);
      audit({ type: "task_received", taskId: task.id });
      log({ level: "info", taskId: task.id, message: `Tarefa recebida: ${task.projectName || task.action || "sem título"}` });
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
    if (req.method === "GET" && route === "/audit") return send(res, 200, readJson(AUDIT_FILE, []));
    if (req.method === "GET" && route === "/autopilot/start") return send(res, 200, { ok: true, autopilot: setAutopilot(true) });
    if (req.method === "GET" && route === "/autopilot/stop") return send(res, 200, { ok: true, autopilot: setAutopilot(false) });
    if (req.method === "POST" && ["/queue", "/fila"].includes(route)) return receiveTask(req, res);
    return send(res, 200, { ...statusPayload(), notice: `rota ${route} não existe, worker online` });
  }).listen(PORT, "0.0.0.0", () => console.log(`API worker ativa na porta ${PORT}`));
}

ensure();
console.log("AI Factory Worker PRO iniciado");
console.log(`Fila: ${QUEUE_FILE}`);
console.log(`Saídas: ${OUTPUT_DIR}`);
console.log(`Executor GitHub: ${GITHUB_TOKEN ? "ativo" : "sem token"}`);
console.log(`Autopilot PRO: ${getAutopilot().enabled ? "ativo" : "pausado"}`);
startApi();
void tick();
setInterval(() => void tick(), 5000);
