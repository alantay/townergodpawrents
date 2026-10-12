import assert from "node:assert/strict";
import test from "node:test";
import { groupHeroColor } from "./group-hero-color.ts";

test("a returning combination keeps its colour regardless of ordering or duplicates", () => {
  const firstStay = groupHeroColor(["guapo", "bobbi"]);
  assert.equal(groupHeroColor(["bobbi", "guapo"]), firstStay);
  assert.equal(groupHeroColor(["guapo", "bobbi", "guapo"]), firstStay);
  assert.equal(groupHeroColor(["luna", "bobbi", "guapo"]), groupHeroColor(["guapo", "luna", "bobbi"]));
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
    for (const other of ids.slice(i + 1)) colours.add(groupHeroColor([ids[i], other]));
  }
  assert.equal(colours.size, 6);
  assert.notEqual(groupHeroColor(["guapo", "bobbi"]), groupHeroColor(["guapo", "luna"]));
  for (const colour of colours) {
    assert.ok((luminance("#F7F2E7") + 0.05) / (luminance(colour) + 0.05) >= 4.5, colour);
  }
});
