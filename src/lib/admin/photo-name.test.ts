import assert from "node:assert/strict";
import test from "node:test";
import { photoName, slugWords } from "./photo-name.ts";

test("slugWords keeps the first three words that say something", () => {
  assert.deepEqual(slugWords("Luna stole Weiwen's slipper and ran to the garden", "Luna"), ["stole", "weiwen", "slipper"]);
  assert.deepEqual(slugWords("She's SO proud: zoomies!!", "Luna"), ["proud", "zoomies"]);
});

test("slugWords drops every dog in a pair", () => {
  assert.deepEqual(slugWords("Hugo and Luffy dug a hole", "Hugo & Luffy"), ["dug", "hole"]);
});

test("slugWords copes with accents, emoji and nothing at all", () => {
  assert.deepEqual(slugWords("Café nap 🐶", "Luna"), ["cafe", "nap"]);
  assert.deepEqual(slugWords("", "Luna"), ["photo"]);
  assert.deepEqual(slugWords("Luna!", "Luna"), ["photo"]);
  assert.deepEqual(slugWords("a".repeat(40), "Luna"), ["a".repeat(20)]);
});

test("photoName takes the first free name and claims it", () => {
  const taken = new Set(["luna-stole-slipper.jpg", "luna-stole-slipper-2.jpg"]);
  assert.equal(photoName("luna", ["stole", "slipper"], taken), "luna-stole-slipper-3.jpg");
  assert.equal(taken.has("luna-stole-slipper-3.jpg"), true);
});

test("each photo in an entry gets its own name", () => {
  const taken = new Set<string>();
  const names = [1, 2, 3].map(() => photoName("luna", ["nap"], taken));
  assert.deepEqual(names, ["luna-nap.jpg", "luna-nap-2.jpg", "luna-nap-3.jpg"]);
});
