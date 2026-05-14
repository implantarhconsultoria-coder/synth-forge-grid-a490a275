import { createClient } from "@supabase/supabase-js";

// Cliente Supabase publishable (frontend-safe).
// Usa apenas anon/publishable key. Sem auth, sem service_role.
const SUPABASE_URL = "https://bywsbeunrmbaqhvzluji.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "sb_publishable_lSr1xOlGXxlQDSATqC-MRQ_t7SoIRQJ";

export const supabase = createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
  auth: { persistSession: false, autoRefreshToken: false },
});

export const SUPABASE_ENABLED = true;
