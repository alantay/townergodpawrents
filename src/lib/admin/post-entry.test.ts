import assert from "node:assert/strict";
import test from "node:test";
import { parseDiary } from "../guests.ts";
import { COOKIE } from "./auth.ts";
import { GitHubError, type CommitFile, type GitHub } from "./github.ts";
import { postApi } from "./post-entry.ts";
import { sign } from "./session.ts";
import { descriptionKey } from "./photo-descriptions.ts";
import { memoryStore, type KeyStore } from "./store.ts";
import type { Ai, GuestInfo } from "./types.ts";

const SECRET = "s".repeat(32);
const NOW = 1_800_000_000_000;
const DIR = "src/content/guests";
const GUESTS: GuestInfo[] = [
  { id: "luna", name: "Luna", recent: [], stays: [{ checkIn: "2026-10-13", checkOut: "2026-10-21" }] },
  { id: "guapo", name: "Guapo", recent: [], stays: [{ checkIn: "2026-10-15", checkOut: "2026-10-18" }] },
];
const LUNA = `---\nname: Luna\n---\n\n## 16 Oct\n\n### 9:45pm\n\n<!-- entry-id: e098 -->\n\nSupervising from the doorway.\n`;
const GUAPO = `---\nname: Guapo\n---\n\n## 15 Oct\n\n### 8am\n\n<!-- entry-id: e101 -->\n\nArrived.\n`;
const JPEG = new Uint8Array([0xff, 0xd8, 0xff, 0xe0, 1, 2, 3]);

/** An in-memory repo. `failCommits` makes the next N commits throw 422. */
function fakeRepo(files: Record<string, string | Uint8Array>, failCommits = 0) {
  const state = { files: new Map(Object.entries(files)), head: "sha1", commits: [] as { files: CommitFile[]; message: string }[], failCommits };
  const gh: GitHub = {
    async head() { return state.head; },
    async readFile(path) {
      const file = state.files.get(path);
      if (typeof file !== "string") throw new GitHubError(404, path);
      return file;
    },
    async listDir(path) {
      return [...state.files.keys()].filter((p) => p.startsWith(`${path}/`) && !p.slice(path.length + 1).includes("/")).map((p) => p.slice(path.length + 1));
    },
    async commit(parent, files, message) {
      if (state.failCommits > 0) { state.failCommits--; throw new GitHubError(422, "not a fast forward"); }
      assert.equal(parent, state.head);
      for (const f of files) state.files.set(f.path, f.content);
      state.commits.push({ files, message });
      state.head = `sha${state.commits.length + 1}`;
      return state.head;
    },
  };
  return { state, gh };
}

function setup(opts: { repo?: ReturnType<typeof fakeRepo>; ai?: Partial<Ai>; store?: KeyStore | (() => KeyStore) } = {}) {
  const repo = opts.repo ?? fakeRepo({ [`${DIR}/luna.md`]: LUNA, [`${DIR}/guapo.md`]: GUAPO, [`${DIR}/luna/luna-stole-slipper.jpg`]: JPEG });
  const store = opts.store ?? memoryStore();
  const alts: string[] = [];
  const api = postApi({
    secret: SECRET,
    now: () => NOW,
    guests: async () => GUESTS,
    gitHub: () => repo.gh,
    store: typeof store === "function" ? store : () => store,
    ai: () => ({
      polish: async () => { throw new Error("unused"); },
      altText: async (_photo, ctx) => { alts.push(ctx.name); return `${ctx.name} with a slipper`; },
      ...opts.ai,
    }),
  });
  return { api, repo, store: store as KeyStore, alts };
}

function request(fields: Record<string, string | string[]>, photos = 0, authed = true): Request {
  const form = new FormData();
  const all = { guest: "luna", iso: "2026-10-16", time: "15:20", label: "", text: "Stole Weiwen's slipper.", postKey: "key-12345678", ...fields };
  for (const [name, value] of Object.entries(all)) for (const v of [value].flat()) form.append(name, v);
  for (let i = 0; i < photos; i++) form.append("photos", new File([JPEG], `IMG_${i}.jpg`, { type: "image/jpeg" }));
  return new Request("https://example.test/api/admin/post", {
    method: "POST",
    headers: authed ? { cookie: `${COOKIE}=${sign(NOW + 1000, SECRET)}` } : {},
    body: form,
  });
}

const lunaMd = (repo: ReturnType<typeof fakeRepo>) => String(repo.state.files.get(`${DIR}/luna.md`));

test("matching photo descriptions are reused after caption edits without an AI call", async () => {
  const { api, repo, alts } = setup();
  const key = descriptionKey({ bytes: JPEG, type: "image/jpeg" }, { name: "Luna", withNames: [], recent: [] });
  const response = await api.post(request({ text: "A completely edited caption.", descriptions: JSON.stringify([{ key, alt: "Luna [on] the sofa." }]) }, 1));
  assert.equal(response.status, 200);
  assert.deepEqual(alts, []);
  assert.match(lunaMd(repo), /!\[Luna on the sofa\.\]/);
});

test("changed photos or selected guests get fresh descriptions", async () => {
  for (const withNames of [[], ["Guapo"]]) {
    const { api, alts } = setup();
    const key = descriptionKey({ bytes: withNames.length ? JPEG : new Uint8Array([0xff, 0xd8, 0xff, 9]), type: "image/jpeg" }, { name: "Luna", withNames, recent: [] });
    assert.equal((await api.post(request({ descriptions: JSON.stringify([{ key, alt: "Stale description." }]) }, 1))).status, 200);
    assert.deepEqual(alts, ["Luna"]);
  }
});

