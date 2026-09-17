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

  assert.deepEqual(day.entries[0].photos, [
    { src: "./tiny/tiny-sniffing.jpg", alt: "Tiny sniffing a shrub" },
    { src: "./tiny/tiny-racing.jpg", alt: "Tiny racing down the path" },
  ]);
});
