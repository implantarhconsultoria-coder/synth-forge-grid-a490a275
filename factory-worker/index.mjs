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

const FACTORY_HEARTBEAT = {
  startedAt: new Date().toISOString(),
  lastCycle: null,
  cycles: 0,
  selfHealing: true,
  watchdog: true,
  continuousScan: true,
};

function heartbeat() {
  FACTORY_HEARTBEAT.lastCycle = new Date().toISOString();
  FACTORY_HEARTBEAT.cycles += 1;
}

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

function detectStuckTasks(queue = []) {
  const now = Date.now();
  return queue.filter((task) => {
    if (task.status !== "processing") return false;
    const started = new Date(task.startedAt || now).getTime();
    return now - started > 1000 * 60 * 10;
  });
}

function selfHealQueue() {
  const queue = readJson(QUEUE_FILE, []);
  const stuck = detectStuckTasks(queue);
  if (!stuck.length) return;

  for (const task of stuck) {
    task.status = "queued";
    task.recoveredAt = new Date().toISOString();
    task.recoveryReason = "watchdog_auto_recovery";
  }

  writeJson(QUEUE_FILE, queue);
}

function sortQueueByPriority(queue = []) {
  const weight = {
    critical: 1,
    high: 2,
    medium: 3,
    low: 4,
  };

  return [...queue].sort((a, b) => {
    const wa = weight[a.priority || "medium"] || 3;
    const wb = weight[b.priority || "medium"] || 3;
    return wa - wb;
  });
}

setInterval(() => {
  try {
    heartbeat();
    selfHealQueue();

    const queue = readJson(QUEUE_FILE, []);
    const ordered = sortQueueByPriority(queue);
    writeJson(QUEUE_FILE, ordered);
  } catch (error) {
    console.error("SELF HEAL ERROR", error.message);
  }
}, 15000);
