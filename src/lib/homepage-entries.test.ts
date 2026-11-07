import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { runInNewContext } from "node:vm";
import { groupHeroColor } from "./group-hero-color.ts";
import { creditHtml, diaryTextHtml, fitsPrintMat, noteTilt, printTilt, printWidth, SOFA_GREEN, VIDEO_MAX_HEIGHT, videoNoteTilt } from "./guests.ts";

const source = readFileSync(new URL("../pages/index.astro", import.meta.url), "utf8");
const render = runInNewContext(
  source.slice(source.indexOf("function entryCardsHTML("), source.indexOf("function pastPreviewHTML(")) + "\nentryCardsHTML",
  {
    dayOn: (guest: { entries: unknown[] }) => ({ entries: guest.entries }),
    esc: (value: string) => value.replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll('"', "&quot;"),
    guestSkins: (base: string) => [{}, { bg: base, fg: "#fff", accent: "#fff" }],
    groupHeroColor,
    diaryTextHtml,
    creditHtml,
    fitsPrintMat,
    noteTilt,
    printTilt,
    printWidth,
    VIDEO_MAX_HEIGHT,
    videoNoteTilt,
    skin: () => ({ bg: "#fff", fg: "#000", accent: "#000" }),
    luma: () => 100,
    tilt: () => 0,
    isNew: () => false,
    DAYS: ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"],
  },
);

test("homepage names link to each participant's copy of a shared moment", () => {
  const moment = {
    id: "e070", time: "2:48pm", mins: 888, text: "Sleeping positions.",
    media: [], withGuests: [{ id: "guapo", name: "Guapo" }],
  };
  const bobbi = { id: "bobbi", name: "Bobbi", bgColor: "#fff", entries: [moment] };
  const guapo = {
    id: "guapo", name: "Guapo", bgColor: "#fff",
    entries: [{ ...moment, from: "bobbi", withGuests: [{ id: "bobbi", name: "Bobbi" }] }],
  };
  for (const live of [[bobbi, guapo], [guapo]]) {
    const html = render(live, "2026-10-10");
    assert.equal((html.match(/class="diary-guest-link"/g) ?? []).length, 2);
    for (const id of ["bobbi", "guapo"]) {
      assert.ok(html.includes('href="/guests/' + id + '#entry-e070"'));
    }
    assert.ok(html.includes('<entry-reactions data-guest="bobbi" data-entry="e070"'));
    assert.ok(!html.includes("diary-entry-link"));
  }
});

test("a lone guest's own entry shows just its time, no name", () => {
  const html = render([{
    id: "bobbi", name: "Bobbi", bgColor: "#fff",
    entries: [{ id: "e071", time: "5:55pm", mins: 1075, text: "Door prank.", media: [], withGuests: [] }],
  }], "2026-10-10");
  assert.ok(!html.includes("diary-guest-link"));
  assert.ok(html.includes(">5:55pm<"));
  assert.ok(html.includes("Bobbi&rsquo;s full diary"));
});

test("on a two-guest day each entry names its dog", () => {
  const entry = { id: "e071", time: "5:55pm", mins: 1075, text: "Door prank.", media: [], withGuests: [] };
  const html = render([
    { id: "bobbi", name: "Bobbi", bgColor: "#fff", entries: [entry] },
    { id: "guapo", name: "Guapo", bgColor: "#fff", entries: [] },
  ], "2026-10-10");
  assert.ok(html.includes('href="/guests/bobbi#entry-e071" class="diary-guest-link"'));
  assert.ok(html.includes(">5:55pm · <a "));
});

test("a labelled homepage entry shows its label, not its time", () => {
  const html = render([{
    id: "bobbi", name: "Bobbi", bgColor: "#fff",
    entries: [{ id: "e075", time: "9:30pm", label: "Throwback", mins: 1290, text: "Twinning.", media: [], withGuests: [] }],
  }], "2026-10-11");
  assert.ok(html.includes(">Throwback<"));
  assert.ok(!html.includes("9:30pm"));
});

test("a no-time entry from a lone guest shows neither time nor name", () => {
  const html = render([{
    id: "bobbi", name: "Bobbi", bgColor: "#fff",
    entries: [{ id: "e075", time: "9:30pm", noTime: true, mins: 1290, text: "Twinning.", media: [], withGuests: [] }],
  }], "2026-10-11");
  assert.ok(!html.includes("diary-guest-link"));
  assert.ok(!html.includes("9:30pm"));
});

test("a shared homepage entry wears its dogs' group colour", () => {
  const shared = (other: { id: string; name: string; bgColor: string }) => ({
    id: "e080", time: "9:00am", mins: 540, text: "Both.", media: [], withGuests: [other],
  });
  const guapo = { id: "guapo", name: "Guapo", bgColor: "#3F6655" };
  const withBobbi = render([{ ...guapo, entries: [shared({ id: "bobbi", name: "Bobbi", bgColor: "#8E4A5C" })] }], "2026-10-10");
  assert.ok(withBobbi.includes("background:" + SOFA_GREEN));
  const withLuna = render([{ ...guapo, entries: [shared({ id: "luna", name: "Luna", bgColor: "#755A83" })] }], "2026-10-29");
  assert.ok(withLuna.includes("background:#A34A2E"));
});

