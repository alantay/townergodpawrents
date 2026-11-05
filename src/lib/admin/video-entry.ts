// Pure filing logic shared by the Action script and its tests.
import { createRequire } from "node:module";
import { z } from "astro/zod";
import { dateStr, entryMinutes } from "../guests.ts";
import { POST_KEY_RE } from "./constants.ts";
import { sanitizeAlt } from "./format.ts";
import { insertEntry, nextId, splitFrontmatter } from "./insert-entry.ts";
import { photoName, slugWords } from "./photo-name.ts";
import { LABELS, NO_TIME, type GuestInfo } from "./types.ts";
import { isVideoUrl, validate } from "./validate.ts";

// Reuse Astro's installed YAML reader without adding another dependency.
const yaml = createRequire(import.meta.url)("js-yaml") as { load(text: string): unknown };
const guestData = z.object({
  name: z.string().min(1),
  stays: z.array(z.object({ checkIn: z.coerce.date(), checkOut: z.coerce.date() })).min(1),
});

export const videoPayload = z.object({
  guest: z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
  iso: z.string(),
  time: z.string().regex(/^(?:[1-9]|1[0-2])(?::[0-5]\d)?[ap]m$/),
  label: z.enum(LABELS).optional(),
  noTime: z.boolean().optional(),
  with: z.array(z.string()),
  text: z.string(),
  alt: z.string(),
  videoUrl: z.string().refine(isVideoUrl, "Bad video URL"),
  postKey: z.string().regex(POST_KEY_RE),
});
export type VideoPayload = z.infer<typeof videoPayload>;

export function buildVideoEntry(payload: VideoPayload, markdowns: Record<string, string>, taken: Set<string>) {
  const guests = Object.entries(markdowns).map(([id, markdown]): GuestInfo => {
    const { frontmatter } = splitFrontmatter(markdown);
    const data = guestData.parse(yaml.load(frontmatter.replace(/^---\r?\n|\r?\n---$/g, "")));
    return { id, name: data.name, recent: [], stays: data.stays.map((s) => ({ checkIn: dateStr(s.checkIn), checkOut: dateStr(s.checkOut) })) };
  });
  const minutes = entryMinutes(payload.time);
  const checked = validate({
    ...payload,
    time: `${String(Math.floor(minutes / 60)).padStart(2, "0")}:${String(minutes % 60).padStart(2, "0")}`,
    label: payload.noTime ? NO_TIME : payload.label ?? "",
    photos: [],
  }, guests);
  if (!checked.ok) throw new Error(checked.error);
  const { input, guest } = checked;
  const words = slugWords(input.text, guest.name);
  const file = photoName(guest.id, words, taken, "mp4");
  const markdown = insertEntry(markdowns[guest.id], {
    ...input,
    id: nextId(Object.values(markdowns)),
    images: [{ alt: sanitizeAlt(payload.alt, guest.name), file }],
  }, guest.stays, guest.id);
  return {
    markdown,
    file,
    slug: file.slice(guest.id.length + 1, -4),
    message: `Add ${guest.name} ${input.time} ${words.join(" ")} entry (via admin)`,
  };
}
