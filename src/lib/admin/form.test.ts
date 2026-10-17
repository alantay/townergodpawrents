import assert from "node:assert/strict";
import test from "node:test";
import { dogsOn, nowSGT } from "./form.ts";

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
