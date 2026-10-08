import assert from "node:assert/strict";
import test from "node:test";
import { crossPost, diaryTextHtml, dogNames, entryMinutes, listNames, parseDiary, printWidth, VIDEO_MAX_HEIGHT } from "./guests.ts";

test("parseDiary keeps two prints on one entry in markdown order", () => {
  const [day] = parseDiary(
    `## 17 Sep

### 7am

<!-- entry-id: e001 -->

Tiny's morning walk had two very different moods.

![Tiny sniffing a shrub](./tiny/tiny-sniffing.jpg)

![Tiny racing down the path](./tiny/tiny-racing.jpg)`,
    [{ checkIn: "2026-09-13", checkOut: "2026-09-23" }],
    "tiny",
  );

  assert.deepEqual(day.entries[0].media, [
    { src: "./tiny/tiny-sniffing.jpg", alt: "Tiny sniffing a shrub", kind: "photo" },
    { src: "./tiny/tiny-racing.jpg", alt: "Tiny racing down the path", kind: "photo" },
  ]);
});

test("parseDiary treats an .mp4 line as a video", () => {
  const [day] = parseDiary(
    `## 17 Sep

### 7am

<!-- entry-id: e001 -->

Tiny's morning zoomies, on video.

![Tiny doing zoomies in the yard](./tiny/tiny-zoomies.mp4)`,
    [{ checkIn: "2026-09-13", checkOut: "2026-09-23" }],
    "tiny",
  );

  assert.deepEqual(day.entries[0].media, [
    { src: "./tiny/tiny-zoomies.mp4", alt: "Tiny doing zoomies in the yard", kind: "video" },
  ]);
});

test("parseDiary rejects a video mixed with a photo in the same entry", () => {
  assert.throws(
    () =>
      parseDiary(
        `## 17 Sep

### 7am

<!-- entry-id: e001 -->

![Tiny sniffing a shrub](./tiny/tiny-sniffing.jpg)

![Tiny doing zoomies](./tiny/tiny-zoomies.mp4)`,
        [{ checkIn: "2026-09-13", checkOut: "2026-09-23" }],
        "tiny",
      ),
    /mixes a video with other media/,
  );
});

test("parseDiary keeps an entry ID separate from editable time and words", () => {
  const [day] = parseDiary(`## 17 Sep

### 8:30am

<!-- entry-id: e053 -->

Tiny now prefers this sofa.`, [{ checkIn: "2026-09-13", checkOut: "2026-09-23" }], "tiny");

  assert.equal(day.entries[0].id, "e053");
  assert.equal(day.entries[0].time, "8:30am");
  assert.equal(day.entries[0].text, "Tiny now prefers this sofa.");
});

test("parseDiary rejects missing or duplicate entry IDs", () => {
  const stays = [{ checkIn: "2026-09-13", checkOut: "2026-09-23" }];
  assert.throws(() => parseDiary("## 17 Sep\n\n### 8am\n\nTiny naps.", stays, "tiny"), /needs exactly one/);
  assert.throws(() => parseDiary(`## 17 Sep

### 8am

<!-- entry-id: e001 -->

Tiny naps.

### 9am

<!-- entry-id: e001 -->

Tiny wakes.`, stays, "tiny"), /duplicate entry ID/);
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
