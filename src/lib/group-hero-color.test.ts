import assert from "node:assert/strict";
import test from "node:test";
import { groupHeroColor } from "./group-hero-color.ts";

const guestColours: Record<string, string> = {
  guapo: "#3F6655", bobbi: "#8E4A5C", luna: "#755A83", tiny: "#39617E",
  tyrion: "#A34A2E", "hugo-and-luffy": "#7A5C24", milk: "#8E4A5C", ebi: "#A34A2E",
};
const guestsFor = (ids: string[]) => ids.map((id) => ({ id, bgColor: guestColours[id] }));
const colourFor = (ids: string[]) => groupHeroColor(guestsFor(ids), "2026-10-13");

test("Guapo and Luna keep their distinct rust shade from the rollout onward", () => {
  assert.equal(colourFor(["luna", "guapo"]), "#A34A2E");
  assert.equal(groupHeroColor(guestsFor(["guapo", "luna"]), "2027-01-01"), "#A34A2E");
  assert.equal(groupHeroColor(guestsFor(["guapo", "luna"]), "2026-10-12"), "#5F6E4F");
});

test("past days keep Sofa Green and the palette starts on 13 October", () => {
  assert.equal(groupHeroColor(guestsFor(["guapo", "bobbi"]), "2026-10-12"), "#5F6E4F");
  assert.equal(groupHeroColor(guestsFor(["guapo", "luna"]), "2026-09-30"), "#5F6E4F");
  assert.notEqual(groupHeroColor(guestsFor(["guapo", "bobbi"]), "2026-10-13"), "#5F6E4F");
  assert.equal(groupHeroColor(guestsFor(["bobbi", "guapo"]), "2027-01-01"), colourFor(["guapo", "bobbi"]));
});

test("a returning combination keeps its colour regardless of ordering or duplicates", () => {
  const firstStay = colourFor(["guapo", "bobbi"]);
  assert.equal(colourFor(["bobbi", "guapo"]), firstStay);
  assert.equal(colourFor(["guapo", "bobbi", "guapo"]), firstStay);
  assert.equal(colourFor(["luna", "bobbi", "guapo"]), colourFor(["guapo", "luna", "bobbi"]));
});

test("real guest combinations vary and every selectable shade has readable cream text", () => {
  const ids = ["guapo", "bobbi", "luna", "tiny", "tyrion", "hugo-and-luffy", "milk", "ebi"];
  const colours = new Set<string>();
  const luminance = (hex: string) => {
    const channels = hex.slice(1).match(/../g)!.map((value) => {
      const c = parseInt(value, 16) / 255;
      return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
    });
    return channels[0] * 0.2126 + channels[1] * 0.7152 + channels[2] * 0.0722;
  };
  for (let i = 0; i < ids.length; i++) {
    for (const other of ids.slice(i + 1)) {
      const colour = colourFor([ids[i], other]);
      colours.add(colour);
      assert.notEqual(colour, guestColours[ids[i]], `${ids[i]} & ${other}`);
      assert.notEqual(colour, guestColours[other], `${ids[i]} & ${other}`);
    }
  }
  assert.ok(colours.size >= 4);
  assert.notEqual(colourFor(["guapo", "bobbi"]), colourFor(["guapo", "luna"]));
  for (const colour of colours) {
    assert.ok((luminance("#F7F2E7") + 0.05) / (luminance(colour) + 0.05) >= 4.5, colour);
  }
});

test("Sofa Green wins whenever it is clear of both dogs", () => {
  assert.equal(colourFor(["luna", "tiny"]), "#5F6E4F");
  assert.equal(colourFor(["luna", "tyrion"]), "#5F6E4F");
  assert.notEqual(colourFor(["luna", "hugo-and-luffy"]), "#5F6E4F");
  assert.notEqual(colourFor(["guapo", "tiny"]), "#5F6E4F");
});

test("nearby hue families are avoided, including shorthand guest colours", () => {
  const colour = groupHeroColor([{ id: "one", bgColor: "#369" }, { id: "two", bgColor: "#755A83" }], "2026-10-13");
  assert.ok(["#5F6E4F", "#A34A2E", "#7A5C24"].includes(colour));
});

test("two green guests cannot produce a green shared hero", () => {
  const colour = groupHeroColor([{ id: "one", bgColor: "#3F6655" }, { id: "two", bgColor: "#4C6B3C" }], "2026-10-13");
  assert.notEqual(colour, "#5F6E4F");
});
