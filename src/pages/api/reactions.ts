import type { APIRoute } from "astro";
import { getCollection } from "astro:content";
import { Redis } from "@upstash/redis";
import { getSecret } from "astro:env/server";
import { dateStr, parseDiary, type Stay } from "../../lib/guests";
import { reactionApi } from "../../lib/reaction-api";

export const prerender = false;

let redis: Redis | undefined;
function store(): Redis {
  // getSecret reads .env in dev and the real environment on Vercel. The
  // Vercel Marketplace names the variables KV_*; Upstash itself uses UPSTASH_*.
  redis ??= new Redis({
    url: getSecret("KV_REST_API_URL") ?? getSecret("UPSTASH_REDIS_REST_URL"),
    token: getSecret("KV_REST_API_TOKEN") ?? getSecret("UPSTASH_REDIS_REST_TOKEN"),
  });
  return redis;
}

const knownEntries = getCollection("guests").then((guests) => new Map(
  guests.map((guest) => {
    const stays: Stay[] = guest.data.stays.map((stay) => ({
      checkIn: dateStr(stay.checkIn), checkOut: dateStr(stay.checkOut),
    }));
    const ids = parseDiary(guest.body ?? "", stays, guest.id)
      .flatMap((day) => day.entries.map((entry) => entry.id));
    return [guest.id, ids] as const;
  }),
));

export const GET: APIRoute = async ({ url }) => reactionApi(await knownEntries, store).get(url);
export const POST: APIRoute = async ({ request }) => reactionApi(await knownEntries, store).post(request);
