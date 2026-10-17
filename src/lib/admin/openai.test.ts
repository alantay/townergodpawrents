import assert from "node:assert/strict";
import test from "node:test";
import { openAI } from "./openai.ts";

const CTX = { name: "Luna", withNames: [], recent: [] };

function fake(answer: unknown, status = 200) {
  const bodies: any[] = [];
  const fetch = (async (_url: string, init: RequestInit) => {
    bodies.push(JSON.parse(String(init.body)));
    return new Response(JSON.stringify(answer), { status });
  }) as typeof globalThis.fetch;
  return { bodies, fetch };
}
const reply = (content: unknown) => ({ choices: [{ message: { content: JSON.stringify(content), refusal: null } }] });
const ai = (fetch: typeof globalThis.fetch, model?: string) => openAI({ key: "k", model, voice: "v", rules: "r", fetch });

test("polish asks gpt-6-luna for strict JSON and cleans the dashes out", async () => {
  const { bodies, fetch } = fake(reply({ polished: "Luna stole a slipper — again.", twist: "", rewritten: null, note: "Tense slip – check it." }));
  const result = await ai(fetch).polish("luna stole slipper", CTX);
  assert.deepEqual(result, { polished: "Luna stole a slipper, again.", twist: null, rewritten: null, note: "Tense slip, check it." });
  assert.equal(bodies[0].model, "gpt-6-luna");
  assert.equal(bodies[0].reasoning_effort, "none");
  assert.equal(bodies[0].response_format.json_schema.name, "polish");
  assert.equal(bodies[0].max_completion_tokens, 1500);
});

test("a gpt-5 model still gets minimal reasoning", async () => {
  const { bodies, fetch } = fake(reply({ alt: "Luna asleep on the sofa." }));
  await ai(fetch, "gpt-5-mini").altText(new Uint8Array([1]), CTX, "");
  assert.equal(bodies[0].reasoning_effort, "minimal");
});

test("a model without reasoning gets no reasoning_effort", async () => {
  const { bodies, fetch } = fake(reply({ alt: "Luna asleep on the sofa." }));
  assert.equal(await ai(fetch, "gpt-4.1-mini").altText(new Uint8Array([1]), CTX, ""), "Luna asleep on the sofa.");
  assert.equal(bodies[0].model, "gpt-4.1-mini");
  assert.equal("reasoning_effort" in bodies[0], false);
  assert.equal(bodies[0].max_completion_tokens, 400);
});

test("errors, refusals and empty answers throw", async () => {
  await assert.rejects(ai(fake({ error: "nope" }, 500).fetch).polish("x", CTX));
  await assert.rejects(ai(fake({ choices: [{ message: { content: null, refusal: "no" } }] }).fetch).polish("x", CTX));
  await assert.rejects(ai(fake({ choices: [] }).fetch).altText(new Uint8Array([1]), CTX, ""));
  await assert.rejects(ai(fake(reply({ polished: " — " })).fetch).polish("x", CTX));
});

test("a slow answer times out", async () => {
  const fetch = ((_url: string, init: RequestInit) =>
    new Promise((_resolve, reject) => init.signal!.addEventListener("abort", () => reject(init.signal!.reason)))) as typeof globalThis.fetch;
  await assert.rejects(openAI({ key: "k", voice: "v", rules: "r", fetch, timeoutMs: 20 }).polish("x", CTX));
});
