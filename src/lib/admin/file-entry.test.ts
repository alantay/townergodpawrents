import assert from "node:assert/strict";
import test from "node:test";
import { parseDiary, splitFrontmatter } from "../diary-file.ts";
import { fileEntry } from "./file-entry.ts";

const LUNA = { id: "luna", name: "Luna", stays: [{ checkIn: "2026-10-13", checkOut: "2026-10-21" }] };
const markdowns = {
  luna: "---\nname: Luna\n---\n\n## 16 Oct\n\n### 4pm\n\n<!-- entry-id: e098 -->\n\nNapping.\n",
  guapo: "---\nname: Guapo\n---\n\n## 15 Oct\n\n### 8am\n\n<!-- entry-id: e101 -->\n\nArrived.\n",
};
const entry = { iso: "2026-10-16", time: "3:20pm", with: ["guapo"], text: "Luna stole Weiwen's slipper." };

test("files photos and a clip in order, with free names, a global ID and the admin message", () => {
  const filed = fileEntry(entry, LUNA, [
    { alt: "Luna sitting", video: false },
    { alt: "Luna running", video: true },
    { alt: "Luna asleep", video: false },
  ], markdowns, new Set(["luna-stole-weiwen-slipper.jpg"]));
  assert.deepEqual(filed.media.map((m) => m.file), [
    "luna-stole-weiwen-slipper-2.jpg",
    "luna-stole-weiwen-slipper.mp4",
    "luna-stole-weiwen-slipper-3.jpg",
  ]);
  assert.equal(filed.message, "Add Luna 3:20pm stole weiwen slipper entry (via admin)");
  const days = parseDiary(splitFrontmatter(filed.markdown).body, LUNA.stays, "luna");
  const added = days[0].entries.find((e) => e.id === "e102")!;
  assert.deepEqual(added.media.map((m) => [m.alt, m.kind]), [["Luna sitting", "photo"], ["Luna running", "video"], ["Luna asleep", "photo"]]);
  assert.deepEqual(added.with, ["guapo"]);
});

test("words-only entries file with no media", () => {
  const filed = fileEntry({ ...entry, with: [], label: "Thoughts" }, LUNA, [], markdowns, new Set());
  assert.deepEqual(filed.media, []);
  assert.match(filed.markdown, /<!-- label: Thoughts -->/);
  assert.doesNotMatch(filed.markdown, /!\[/);
});

test("alt text is cleaned, falling back to the dog's name", () => {
  const filed = fileEntry(entry, LUNA, [{ alt: "[]()", video: false }, { alt: " Luna  <b>dozing</b> ", video: false }], markdowns, new Set());
  assert.deepEqual(filed.media.map((m) => m.alt), ["Luna", "Luna bdozing/b"]);
});
