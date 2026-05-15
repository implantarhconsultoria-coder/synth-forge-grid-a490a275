import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

const { data, error } = await supabase
  .from("ai_execution_queue")
  .insert([
    {
      type: "project_update",
      status: "pending",
      payload: {
        projectRoot: "/workspaces/rh-prospera-hub",
        action: "update_dashboard",
        files: ["src/pages/DashboardPage.tsx"],
        objective: "Criar versão mobile moderna do dashboard mantendo layout desktop intacto"
      }
    }
  ]);

console.log(data || error);
