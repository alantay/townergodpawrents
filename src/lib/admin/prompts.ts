// The words we send OpenAI. Polish rules come from docs/agents/add-entry.md
// section 2 and the voice from docs/agents/voice.md, so they live in one place.
import type { AiContext } from "./types.ts";

export interface Message {
  role: "system" | "user";
  content: string | ({ type: "text"; text: string } | { type: "image_url"; image_url: { url: string; detail: "low" } })[];
}

/** Section 2 of add-entry.md, from its heading up to section 3. */
export function polishRules(addEntryMd: string): string {
  const start = addEntryMd.indexOf("## 2.");
  const end = addEntryMd.indexOf("## 3.", start);
  if (start < 0 || end < 0) throw new Error("[admin] add-entry.md has no section 2");
  return addEntryMd.slice(start, end).trim();
}

const names = (ctx: AiContext) => [ctx.name, ...ctx.withNames].join(", ");

export function polishMessages(text: string, ctx: AiContext, voice: string, rules: string): Message[] {
  const system = [
    "You polish diary entries for a small personal website about dogs staying with Alan and Weiwen in Singapore.",
    "Follow these rules exactly. Where they say \"in chat\" or \"wait for his pick\", the app shows your options as cards and the writer picks.",
    rules,
    "The house voice:",
    voice,
    "Answer in JSON. polished: grammar fixed, every detail kept, no jokes. twist: one funnier rewording, or null. rewritten: better flow, every detail kept, or null. note: one short line if you spot a POV or tense slip, else null.",
    "Never use em dashes or en dashes as punctuation. Never use \"lah\".",
  ].join("\n\n");
  const recent = ctx.recent.length ? `Recent entries, for tone only:\n${ctx.recent.map((r) => `- ${r}`).join("\n")}\n\n` : "";
  return [
    { role: "system", content: system },
    { role: "user", content: `Dogs in this entry: ${names(ctx)}\n\n${recent}Entry to polish:\n${text}` },
  ];
}

export function altMessages(photo: Uint8Array, ctx: AiContext, text: string): Message[] {
  return [
    {
      role: "system",
      content: "Write alt text for a photo on a dog diary website. A plain description of what is in the photo. Name the dogs by name. No jokes. Don't start with \"image of\" or \"photo of\". Under 20 words. No dashes. Answer in JSON.",
    },
    {
      role: "user",
      content: [
        { type: "text", text: `Dogs: ${names(ctx)}\nThe diary entry: ${text || "(no words, just photos)"}` },
        { type: "image_url", image_url: { url: `data:image/jpeg;base64,${Buffer.from(photo).toString("base64")}`, detail: "low" } },
      ],
    },
  ];
}

const nullableString = { type: ["string", "null"] };

export const POLISH_SCHEMA = {
  name: "polish",
  strict: true,
  schema: {
    type: "object",
    additionalProperties: false,
    required: ["polished", "twist", "rewritten", "note"],
    properties: { polished: { type: "string" }, twist: nullableString, rewritten: nullableString, note: nullableString },
  },
};

export const ALT_SCHEMA = {
  name: "alt_text",
  strict: true,
  schema: {
    type: "object",
    additionalProperties: false,
    required: ["alt"],
    properties: { alt: { type: "string" } },
  },
};
