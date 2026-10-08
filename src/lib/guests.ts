// Shared "who's here today" logic for The Towner Godpawrents.
//
// A guest is a dog; a guest has one or more stays. See CONTEXT.md for the
// language and docs/adr/0002-guest-has-many-stays.md for why.
//
// This runs at BUILD time (for the no-JS <noscript> fallback and for the
// guest pages, which aren't time-sensitive enough to need client correction)
// and is mirrored — deliberately, not imported, since it has to run from a
// plain inline <script> before hydration — by the small vanilla-JS version
// inlined in src/pages/index.astro. Keep the two in sync if the selection
// rules ever change; search for "MIRRORS src/lib/guests.ts".

/** One visit, check-in to check-out. Both ends inclusive. */
export interface Stay {
  checkIn: string; // YYYY-MM-DD
  checkOut: string; // YYYY-MM-DD
}

/**
 * Hand-written hero badges for a particular group of dogs staying together.
 * Key: guest ids sorted and joined with "+". Any group not listed gets the
 * default badge ("Vacuum on overtime").
 */
export const GROUP_BADGES: Record<string, string> = {
  "bobbi+guapo": "The fox and the sheep",
};

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
  /** Photos (up to four) in the order they appear in the markdown, or a
   * single video — never both, see parseDiary. */
  media: DiaryMedia[];
  /** Other guests this moment also belongs to, from `<!-- with: bobbi -->`.
   * crossPost copies the entry into their diaries too. */
  with: string[];
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

export interface GuestData {
  id: string;
  name: string;
  breed: string;
  tagline?: string;
  badge?: string;
  bgColor: string;
  showLive: boolean;
  stays: Stay[];
  days: DiaryDay[];
}

export type TakeoverState = "one" | "multi" | "vacancy";

export interface TodayResult {
  state: TakeoverState;
  live: GuestData[];
  lastGuest?: GuestData;
}

/** Today's date in Singapore time, as YYYY-MM-DD. */
export function todaySGT(now: Date = new Date()): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Singapore",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(now);
}

export function dateStr(d: Date | string): string {
  return typeof d === "string" ? d.slice(0, 10) : d.toISOString().slice(0, 10);
}

// ---- stays ----

/** Stays newest first. */
export function staysNewestFirst(stays: Stay[]): Stay[] {
  return [...stays].sort((a, b) => b.checkIn.localeCompare(a.checkIn));
}

/** The guest's most recent stay — the one that dates them in the past-guests grid. */
export function latestStay(g: Pick<GuestData, "stays">): Stay {
  return staysNewestFirst(g.stays)[0];
}

/** The stay containing todayISO, if the guest is here. */
export function stayOn(g: Pick<GuestData, "stays">, todayISO: string): Stay | undefined {
  return g.stays.find((s) => s.checkIn <= todayISO && todayISO <= s.checkOut);
}

export function isLiveOn(g: Pick<GuestData, "stays" | "showLive">, todayISO: string): boolean {
  return g.showLive && stayOn(g, todayISO) !== undefined;
}

/** Applies the selection rules for a given "today" ISO date. */
export function pickToday(guests: GuestData[], todayISO: string): TodayResult {
  const live = guests
    .filter((g) => isLiveOn(g, todayISO))
    .sort((a, b) => stayOn(a, todayISO)!.checkIn.localeCompare(stayOn(b, todayISO)!.checkIn));

  if (live.length > 0) {
    return { state: live.length === 1 ? "one" : "multi", live };
  }

  return { state: "vacancy", live: [], lastGuest: pastGuests(guests, todayISO)[0] };
}

/**
 * The newest stay that's already over, if any. Not the same as latestStay: a
 * dog with a return visit booked would otherwise be dated from the future.
 */
export function lastEndedStay(g: Pick<GuestData, "stays">, todayISO: string): Stay | undefined {
  return staysNewestFirst(g.stays).find((s) => s.checkOut < todayISO);
}

/**
 * Guests with at least one stay behind them, most recently departed first.
 * A dog appears once however many times they've stayed, and stays listed
 * between visits.
 */
export function pastGuests(guests: GuestData[], todayISO: string): GuestData[] {
  return guests
    .filter((g) => lastEndedStay(g, todayISO))
    .sort((a, b) => lastEndedStay(b, todayISO)!.checkOut.localeCompare(lastEndedStay(a, todayISO)!.checkOut));
}

// ---- dogs ----

/**
 * The dogs a guest is made of. Dogs from one home share a guest, named like
 * "Hugo & Luffy" — see docs/adr/0006-dogs-from-one-home-share-a-guest.md.
 */
export function dogNames(name: string): string[] {
  return name.split(" & ");
}

/** "Luna", "Luna & Milk", "Luna, Hugo & Luffy". */
export function listNames(names: string[]): string {
  return names.length > 1 ? `${names.slice(0, -1).join(", ")} & ${names[names.length - 1]}` : names[0];
}

// ---- labels ----

const M = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

export function fmtDay(iso: string): string {
  const [, m, d] = iso.split("-").map(Number);
  return `${d} ${M[m - 1]}`;
}

