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

function mapMission(row: any) {
  if (!row) return row;
  return {
    ...row,
    title: row.title ?? row.titulo ?? row.nome ?? "Missão",
    description: row.description ?? row.objective ?? row.objetivo ?? row.descricao ?? "",
    objective: row.objective ?? row.description ?? row.objetivo ?? row.descricao ?? "",
    status: row.status ?? "open",
    priority: row.priority ?? row.prioridade ?? "medium",
    created_at: row.created_at ?? row.criado_em ?? new Date().toISOString(),
  };
}

function mapMemory(row: any) {
  if (!row) return row;
  return {
    ...row,
    key: row.key ?? row.memory_key ?? row.chave ?? row.module ?? row.modulo ?? "memo",
    value: row.value ?? row.memory_value ?? row.valor ?? row.conteudo ?? "",
    created_at: row.created_at ?? row.criado_em ?? new Date().toISOString(),
  };
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

  listMissions: async () => {
    const rows = await safe<any[]>(() =>
      supabase.from("ai_missions").select("*").order("created_at", { ascending: false }) as any,
    );
    return Array.isArray(rows) ? rows.map(mapMission) : rows;
  },

  listMemories: async () => {
    const rows = await safe<any[]>(() =>
      supabase.from("ai_memory").select("*").order("created_at", { ascending: false }) as any,
    );
    return Array.isArray(rows) ? rows.map(mapMemory) : rows;
  },

  getDashboardSummary: () => safe(() => supabase.from("dashboard_summary").select("*").limit(1).maybeSingle() as any),

  // ----- WRITES -----
  insertProject: (payload: Record<string, unknown>) =>
    safe(() => supabase.from("projects").insert(payload).select().single() as any),

  insertMission: async (payload: Record<string, unknown>) => {
    const dbPayload = {
      title: payload.title ?? payload.titulo ?? "Missão",
      objective: payload.description ?? payload.objective ?? payload.objetivo ?? "",
      status: payload.status ?? "open",
      priority: payload.priority ?? payload.prioridade ?? "critical",
    };

    const row = await safe<any>(() => supabase.from("ai_missions").insert(dbPayload).select().single() as any);
    return mapMission(row);
  },

  insertMemory: async (payload: Record<string, unknown>) => {
    const dbPayload = {
      module: payload.module ?? "factory_admin",
      memory_key: payload.key ?? payload.memory_key ?? "memo",
      memory_value: payload.value ?? payload.memory_value ?? "",
    };

    const row = await safe<any>(() => supabase.from("ai_memory").insert(dbPayload).select().single() as any);
    return mapMemory(row);
  },

  insertSmartLog: (payload: Record<string, unknown>) =>
    safe(() => supabase.from("smart_logs").insert(payload).select().single() as any),
};
