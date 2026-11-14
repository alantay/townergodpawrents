import assert from "node:assert/strict";
import test from "node:test";
import { entryMinutes } from "../guests.ts";
import { fallbackAlt, formatTime } from "./format.ts";

test("formatTime writes times the way the diary does", () => {
  assert.equal(formatTime("15:20"), "3:20pm");
  assert.equal(formatTime("15:00"), "3pm");
  assert.equal(formatTime("09:05"), "9:05am");
  assert.equal(formatTime("00:05"), "12:05am");
  assert.equal(formatTime("12:00"), "12pm");
  assert.equal(formatTime("23:59"), "11:59pm");
  assert.equal(formatTime("09:30:00"), "9:30am");
});

test("formatTime rejects anything that isn't HH:MM", () => {
  for (const bad of ["", "24:00", "9:30", "3pm", "12:60", "ab:cd"]) {
    assert.equal(formatTime(bad), undefined, bad);
  }
});

test("formatTime output sorts with entryMinutes", () => {
  assert.equal(entryMinutes(formatTime("15:20")!), 15 * 60 + 20);
  assert.equal(entryMinutes(formatTime("00:05")!), 5);
  assert.equal(entryMinutes(formatTime("12:00")!), 12 * 60);
});

test("fallbackAlt names the dog, day and time", () => {
  assert.equal(fallbackAlt("Luna", "2026-10-16", "3:20pm"), "Luna, 16 Oct 3:20pm");
  assert.equal(fallbackAlt("Luna", "2026-10-16"), "Luna, 16 Oct");
});
