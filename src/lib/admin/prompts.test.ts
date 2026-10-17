import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { ALT_SCHEMA, POLISH_SCHEMA, altMessages, polishMessages, polishRules } from "./prompts.ts";

const CTX = { name: "Luna", withNames: ["Guapo"], recent: ["Supervising from the doorway."] };

test("polishRules takes section 2 of the real add-entry.md", () => {
  const rules = polishRules(readFileSync("docs/agents/add-entry.md", "utf8"));
  assert.match(rules, /^## 2\. Polish the words/);
  assert.match(rules, /every detail kept/);
  assert.doesNotMatch(rules, /## 3\./);
  assert.throws(() => polishRules("# nothing here"));
});

test("polishRules leaves out the alt text bullet, since the app writes alt text separately", () => {
  const rules = polishRules(readFileSync("docs/agents/add-entry.md", "utf8"));
  assert.doesNotMatch(rules, /alt text/i);
  assert.match(rules, /every detail kept/);
});

test("polishMessages tells the model to never add alt text to the words", () => {
  const [system] = polishMessages("luna stole slipper", CTX, "VOICE RULES", "POLISH RULES");
  assert.match(String(system.content), /Never add alt text or photo descriptions/);
});

test("polishMessages carries the rules, the voice, the dogs, recent entries and the text", () => {
  const [system, user] = polishMessages("luna stole slipper", CTX, "VOICE RULES", "POLISH RULES");
  assert.equal(system.role, "system");
  assert.match(String(system.content), /POLISH RULES[\s\S]*VOICE RULES/);
  assert.match(String(user.content), /Dogs in this entry: Luna, Guapo/);
  assert.match(String(user.content), /- Supervising from the doorway\./);
  assert.match(String(user.content), /Entry to polish:\nluna stole slipper$/);
});

test("altMessages sends the photo as a low-detail JPEG data URL with the dogs and text", () => {
  const [, user] = altMessages(new Uint8Array([0xff, 0xd8, 0xff]), CTX, "Stole a slipper.");
  const parts = user.content as any[];
  assert.match(parts[0].text, /Dogs: Luna, Guapo/);
  assert.match(parts[0].text, /Stole a slipper\./);
  assert.deepEqual(parts[1].image_url, { url: "data:image/jpeg;base64,/9j/", detail: "low" });
});

test("schemas are strict and list every property as required", () => {
  for (const s of [POLISH_SCHEMA, ALT_SCHEMA]) {
    assert.equal(s.strict, true);
    assert.deepEqual([...s.schema.required].sort(), Object.keys(s.schema.properties).sort());
  }
});
