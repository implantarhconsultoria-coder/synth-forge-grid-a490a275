import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

const { data, error } = await supabase
  .from("ai_execution_queue")
  .select("*")
  .order("created_at", { ascending: false })
  .limit(5);

console.log(JSON.stringify(data || error, null, 2));
