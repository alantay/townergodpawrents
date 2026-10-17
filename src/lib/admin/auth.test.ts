import assert from "node:assert/strict";
import test from "node:test";
import { COOKIE, isAuthed, loginApi, readCookie, requireAuth } from "./auth.ts";
import { sign, verify } from "./session.ts";
import { memoryStore, type KeyStore } from "./store.ts";

const SECRET = "test-secret";
const NOW = 1_800_000_000_000;

function loginRequest(passphrase: string, url = "https://example.test/api/admin/login") {
  return new Request(url, { method: "POST", body: new URLSearchParams({ passphrase }) });
}

function api(over: Partial<Parameters<typeof loginApi>[0]> = {}) {
  const store = memoryStore();
  return { store, api: loginApi({ passphrase: "open sesame", secret: SECRET, store: () => store, now: () => NOW, ...over }) };
}

function cookieValue(res: Response): string | undefined {
  return res.headers.get("set-cookie")?.match(new RegExp(`${COOKIE}=([^;]*)`))?.[1];
}

test("readCookie finds ours among others", () => {
  const req = new Request("https://example.test/", { headers: { cookie: `a=1; ${COOKIE}=abc.def; b=2` } });
  assert.equal(readCookie(req), "abc.def");
  assert.equal(readCookie(new Request("https://example.test/")), undefined);
});

test("the right passphrase sets a 30-day signed cookie", async () => {
  const res = await api().api.login(loginRequest("open sesame"), "1.2.3.4");
  assert.equal(res.status, 303);
  assert.equal(res.headers.get("location"), "/admin");
  const header = res.headers.get("set-cookie")!;
  for (const part of ["Path=/", "HttpOnly", "SameSite=Lax", "Max-Age=2592000", "Secure"]) assert.match(header, new RegExp(part));
  assert.equal(verify(cookieValue(res), SECRET, NOW + 29 * 86_400_000), true);
  assert.equal(verify(cookieValue(res), SECRET, NOW + 31 * 86_400_000), false);
});

test("no Secure flag on plain http (local dev)", async () => {
  const res = await api().api.login(loginRequest("open sesame", "http://localhost:4321/api/admin/login"), "::1");
  assert.doesNotMatch(res.headers.get("set-cookie")!, /Secure/);
});

test("trailing spaces and newlines don't matter", async () => {
  const typed = await api().api.login(loginRequest("  open sesame "), "1.2.3.4");
  assert.equal(typed.headers.get("location"), "/admin");
  const env = await api({ passphrase: "open sesame\n" }).api.login(loginRequest("open sesame"), "1.2.3.4");
  assert.equal(env.headers.get("location"), "/admin");
});

test("the wrong passphrase goes back with an error and no cookie", async () => {
  const res = await api().api.login(loginRequest("open says me"), "1.2.3.4");
  assert.equal(res.status, 303);
  assert.equal(res.headers.get("location"), "/admin?error=wrong");
  assert.equal(res.headers.get("set-cookie"), null);
});

test("a missing passphrase or secret never logs anyone in", async () => {
  for (const passphrase of [undefined, "", "   "]) {
    for (const typed of ["", "anything"]) {
      const res = await api({ passphrase }).api.login(loginRequest(typed), "1.2.3.4");
      assert.equal(res.headers.get("location"), "/admin?error=wrong", `${passphrase}/${typed}`);
    }
  }
  for (const secret of [undefined, ""]) {
    const res = await api({ secret }).api.login(loginRequest("open sesame"), "1.2.3.4");
    assert.equal(res.headers.get("location"), "/admin?error=wrong");
  }
});

test("the sixth try in the window is told to wait, even if right", async () => {
  const { api: login } = api();
  for (let i = 0; i < 5; i++) await login.login(loginRequest("nope"), "1.2.3.4");
  const res = await login.login(loginRequest("open sesame"), "1.2.3.4");
  assert.equal(res.headers.get("location"), "/admin?error=slow");
  const other = await login.login(loginRequest("open sesame"), "5.6.7.8");
  assert.equal(other.headers.get("location"), "/admin");
});

test("a successful login clears the count", async () => {
  const { api: login, store } = api();
  for (let i = 0; i < 4; i++) await login.login(loginRequest("nope"), "1.2.3.4");
  await login.login(loginRequest("open sesame"), "1.2.3.4");
  assert.equal(store.data.size, 0);
});

test("a broken store still lets the right passphrase in", async () => {
  const boom = async () => { throw new Error("redis down"); };
  const broken: KeyStore = { incr: boom, get: boom, setNX: boom, set: boom, del: boom };
  const res = await loginApi({ passphrase: "open sesame", secret: SECRET, store: () => broken, now: () => NOW })
    .login(loginRequest("open sesame"), "1.2.3.4");
  assert.equal(res.headers.get("location"), "/admin");
  const missing = await loginApi({ passphrase: "open sesame", secret: SECRET, store: () => { throw new Error("no env"); }, now: () => NOW })
    .login(loginRequest("open sesame"), "1.2.3.4");
  assert.equal(missing.headers.get("location"), "/admin");
});

test("logout clears the cookie", () => {
  const res = api().api.logout(new Request("https://example.test/api/admin/logout", { method: "POST" }));
  assert.equal(res.status, 303);
  assert.equal(res.headers.get("location"), "/admin");
  assert.match(res.headers.get("set-cookie")!, new RegExp(`${COOKIE}=; .*Max-Age=0`));
});

test("requireAuth lets a valid cookie through and 401s the rest", async () => {
  const good = new Request("https://example.test/", { headers: { cookie: `${COOKIE}=${sign(NOW + 1000, SECRET)}` } });
  assert.equal(isAuthed(good, SECRET, NOW), true);
  assert.equal(requireAuth(good, SECRET, NOW), undefined);
  const res = requireAuth(new Request("https://example.test/"), SECRET, NOW)!;
  assert.equal(res.status, 401);
  assert.deepEqual(await res.json(), { error: "Logged out. Type the passphrase again." });
});
