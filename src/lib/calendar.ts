// Month grids for the sofa calendar (/calendar).
//
// Pure date maths on YYYY-MM-DD strings, all in UTC so a build machine's
// timezone never shifts a stay by a day. "Today" is decided in the browser
// (Singapore time) — this only lays out the weeks and where each stay's bar
// sits in them.

import type { Stay } from "./guests.ts";

export interface CalendarStay extends Stay {
  guestId: string;
}

/** One piece of a stay's bar, clipped to a single week row. */
export interface Segment<S extends CalendarStay = CalendarStay> {
  stay: S;
  /** 0 = Monday. */
  startCol: number;
  span: number;
  /** Stacking row within the week, so overlapping stays don't collide. */
  lane: number;
  /** The stay began in an earlier week — the bar reads as a continuation. */
  continued: boolean;
}

export interface Week<S extends CalendarStay = CalendarStay> {
  days: { iso: string; day: number; inMonth: boolean }[];
  segments: Segment<S>[];
  lanes: number;
}

export interface Month<S extends CalendarStay = CalendarStay> {
  key: string; // YYYY-MM
  name: string; // "September"
  year: number;
  weeks: Week<S>[];
  /** Stays touching this month, in check-in order. */
  stays: S[];
}

const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

const iso = (d: Date) => d.toISOString().slice(0, 10);
const utc = (s: string) => new Date(`${s}T00:00:00Z`);
const addDays = (s: string, n: number) => {
  const d = utc(s);
  d.setUTCDate(d.getUTCDate() + n);
  return iso(d);
};

/** Monday-first weeks covering one month, with stays laid out as bars. */
export function monthGrid<S extends CalendarStay>(year: number, month: number, stays: S[]): Month<S> {
  const first = iso(new Date(Date.UTC(year, month, 1)));
  const last = iso(new Date(Date.UTC(year, month + 1, 0)));
  const mondayOffset = (utc(first).getUTCDay() + 6) % 7;
  let weekStart = addDays(first, -mondayOffset);

  const weeks: Week<S>[] = [];
  while (weekStart <= last) {
    const weekEnd = addDays(weekStart, 6);
    const days = Array.from({ length: 7 }, (_, i) => {
      const d = addDays(weekStart, i);
      return { iso: d, day: Number(d.slice(8)), inMonth: d >= first && d <= last };
    });

    const laneEnds: number[] = [];
    const segments = stays
      .filter((s) => s.checkIn <= weekEnd && s.checkOut >= weekStart)
      .sort((a, b) => a.checkIn.localeCompare(b.checkIn) || b.checkOut.localeCompare(a.checkOut))
      .map((stay) => {
        const from = stay.checkIn > weekStart ? stay.checkIn : weekStart;
        const to = stay.checkOut < weekEnd ? stay.checkOut : weekEnd;
        const startCol = days.findIndex((d) => d.iso === from);
        const endCol = days.findIndex((d) => d.iso === to);
        let lane = laneEnds.findIndex((end) => end < startCol);
        if (lane < 0) lane = laneEnds.length;
        laneEnds[lane] = endCol;
        return { stay, startCol, span: endCol - startCol + 1, lane, continued: stay.checkIn < weekStart };
      });

    weeks.push({ days, segments, lanes: laneEnds.length });
    weekStart = addDays(weekStart, 7);
  }

  return {
    key: first.slice(0, 7),
    name: MONTHS[month],
    year,
    weeks,
    stays: stays
      .filter((s) => s.checkIn <= last && s.checkOut >= first)
      .sort((a, b) => a.checkIn.localeCompare(b.checkIn)),
  };
}

/**
 * Every month from the first stay to the last, plus `todayISO`'s month so
 * the page always has something to open on.
 */
export function calendarMonths<S extends CalendarStay>(stays: S[], todayISO: string): Month<S>[] {
  const keys = [todayISO, ...stays.flatMap((s) => [s.checkIn, s.checkOut])].map((d) => d.slice(0, 7)).sort();
  let [y, m] = keys[0].split("-").map(Number);
  const end = keys[keys.length - 1];

  const months: Month<S>[] = [];
  for (;;) {
    const key = `${y}-${String(m).padStart(2, "0")}`;
    if (key > end) break;
    months.push(monthGrid(y, m - 1, stays));
    if (++m > 12) [y, m] = [y + 1, 1];
  }
  return months;
}
