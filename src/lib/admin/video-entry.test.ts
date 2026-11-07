import assert from "node:assert/strict";
import test from "node:test";
import { parseDiary } from "../guests.ts";
import { splitFrontmatter } from "./insert-entry.ts";
import { buildVideoEntry, videoPayload, type VideoPayload } from "./video-entry.ts";

const payload: VideoPayload = {
  guest: "luna", iso: "2026-10-16", time: "3:20pm", with: ["guapo"], text: "Luna stole slippers.",
  media: [{ url: "https://test.public.blob.vercel-storage.com/admin-video/clip.mp4", alt: "Luna with slippers" }], postKey: "test-12345678",
};
const BLOB = "https://test.public.blob.vercel-storage.com/admin-video/";
const markdowns = {
  luna: '---\nname: "Luna"\nstays:\n  - checkIn: 2026-10-13\n    checkOut: 2026-10-21\n---\n\n## 16 Oct\n\n### 4pm\n\n<!-- entry-id: e098 -->\n\nNapping.\n',
  guapo: "---\nname: Guapo\nstays:\n  - checkIn: '2026-10-15'\n    checkOut: '2026-10-18'\n---\n\n## 15 Oct\n\n### 8am\n\n<!-- entry-id: e101 -->\n\nArrived.\n",
};

test("video filing uses YAML dates, global IDs, deduped names and the shared parser", () => {
  const entry = buildVideoEntry(payload, markdowns, new Set(["luna-stole-slippers.mp4"]));
  assert.equal(entry.media[0].file, "luna-stole-slippers-2.mp4");
  assert.equal(entry.slug, "stole-slippers-2");
  assert.equal(entry.message, "Add Luna 3:20pm stole slippers entry (via admin)");
  const days = parseDiary(splitFrontmatter(entry.markdown).body, [{ checkIn: "2026-10-13", checkOut: "2026-10-21" }], "luna");
  assert.deepEqual(days[0].entries.map((e) => e.id), ["e098", "e102"]);
  assert.match(entry.markdown, /!\[Luna with slippers\]\(\.\/luna\/luna-stole-slippers-2.mp4\)/);
  assert.match(entry.markdown, /<!-- with: guapo -->/);
});

test("video-only entries, labels and midnight still file normally", () => {
  const entry = buildVideoEntry({ ...payload, text: "", time: "12am", noTime: true }, markdowns, new Set());
  assert.equal(entry.media[0].file, "luna-photo.mp4");
  assert.match(entry.markdown, /### 12am/);
  assert.match(entry.markdown, /<!-- no-time -->/);
  const labelled = buildVideoEntry({ ...payload, label: "Thoughts", time: "12:15pm" }, markdowns, new Set());
  assert.match(labelled.markdown, /### 12:15pm/);
  assert.match(labelled.markdown, /<!-- label: Thoughts -->/);
});

test("Action inputs are checked again before writing", () => {
  assert.throws(() => buildVideoEntry({ ...payload, iso: "2026-10-30" }, markdowns, new Set()), /Pick a day/);
  assert.throws(() => buildVideoEntry({ ...payload, guest: "missing" }, markdowns, new Set()), /Pick a dog/);
  for (const bad of [{ guest: "../luna" }, { time: "25:00" }, { postKey: "short" },
    { media: [{ url: "https://evil.test/clip.mp4", alt: "x" }] },
    { media: [{ url: `${BLOB}a.jpg`, alt: "x" }] },
    { media: [payload.media[0], payload.media[0]] },
    { media: [] }]) {
    assert.equal(videoPayload.safeParse({ ...payload, ...bad }).success, false);
  }
});

test("photos posted with a clip file in the order they were added", () => {
  const media = [{ url: `${BLOB}k-1.jpg`, alt: "Luna sitting" }, payload.media[0], { url: `${BLOB}k-2.jpg`, alt: "Luna asleep" }];
  const entry = buildVideoEntry({ ...payload, media }, markdowns, new Set());
  assert.deepEqual(entry.media.map((m) => [m.url, m.video]), [[media[0].url, false], [media[1].url, true], [media[2].url, false]]);
  const files = entry.media.map((m) => m.file);
  assert.equal(new Set(files).size, 3);
  assert.ok(files[1].endsWith(".mp4") && files[0].endsWith(".jpg") && files[2].endsWith(".jpg"));
  const order = files.map((f) => entry.markdown.indexOf(f));
  assert.ok(order[0] < order[1] && order[1] < order[2]);
});
