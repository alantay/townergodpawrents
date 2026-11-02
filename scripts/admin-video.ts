// Run only in the admin-video Action's disposable checkout.
import { execFileSync } from "node:child_process";
import { mkdtemp, readdir, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { extname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { MAX_VIDEO_BYTES } from "../src/lib/admin/constants.ts";
import { buildVideoEntry, videoPayload } from "../src/lib/admin/video-entry.ts";

const root = fileURLToPath(new URL("../", import.meta.url));
const dir = join(root, "src/content/guests");
const payload = videoPayload.parse(JSON.parse(process.env.PAYLOAD ?? ""));
const extension = extname(new URL(payload.videoUrl).pathname).toLowerCase();
if (![".mov", ".mp4"].includes(extension)) throw new Error("Expected an MP4 or MOV");
const temp = await mkdtemp(join(process.env.RUNNER_TEMP || tmpdir(), "admin-video-"));
const source = join(temp, `source${extension}`);
const git = (...args: string[]) => execFileSync("git", args, { cwd: root, encoding: "utf8", stdio: ["ignore", "pipe", "inherit"] }).trim();

try {
  const response = await fetch(payload.videoUrl, { redirect: "error" });
  if (!response.ok) throw new Error(`Video download failed: ${response.status}`);
  if (Number(response.headers.get("content-length")) > MAX_VIDEO_BYTES) throw new Error("Video too large");
  const bytes = new Uint8Array(await response.arrayBuffer());
  if (!bytes.length || bytes.length > MAX_VIDEO_BYTES) throw new Error("Video empty or too large");
  await writeFile(source, bytes);
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
    const markdownFile = join(dir, `${payload.guest}.md`);
    const mediaFile = join(mediaDir, entry.file);
    await writeFile(markdownFile, entry.markdown);
    git("add", "--", markdownFile, mediaFile, `${mediaFile}.json`, `${mediaFile}.jpg`);
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
