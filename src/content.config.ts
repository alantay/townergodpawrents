import { defineCollection } from "astro:content";
import { glob } from "astro/loaders";
import { z } from "astro/zod";

const stays = defineCollection({
  loader: glob({ base: "./src/content/stays", pattern: "**/*.md" }),
  schema: ({ image }) =>
    z.object({
      name: z.string(),
      breed: z.string(),
      // Cut-out PNG/WebP with a transparent background. Optional so a stay
      // can go live before a photo is on hand — the UI falls back to a
      // colour-block placeholder in that case.
      photo: image().optional(),
      checkIn: z.coerce.date(),
      checkOut: z.coerce.date(),
      bgColor: z
        .string()
        .regex(/^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/, "bgColor must be a hex colour like #5F6E4F"),
      showLive: z.boolean().default(true),
      // Small flourishes to match the design's hero chip + italic subhead.
      // Optional — not part of the core content model.
      badge: z.string().optional(),
      tagline: z.string().optional(),
    })
    .refine((s) => s.checkOut >= s.checkIn, {
      message: "checkOut must be on or after checkIn",
      path: ["checkOut"],
    }),
});

export const collections = { stays };
