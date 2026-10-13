import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { runInNewContext } from "node:vm";
import { groupHeroColor } from "./group-hero-color.ts";
import { diaryTextHtml, SOFA_GREEN } from "./guests.ts";

const source = readFileSync(new URL("../pages/index.astro", import.meta.url), "utf8");
const render = runInNewContext(
  source.slice(source.indexOf("function entryCardsHTML("), source.indexOf("function pastPreviewHTML(")) + "\nentryCardsHTML",
  {
    dayOn: (guest: { entries: unknown[] }) => ({ entries: guest.entries }),
    esc: (value: string) => value.replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll('"', "&quot;"),
    guestSkins: (base: string) => [{}, { bg: base, fg: "#fff", accent: "#fff" }],
    groupHeroColor,
    diaryTextHtml,
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

test("an individual homepage entry also has a name link and a plain timestamp", () => {
  const html = render([{
    id: "bobbi", name: "Bobbi", bgColor: "#fff",
    entries: [{ id: "e071", time: "5:55pm", mins: 1075, text: "Door prank.", media: [], withGuests: [] }],
  }], "2026-10-10");
  assert.ok(html.includes('href="/guests/bobbi#entry-e071" class="diary-guest-link"'));
  assert.ok(html.includes(">5:55pm · <a "));
  assert.ok(html.includes("Bobbi&rsquo;s full diary"));
});

test("a labelled homepage entry shows its label, not its time", () => {
  const html = render([{
    id: "bobbi", name: "Bobbi", bgColor: "#fff",
    entries: [{ id: "e075", time: "9:30pm", label: "Throwback", mins: 1290, text: "Twinning.", media: [], withGuests: [] }],
  }], "2026-10-11");
  assert.ok(html.includes(">Throwback · <a "));
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
