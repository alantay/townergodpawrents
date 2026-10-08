import assert from "node:assert/strict";
import test from "node:test";
import { cutoutWidth } from "./cutout-width.ts";

test("cutouts fit tall, wide and fractional-size boxes", () => {
  assert.equal(cutoutWidth(280, 628, 0.6), 168);
  assert.equal(cutoutWidth(280, 248, 2), 248);
  assert.equal(cutoutWidth(239.5, 190, 0.6), 144);
});
