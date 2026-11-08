import assert from "node:assert/strict";
import test from "node:test";
import { COOKIE } from "./auth.ts";
import { notesApi } from "./notes-api.ts";
import { memoryNotesStore, NOTES_PER_DOG, type NotesStore } from "./notes-store.ts";
import { sign } from "./session.ts";

const SECRET = "s".repeat(32);
const NOW = 1_800_000_000_000;
const GUESTS = [{ id: "luna" }, { id: "guapo" }];

function setup(notesStore?: () => NotesStore) {
  const memory = memoryNotesStore();
  let built = 0;
  let ids = 0;
  const api = notesApi({
    secret: SECRET,
    now: () => NOW,
    guests: async () => GUESTS,
    notesStore: () => { built++; return notesStore ? notesStore() : memory; },
    newId: () => `n${++ids}`,
  });
  const send = async (body: unknown, cookie: string | null = `${COOKIE}=${sign(NOW + 1000, SECRET)}`) => {
    const res = await api.post(new Request("https://example.test/api/admin/notes", {
      method: "POST",
      headers: { "content-type": "application/json", ...(cookie ? { cookie } : {}) },
      body: JSON.stringify(body),
    }));
    return { status: res.status, body: await res.json(), headers: res.headers };
  };
  return { memory, send, built: () => built };
}

for (const [name, cookie] of [
  ["no cookie", null],
  ["expired cookie", `${COOKIE}=${sign(NOW - 1, SECRET)}`],
  ["bad cookie", `${COOKIE}=${sign(NOW + 1000, "x".repeat(32))}`],
] as const) {
  test(`${name}: 401 and the store is never built`, async () => {
    const { send, built } = setup();
    const res = await send({ guest: "luna", action: "add", text: "No chicken." }, cookie);
    assert.equal(res.status, 401);
    assert.equal(built(), 0);
    assert.equal(res.body.notes, undefined);
  });
}

test("unknown guest", async () => {
  const { send, built } = setup();
  const res = await send({ guest: "nobody", action: "add", text: "hi" });
  assert.equal(res.status, 400);
  assert.equal(res.body.error, "Pick a dog.");
  assert.equal(built(), 0);
});

test("add, edit, remove", async () => {
  const { send } = setup();
  let res = await send({ guest: "luna", action: "add", text: "  No chicken.  " });
  assert.equal(res.status, 200);
  assert.equal(res.headers.get("cache-control"), "no-store");
  assert.deepEqual(res.body.notes, [{ id: "n1", text: "No chicken.", at: NOW }]);

  res = await send({ guest: "luna", action: "edit", id: "n1", text: "No chicken, no beef." });
  assert.deepEqual(res.body.notes, [{ id: "n1", text: "No chicken, no beef.", at: NOW }]);

  res = await send({ guest: "luna", action: "remove", id: "n1" });
  assert.deepEqual(res.body.notes, []);
});

test("empty and too-long text", async () => {
  const { send } = setup();
  assert.equal((await send({ guest: "luna", action: "add", text: "   " })).status, 400);
  assert.equal((await send({ guest: "luna", action: "add", text: "x".repeat(201) })).status, 400);
  assert.equal((await send({ guest: "luna", action: "add", text: "x".repeat(200) })).status, 200);
});

test("full returns the current notes", async () => {
  const { send } = setup();
  for (let i = 0; i < NOTES_PER_DOG; i++) await send({ guest: "luna", action: "add", text: `n${i}` });
  const res = await send({ guest: "luna", action: "add", text: "one more" });
  assert.equal(res.status, 400);
  assert.equal(res.body.error, "That's 20 already. Remove one first.");
  assert.equal(res.body.notes.length, NOTES_PER_DOG);
});

test("editing a removed note: 409 with the fresh list", async () => {
  const { send } = setup();
  await send({ guest: "luna", action: "add", text: "a" });
  await send({ guest: "luna", action: "remove", id: "n1" });
  const res = await send({ guest: "luna", action: "edit", id: "n1", text: "b" });
  assert.equal(res.status, 409);
  assert.deepEqual(res.body.notes, []);
});

test("unknown action", async () => {
  const { send } = setup();
  assert.equal((await send({ guest: "luna", action: "nuke" })).status, 400);
});

test("Redis missing or down: 503", async () => {
  const missing = setup(() => { throw new Error("no redis"); });
  let res = await missing.send({ guest: "luna", action: "add", text: "hi" });
  assert.equal(res.status, 503);
  assert.equal(res.body.notes, undefined);

  const boom = async () => { throw new Error("down"); };
  const down = setup(() => ({ list: boom, add: boom, edit: boom, remove: boom }));
  res = await down.send({ guest: "luna", action: "add", text: "hi" });
  assert.equal(res.status, 503);
  assert.equal(res.body.error, "Can't reach the notes right now.");
});
