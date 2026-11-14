import assert from "node:assert/strict";
import test from "node:test";
import type { Stay } from "./guests.ts";
import {
  entryBlock,
  insertEntry,
  MAX_CLIPS,
  MAX_MEDIA,
  nextId,
  parseDiary,
  resolveDay,
  sanitizeAlt,
  sanitizeText,
  splitFrontmatter,
  type NewEntry,
} from "./diary-file.ts";

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

test("no-time goes under the entry ID and survives the parser", () => {
  assert.equal(entryBlock({ ...ENTRY, noTime: true }, "luna"), "### 3:20pm\n\n<!-- entry-id: e099 -->\n<!-- no-time -->\n\nStole a slipper.");
  const md = insert({ noTime: true });
  const entry = parseDiary(splitFrontmatter(md).body, STAYS, "luna").flatMap((d) => d.entries).find((e) => e.id === "e099")!;
  assert.equal(entry.noTime, true);
  assert.equal(entry.text, "Stole a slipper.");
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

// ---- reading ----

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

test("parseDiary keeps mixed photos and a video in markdown order", () => {
  const [day] = parseDiary(`## 17 Sep

### 7am

<!-- entry-id: e001 -->

![Tiny sniffing a shrub](./tiny/tiny-sniffing.jpg)

![Tiny doing zoomies](./tiny/tiny-zoomies.mp4)

![Tiny on the path](./tiny/tiny-path.jpg)`,
    [{ checkIn: "2026-09-13", checkOut: "2026-09-23" }], "tiny");

  assert.deepEqual(day.entries[0].media, [
    { src: "./tiny/tiny-sniffing.jpg", alt: "Tiny sniffing a shrub", kind: "photo" },
    { src: "./tiny/tiny-zoomies.mp4", alt: "Tiny doing zoomies", kind: "video" },
    { src: "./tiny/tiny-path.jpg", alt: "Tiny on the path", kind: "photo" },
  ]);
});

test("parseDiary accepts one video and three photos", () => {
  const [day] = parseDiary(`## 17 Sep

### 7am

<!-- entry-id: e001 -->

![Zoomies](./tiny/zoomies.mp4)
![First](./tiny/first.jpg)
![Second](./tiny/second.jpg)
![Third](./tiny/third.jpg)`,
    [{ checkIn: "2026-09-13", checkOut: "2026-09-23" }], "tiny");

  assert.deepEqual(day.entries[0].media.map((m) => m.kind), ["video", "photo", "photo", "photo"]);
});

test("parseDiary rejects two videos in the same entry", () => {
  assert.throws(() => parseDiary(`## 17 Sep

### 7am

<!-- entry-id: e001 -->

![First](./tiny/first.mp4)
![Second](./tiny/second.mp4)`,
    [{ checkIn: "2026-09-13", checkOut: "2026-09-23" }], "tiny"),
    /tiny: entry "7am" has 2 videos\. Use at most one/);
});

test("parseDiary rejects five media items, including a video", () => {
  assert.throws(() => parseDiary(`## 17 Sep

### 7am

<!-- entry-id: e001 -->

![Zoomies](./tiny/zoomies.mp4)
![First](./tiny/first.jpg)
![Second](./tiny/second.jpg)
![Third](./tiny/third.jpg)
![Fourth](./tiny/fourth.jpg)`,
    [{ checkIn: "2026-09-13", checkOut: "2026-09-23" }], "tiny"),
    /tiny: entry "7am" has 5 photos and videos\. Use at most four/);
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

test("parseDiary keeps paragraph breaks and a credit", () => {
  const [day] = parseDiary(`## 10 Oct

### 5:55pm

<!-- entry-id: e071 -->
<!-- credit: Music: someone -->

Slid out
the door.

More.`, [{ checkIn: "2026-10-08", checkOut: "2026-10-12" }], "bobbi");

  assert.equal(day.entries[0].text, "Slid out the door.\n\nMore.");
  assert.equal(day.entries[0].credit, "Music: someone");
});

test("parseDiary reads a label and keeps the time for ordering", () => {
  const [day] = parseDiary(`## 10 Oct

### 9:30pm

<!-- entry-id: e075 -->
<!-- label: Throwback -->

Twinning.`, [{ checkIn: "2026-10-08", checkOut: "2026-10-12" }], "bobbi");

  assert.equal(day.entries[0].label, "Throwback");
  assert.equal(day.entries[0].time, "9:30pm");
  assert.equal(day.entries[0].text, "Twinning.");
});

test("parseDiary reads no-time and keeps the time for ordering", () => {
  const [day] = parseDiary(`## 10 Oct

### 9:30pm

<!-- entry-id: e075 -->
<!-- no-time -->

Twinning.`, [{ checkIn: "2026-10-08", checkOut: "2026-10-12" }], "bobbi");

  assert.equal(day.entries[0].noTime, true);
  assert.equal(day.entries[0].time, "9:30pm");
  assert.equal(day.entries[0].text, "Twinning.");
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

// ---- escaping ----

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

// ---- one format, both ways ----

test("an entry written by insertEntry reads back with the same fields", () => {
  const entry: NewEntry = {
    iso: "2026-10-16",
    time: "3:20pm",
    label: "Throwback",
    noTime: true,
    with: ["tiny"],
    text: "First line.\n\nSecond paragraph.",
    images: [
      { alt: "Luna on the sofa", file: "luna-sofa.jpg" },
      { alt: "Luna at the door", file: "luna-door.mp4" },
    ],
    id: "e099",
  };
  const { body } = splitFrontmatter(insertEntry(MD, entry, STAYS, "luna"));
  const read = parseDiary(body, STAYS, "luna").find((d) => d.iso === entry.iso)!.entries.find((e) => e.id === entry.id);
  assert.deepEqual(read, {
    id: "e099",
    time: "3:20pm",
    text: "First line.\n\nSecond paragraph.",
    media: [
      { src: "./luna/luna-sofa.jpg", alt: "Luna on the sofa", kind: "photo" },
      { src: "./luna/luna-door.mp4", alt: "Luna at the door", kind: "video" },
    ],
    with: ["tiny"],
    label: "Throwback",
    noTime: true,
  });
});

test("a heading split across lines isn't a heading", () => {
  const days = parseDiary(
    `## 16 Oct

### 9am

<!-- entry-id: e001 -->

Hashes on their own line:

##
not a day`,
    STAYS,
    "luna",
  );
  assert.equal(days.length, 1);
  assert.match(days[0].entries[0].text, /## not a day/);
});

test("parseDiary enforces the exported media limits", () => {
  const entry = (lines: string[]) => `## 16 Oct\n\n### 9am\n\n<!-- entry-id: e001 -->\n\n${lines.join("\n\n")}`;
  const photos = (n: number) => Array.from({ length: n }, (_, i) => `![p](./luna/p${i}.jpg)`);
  const clips = (n: number) => Array.from({ length: n }, (_, i) => `![v](./luna/v${i}.mp4)`);
  assert.equal(parseDiary(entry(photos(MAX_MEDIA)), STAYS, "luna")[0].entries[0].media.length, MAX_MEDIA);
  assert.throws(() => parseDiary(entry(photos(MAX_MEDIA + 1)), STAYS, "luna"), /at most four/);
  assert.equal(parseDiary(entry(clips(MAX_CLIPS)), STAYS, "luna")[0].entries[0].media.length, MAX_CLIPS);
  assert.throws(() => parseDiary(entry(clips(MAX_CLIPS + 1)), STAYS, "luna"), /at most one/);
});

test("resolveDay finds the year from a stay across New Year", () => {
  const stays: Stay[] = [{ checkIn: "2026-12-28", checkOut: "2027-01-03" }];
  assert.equal(resolveDay("30 Dec", stays, "luna"), "2026-12-30");
  assert.equal(resolveDay("2 Jan", stays, "luna"), "2027-01-02");
});

test("resolveDay rejects a month it doesn't recognise", () => {
  assert.throws(() => resolveDay("16 Oxt", STAYS, "luna"), /no month I recognise/);
  assert.throws(() => resolveDay("Oct 16", STAYS, "luna"), /isn't a date/);
});

test("resolveDay rejects a day outside every stay", () => {
  assert.throws(() => resolveDay("25 Oct", STAYS, "luna"), /falls outside every stay/);
});
