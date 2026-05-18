import { createServerFn } from "@tanstack/react-start";

export type DiagnosisStatus = "wrong" | "ready" | "missing";

export interface Diagnosis {
  status: DiagnosisStatus;
  headline: string;
  reason?: string;
  risk?: string;
  suggestion?: string;
  whereToUse?: string;
  canRelease?: boolean;
  missing?: string[];
  needsConfig?: string[];
  impact?: string;
  askToStart?: boolean;
}

const SYSTEM = `Você é a AI FACTORY, um diagnosticador operacional rigoroso da ImplantaRH.
Analise o pedido do operador e retorne UM diagnóstico estruturado via tool call.

Regras:
- status="wrong"   → quando a ideia/pedido tem erro lógico, risco alto, contradição, ou caminho inviável.
- status="ready"   → quando o pedido já está claro, viável e pode ser executado/liberado.
- status="missing" → quando falta informação, configuração ou pré-requisito.

Sempre seja direto, técnico, em português do Brasil. Sem floreio. Sem emojis.`;

export const analyzeMission = createServerFn({ method: "POST" })
  .inputValidator((input: { prompt: string }) => {
    if (!input?.prompt || typeof input.prompt !== "string") {
      throw new Error("prompt obrigatório");
    }
    return { prompt: input.prompt.slice(0, 4000) };
  })
  .handler(async ({ data }): Promise<Diagnosis> => {
    const apiKey = process.env.LOVABLE_API_KEY;
    if (!apiKey) throw new Error("LOVABLE_API_KEY ausente");

    const resp = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: SYSTEM },
          { role: "user", content: data.prompt },
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "emit_diagnosis",
              description: "Emite diagnóstico estruturado da AI Factory",
              parameters: {
                type: "object",
                properties: {
                  status: { type: "string", enum: ["wrong", "ready", "missing"] },
                  headline: { type: "string", description: "Frase curta de veredito" },
                  reason: { type: "string", description: "Motivo (se wrong)" },
                  risk: { type: "string", description: "Risco (se wrong)" },
                  suggestion: { type: "string", description: "Caminho correto (se wrong)" },
                  whereToUse: { type: "string", description: "Onde usar (se ready)" },
                  canRelease: { type: "boolean", description: "Pode liberar agora (se ready)" },
                  missing: { type: "array", items: { type: "string" }, description: "O que falta" },
                  needsConfig: { type: "array", items: { type: "string" }, description: "O que precisa configurar" },
                  impact: { type: "string", description: "Impacto do que falta (se missing)" },
                  askToStart: { type: "boolean", description: "Perguntar se pode iniciar (se missing)" },
                },
                required: ["status", "headline"],
                additionalProperties: false,
              },
            },
          },
        ],
        tool_choice: { type: "function", function: { name: "emit_diagnosis" } },
      }),
    });

    if (!resp.ok) {
      const t = await resp.text().catch(() => "");
      if (resp.status === 429) throw new Error("Limite de uso atingido. Tente novamente em instantes.");
      if (resp.status === 402) throw new Error("Créditos da Lovable AI esgotados.");
      throw new Error(`Falha na análise: ${resp.status} ${t}`);
    }

    const json = await resp.json();
    const args = json.choices?.[0]?.message?.tool_calls?.[0]?.function?.arguments;
    if (!args) throw new Error("Resposta inválida do modelo");
    return JSON.parse(args) as Diagnosis;
  });
