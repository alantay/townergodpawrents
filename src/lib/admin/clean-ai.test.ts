import assert from "node:assert/strict";
import test from "node:test";
import { cleanAi } from "./clean-ai.ts";

test("em dashes become commas", () => {
  assert.equal(cleanAi("Luna stole the slipper — she was proud."), "Luna stole the slipper, she was proud.");
  assert.equal(cleanAi("Luna—proud"), "Luna, proud");
});

test("en dashes in ranges stay", () => {
  assert.equal(cleanAi("Here 13–21 Oct, walks 9–11am."), "Here 13–21 Oct, walks 9–11am.");
  assert.equal(cleanAi("30 Sep – 13 Oct"), "30 Sep – 13 Oct");
});

test("en dashes and hyphens used as punctuation become commas", () => {
  assert.equal(cleanAi("She ran – fast."), "She ran, fast.");
  assert.equal(cleanAi("Wait - what"), "Wait, what");
  assert.equal(cleanAi("Wait -- what"), "Wait, what");
  assert.equal(cleanAi("a well-known nap"), "a well-known nap");
});

test("no stray commas at the edges", () => {
  assert.equal(cleanAi("So proud —"), "So proud");
  assert.equal(cleanAi("Gone —."), "Gone.");
  assert.equal(cleanAi("—Luna"), "Luna");
  assert.equal(cleanAi("One —\nTwo"), "One\nTwo");
});
