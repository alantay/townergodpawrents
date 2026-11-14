// Pure filing logic shared by the Action script and its tests.
import { createRequire } from "node:module";
import { z } from "astro/zod";
import { dateStr, entryMinutes } from "../guests.ts";
import { POST_KEY_RE } from "./constants.ts";
import { MAX_MEDIA, splitFrontmatter } from "../diary-file.ts";
import { fileEntry } from "./file-entry.ts";
import { LABELS, NO_TIME, type GuestInfo } from "./types.ts";
import { isUploadUrl, validate } from "./validate.ts";

// Reuse Astro's installed YAML reader without adding another dependency.
const yaml = createRequire(import.meta.url)("js-yaml") as { load(text: string): unknown };
const guestData = z.object({
  name: z.string().min(1),
  stays: z.array(z.object({ checkIn: z.coerce.date(), checkOut: z.coerce.date() })).min(1),
});

/** "mp4", "mov" or "jpg" from an upload URL, else undefined. */
export function uploadKind(url: string): "mp4" | "mov" | "jpg" | undefined {
  const ext = /\.(mp4|mov|jpg)$/i.exec(new URL(url).pathname)?.[1].toLowerCase();
  return ext as "mp4" | "mov" | "jpg" | undefined;
}
const isClip = (url: string) => uploadKind(url) !== "jpg";

export const videoPayload = z.object({
  guest: z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
  iso: z.string(),
  time: z.string().regex(/^(?:[1-9]|1[0-2])(?::[0-5]\d)?[ap]m$/),
  label: z.enum(LABELS).optional(),
  noTime: z.boolean().optional(),
  with: z.array(z.string()),
  text: z.string(),
  /** In entry order. Exactly one is the video; the rest are JPEG photos. */
  media: z
    .array(z.object({ url: z.string().refine((u) => isUploadUrl(u) && !!uploadKind(u), "Bad upload URL"), alt: z.string() }))
    .min(1)
    .max(MAX_MEDIA)
    .refine((media) => media.filter((m) => isClip(m.url)).length === 1, "One video per post"),
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
    videoUrl: payload.media.find((m) => isClip(m.url))!.url,
  }, guests);
  if (!checked.ok) throw new Error(checked.error);
  const { input, guest } = checked;
  const filed = fileEntry(input, guest, payload.media.map((m) => ({ alt: m.alt, video: isClip(m.url) })), markdowns, taken);
  const media = filed.media.map((m, i) => ({ ...m, url: payload.media[i].url }));
  const clip = media.find((m) => m.video)!;
  return {
    markdown: filed.markdown,
    media,
    /** prep-video.sh's name for the clip: the file minus "<guest>-" and ".mp4". */
    slug: clip.file.slice(guest.id.length + 1, -4),
    message: filed.message,
  };
}
