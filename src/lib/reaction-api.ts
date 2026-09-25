import type { Redis } from "@upstash/redis";
import { createHash } from "node:crypto";
import reactionEmojis from "./reaction-emojis.json" with { type: "json" };

const EMOJI = reactionEmojis.map(({ value }) => value);
const LIMIT = 20;
const WINDOW_SECONDS = 60;
type Counts = Record<string, number>;

function json(value: unknown, status = 200): Response {
  return new Response(JSON.stringify(value), {
    status,
    headers: { "content-type": "application/json; charset=utf-8", "cache-control": "no-store" },
  });
}

function counts(raw: Record<string, unknown> | null): Counts {
  return Object.fromEntries(EMOJI.map((emoji) => [emoji, Number(raw?.[emoji] ?? 0)]));
}

function entryKey(guest: string, entry: string): string {
  return `reactions:${guest}:${entry}`;
}

export function reactionApi(entriesByGuest: Map<string, string[]>, store: () => Redis) {
  return {
    async get(url: URL): Promise<Response> {
      const guest = url.searchParams.get("guest");
      const entries = guest && entriesByGuest.get(guest);
      if (!entries) return json({ error: "Unknown guest" }, 404);

      try {
        if (!entries.length) return json({});
        const pipeline = store().pipeline();
        for (const entry of entries) pipeline.hgetall(entryKey(guest!, entry));
        const results = await pipeline.exec();
        return json(Object.fromEntries(entries.map((entry, index) => [entry, counts(results[index] as Record<string, unknown> | null)])));
      } catch {
        return json({ error: "Reactions unavailable" }, 503);
      }
    },

    async post(request: Request): Promise<Response> {
      let body: unknown;
      try {
        const raw = await request.text();
        if (raw.length > 256) return json({ error: "Invalid reaction" }, 400);
        body = JSON.parse(raw);
      } catch {
        return json({ error: "Invalid reaction" }, 400);
      }
      if (!body || typeof body !== "object" || Array.isArray(body)) return json({ error: "Invalid reaction" }, 400);
      const { guest, entry, emoji } = body as Record<string, unknown>;
      if (typeof guest !== "string" || typeof entry !== "string" || typeof emoji !== "string" ||
          !EMOJI.includes(emoji) || !entriesByGuest.get(guest)?.includes(entry)) {
        return json({ error: "Unknown reaction" }, 400);
      }

      // Vercel overwrites this header with the real client address. The hash keeps
      // raw addresses out of Redis. NX sets expiry only on the first tap.
      const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
      const fingerprint = createHash("sha256").update(ip).digest("hex");
      try {
        const client = store();
        const throttle = `reaction-rate:${fingerprint}`;
        const [attempts] = await client.multi().incr(throttle).expire(throttle, WINDOW_SECONDS, "NX").exec();
        if (Number(attempts) > LIMIT) return json({ error: "Too many taps" }, 429);
        const key = entryKey(guest, entry);
        const [, rawCounts] = await client.pipeline().hincrby(key, emoji, 1).hgetall(key).exec();
        return json(counts(rawCounts as Record<string, unknown> | null));
      } catch {
        return json({ error: "Reactions unavailable" }, 503);
      }
    },
  };
}
