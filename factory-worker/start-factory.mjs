import WebSocket from "ws";
globalThis.WebSocket = WebSocket;

import { spawn } from "child_process";

console.log("AI FACTORY ORQUESTRADOR LIGADO");

const child = spawn("node", ["index.mjs"], {
  cwd: process.cwd(),
  stdio: "inherit",
  env: process.env
});

child.on("exit", (code) => {
  console.log("Worker finalizado:", code);
});
