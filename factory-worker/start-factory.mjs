import { createClient } from "@supabase/supabase-js";
import ws from "ws";

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY,
  {
    realtime: {
      transport: ws
    }
  }
);

console.log("AI FACTORY WORKER ONLINE");

const { data, error } = await supabase
  .from("ai_execution_queue")
  .select("*")
  .eq("status", "pending")
  .order("created_at", { ascending: true })
  .limit(1);

if (error) {
  console.error("Erro ao buscar tarefa:", error);
  process.exit(1);
}

if (!data || data.length === 0) {
  console.log("Nenhuma tarefa pendente.");
  process.exit(0);
}

const task = data[0];

console.log("Tarefa encontrada:", task.id);

await supabase
  .from("ai_execution_queue")
  .update({ status: "processing" })
  .eq("id", task.id);

console.log("Processando tarefa:", task.title || task.task_name || task.id);

await supabase
  .from("ai_execution_queue")
  .update({
    status: "done",
    result: {
      message: "Tarefa processada pelo AI Factory Worker",
      processed_at: new Date().toISOString()
    }
  })
  .eq("id", task.id);

console.log("Tarefa finalizada:", task.id);
