import assert from "node:assert/strict";
import test from "node:test";
import { COOKIE } from "./auth.ts";
import { descriptionKey } from "./photo-descriptions.ts";
import { polishApi } from "./polish-api.ts";
import { sign } from "./session.ts";
import type { Ai, AiContext, GuestInfo, Photo } from "./types.ts";

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
      headers: { ...(body instanceof FormData ? {} : { "content-type": "application/json" }), ...(authed ? { cookie: `${COOKIE}=${sign(NOW + 1000, SECRET)}` } : {}) },
      body: body instanceof FormData ? body : JSON.stringify(body),
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
  assert.deepEqual(await response.json(), { ...RESULT, descriptions: [] });
  assert.deepEqual(seen, [{ text: "luna stole slipper", ctx: { name: "Luna", withNames: ["Guapo"], recent: ["Supervising from the doorway."] } }]);
});

test("bad requests say what's missing", async () => {
  const { send } = setup();
  const error = async (body: unknown) => (await (await send(body)).json()).error;
  assert.equal(await error({ guest: "nobody", text: "hi" }), "Pick a dog.");
  assert.equal(await error({ guest: "luna", text: "   " }), "Add some words or a photo.");
  assert.equal(await error({ guest: "luna", text: "x".repeat(4001) }), "That's a lot of words. Trim it a bit.");
  assert.equal(await error("not an object"), "Pick a dog.");
});

test("an AI failure is a 502 with the reassuring message", async () => {
  const { send } = setup({ polish: async () => { throw new Error("timeout"); } });
  const response = await send({ guest: "luna", text: "hi" });
  assert.equal(response.status, 502);
  assert.equal((await response.json()).error, "Couldn't suggest words this time. Your words and photos are still here. Try again.");
});

const JPEG = new Uint8Array([0xff, 0xd8, 0xff, 0xe0, 1]);
function photoForm(count = 1, bytes = JPEG, type = "image/jpeg") {
  const form = new FormData();
  form.set("guest", "luna");
  form.set("text", "");
  for (let i = 0; i < count; i++) form.append("photos", new Blob([bytes], { type }), `photo-${i}.jpg`);
  return form;
}

test("photo-only suggestions send photos to AI and return reusable, sanitised descriptions", async () => {
  let received: Photo[] = [];
  const { send } = setup({ polish: async (text, ctx, photos) => {
    assert.equal(text, "");
    assert.equal(ctx.name, "Luna");
    received = photos!;
    return { ...RESULT, alts: ["Luna [on] the sofa."] };
  } });
  const res = await send(photoForm());
  assert.equal(res.status, 200);
  assert.deepEqual(received, [{ bytes: JPEG, type: "image/jpeg" }]);
  assert.deepEqual((await res.json()).descriptions, [{
    key: descriptionKey(received[0], { name: "Luna", withNames: [], recent: [] }), alt: "Luna on the sofa.",
  }]);
});

test("bad or oversized photos never reach AI", async () => {
  const { send, seen } = setup();
  for (const form of [photoForm(5), photoForm(1, new Uint8Array([1, 2, 3, 4])), photoForm(1, JPEG, "image/png"), photoForm(1, new Uint8Array(1_000_000))]) {
    assert.equal((await send(form)).status, 400);
  }
  assert.equal(seen.length, 0);
});

test("miscounted descriptions are not paired with the wrong photos", async () => {
  const { send } = setup({ polish: async () => ({ ...RESULT, alts: ["One description for two photos."] }) });
  assert.deepEqual((await (await send(photoForm(2))).json()).descriptions, []);
});

test("a null JSON body is a bad request", async () => {
  assert.equal((await setup().send(null)).status, 400);
});
