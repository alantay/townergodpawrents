// OpenAI Chat Completions with a JSON schema, for polish and alt text. fetch
// is injected so tests never call the API. Every answer goes through cleanAi.
import { cleanAi } from "./clean-ai.ts";
import { ALT_SCHEMA, POLISH_SCHEMA, altMessages, polishMessages, type Message } from "./prompts.ts";
import type { Ai, AiContext, PolishResult } from "./types.ts";

export const DEFAULT_MODEL = "gpt-5-mini";

export function openAI(deps: {
  key: string;
  model?: string;
  voice: string;
  rules: string;
  fetch?: typeof fetch;
  timeoutMs?: number;
}): Ai {
  const doFetch = deps.fetch ?? fetch;
  const model = deps.model || DEFAULT_MODEL;
  const timeoutMs = deps.timeoutMs ?? 15_000;

  async function ask(messages: Message[], schema: object, maxTokens: number): Promise<Record<string, unknown>> {
    const response = await doFetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: { authorization: `Bearer ${deps.key}`, "content-type": "application/json" },
      body: JSON.stringify({
        model,
        messages,
        response_format: { type: "json_schema", json_schema: schema },
        max_completion_tokens: maxTokens,
        ...(model.startsWith("gpt-5") ? { reasoning_effort: "minimal" } : {}),
      }),
      signal: AbortSignal.timeout(timeoutMs),
    });
    if (!response.ok) throw new Error(`[admin] OpenAI ${response.status}: ${await response.text().catch(() => "")}`);
    const message = (await response.json())?.choices?.[0]?.message;
    if (message?.refusal) throw new Error(`[admin] OpenAI refused: ${message.refusal}`);
    if (!message?.content) throw new Error("[admin] OpenAI sent nothing back");
    return JSON.parse(message.content);
  }

  const clean = (value: unknown): string | null => {
    if (typeof value !== "string") return null;
    return cleanAi(value) || null;
  };

  return {
    async polish(text: string, ctx: AiContext): Promise<PolishResult> {
      const answer = await ask(polishMessages(text, ctx, deps.voice, deps.rules), POLISH_SCHEMA, 1500);
      const polished = clean(answer.polished);
      if (!polished) throw new Error("[admin] OpenAI polish came back empty");
      return { polished, twist: clean(answer.twist), rewritten: clean(answer.rewritten), note: clean(answer.note) };
    },

    async altText(photo: Uint8Array, ctx: AiContext, text: string): Promise<string> {
      const answer = await ask(altMessages(photo, ctx, text), ALT_SCHEMA, 400);
      const alt = clean(answer.alt);
      if (!alt) throw new Error("[admin] OpenAI alt text came back empty");
      return alt;
    },
  };
}
