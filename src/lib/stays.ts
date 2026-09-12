// Shared "who's here today" logic for The Towner Godpawrents.
//
// This runs at BUILD time (for the no-JS <noscript> fallback and for the
// guests/diary pages, which aren't time-sensitive enough to need client
// correction) and is mirrored — deliberately, not imported, since it has to
// run from a plain inline <script> before hydration — by the small vanilla-JS
// version inlined in src/pages/index.astro. Keep the two in sync if the
// selection rules ever change; search for "MIRRORS src/lib/stays.ts".

export interface DiaryEntry {
  date: string; // e.g. "11 Sep"
  text: string;
}

export interface StayData {
  id: string;
  name: string;
  breed: string;
  tagline?: string;
  badge?: string;
  checkIn: string; // YYYY-MM-DD
  checkOut: string; // YYYY-MM-DD
  bgColor: string;
  showLive: boolean;
  photoSrc?: string;
  entries: DiaryEntry[];
}

export type TakeoverState = "one" | "multi" | "vacancy";

export interface TodayResult {
  state: TakeoverState;
  live: StayData[];
  lastGuest?: StayData;
}

const toISODate = (d: Date) => d.toISOString().slice(0, 10);

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
  return typeof d === "string" ? d.slice(0, 10) : toISODate(d);
}

/** Applies the selection rules for a given "today" ISO date. */
export function pickToday(stays: StayData[], todayISO: string): TodayResult {
  const live = stays
    .filter((s) => s.showLive && s.checkIn <= todayISO && todayISO <= s.checkOut)
    .sort((a, b) => a.checkIn.localeCompare(b.checkIn));

  if (live.length > 0) {
    return { state: live.length === 1 ? "one" : "multi", live };
  }

  const past = stays
    .filter((s) => s.checkOut < todayISO)
    .sort((a, b) => b.checkOut.localeCompare(a.checkOut));

  return { state: "vacancy", live: [], lastGuest: past[0] };
}

/** Past guests (already checked out as of todayISO), most recent first. */
export function pastGuests(stays: StayData[], todayISO: string): StayData[] {
  return stays
    .filter((s) => s.checkOut < todayISO)
    .sort((a, b) => b.checkOut.localeCompare(a.checkOut));
}

const M = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

export function fmtDay(iso: string): string {
  const [, m, d] = iso.split("-").map(Number);
  return `${d} ${M[m - 1]}`;
}

export function stayLabel(s: StayData): string {
  return `${fmtDay(s.checkIn)} – ${fmtDay(s.checkOut)}`;
}

// Rotating card palette + tilt, matching the design system.
export const SKINS = [
  { bg: "#F7F2E7", fg: "#1E2019", accent: "#4C6B3C" },
  { bg: "#2F4A3B", fg: "#F7F2E7", accent: "#D8F24E" },
  { bg: "#D8F24E", fg: "#1E2019", accent: "#4C6B14" },
  { bg: "#1E2019", fg: "#F3F1E9", accent: "#D8F24E" },
] as const;

export const skin = (i: number) => SKINS[i % SKINS.length];
export const tilt = (i: number) => (i % 2 === 0 ? "-1deg" : "1deg");

/**
 * Parses a stay's markdown body into dated diary entries.
 * Convention: `### DD Mon` heading followed by a paragraph, newest first.
 */
export function parseDiary(body: string): DiaryEntry[] {
  const entries: DiaryEntry[] = [];
  const re = /^###\s+(.+?)\s*$/gm;
  const matches = [...body.matchAll(re)];
  for (let i = 0; i < matches.length; i++) {
    const date = matches[i][1].trim();
    const start = matches[i].index! + matches[i][0].length;
    const end = i + 1 < matches.length ? matches[i + 1].index! : body.length;
    const text = body
      .slice(start, end)
      .trim()
      .replace(/\s+/g, " ");
    if (text) entries.push({ date, text });
  }
  return entries;
}
