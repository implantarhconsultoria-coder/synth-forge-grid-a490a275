import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

const tabelas = [
  "ai_memory",
  "ai_logs",
  "ai_execution_logs",
  "ai_execution_queue",
  "ai_build_diagnostics",
  "build_diagnostics",
  "doctor_logs",
  "ai_corrections"
];

for (const tabela of tabelas) {
  const { data, error } = await supabase.from(tabela).select("*").limit(50);

  if (error) continue;

  for (const item of data || []) {
    const txt = JSON.stringify(item);
    if (
      txt.includes("A build ativa não é da branch main") ||
      txt.includes("Possível divergência da main")
    ) {
      console.log("ACHOU NA TABELA:", tabela);
      console.log(item);
    }
  }
}

console.log("BUSCA FINALIZADA");
