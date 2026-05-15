import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

const { data: missoes, error } = await supabase
  .from("ai_mission_tasks")
  .select("*")
  .in("status", ["open", "running", "correndo"])
  .limit(10);

if (error) throw error;

console.log("MISSÕES ENCONTRADAS:", missoes?.length || 0);

for (const m of missoes || []) {
  const titulo = m.task_title || m.title || "Missão AI Factory";

  await supabase.from("ai_execution_queue").insert({
    type: "project_update",
    status: "pending",
    payload: {
      projectRoot: "/workspaces/rh-prospera-hub",
      action: "execute_mission",
      files: ["src/pages/DashboardPage.tsx"],
      objective: titulo
    }
  });

  await supabase
    .from("ai_mission_tasks")
    .update({ status: "queued" })
    .eq("id", m.id);

  console.log("ENVIADA:", titulo);
}

console.log("PONTE FINALIZADA");
