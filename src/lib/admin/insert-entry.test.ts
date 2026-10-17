import assert from "node:assert/strict";
import test from "node:test";
import { parseDiary, type Stay } from "../guests.ts";
import { sanitizeText } from "./format.ts";
import { entryBlock, insertEntry, nextId, splitFrontmatter, type NewEntry } from "./insert-entry.ts";

const STAYS: Stay[] = [{ checkIn: "2026-10-13", checkOut: "2026-10-21" }];
const FRONT = `---
name: Luna
stays:
  - checkIn: 2026-10-13
    checkOut: 2026-10-21
---`;
const MD = `${FRONT}

## 16 Oct

### 9:45pm

<!-- entry-id: e098 -->

Supervising from the doorway.

### 12:40pm

<!-- entry-id: e097 -->

Begging for food.

## 14 Oct

### 8am

<!-- entry-id: e090 -->
<!-- label: Throwback -->

![Luna on the sofa](./luna/luna-sofa.jpg)
`;

const ENTRY: NewEntry = { iso: "2026-10-16", time: "3:20pm", with: [], text: "Stole a slipper.", images: [], id: "e099" };
const BLOCK = "### 3:20pm\n\n<!-- entry-id: e099 -->\n\nStole a slipper.";

function insert(over: Partial<NewEntry>, md = MD) {
  return insertEntry(md, { ...ENTRY, ...over }, STAYS, "luna");
}

/** Entry times in file order, day by day, straight from the real parser. */
function shape(md: string) {
  return parseDiary(splitFrontmatter(md).body, STAYS, "luna").map((d) => `${d.label}: ${d.entries.map((e) => e.time).join(", ")}`);
}

test("splitFrontmatter separates the YAML from the diary", () => {
  const { frontmatter, body } = splitFrontmatter(MD);
  assert.equal(frontmatter, FRONT);
  assert.ok(body.startsWith("\n\n## 16 Oct"));
  assert.throws(() => splitFrontmatter("## 16 Oct\n"));
});

test("nextId is one past the highest ID in any guest file", () => {
  assert.equal(nextId([MD, "<!-- entry-id: e081 -->"]), "e099");
  assert.equal(nextId(["<!-- entry-id: e009 -->", `${FRONT}\n`]), "e010");
  assert.equal(nextId([`${FRONT}\n`]), "e001");
});

test("entryBlock writes comments in order, then words, then photos", () => {
  assert.equal(
    entryBlock({ ...ENTRY, with: ["guapo", "bobbi"], label: "Thoughts", images: [{ alt: "Luna", file: "luna-a.jpg" }, { alt: "Guapo", file: "luna-b.jpg" }] }, "luna"),
    "### 3:20pm\n\n<!-- entry-id: e099 -->\n<!-- with: guapo, bobbi -->\n<!-- label: Thoughts -->\n\nStole a slipper.\n\n![Luna](./luna/luna-a.jpg)\n\n![Guapo](./luna/luna-b.jpg)",
  );
  assert.equal(entryBlock({ ...ENTRY, text: "", images: [{ alt: "Luna", file: "luna-a.jpg" }] }, "luna"),
    "### 3:20pm\n\n<!-- entry-id: e099 -->\n\n![Luna](./luna/luna-a.jpg)");
});

test("a new entry lands in time order within its day", () => {
  assert.deepEqual(shape(insert({ time: "10pm" })), ["16 Oct: 10pm, 9:45pm, 12:40pm", "14 Oct: 8am"]);
  assert.deepEqual(shape(insert({})), ["16 Oct: 9:45pm, 3:20pm, 12:40pm", "14 Oct: 8am"]);
  assert.deepEqual(shape(insert({ time: "9am" })), ["16 Oct: 9:45pm, 12:40pm, 9am", "14 Oct: 8am"]);
  assert.deepEqual(shape(insert({ iso: "2026-10-14", time: "7am" })), ["16 Oct: 9:45pm, 12:40pm", "14 Oct: 8am, 7am"]);
});

test("a new day goes in date order, newest first", () => {
  assert.deepEqual(shape(insert({ iso: "2026-10-17" })), ["17 Oct: 3:20pm", "16 Oct: 9:45pm, 12:40pm", "14 Oct: 8am"]);
  assert.deepEqual(shape(insert({ iso: "2026-10-15" })), ["16 Oct: 9:45pm, 12:40pm", "15 Oct: 3:20pm", "14 Oct: 8am"]);
  assert.deepEqual(shape(insert({ iso: "2026-10-13" })), ["16 Oct: 9:45pm, 12:40pm", "14 Oct: 8am", "13 Oct: 3:20pm"]);
});

test("everything else in the file stays byte for byte", () => {
  const block = (time: string) => BLOCK.replace("3:20pm", time);
  assert.equal(insert({ time: "10pm" }).replace(`${block("10pm")}\n\n`, ""), MD);
  assert.equal(insert({}).replace(`${BLOCK}\n\n`, ""), MD);
  assert.equal(insert({ time: "9am" }).replace(`${block("9am")}\n\n`, ""), MD);
  assert.equal(insert({ iso: "2026-10-17" }).replace(`## 17 Oct\n\n${BLOCK}\n\n`, ""), MD);
  assert.equal(insert({ iso: "2026-10-13" }), `${MD}\n## 13 Oct\n\n${BLOCK}\n`);
});

test("a guest with no diary yet gets their first day", () => {
  assert.equal(insert({}, `${FRONT}\n`), `${FRONT}\n\n## 16 Oct\n\n${BLOCK}\n`);
});

test("photos, with and label survive a trip through the parser", () => {
  const md = insert({ with: ["guapo"], label: "Fun fact", images: [{ alt: "Luna with a slipper", file: "luna-stole-slipper.jpg" }] });
  const entry = parseDiary(splitFrontmatter(md).body, STAYS, "luna")[0].entries[1];
  assert.deepEqual(
    { id: entry.id, with: entry.with, label: entry.label, text: entry.text, media: entry.media },
    { id: "e099", with: ["guapo"], label: "Fun fact", text: "Stole a slipper.", media: [{ src: "./luna/luna-stole-slipper.jpg", alt: "Luna with a slipper", kind: "photo" }] },
  );
});

test("hostile words stay words", () => {
  const text = sanitizeText("## 1 Oct\n###\n### 9am\n<!-- entry-id: e001 -->\n![x](./evil.jpg)\nthe end");
  const md = insert({ text });
  assert.deepEqual(shape(md), ["16 Oct: 9:45pm, 3:20pm, 12:40pm", "14 Oct: 8am"]);
  const entry = parseDiary(splitFrontmatter(md).body, STAYS, "luna")[0].entries[1];
  assert.equal(entry.id, "e099");
  assert.deepEqual(entry.media, []);
});
