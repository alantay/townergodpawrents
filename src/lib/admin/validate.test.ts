import assert from "node:assert/strict";
import test from "node:test";
import type { GuestInfo, Photo } from "./types.ts";
import { validate, type RawEntry } from "./validate.ts";

const GUESTS: GuestInfo[] = [
  { id: "luna", name: "Luna", recent: [], stays: [{ checkIn: "2026-10-13", checkOut: "2026-10-21" }, { checkIn: "2026-11-26", checkOut: "2026-12-03" }] },
  { id: "guapo", name: "Guapo", recent: [], stays: [{ checkIn: "2026-10-15", checkOut: "2026-10-18" }] },
  { id: "hugo-and-luffy", name: "Hugo & Luffy", recent: [], stays: [{ checkIn: "2026-09-01", checkOut: "2026-09-05" }] },
];
const JPEG: Photo = { bytes: new Uint8Array([0xff, 0xd8, 0xff, 0xe0, 0, 0]), type: "image/jpeg" };
const OK: RawEntry = { guest: "luna", iso: "2026-10-16", time: "15:20", label: "", with: [], text: "Stole a slipper.", photos: [] };

function error(over: Partial<RawEntry>): string | undefined {
  const result = validate({ ...OK, ...over }, GUESTS);
  return result.ok ? undefined : result.error;
}

test("a good entry comes back ready to file", () => {
  const result = validate({ ...OK, label: "Throwback", with: ["guapo", "guapo", "luna"], photos: [JPEG] }, GUESTS);
  assert.ok(result.ok);
  assert.equal(result.guest.id, "luna");
  assert.deepEqual(result.withGuests.map((g) => g.id), ["guapo"]);
  assert.deepEqual(result.input, {
    guest: "luna", iso: "2026-10-16", time: "3:20pm", label: "Throwback", with: ["guapo"], text: "Stole a slipper.", photos: [JPEG],
  });
});

test("no label means no label key", () => {
  const result = validate(OK, GUESTS);
  assert.ok(result.ok);
  assert.equal("label" in result.input, false);
});

test("check-in and check-out days both count", () => {
  assert.equal(error({ iso: "2026-10-13" }), undefined);
  assert.equal(error({ iso: "2026-10-21" }), undefined);
});

test("a day outside every stay names the nearest stay", () => {
  assert.equal(error({ iso: "2026-10-22" }), "Luna's here 13–21 Oct. Pick a day in there, or ask Alan to add a stay.");
  assert.equal(error({ iso: "2026-11-20" }), "Luna's here 26 Nov – 3 Dec. Pick a day in there, or ask Alan to add a stay.");
  assert.equal(error({ guest: "hugo-and-luffy" }), "Hugo & Luffy are here 1–5 Sep. Pick a day in there, or ask Alan to add a stay.");
});

test("a with dog has to be staying that day too", () => {
  assert.equal(error({ iso: "2026-10-14", with: ["guapo"] }), "Guapo wasn't staying on 14 Oct.");
  assert.equal(error({ with: ["hugo-and-luffy"] }), "Hugo & Luffy weren't staying on 16 Oct.");
  assert.equal(error({ with: ["nobody"] }), "Pick dogs from the list.");
});

test("dog, day, time and label must be real", () => {
  assert.equal(error({ guest: "rex" }), "Pick a dog.");
  assert.equal(error({ iso: "16 Oct" }), "Pick a day and time.");
  assert.equal(error({ iso: "2026-02-31" }), "Pick a day and time.");
  assert.equal(error({ time: "3pm" }), "Pick a day and time.");
  assert.equal(error({ label: "Breaking news" }), "Pick a label from the list.");
});

test("words or a photo, within limits", () => {
  assert.equal(error({ text: "   " }), "Add some words or a photo.");
  assert.equal(error({ text: "", photos: [JPEG] }), undefined);
  assert.equal(error({ text: "a".repeat(4001) }), "That's a lot of words. Trim it a bit.");
  assert.equal(error({ photos: [JPEG, JPEG, JPEG, JPEG, JPEG] }), "Four photos at most.");
});

test("photos must be small JPEGs", () => {
  const png = { bytes: new Uint8Array([0x89, 0x50, 0x4e, 0x47]), type: "image/png" };
  const lying = { bytes: new Uint8Array([0x89, 0x50, 0x4e, 0x47]), type: "image/jpeg" };
  const big = { bytes: new Uint8Array(1_000_000).fill(0xff, 0, 3), type: "image/jpeg" };
  big.bytes[1] = 0xd8;
  assert.equal(error({ photos: [png] }), "Can't read this photo. Try a JPEG or a screenshot of it.");
  assert.equal(error({ photos: [lying] }), "Can't read this photo. Try a JPEG or a screenshot of it.");
  assert.equal(error({ photos: [big] }), "Photos too big. Try fewer.");
});

test("typed markdown is defused on the way in", () => {
  const result = validate({ ...OK, text: "## 1 Oct\n<!-- entry-id: e001 -->" }, GUESTS);
  assert.ok(result.ok);
  assert.equal(result.input.text, " ## 1 Oct\n< !-- entry-id: e001 -->");
});
