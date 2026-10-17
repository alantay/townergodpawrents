import assert from "node:assert/strict";
import test from "node:test";
import { GitHubError, gitHub } from "./github.ts";

interface Call { method: string; url: string; headers: Record<string, string>; body?: any }

/** Fake fetch: answers by "METHOD path" (path without the repo prefix and query). */
function fake(routes: Record<string, (call: Call) => { status?: number; body: unknown }>) {
  const calls: Call[] = [];
  const fetch = (async (url: string, init: RequestInit) => {
    const call: Call = {
      method: init.method ?? "GET",
      url,
      headers: init.headers as Record<string, string>,
      body: init.body ? JSON.parse(String(init.body)) : undefined,
    };
    calls.push(call);
    const path = url.replace("https://api.github.com/repos/alantay/townergodpawrents", "").split("?")[0];
    const route = routes[`${call.method} ${path}`];
    if (!route) return new Response("not found", { status: 404 });
    const { status = 200, body } = route(call);
    return new Response(typeof body === "string" ? body : JSON.stringify(body), { status });
  }) as typeof globalThis.fetch;
  return { calls, client: gitHub({ token: "tok", repo: "alantay/townergodpawrents", branch: "main", fetch }) };
}

test("head reads the branch ref with the token and API headers", async () => {
  const { calls, client } = fake({ "GET /git/ref/heads/main": () => ({ body: { object: { sha: "abc" } } }) });
  assert.equal(await client.head(), "abc");
  assert.equal(calls[0].headers.authorization, "Bearer tok");
  assert.equal(calls[0].headers["x-github-api-version"], "2022-11-28");
  assert.equal(calls[0].headers["user-agent"], "townergodpawrents-admin");
});

test("readFile asks for the raw file at the sha", async () => {
  const { calls, client } = fake({ "GET /contents/src/content/guests/luna.md": () => ({ body: "---\nname: Luna\n---\n" }) });
  assert.equal(await client.readFile("src/content/guests/luna.md", "abc"), "---\nname: Luna\n---\n");
  assert.match(calls[0].url, /\?ref=abc$/);
  assert.equal(calls[0].headers.accept, "application/vnd.github.raw+json");
});

test("listDir returns names, and [] for a folder that doesn't exist yet", async () => {
  const { client } = fake({ "GET /contents/src/content/guests/luna": () => ({ body: [{ name: "luna-nap.jpg" }, { name: "luna-sofa.jpg" }] }) });
  assert.deepEqual(await client.listDir("src/content/guests/luna", "abc"), ["luna-nap.jpg", "luna-sofa.jpg"]);
  assert.deepEqual(await client.listDir("src/content/guests/milk", "abc"), []);
});

test("other failures throw a GitHubError with the status", async () => {
  const { client } = fake({ "GET /contents/src/content/guests/luna": () => ({ status: 500, body: "boom" }) });
  await assert.rejects(client.listDir("src/content/guests/luna", "abc"), (e: unknown) => e instanceof GitHubError && e.status === 500);
});

test("commit makes blobs, a tree on the parent's tree, a commit, then moves the branch without force", async () => {
  let blob = 0;
  const { calls, client } = fake({
    "GET /git/commits/parent1": () => ({ body: { tree: { sha: "tree1" } } }),
    "POST /git/blobs": () => ({ status: 201, body: { sha: `blob${++blob}` } }),
    "POST /git/trees": () => ({ status: 201, body: { sha: "tree2" } }),
    "POST /git/commits": () => ({ status: 201, body: { sha: "commit2" } }),
    "PATCH /git/refs/heads/main": () => ({ body: { object: { sha: "commit2" } } }),
  });
  const sha = await client.commit(
    "parent1",
    [{ path: "src/content/guests/luna.md", content: "héllo" }, { path: "src/content/guests/luna/luna-nap.jpg", content: new Uint8Array([0xff, 0xd8]) }],
    "Add Luna 3:20pm nap entry (via admin)",
  );
  assert.equal(sha, "commit2");
  const blobs = calls.filter((c) => c.url.endsWith("/git/blobs")).map((c) => c.body);
  assert.deepEqual(blobs.map((b) => Buffer.from(b.content, "base64")), [Buffer.from("héllo"), Buffer.from([0xff, 0xd8])]);
  assert.ok(blobs.every((b) => b.encoding === "base64"));
  const tree = calls.find((c) => c.url.endsWith("/git/trees"))!.body;
  assert.equal(tree.base_tree, "tree1");
  assert.deepEqual(tree.tree, [
    { path: "src/content/guests/luna.md", mode: "100644", type: "blob", sha: "blob1" },
    { path: "src/content/guests/luna/luna-nap.jpg", mode: "100644", type: "blob", sha: "blob2" },
  ]);
  const commit = calls.find((c) => c.method === "POST" && c.url.endsWith("/git/commits"))!.body;
  assert.deepEqual(commit, { message: "Add Luna 3:20pm nap entry (via admin)", tree: "tree2", parents: ["parent1"] });
  assert.deepEqual(calls.at(-1)!.body, { sha: "commit2", force: false });
});

test("a branch that moved makes commit throw 422", async () => {
  const { client } = fake({
    "GET /git/commits/parent1": () => ({ body: { tree: { sha: "tree1" } } }),
    "POST /git/blobs": () => ({ body: { sha: "blob1" } }),
    "POST /git/trees": () => ({ body: { sha: "tree2" } }),
    "POST /git/commits": () => ({ body: { sha: "commit2" } }),
    "PATCH /git/refs/heads/main": () => ({ status: 422, body: { message: "Update is not a fast forward" } }),
  });
  await assert.rejects(client.commit("parent1", [{ path: "a.md", content: "a" }], "m"), (e: unknown) => e instanceof GitHubError && e.status === 422);
});

test("a ref move that landed but lost its answer still counts as done", async () => {
  let ref = "parent1";
  const { client } = fake({
    "GET /git/ref/heads/main": () => ({ body: { object: { sha: ref } } }),
    "GET /git/commits/parent1": () => ({ body: { tree: { sha: "tree1" } } }),
    "POST /git/blobs": () => ({ body: { sha: "blob1" } }),
    "POST /git/trees": () => ({ body: { sha: "tree2" } }),
    "POST /git/commits": () => ({ body: { sha: "commit2" } }),
    "PATCH /git/refs/heads/main": () => { ref = "commit2"; return { status: 502, body: "Bad gateway" }; },
  });
  assert.equal(await client.commit("parent1", [{ path: "a.md", content: "a" }], "m"), "commit2");
});
