import type { APIRoute } from "astro";
import { getCollection } from "astro:content";
import { Redis } from "@upstash/redis";
import { dateStr, parseDiary, type Stay } from "../../lib/guests";
import { reactionApi } from "../../lib/reaction-api";

export const prerender = false;

let redis: Redis | undefined;
function store(): Redis {
  redis ??= Redis.fromEnv();
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
