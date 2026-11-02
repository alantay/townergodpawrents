import assert from "node:assert/strict";
import { constants } from "node:fs";
import { access, chmod, copyFile, mkdir, mkdtemp, readFile, rm, symlink, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { delimiter, dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";
import test from "node:test";

const root = join(dirname(fileURLToPath(import.meta.url)), "../..");

async function commandPath(name: string): Promise<string> {
  for (const dir of (process.env.PATH ?? "").split(delimiter)) {
    const path = join(dir, name);
    if (await access(path, constants.X_OK).then(() => true, () => false)) return path;
  }
  throw new Error(`${name} not found`);
}

test("prep-photo uses ImageMagick when sips is unavailable", async () => {
  const project = await mkdtemp(join(tmpdir(), "prep-photo-"));
  const bin = join(project, "bin");
  const script = join(project, "scripts/prep-photo.sh");
  const guestDir = join(project, "src/content/guests");
  const source = join(project, "source.jpg");
  const argsFile = join(project, "magick-args");

  try {
    await mkdir(bin, { recursive: true });
    await mkdir(dirname(script), { recursive: true });
    await mkdir(guestDir, { recursive: true });
    await copyFile(join(root, "scripts/prep-photo.sh"), script);
    await writeFile(join(guestDir, "tiny.md"), "---\nname: Tiny\n---\n");
    await writeFile(source, "photo");
    for (const command of ["cut", "dirname", "du", "mkdir", "cp"]) {
      await symlink(await commandPath(command), join(bin, command));
    }
    await writeFile(join(bin, "magick"), `#!/bin/sh\nprintf '%s\\n' "$@" > "$MAGICK_ARGS"\nfor arg do out=$arg; done\ncp "$1" "$out"\n`);
    await chmod(join(bin, "magick"), 0o755);

    const result = spawnSync("/bin/sh", [script, "tiny", source, "walk"], {
      encoding: "utf8",
      env: { ...process.env, PATH: bin, MAGICK_ARGS: argsFile },
    });

    assert.equal(result.status, 0, result.stderr);
    assert.deepEqual((await readFile(argsFile, "utf8")).trim().split("\n"), [
      source, "-auto-orient", "-resize", "1600x1600>", "-quality", "80",
      join(guestDir, "tiny/tiny-walk.jpg"),
    ]);
  } finally {
    await rm(project, { recursive: true, force: true });
  }
});
