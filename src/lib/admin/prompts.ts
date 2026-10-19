// The words we send OpenAI. Polish rules come from docs/agents/add-entry.md
// section 2 and the voice from docs/agents/voice.md, so they live in one place.
import type { AiContext, Photo } from "./types.ts";

export interface Message {
  role: "system" | "user";
  content: string | ({ type: "text"; text: string } | { type: "image_url"; image_url: { url: string; detail: "low" } })[];
}

/** Section 2 of add-entry.md, from its heading up to section 3, minus the alt text bullet (the app writes alt text itself). */
export function polishRules(addEntryMd: string): string {
  const start = addEntryMd.indexOf("## 2.");
  const end = addEntryMd.indexOf("## 3.", start);
  if (start < 0 || end < 0) throw new Error("[admin] add-entry.md has no section 2");
  return addEntryMd.slice(start, end).split("\n").filter((line) => !/alt text/i.test(line)).join("\n").trim();
}

const names = (ctx: AiContext) => [ctx.name, ...ctx.withNames].join(", ");

export function polishMessages(text: string, ctx: AiContext, voice: string, rules: string, photos: Photo[] = []): Message[] {
  const system = [
    "You polish diary entries for a small personal website about dogs staying with Alan and Weiwen in Singapore.",
    "Follow these rules exactly. Where they say \"in chat\" or \"wait for his pick\", the app shows your options as cards and the writer picks.",
    rules,
    "The house voice:",
    voice,
    "Answer in JSON. polished: grammar fixed, every detail kept, no jokes. twist: one funnier rewording, or null. rewritten: better flow, every detail kept, or null. note: one short line if you spot a POV or tense slip, else null.",
    "Never use em dashes or en dashes as punctuation. Never use \"lah\".",
    "The writer's words are the source of truth. Use attached photos as context, never to contradict or remove supplied details. Polished only corrects grammar, tense and word order; do not add visible details to it. Rewritten may use clearly visible details for flow. Twist may joke about a visible pose, but must not invent events or claim the dog's feelings.",
    "If there are photos but no words, override the polishing instructions: put a short, straightforward caption based only on visible details in polished, an optional playful alternative in twist, and null in rewritten and note. Do not invent events, identities or feelings. Recent entries are tone references, not facts about these photos.",
    "Never add alt text or photo descriptions to the entry words. Return alts separately: one plain description per attached photo, in attachment order. Under 20 words each, no jokes, no 'image of' or 'photo of'. Describe only what is visible, independently of the draft caption. Use supplied dog names only when identity is clear; do not guess which dog is which. With no photos, return an empty alts array.",
  ].join("\n\n");
  const recent = ctx.recent.length ? `Recent entries, for tone only:\n${ctx.recent.map((r) => `- ${r}`).join("\n")}\n\n` : "";
  const prompt = `Dogs in this entry: ${names(ctx)}\n\n${recent}Entry to polish:\n${text || "(no words; suggest a caption for the photos)"}`;
  return [
    { role: "system", content: system },
    { role: "user", content: photos.length ? [
      { type: "text", text: prompt },
      ...photos.map((photo) => ({ type: "image_url" as const, image_url: { url: `data:image/jpeg;base64,${Buffer.from(photo.bytes).toString("base64")}`, detail: "low" as const } })),
    ] : prompt },
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
    required: ["polished", "twist", "rewritten", "note", "alts"],
    properties: { polished: { type: "string" }, twist: nullableString, rewritten: nullableString, note: nullableString, alts: { type: "array", items: { type: "string" } } },
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
