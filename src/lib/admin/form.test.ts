import assert from "node:assert/strict";
import test from "node:test";
import { dogsOn, draftWhen, nowSGT } from "./form.ts";

const GUESTS = [
  { id: "luna", name: "Luna", stays: [{ checkIn: "2026-10-13", checkOut: "2026-10-21" }] },
  { id: "guapo", name: "Guapo", stays: [{ checkIn: "2026-10-15", checkOut: "2026-10-18" }] },
];

test("dogsOn keeps dogs staying that day, check-in and check-out days included", () => {
  assert.deepEqual(dogsOn(GUESTS, "2026-10-16").map((g) => g.id), ["luna", "guapo"]);
  assert.deepEqual(dogsOn(GUESTS, "2026-10-13").map((g) => g.id), ["luna"]);
  assert.deepEqual(dogsOn(GUESTS, "2026-10-18").map((g) => g.id), ["luna", "guapo"]);
  assert.deepEqual(dogsOn(GUESTS, "2026-10-22"), []);
});

test("nowSGT is Singapore time, rolling over midnight", () => {
  assert.deepEqual(nowSGT(new Date("2026-10-16T07:20:00Z")), { iso: "2026-10-16", time: "15:20" });
  assert.deepEqual(nowSGT(new Date("2026-10-16T16:30:00Z")), { iso: "2026-10-17", time: "00:30" });
});

test("draftWhen keeps a recent unsent draft's day and time", () => {
  const now = new Date("2026-10-17T02:00:00Z"); // 10am SGT
  const draft = { iso: "2026-10-16", time: "21:40", text: "zoomies", savedAt: now.getTime() - 3 * 60 * 60 * 1000 };
  assert.deepEqual(draftWhen(draft, now), { iso: "2026-10-16", time: "21:40" });
});

test("draftWhen falls back to now for an old draft, an empty one, or one with no savedAt", () => {
  const now = new Date("2026-10-17T02:00:00Z");
  const fresh = { iso: "2026-10-17", time: "10:00" };
  const old = { iso: "2026-10-12", time: "08:00", text: "zoomies", savedAt: now.getTime() - 7 * 60 * 60 * 1000 };
  assert.deepEqual(draftWhen(old, now), fresh);
  assert.deepEqual(draftWhen({ ...old, text: "", savedAt: now.getTime() }, now), fresh);
  assert.deepEqual(draftWhen({ iso: "2026-10-12", time: "08:00", text: "zoomies" }, now), fresh);
  assert.deepEqual(draftWhen({}, now), fresh);
});