test("homepage mixed entries keep every item, with only photos opening zoom", () => {
  const photo = (src: string, width = 1200, height = 800) => ({
    kind: "photo", src, alt: 'Tiny "resting" & watching', width, height,
  });
  const video = { kind: "video", src: '/zoomies.mp4?x=1&y=2', poster: '/poster".jpg', alt: "", width: 1080, height: 1920 };
  const first = photo("/first.jpg");
  const second = photo("/second.jpg");
  const third = photo("/third.jpg");
  for (const media of [
    [video, first], [first, video],
    [video, first, second], [first, video, second],
    [video, first, second, third], [first, video, second, third],
  ]) {
    const html = render([{
      id: "tiny", name: 'Tiny & friends', bgColor: "#fff",
      entries: [{ id: "e090", time: "7am", mins: 420, text: "Morning.", media, withGuests: [] }],
    }], "2026-09-17");
    const tags = [...html.matchAll(/<(img|video)\b[^>]*>/g)].map((match) => match[0]);
    assert.equal(tags.length, media.length);
    media.forEach((item, index) => {
      assert.ok(tags[index].startsWith(item.kind === "video" ? "<video " : "<img "));
      assert.ok(tags[index].includes('src="' + item.src.replaceAll("&", "&amp;") + '"'));
    });
    assert.equal((html.match(/<video\b/g) ?? []).length, 1);
    const clip = tags.find((tag) => tag.startsWith("<video "))!;
    assert.match(clip, /controls playsinline preload="metadata"/);
    assert.ok(clip.includes('poster="/poster&quot;.jpg"'));
    assert.ok(clip.includes('aria-label="Tiny &amp; friends, 7am"'));
    assert.ok(html.includes('alt="Tiny &quot;resting&quot; &amp; watching"'));
    const buttons = [...html.matchAll(/<button\b[^>]*>([\s\S]*?)<\/button>/g)];
    assert.equal(buttons.length, media.length - 1);
    buttons.forEach(([button]) => {
      assert.ok(button.includes("diary-print-tap"));
      assert.ok(button.includes("<img "));
      assert.ok(!button.includes("<video "));
    });
    assert.ok(html.includes("diary-entry-card--video"));
    assert.equal((html.match(/class="diary-slip /g) ?? []).length, 1);
    assert.ok(!html.includes("print-caption"));
    assert.ok(html.includes('<div class="diary-print" style="width:min(100%,' + printWidth(video.width, video.height, VIDEO_MAX_HEIGHT) + 'px)"><video'));
    assert.ok(html.includes('style="transform:rotate(' + videoNoteTilt(0) + ')"><div class="diary-slip-paper"'));
    assert.equal(html.includes("diary-prints--pair"), media.length === 2);
    assert.equal(html.includes("diary-prints--mixed"), media.length === 2);
    assert.equal(html.includes("diary-prints--quad"), media.length === 4);
  }
});

test("homepage single clips and photo entries keep their caption layouts", () => {
  const clip = { kind: "video", src: "/clip.mp4", poster: "/clip.jpg", alt: "Tiny running", width: 1080, height: 1920 };
  const photo = { kind: "photo", src: "/photo.jpg", alt: "Tiny resting", width: 1200, height: 800 };
  const entryHTML = (media: object[]) => render([{
    id: "tiny", name: "Tiny", bgColor: "#fff",
    entries: [{ id: "e091", time: "7am", mins: 420, text: "Morning.", media, withGuests: [] }],
  }], "2026-09-17");
  const singleClip = entryHTML([clip]);
  assert.match(singleClip, /<video[^>]* playsinline/);
  assert.ok(!singleClip.includes("diary-prints"));
  assert.equal((singleClip.match(/class="diary-slip /g) ?? []).length, 1);
  assert.ok(singleClip.includes('style="width:min(100%,' + Math.min(printWidth(clip.width, clip.height, VIDEO_MAX_HEIGHT) + 120, 500) + 'px);transform:rotate('));
  const singlePhoto = entryHTML([photo]);
  assert.ok(singlePhoto.includes('class="print-caption"'));
  assert.ok(!singlePhoto.includes("diary-slip"));
  assert.ok(!singlePhoto.includes("diary-entry-card--video"));
  const photoPair = entryHTML([photo, { ...photo, src: "/second.jpg" }]);
  assert.ok(photoPair.includes("diary-prints--pair"));
  assert.ok(!photoPair.includes("diary-prints--mixed"));
  assert.equal((photoPair.match(/class="diary-slip /g) ?? []).length, 1);
  assert.ok(!photoPair.includes("<video"));
});
