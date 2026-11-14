import assert from "node:assert/strict";
import test from "node:test";
import { atHome, creditHtml, crossPost, diaryTextHtml, dogNames, entryMinutes, listNames, printWidth, stayLabel, VIDEO_MAX_HEIGHT } from "./guests.ts";
import { parseDiary } from "./diary-file.ts";

test("stayLabel adds diary years without changing compact labels", () => {
  const stay = { checkIn: "2026-09-13", checkOut: "2026-09-23" };
  assert.equal(stayLabel(stay), "13–23 Sep");
  assert.equal(stayLabel(stay, true), "13–23 Sep 2026");
  assert.equal(stayLabel({ checkIn: "2026-10-14", checkOut: "2026-10-14" }, true), "14 Oct 2026");
  assert.equal(stayLabel({ checkIn: "2026-12-30", checkOut: "2027-01-02" }, true), "30 Dec 2026 – 2 Jan 2027");
});

test("dogNames splits dogs from one home and leaves a single dog alone", () => {
  assert.deepEqual(dogNames("Hugo & Luffy"), ["Hugo", "Luffy"]);
  assert.deepEqual(dogNames("Milk"), ["Milk"]);
});

test("listNames joins dogs with commas and a final ampersand", () => {
  assert.equal(listNames(["Luna"]), "Luna");
  assert.equal(listNames(["Luna", "Milk"]), "Luna & Milk");
  assert.equal(listNames(["Luna", "Hugo", "Luffy"]), "Luna, Hugo & Luffy");
});

test("diary captions strike words while escaping authored HTML", () => {
  assert.equal(diaryTextHtml("Post breakfast ~~nap~~ coma."), "Post breakfast <del>nap</del> coma.");
  assert.equal(diaryTextHtml("<script> & ~~<b>nap</b>~~"), "&lt;script&gt; &amp; <del>&lt;b&gt;nap&lt;/b&gt;</del>");
  assert.equal(diaryTextHtml("An unfinished ~~nap"), "An unfinished ~~nap");
});

test("credits link to sources while escaping authored HTML", () => {
  assert.equal(creditHtml("Sound: [Ann](https://x.org/a?b=1&c=2), CC BY"), 'Sound: <a href="https://x.org/a?b=1&amp;c=2" class="credit-link">Ann</a>, CC BY');
  assert.equal(creditHtml("[x](javascript:alert(1)) <b>"), "[x](javascript:alert(1)) &lt;b&gt;");
});

test("entryMinutes orders entry times across noon and midnight", () => {
  assert.equal(entryMinutes("12am"), 0);
  assert.equal(entryMinutes("8am"), 480);
  assert.equal(entryMinutes("12:15pm"), 735);
  assert.equal(entryMinutes("9:30pm"), 1290);
  assert.equal(entryMinutes("10:20PM"), 1340);
  assert.equal(entryMinutes("teatime"), -1);
});

test("crossPost copies a shared entry into the other guest's day in time order", () => {
  const stays = [{ checkIn: "2026-10-08", checkOut: "2026-10-12" }];
  const guapo = {
    id: "guapo",
    stays,
    days: parseDiary(`## 9 Oct\n\n### 9pm\n\n<!-- entry-id: e100 -->\n\n<!-- with: bobbi -->\n\nSofa truce.`, stays, "guapo"),
  };
  const bobbi = {
    id: "bobbi",
    stays,
    days: parseDiary(`## 9 Oct\n\n### 10pm\n\n<!-- entry-id: e101 -->\n\nLate.\n\n### 8am\n\n<!-- entry-id: e102 -->\n\nEarly.`, stays, "bobbi"),
  };
  assert.deepEqual(guapo.days[0].entries[0].with, ["bobbi"]);
  assert.equal(guapo.days[0].entries[0].text, "Sofa truce.");

  crossPost([guapo, bobbi]);

  assert.deepEqual(bobbi.days[0].entries.map((e) => e.id), ["e101", "e100", "e102"]);
  assert.equal(bobbi.days[0].entries[1].from, "guapo");
  assert.deepEqual(bobbi.days[0].entries[1].with, ["guapo"]);
  assert.equal(guapo.days[0].entries.length, 1);
});

test("crossPost refuses a day outside the other guest's stays", () => {
  const guapo = {
    id: "guapo",
    stays: [{ checkIn: "2026-10-01", checkOut: "2026-10-12" }],
    days: parseDiary(`## 2 Oct\n\n### 9pm\n\n<!-- entry-id: e100 -->\n<!-- with: bobbi -->\nHi`, [{ checkIn: "2026-10-01", checkOut: "2026-10-12" }], "guapo"),
  };
  const bobbi = { id: "bobbi", stays: [{ checkIn: "2026-10-08", checkOut: "2026-10-12" }], days: [] };
  assert.throws(() => crossPost([guapo, bobbi]), /isn't in any of bobbi's stays/);
});

test("a 9:16 phone video prints as wide as a 3:4 photo", () => {
  assert.equal(printWidth(1080, 1920, VIDEO_MAX_HEIGHT), printWidth(1200, 1600));
});

test("atHome says whose home a drop-in stay is at", () => {
  assert.equal(atHome("female"), "at hers");
  assert.equal(atHome("male"), "at his");
  assert.equal(atHome(undefined), "at home");
});
