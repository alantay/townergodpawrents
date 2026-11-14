// The Diary file: one markdown file per guest, frontmatter then diary days
// and entries. This module owns that format both ways: parseDiary reads it
// for the site, insertEntry writes it for /admin. See GLOSSARY.md.
//
// Runs in the browser too (/admin), so no node or astro imports.
import { entryMinutes, fmtDay, M, stayLabel, type Stay } from "./guests.ts";

export type MediaKind = "photo" | "video";

export interface DiaryMedia {
  /** Path exactly as written in the markdown, e.g. "./ebi-3-50pm.jpg". */
  src: string;
  /** Alt text from the markdown; empty when the author left it blank. */
  alt: string;
  kind: MediaKind;
}

/** One timestamped moment: a `### 9:50am` heading and what's under it. */
export interface DiaryEntry {
  id: string; // stable within this guest, even if the time or words change
  time: string; // e.g. "9:50am"
  text: string;
  /** Up to four photos and videos in markdown order, with at most one video.
   * See parseDiary. */
  media: DiaryMedia[];
  /** Other guests this moment also belongs to, from `<!-- with: bobbi -->`.
   * crossPost copies the entry into their diaries too. */
  with: string[];
  /** Small print under the entry, from `<!-- credit: Music: ... -->`. */
  credit?: string;
  /** Shown in place of the time, from `<!-- label: Throwback -->`. The time
   * still orders the entry and keys its "New" tag. */
  label?: string;
  /** From `<!-- no-time -->`: the card shows no time. Like a label, the
   * time still orders the entry and keys its "New" tag. */
  noTime?: boolean;
  /** Set on a crossPost copy: the guest whose file the entry is written in.
   * Reactions stay keyed to that guest, so both diaries share one count. */
  from?: string;
}

/** One calendar day of a stay: a `## 13 Sep` divider and its entries. */
export interface DiaryDay {
  iso: string; // YYYY-MM-DD, resolved against the stay containing it
  label: string; // "13 Sep", exactly as written
  entries: DiaryEntry[];
}

// ---- reading ----

/** Most photos and videos one entry can carry. */
export const MAX_MEDIA = 4;
/** Most videos one entry can carry, alongside its photos. */
export const MAX_CLIPS = 1;

// A markdown image inside an entry. An entry can carry up to MAX_MEDIA media
// items, with at most MAX_CLIPS video. Both use the same `![alt](path)` syntax;
// the file extension decides whether it plays as a photo or a video.
const IMAGE_RE = /!\[([^\]]*)\]\(\s*([^)\s]+)(?:\s+"[^"]*")?\s*\)/g;

const VIDEO_EXT_RE = /\.mp4$/i;

/** A `.mp4` plays as a video; anything else is a photo. */
export function mediaKind(src: string): MediaKind {
  return VIDEO_EXT_RE.test(src) ? "video" : "photo";
}

/** `## 13 Sep` day dividers and `### 9:50am` entry headings, in one pass.
 * One line only, for reading and writing alike. */