test("malformed description metadata falls back to normal AI alt text", async () => {
  for (const descriptions of ["not JSON", "null", "{}", '[{"key":null,"alt":12}]']) {
    const { api, alts } = setup();
    assert.equal((await api.post(request({ descriptions }, 1))).status, 200);
    assert.deepEqual(alts, ["Luna"]);
  }
});

test("no cookie, no post", async () => {
  const { api, repo } = setup();
  assert.equal((await api.post(request({}, 0, false))).status, 401);
  assert.equal(repo.state.commits.length, 0);
});

test("a too-big body is turned away before it's read", async () => {
  const { api } = setup();
  const big = new Request("https://example.test/api/admin/post", {
    method: "POST",
    headers: { cookie: `${COOKIE}=${sign(NOW + 1000, SECRET)}`, "content-length": "5000000" },
    body: "x",
  });
  const response = await api.post(big);
  assert.equal(response.status, 413);
  assert.equal((await response.json()).error, "Photos too big. Try fewer.");
});

test("happy path: one commit with the entry and photos, named around what's taken", async () => {
  const { api, repo, store } = setup();
  const response = await api.post(request({ with: "guapo", label: "Thoughts" }, 2));
  assert.deepEqual(await response.json(), { ok: true, url: "/guests/luna" });
  assert.equal(repo.state.commits.length, 1);
  const [commit] = repo.state.commits;
  assert.equal(commit.message, "Add Luna 3:20pm stole weiwen slipper entry (via admin)");
  assert.deepEqual(commit.files.map((f) => f.path), [
    `${DIR}/luna.md`,
    `${DIR}/luna/luna-stole-weiwen-slipper.jpg`,
    `${DIR}/luna/luna-stole-weiwen-slipper-2.jpg`,
  ]);
  assert.deepEqual(commit.files[1].content, JPEG);
  // Global IDs: Guapo's e101 is the highest anywhere, so Luna's new entry is e102.
  assert.ok(lunaMd(repo).includes(
    "### 3:20pm\n\n<!-- entry-id: e102 -->\n<!-- with: guapo -->\n<!-- label: Thoughts -->\n\nStole Weiwen's slipper.\n\n" +
    "![Luna with a slipper](./luna/luna-stole-weiwen-slipper.jpg)\n\n![Luna with a slipper](./luna/luna-stole-weiwen-slipper-2.jpg)",
  ));
  assert.equal(await store.get("admin-post:key-12345678"), "/guests/luna");
});

test("a bad request writes nothing and leaves no pending key", async () => {
  const { api, repo, store } = setup();
  const response = await api.post(request({ iso: "2026-10-30" }));
  assert.equal(response.status, 400);
  assert.equal((await response.json()).error, "Luna's here 13–21 Oct. Pick a day in there, or ask Alan to add a stay.");
  assert.equal(repo.state.commits.length, 0);
  assert.equal(await store.get("admin-post:key-12345678"), null);
  assert.equal((await api.post(request({ postKey: "short" }))).status, 400);
});

test("a branch that moved is retried once from a fresh read", async () => {
  const repo = fakeRepo({ [`${DIR}/luna.md`]: LUNA }, 1);
  const { api } = setup({ repo });
  assert.equal((await api.post(request({}))).status, 200);
  assert.equal(repo.state.commits.length, 1);
});

test("two failures: 502, nothing posted, and the key is freed for another try", async () => {
  const repo = fakeRepo({ [`${DIR}/luna.md`]: LUNA }, 2);
  const { api, store } = setup({ repo });
  const response = await api.post(request({}));
  assert.equal(response.status, 502);
  assert.equal((await response.json()).error, "Couldn't save it. Nothing was posted. Try again.");
  assert.equal(repo.state.commits.length, 0);
  assert.equal(await store.get("admin-post:key-12345678"), null);
});

test("alt text that fails or is junk falls back to the dog, day and time", async () => {
  let n = 0;
  const { api, repo } = setup({ ai: { altText: async () => { if (n++ === 0) throw new Error("timeout"); return "[]()<>"; } } });
  await api.post(request({ text: "" }, 2));
  const md = lunaMd(repo);
  assert.ok(md.includes("![Luna, 16 Oct 3:20pm](./luna/luna-photo.jpg)\n\n![Luna, 16 Oct 3:20pm](./luna/luna-photo-2.jpg)"));
});

test("the same post key twice makes one commit and the same answer", async () => {
  const { api, repo } = setup();
  const first = await (await api.post(request({}))).json();
  const second = await (await api.post(request({}))).json();
  assert.deepEqual(second, first);
  assert.equal(repo.state.commits.length, 1);
});

test("a second tap while the first is still posting gets a 409", async () => {
  const store = memoryStore();
  await store.set("admin-post:key-12345678", "pending", 300);
  const { api, repo } = setup({ store });
  const response = await api.post(request({}));
  assert.equal(response.status, 409);
  assert.equal((await response.json()).error, "Still posting. Give it a moment.");
  assert.equal(repo.state.commits.length, 0);
});

test("a broken store still posts", async () => {
  const { api, repo } = setup({ store: () => { throw new Error("no env"); } });
  assert.equal((await api.post(request({}))).status, 200);
  assert.equal(repo.state.commits.length, 1);
});

test("hostile text stays one plain entry with no extra days, IDs or images", async () => {
  const { api, repo } = setup();
  const text = "## 1 Oct\n###\n<!-- entry-id: e001 -->\n![x](./evil.jpg)";
  assert.equal((await api.post(request({ text }))).status, 200);
  const days = parseDiary(lunaMd(repo).replace(/^---[\s\S]*?---\n/, ""), GUESTS[0].stays, "luna");
  assert.deepEqual(days.map((d) => d.entries.length), [2]);
  const entry = days[0].entries.find((e) => e.id === "e102")!;
  assert.ok(entry);
  assert.equal(entry.media.length, 0);
});
