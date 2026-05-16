import fs from "fs";
import path from "path";
import { execSync } from "child_process";

const ROOT = process.cwd();
const DATA_DIR = path.join(ROOT, "factory-data");
const QUEUE_FILE = path.join(DATA_DIR, "execution-queue.json");
const LOG_FILE = path.join(DATA_DIR, "execution-logs.json");
const OUTPUT_DIR = path.join(ROOT, "factory-output");
const BACKUP_DIR = path.join(ROOT, "factory-backups");

function ensure() {
  fs.mkdirSync(DATA_DIR, { recursive: true });
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  fs.mkdirSync(BACKUP_DIR, { recursive: true });
  if (!fs.existsSync(QUEUE_FILE)) fs.writeFileSync(QUEUE_FILE, "[]");
  if (!fs.existsSync(LOG_FILE)) fs.writeFileSync(LOG_FILE, "[]");
}

function readJson(file, fallback = []) {
  try {
    return JSON.parse(fs.readFileSync(file, "utf8"));
  } catch {
    return fallback;
  }
}

function writeJson(file, value) {
  fs.writeFileSync(file, JSON.stringify(value, null, 2));
}

function log(entry) {
  const logs = readJson(LOG_FILE, []);
  logs.unshift({ id: crypto.randomUUID(), createdAt: new Date().toISOString(), ...entry });
  writeJson(LOG_FILE, logs.slice(0, 300));
  console.log(`[${entry.level || "info"}] ${entry.message}`);
}

function packageText(task) {
  const project = task.projectName || task.project || "AI Factory";
  const action = task.command || task.objective || task.action || "executar missão";
  const target = /supabase|banco|login|permiss|auth|tabela|rls/i.test(action) ? "Supabase" : /github|codigo|código|arquivo|worker|commit|repo/i.test(action) ? "GitHub/Codespaces" : "Lovable";
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

function processTask(task) {
  log({ level: "info", taskId: task.id, message: `Processando tarefa: ${task.title || task.action || task.command}` });

  const output = packageText(task);
  const outputPath = path.join(OUTPUT_DIR, `${task.id}.txt`);
  fs.writeFileSync(outputPath, output);

  const backupDir = backupFiles(task.projectRoot, task.files || []);

  if (task.projectRoot && fs.existsSync(path.join(task.projectRoot, "package.json"))) {
    try {
      execSync("npm run build", { cwd: task.projectRoot, stdio: "inherit" });
      log({ level: "ok", taskId: task.id, message: "Build validado com sucesso" });
    } catch (error) {
      log({ level: "error", taskId: task.id, message: `Build falhou: ${error.message}` });
      throw error;
    }
  }

  return { outputPath, backupDir };
}

function tick() {
  ensure();
  const queue = readJson(QUEUE_FILE, []);
  const next = [...queue];
  const task = next.find((item) => ["queued", "pending"].includes(item.status));

  if (!task) {
    console.log("Sem tarefas pendentes");
    return;
  }

  try {
    task.status = "processing";
    task.startedAt = new Date().toISOString();
    writeJson(QUEUE_FILE, next);

    const result = processTask(task);

    task.status = "done";
    task.finishedAt = new Date().toISOString();
    task.outputPath = result.outputPath;
    task.backupDir = result.backupDir;
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

ensure();
console.log("AI Factory Worker LOCAL iniciado");
console.log(`Fila: ${QUEUE_FILE}`);
console.log(`Saídas: ${OUTPUT_DIR}`);
tick();
setInterval(tick, 10000);
