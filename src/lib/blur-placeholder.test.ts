import assert from "node:assert/strict";
import test from "node:test";
import { blurPlaceholder } from "./blur-placeholder.ts";

test("blur placeholder is a tiny inline SVG wrapping a webp", async () => {
  const blur = await blurPlaceholder("../../content/guests/ebi/ebi-acquiring-new-skill.mp4.jpg");
  assert.ok(blur.startsWith("data:image/svg+xml,%3Csvg "));
  assert.ok(blur.includes("data:image/webp;base64,"));
  assert.ok(!/[#<>"]/.test(blur), "safe inside url(\"...\") and an HTML attribute");
  assert.ok(blur.length < 1500, `${blur.length} chars`);
});
