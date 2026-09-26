import assert from "node:assert/strict";
import test from "node:test";
import { dogNames, listNames, parseDiary } from "./guests.ts";

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
