// Pure helpers for the post form in the browser (src/scripts/admin.ts).
import { stayOn, type Stay } from "../guests.ts";

export interface FormGuest {
  id: string;
  name: string;
  stays: Stay[];
}

/** Dogs with a stay covering the day, in the order given. */
export function dogsOn(guests: FormGuest[], iso: string): FormGuest[] {
  return guests.filter((g) => stayOn(g, iso));
}

/** Today and now in Singapore, shaped for <input type="date"> and <input type="time">. */
export function nowSGT(now: Date = new Date()): { iso: string; time: string } {
  const sgt = new Date(now.getTime() + 8 * 60 * 60 * 1000).toISOString();
  return { iso: sgt.slice(0, 10), time: sgt.slice(11, 16) };
}

/** How long an unsent draft keeps its own day and time. */
const DRAFT_FRESH_MS = 6 * 60 * 60 * 1000;

/**
 * Day and time to open the form on. A recent draft with words keeps its own,
 * so a half-written moment stays on the right day. Anything else opens on now,
 * so an old draft can't quietly file a new post under last week.
 */
export function draftWhen(
  draft: { iso?: string; time?: string; text?: string; savedAt?: number },
  now: Date = new Date(),
): { iso: string; time: string } {
  const fresh = typeof draft.savedAt === "number" && now.getTime() - draft.savedAt < DRAFT_FRESH_MS;
  if (fresh && draft.text?.trim() && draft.iso && draft.time) return { iso: draft.iso, time: draft.time };
  return nowSGT(now);
}