export function stayLabel(s: Stay): string {
  if (s.checkIn === s.checkOut) return fmtDay(s.checkIn);
  // Same month: "13–23 Sep", not "13 Sep – 23 Sep".
  if (s.checkIn.slice(0, 7) === s.checkOut.slice(0, 7)) {
    return `${Number(s.checkIn.slice(8))}–${fmtDay(s.checkOut)}`;
  }
  return `${fmtDay(s.checkIn)} – ${fmtDay(s.checkOut)}`;
}

// ---- diary ----

// A markdown image inside an entry. An entry can carry up to four prints,
// or a single video — reuses the same `![alt](path)` syntax, and the file
// extension decides whether it plays as a photo or a video.
const IMAGE_RE = /!\[([^\]]*)\]\(\s*([^)\s]+)(?:\s+"[^"]*")?\s*\)/g;

const VIDEO_EXT_RE = /\.mp4$/i;

function mediaKind(src: string): MediaKind {
  return VIDEO_EXT_RE.test(src) ? "video" : "photo";
}

/** `## 13 Sep` day dividers and `### 9:50am` entry headings, in one pass. */
const HEADING_RE = /^(#{2,3})\s+(.+?)\s*$/gm;

const DAY_RE = /^(\d{1,2})\s+([A-Za-z]{3,})$/;
const ENTRY_ID_RE = /<!--\s*entry-id:\s*([a-z0-9-]+)\s*-->/g;
const WITH_RE = /<!--\s*with:\s*([a-z0-9,\s-]*?)\s*-->/g;

/**
 * Turns a `## 13 Sep` divider into a full date by finding the stay that
 * contains it. The year is never written in the diary — the stay list is
 * what supplies it, which makes the stay list a checksum on the diary.
 */
function resolveDay(label: string, stays: Stay[], guestId: string): string {
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
      `(${stays.map(stayLabel).join(", ")}) — wrong date, or a stay is missing?`,
  );
}

/**
 * Parses a guest's markdown body into diary days.
 *
 * Convention: `## 13 Sep` day dividers, `### 9:50am` entries under them,
 * newest first. One to four `![alt](./photo.jpg)` lines anywhere in an entry
 * become its prints; a `.mp4` line becomes a video instead, and an entry
 * can only carry one — a photo (or photos) on its own, or a single video,
 * never both. A photo or video on its own is a valid entry — some moments
 * don't need words.
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
    if (videos.length > 1 || (videos.length === 1 && media.length > 1)) {
      throw new Error(`[guests] ${guestId}: entry "${title}" mixes a video with other media. Use up to four photos, or one video on its own`);
    }
    if (media.length > 4) {
      throw new Error(`[guests] ${guestId}: entry "${title}" has ${media.length} prints — use at most four`);
    }
    const text = raw.replace(IMAGE_RE, " ").replace(ENTRY_ID_RE, " ").replace(WITH_RE, " ").trim().replace(/\s+/g, " ");
    const withIds = [...raw.matchAll(WITH_RE)].flatMap((m) => m[1].split(",").map((w) => w.trim()).filter(Boolean));

    if (text || media.length > 0) current.entries.push({ id, time: title, text, media, with: withIds });
  }

  // Days newest first, whatever order they were written in. Entries keep the
  // order they're written in — times are freeform, so the author decides.
  return days.filter((d) => d.entries.length > 0).sort((a, b) => b.iso.localeCompare(a.iso));
}

/**
 * Minutes past midnight for an entry time like "9:30pm" or "8am", so a day
 * shared by two dogs can be merged in time order. Anything else sorts last.
 */
export function entryMinutes(time: string): number {
  const m = time.trim().toLowerCase().match(/^(\d{1,2})(?::(\d{2}))?(am|pm)$/);
  if (!m) return -1;
  return ((+m[1] % 12) + (m[3] === "pm" ? 12 : 0)) * 60 + (+(m[2] ?? 0));
}

/**
 * Copies every `<!-- with: ... -->` entry into the other guests' diaries, on
 * the same day and in time order. The day must fall inside one of their
 * stays, or the build fails, same as a day written in their own file.
 */
export function crossPost(guests: Pick<GuestData, "id" | "stays" | "days">[]): void {
  const shares = guests.flatMap((g) =>
    g.days.flatMap((d) => d.entries.flatMap((e) => e.with.map((to) => ({ from: g.id, day: d, entry: e, to })))),
  );
  for (const { from, day, entry, to } of shares) {
    const target = guests.find((g) => g.id === to);
    if (!target || to === from) {
      throw new Error(`[guests] ${from}: entry ${entry.id} is shared "with: ${to}", which isn't another guest`);
    }
    if (!target.stays.some((s) => s.checkIn <= day.iso && day.iso <= s.checkOut)) {
      throw new Error(`[guests] ${from}: entry ${entry.id} is shared with ${to}, but ${day.label} isn't in any of ${to}'s stays`);
    }
    let targetDay = target.days.find((d) => d.iso === day.iso);
    if (!targetDay) {
      targetDay = { iso: day.iso, label: day.label, entries: [] };
      target.days.push(targetDay);
      target.days.sort((a, b) => b.iso.localeCompare(a.iso));
    }
    // Shared entries name everyone on the card, so the copy lists the
    // original guest plus any third guest, never the one it's filed under.
    const copy = { ...entry, from, with: [from, ...entry.with.filter((w) => w !== to)] };
    const at = targetDay.entries.findIndex((e) => entryMinutes(e.time) < entryMinutes(entry.time));
    targetDay.entries.splice(at < 0 ? targetDay.entries.length : at, 0, copy);
  }
}

