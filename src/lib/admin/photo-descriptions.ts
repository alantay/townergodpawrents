// Bind reusable descriptions to the exact photo and selected guests. Caption
// edits do not invalidate factual descriptions of what is visible.
import { createHash } from "node:crypto";
import { sanitizeAlt } from "./format.ts";
import type { AiContext, Photo } from "./types.ts";

export interface PhotoDescription { key: string; alt: string }

export function descriptionKey(photo: Photo, ctx: AiContext): string {
  return createHash("sha256")
    .update(JSON.stringify([ctx.name, [...ctx.withNames].sort()]))
    .update(photo.bytes)
    .digest("hex");
}

export function cachedAlt(raw: unknown, photo: Photo, ctx: AiContext): string | undefined {
  if (!Array.isArray(raw)) return undefined;
  const key = descriptionKey(photo, ctx);
  const match = raw.find((item) => item?.key === key && typeof item.alt === "string");
  return match ? sanitizeAlt(match.alt, "") || undefined : undefined;
}
