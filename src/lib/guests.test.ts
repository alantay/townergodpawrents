import assert from "node:assert/strict";
import test from "node:test";
import { parseDiary } from "./guests.ts";

test("parseDiary keeps two prints on one entry in markdown order", () => {
  const [day] = parseDiary(
    `## 17 Sep

### 7am

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

![Tiny sniffing a shrub](./tiny/tiny-sniffing.jpg)

![Tiny doing zoomies](./tiny/tiny-zoomies.mp4)`,
        [{ checkIn: "2026-09-13", checkOut: "2026-09-23" }],
        "tiny",
      ),
    /mixes a video with other media/,
  );
});
