import fs from "fs";
import path from "path";
import { createClient } from "@supabase/supabase-js";
import { execSync } from "child_process";

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

console.log("AI Factory Worker iniciado com segurança");

async function processar() {
  const { data: tarefas } = await supabase
    .from("ai_execution_queue")
    .select("*")
    .eq("status", "pending")
    .limit(1);

  if (!tarefas || tarefas.length === 0) {
    console.log("Sem tarefas pendentes");
    return;
  }

  const tarefa = tarefas[0];
  const payload = tarefa.payload || {};
  const projeto = payload.projectRoot;
  const arquivos = payload.files || [];

  try {
    if (!projeto) throw new Error("projectRoot não informado");
    if (!arquivos.length) throw new Error("files não informado");

    const backupDir = path.join(process.cwd(), "factory-backups", String(Date.now()));
    fs.mkdirSync(backupDir, { recursive: true });

    for (const file of arquivos) {
      const origem = path.join(projeto, file);
      const destino = path.join(backupDir, file);
      fs.mkdirSync(path.dirname(destino), { recursive: true });
      fs.copyFileSync(origem, destino);
    }

    console.log("Backup criado");
    console.log("Ação:", payload.action);

    for (const file of arquivos) {
      const arquivo = path.join(projeto, file);
      let conteudo = fs.readFileSync(arquivo, "utf8");

      if (!conteudo.includes("AI FACTORY SAFE PATCH")) {
        conteudo = "// AI FACTORY SAFE PATCH\n" + conteudo;
        fs.writeFileSync(arquivo, conteudo);
      }
    }

    console.log("Patch aplicado. Validando build...");

    execSync("npm run build", { cwd: projeto, stdio: "inherit" });

    await supabase
      .from("ai_execution_queue")
      .update({ status: "done" })
      .eq("id", tarefa.id);

    console.log("Tarefa concluída com build OK");
  } catch (err) {
    console.log("Erro:", err.message);

    await supabase
      .from("ai_execution_queue")
      .update({ status: "error", error_log: err.message })
      .eq("id", tarefa.id);
  }
}

setInterval(processar, 10000);
processar();
