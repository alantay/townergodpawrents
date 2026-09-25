import assert from "node:assert/strict";
import test from "node:test";
import type { Redis } from "@upstash/redis";
import { reactionApi } from "./reaction-api.ts";

function fakeStore() {
  const rates = new Map<string, number>();
  const totals = new Map<string, Record<string, number>>();
  const client = {
    multi() {
      let key = "";
      return {
        incr(value: string) { key = value; return this; },
        expire(value: string, seconds: number, option: string) {
          assert.equal(value, key);
          assert.equal(seconds, 60);
          assert.equal(option, "NX");
          return this;
        },
        async exec() {
          const next = (rates.get(key) ?? 0) + 1;
          rates.set(key, next);
          return [next, 1];
        },
      };
    },
    pipeline() {
      const ops: Array<() => unknown> = [];
      const chain = {
        hgetall(key: string) { ops.push(() => ({ ...totals.get(key) })); return chain; },
        hincrby(key: string, emoji: string, amount: number) {
          ops.push(() => {
            const counts = totals.get(key) ?? {};
            counts[emoji] = (counts[emoji] ?? 0) + amount;
            totals.set(key, counts);
            return counts[emoji];
          });
          return chain;
        },
        async exec() { return ops.map((op) => op()); },
      };
      return chain;
    },
  };
  return { store: () => client as unknown as Redis, rates, totals };
}

function tap(guest: string, entry: string, emoji: string, ip = "192.0.2.1") {
  return new Request("https://example.test/api/reactions", {
    method: "POST",
    headers: { "x-forwarded-for": ip, "content-type": "application/json" },
    body: JSON.stringify({ guest, entry, emoji }),
  });
}

test("reaction API increments each valid tap and reads the same totals for a guest", async () => {
  const { store } = fakeStore();
  const api = reactionApi(new Map([["tiny", ["e001", "e002"]]]), store);
  assert.equal((await api.post(tap("tiny", "e001", "❤️"))).status, 200);
  assert.deepEqual(await (await api.post(tap("tiny", "e001", "❤️"))).json(),
    { "❤️": 2, "😂": 0, "😍": 0, "😑": 0, "😅": 0 });
  assert.deepEqual(await (await api.get(new URL("https://example.test/api/reactions?guest=tiny"))).json(), {
    e001: { "❤️": 2, "😂": 0, "😍": 0, "😑": 0, "😅": 0 },
    e002: { "❤️": 0, "😂": 0, "😍": 0, "😑": 0, "😅": 0 },
  });
});

test("reaction API rejects unknown entries and emoji before writing", async () => {
  const { store, totals, rates } = fakeStore();
  const api = reactionApi(new Map([["tiny", ["e001"]]]), store);
  assert.equal((await api.post(tap("tiny", "unknown", "❤️"))).status, 400);
  assert.equal((await api.post(tap("tiny", "e001", "🔥"))).status, 400);
  assert.equal((await api.get(new URL("https://example.test/api/reactions?guest=unknown"))).status, 404);
  assert.equal(totals.size, 0);
  assert.equal(rates.size, 0);
});

test("reaction API limits a source to 20 accepted taps per minute", async () => {
  const { store, totals } = fakeStore();
  const api = reactionApi(new Map([["tiny", ["e001"]]]), store);
  for (let i = 0; i < 20; i++) assert.equal((await api.post(tap("tiny", "e001", "😑"))).status, 200);
  assert.equal((await api.post(tap("tiny", "e001", "😑"))).status, 429);
  assert.equal(totals.get("reactions:tiny:e001")?.["😑"], 20);
  assert.equal((await api.post(tap("tiny", "e001", "😑", "192.0.2.2"))).status, 200);
});

test("reaction API reports store failure without touching diary data", async () => {
  const api = reactionApi(new Map([["tiny", ["e001"]]]), () => { throw new Error("offline"); });
  assert.equal((await api.get(new URL("https://example.test/api/reactions?guest=tiny"))).status, 503);
  assert.equal((await api.post(tap("tiny", "e001", "❤️"))).status, 503);
});
