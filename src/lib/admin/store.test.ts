import assert from "node:assert/strict";
import test from "node:test";
import type { Redis } from "@upstash/redis";
import { memoryStore, redisStore } from "./store.ts";

test("memoryStore counts, claims once and forgets", async () => {
  const store = memoryStore();
  assert.equal(await store.incr("k", 60), 1);
  assert.equal(await store.incr("k", 60), 2);
  assert.equal(await store.setNX("p", "pending", 300), true);
  assert.equal(await store.setNX("p", "other", 300), false);
  assert.equal(await store.get("p"), "pending");
  await store.set("p", "/guests/luna", 86400);
  assert.equal(await store.get("p"), "/guests/luna");
  await store.del("p");
  assert.equal(await store.get("p"), null);
});

function fakeRedis() {
  const calls: unknown[][] = [];
  const values = new Map<string, unknown>();
  const client = {
    multi() {
      return {
        incr(key: string) { calls.push(["incr", key]); return this; },
        expire(key: string, seconds: number, option: string) { calls.push(["expire", key, seconds, option]); return this; },
        async exec() { return [3, 1]; },
      };
    },
    async get(key: string) { return values.get(key) ?? null; },
    async set(key: string, value: string, opts: { nx?: boolean; ex: number }) {
      calls.push(["set", key, value, opts]);
      if (opts.nx && values.has(key)) return null;
      values.set(key, value);
      return "OK";
    },
    async del(key: string) { calls.push(["del", key]); values.delete(key); return 1; },
  };
  return { calls, values, redis: client as unknown as Redis };
}

test("redisStore.incr sets the window only on the first hit", async () => {
  const { calls, redis } = fakeRedis();
  assert.equal(await redisStore(redis).incr("admin-login:x", 600), 3);
  assert.deepEqual(calls, [["incr", "admin-login:x"], ["expire", "admin-login:x", 600, "NX"]]);
});

test("redisStore.setNX reports whether it claimed the key", async () => {
  const { calls, redis } = fakeRedis();
  const store = redisStore(redis);
  assert.equal(await store.setNX("p", "pending", 300), true);
  assert.equal(await store.setNX("p", "pending", 300), false);
  assert.deepEqual(calls[0], ["set", "p", "pending", { nx: true, ex: 300 }]);
});

test("redisStore.get always hands back a string or null", async () => {
  const { values, redis } = fakeRedis();
  values.set("n", 42);
  assert.equal(await redisStore(redis).get("n"), "42");
  assert.equal(await redisStore(redis).get("missing"), null);
});
