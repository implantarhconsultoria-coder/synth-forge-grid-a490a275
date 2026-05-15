import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY
);

console.log("AI FACTORY WORKER ONLINE");

const { data, error } = await supabase
  .from("ai_mission_tasks")
  .select("*")
  .eq("status", "pendente")
  .limit(5);

if (error) throw error;

console.log("Missões encontradas:", data?.length || 0);

for (const task of data || []) {
  console.log("Processando:", task.task_title);

  await supabase
    .from("ai_mission_tasks")
    .update({ status: "concluida" })
    .eq("id", task.id);

  console.log("Concluída:", task.task_title);
}
