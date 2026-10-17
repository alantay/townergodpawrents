import assert from "node:assert/strict";
import test from "node:test";
import { sign, verify } from "./session.ts";

const SECRET = "test-secret";
const NOW = 1_800_000_000_000;

test("a fresh cookie verifies", () => {
  assert.equal(verify(sign(NOW + 1000, SECRET), SECRET, NOW), true);
});

test("an expired cookie fails", () => {
  assert.equal(verify(sign(NOW, SECRET), SECRET, NOW), false);
  assert.equal(verify(sign(NOW - 1, SECRET), SECRET, NOW), false);
});

test("a tampered cookie fails", () => {
  const value = sign(NOW + 1000, SECRET);
  const [, mac] = value.split(".");
  assert.equal(verify(`${NOW + 999_999}.${mac}`, SECRET, NOW), false);
  assert.equal(verify(value.slice(0, -1) + (value.endsWith("0") ? "1" : "0"), SECRET, NOW), false);
});

test("the wrong or a missing secret fails", () => {
  const value = sign(NOW + 1000, SECRET);
  assert.equal(verify(value, "other", NOW), false);
  assert.equal(verify(value, "", NOW), false);
  assert.equal(verify(value, undefined, NOW), false);
});

test("garbage fails", () => {
  for (const bad of [undefined, "", "abc", "1.2", `${NOW + 1000}.${"g".repeat(64)}`, `${NOW + 1000}`]) {
    assert.equal(verify(bad, SECRET, NOW), false, String(bad));
  }
});
