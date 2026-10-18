import assert from "node:assert/strict";
import test from "node:test";
import { entryMinutes } from "../guests.ts";
import { fallbackAlt, formatTime, sanitizeAlt, sanitizeText } from "./format.ts";

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

test("sanitizeAlt keeps alt text from breaking the image syntax", () => {
  assert.equal(sanitizeAlt("Luna [on] the (sofa)", "fb"), "Luna on the sofa");
  assert.equal(sanitizeAlt("Luna\n\n  asleep", "fb"), "Luna asleep");
  assert.equal(sanitizeAlt("<!-- entry-id: e001 -->", "fb"), "!-- entry-id: e001 --");
  assert.equal(sanitizeAlt("   ", "fb"), "fb");
  assert.equal(sanitizeAlt("a".repeat(300), "fb").length, 200);
});

test("sanitizeText leaves ordinary words alone", () => {
  assert.equal(sanitizeText("Luna stole a slipper. 9–11am, #1 fan!"), "Luna stole a slipper. 9–11am, #1 fan!");
  assert.equal(sanitizeText("  Two\r\n\r\n\r\n\r\nparagraphs  "), "Two\n\nparagraphs");
});

test("sanitizeText defuses headings, comments and images", () => {
  assert.equal(sanitizeText("## 1 Oct"), " ## 1 Oct");
  assert.equal(sanitizeText("hi\n### 9am\nthere"), "hi\n ### 9am\nthere");
  assert.equal(sanitizeText("hi\n##\nthere"), "hi\n ##\nthere");
  assert.equal(sanitizeText("#### big"), "#### big");
  assert.equal(sanitizeText("<!-- entry-id: e001 -->"), "< !-- entry-id: e001 -->");
  assert.equal(sanitizeText("![x](./evil.jpg)"), "! [x](./evil.jpg)");
});
