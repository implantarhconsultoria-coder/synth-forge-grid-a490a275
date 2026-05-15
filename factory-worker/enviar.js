import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

await supabase.from("ai_execution_queue").insert({
  type: "project_update",
  status: "pending",
  payload: {
    projectRoot: "/workspaces/rh-prospera-hub",
    action: "execute_mission",
    files: ["src/pages/DashboardPage.tsx"],
    objective: "Corrigir dashboard mobile da TOPAC"
  }
});

console.log("MISSÃO ENVIADA DIRETO PARA EXECUÇÃO");
