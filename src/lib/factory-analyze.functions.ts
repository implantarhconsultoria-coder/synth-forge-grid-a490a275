import { createServerFn } from "@tanstack/react-start";

export type DiagnosisStatus = "wrong" | "ready" | "missing" | "needs_validation";

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
  // novos campos do diagnóstico "PRECISA VALIDAR"
  knownFacts?: string[];      // 1. O que a Factory sabe de verdade
  toValidate?: string[];      // 2. O que falta validar
  risks?: string[];           // 3. Riscos
  impacts?: string[];         // 4. Impacto
  realCommand?: string;       // 5. Comando real que será criado (missão)
}

const SYSTEM = `Você é a AI FACTORY, diagnosticador operacional rigoroso da ImplantaRH.
Português do Brasil, direto, técnico, sem floreio, sem emojis.

REGRA ABSOLUTA — NUNCA QUEBRAR:
- É PROIBIDO retornar status="ready", "Pronto", "Pode liberar agora", "App aprovado"
  ou qualquer status de liberação SEM validação real executada.
- Você NÃO executa testes. Logo, por padrão, NUNCA está "ready".
- Sempre que o usuário pedir para analisar, verificar, corrigir, auditar ou validar
  qualquer projeto/app/feature → status OBRIGATÓRIO = "needs_validation".
- Só use status="wrong" se a ideia tem erro lógico claro.
- Só use status="missing" se faltar informação para sequer planejar.
- status="ready" só é permitido em pedidos triviais sem qualquer aspecto operacional
  (ex.: "qual a cor primária do tema?"). Em dúvida, use "needs_validation".

Quando status="needs_validation", preencha OBRIGATORIAMENTE:
- knownFacts[]   → o que a Factory já sabe de verdade sobre o alvo
- toValidate[]   → checklist do que falta validar (versão publicada x GitHub, login,
                   rotas, gravação em banco, erros de console, etc.)
- risks[]        → riscos reais se liberar sem validar
- impacts[]      → impacto operacional (usuários afetados, módulos, dados)
- realCommand    → comando técnico de auditoria que será enfileirado como missão real
- headline       → "PRECISA VALIDAR — <alvo>"

Caso especial — "App dos Mecânicos" / "mecânicos" / "TOPAC mecânicos":
knownFacts:
- Existe no projeto TOPAC
- Tem rotas de acesso mecânico
- Tem telas de ponto, chamados, veículo, histórico e abastecimento
toValidate:
- versão publicada no Lovable x GitHub
- login por PIN/CPF
- gravação real do ponto
- abertura/finalização de chamados
- abastecimento vinculado ao mecânico e veículo
- erros de tela, console e banco
realCommand:
"AUDITORIA REAL — App dos Mecânicos: validar versão publicada x GitHub, login, rotas mobile, ponto, chamados, veículo, histórico, abastecimento, gravação no banco, erros de console e checklist final."`;

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
                  status: { type: "string", enum: ["wrong", "ready", "missing", "needs_validation"] },
                  headline: { type: "string" },
                  reason: { type: "string" },
                  risk: { type: "string" },
                  suggestion: { type: "string" },
                  whereToUse: { type: "string" },
                  canRelease: { type: "boolean" },
                  missing: { type: "array", items: { type: "string" } },
                  needsConfig: { type: "array", items: { type: "string" } },
                  impact: { type: "string" },
                  askToStart: { type: "boolean" },
                  knownFacts: { type: "array", items: { type: "string" } },
                  toValidate: { type: "array", items: { type: "string" } },
                  risks: { type: "array", items: { type: "string" } },
                  impacts: { type: "array", items: { type: "string" } },
                  realCommand: { type: "string" },
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
    const diag = JSON.parse(args) as Diagnosis;

    // Guarda-rails server-side: nunca deixar "ready" passar sem realCommand validado.
    if (diag.status === "ready") {
      diag.status = "needs_validation";
      diag.headline = diag.headline?.startsWith("PRECISA VALIDAR")
        ? diag.headline
        : `PRECISA VALIDAR — ${diag.headline ?? "pedido"}`;
      diag.canRelease = false;
      if (!diag.toValidate || diag.toValidate.length === 0) {
        diag.toValidate = [
          "Versão publicada x GitHub",
          "Login e rotas principais",
          "Gravações reais no banco",
          "Erros de console e tela",
        ];
      }
      if (!diag.realCommand) {
        diag.realCommand = `AUDITORIA REAL — ${diag.headline}: validar versão publicada x GitHub, login, rotas, gravação no banco, erros de console e checklist final.`;
      }
    }

    return diag;
  });