/** The diary day for a given date, if anything was written that day. */
export function dayOn(g: Pick<GuestData, "days">, iso: string): DiaryDay | undefined {
  return g.days.find((d) => d.iso === iso);
}

/**
 * Same-guest stays that overlap. Deliberately a warning, not a build failure:
 * real hosting is messier than the model, and this must never block a real
 * day from being written down. See ADR 0002.
 */
export function warnOnOverlaps(guestId: string, stays: Stay[]): void {
  const sorted = staysNewestFirst(stays).reverse();
  for (let i = 1; i < sorted.length; i++) {
    if (sorted[i].checkIn <= sorted[i - 1].checkOut) {
      console.warn(
        `[guests] ${guestId}: stays ${stayLabel(sorted[i - 1])} and ${stayLabel(sorted[i])} ` +
          `overlap. Fine if that's real — just checking it isn't a typo.`,
      );
    }
  }
}

// ---- presentation ----

/** Mixes two six-digit hex colours. Kept here so every diary can borrow a
 * whisper of its guest's hero colour without turning into a rainbow feed. */
function mixHex(a: string, b: string, amount: number): string {
  const channels = (hex: string) => hex.replace("#", "").match(/.{2}/g)!.map((v) => parseInt(v, 16));
  const [ar, ag, ab] = channels(a);
  const [br, bg, bb] = channels(b);
  const mix = (x: number, y: number) => Math.round(x + (y - x) * amount).toString(16).padStart(2, "0");
  return `#${mix(ar, br)}${mix(ag, bg)}${mix(ab, bb)}`;
}

/** Each diary cycles through the guest's own avatar colour, from a pale wash
 * to deep evening shades. It keeps the scrapbook energy without borrowing
 * another dog's colour or the site's live-status lime. */
export function diarySkin(base: string, i: number) {
  const skins = [
    { bg: mixHex(base, "#F7F2E7", 0.72), fg: "#1E2019", accent: mixHex(base, "#1E2019", 0.35) },
    { bg: base, fg: "#F7F2E7", accent: "#F7F2E7" },
    { bg: mixHex(base, "#1E2019", 0.38), fg: "#F7F2E7", accent: mixHex(base, "#F7F2E7", 0.7) },
    { bg: mixHex(base, "#1E2019", 0.72), fg: "#F3F1E9", accent: mixHex(base, "#F7F2E7", 0.7) },
  ];
  return skins[i % skins.length];
}

export const tilt = (i: number) => (i % 2 === 0 ? "-1deg" : "1deg");

// A diary photo leans against its card's tilt, so it reads as a print laid
// into the page rather than a block laid out by a grid.
export const printTilt = (i: number) => (i % 2 === 0 ? "1.5deg" : "-1.5deg");

// A caption slip leans with its card instead, and barely — a note tucked in
// flat, not another print thrown on the pile.
export const noteTilt = (i: number) => (i % 2 === 0 ? "-0.4deg" : "0.4deg");

// A video card stays level (a tilted ancestor makes <video> flicker), so its
// slip carries the lean the card can't.
export const videoNoteTilt = (i: number) => (i % 2 === 0 ? "-1.5deg" : "1.5deg");

/**
 * Whether a caption is short enough to live on a single print's mat.
 * A few words read as something scribbled on the border; a sentence or two
 * is a paragraph wearing a photo's frame, and belongs on its own slip
 * instead.
 */
export const fitsPrintMat = (text: string) => text.trim().split(/\s+/).length <= 8;

/**
 * Display width for a diary print, in CSS pixels, including its 7px mat.
 * The photo is never cropped — a tall portrait just goes narrower instead of
 * towering, so the height cap is what keeps the page scannable.
 */
export const PRINT_MAX_HEIGHT = 420;
export const PRINT_MAT = 7;
// A phone video is 9:16, narrower than a 3:4 photo at the same height, so it
// gets a taller cap to come out as wide as a portrait print.
export const VIDEO_MAX_HEIGHT = 560;
export function printWidth(w: number, h: number, maxHeight = PRINT_MAX_HEIGHT): number {
  return Math.round(maxHeight * (w / h)) + PRINT_MAT * 2;
}

/** Diary captions allow strikethrough; all authored HTML stays escaped. */
export function diaryTextHtml(text: string): string {
  return text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
    .replace(/~~([^~]+)~~/g, "<del>$1</del>");
}
