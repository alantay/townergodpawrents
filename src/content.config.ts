import { defineCollection } from "astro:content";
import { glob } from "astro/loaders";
import { z } from "astro/zod";

// One file is one guest — one dog, one page, forever. A dog that comes back
// gains a stay, not a file. See docs/adr/0002-guest-has-many-stays.md.
const guests = defineCollection({
  loader: glob({ base: "./src/content/guests", pattern: "**/*.md" }),
  schema: ({ image }) =>
    z.object({
      // ---- who the dog is: true across every visit ----
      name: z.string(),
      breed: z.string(),
      // Cut-out PNG/WebP with a transparent background. Optional so a guest
      // can go live before a photo is on hand — the UI falls back to a
      // colour-block placeholder in that case.
      photo: image().optional(),
      bgColor: z
        .string()
        .regex(/^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/, "bgColor must be a hex colour like #5F6E4F"),
      showLive: z.boolean().default(true),
      // Small flourishes to match the design's hero chip + italic subhead.
      // Character notes, not visit notes — optional.
      badge: z.string().optional(),
      tagline: z.string().optional(),

      // ---- when the dog was here ----
      // Adjacent dates are separate stays: home on the 23rd, back on the
      // 24th is two visits, not one. Overlapping stays only warn (ADR 0002).
      stays: z
        .array(
          z
            .object({
              checkIn: z.coerce.date(),
              checkOut: z.coerce.date(),
            })
            .refine((s) => s.checkOut >= s.checkIn, {
              message: "checkOut must be on or after checkIn",
              path: ["checkOut"],
            }),
        )
        .min(1, "a guest needs at least one stay — this is a log of dogs we've actually hosted"),
    }),
});

export const collections = { guests };
