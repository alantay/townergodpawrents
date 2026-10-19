// Pure helpers for the post form in the browser (src/scripts/admin.ts).
import { stayOn, type Stay } from "../guests.ts";
import { NO_TIME } from "./types.ts";

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

/**
 * The time to post with. A labelled or no-time entry hides the time field,
 * so on today it goes in the day by when it's posted. On another day there's
 * no "now" to use, so it keeps whatever the field last held.
 */
export function postTime(
  draft: { iso: string; time: string; label: string },
  now: Date = new Date(),
): string {
  const today = nowSGT(now);
  return draft.label && draft.iso === today.iso ? today.time : draft.time;
}

/** How long an unsent draft keeps its own day and time. */
const DRAFT_FRESH_MS = 6 * 60 * 60 * 1000;

/**
 * Day, time and label to open the form on. A recent draft with words or photos keeps its own,
 * so a half-written moment stays on the right day. Anything else opens on now with No time,
 * so an old draft can't quietly file a new post under last week.
 */
export function draftWhen(
  draft: { iso?: string; time?: string; label?: string; text?: string; photoCount?: number; savedAt?: number },
  now: Date = new Date(),
): { iso: string; time: string; label: string } {
  const fresh = typeof draft.savedAt === "number" && now.getTime() - draft.savedAt < DRAFT_FRESH_MS;
  const started = !!draft.text?.trim() || (draft.photoCount ?? 0) > 0;
  if (fresh && started && draft.iso && draft.time) return { iso: draft.iso, time: draft.time, label: draft.label ?? NO_TIME };
  return { ...nowSGT(now), label: NO_TIME };
}
