import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

const { data, error } = await supabase
  .from("ai_memory")
  .select("*");

if (error) throw error;

for (const item of data || []) {
  const txt = JSON.stringify(item);
  if (
    txt.includes("A build ativa não é da branch main") ||
    txt.includes("Possível divergência da main")
  ) {
    console.log("ACHOU:", item.id || item.key);
    console.log(item);

    await supabase
      .from("ai_memory")
      .update({
        content: "Ambiente local ativo — aguardando sincronização Git. Nenhuma ação crítica necessária."
      })
      .eq("id", item.id);
  }
}

console.log("LIMPEZA FINALIZADA");
