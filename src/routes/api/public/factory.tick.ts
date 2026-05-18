// AI FACTORY — REAL worker endpoint
// Processa a fila ai_execution_queue usando Lovable AI Gateway.
// Se GITHUB_TOKEN estiver presente, também aplica commits reais nos repos alvo.

import { createFileRoute } from "@tanstack/react-router";
import { createClient } from "@supabase/supabase-js";

const MAX_PER_TICK = 3;

interface QueueRow {
  id: string;
  status: string;
  payload: any;
  attempts: number;
}

function admin() {
  const url = process.env.SUPABASE_URL!;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY!;
  return createClient(url, key, { auth: { persistSession: false } });
}

async function callLovableAI(prompt: string): Promise<string> {
  const apiKey = process.env.LOVABLE_API_KEY;
  if (!apiKey) throw new Error("LOVABLE_API_KEY ausente");
  const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: "google/gemini-2.5-flash",
      messages: [
        {
          role: "system",
          content:
            "Você é o executor da AI FACTORY. Recebe uma missão com escopo rígido (arquivos, tabelas, restrições) e devolve um PLANO DE EXECUÇÃO REAL em markdown contendo: diagnóstico, arquivos a editar, diffs propostos (em blocos ```diff), comandos SQL (se houver), e checklist final. Não invente arquivos fora do escopo.",
        },
        { role: "user", content: prompt },
      ],
    }),
  });
  if (!res.ok) {
    const t = await res.text();
    throw new Error(`AI ${res.status}: ${t.slice(0, 300)}`);
  }
  const j = await res.json();
  return j?.choices?.[0]?.message?.content ?? "(sem conteúdo)";
}

async function tryCommitToGithub(opts: {
  repo: string; // "owner/repo"
  path: string;
  content: string;
  message: string;
}): Promise<{ sha: string; url: string } | null> {
  const token = process.env.GITHUB_TOKEN;
  if (!token) return null;
  const [owner, repo] = opts.repo.split("/");
  if (!owner || !repo) return null;
  const api = `https://api.github.com/repos/${owner}/${repo}/contents/${opts.path}`;
  let existingSha: string | undefined;
  const head = await fetch(api, { headers: { authorization: `Bearer ${token}`, "user-agent": "ai-factory" } });
  if (head.ok) {
    const j = await head.json();
    existingSha = j?.sha;
  }
  const put = await fetch(api, {
    method: "PUT",
    headers: {
      authorization: `Bearer ${token}`,
      "content-type": "application/json",
      "user-agent": "ai-factory",
    },
    body: JSON.stringify({
      message: opts.message,
      content: Buffer.from(opts.content, "utf8").toString("base64"),
      sha: existingSha,
    }),
  });
  if (!put.ok) {
    const t = await put.text();
    throw new Error(`GitHub ${put.status}: ${t.slice(0, 300)}`);
  }
  const j = await put.json();
  return { sha: j?.content?.sha, url: j?.content?.html_url };
}

async function processRow(sb: ReturnType<typeof admin>, row: QueueRow) {
  await sb
    .from("ai_execution_queue")
    .update({ status: "processing", started_at: new Date().toISOString(), attempts: row.attempts + 1 })
    .eq("id", row.id);

  const p = row.payload || {};
  const objective: string = p.objective || "Missão sem objetivo";
  const project: string = p.project || "AI FACTORY";

  await sb.from("smart_logs").insert({
    level: "info",
    type: "system",
    project,
    message: `Worker iniciou execução real: ${objective.slice(0, 100)}`,
    metadata: { queue_id: row.id },
  });

  try {
    const plan = await callLovableAI(objective);

    let commit: { sha: string; url: string } | null = null;
    if (p.repo && p.targetPath) {
      try {
        commit = await tryCommitToGithub({
          repo: p.repo,
          path: `${p.targetPath}/ai-factory-plan-${row.id}.md`,
          content: `# Plano AI FACTORY\n\n_Queue ${row.id}_\n\n## Objetivo\n${objective}\n\n## Plano\n${plan}\n`,
          message: `chore(ai-factory): plano gerado para queue ${row.id}`,
        });
      } catch (gh: any) {
        await sb.from("smart_logs").insert({
          level: "warn",
          type: "system",
          project,
          message: `Commit GitHub falhou: ${gh.message}`,
          metadata: { queue_id: row.id },
        });
      }
    }

    await sb
      .from("ai_execution_queue")
      .update({
        status: "done",
        finished_at: new Date().toISOString(),
        result: { plan, commit, model: "google/gemini-2.5-flash" },
      })
      .eq("id", row.id);

    await sb.from("smart_logs").insert({
      level: "ok",
      type: "system",
      project,
      message: commit
        ? `Missão executada + commit real: ${commit.url}`
        : `Missão executada (plano gerado pela IA real)`,
      metadata: { queue_id: row.id, commit },
    });
    return { id: row.id, ok: true, commit: !!commit };
  } catch (e: any) {
    await sb
      .from("ai_execution_queue")
      .update({
        status: "failed",
        finished_at: new Date().toISOString(),
        error: e?.message || String(e),
      })
      .eq("id", row.id);

    await sb.from("smart_logs").insert({
      level: "error",
      type: "system",
      project,
      message: `Falha na execução real: ${e?.message || e}`,
      metadata: { queue_id: row.id },
    });
    return { id: row.id, ok: false, error: e?.message };
  }
}

async function handle() {
  const sb = admin();
  const { data, error } = await sb
    .from("ai_execution_queue")
    .select("id, status, payload, attempts")
    .in("status", ["pending", "open"])
    .order("created_at", { ascending: true })
    .limit(MAX_PER_TICK);

  if (error) {
    return new Response(JSON.stringify({ ok: false, error: error.message }), {
      status: 500,
      headers: { "content-type": "application/json" },
    });
  }

  const results: any[] = [];
  for (const row of (data || []) as QueueRow[]) {
    results.push(await processRow(sb, row));
  }
  return new Response(
    JSON.stringify({
      ok: true,
      processed: results.length,
      results,
      hasGithub: !!process.env.GITHUB_TOKEN,
      hasAI: !!process.env.LOVABLE_API_KEY,
    }),
    { headers: { "content-type": "application/json" } },
  );
}

export const Route = createFileRoute("/api/public/factory/tick")({
  server: {
    handlers: {
      GET: async () => handle(),
      POST: async () => handle(),
    },
  },
});
