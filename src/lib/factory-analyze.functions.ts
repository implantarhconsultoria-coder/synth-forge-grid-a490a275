// Server functions for REAL AI analysis + mission status reads.
import { createServerFn } from "@tanstack/react-start";
import { createClient } from "@supabase/supabase-js";

function admin() {
  const url = process.env.SUPABASE_URL!;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY!;
  if (!url || !key) throw new Error("SUPABASE_URL/SUPABASE_SERVICE_KEY ausentes");
  return createClient(url, key, { auth: { persistSession: false } });
}

interface AnalyzeResult {
  headline: string;
  toValidate: string[];
  risks: string[];
  realCommand: string;
  raw: string;
}

export const aiAnalyze = createServerFn({ method: "POST" })
  .inputValidator((input: { prompt: string }) => {
    if (!input?.prompt?.trim()) throw new Error("Pedido vazio");
    return { prompt: input.prompt.trim().slice(0, 4000) };
  })
  .handler(async ({ data }): Promise<AnalyzeResult> => {
    const apiKey = process.env.LOVABLE_API_KEY;
    if (!apiKey) throw new Error("LOVABLE_API_KEY ausente — configure o segredo");

    const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { "content-type": "application/json", authorization: `Bearer ${apiKey}` },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          {
            role: "system",
            content:
              "Você é o analisador da AI FACTORY. Receba o pedido do usuário e devolva JSON estrito com: headline (string curta), toValidate (array de 4-8 itens objetivos a verificar), risks (array de itens de risco), realCommand (1 frase: comando real a executar). Responda APENAS com JSON válido.",
          },
          { role: "user", content: data.prompt },
        ],
      }),
    });
    if (!res.ok) {
      const t = await res.text();
      throw new Error(`AI ${res.status}: ${t.slice(0, 200)}`);
    }
    const j = await res.json();
    const raw: string = j?.choices?.[0]?.message?.content ?? "";
    const cleaned = raw.replace(/```json|```/g, "").trim();
    let parsed: any = {};
    try {
      parsed = JSON.parse(cleaned);
    } catch {
      // fallback: extrai primeiro bloco {...}
      const m = cleaned.match(/\{[\s\S]*\}/);
      if (m) {
        try {
          parsed = JSON.parse(m[0]);
        } catch {}
      }
    }
    return {
      headline: parsed.headline || data.prompt.slice(0, 80),
      toValidate: Array.isArray(parsed.toValidate) ? parsed.toValidate.slice(0, 10) : [data.prompt],
      risks: Array.isArray(parsed.risks) ? parsed.risks.slice(0, 10) : [],
      realCommand: parsed.realCommand || `Executar: ${data.prompt}`,
      raw: cleaned,
    };
  });

export const runWorkerTick = createServerFn({ method: "POST" }).handler(async () => {
  const sb = admin();
  // dispara tick: chama nosso endpoint público interno via fetch é redundante; replicamos
  // chamando direto: marca pending → pega via tick endpoint. Para simplicidade, retornamos
  // estado atual da fila.
  const { data, error } = await sb
    .from("ai_execution_queue")
    .select("id, status, attempts, result, error, finished_at")
    .order("created_at", { ascending: false })
    .limit(20);
  if (error) throw new Error(error.message);
  return { rows: data ?? [] };
});

export const getMissionStatus = createServerFn({ method: "POST" })
  .inputValidator((input: { id: string }) => {
    if (!input?.id) throw new Error("id obrigatório");
    return input;
  })
  .handler(async ({ data }) => {
    const sb = admin();
    const { data: row, error } = await sb
      .from("ai_execution_queue")
      .select("id, status, attempts, result, error, finished_at, payload")
      .eq("id", data.id)
      .maybeSingle();
    if (error) throw new Error(error.message);
    return row;
  });
