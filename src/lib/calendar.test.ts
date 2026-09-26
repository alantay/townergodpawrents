import assert from "node:assert/strict";
import test from "node:test";
import { calendarMonths, monthGrid } from "./calendar.ts";

test("monthGrid starts weeks on Monday and pads with the neighbouring months", () => {
  const sep = monthGrid(2026, 8, []);
  assert.equal(sep.name, "September");
  // 1 Sep 2026 is a Tuesday, so the first row opens on Monday 31 Aug.
  assert.deepEqual(sep.weeks[0].days[0], { iso: "2026-08-31", day: 31, inMonth: false });
  assert.equal(sep.weeks[0].days[1].iso, "2026-09-01");
  assert.equal(sep.weeks.at(-1)!.days.at(-1)!.iso, "2026-10-04");
});

test("monthGrid splits a stay across week rows and marks the continuation", () => {
  const stay = { guestId: "suki", checkIn: "2026-09-25", checkOut: "2026-09-28" };
  const sep = monthGrid(2026, 8, [stay]);
  const [first, rest] = sep.weeks.flatMap((w) => w.segments);
  assert.deepEqual(first, { stay, startCol: 4, span: 3, lane: 0, continued: false });
  assert.deepEqual(rest, { stay, startCol: 0, span: 1, lane: 0, continued: true });
});

test("monthGrid stacks overlapping stays in separate lanes and reuses free ones", () => {
  const mochi = { guestId: "mochi", checkIn: "2026-09-09", checkOut: "2026-09-13" };
  const kopi = { guestId: "kopi", checkIn: "2026-09-10", checkOut: "2026-09-11" };
  const bao = { guestId: "bao", checkIn: "2026-09-12", checkOut: "2026-09-13" };
  const week = monthGrid(2026, 8, [bao, kopi, mochi]).weeks[1];
  assert.deepEqual(
    week.segments.map((s) => [s.stay.guestId, s.lane]),
    [["mochi", 0], ["kopi", 1], ["bao", 1]],
  );
  assert.equal(week.lanes, 2);
});

test("calendarMonths runs from the first stay to a year past today, with no gaps", () => {
  const months = calendarMonths(
    [{ guestId: "luna", checkIn: "2026-07-13", checkOut: "2026-08-02" }],
    "2026-09-26",
  );
  assert.equal(months[0].key, "2026-07");
  assert.equal(months.at(-1)!.key, "2027-09");
  assert.equal(months.length, 15);
  assert.equal(months[2].stays.length, 0);
});

test("calendarMonths reaches an upcoming stay more than a year out", () => {
  const months = calendarMonths(
    [{ guestId: "luna", checkIn: "2027-12-20", checkOut: "2028-01-03" }],
    "2026-09-26",
  );
  assert.equal(months[0].key, "2026-09");
  assert.equal(months.at(-1)!.key, "2028-01");
});
