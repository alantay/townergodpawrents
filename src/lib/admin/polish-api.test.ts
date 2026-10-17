import assert from "node:assert/strict";
import test from "node:test";
import { COOKIE } from "./auth.ts";
import { polishApi } from "./polish-api.ts";
import { sign } from "./session.ts";
import type { Ai, AiContext, GuestInfo } from "./types.ts";

const SECRET = "s".repeat(32);
const NOW = 1_800_000_000_000;
const GUESTS: GuestInfo[] = [
  { id: "luna", name: "Luna", stays: [], recent: ["Supervising from the doorway."] },
  { id: "guapo", name: "Guapo", stays: [], recent: [] },
];
const RESULT = { polished: "Luna stole a slipper.", twist: null, rewritten: null, note: null };

function setup(ai: Partial<Ai> = {}) {
  const seen: { text: string; ctx: AiContext }[] = [];
  const api = polishApi({
    secret: SECRET,
    now: () => NOW,
    guests: async () => GUESTS,
    ai: () => ({
      polish: async (text, ctx) => { seen.push({ text, ctx }); return RESULT; },
      altText: async () => "",
      ...ai,
    }),
  });
  const send = (body: unknown, authed = true) =>
    api.polish(new Request("https://example.test/api/admin/polish", {
      method: "POST",
      headers: { "content-type": "application/json", ...(authed ? { cookie: `${COOKIE}=${sign(NOW + 1000, SECRET)}` } : {}) },
      body: JSON.stringify(body),
    }));
  return { seen, send };
}

test("no cookie, no polish", async () => {
  const { seen, send } = setup();
  assert.equal((await send({ guest: "luna", text: "hi" }, false)).status, 401);
  assert.equal(seen.length, 0);
});

test("returns the options and passes the dogs and recent entries along", async () => {
  const { seen, send } = setup();
  const response = await send({ guest: "luna", with: ["guapo", "luna", "nobody"], text: "  luna stole slipper " });
  assert.equal(response.status, 200);
  assert.deepEqual(await response.json(), RESULT);
  assert.deepEqual(seen, [{ text: "luna stole slipper", ctx: { name: "Luna", withNames: ["Guapo"], recent: ["Supervising from the doorway."] } }]);
});

test("bad requests say what's missing", async () => {
  const { send } = setup();
  const error = async (body: unknown) => (await (await send(body)).json()).error;
  assert.equal(await error({ guest: "nobody", text: "hi" }), "Pick a dog.");
  assert.equal(await error({ guest: "luna", text: "   " }), "Add some words first.");
  assert.equal(await error({ guest: "luna", text: "x".repeat(4001) }), "That's a lot of words. Trim it a bit.");
  assert.equal(await error("not an object"), "Pick a dog.");
});

test("an AI failure is a 502 with the reassuring message", async () => {
  const { send } = setup({ polish: async () => { throw new Error("timeout"); } });
  const response = await send({ guest: "luna", text: "hi" });
  assert.equal(response.status, 502);
  assert.equal((await response.json()).error, "Polish didn't work this time. Your words are still here.");
});
