import { createClient } from "@supabase/supabase-js";
import WebSocket from "ws";

globalThis.WebSocket = WebSocket;

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY,
  {
    realtime: {
      transport: "websocket"
    }
  }
);

console.log("🤖 AI FACTORY WORKER ONLINE");

async function processarMissoes() {
  try {

    const { data: tasks, error } = await supabase
      .from("ai_mission_tasks")
      .select("*")
      .in("status", ["pending", "open"])
      .limit(5);

    if (error) {
      console.log("Erro buscando tarefas:", error.message);
      return;
    }

    if (!tasks || tasks.length === 0) {
      console.log("Nenhuma missão pendente...");
      return;
    }

    for (const task of tasks) {

      console.log("⚙️ Processando:", task.title);

      await supabase
        .from("ai_mission_tasks")
        .update({
          status: "running",
          started_at: new Date().toISOString()
        })
        .eq("id", task.id);

      await new Promise(r => setTimeout(r, 3000));

      await supabase
        .from("ai_mission_tasks")
        .update({
          status: "completed",
          completed_at: new Date().toISOString(),
          result: "Missão processada automaticamente pela AI Factory"
        })
        .eq("id", task.id);

      console.log("✅ Concluída:", task.title);

    }

  } catch (err) {

    console.log("ERRO GERAL:", err.message);

  }
}

processarMissoes();

setInterval(processarMissoes, 15000);
