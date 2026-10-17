// The few Redis calls the admin needs: a login rate limit and a one-time
// post key. Behind an interface so tests use memoryStore().
import type { Redis } from "@upstash/redis";

export interface KeyStore {
  incr(key: string, ttlSeconds: number): Promise<number>;
  get(key: string): Promise<string | null>;
  setNX(key: string, value: string, ttlSeconds: number): Promise<boolean>;
  set(key: string, value: string, ttlSeconds: number): Promise<void>;
  del(key: string): Promise<void>;
}

/** In-memory store for tests. TTLs are ignored. */
export function memoryStore(): KeyStore & { data: Map<string, string> } {
  const data = new Map<string, string>();
  return {
    data,
    async incr(key) {
      const next = Number(data.get(key) ?? 0) + 1;
      data.set(key, String(next));
      return next;
    },
    async get(key) { return data.get(key) ?? null; },
    async setNX(key, value) {
      if (data.has(key)) return false;
      data.set(key, value);
      return true;
    },
    async set(key, value) { data.set(key, value); },
    async del(key) { data.delete(key); },
  };
}

export function redisStore(redis: Redis): KeyStore {
  return {
    async incr(key, ttlSeconds) {
      // Same pattern as reaction-api.ts: the window starts on the first hit.
      const [count] = (await redis.multi().incr(key).expire(key, ttlSeconds, "NX").exec()) as [number, number];
      return count;
    },
    async get(key) {
      const value = await redis.get(key);
      return value == null ? null : String(value);
    },
    async setNX(key, value, ttlSeconds) {
      return (await redis.set(key, value, { nx: true, ex: ttlSeconds })) === "OK";
    },
    async set(key, value, ttlSeconds) {
      await redis.set(key, value, { ex: ttlSeconds });
    },
    async del(key) {
      await redis.del(key);
    },
  };
}
