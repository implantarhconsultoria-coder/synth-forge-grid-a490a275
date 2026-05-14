// AI FACTORY — Supabase API layer
// Wrappers tipados sobre as tabelas existentes. Toda função tolera falha
// e devolve null para que o factory-data possa cair no fallback mock.

import { supabase } from "./supabase-client";

async function safe<T>(fn: () => Promise<{ data: T | null; error: unknown }>): Promise<T | null> {
  try {
    const { data, error } = await fn();
    if (error) {
      console.warn("[supabase-api] erro:", error);
      return null;
    }
    return data;
  } catch (e) {
    console.warn("[supabase-api] exceção:", e);
    return null;
  }
}

export const supabaseApi = {
  // ----- READS -----
  listProjects: () =>
    safe(() => supabase.from("projects").select("*").order("created_at", { ascending: false }) as any),

  listSmartLogs: (limit = 50) =>
    safe(() =>
      supabase.from("smart_logs").select("*").order("created_at", { ascending: false }).limit(limit) as any,
    ),

  listIntegrations: () => safe(() => supabase.from("integrations").select("*") as any),

  listAlerts: () => safe(() => supabase.from("alerts").select("*") as any),

  listCorrections: () =>
    safe(() => supabase.from("corrections").select("*").order("created_at", { ascending: false }) as any),

  listCommands: () =>
    safe(() => supabase.from("commands").select("*").order("created_at", { ascending: false }) as any),

  listMissions: () =>
    safe(() => supabase.from("ai_missions").select("*").order("created_at", { ascending: false }) as any),

  listMemories: () =>
    safe(() => supabase.from("ai_memory").select("*").order("created_at", { ascending: false }) as any),

  getDashboardSummary: () => safe(() => supabase.from("dashboard_summary").select("*").limit(1).maybeSingle() as any),

  // ----- WRITES -----
  insertProject: (payload: Record<string, unknown>) =>
    safe(() => supabase.from("projects").insert(payload).select().single() as any),

  insertMission: (payload: Record<string, unknown>) =>
    safe(() => supabase.from("ai_missions").insert(payload).select().single() as any),

  insertMemory: (payload: Record<string, unknown>) =>
    safe(() => supabase.from("ai_memory").insert(payload).select().single() as any),

  insertSmartLog: (payload: Record<string, unknown>) =>
    safe(() => supabase.from("smart_logs").insert(payload).select().single() as any),
};
