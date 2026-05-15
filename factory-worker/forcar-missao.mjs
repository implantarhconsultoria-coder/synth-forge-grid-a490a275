import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

const { data, error } = await supabase.from("ai_execution_queue").insert({
  type: "project_update",
  status: "pending",
  action: "execute_mission",
  payload: {
    projectRoot: "/workspaces/rh-prospera-hub",
    project: "TOPAC RH PRO",
    objective: "TESTE REAL: confirmar execução automática da AI Factory",
    files: ["src/pages/DashboardPage.tsx"]
  }
}).select();

console.log(error || data);