const HEADING_RE = /^(#{2,3})[ \t]+(\S.*?)[ \t]*$/gm;

const DAY_RE = /^(\d{1,2})\s+([A-Za-z]{3,})$/;
const ENTRY_ID_RE = /<!--\s*entry-id:\s*([a-z0-9-]+)\s*-->/g;
const WITH_RE = /<!--\s*with:\s*([a-z0-9,\s-]*?)\s*-->/g;
const CREDIT_RE = /<!--\s*credit:\s*([\s\S]*?)\s*-->/;
const LABEL_RE = /<!--\s*label:\s*(.+?)\s*-->/;
const NO_TIME_RE = /<!--\s*no-time\s*-->/;

/**
 * Turns a `## 13 Sep` divider into a full date by finding the stay that
 * contains it. The year is never written in the diary — the stay list is
 * what supplies it, which makes the stay list a checksum on the diary.
 */
export function resolveDay(label: string, stays: Stay[], guestId: string): string {
  const m = DAY_RE.exec(label);
  if (!m) {
    throw new Error(
      `[guests] ${guestId}: diary day "${label}" isn't a date — write it like "## 13 Sep"`,
    );
  }
  const day = Number(m[1]);
  const month = M.findIndex((n) => n.toLowerCase() === m[2].slice(0, 3).toLowerCase());
  if (month < 0) {
    throw new Error(`[guests] ${guestId}: diary day "${label}" has no month I recognise`);
  }

  // A stay can straddle New Year, so try both ends' years.
  const years = new Set<number>();
  for (const s of stays) {
    years.add(Number(s.checkIn.slice(0, 4)));
    years.add(Number(s.checkOut.slice(0, 4)));
  }

  for (const year of [...years].sort()) {
    const iso = `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
    if (stays.some((s) => s.checkIn <= iso && iso <= s.checkOut)) return iso;
  }

  throw new Error(
    `[guests] ${guestId}: diary day "${label}" falls outside every stay ` +
      `(${stays.map((s) => stayLabel(s)).join(", ")}) — wrong date, or a stay is missing?`,
  );
}

/**
 * Parses a guest's markdown body into diary days.
 *
 * Convention: `## 13 Sep` day dividers, `### 9:50am` entries under them,
 * newest first. Up to MAX_MEDIA `![alt](./path)` lines anywhere in an entry
 * become its media, in markdown order. A `.mp4` line becomes a video;
 * at most one video can sit alongside photos in the same entry.
 * Media without words is a valid entry. Some moments don't need words.
 */
export function parseDiary(body: string, stays: Stay[], guestId: string): DiaryDay[] {
  const heads = [...body.matchAll(HEADING_RE)];
  const days: DiaryDay[] = [];
  let current: DiaryDay | undefined;
  const seenIds = new Set<string>();

  for (let i = 0; i < heads.length; i++) {
    const [full, hashes, title] = heads[i];
    const start = heads[i].index! + full.length;
    const end = i + 1 < heads.length ? heads[i + 1].index! : body.length;

    if (hashes === "##") {
      current = { iso: resolveDay(title, stays, guestId), label: title, entries: [] };
      days.push(current);
      continue;
    }

    if (!current) {
      throw new Error(
        `[guests] ${guestId}: entry "${title}" has no day above it — ` +
          `start the day with a "## 13 Sep" divider`,
      );
    }

    const raw = body.slice(start, end);
    const ids = [...raw.matchAll(ENTRY_ID_RE)];
    if (ids.length !== 1) {
      throw new Error(`[guests] ${guestId}: entry "${title}" needs exactly one <!-- entry-id: ... -->`);
    }
    const id = ids[0][1];
    if (seenIds.has(id)) throw new Error(`[guests] ${guestId}: duplicate entry ID "${id}"`);
    seenIds.add(id);
    const matches = [...raw.matchAll(IMAGE_RE)];
    const media = matches.map((match) => ({ src: match[2], alt: match[1].trim(), kind: mediaKind(match[2]) }));
    const videos = media.filter((m) => m.kind === "video");
    if (videos.length > MAX_CLIPS) {
      throw new Error(`[guests] ${guestId}: entry "${title}" has ${videos.length} videos. Use at most one`);
    }
    if (media.length > MAX_MEDIA) {
      throw new Error(`[guests] ${guestId}: entry "${title}" has ${media.length} photos and videos. Use at most four`);
    }
    const text = raw.replace(IMAGE_RE, " ").replace(ENTRY_ID_RE, " ").replace(WITH_RE, " ").replace(CREDIT_RE, " ").replace(LABEL_RE, " ").replace(NO_TIME_RE, " ").trim()
      .split(/\n\s*\n/).map((p) => p.trim().replace(/\s+/g, " ")).filter(Boolean).join("\n\n");
    const withIds = [...raw.matchAll(WITH_RE)].flatMap((m) => m[1].split(",").map((w) => w.trim()).filter(Boolean));

    const credit = raw.match(CREDIT_RE)?.[1];
    const label = raw.match(LABEL_RE)?.[1];
    const noTime = NO_TIME_RE.test(raw);

    if (text || media.length > 0) current.entries.push({ id, time: title, text, media, with: withIds, ...(credit && { credit }), ...(label && { label }), ...(noTime && { noTime }) });
  }

  // Days newest first, whatever order they were written in. Entries keep the
  // order they're written in — times are freeform, so the author decides.
  return days.filter((d) => d.entries.length > 0).sort((a, b) => b.iso.localeCompare(a.iso));
}

// ---- writing ----
//
// Files a new entry the way docs/agents/add-entry.md does by hand: right day
// (adding the "## 16 Oct" divider if needed, newest day first), right spot in
// time order (newest first), next free entry ID.

const FRONTMATTER_RE = /^---\r?\n[\s\S]*?\r?\n---(?=\r?\n|$)/;
/** Entry IDs as /admin numbers them: e001, e002, ... */
const NUMBERED_ID_RE = /<!--\s*entry-id:\s*e(\d+)\s*-->/g;

export interface NewEntry {
  iso: string;
  time: string;
  label?: string;
  noTime?: boolean;
  with: string[];
  text: string;
  images: { alt: string; file: string }[];
  id: string;
}

export function splitFrontmatter(markdown: string): { frontmatter: string; body: string } {
  const m = FRONTMATTER_RE.exec(markdown);
  if (!m) throw new Error("[admin] guest file has no frontmatter");
  return { frontmatter: m[0], body: markdown.slice(m[0].length) };
}

/**
 * IDs are unique across every guest file, not just one: a shared entry is
 * copied into the other dog's page with its ID, and the page uses
 * id="entry-<id>". So pass every guest's markdown.
 */
export function nextId(markdowns: string[]): string {
  let max = 0;
  for (const md of markdowns) for (const m of md.matchAll(NUMBERED_ID_RE)) max = Math.max(max, Number(m[1]));
  return `e${String(max + 1).padStart(3, "0")}`;
}

export function entryBlock(entry: NewEntry, guestId: string): string {
  const comments = [
    `<!-- entry-id: ${entry.id} -->`,
    ...(entry.with.length ? [`<!-- with: ${entry.with.join(", ")} -->`] : []),
    ...(entry.label ? [`<!-- label: ${entry.label} -->`] : []),
    ...(entry.noTime ? ["<!-- no-time -->"] : []),
  ].join("\n");
  return [
    `### ${entry.time}`,
    comments,
    ...(entry.text ? [entry.text] : []),
    ...entry.images.map((img) => `![${img.alt}](./${guestId}/${img.file})`),
  ].join("\n\n");
}

function splice(body: string, at: number, block: string): string {
  const before = body.slice(0, at).trimEnd();
  const after = body.slice(at).trim();
  return [before, block, after].filter(Boolean).join("\n\n");
}

export function insertEntry(markdown: string, entry: NewEntry, stays: Stay[], guestId: string): string {
  const { frontmatter, body } = splitFrontmatter(markdown);
  const heads = [...body.matchAll(HEADING_RE)].map((m) => ({ at: m.index!, level: m[1], title: m[2] }));
  const days = heads
    .filter((h) => h.level === "##")
    .map((h) => {
      try {
        return { ...h, iso: resolveDay(h.title, stays, guestId) };
      } catch {
        return { ...h, iso: undefined };
      }
    });
  const block = entryBlock(entry, guestId);
  const minutes = entryMinutes(entry.time);

  let content: string;
  const day = days.find((d) => d.iso === entry.iso);
  if (day) {
    const end = days.find((d) => d.at > day.at)?.at ?? body.length;
    const later = heads.find((h) => h.level === "###" && h.at > day.at && h.at < end
      && entryMinutes(h.title) >= 0 && entryMinutes(h.title) <= minutes);
    content = splice(body, later?.at ?? end, block);
  } else {
    const older = days.find((d) => d.iso !== undefined && d.iso < entry.iso);
    content = splice(body, older?.at ?? body.length, `## ${fmtDay(entry.iso)}\n\n${block}`);
  }
  return `${frontmatter}\n\n${content.trim()}\n`;
}

// ---- escaping ----

/** Alt text goes inside ![...](...), so it can't carry brackets or comments. */
export function sanitizeAlt(alt: string, fallback: string): string {
  const clean = alt.replace(/[[\]()<>]/g, "").replace(/\s+/g, " ").trim().slice(0, 200).trim();
  return clean || fallback;
}

/**
 * Typed words go straight into the dog's markdown. Stop them turning into a
 * day or entry heading, an entry-id comment or an image. Trim first, so the
 * space that defuses a heading on the first line survives.
 */
export function sanitizeText(text: string): string {
  return text
    .replace(/\r\n?/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim()
    .replace(/^(#{2,3})(?=\s|$)/gm, " $1")
    .replace(/<!--/g, "< !--")
    .replace(/!\[/g, "! [");
}
