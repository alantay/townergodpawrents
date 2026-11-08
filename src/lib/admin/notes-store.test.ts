import assert from "node:assert/strict";
import test from "node:test";
import { memoryNotesStore, NOTES_PER_DOG, notesKey, parseNotes, redisNotesStore } from "./notes-store.ts";

const note = (id: string, at = 1) => ({ id, text: `note ${id}`, at });

test("absent hash is an empty list", () => {
  assert.deepEqual(parseNotes(null), []);
  assert.deepEqual(parseNotes(undefined), []);
});

test("reads strings and decoded objects, skips bad records, sorts by time", () => {
  const notes = parseNotes({
    b: JSON.stringify({ text: "second", at: 2 }),
    a: { text: "first", at: 1 },
    junk: "not json",
    nul: null,
    arr: [],
    num: { text: 42, at: 3 },
    noAt: { text: "x" },
  });
  assert.deepEqual(notes, [{ id: "a", text: "first", at: 1 }, { id: "b", text: "second", at: 2 }]);
});

test("memory store: add up to the cap, then full", async () => {
  const store = memoryNotesStore();
  for (let i = 0; i < NOTES_PER_DOG; i++) assert.equal(await store.add("luna", note(String(i), i)), "ok");
  assert.equal(await store.add("luna", note("extra")), "full");
  assert.equal((await store.list("luna")).length, NOTES_PER_DOG);
  assert.equal(await store.add("guapo", note("g")), "ok");
});

test("memory store: edit keeps the time, gone when missing", async () => {
  const store = memoryNotesStore();
  await store.add("luna", note("a", 5));
  assert.equal(await store.edit("luna", "a", "No chicken."), "ok");
  assert.deepEqual(await store.list("luna"), [{ id: "a", text: "No chicken.", at: 5 }]);
  await store.remove("luna", "a");
  assert.equal(await store.edit("luna", "a", "back?"), "gone");
  assert.deepEqual(await store.list("luna"), []);
});

test("redis store: uses one hash per guest and reads Lua statuses", async () => {
  const calls: unknown[][] = [];
  let reply: unknown = "ok";
  const redis = {
    hgetall: async (key: string) => { calls.push(["hgetall", key]); return null; },
    hdel: async (key: string, id: string) => { calls.push(["hdel", key, id]); return 1; },
    eval: async (script: string, keys: string[], args: string[]) => { calls.push(["eval", script, keys, args]); return reply; },
  };
  const store = redisNotesStore(redis as never);
  assert.deepEqual(await store.list("luna"), []);
  assert.equal(await store.add("luna", note("a", 7)), "ok");
  reply = "full";
  assert.equal(await store.add("luna", note("b")), "full");
  reply = "gone";
  assert.equal(await store.edit("luna", "a", "hi"), "gone");
  await store.remove("luna", "a");

  assert.deepEqual(calls[0], ["hgetall", notesKey("luna")]);
  const [, addScript, addKeys, addArgs] = calls[1] as [string, string, string[], string[]];
  assert.match(addScript, /HLEN/);
  assert.deepEqual(addKeys, ["admin-notes:luna"]);
  assert.deepEqual(addArgs, ["a", JSON.stringify({ text: "note a", at: 7 }), String(NOTES_PER_DOG)]);
  const [, editScript, , editArgs] = calls[3] as [string, string, string[], string[]];
  assert.match(editScript, /HEXISTS[^\n]*== 0/);
  assert.match(editScript, /cjson\.decode/);
  assert.deepEqual(editArgs, ["a", "hi"]);
  assert.deepEqual(calls[4], ["hdel", "admin-notes:luna", "a"]);
});
