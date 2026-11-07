// Run only in the admin-video Action's disposable checkout. Files one entry:
// the clip, plus any photos posted with it, in the order they were added.
import { execFileSync } from "node:child_process";
import { mkdir, mkdtemp, readdir, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { MAX_VIDEO_BYTES } from "../src/lib/admin/constants.ts";
import { isJpeg, MAX_PHOTO_BYTES } from "../src/lib/admin/validate.ts";
import { buildVideoEntry, uploadKind, videoPayload } from "../src/lib/admin/video-entry.ts";

const root = fileURLToPath(new URL("../", import.meta.url));
const dir = join(root, "src/content/guests");
const payload = videoPayload.parse(JSON.parse(process.env.PAYLOAD ?? ""));
const temp = await mkdtemp(join(process.env.RUNNER_TEMP || tmpdir(), "admin-video-"));
const git = (...args: string[]) => execFileSync("git", args, { cwd: root, encoding: "utf8", stdio: ["ignore", "pipe", "inherit"] }).trim();

async function download(url: string, max: number): Promise<Uint8Array> {
  const response = await fetch(url, { redirect: "error" });
  if (!response.ok) throw new Error(`Download failed: ${response.status}`);
  if (Number(response.headers.get("content-length")) > max) throw new Error("Upload too large");
  const bytes = new Uint8Array(await response.arrayBuffer());
  if (!bytes.length || bytes.length > max) throw new Error("Upload empty or too large");
  return bytes;
}

try {
  // Fetch everything first, keyed by URL, so a push retry doesn't download again.
  let source = "";
  const photos = new Map<string, Uint8Array>();
  for (const { url } of payload.media) {
    const kind = uploadKind(url)!;
    if (kind === "jpg") {
      const bytes = await download(url, MAX_PHOTO_BYTES);
      if (!isJpeg({ bytes, type: "image/jpeg" })) throw new Error("Photo isn't a JPEG");
      photos.set(url, bytes);
    } else {
      source = join(temp, `source.${kind}`);
      await writeFile(source, await download(url, MAX_VIDEO_BYTES));
    }
  }
  git("config", "user.name", "github-actions[bot]");
  git("config", "user.email", "41898282+github-actions[bot]@users.noreply.github.com");

  for (let attempt = 0; attempt < 2; attempt++) {
    // A dispatch response or push acknowledgement can be lost. Reruns stay safe.
    const marker = `Admin-post-key: ${payload.postKey}`;
    if (git("log", "origin/main", "--format=%B", "--fixed-strings", `--grep=${marker}`).split("\n").includes(marker)) break;
    const files = (await readdir(dir)).filter((file) => file.endsWith(".md"));
    const markdowns = Object.fromEntries(await Promise.all(files.map(async (file) => [file.slice(0, -3), await readFile(join(dir, file), "utf8")])));
    const mediaDir = join(dir, payload.guest);
    const taken = new Set(await readdir(mediaDir).catch((error: NodeJS.ErrnoException) => {
      if (error.code === "ENOENT") return [] as string[];
      throw error;
    }));
    const entry = buildVideoEntry(payload, markdowns, taken);
    execFileSync("sh", ["scripts/prep-video.sh", payload.guest, source, entry.slug], { cwd: root, stdio: "inherit" });
    await mkdir(mediaDir, { recursive: true });
    const added: string[] = [];
    for (const m of entry.media) {
      const path = join(mediaDir, m.file);
      if (m.video) added.push(path, `${path}.json`, `${path}.jpg`);
      else {
        await writeFile(path, photos.get(m.url)!);
        added.push(path);
      }
    }
    const markdownFile = join(dir, `${payload.guest}.md`);
    await writeFile(markdownFile, entry.markdown);
    git("add", "--", markdownFile, ...added);
    git("commit", "-m", entry.message, "-m", marker);
    try {
      git("push", "origin", "HEAD:main");
      break;
    } catch (error) {
      if (attempt === 1) throw error;
      git("fetch", "origin", "main");
      git("reset", "--hard", "origin/main");
    }
  }
} finally {
  await rm(temp, { recursive: true, force: true });
}
