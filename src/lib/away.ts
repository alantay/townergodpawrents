// Days Alan and Weiwen are away from home, so no dog can stay.
// Listed by hand in src/data/away.json. Both ends inclusive, like a stay.

import { z } from "astro/zod";
import raw from "../data/away.json";

const day = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "dates look like 2026-12-02");

const schema = z.array(
  z
    .object({ from: day, to: day, note: z.string().trim().min(1).optional() })
    .refine((a) => a.to >= a.from, { message: "to must be on or after from", path: ["to"] }),
);

export interface Away {
  checkIn: string;
  checkOut: string;
  note?: string;
}

/** Every away spell, in date order, shaped like a stay so the calendar can lay it out. */
export const awaySpells: Away[] = schema
  .parse(raw)
  .map((a) => ({ checkIn: a.from, checkOut: a.to, note: a.note }))
  .sort((a, b) => a.checkIn.localeCompare(b.checkIn));
