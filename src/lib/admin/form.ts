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
