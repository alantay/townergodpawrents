// Turns one checked admin post into the files it adds: the dog's new
// markdown, a name for each photo and clip, and the commit message. Both ways
// of posting use it: photos from the site's server, clips from the
// admin-video Action. Each fetches the files and commits in its own way.
import { insertEntry, nextId, sanitizeAlt } from "../diary-file.ts";
import type { Stay } from "../guests.ts";
import { photoName, slugWords } from "./photo-name.ts";
import type { EntryInput } from "./types.ts";

export type FilingEntry = Pick<EntryInput, "iso" | "time" | "label" | "noTime" | "with" | "text">;

export interface FiledMedia {
  alt: string;
  video: boolean;
  /** "luna-stole-slipper.jpg", free in the dog's media folder. */
  file: string;
}

/**
 * `media` is in entry order. `markdowns` holds every guest's file by ID (IDs
 * are numbered across all of them). `taken` is the dog's media folder; new
 * names are added to it.
 */
export function fileEntry(
  entry: FilingEntry,
  guest: { id: string; name: string; stays: Stay[] },
  media: { alt: string; video: boolean }[],
  markdowns: Record<string, string>,
  taken: Set<string>,
): { markdown: string; media: FiledMedia[]; message: string } {
  const words = slugWords(entry.text, guest.name);
  const filed = media.map((m) => ({
    alt: sanitizeAlt(m.alt, guest.name),
    video: m.video,
    file: photoName(guest.id, words, taken, m.video ? "mp4" : "jpg"),
  }));
  const markdown = insertEntry(markdowns[guest.id], {
    iso: entry.iso,
    time: entry.time,
    label: entry.label,
    noTime: entry.noTime,
    with: entry.with,
    text: entry.text,
    images: filed.map(({ alt, file }) => ({ alt, file })),
    id: nextId(Object.values(markdowns)),
  }, guest.stays, guest.id);
  return { markdown, media: filed, message: `Add ${guest.name} ${entry.time} ${words.join(" ")} entry (via admin)` };
}
