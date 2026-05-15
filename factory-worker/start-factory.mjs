import { createClient } from "@supabase/supabase-js";
import { spawn } from "child_process";

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY
);

console.log("AI FACTORY ORQUESTRADOR LIGADO");

const child = spawn("node", ["index.mjs"], {
  cwd: process.cwd(),
  stdio: "inherit",
  env: process.env
});

child.on("exit", (code) => {
  console.log("Worker finalizado:", code);
});
