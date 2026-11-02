import assert from "node:assert/strict";
import { createHmac } from "node:crypto";
import test from "node:test";
import { getPayloadFromClientToken } from "@vercel/blob/client";
import { COOKIE } from "./auth.ts";
import { BAD_VIDEO, MAX_VIDEO_BYTES, VIDEO_CONTENT_TYPES } from "./constants.ts";
import { sign } from "./session.ts";
import { videoUploadApi } from "./video-upload.ts";

const deps = { secret: "test-secret", token: "vercel_blob_rw_teststore_testsecret" };
const generate = (pathname = "admin-video/test-12345678.mov") => ({ type: "blob.generate-client-token", payload: { pathname, multipart: true } });
function request(body: unknown, authed = true, signature?: string) {
  return new Request("https://example.test/api/admin/video-upload", {
    method: "POST",
    headers: { "content-type": "application/json", ...(authed ? { cookie: `${COOKIE}=${sign(Date.now() + 60_000, deps.secret)}` } : {}), ...(signature ? { "x-vercel-signature": signature } : {}) },
    body: JSON.stringify(body),
  });
}

test("upload tokens return the shared 401 response when logged out", async () => {
  const expired = request(generate());
  expired.headers.set("cookie", `${COOKIE}=${sign(Date.now() - 1, deps.secret)}`);
  for (const req of [request(generate(), false), expired]) {
    const denied = await videoUploadApi(req, { ...deps, token: undefined });
    assert.equal(denied.status, 401);
    assert.deepEqual(await denied.json(), { error: "Logged out. Type the passphrase again." });
  }
});

test("upload tokens confine paths, types and size", async () => {
  const response = await videoUploadApi(request(generate()), deps);
  assert.equal(response.status, 200);
  const token = getPayloadFromClientToken((await response.json()).clientToken);
  assert.equal(token.pathname, "admin-video/test-12345678.mov");
  assert.deepEqual(token.allowedContentTypes, VIDEO_CONTENT_TYPES);
  assert.equal(token.maximumSizeInBytes, MAX_VIDEO_BYTES);
  assert.equal(token.addRandomSuffix, true);
  for (const req of [request(generate("elsewhere/test-12345678.mp4")), request(generate("admin-video/../test-12345678.mp4")), request(generate("admin-video/test-12345678.jpg")), request(generate("admin-video/short.mp4")), request(generate(`admin-video/${"x".repeat(101)}.mp4`)), request(null)]) {
    const denied = await videoUploadApi(req, deps);
    assert.equal(denied.status, 400);
    assert.deepEqual(await denied.json(), { error: BAD_VIDEO });
  }
});

test("completion callbacks use the Blob signature rather than the admin cookie", async () => {
  const body = { type: "blob.upload-completed", payload: { blob: { url: "https://teststore.public.blob.vercel-storage.com/admin-video/test-12345678.mov" }, tokenPayload: null } };
  const signature = createHmac("sha256", deps.token).update(JSON.stringify(body)).digest("hex");
  assert.equal((await videoUploadApi(request(body, false, signature), deps)).status, 200);
  assert.equal((await videoUploadApi(request(body, false), deps)).status, 400);
  assert.equal((await videoUploadApi(request(body, false, "00".repeat(32)), deps)).status, 400);
});
