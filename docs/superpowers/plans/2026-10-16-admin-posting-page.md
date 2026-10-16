# Admin Posting Page Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** An `/admin` page where Weiwen or Alan types a passphrase, picks a dog, writes a few lines, adds up to 4 photos, optionally polishes the words with OpenAI, and posts. The server commits the entry and photos to `main` through the GitHub API, and Vercel rebuilds.

**Architecture:** The site stays static. We add one on-demand page (`src/pages/admin.astro`) and four on-demand API routes (`src/pages/api/admin/*.ts`). All logic lives in small, pure-ish modules in `src/lib/admin/`, each with injected dependencies (store, GitHub, OpenAI, fetch) so `node:test` can fake them, the same way `src/lib/reaction-api.ts` takes a fake Redis. The only file that touches Astro modules or env vars is `src/lib/admin/server.ts`, which the routes use.

**Tech Stack:** Astro 7 (`@astrojs/vercel` adapter), TypeScript run by `node --experimental-strip-types --test`, `@upstash/redis` (already a dependency), GitHub REST API (git data endpoints), OpenAI Chat Completions with JSON schema output. No new dependencies.

**Spec:** `docs/superpowers/specs/2026-10-16-admin-posting-page-design.md` (read it first). Mockups Alan approved: phone-width single column, chips, photo "prints", option cards, ink "Posted." panel. Copy and CSS from the mockup are reproduced in Task 12.

## Global Constraints

- Work in the worktree `/Users/alantay/Developer/townergodpawrents-admin` on branch `feature/admin-posting` (check with `git branch --show-current`). Never commit to `main`. The finished work goes to `main` through one PR.
- Shell cwd resets after each command. Always run `cd /Users/alantay/Developer/townergodpawrents-admin && <command>`.
- Tests: `node:test` + `node:assert/strict`, hand-rolled fakes, no new packages. Test files live next to the code: `src/lib/admin/<name>.test.ts`.
- Node runs TS with `--experimental-strip-types`: only erasable syntax. No `enum`, no `namespace`, no constructor parameter properties. Use `import type` for type-only imports.
- Inside `src/lib/**` (code and tests) import local files with the `.ts` extension (`import { x } from "./format.ts"`). Routes and `.astro` files import without it (`from "../../../lib/admin/auth"`), like `src/pages/api/reactions.ts`.
- Do not change existing behaviour. The only edit to existing lib code is adding `export` to `resolveDay` in `src/lib/guests.ts`. Do not touch `src/layouts/Layout.astro`.
- Every word a visitor or Weiwen sees follows `docs/agents/voice.md`: never "lah", no em dashes, en dashes only in ranges ("13–21 Oct"). Use the exact copy strings in this plan.
- Secrets are Vercel environment variables, read with `getSecret` from `astro:env/server`. Never commit a secret. `.env` is gitignored; only `.env.example` (names, no values) is committed.
- Keep Astro's `checkOrigin` on (the default). Don't add config that disables it.
- Default OpenAI model: `gpt-5-mini`, overridable with `OPENAI_MODEL`.
- GitHub repo `alantay/townergodpawrents`, branch from `ADMIN_BRANCH`, default `main`.
- Limits: 4 photos, each JPEG under 1,000,000 bytes (so 4 stay under 4MB and under Vercel's 4.5MB body cap), text 4000 characters, login 5 tries per IP per 10 minutes, cookie 30 days.

## Review Focus

1. **An empty or missing `ADMIN_PASSPHRASE` or `ADMIN_SECRET` must never log anyone in**, even if the typed passphrase is also empty. Test in Task 3.
2. **Hostile text** (a line that is `## 1 Oct`, a bare `###`, `<!-- entry-id: e001 -->`, `![x](./evil.jpg)`) must not create a day, an entry, an ID or an image when posted, and must not break the build. Tests in Task 1 (`sanitizeText`), Task 6 (parse round-trip) and Task 10 (end to end).
3. **Redis down or not configured**: login still works (just unthrottled), posting still works (just without the double-tap guard), never a 500. Tests in Task 3 and Task 10.
4. **Trailing spaces or a trailing newline** in the typed passphrase or the env var still log in (phones add a space after autocomplete). Test in Task 3.
5. **Multi-dog guests** ("Hugo & Luffy"): errors say "are here" / "weren't staying", and photo slugs drop both names. Tests in Task 4 and Task 5.

---

## File map

| File | New/changed | Responsibility |
|---|---|---|
| `package.json` | changed | Quote the test glob so nested `src/lib/admin/*.test.ts` run |
| `src/lib/admin/format.ts` | new | `formatTime`, `fallbackAlt`, `sanitizeAlt`, `sanitizeText` |
| `src/lib/admin/clean-ai.ts` | new | `cleanAi`: swap punctuation dashes in AI output |
| `src/lib/admin/session.ts` | new | `sign`, `verify` (HMAC cookie) |
| `src/lib/admin/store.ts` | new | `KeyStore` interface, `memoryStore`, `redisStore` |
| `src/lib/admin/http.ts` | new | `json()` response helper |
| `src/lib/admin/auth.ts` | new | Cookie reading, `requireAuth`, `loginApi` (login/logout) |
| `src/lib/admin/types.ts` | new | Shared types and `LABELS` |
| `src/lib/admin/validate.ts` | new | `validate()` raw form → checked entry or error copy |
| `src/lib/admin/photo-name.ts` | new | `slugWords`, `photoName` |
| `src/lib/guests.ts` | changed | `export` `resolveDay` |
| `src/lib/admin/insert-entry.ts` | new | `splitFrontmatter`, `nextId`, `entryBlock`, `insertEntry` |
| `src/lib/admin/github.ts` | new | GitHub REST client: `head`, `readFile`, `listDir`, `commit` |
| `src/lib/admin/prompts.ts` | new | `polishRules`, `polishMessages`, `altMessages`, schemas |
| `src/lib/admin/openai.ts` | new | OpenAI client: `polish`, `altText` |
| `src/lib/admin/polish-api.ts` | new | `/api/admin/polish` logic |
| `src/lib/admin/post-entry.ts` | new | `/api/admin/post` logic |
| `src/lib/admin/server.ts` | new | Astro glue: env, Redis, guests from content, wiring |
| `src/pages/api/admin/{login,logout,polish,post}.ts` | new | Thin routes |
| `src/lib/admin/form.ts` | new | Browser helpers: `dogsOn`, `nowSGT` |
| `src/pages/admin.astro` | new | Login form or post form, standalone HTML shell |
| `src/scripts/admin.ts` | new | Browser behaviour of the post form |
| `.env.example` | changed | List the new variable names |
| `docs/adr/0009-admin-posts-via-github-api.md` | new | ADR |
| `docs/agents/add-entry.md`, `AGENTS.md`, spec | changed | Docs |

---

### Task 0: Setup and baseline

**Files:**
- Modify: `package.json` (the `test` script)

**Interfaces:**
- Consumes: nothing
- Produces: `npm test` picks up `src/**/*.test.ts` at any depth.

- [ ] **Step 1: Check the branch and install**

```bash
cd /Users/alantay/Developer/townergodpawrents-admin && git branch --show-current && npm install
```

Expected: `feature/admin-posting`, then install finishes. If the branch is `main` or anything else, stop and ask Alan.

- [ ] **Step 2: Quote the test glob**

npm runs scripts with `sh`, where `**` behaves like `*`, so `src/**/*.test.ts` misses `src/lib/admin/*.test.ts`. Quoted, Node expands the glob itself with real `**`.

In `package.json` change:

```json
"test": "node --experimental-strip-types --test src/**/*.test.ts",
```

to:

```json
"test": "node --experimental-strip-types --test 'src/**/*.test.ts'",
```

- [ ] **Step 3: Baseline**

```bash
cd /Users/alantay/Developer/townergodpawrents-admin && npm test 2>&1 | tail -8 && npm run build 2>&1 | tail -5
```

Expected: all existing tests pass (`fail 0`), build completes. Write down the test count. If anything fails before you changed code, stop and tell Alan.

- [ ] **Step 4: Commit**

```bash
cd /Users/alantay/Developer/townergodpawrents-admin && git add package.json && git commit -m "Run nested test files too"
```

---

### Task 1: Text helpers and AI dash cleanup

**Files:**
- Create: `src/lib/admin/format.ts`, `src/lib/admin/clean-ai.ts`
- Test: `src/lib/admin/format.test.ts`, `src/lib/admin/clean-ai.test.ts`

**Interfaces:**
- Consumes: `fmtDay(iso: string): string` and `entryMinutes(time: string): number` from `src/lib/guests.ts`
- Produces:
  - `formatTime(hhmm: string): string | undefined`: `"15:20"` → `"3:20pm"`, `"15:00"` → `"3pm"`. Accepts `HH:MM` or `HH:MM:SS`. Anything else → `undefined`.
  - `fallbackAlt(name: string, iso: string, time12: string): string`: `"Luna, 16 Oct 3:20pm"`
  - `sanitizeAlt(alt: string, fallback: string): string`: strips `[]()<>`, collapses whitespace, caps at 200 chars, returns `fallback` if empty
  - `sanitizeText(text: string): string`: makes typed words safe to drop into the diary markdown
  - `cleanAi(text: string): string`: punctuation dashes → commas, keeps en dashes in number ranges

Why `sanitizeText` matters: the parser (`parseDiary` in `src/lib/guests.ts`) treats any line starting `## ` or `### ` as a heading (and its `\s+` even spans a newline, so a bare `##` line followed by text is a heading too), any `<!-- entry-id: … -->` as an ID and any `![…](…)` as an image. Typed text must not be able to produce those. We prefix heading-like lines with a space, break `<!--` and `![`. The diary escapes HTML when rendering, so the visible change is tiny.

- [ ] **Step 1: Write the failing tests**

`src/lib/admin/format.test.ts`:

```ts
import assert from "node:assert/strict";
import test from "node:test";
import { entryMinutes } from "../guests.ts";
import { fallbackAlt, formatTime, sanitizeAlt, sanitizeText } from "./format.ts";

test("formatTime writes times the way the diary does", () => {
  assert.equal(formatTime("15:20"), "3:20pm");
  assert.equal(formatTime("15:00"), "3pm");
  assert.equal(formatTime("09:05"), "9:05am");
  assert.equal(formatTime("00:05"), "12:05am");
  assert.equal(formatTime("12:00"), "12pm");
  assert.equal(formatTime("23:59"), "11:59pm");
  assert.equal(formatTime("09:30:00"), "9:30am");
});

test("formatTime rejects anything that isn't HH:MM", () => {
  for (const bad of ["", "24:00", "9:30", "3pm", "12:60", "ab:cd"]) {
    assert.equal(formatTime(bad), undefined, bad);
  }
});

test("formatTime output sorts with entryMinutes", () => {
  assert.equal(entryMinutes(formatTime("15:20")!), 15 * 60 + 20);
  assert.equal(entryMinutes(formatTime("00:05")!), 5);
  assert.equal(entryMinutes(formatTime("12:00")!), 12 * 60);
});

test("fallbackAlt names the dog, day and time", () => {
  assert.equal(fallbackAlt("Luna", "2026-10-16", "3:20pm"), "Luna, 16 Oct 3:20pm");
});

test("sanitizeAlt keeps alt text from breaking the image syntax", () => {
  assert.equal(sanitizeAlt("Luna [on] the (sofa)", "fb"), "Luna on the sofa");
  assert.equal(sanitizeAlt("Luna\n\n  asleep", "fb"), "Luna asleep");
  assert.equal(sanitizeAlt("<!-- entry-id: e001 -->", "fb"), "!-- entry-id: e001 --");
  assert.equal(sanitizeAlt("   ", "fb"), "fb");
  assert.equal(sanitizeAlt("a".repeat(300), "fb").length, 200);
});

test("sanitizeText leaves ordinary words alone", () => {
  assert.equal(sanitizeText("Luna stole a slipper. 9–11am, #1 fan!"), "Luna stole a slipper. 9–11am, #1 fan!");
  assert.equal(sanitizeText("  Two\r\n\r\n\r\n\r\nparagraphs  "), "Two\n\nparagraphs");
});

test("sanitizeText defuses headings, comments and images", () => {
  assert.equal(sanitizeText("## 1 Oct"), " ## 1 Oct");
  assert.equal(sanitizeText("hi\n### 9am\nthere"), "hi\n ### 9am\nthere");
  assert.equal(sanitizeText("hi\n##\nthere"), "hi\n ##\nthere");
  assert.equal(sanitizeText("#### big"), "#### big");
  assert.equal(sanitizeText("<!-- entry-id: e001 -->"), "< !-- entry-id: e001 -->");
  assert.equal(sanitizeText("![x](./evil.jpg)"), "! [x](./evil.jpg)");
});
```

`src/lib/admin/clean-ai.test.ts`:

```ts
import assert from "node:assert/strict";
import test from "node:test";
import { cleanAi } from "./clean-ai.ts";

test("em dashes become commas", () => {
  assert.equal(cleanAi("Luna stole the slipper — she was proud."), "Luna stole the slipper, she was proud.");
  assert.equal(cleanAi("Luna—proud"), "Luna, proud");
});

test("en dashes in ranges stay", () => {
  assert.equal(cleanAi("Here 13–21 Oct, walks 9–11am."), "Here 13–21 Oct, walks 9–11am.");
  assert.equal(cleanAi("30 Sep – 13 Oct"), "30 Sep – 13 Oct");
});

test("en dashes and hyphens used as punctuation become commas", () => {
  assert.equal(cleanAi("She ran – fast."), "She ran, fast.");
  assert.equal(cleanAi("Wait - what"), "Wait, what");
  assert.equal(cleanAi("Wait -- what"), "Wait, what");
  assert.equal(cleanAi("a well-known nap"), "a well-known nap");
});

test("no stray commas at the edges", () => {
  assert.equal(cleanAi("So proud —"), "So proud");
  assert.equal(cleanAi("Gone —."), "Gone.");
  assert.equal(cleanAi("—Luna"), "Luna");
  assert.equal(cleanAi("One —\nTwo"), "One\nTwo");
});
```

- [ ] **Step 2: Run the tests to see them fail**

```bash
cd /Users/alantay/Developer/townergodpawrents-admin && npm test 2>&1 | grep -E "(pass|fail) [0-9]+$|Cannot find"
```

Expected: FAIL, cannot find module `./format.ts` / `./clean-ai.ts`.

- [ ] **Step 3: Implement**

`src/lib/admin/format.ts`:

```ts
// Small text helpers for the admin page. See
// docs/superpowers/specs/2026-10-16-admin-posting-page-design.md.
import { fmtDay } from "../guests.ts";

/** "15:20" from <input type="time"> → "3:20pm", the way entries are headed. */
export function formatTime(hhmm: string): string | undefined {
  const m = /^([01]\d|2[0-3]):([0-5]\d)(?::[0-5]\d)?$/.exec(hhmm);
  if (!m) return undefined;
  const hour = Number(m[1]);
  const suffix = hour < 12 ? "am" : "pm";
  const h12 = hour % 12 || 12;
  return m[2] === "00" ? `${h12}${suffix}` : `${h12}:${m[2]}${suffix}`;
}

/** Alt text when OpenAI can't help: "Luna, 16 Oct 3:20pm". */
export function fallbackAlt(name: string, iso: string, time12: string): string {
  return `${name}, ${fmtDay(iso)} ${time12}`;
}

/** Alt text goes inside ![...](...), so it can't carry brackets or comments. */
export function sanitizeAlt(alt: string, fallback: string): string {
  const clean = alt.replace(/[[\]()<>]/g, "").replace(/\s+/g, " ").trim().slice(0, 200).trim();
  return clean || fallback;
}

/**
 * Typed words go straight into the dog's markdown. Stop them turning into a
 * day or entry heading, an entry-id comment or an image. Trim first, so the
 * space that defuses a heading on the first line survives.
 */
export function sanitizeText(text: string): string {
  return text
    .replace(/\r\n?/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim()
    .replace(/^(#{2,3})(?=\s|$)/gm, " $1")
    .replace(/<!--/g, "< !--")
    .replace(/!\[/g, "! [");
}
```

`src/lib/admin/clean-ai.ts`:

```ts
// Models love dashes; the house voice doesn't (docs/agents/voice.md). Every
// AI answer goes through here. En dashes before a number are ranges, so stay.
export function cleanAi(text: string): string {
  return text
    .replace(/[ \t]*—+[ \t]*/g, ", ")
    .replace(/[ \t]*–(?![ \t]*\d)[ \t]*/g, ", ")
    .replace(/[ \t]*-{2,}[ \t]*/g, ", ")
    .replace(/[ \t]+-[ \t]+/g, ", ")
    .replace(/,[ \t]*(?=[.,!?;:])/g, "")
    .replace(/,[ \t]*$/gm, "")
    .replace(/^[ \t]*,[ \t]*/gm, "")
    .replace(/[ \t]{2,}/g, " ")
    .trim();
}
```

- [ ] **Step 4: Run the tests to see them pass**

```bash
cd /Users/alantay/Developer/townergodpawrents-admin && npm test 2>&1 | grep -E "(pass|fail) [0-9]+$"
```

Expected: `fail 0`.

- [ ] **Step 5: Commit**

```bash
cd /Users/alantay/Developer/townergodpawrents-admin && git add src/lib/admin && git commit -m "Add admin text helpers and AI dash cleanup"
```

---

### Task 2: Signed cookie and key store

**Files:**
- Create: `src/lib/admin/session.ts`, `src/lib/admin/store.ts`
- Test: `src/lib/admin/session.test.ts`, `src/lib/admin/store.test.ts`

**Interfaces:**
- Consumes: `Redis` type from `@upstash/redis`
- Produces:
  - `sign(exp: number, secret: string): string` → `"<exp>.<64 hex>"`; `exp` is a Unix time in ms
  - `verify(value: string | undefined, secret: string | undefined, now: number): boolean`
  - `interface KeyStore { incr(key, ttlSeconds): Promise<number>; get(key): Promise<string | null>; setNX(key, value, ttlSeconds): Promise<boolean>; set(key, value, ttlSeconds): Promise<void>; del(key): Promise<void> }`
  - `memoryStore(): KeyStore & { data: Map<string, string> }` (for tests)
  - `redisStore(redis: Redis): KeyStore`

- [ ] **Step 1: Write the failing tests**

`src/lib/admin/session.test.ts`:

```ts
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
```

`src/lib/admin/store.test.ts`:

```ts
import assert from "node:assert/strict";
import test from "node:test";
import type { Redis } from "@upstash/redis";
import { memoryStore, redisStore } from "./store.ts";

test("memoryStore counts, claims once and forgets", async () => {
  const store = memoryStore();
  assert.equal(await store.incr("k", 60), 1);
  assert.equal(await store.incr("k", 60), 2);
  assert.equal(await store.setNX("p", "pending", 300), true);
  assert.equal(await store.setNX("p", "other", 300), false);
  assert.equal(await store.get("p"), "pending");
  await store.set("p", "/guests/luna", 86400);
  assert.equal(await store.get("p"), "/guests/luna");
  await store.del("p");
  assert.equal(await store.get("p"), null);
});

function fakeRedis() {
  const calls: unknown[][] = [];
  const values = new Map<string, unknown>();
  const client = {
    multi() {
      return {
        incr(key: string) { calls.push(["incr", key]); return this; },
        expire(key: string, seconds: number, option: string) { calls.push(["expire", key, seconds, option]); return this; },
        async exec() { return [3, 1]; },
      };
    },
    async get(key: string) { return values.get(key) ?? null; },
    async set(key: string, value: string, opts: { nx?: boolean; ex: number }) {
      calls.push(["set", key, value, opts]);
      if (opts.nx && values.has(key)) return null;
      values.set(key, value);
      return "OK";
    },
    async del(key: string) { calls.push(["del", key]); values.delete(key); return 1; },
  };
  return { calls, values, redis: client as unknown as Redis };
}

test("redisStore.incr sets the window only on the first hit", async () => {
  const { calls, redis } = fakeRedis();
  assert.equal(await redisStore(redis).incr("admin-login:x", 600), 3);
  assert.deepEqual(calls, [["incr", "admin-login:x"], ["expire", "admin-login:x", 600, "NX"]]);
});

test("redisStore.setNX reports whether it claimed the key", async () => {
  const { calls, redis } = fakeRedis();
  const store = redisStore(redis);
  assert.equal(await store.setNX("p", "pending", 300), true);
  assert.equal(await store.setNX("p", "pending", 300), false);
  assert.deepEqual(calls[0], ["set", "p", "pending", { nx: true, ex: 300 }]);
});

test("redisStore.get always hands back a string or null", async () => {
  const { values, redis } = fakeRedis();
  values.set("n", 42);
  assert.equal(await redisStore(redis).get("n"), "42");
  assert.equal(await redisStore(redis).get("missing"), null);
});
```

- [ ] **Step 2: Run the tests to see them fail**

```bash
cd /Users/alantay/Developer/townergodpawrents-admin && npm test 2>&1 | grep -E "(pass|fail) [0-9]+$|Cannot find"
```

Expected: FAIL, cannot find `./session.ts` / `./store.ts`.

- [ ] **Step 3: Implement**

`src/lib/admin/session.ts`:

```ts
// The admin cookie is just "logged in until <exp>", signed. No user identity:
// there's one shared passphrase. Changing ADMIN_SECRET logs everyone out.
import { createHmac, timingSafeEqual } from "node:crypto";

function mac(value: string, secret: string): string {
  return createHmac("sha256", secret).update(value).digest("hex");
}

export function sign(exp: number, secret: string): string {
  return `${exp}.${mac(String(exp), secret)}`;
}

export function verify(value: string | undefined, secret: string | undefined, now: number): boolean {
  if (!value || !secret) return false;
  const m = /^(\d{1,15})\.([0-9a-f]{64})$/.exec(value);
  if (!m || Number(m[1]) <= now) return false;
  return timingSafeEqual(Buffer.from(m[2], "hex"), Buffer.from(mac(m[1], secret), "hex"));
}
```

`src/lib/admin/store.ts`:

```ts
// The few Redis calls the admin needs: a login rate limit and a one-time
// post key. Behind an interface so tests use memoryStore().
import type { Redis } from "@upstash/redis";

export interface KeyStore {
  incr(key: string, ttlSeconds: number): Promise<number>;
  get(key: string): Promise<string | null>;
  setNX(key: string, value: string, ttlSeconds: number): Promise<boolean>;
  set(key: string, value: string, ttlSeconds: number): Promise<void>;
  del(key: string): Promise<void>;
}

/** In-memory store for tests. TTLs are ignored. */
export function memoryStore(): KeyStore & { data: Map<string, string> } {
  const data = new Map<string, string>();
  return {
    data,
    async incr(key) {
      const next = Number(data.get(key) ?? 0) + 1;
      data.set(key, String(next));
      return next;
    },
    async get(key) { return data.get(key) ?? null; },
    async setNX(key, value) {
      if (data.has(key)) return false;
      data.set(key, value);
      return true;
    },
    async set(key, value) { data.set(key, value); },
    async del(key) { data.delete(key); },
  };
}

export function redisStore(redis: Redis): KeyStore {
  return {
    async incr(key, ttlSeconds) {
      // Same pattern as reaction-api.ts: the window starts on the first hit.
      const [count] = (await redis.multi().incr(key).expire(key, ttlSeconds, "NX").exec()) as [number, number];
      return count;
    },
    async get(key) {
      const value = await redis.get(key);
      return value == null ? null : String(value);
    },
    async setNX(key, value, ttlSeconds) {
      return (await redis.set(key, value, { nx: true, ex: ttlSeconds })) === "OK";
    },
    async set(key, value, ttlSeconds) {
      await redis.set(key, value, { ex: ttlSeconds });
    },
    async del(key) {
      await redis.del(key);
    },
  };
}
```

- [ ] **Step 4: Run the tests to see them pass**

```bash
cd /Users/alantay/Developer/townergodpawrents-admin && npm test 2>&1 | grep -E "(pass|fail) [0-9]+$"
```

Expected: `fail 0`.

- [ ] **Step 5: Commit**

```bash
cd /Users/alantay/Developer/townergodpawrents-admin && git add src/lib/admin && git commit -m "Add admin cookie signing and key store"
```

---

### Task 3: Login, logout and the auth check

**Files:**
- Create: `src/lib/admin/http.ts`, `src/lib/admin/auth.ts`
- Test: `src/lib/admin/auth.test.ts`

**Interfaces:**
- Consumes: `sign`, `verify` (Task 2); `KeyStore`, `memoryStore` (Task 2)
- Produces:
  - `json(value: unknown, status = 200): Response`: JSON with `cache-control: no-store`
  - `COOKIE = "tgp_admin"`, `MAX_AGE = 2592000` (30 days, seconds)
  - `readCookie(request: Request, name = COOKIE): string | undefined`
  - `isAuthed(request: Request, secret: string | undefined, now = Date.now()): boolean`
  - `requireAuth(request, secret, now = Date.now()): Response | undefined`: 401 `{ error: "Logged out. Type the passphrase again." }` or `undefined` when fine
  - `loginApi(deps: { passphrase: string | undefined; secret: string | undefined; store: () => KeyStore; now?: () => number }): { login(request: Request, ip: string): Promise<Response>; logout(request: Request): Response }`

Login is a plain HTML form POST, so every answer is a 303 redirect back to `/admin` (with `?error=wrong` or `?error=slow`), never JSON. The page shows the message.

- [ ] **Step 1: Write the failing tests**

`src/lib/admin/auth.test.ts`:

```ts
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
```

- [ ] **Step 2: Run the tests to see them fail**

```bash
cd /Users/alantay/Developer/townergodpawrents-admin && npm test 2>&1 | grep -E "(pass|fail) [0-9]+$|Cannot find"
```

Expected: FAIL, cannot find `./auth.ts`.

- [ ] **Step 3: Implement**

`src/lib/admin/http.ts`:

```ts
export function json(value: unknown, status = 200): Response {
  return new Response(JSON.stringify(value), {
    status,
    headers: { "content-type": "application/json; charset=utf-8", "cache-control": "no-store" },
  });
}
```

`src/lib/admin/auth.ts`:

```ts
// One shared passphrase, a 30-day signed cookie, 5 tries per IP per 10 min.
// Login is a plain form POST, so it always answers with a redirect.
import { createHash, timingSafeEqual } from "node:crypto";
import { json } from "./http.ts";
import { sign, verify } from "./session.ts";
import type { KeyStore } from "./store.ts";

export const COOKIE = "tgp_admin";
export const MAX_AGE = 60 * 60 * 24 * 30;
const LIMIT = 5;
const WINDOW_SECONDS = 600;

export function readCookie(request: Request, name = COOKIE): string | undefined {
  for (const part of (request.headers.get("cookie") ?? "").split(";")) {
    const [key, ...rest] = part.trim().split("=");
    if (key === name) return rest.join("=");
  }
  return undefined;
}

export function isAuthed(request: Request, secret: string | undefined, now = Date.now()): boolean {
  return verify(readCookie(request), secret, now);
}

export function requireAuth(request: Request, secret: string | undefined, now = Date.now()): Response | undefined {
  return isAuthed(request, secret, now) ? undefined : json({ error: "Logged out. Type the passphrase again." }, 401);
}

function sha256(value: string): Buffer {
  return createHash("sha256").update(value).digest();
}

function redirect(location: string, cookie?: string): Response {
  const headers = new Headers({ location, "cache-control": "no-store" });
  if (cookie) headers.append("set-cookie", cookie);
  return new Response(null, { status: 303, headers });
}

function cookie(request: Request, value: string, maxAge: number): string {
  const secure = new URL(request.url).protocol === "https:" ? "; Secure" : "";
  return `${COOKIE}=${value}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${maxAge}${secure}`;
}

export function loginApi(deps: {
  passphrase: string | undefined;
  secret: string | undefined;
  store: () => KeyStore;
  now?: () => number;
}) {
  const now = deps.now ?? Date.now;
  return {
    async login(request: Request, ip: string): Promise<Response> {
      const key = `admin-login:${sha256(ip).toString("hex")}`;
      try {
        if ((await deps.store().incr(key, WINDOW_SECONDS)) > LIMIT) return redirect("/admin?error=slow");
      } catch (error) {
        // No Redis means no throttle, not no login.
        console.error("[admin] login rate limit unavailable", error);
      }

      const form = await request.formData().catch(() => undefined);
      const typed = String(form?.get("passphrase") ?? "").trim();
      const real = (deps.passphrase ?? "").trim();
      if (!typed || !real || !deps.secret || !timingSafeEqual(sha256(typed), sha256(real))) {
        return redirect("/admin?error=wrong");
      }

      try {
        await deps.store().del(key);
      } catch {
        // The count expires by itself.
      }
      return redirect("/admin", cookie(request, sign(now() + MAX_AGE * 1000, deps.secret), MAX_AGE));
    },

    logout(request: Request): Response {
      return redirect("/admin", cookie(request, "", 0));
    },
  };
}
```

- [ ] **Step 4: Run the tests to see them pass**

```bash
cd /Users/alantay/Developer/townergodpawrents-admin && npm test 2>&1 | grep -E "(pass|fail) [0-9]+$"
```

Expected: `fail 0`.

- [ ] **Step 5: Commit**

```bash
cd /Users/alantay/Developer/townergodpawrents-admin && git add src/lib/admin && git commit -m "Add admin login, logout and auth check"
```

---

### Task 4: Shared types and validation

**Files:**
- Create: `src/lib/admin/types.ts`, `src/lib/admin/validate.ts`
- Test: `src/lib/admin/validate.test.ts`

**Interfaces:**
- Consumes: `Stay`, `stayOn`, `stayLabel`, `fmtDay`, `dogNames` from `src/lib/guests.ts`; `formatTime`, `sanitizeText` (Task 1)
- Produces (`types.ts`):

```ts
export const LABELS = ["Throwback", "Thoughts", "Fun fact"] as const;
export interface GuestInfo { id: string; name: string; stays: Stay[]; recent: string[] }
export interface Photo { bytes: Uint8Array; type: string }
export interface EntryInput { guest: string; iso: string; time: string; label?: string; with: string[]; text: string; photos: Photo[] }
export interface AiContext { name: string; withNames: string[]; recent: string[] }
export interface PolishResult { polished: string; twist: string | null; rewritten: string | null; note: string | null }
export interface Ai {
  polish(text: string, ctx: AiContext): Promise<PolishResult>;
  altText(photo: Uint8Array, ctx: AiContext, text: string): Promise<string>;
}
```

- Produces (`validate.ts`):
  - `MAX_TEXT = 4000`, `MAX_PHOTOS = 4`, `MAX_PHOTO_BYTES = 1_000_000`, `TOO_LONG = "That's a lot of words. Trim it a bit."`
  - `interface RawEntry { guest: string; iso: string; time: string; label: string; with: string[]; text: string; photos: Photo[] }`: `time` is `HH:MM` from the form
  - `type Checked = { ok: true; guest: GuestInfo; withGuests: GuestInfo[]; input: EntryInput } | { ok: false; error: string }`
  - `validate(raw: RawEntry, guests: GuestInfo[]): Checked`: on success `input.time` is already `"3:20pm"`, `input.text` is sanitized, `input.with` is deduped without the dog itself

Checks run in this order, first failure wins (exact copy):

1. Unknown guest → `Pick a dog.`
2. Bad date (`YYYY-MM-DD` that is a real date) or bad time → `Pick a day and time.`
3. Label not empty and not in `LABELS` → `Pick a label from the list.`
4. A "with" id that isn't a known guest → `Pick dogs from the list.`
5. No text (after sanitizing) and no photos → `Add some words or a photo.`
6. Text over 4000 chars → `That's a lot of words. Trim it a bit.`
7. More than 4 photos → `Four photos at most.`
8. A photo that isn't `image/jpeg` with JPEG magic bytes `FF D8 FF` → `Can't read this photo. Try a JPEG or a screenshot of it.`
9. A photo of 1,000,000 bytes or more → `Photos too big. Try fewer.`
10. Day outside every stay of the dog → `Luna's here 13–21 Oct. Pick a day in there, or ask Alan to add a stay.` (stay nearest the chosen day; `Hugo & Luffy are here …` for a pair)
11. A "with" dog not staying that day → `Guapo wasn't staying on 16 Oct.` (`Hugo & Luffy weren't staying on 16 Oct.`)

- [ ] **Step 1: Write the failing tests**

`src/lib/admin/validate.test.ts`:

```ts
import assert from "node:assert/strict";
import test from "node:test";
import type { GuestInfo, Photo } from "./types.ts";
import { validate, type RawEntry } from "./validate.ts";

const GUESTS: GuestInfo[] = [
  { id: "luna", name: "Luna", recent: [], stays: [{ checkIn: "2026-10-13", checkOut: "2026-10-21" }, { checkIn: "2026-11-26", checkOut: "2026-12-03" }] },
  { id: "guapo", name: "Guapo", recent: [], stays: [{ checkIn: "2026-10-15", checkOut: "2026-10-18" }] },
  { id: "hugo-and-luffy", name: "Hugo & Luffy", recent: [], stays: [{ checkIn: "2026-09-01", checkOut: "2026-09-05" }] },
];
const JPEG: Photo = { bytes: new Uint8Array([0xff, 0xd8, 0xff, 0xe0, 0, 0]), type: "image/jpeg" };
const OK: RawEntry = { guest: "luna", iso: "2026-10-16", time: "15:20", label: "", with: [], text: "Stole a slipper.", photos: [] };

function error(over: Partial<RawEntry>): string | undefined {
  const result = validate({ ...OK, ...over }, GUESTS);
  return result.ok ? undefined : result.error;
}

test("a good entry comes back ready to file", () => {
  const result = validate({ ...OK, label: "Throwback", with: ["guapo", "guapo", "luna"], photos: [JPEG] }, GUESTS);
  assert.ok(result.ok);
  assert.equal(result.guest.id, "luna");
  assert.deepEqual(result.withGuests.map((g) => g.id), ["guapo"]);
  assert.deepEqual(result.input, {
    guest: "luna", iso: "2026-10-16", time: "3:20pm", label: "Throwback", with: ["guapo"], text: "Stole a slipper.", photos: [JPEG],
  });
});

test("no label means no label key", () => {
  const result = validate(OK, GUESTS);
  assert.ok(result.ok);
  assert.equal("label" in result.input, false);
});

test("check-in and check-out days both count", () => {
  assert.equal(error({ iso: "2026-10-13" }), undefined);
  assert.equal(error({ iso: "2026-10-21" }), undefined);
});

test("a day outside every stay names the nearest stay", () => {
  assert.equal(error({ iso: "2026-10-22" }), "Luna's here 13–21 Oct. Pick a day in there, or ask Alan to add a stay.");
  assert.equal(error({ iso: "2026-11-20" }), "Luna's here 26 Nov – 3 Dec. Pick a day in there, or ask Alan to add a stay.");
  assert.equal(error({ guest: "hugo-and-luffy" }), "Hugo & Luffy are here 1–5 Sep. Pick a day in there, or ask Alan to add a stay.");
});

test("a with dog has to be staying that day too", () => {
  assert.equal(error({ iso: "2026-10-14", with: ["guapo"] }), "Guapo wasn't staying on 14 Oct.");
  assert.equal(error({ with: ["hugo-and-luffy"] }), "Hugo & Luffy weren't staying on 16 Oct.");
  assert.equal(error({ with: ["nobody"] }), "Pick dogs from the list.");
});

test("dog, day, time and label must be real", () => {
  assert.equal(error({ guest: "rex" }), "Pick a dog.");
  assert.equal(error({ iso: "16 Oct" }), "Pick a day and time.");
  assert.equal(error({ iso: "2026-02-31" }), "Pick a day and time.");
  assert.equal(error({ time: "3pm" }), "Pick a day and time.");
  assert.equal(error({ label: "Breaking news" }), "Pick a label from the list.");
});

test("words or a photo, within limits", () => {
  assert.equal(error({ text: "   " }), "Add some words or a photo.");
  assert.equal(error({ text: "", photos: [JPEG] }), undefined);
  assert.equal(error({ text: "a".repeat(4001) }), "That's a lot of words. Trim it a bit.");
  assert.equal(error({ photos: [JPEG, JPEG, JPEG, JPEG, JPEG] }), "Four photos at most.");
});

test("photos must be small JPEGs", () => {
  const png = { bytes: new Uint8Array([0x89, 0x50, 0x4e, 0x47]), type: "image/png" };
  const lying = { bytes: new Uint8Array([0x89, 0x50, 0x4e, 0x47]), type: "image/jpeg" };
  const big = { bytes: new Uint8Array(1_000_000).fill(0xff, 0, 3), type: "image/jpeg" };
  big.bytes[1] = 0xd8;
  assert.equal(error({ photos: [png] }), "Can't read this photo. Try a JPEG or a screenshot of it.");
  assert.equal(error({ photos: [lying] }), "Can't read this photo. Try a JPEG or a screenshot of it.");
  assert.equal(error({ photos: [big] }), "Photos too big. Try fewer.");
});

test("typed markdown is defused on the way in", () => {
  const result = validate({ ...OK, text: "## 1 Oct\n<!-- entry-id: e001 -->" }, GUESTS);
  assert.ok(result.ok);
  assert.equal(result.input.text, " ## 1 Oct\n< !-- entry-id: e001 -->");
});
```

- [ ] **Step 2: Run the tests to see them fail**

```bash
cd /Users/alantay/Developer/townergodpawrents-admin && npm test 2>&1 | grep -E "(pass|fail) [0-9]+$|Cannot find"
```

Expected: FAIL, cannot find `./types.ts` / `./validate.ts`.

- [ ] **Step 3: Implement**

`src/lib/admin/types.ts`:

```ts
import type { Stay } from "../guests.ts";

/** The labels an entry can wear instead of its time (add-entry.md). */
export const LABELS = ["Throwback", "Thoughts", "Fun fact"] as const;

export interface GuestInfo {
  id: string;
  name: string;
  stays: Stay[];
  /** Newest three entry texts, as a tone reference for polish. */
  recent: string[];
}

export interface Photo {
  bytes: Uint8Array;
  type: string;
}

export interface EntryInput {
  guest: string;
  iso: string;
  /** Already formatted: "3:20pm". */
  time: string;
  label?: string;
  with: string[];
  text: string;
  photos: Photo[];
}

export interface AiContext {
  name: string;
  withNames: string[];
  recent: string[];
}

export interface PolishResult {
  polished: string;
  twist: string | null;
  rewritten: string | null;
  note: string | null;
}

export interface Ai {
  polish(text: string, ctx: AiContext): Promise<PolishResult>;
  altText(photo: Uint8Array, ctx: AiContext, text: string): Promise<string>;
}
```

`src/lib/admin/validate.ts`:

```ts
// Everything is checked before anything is written, so a bad post can't
// reach the build. Messages follow docs/agents/voice.md.
import { dogNames, fmtDay, stayLabel, stayOn, type Stay } from "../guests.ts";
import { formatTime, sanitizeText } from "./format.ts";
import { LABELS, type EntryInput, type GuestInfo, type Photo } from "./types.ts";

export const MAX_TEXT = 4000;
export const MAX_PHOTOS = 4;
// Four of these stay under Vercel's 4.5MB request cap.
export const MAX_PHOTO_BYTES = 1_000_000;
export const TOO_LONG = "That's a lot of words. Trim it a bit.";

export interface RawEntry {
  guest: string;
  iso: string;
  /** "15:20" from <input type="time">. */
  time: string;
  label: string;
  with: string[];
  text: string;
  photos: Photo[];
}

export type Checked =
  | { ok: true; guest: GuestInfo; withGuests: GuestInfo[]; input: EntryInput }
  | { ok: false; error: string };

const fail = (error: string): Checked => ({ ok: false, error });
const several = (name: string) => dogNames(name).length > 1;

function isDate(iso: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(iso)) return false;
  const date = new Date(`${iso}T00:00:00Z`);
  return !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === iso;
}

function isJpeg(photo: Photo): boolean {
  const b = photo.bytes;
  return photo.type === "image/jpeg" && b.length > 3 && b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff;
}

function nearest(stays: Stay[], iso: string): Stay {
  const day = Date.parse(iso);
  const distance = (s: Stay) => Math.min(Math.abs(Date.parse(s.checkIn) - day), Math.abs(Date.parse(s.checkOut) - day));
  return [...stays].sort((a, b) => distance(a) - distance(b))[0];
}

export function validate(raw: RawEntry, guests: GuestInfo[]): Checked {
  const guest = guests.find((g) => g.id === raw.guest);
  if (!guest) return fail("Pick a dog.");

  const time = formatTime(raw.time);
  if (!isDate(raw.iso) || !time) return fail("Pick a day and time.");

  const label = raw.label.trim();
  if (label && !(LABELS as readonly string[]).includes(label)) return fail("Pick a label from the list.");

  const withIds = [...new Set(raw.with.map((id) => id.trim()).filter(Boolean))].filter((id) => id !== guest.id);
  const withGuests = withIds.map((id) => guests.find((g) => g.id === id));
  if (withGuests.some((g) => !g)) return fail("Pick dogs from the list.");

  const text = sanitizeText(raw.text);
  if (!text && raw.photos.length === 0) return fail("Add some words or a photo.");
  if (text.length > MAX_TEXT) return fail(TOO_LONG);
  if (raw.photos.length > MAX_PHOTOS) return fail("Four photos at most.");
  if (!raw.photos.every(isJpeg)) return fail("Can't read this photo. Try a JPEG or a screenshot of it.");
  if (raw.photos.some((p) => p.bytes.length >= MAX_PHOTO_BYTES)) return fail("Photos too big. Try fewer.");

  if (!stayOn(guest, raw.iso)) {
    const here = several(guest.name) ? "are here" : "'s here";
    return fail(`${guest.name}${several(guest.name) ? " " : ""}${here} ${stayLabel(nearest(guest.stays, raw.iso))}. Pick a day in there, or ask Alan to add a stay.`);
  }
  for (const other of withGuests as GuestInfo[]) {
    if (!stayOn(other, raw.iso)) {
      return fail(`${other.name} ${several(other.name) ? "weren't" : "wasn't"} staying on ${fmtDay(raw.iso)}.`);
    }
  }

  return {
    ok: true,
    guest,
    withGuests: withGuests as GuestInfo[],
    input: { guest: guest.id, iso: raw.iso, time, ...(label ? { label } : {}), with: withIds, text, photos: raw.photos },
  };
}
```

- [ ] **Step 4: Run the tests to see them pass**

```bash
cd /Users/alantay/Developer/townergodpawrents-admin && npm test 2>&1 | grep -E "(pass|fail) [0-9]+$"
```

Expected: `fail 0`.

- [ ] **Step 5: Commit**

```bash
cd /Users/alantay/Developer/townergodpawrents-admin && git add src/lib/admin && git commit -m "Add admin entry validation"
```

---
### Task 5: Photo names

**Files:**
- Modify: `src/lib/guests.ts:222` (add `export` to `resolveDay`, nothing else)
- Create: `src/lib/admin/photo-name.ts`
- Test: `src/lib/admin/photo-name.test.ts`

**Interfaces:**
- Consumes: `dogNames(name: string): string[]` from `src/lib/guests.ts`
- Produces:
  - `slugWords(text: string, dogName: string): string[]`: up to three words, lowercased, no stop words, no dog names, or `["photo"]`.
  - `photoName(guestId: string, words: string[], taken: Set<string>): string`: first free `"<guest>-<words>.jpg"`, then `-2`, `-3`. Adds the result to `taken`.
  - `resolveDay(label: string, stays: Stay[], guestId: string): string` is now exported from `guests.ts` (Task 6 uses it).

- [ ] **Step 1: Write the failing tests**

```ts
import assert from "node:assert/strict";
import test from "node:test";
import { photoName, slugWords } from "./photo-name.ts";

test("slugWords keeps the first three words that say something", () => {
  assert.deepEqual(slugWords("Luna stole Weiwen's slipper and ran to the garden", "Luna"), ["stole", "weiwen", "slipper"]);
  assert.deepEqual(slugWords("She's SO proud: zoomies!!", "Luna"), ["proud", "zoomies"]);
});

test("slugWords drops every dog in a pair", () => {
  assert.deepEqual(slugWords("Hugo and Luffy dug a hole", "Hugo & Luffy"), ["dug", "hole"]);
});

test("slugWords copes with accents, emoji and nothing at all", () => {
  assert.deepEqual(slugWords("Café nap 🐶", "Luna"), ["cafe", "nap"]);
  assert.deepEqual(slugWords("", "Luna"), ["photo"]);
  assert.deepEqual(slugWords("Luna!", "Luna"), ["photo"]);
  assert.deepEqual(slugWords("a".repeat(40), "Luna"), ["a".repeat(20)]);
});

test("photoName takes the first free name and claims it", () => {
  const taken = new Set(["luna-stole-slipper.jpg", "luna-stole-slipper-2.jpg"]);
  assert.equal(photoName("luna", ["stole", "slipper"], taken), "luna-stole-slipper-3.jpg");
  assert.equal(taken.has("luna-stole-slipper-3.jpg"), true);
});

test("each photo in an entry gets its own name", () => {
  const taken = new Set<string>();
  const names = [1, 2, 3].map(() => photoName("luna", ["nap"], taken));
  assert.deepEqual(names, ["luna-nap.jpg", "luna-nap-2.jpg", "luna-nap-3.jpg"]);
});
```

- [ ] **Step 2: Run the tests to see them fail**

```bash
cd /Users/alantay/Developer/townergodpawrents-admin && npm test 2>&1 | grep -E "(pass|fail) [0-9]+$|Cannot find"
```

Expected: the run errors with `Cannot find module` for `photo-name.ts`.

- [ ] **Step 3: Export `resolveDay` and write `photo-name.ts`**

In `src/lib/guests.ts`, change line 222 from `function resolveDay(` to:

```ts
export function resolveDay(label: string, stays: Stay[], guestId: string): string {
```

Then create `src/lib/admin/photo-name.ts`:

```ts
// Photo file names in the house style: luna-stole-slipper.jpg. Built from
// the entry's words, never the dog's own name (it's already the prefix).
import { dogNames } from "../guests.ts";

const STOP = new Set([
  "a", "an", "the", "and", "or", "to", "of", "in", "on", "at", "for", "with", "was", "is",
  "she", "he", "her", "his", "it", "so", "very", "just", "then", "we", "i", "my", "our", "us",
  "me", "be", "been", "had", "has", "have", "this", "that", "there", "from", "up", "out", "by",
  "as", "all", "too", "got",
]);

/** Up to three meaningful words from the text, or ["photo"]. */
export function slugWords(text: string, dogName: string): string[] {
  const names = new Set(dogNames(dogName).map((n) => n.toLowerCase()));
  const words = text
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/['’]s\b/g, "")
    .replace(/['’]/g, "")
    .split(/[^a-z0-9]+/)
    .filter((w) => w && !STOP.has(w) && !names.has(w))
    .map((w) => w.slice(0, 20))
    .slice(0, 3);
  return words.length ? words : ["photo"];
}

/** First free "<guest>-<words>.jpg", then -2, -3… Adds the winner to `taken`. */
export function photoName(guestId: string, words: string[], taken: Set<string>): string {
  const base = `${guestId}-${words.join("-")}`;
  let name = `${base}.jpg`;
  for (let n = 2; taken.has(name); n++) name = `${base}-${n}.jpg`;
  taken.add(name);
  return name;
}
```

- [ ] **Step 4: Run the tests to see them pass**

```bash
cd /Users/alantay/Developer/townergodpawrents-admin && npm test 2>&1 | grep -E "(pass|fail) [0-9]+$"
```

Expected: `fail 0`.

- [ ] **Step 5: Commit**

```bash
cd /Users/alantay/Developer/townergodpawrents-admin && git add src/lib/guests.ts src/lib/admin && git commit -m "Add admin photo names"
```

---

### Task 6: Insert an entry into a guest file

**Files:**
- Create: `src/lib/admin/insert-entry.ts`
- Test: `src/lib/admin/insert-entry.test.ts`

**Interfaces:**
- Consumes: `entryMinutes`, `fmtDay`, `resolveDay` (Task 5), `parseDiary`, `type Stay` from `src/lib/guests.ts`; `sanitizeText` (Task 1, tests only)
- Produces:

```ts
export interface NewEntry {
  iso: string;          // "2026-10-16"
  time: string;         // "3:20pm" (already formatted)
  label?: string;
  with: string[];       // guest ids
  text: string;
  images: { alt: string; file: string }[]; // file is a bare name: "luna-slipper.jpg"
  id: string;           // "e042"
}
export function splitFrontmatter(md: string): { frontmatter: string; body: string };
/** Highest eNNN across ALL given files + 1, zero-padded to 3. IDs are global, not per file. */
export function nextId(markdowns: string[]): string;
export function entryBlock(entry: NewEntry, guestId: string): string;
export function insertEntry(markdown: string, entry: NewEntry, stays: Stay[], guestId: string): string;
```

Entry IDs are global: Task 10 reads every guest file and passes them all to `nextId`. A shared entry is copied into the other dog's page with its ID, and the page uses `id="entry-<id>"`, so a per-file ID could clash.

- [ ] **Step 1: Write the failing tests**

```ts
import assert from "node:assert/strict";
import test from "node:test";
import { parseDiary, type Stay } from "../guests.ts";
import { sanitizeText } from "./format.ts";
import { entryBlock, insertEntry, nextId, splitFrontmatter, type NewEntry } from "./insert-entry.ts";

const STAYS: Stay[] = [{ checkIn: "2026-10-13", checkOut: "2026-10-21" }];
const FRONT = `---
name: Luna
stays:
  - checkIn: 2026-10-13
    checkOut: 2026-10-21
---`;
const MD = `${FRONT}

## 16 Oct

### 9:45pm

<!-- entry-id: e098 -->

Supervising from the doorway.

### 12:40pm

<!-- entry-id: e097 -->

Begging for food.

## 14 Oct

### 8am

<!-- entry-id: e090 -->
<!-- label: Throwback -->

![Luna on the sofa](./luna/luna-sofa.jpg)
`;

const ENTRY: NewEntry = { iso: "2026-10-16", time: "3:20pm", with: [], text: "Stole a slipper.", images: [], id: "e099" };
const BLOCK = "### 3:20pm\n\n<!-- entry-id: e099 -->\n\nStole a slipper.";

function insert(over: Partial<NewEntry>, md = MD) {
  return insertEntry(md, { ...ENTRY, ...over }, STAYS, "luna");
}

/** Entry times in file order, day by day, straight from the real parser. */
function shape(md: string) {
  return parseDiary(splitFrontmatter(md).body, STAYS, "luna").map((d) => `${d.label}: ${d.entries.map((e) => e.time).join(", ")}`);
}

test("splitFrontmatter separates the YAML from the diary", () => {
  const { frontmatter, body } = splitFrontmatter(MD);
  assert.equal(frontmatter, FRONT);
  assert.ok(body.startsWith("\n\n## 16 Oct"));
  assert.throws(() => splitFrontmatter("## 16 Oct\n"));
});

test("nextId is one past the highest ID in any guest file", () => {
  assert.equal(nextId([MD, "<!-- entry-id: e081 -->"]), "e099");
  assert.equal(nextId(["<!-- entry-id: e009 -->", `${FRONT}\n`]), "e010");
  assert.equal(nextId([`${FRONT}\n`]), "e001");
});

test("entryBlock writes comments in order, then words, then photos", () => {
  assert.equal(
    entryBlock({ ...ENTRY, with: ["guapo", "bobbi"], label: "Thoughts", images: [{ alt: "Luna", file: "luna-a.jpg" }, { alt: "Guapo", file: "luna-b.jpg" }] }, "luna"),
    "### 3:20pm\n\n<!-- entry-id: e099 -->\n<!-- with: guapo, bobbi -->\n<!-- label: Thoughts -->\n\nStole a slipper.\n\n![Luna](./luna/luna-a.jpg)\n\n![Guapo](./luna/luna-b.jpg)",
  );
  assert.equal(entryBlock({ ...ENTRY, text: "", images: [{ alt: "Luna", file: "luna-a.jpg" }] }, "luna"),
    "### 3:20pm\n\n<!-- entry-id: e099 -->\n\n![Luna](./luna/luna-a.jpg)");
});

test("a new entry lands in time order within its day", () => {
  assert.deepEqual(shape(insert({ time: "10pm" })), ["16 Oct: 10pm, 9:45pm, 12:40pm", "14 Oct: 8am"]);
  assert.deepEqual(shape(insert({})), ["16 Oct: 9:45pm, 3:20pm, 12:40pm", "14 Oct: 8am"]);
  assert.deepEqual(shape(insert({ time: "9am" })), ["16 Oct: 9:45pm, 12:40pm, 9am", "14 Oct: 8am"]);
  assert.deepEqual(shape(insert({ iso: "2026-10-14", time: "7am" })), ["16 Oct: 9:45pm, 12:40pm", "14 Oct: 8am, 7am"]);
});

test("a new day goes in date order, newest first", () => {
  assert.deepEqual(shape(insert({ iso: "2026-10-17" })), ["17 Oct: 3:20pm", "16 Oct: 9:45pm, 12:40pm", "14 Oct: 8am"]);
  assert.deepEqual(shape(insert({ iso: "2026-10-15" })), ["16 Oct: 9:45pm, 12:40pm", "15 Oct: 3:20pm", "14 Oct: 8am"]);
  assert.deepEqual(shape(insert({ iso: "2026-10-13" })), ["16 Oct: 9:45pm, 12:40pm", "14 Oct: 8am", "13 Oct: 3:20pm"]);
});

test("everything else in the file stays byte for byte", () => {
  const block = (time: string) => BLOCK.replace("3:20pm", time);
  assert.equal(insert({ time: "10pm" }).replace(`${block("10pm")}\n\n`, ""), MD);
  assert.equal(insert({}).replace(`${BLOCK}\n\n`, ""), MD);
  assert.equal(insert({ time: "9am" }).replace(`${block("9am")}\n\n`, ""), MD);
  assert.equal(insert({ iso: "2026-10-17" }).replace(`## 17 Oct\n\n${BLOCK}\n\n`, ""), MD);
  assert.equal(insert({ iso: "2026-10-13" }), `${MD}\n## 13 Oct\n\n${BLOCK}\n`);
});

test("a guest with no diary yet gets their first day", () => {
  assert.equal(insert({}, `${FRONT}\n`), `${FRONT}\n\n## 16 Oct\n\n${BLOCK}\n`);
});

test("photos, with and label survive a trip through the parser", () => {
  const md = insert({ with: ["guapo"], label: "Fun fact", images: [{ alt: "Luna with a slipper", file: "luna-stole-slipper.jpg" }] });
  const entry = parseDiary(splitFrontmatter(md).body, STAYS, "luna")[0].entries[1];
  assert.deepEqual(
    { id: entry.id, with: entry.with, label: entry.label, text: entry.text, media: entry.media },
    { id: "e099", with: ["guapo"], label: "Fun fact", text: "Stole a slipper.", media: [{ src: "./luna/luna-stole-slipper.jpg", alt: "Luna with a slipper", kind: "photo" }] },
  );
});

test("hostile words stay words", () => {
  const text = sanitizeText("## 1 Oct\n###\n### 9am\n<!-- entry-id: e001 -->\n![x](./evil.jpg)\nthe end");
  const md = insert({ text });
  assert.deepEqual(shape(md), ["16 Oct: 9:45pm, 3:20pm, 12:40pm", "14 Oct: 8am"]);
  const entry = parseDiary(splitFrontmatter(md).body, STAYS, "luna")[0].entries[1];
  assert.equal(entry.id, "e099");
  assert.deepEqual(entry.media, []);
});
```

- [ ] **Step 2: Run the tests to see them fail**

```bash
cd /Users/alantay/Developer/townergodpawrents-admin && npm test 2>&1 | grep -E "(pass|fail) [0-9]+$|Cannot find"
```

Expected: the run errors with `Cannot find module` for `insert-entry.ts`.

- [ ] **Step 3: Write `insert-entry.ts`**

```ts
// Files a new entry into a guest's markdown the way add-entry.md does by
// hand: right day (adding the "## 16 Oct" divider if needed, newest day
// first), right spot in time order (newest first), next free entry ID.
import { entryMinutes, fmtDay, resolveDay, type Stay } from "../guests.ts";

const FRONTMATTER_RE = /^---\r?\n[\s\S]*?\r?\n---(?=\r?\n|$)/;
// Stricter than the parser's HEADING_RE: one line only.
const HEADING_RE = /^(#{2,3})[ \t]+(\S.*?)[ \t]*$/gm;
const ID_RE = /<!--\s*entry-id:\s*e(\d+)\s*-->/g;

export interface NewEntry {
  iso: string;
  time: string;
  label?: string;
  with: string[];
  text: string;
  images: { alt: string; file: string }[];
  id: string;
}

export function splitFrontmatter(markdown: string): { frontmatter: string; body: string } {
  const m = FRONTMATTER_RE.exec(markdown);
  if (!m) throw new Error("[admin] guest file has no frontmatter");
  return { frontmatter: m[0], body: markdown.slice(m[0].length) };
}

/**
 * IDs are unique across every guest file, not just one: a shared entry is
 * copied into the other dog's page with its ID, and the page uses
 * id="entry-<id>". So pass every guest's markdown.
 */
export function nextId(markdowns: string[]): string {
  let max = 0;
  for (const md of markdowns) for (const m of md.matchAll(ID_RE)) max = Math.max(max, Number(m[1]));
  return `e${String(max + 1).padStart(3, "0")}`;
}

export function entryBlock(entry: NewEntry, guestId: string): string {
  const comments = [
    `<!-- entry-id: ${entry.id} -->`,
    ...(entry.with.length ? [`<!-- with: ${entry.with.join(", ")} -->`] : []),
    ...(entry.label ? [`<!-- label: ${entry.label} -->`] : []),
  ].join("\n");
  return [
    `### ${entry.time}`,
    comments,
    ...(entry.text ? [entry.text] : []),
    ...entry.images.map((img) => `![${img.alt}](./${guestId}/${img.file})`),
  ].join("\n\n");
}

function splice(body: string, at: number, block: string): string {
  const before = body.slice(0, at).trimEnd();
  const after = body.slice(at).trim();
  return [before, block, after].filter(Boolean).join("\n\n");
}

export function insertEntry(markdown: string, entry: NewEntry, stays: Stay[], guestId: string): string {
  const { frontmatter, body } = splitFrontmatter(markdown);
  const heads = [...body.matchAll(HEADING_RE)].map((m) => ({ at: m.index!, level: m[1], title: m[2] }));
  const days = heads
    .filter((h) => h.level === "##")
    .map((h) => {
      try {
        return { ...h, iso: resolveDay(h.title, stays, guestId) };
      } catch {
        return { ...h, iso: undefined };
      }
    });
  const block = entryBlock(entry, guestId);
  const minutes = entryMinutes(entry.time);

  let content: string;
  const day = days.find((d) => d.iso === entry.iso);
  if (day) {
    const end = days.find((d) => d.at > day.at)?.at ?? body.length;
    const later = heads.find((h) => h.level === "###" && h.at > day.at && h.at < end
      && entryMinutes(h.title) >= 0 && entryMinutes(h.title) <= minutes);
    content = splice(body, later?.at ?? end, block);
  } else {
    const older = days.find((d) => d.iso !== undefined && d.iso < entry.iso);
    content = splice(body, older?.at ?? body.length, `## ${fmtDay(entry.iso)}\n\n${block}`);
  }
  return `${frontmatter}\n\n${content.trim()}\n`;
}
```

- [ ] **Step 4: Run the tests to see them pass**

```bash
cd /Users/alantay/Developer/townergodpawrents-admin && npm test 2>&1 | grep -E "(pass|fail) [0-9]+$"
```

Expected: `fail 0`.

- [ ] **Step 5: Commit**

```bash
cd /Users/alantay/Developer/townergodpawrents-admin && git add src/lib/admin && git commit -m "Add admin entry insertion"
```

---

### Task 7: GitHub client

**Files:**
- Create: `src/lib/admin/github.ts`
- Test: `src/lib/admin/github.test.ts`

**Interfaces:**
- Consumes: global `fetch` (injected in tests), `Buffer` (Node, server only)
- Produces:

```ts
export class GitHubError extends Error { status: number }
export interface CommitFile { path: string; content: string | Uint8Array }
export interface GitHub {
  head(): Promise<string>;                                   // branch head sha
  readFile(path: string, sha: string): Promise<string>;
  listDir(path: string, sha: string): Promise<string[]>;     // [] on 404
  commit(parent: string, files: CommitFile[], message: string): Promise<string>; // 422 GitHubError if the branch moved
}
export function gitHub(deps: { token: string; repo: string; branch: string; fetch?: typeof fetch }): GitHub;
```

`commit` follows spec step 6: blobs, tree on the parent's tree, commit with that parent, then `PATCH` the ref with `force: false`.

- [ ] **Step 1: Write the failing tests**

```ts
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
```

- [ ] **Step 2: Run the tests to see them fail**

```bash
cd /Users/alantay/Developer/townergodpawrents-admin && npm test 2>&1 | grep -E "(pass|fail) [0-9]+$|Cannot find"
```

Expected: the run errors with `Cannot find module` for `github.ts`.

- [ ] **Step 3: Write `github.ts`**

```ts
// Just enough of the GitHub REST API to read guest files and land one commit
// on a branch. fetch is injected so tests never touch the network.
export class GitHubError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.name = "GitHubError";
    this.status = status;
  }
}

export interface CommitFile {
  path: string;
  content: string | Uint8Array;
}

export interface GitHub {
  /** The branch's current commit sha. */
  head(): Promise<string>;
  /** File text at that commit. */
  readFile(path: string, sha: string): Promise<string>;
  /** File names in a folder at that commit, [] if the folder doesn't exist. */
  listDir(path: string, sha: string): Promise<string[]>;
  /** One commit on top of `parent`. Fails (422) if the branch moved. */
  commit(parent: string, files: CommitFile[], message: string): Promise<string>;
}

const encodePath = (path: string) => path.split("/").map(encodeURIComponent).join("/");

function base64(content: string | Uint8Array): string {
  return Buffer.from(typeof content === "string" ? new TextEncoder().encode(content) : content).toString("base64");
}

export function gitHub(deps: { token: string; repo: string; branch: string; fetch?: typeof fetch }): GitHub {
  const doFetch = deps.fetch ?? fetch;
  const api = `https://api.github.com/repos/${deps.repo}`;
  const branch = encodePath(deps.branch);

  async function call(method: string, path: string, body?: unknown, accept = "application/vnd.github+json"): Promise<Response> {
    const response = await doFetch(`${api}${path}`, {
      method,
      headers: {
        authorization: `Bearer ${deps.token}`,
        accept,
        "x-github-api-version": "2022-11-28",
        "user-agent": "townergodpawrents-admin",
        ...(body === undefined ? {} : { "content-type": "application/json" }),
      },
      ...(body === undefined ? {} : { body: JSON.stringify(body) }),
    });
    if (!response.ok) {
      throw new GitHubError(response.status, `${method} ${path}: ${response.status} ${await response.text().catch(() => "")}`.trim());
    }
    return response;
  }

  const send = async <T>(method: string, path: string, body?: unknown): Promise<T> =>
    (await call(method, path, body)).json() as Promise<T>;

  return {
    async head() {
      return (await send<{ object: { sha: string } }>("GET", `/git/ref/heads/${branch}`)).object.sha;
    },

    async readFile(path, sha) {
      return (await call("GET", `/contents/${encodePath(path)}?ref=${sha}`, undefined, "application/vnd.github.raw+json")).text();
    },

    async listDir(path, sha) {
      try {
        const items = await send<{ name: string }[]>("GET", `/contents/${encodePath(path)}?ref=${sha}`);
        return Array.isArray(items) ? items.map((item) => item.name) : [];
      } catch (error) {
        if (error instanceof GitHubError && error.status === 404) return [];
        throw error;
      }
    },

    async commit(parent, files, message) {
      const { tree } = await send<{ tree: { sha: string } }>("GET", `/git/commits/${parent}`);
      const blobs = await Promise.all(
        files.map((file) => send<{ sha: string }>("POST", "/git/blobs", { content: base64(file.content), encoding: "base64" })),
      );
      const newTree = await send<{ sha: string }>("POST", "/git/trees", {
        base_tree: tree.sha,
        tree: files.map((file, i) => ({ path: file.path, mode: "100644", type: "blob", sha: blobs[i].sha })),
      });
      const commit = await send<{ sha: string }>("POST", "/git/commits", { message, tree: newTree.sha, parents: [parent] });
      await send("PATCH", `/git/refs/heads/${branch}`, { sha: commit.sha, force: false });
      return commit.sha;
    },
  };
}
```

- [ ] **Step 4: Run the tests to see them pass**

```bash
cd /Users/alantay/Developer/townergodpawrents-admin && npm test 2>&1 | grep -E "(pass|fail) [0-9]+$"
```

Expected: `fail 0`.

- [ ] **Step 5: Commit**

```bash
cd /Users/alantay/Developer/townergodpawrents-admin && git add src/lib/admin && git commit -m "Add admin GitHub client"
```

---

### Task 8: Prompts and the OpenAI client

**Files:**
- Create: `src/lib/admin/prompts.ts`, `src/lib/admin/openai.ts`
- Test: `src/lib/admin/prompts.test.ts`, `src/lib/admin/openai.test.ts`

**Interfaces:**
- Consumes: `cleanAi` (Task 1); `Ai`, `AiContext`, `PolishResult` (Task 4)
- Produces (`prompts.ts`):
  - `interface Message { role: "system" | "user"; content: string | ({ type: "text"; text: string } | { type: "image_url"; image_url: { url: string; detail: "low" } })[] }`
  - `polishRules(addEntryMd: string): string`: section 2 of `add-entry.md`, from `## 2.` up to `## 3.`.
  - `polishMessages(text: string, ctx: AiContext, voice: string, rules: string): Message[]`
  - `altMessages(photo: Uint8Array, ctx: AiContext, text: string): Message[]` (photo sent as a base64 JPEG data URL)
  - `POLISH_SCHEMA`, `ALT_SCHEMA`: JSON schemas for structured output.
- Produces (`openai.ts`):
  - `DEFAULT_MODEL = "gpt-5-mini"`
  - `openAI(deps: { key: string; model?: string; voice: string; rules: string; fetch?: typeof fetch; timeoutMs?: number }): Ai` (timeout default 15000ms; every returned string goes through `cleanAi`)

- [ ] **Step 1: Write the failing tests**

`src/lib/admin/prompts.test.ts`:

```ts
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { ALT_SCHEMA, POLISH_SCHEMA, altMessages, polishMessages, polishRules } from "./prompts.ts";

const CTX = { name: "Luna", withNames: ["Guapo"], recent: ["Supervising from the doorway."] };

test("polishRules takes section 2 of the real add-entry.md", () => {
  const rules = polishRules(readFileSync("docs/agents/add-entry.md", "utf8"));
  assert.match(rules, /^## 2\. Polish the words/);
  assert.match(rules, /every detail kept/);
  assert.doesNotMatch(rules, /## 3\./);
  assert.throws(() => polishRules("# nothing here"));
});

test("polishMessages carries the rules, the voice, the dogs, recent entries and the text", () => {
  const [system, user] = polishMessages("luna stole slipper", CTX, "VOICE RULES", "POLISH RULES");
  assert.equal(system.role, "system");
  assert.match(String(system.content), /POLISH RULES[\s\S]*VOICE RULES/);
  assert.match(String(user.content), /Dogs in this entry: Luna, Guapo/);
  assert.match(String(user.content), /- Supervising from the doorway\./);
  assert.match(String(user.content), /Entry to polish:\nluna stole slipper$/);
});

test("altMessages sends the photo as a low-detail JPEG data URL with the dogs and text", () => {
  const [, user] = altMessages(new Uint8Array([0xff, 0xd8, 0xff]), CTX, "Stole a slipper.");
  const parts = user.content as any[];
  assert.match(parts[0].text, /Dogs: Luna, Guapo/);
  assert.match(parts[0].text, /Stole a slipper\./);
  assert.deepEqual(parts[1].image_url, { url: "data:image/jpeg;base64,/9j/", detail: "low" });
});

test("schemas are strict and list every property as required", () => {
  for (const s of [POLISH_SCHEMA, ALT_SCHEMA]) {
    assert.equal(s.strict, true);
    assert.deepEqual([...s.schema.required].sort(), Object.keys(s.schema.properties).sort());
  }
});
```

`src/lib/admin/openai.test.ts`:

```ts
import assert from "node:assert/strict";
import test from "node:test";
import { openAI } from "./openai.ts";

const CTX = { name: "Luna", withNames: [], recent: [] };

function fake(answer: unknown, status = 200) {
  const bodies: any[] = [];
  const fetch = (async (_url: string, init: RequestInit) => {
    bodies.push(JSON.parse(String(init.body)));
    return new Response(JSON.stringify(answer), { status });
  }) as typeof globalThis.fetch;
  return { bodies, fetch };
}
const reply = (content: unknown) => ({ choices: [{ message: { content: JSON.stringify(content), refusal: null } }] });
const ai = (fetch: typeof globalThis.fetch, model?: string) => openAI({ key: "k", model, voice: "v", rules: "r", fetch });

test("polish asks gpt-5-mini for strict JSON and cleans the dashes out", async () => {
  const { bodies, fetch } = fake(reply({ polished: "Luna stole a slipper — again.", twist: "", rewritten: null, note: "Tense slip – check it." }));
  const result = await ai(fetch).polish("luna stole slipper", CTX);
  assert.deepEqual(result, { polished: "Luna stole a slipper, again.", twist: null, rewritten: null, note: "Tense slip, check it." });
  assert.equal(bodies[0].model, "gpt-5-mini");
  assert.equal(bodies[0].reasoning_effort, "minimal");
  assert.equal(bodies[0].response_format.json_schema.name, "polish");
  assert.equal(bodies[0].max_completion_tokens, 1500);
});

test("a non gpt-5 model gets no reasoning_effort", async () => {
  const { bodies, fetch } = fake(reply({ alt: "Luna asleep on the sofa." }));
  assert.equal(await ai(fetch, "gpt-4.1-mini").altText(new Uint8Array([1]), CTX, ""), "Luna asleep on the sofa.");
  assert.equal(bodies[0].model, "gpt-4.1-mini");
  assert.equal("reasoning_effort" in bodies[0], false);
  assert.equal(bodies[0].max_completion_tokens, 400);
});

test("errors, refusals and empty answers throw", async () => {
  await assert.rejects(ai(fake({ error: "nope" }, 500).fetch).polish("x", CTX));
  await assert.rejects(ai(fake({ choices: [{ message: { content: null, refusal: "no" } }] }).fetch).polish("x", CTX));
  await assert.rejects(ai(fake({ choices: [] }).fetch).altText(new Uint8Array([1]), CTX, ""));
  await assert.rejects(ai(fake(reply({ polished: " — " })).fetch).polish("x", CTX));
});

test("a slow answer times out", async () => {
  const fetch = ((_url: string, init: RequestInit) =>
    new Promise((_resolve, reject) => init.signal!.addEventListener("abort", () => reject(init.signal!.reason)))) as typeof globalThis.fetch;
  await assert.rejects(openAI({ key: "k", voice: "v", rules: "r", fetch, timeoutMs: 20 }).polish("x", CTX));
});
```

- [ ] **Step 2: Run the tests to see them fail**

```bash
cd /Users/alantay/Developer/townergodpawrents-admin && npm test 2>&1 | grep -E "(pass|fail) [0-9]+$|Cannot find"
```

Expected: the run errors with `Cannot find module` for `prompts.ts` and `openai.ts`.

- [ ] **Step 3: Write `prompts.ts` and `openai.ts`**

`src/lib/admin/prompts.ts`:

```ts
// The words we send OpenAI. Polish rules come from docs/agents/add-entry.md
// section 2 and the voice from docs/agents/voice.md, so they live in one place.
import type { AiContext } from "./types.ts";

export interface Message {
  role: "system" | "user";
  content: string | ({ type: "text"; text: string } | { type: "image_url"; image_url: { url: string; detail: "low" } })[];
}

/** Section 2 of add-entry.md, from its heading up to section 3. */
export function polishRules(addEntryMd: string): string {
  const start = addEntryMd.indexOf("## 2.");
  const end = addEntryMd.indexOf("## 3.", start);
  if (start < 0 || end < 0) throw new Error("[admin] add-entry.md has no section 2");
  return addEntryMd.slice(start, end).trim();
}

const names = (ctx: AiContext) => [ctx.name, ...ctx.withNames].join(", ");

export function polishMessages(text: string, ctx: AiContext, voice: string, rules: string): Message[] {
  const system = [
    "You polish diary entries for a small personal website about dogs staying with Alan and Weiwen in Singapore.",
    "Follow these rules exactly. Where they say \"in chat\" or \"wait for his pick\", the app shows your options as cards and the writer picks.",
    rules,
    "The house voice:",
    voice,
    "Answer in JSON. polished: grammar fixed, every detail kept, no jokes. twist: one funnier rewording, or null. rewritten: better flow, every detail kept, or null. note: one short line if you spot a POV or tense slip, else null.",
    "Never use em dashes or en dashes as punctuation. Never use \"lah\".",
  ].join("\n\n");
  const recent = ctx.recent.length ? `Recent entries, for tone only:\n${ctx.recent.map((r) => `- ${r}`).join("\n")}\n\n` : "";
  return [
    { role: "system", content: system },
    { role: "user", content: `Dogs in this entry: ${names(ctx)}\n\n${recent}Entry to polish:\n${text}` },
  ];
}

export function altMessages(photo: Uint8Array, ctx: AiContext, text: string): Message[] {
  return [
    {
      role: "system",
      content: "Write alt text for a photo on a dog diary website. A plain description of what is in the photo. Name the dogs by name. No jokes. Don't start with \"image of\" or \"photo of\". Under 20 words. No dashes. Answer in JSON.",
    },
    {
      role: "user",
      content: [
        { type: "text", text: `Dogs: ${names(ctx)}\nThe diary entry: ${text || "(no words, just photos)"}` },
        { type: "image_url", image_url: { url: `data:image/jpeg;base64,${Buffer.from(photo).toString("base64")}`, detail: "low" } },
      ],
    },
  ];
}

const nullableString = { type: ["string", "null"] };

export const POLISH_SCHEMA = {
  name: "polish",
  strict: true,
  schema: {
    type: "object",
    additionalProperties: false,
    required: ["polished", "twist", "rewritten", "note"],
    properties: { polished: { type: "string" }, twist: nullableString, rewritten: nullableString, note: nullableString },
  },
};

export const ALT_SCHEMA = {
  name: "alt_text",
  strict: true,
  schema: {
    type: "object",
    additionalProperties: false,
    required: ["alt"],
    properties: { alt: { type: "string" } },
  },
};
```

`src/lib/admin/openai.ts`:

```ts
// OpenAI Chat Completions with a JSON schema, for polish and alt text. fetch
// is injected so tests never call the API. Every answer goes through cleanAi.
import { cleanAi } from "./clean-ai.ts";
import { ALT_SCHEMA, POLISH_SCHEMA, altMessages, polishMessages, type Message } from "./prompts.ts";
import type { Ai, AiContext, PolishResult } from "./types.ts";

export const DEFAULT_MODEL = "gpt-5-mini";

export function openAI(deps: {
  key: string;
  model?: string;
  voice: string;
  rules: string;
  fetch?: typeof fetch;
  timeoutMs?: number;
}): Ai {
  const doFetch = deps.fetch ?? fetch;
  const model = deps.model || DEFAULT_MODEL;
  const timeoutMs = deps.timeoutMs ?? 15_000;

  async function ask(messages: Message[], schema: object, maxTokens: number): Promise<Record<string, unknown>> {
    const response = await doFetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: { authorization: `Bearer ${deps.key}`, "content-type": "application/json" },
      body: JSON.stringify({
        model,
        messages,
        response_format: { type: "json_schema", json_schema: schema },
        max_completion_tokens: maxTokens,
        ...(model.startsWith("gpt-5") ? { reasoning_effort: "minimal" } : {}),
      }),
      signal: AbortSignal.timeout(timeoutMs),
    });
    if (!response.ok) throw new Error(`[admin] OpenAI ${response.status}: ${await response.text().catch(() => "")}`);
    const message = (await response.json())?.choices?.[0]?.message;
    if (message?.refusal) throw new Error(`[admin] OpenAI refused: ${message.refusal}`);
    if (!message?.content) throw new Error("[admin] OpenAI sent nothing back");
    return JSON.parse(message.content);
  }

  const clean = (value: unknown): string | null => {
    if (typeof value !== "string") return null;
    return cleanAi(value) || null;
  };

  return {
    async polish(text: string, ctx: AiContext): Promise<PolishResult> {
      const answer = await ask(polishMessages(text, ctx, deps.voice, deps.rules), POLISH_SCHEMA, 1500);
      const polished = clean(answer.polished);
      if (!polished) throw new Error("[admin] OpenAI polish came back empty");
      return { polished, twist: clean(answer.twist), rewritten: clean(answer.rewritten), note: clean(answer.note) };
    },

    async altText(photo: Uint8Array, ctx: AiContext, text: string): Promise<string> {
      const answer = await ask(altMessages(photo, ctx, text), ALT_SCHEMA, 400);
      const alt = clean(answer.alt);
      if (!alt) throw new Error("[admin] OpenAI alt text came back empty");
      return alt;
    },
  };
}
```

- [ ] **Step 4: Run the tests to see them pass**

```bash
cd /Users/alantay/Developer/townergodpawrents-admin && npm test 2>&1 | grep -E "(pass|fail) [0-9]+$"
```

Expected: `fail 0`.

- [ ] **Step 5: Commit**

```bash
cd /Users/alantay/Developer/townergodpawrents-admin && git add src/lib/admin && git commit -m "Add admin OpenAI prompts and client"
```

---

### Task 9: Polish endpoint logic

**Files:**
- Create: `src/lib/admin/polish-api.ts`
- Test: `src/lib/admin/polish-api.test.ts`

**Interfaces:**
- Consumes: `requireAuth`, `COOKIE` (Task 3); `json` (Task 3, `http.ts`); `Ai`, `GuestInfo` (Task 4); `MAX_TEXT`, `TOO_LONG` (Task 4); `sign` (Task 2, tests)
- Produces: `polishApi(deps: { secret: string | undefined; guests: () => Promise<GuestInfo[]>; ai: () => Ai; now?: () => number }): { polish(request: Request): Promise<Response> }`
  - Body: JSON `{ guest, with, text }`. Returns the `PolishResult` JSON, or `{ error }` with 400 (bad input), 401 (no cookie) or 502 (AI failed or `ai()` threw).

- [ ] **Step 1: Write the failing tests**

```ts
import assert from "node:assert/strict";
import test from "node:test";
import { COOKIE } from "./auth.ts";
import { polishApi } from "./polish-api.ts";
import { sign } from "./session.ts";
import type { Ai, AiContext, GuestInfo } from "./types.ts";

const SECRET = "s".repeat(32);
const NOW = 1_800_000_000_000;
const GUESTS: GuestInfo[] = [
  { id: "luna", name: "Luna", stays: [], recent: ["Supervising from the doorway."] },
  { id: "guapo", name: "Guapo", stays: [], recent: [] },
];
const RESULT = { polished: "Luna stole a slipper.", twist: null, rewritten: null, note: null };

function setup(ai: Partial<Ai> = {}) {
  const seen: { text: string; ctx: AiContext }[] = [];
  const api = polishApi({
    secret: SECRET,
    now: () => NOW,
    guests: async () => GUESTS,
    ai: () => ({
      polish: async (text, ctx) => { seen.push({ text, ctx }); return RESULT; },
      altText: async () => "",
      ...ai,
    }),
  });
  const send = (body: unknown, authed = true) =>
    api.polish(new Request("https://example.test/api/admin/polish", {
      method: "POST",
      headers: { "content-type": "application/json", ...(authed ? { cookie: `${COOKIE}=${sign(NOW + 1000, SECRET)}` } : {}) },
      body: JSON.stringify(body),
    }));
  return { seen, send };
}

test("no cookie, no polish", async () => {
  const { seen, send } = setup();
  assert.equal((await send({ guest: "luna", text: "hi" }, false)).status, 401);
  assert.equal(seen.length, 0);
});

test("returns the options and passes the dogs and recent entries along", async () => {
  const { seen, send } = setup();
  const response = await send({ guest: "luna", with: ["guapo", "luna", "nobody"], text: "  luna stole slipper " });
  assert.equal(response.status, 200);
  assert.deepEqual(await response.json(), RESULT);
  assert.deepEqual(seen, [{ text: "luna stole slipper", ctx: { name: "Luna", withNames: ["Guapo"], recent: ["Supervising from the doorway."] } }]);
});

test("bad requests say what's missing", async () => {
  const { send } = setup();
  const error = async (body: unknown) => (await (await send(body)).json()).error;
  assert.equal(await error({ guest: "nobody", text: "hi" }), "Pick a dog.");
  assert.equal(await error({ guest: "luna", text: "   " }), "Add some words first.");
  assert.equal(await error({ guest: "luna", text: "x".repeat(4001) }), "That's a lot of words. Trim it a bit.");
  assert.equal(await error("not an object"), "Pick a dog.");
});

test("an AI failure is a 502 with the reassuring message", async () => {
  const { send } = setup({ polish: async () => { throw new Error("timeout"); } });
  const response = await send({ guest: "luna", text: "hi" });
  assert.equal(response.status, 502);
  assert.equal((await response.json()).error, "Polish didn't work this time. Your words are still here.");
});
```

- [ ] **Step 2: Run the tests to see them fail**

```bash
cd /Users/alantay/Developer/townergodpawrents-admin && npm test 2>&1 | grep -E "(pass|fail) [0-9]+$|Cannot find"
```

Expected: the run errors with `Cannot find module` for `polish-api.ts`.

- [ ] **Step 3: Write `polish-api.ts`**

```ts
// POST /api/admin/polish: { guest, with, text } → polish options. A failure
// never loses the words; the page keeps them.
import { requireAuth } from "./auth.ts";
import { json } from "./http.ts";
import type { Ai, GuestInfo } from "./types.ts";
import { MAX_TEXT, TOO_LONG } from "./validate.ts";

export function polishApi(deps: { secret: string | undefined; guests: () => Promise<GuestInfo[]>; ai: () => Ai; now?: () => number }) {
  return {
    async polish(request: Request): Promise<Response> {
      const denied = requireAuth(request, deps.secret, deps.now?.());
      if (denied) return denied;

      const body = await request.json().catch(() => ({}));
      const guests = await deps.guests();
      const guest = guests.find((g) => g.id === body?.guest);
      if (!guest) return json({ error: "Pick a dog." }, 400);
      const text = typeof body.text === "string" ? body.text.trim() : "";
      if (!text) return json({ error: "Add some words first." }, 400);
      if (text.length > MAX_TEXT) return json({ error: TOO_LONG }, 400);
      const withNames = (Array.isArray(body.with) ? body.with : [])
        .map((id: unknown) => guests.find((g) => g.id === id && g.id !== guest.id)?.name)
        .filter(Boolean) as string[];

      try {
        return json(await deps.ai().polish(text, { name: guest.name, withNames, recent: guest.recent }));
      } catch (error) {
        console.error("[admin] polish failed", error);
        return json({ error: "Polish didn't work this time. Your words are still here." }, 502);
      }
    },
  };
}
```

- [ ] **Step 4: Run the tests to see them pass**

```bash
cd /Users/alantay/Developer/townergodpawrents-admin && npm test 2>&1 | grep -E "(pass|fail) [0-9]+$"
```

Expected: `fail 0`.

- [ ] **Step 5: Commit**

```bash
cd /Users/alantay/Developer/townergodpawrents-admin && git add src/lib/admin && git commit -m "Add admin polish endpoint logic"
```

---

### Task 10: Post endpoint logic

**Files:**
- Create: `src/lib/admin/post-entry.ts`
- Test: `src/lib/admin/post-entry.test.ts`

**Interfaces:**
- Consumes: `requireAuth`, `COOKIE` (Task 3); `json`; `KeyStore`, `memoryStore` (Task 2); `fallbackAlt`, `sanitizeAlt` (Task 1); `validate` (Task 4); `slugWords`, `photoName` (Task 5); `insertEntry`, `nextId` (Task 6); `GitHub`, `GitHubError` (Task 7); `Ai` (Task 4)
- Produces: `postApi(deps: { secret: string | undefined; guests: () => Promise<GuestInfo[]>; ai: () => Ai; gitHub: () => GitHub; store: () => KeyStore; now?: () => number }): { post(request: Request): Promise<Response> }`
  - Body: `multipart/form-data` with `postKey` (8–100 chars of `[A-Za-z0-9-]`, the page sends `crypto.randomUUID()`), `guest`, `iso`, `time` (`"15:20"`), `label`, `with` (repeated), `text`, `photos` (repeated JPEG files).
  - Success: `{ ok: true, url: "/guests/<guest>" }`. A repeated `postKey` returns the stored success, no second commit.
  - Errors: `{ error }` with 400, 401, 409 (same key still posting: "Still posting. Give it a moment."), 413 or 502 ("Couldn't save it. Nothing was posted. Try again.").
  - Flow: alt text in parallel once, then up to two attempts of head → read all guest files → `nextId` over all of them (global IDs) → `insertEntry` → `listDir` → `photoName` → `commit`. Redis failures are logged and the post goes ahead unguarded.

- [ ] **Step 1: Write the failing tests**

```ts
import assert from "node:assert/strict";
import test from "node:test";
import { parseDiary } from "../guests.ts";
import { COOKIE } from "./auth.ts";
import { GitHubError, type CommitFile, type GitHub } from "./github.ts";
import { postApi } from "./post-entry.ts";
import { sign } from "./session.ts";
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
```

- [ ] **Step 2: Run the tests to see them fail**

```bash
cd /Users/alantay/Developer/townergodpawrents-admin && npm test 2>&1 | grep -E "(pass|fail) [0-9]+$|Cannot find"
```

Expected: the run errors with `Cannot find module` for `post-entry.ts`.

- [ ] **Step 3: Write `post-entry.ts`**

```ts
// POST /api/admin/post: check, write alt text, file the entry, one commit.
// The order matters: nothing is written until everything is checked, and a
// post key stops a double tap from posting twice.
import { requireAuth } from "./auth.ts";
import { fallbackAlt, sanitizeAlt } from "./format.ts";
import type { GitHub } from "./github.ts";
import { json } from "./http.ts";
import { insertEntry, nextId } from "./insert-entry.ts";
import { photoName, slugWords } from "./photo-name.ts";
import type { KeyStore } from "./store.ts";
import type { Ai, GuestInfo, Photo } from "./types.ts";
import { validate } from "./validate.ts";

const GUESTS_DIR = "src/content/guests";
const MAX_BODY = 4_500_000;
const KEY_RE = /^[A-Za-z0-9-]{8,100}$/;
const PENDING = "pending";
const PENDING_SECONDS = 300;
const DONE_SECONDS = 86_400;
const BAD_SEND = "That didn't send properly. Try again.";
const NOT_SAVED = "Couldn't save it. Nothing was posted. Try again.";

export function postApi(deps: {
  secret: string | undefined;
  guests: () => Promise<GuestInfo[]>;
  ai: () => Ai;
  gitHub: () => GitHub;
  store: () => KeyStore;
  now?: () => number;
}) {
  return {
    async post(request: Request): Promise<Response> {
      const denied = requireAuth(request, deps.secret, deps.now?.());
      if (denied) return denied;
      if (Number(request.headers.get("content-length") ?? 0) > MAX_BODY) return json({ error: "Photos too big. Try fewer." }, 413);

      const form = await request.formData().catch(() => undefined);
      if (!form) return json({ error: BAD_SEND }, 400);
      const postKey = String(form.get("postKey") ?? "");
      if (!KEY_RE.test(postKey)) return json({ error: BAD_SEND }, 400);

      const photos: Photo[] = [];
      for (const value of form.getAll("photos")) {
        if (typeof value === "string") continue;
        photos.push({ bytes: new Uint8Array(await value.arrayBuffer()), type: value.type });
      }
      const field = (name: string) => String(form.get(name) ?? "");
      const checked = validate(
        {
          guest: field("guest"),
          iso: field("iso"),
          time: field("time"),
          label: field("label"),
          with: form.getAll("with").map(String),
          text: field("text"),
          photos,
        },
        await deps.guests(),
      );
      if (!checked.ok) return json({ error: checked.error }, 400);
      const { guest, withGuests, input } = checked;

      // The double-tap guard. If Redis is down we post anyway, unguarded.
      const key = `admin-post:${postKey}`;
      let guarded = true;
      try {
        if (!(await deps.store().setNX(key, PENDING, PENDING_SECONDS))) {
          const earlier = await deps.store().get(key);
          if (earlier?.startsWith("/")) return json({ ok: true, url: earlier });
          return json({ error: "Still posting. Give it a moment." }, 409);
        }
      } catch (error) {
        console.error("[admin] post key unavailable", error);
        guarded = false;
      }

      const ctx = { name: guest.name, withNames: withGuests.map((g) => g.name), recent: guest.recent };
      const fallback = fallbackAlt(guest.name, input.iso, input.time);
      const alts = await Promise.all(
        input.photos.map(async (photo) => {
          try {
            return sanitizeAlt(await deps.ai().altText(photo.bytes, ctx, input.text), fallback);
          } catch (error) {
            console.error("[admin] alt text failed", error);
            return fallback;
          }
        }),
      );
      const words = slugWords(input.text, guest.name);
      const url = `/guests/${guest.id}`;

      // Read everything fresh at the branch head, so a retry after the branch
      // moved files the entry against what's really there.
      async function attempt(): Promise<void> {
        const gh = deps.gitHub();
        const head = await gh.head();
        const files = (await gh.listDir(GUESTS_DIR, head)).filter((name) => name.endsWith(".md"));
        const own = `${guest.id}.md`;
        if (!files.includes(own)) files.push(own);
        const markdowns = await Promise.all(files.map((name) => gh.readFile(`${GUESTS_DIR}/${name}`, head)));
        const taken = new Set(await gh.listDir(`${GUESTS_DIR}/${guest.id}`, head));
        const images = input.photos.map((_, i) => ({ alt: alts[i], file: photoName(guest.id, words, taken) }));
        const markdown = insertEntry(
          markdowns[files.indexOf(own)],
          { iso: input.iso, time: input.time, label: input.label, with: input.with, text: input.text, images, id: nextId(markdowns) },
          guest.stays,
          guest.id,
        );
        await gh.commit(
          head,
          [
            { path: `${GUESTS_DIR}/${own}`, content: markdown },
            ...images.map((img, i) => ({ path: `${GUESTS_DIR}/${guest.id}/${img.file}`, content: input.photos[i].bytes })),
          ],
          `Add ${guest.name} ${input.time} ${words.join(" ")} entry (via admin)`,
        );
      }

      try {
        await attempt().catch(() => attempt());
      } catch (error) {
        console.error("[admin] commit failed", error);
        if (guarded) await deps.store().del(key).catch(() => {});
        return json({ error: NOT_SAVED }, 502);
      }

      if (guarded) await deps.store().set(key, url, DONE_SECONDS).catch(() => {});
      return json({ ok: true, url });
    },
  };
}
```

- [ ] **Step 4: Run the tests to see them pass**

```bash
cd /Users/alantay/Developer/townergodpawrents-admin && npm test 2>&1 | grep -E "(pass|fail) [0-9]+$"
```

Expected: `fail 0`.

- [ ] **Step 5: Commit**

```bash
cd /Users/alantay/Developer/townergodpawrents-admin && git add src/lib/admin && git commit -m "Add admin post endpoint logic"
```

---

### Task 11: Server glue and API routes

**Files:**
- Create: `src/lib/admin/server.ts`
- Create: `src/pages/api/admin/login.ts`, `logout.ts`, `polish.ts`, `post.ts`
- Modify: `.env.example`

**Interfaces:**
- Consumes: everything from Tasks 1–10; `getCollection` from `astro:content`; `getSecret` from `astro:env/server`; `Redis` from `@upstash/redis`; `dateStr`, `parseDiary`, `type Stay` from `src/lib/guests.ts`; `docs/agents/add-entry.md` and `docs/agents/voice.md` as `?raw` strings
- Produces (used by the routes and by `admin.astro` in Task 12):
  - `adminGuests(): Promise<GuestInfo[]>`: `recent` is the dog's first 3 non-empty entry texts, newest first.
  - `authed(request: Request): boolean`
  - `login()`, `polish()`, `post()`: the wired `loginApi`, `polishApi`, `postApi`.
  - `clientIp(request: Request, clientAddress: () => string): string`
  - Env vars read: `ADMIN_PASSPHRASE`, `ADMIN_SECRET`, `GITHUB_TOKEN`, `OPENAI_API_KEY`, `OPENAI_MODEL`, `ADMIN_BRANCH`, and the Redis pair `KV_REST_API_URL`/`KV_REST_API_TOKEN` (falling back to `UPSTASH_REDIS_REST_URL`/`UPSTASH_REDIS_REST_TOKEN`, same as `src/pages/api/reactions.ts`).

This file has no unit tests: it is only wiring. The build (Step 4) and the curl checks (Step 5) cover it. `getSecret` works with no `env.schema` in `astro.config.mjs`; don't add one.

- [ ] **Step 1: Write `server.ts`**

```ts
// The only admin file that knows about Astro and env vars. Routes and the
// page call these; everything else is plain, tested code.
import { getCollection } from "astro:content";
import { getSecret } from "astro:env/server";
import { Redis } from "@upstash/redis";
import addEntryMd from "../../../docs/agents/add-entry.md?raw";
import voiceMd from "../../../docs/agents/voice.md?raw";
import { dateStr, parseDiary, type Stay } from "../guests.ts";
import { isAuthed, loginApi } from "./auth.ts";
import { gitHub, type GitHub } from "./github.ts";
import { openAI } from "./openai.ts";
import { polishApi } from "./polish-api.ts";
import { postApi } from "./post-entry.ts";
import { polishRules } from "./prompts.ts";
import { redisStore, type KeyStore } from "./store.ts";
import type { Ai, GuestInfo } from "./types.ts";

const REPO = "alantay/townergodpawrents";

const guestList = getCollection("guests").then((guests) =>
  guests.map((guest): GuestInfo => {
    const stays: Stay[] = guest.data.stays.map((stay) => ({ checkIn: dateStr(stay.checkIn), checkOut: dateStr(stay.checkOut) }));
    const recent = parseDiary(guest.body ?? "", stays, guest.id)
      .flatMap((day) => day.entries.map((entry) => entry.text))
      .filter(Boolean)
      .slice(0, 3);
    return { id: guest.id, name: guest.data.name, stays, recent };
  }),
);

export const adminGuests = (): Promise<GuestInfo[]> => guestList;

let redis: Redis | undefined;
function store(): KeyStore {
  // Same variables as src/pages/api/reactions.ts.
  const url = getSecret("KV_REST_API_URL") ?? getSecret("UPSTASH_REDIS_REST_URL");
  const token = getSecret("KV_REST_API_TOKEN") ?? getSecret("UPSTASH_REDIS_REST_TOKEN");
  if (!url || !token) throw new Error("[admin] Redis isn't configured");
  redis ??= new Redis({ url, token });
  return redisStore(redis);
}

function gh(): GitHub {
  const token = getSecret("GITHUB_TOKEN");
  if (!token) throw new Error("[admin] GITHUB_TOKEN isn't set");
  return gitHub({ token, repo: REPO, branch: getSecret("ADMIN_BRANCH") || "main" });
}

function ai(): Ai {
  const key = getSecret("OPENAI_API_KEY");
  if (!key) throw new Error("[admin] OPENAI_API_KEY isn't set");
  return openAI({ key, model: getSecret("OPENAI_MODEL"), voice: voiceMd, rules: polishRules(addEntryMd) });
}

const secret = () => getSecret("ADMIN_SECRET");

export const authed = (request: Request) => isAuthed(request, secret());
export const login = () => loginApi({ passphrase: getSecret("ADMIN_PASSPHRASE"), secret: secret(), store });
export const polish = () => polishApi({ secret: secret(), guests: adminGuests, ai });
export const post = () => postApi({ secret: secret(), guests: adminGuests, ai, gitHub: gh, store });

/** Vercel gives clientAddress; fall back to the forwarded header. */
export function clientIp(request: Request, clientAddress: () => string): string {
  try {
    return clientAddress();
  } catch {
    return request.headers.get("x-forwarded-for")?.split(",")[0].trim() || "unknown";
  }
}
```

- [ ] **Step 2: Write the four routes**

Route files import without the `.ts` extension, like `src/pages/api/reactions.ts`.

`src/pages/api/admin/login.ts`:

```ts
import type { APIRoute } from "astro";
import { clientIp, login } from "../../../lib/admin/server";

export const prerender = false;

export const POST: APIRoute = (context) => login().login(context.request, clientIp(context.request, () => context.clientAddress));
```

`src/pages/api/admin/logout.ts`:

```ts
import type { APIRoute } from "astro";
import { login } from "../../../lib/admin/server";

export const prerender = false;

export const POST: APIRoute = ({ request }) => login().logout(request);
```

`src/pages/api/admin/polish.ts`:

```ts
import type { APIRoute } from "astro";
import { polish } from "../../../lib/admin/server";

export const prerender = false;

export const POST: APIRoute = ({ request }) => polish().polish(request);
```

`src/pages/api/admin/post.ts`:

```ts
import type { APIRoute } from "astro";
import { post } from "../../../lib/admin/server";

export const prerender = false;

export const POST: APIRoute = ({ request }) => post().post(request);
```

- [ ] **Step 3: List the new variables in `.env.example`**

Append to `.env.example` (names only, no values):

```
ADMIN_PASSPHRASE=
ADMIN_SECRET=
GITHUB_TOKEN=
OPENAI_API_KEY=
OPENAI_MODEL=
ADMIN_BRANCH=
```

- [ ] **Step 4: Type-check, test and build**

```bash
cd /Users/alantay/Developer/townergodpawrents-admin && npx tsc --noEmit -p . && npm test 2>&1 | grep -E "(pass|fail) [0-9]+$" && npm run build 2>&1 | tail -5
```

Expected: no tsc output, `fail 0`, and the build ends with `Complete!`.

- [ ] **Step 5: Smoke test the routes with curl**

Make a throwaway `.env` (gitignored) with test values only. No Redis, GitHub or OpenAI values: that also checks Review Focus 3 (login works without Redis).

```bash
cd /Users/alantay/Developer/townergodpawrents-admin && printf 'ADMIN_PASSPHRASE=towner test\nADMIN_SECRET=dev-only-secret-0123456789\n' > .env && npx astro dev --background && sleep 5 && npx astro dev status
```

Then, with `B=http://localhost:4321` (use the port `status` printed). zsh doesn't split variables, so pass each header on its own:

```bash
B=http://localhost:4321; O="Origin: $B"
curl -s -o /dev/null -w "%{http_code} %{redirect_url}\n" -H "$O" -d "passphrase=nope" $B/api/admin/login
curl -s -o /dev/null -w "%{http_code} %{redirect_url}\n" -H "$O" --data-urlencode "passphrase=towner test " -c /tmp/admin-jar $B/api/admin/login
curl -s -b /tmp/admin-jar $B/admin | grep -o 'id="post"\|id="dogs"\|id="go"\|Log out' | sort -u
curl -s -o /dev/null -w "%{http_code}\n" -H "$O" -H "content-type: application/json" -d '{"guest":"luna","text":"hi"}' $B/api/admin/polish
curl -s -b /tmp/admin-jar -H "$O" -H "content-type: application/json" -d '{"guest":"nobody","text":"hi"}' $B/api/admin/polish
curl -s -b /tmp/admin-jar -H "$O" -F postKey=short -F guest=luna $B/api/admin/post
curl -sI $B/admin | grep -i "cache-control\|x-robots-tag"
```

Expected, line by line:
1. `303 http://localhost:4321/admin?error=wrong`
2. `303 http://localhost:4321/admin` (the trailing space still logs in, Review Focus 4)
3. `Log out`, `id="dogs"`, `id="go"`, `id="post"` (only after Task 12 adds the page; before that, a 404 is fine, skip this line)
4. `401`
5. `{"error":"Pick a dog."}`
6. `{"error":"That didn't send properly. Try again."}`
7. `cache-control: no-store` and `x-robots-tag: noindex` (also Task 12)

Leave the dev server and `.env` for Task 12.

- [ ] **Step 6: Check no secret reached the build output**

```bash
cd /Users/alantay/Developer/townergodpawrents-admin && npm run build >/dev/null 2>&1; grep -rl "towner test\|dev-only-secret" .vercel/output dist 2>/dev/null; echo "exit $?"
```

Expected: no file names, then `exit 1` (grep found nothing). If a file is listed, a secret is being inlined: something is using `import.meta.env` instead of `getSecret`. Fix that before going on.

- [ ] **Step 5: Commit**

```bash
cd /Users/alantay/Developer/townergodpawrents-admin && git add .env.example src/lib/admin/server.ts src/pages/api/admin && git commit -m "Add admin API routes"
```

---

### Task 12: The page

**Files:**
- Create: `src/lib/admin/form.ts`
- Test: `src/lib/admin/form.test.ts`
- Create: `src/pages/admin.astro`
- Create: `src/scripts/admin.ts`

**Interfaces:**
- Consumes: `stayOn`, `type Stay` from `src/lib/guests.ts` (browser-safe: `guests.ts` has no imports); `adminGuests`, `authed` (Task 11); `LABELS` (Task 4); `POST /api/admin/polish` (Task 9) and `POST /api/admin/post` (Task 10) request and response shapes
- Produces (`form.ts`, browser and test):
  - `interface FormGuest { id: string; name: string; stays: Stay[] }`
  - `dogsOn(guests: FormGuest[], iso: string): FormGuest[]`: dogs whose stay covers the day, check-in and check-out days included.
  - `nowSGT(now?: Date): { iso: string; time: string }`: today and now in Singapore (UTC+8), e.g. `{ iso: "2026-10-17", time: "00:30" }`.

The page is its own HTML shell, not `Layout.astro`, so none of the site's reload or reaction scripts run on it. CSS follows the approved mockup, mapped to the site's tokens (`var(--color-*)`, `var(--font-archivo)`, `var(--font-instrument-serif)`) from `src/styles/global.css`.

- [ ] **Step 1: Write the failing tests**

```ts
import assert from "node:assert/strict";
import test from "node:test";
import { dogsOn, nowSGT } from "./form.ts";

const GUESTS = [
  { id: "luna", name: "Luna", stays: [{ checkIn: "2026-10-13", checkOut: "2026-10-21" }] },
  { id: "guapo", name: "Guapo", stays: [{ checkIn: "2026-10-15", checkOut: "2026-10-18" }] },
];

test("dogsOn keeps dogs staying that day, check-in and check-out days included", () => {
  assert.deepEqual(dogsOn(GUESTS, "2026-10-16").map((g) => g.id), ["luna", "guapo"]);
  assert.deepEqual(dogsOn(GUESTS, "2026-10-13").map((g) => g.id), ["luna"]);
  assert.deepEqual(dogsOn(GUESTS, "2026-10-18").map((g) => g.id), ["luna", "guapo"]);
  assert.deepEqual(dogsOn(GUESTS, "2026-10-22"), []);
});

test("nowSGT is Singapore time, rolling over midnight", () => {
  assert.deepEqual(nowSGT(new Date("2026-10-16T07:20:00Z")), { iso: "2026-10-16", time: "15:20" });
  assert.deepEqual(nowSGT(new Date("2026-10-16T16:30:00Z")), { iso: "2026-10-17", time: "00:30" });
});
```

- [ ] **Step 2: Run the tests to see them fail**

```bash
cd /Users/alantay/Developer/townergodpawrents-admin && npm test 2>&1 | grep -E "(pass|fail) [0-9]+$|Cannot find"
```

Expected: the run errors with `Cannot find module` for `form.ts`.

- [ ] **Step 3: Write `form.ts`, `admin.astro` and `admin.ts`**

`src/lib/admin/form.ts`:

```ts
// Pure helpers for the post form in the browser (src/scripts/admin.ts).
import { stayOn, type Stay } from "../guests.ts";

export interface FormGuest {
  id: string;
  name: string;
  stays: Stay[];
}

/** Dogs with a stay covering the day, in the order given. */
export function dogsOn(guests: FormGuest[], iso: string): FormGuest[] {
  return guests.filter((g) => stayOn(g, iso));
}

/** Today and now in Singapore, shaped for <input type="date"> and <input type="time">. */
export function nowSGT(now: Date = new Date()): { iso: string; time: string } {
  const sgt = new Date(now.getTime() + 8 * 60 * 60 * 1000).toISOString();
  return { iso: sgt.slice(0, 10), time: sgt.slice(11, 16) };
}
```

`src/pages/admin.astro`:

```astro
---
// Posting page for Alan and Weiwen. Rendered on demand so it can check the
// login cookie. Its own shell: none of the site's reload or reaction scripts.
import { Font } from "astro:assets";
import "../styles/global.css";
import { adminGuests, authed } from "../lib/admin/server";
import { LABELS } from "../lib/admin/types";

export const prerender = false;

Astro.response.headers.set("cache-control", "no-store");
Astro.response.headers.set("x-robots-tag", "noindex");

const loggedIn = await authed(Astro.request);
const params = Astro.url.searchParams;
const loginError =
  params.get("error") === "wrong" ? "That's not it."
  : params.get("error") === "slow" ? "Too many tries. Wait 10 minutes."
  : params.has("expired") ? "Logged out. Type the passphrase again."
  : "";
const guests = loggedIn ? (await adminGuests()).map(({ id, name, stays }) => ({ id, name, stays })) : [];
const guestsJson = JSON.stringify(guests).replace(/</g, "\\u003c");
---

<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <meta name="robots" content="noindex" />
    <link rel="icon" type="image/svg+xml" href="/favicon.svg" />
    <title>New entry</title>
    <Font cssVariable="--font-instrument-serif" preload={[{ style: "normal" }]} />
    <Font cssVariable="--font-archivo" />
  </head>
  <body>
    <main class="wrap">
      <header>
        <h1>New <em>entry</em></h1>
        {loggedIn && (
          <form method="post" action="/api/admin/logout">
            <button class="out" type="submit">Log out</button>
          </form>
        )}
      </header>

      {!loggedIn && (
        <form class="field" method="post" action="/api/admin/login">
          <label class="lbl" for="passphrase">Passphrase</label>
          <input id="passphrase" name="passphrase" type="password" autocomplete="current-password" required />
          {loginError && <p class="flag" role="alert">{loginError}</p>}
          <button class="btn go" type="submit">Let me in</button>
        </form>
      )}

      {loggedIn && (
        <form id="post" class="wrap" novalidate>
          <div class="row">
            <div class="field">
              <label class="lbl" for="iso">Day</label>
              <input id="iso" name="iso" type="date" required />
            </div>
            <div class="field">
              <label class="lbl" for="time">Time</label>
              <input id="time" name="time" type="time" required />
            </div>
          </div>
          <div class="field">
            <span class="lbl" id="dog-lbl">Dog</span>
            <div class="chips" id="dogs" role="group" aria-labelledby="dog-lbl"></div>
          </div>
          <div class="field" id="with-field" hidden>
            <span class="lbl" id="with-lbl">With (optional)</span>
            <div class="chips" id="with" role="group" aria-labelledby="with-lbl"></div>
          </div>
          <div class="field">
            <span class="lbl" id="label-lbl">Label (optional)</span>
            <div class="chips" id="labels" role="group" aria-labelledby="label-lbl">
              {LABELS.map((label) => <button type="button" class="chip tape" aria-pressed="false" data-label={label}>{label}</button>)}
            </div>
          </div>
          <div class="field">
            <label class="lbl" for="text">What happened</label>
            <textarea id="text" name="text"></textarea>
            <button type="button" class="btn ghost" id="polish">Polish my words</button>
          </div>
          <div class="field" id="options-field" hidden>
            <span class="lbl">Pick one (you can still edit after)</span>
            <div class="options" id="options"></div>
            <p class="hint" id="polish-note" hidden></p>
          </div>
          <div class="field">
            <span class="lbl">Photos (up to 4)</span>
            <p class="hint">AI writes the alt text when you post.</p>
            <div class="photos" id="photos">
              <label class="add" id="add">
                + Add photo
                <input id="files" type="file" accept="image/*" multiple class="sr-only" />
              </label>
            </div>
          </div>
          <hr />
          <p class="flag" id="error" role="alert" hidden></p>
          <button class="btn go" type="submit" id="go">Post</button>
        </form>
      )}

      <section class="done" id="done" hidden aria-live="polite">
        <h2>Posted.</h2>
        <p>Live on the site in about a minute.</p>
        <p><a id="done-link" href="/">See the diary</a></p>
        <button type="button" class="btn ghost" id="again">Post another one</button>
      </section>
    </main>
    {loggedIn && <script type="application/json" id="guests" set:html={guestsJson} />}
    {loggedIn && <script>import "../scripts/admin";</script>}
  </body>
</html>

<style is:global>
  /* One phone-width column, same tokens as the rest of the site. */
  body { background: var(--color-paper); color: var(--color-ink); font: 16px/1.5 var(--font-archivo), sans-serif; padding: 24px 16px 48px; margin: 0; }
  .wrap { max-width: 460px; margin: 0 auto; display: grid; gap: 22px; }
  form.wrap { width: 100%; }
  header { display: flex; align-items: baseline; justify-content: space-between; gap: 12px; }
  h1 { font: 400 40px/1 var(--font-instrument-serif), serif; margin: 0; letter-spacing: -0.01em; }
  h1 em { font-style: italic; }
  .out { font: 13px/1 var(--font-archivo), sans-serif; color: var(--color-label); text-decoration: underline; background: none; border: 0; padding: 4px; cursor: pointer; }
  .field { display: grid; gap: 8px; }
  .field[hidden], .done[hidden], .flag[hidden], .hint[hidden] { display: none; }
  .lbl { font: 600 12px/1.3 var(--font-archivo), sans-serif; letter-spacing: 0.1em; text-transform: uppercase; color: var(--color-label); }
  .hint { margin: 0; font-size: 13px; color: var(--color-muted); }
  .chips { display: flex; flex-wrap: wrap; gap: 8px; }
  .chip { font: 600 13px/1 var(--font-archivo), sans-serif; padding: 9px 14px; border-radius: 999px; border: 1.5px solid var(--color-card-line); background: var(--color-cream); color: var(--color-ink); cursor: pointer; }
  .chip[aria-pressed="true"] { background: var(--color-lime); border-color: var(--color-ink); }
  .chip.tape { border-radius: 0; }
  .row { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }
  input[type="password"], input[type="date"], input[type="time"], textarea { width: 100%; box-sizing: border-box; font: 16px/1.5 var(--font-archivo), sans-serif; color: var(--color-ink); background: var(--color-cream); border: 1.5px solid var(--color-card-line); border-radius: 14px; padding: 11px 13px; }
  textarea { min-height: 110px; resize: vertical; }
  :focus-visible { outline: 2px solid var(--color-ink); outline-offset: 2px; }
  .flag { margin: 0; font-size: 13px; color: var(--color-biro); display: flex; gap: 8px; align-items: baseline; }
  .flag::before { content: "✎"; }
  .photos { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 12px; }
  .print { position: relative; background: var(--color-cream); border-radius: 12px; padding: 7px 7px 10px; box-shadow: 0 1px 0 var(--color-card-line); min-width: 0; }
  .print:nth-child(odd) { transform: rotate(-1.2deg); }
  .print:nth-child(even) { transform: rotate(1deg); }
  .print img { display: block; width: 100%; aspect-ratio: 4/5; object-fit: cover; border-radius: 8px; }
  .print button { position: absolute; top: 12px; right: 12px; font: 600 12px/1 var(--font-archivo), sans-serif; padding: 6px 9px; border-radius: 999px; border: 0; background: var(--color-ink); color: var(--color-cream); cursor: pointer; }
  .add { aspect-ratio: 4/5; border: 1.5px dashed var(--color-line); border-radius: 12px; display: grid; place-items: center; color: var(--color-label); font-size: 13px; cursor: pointer; }
  .add[hidden] { display: none; }
  .sr-only { position: absolute; width: 1px; height: 1px; overflow: hidden; clip: rect(0 0 0 0); }
  .btn { font: 600 15px/1 var(--font-archivo), sans-serif; padding: 14px 18px; border-radius: 999px; border: 1.5px solid var(--color-ink); cursor: pointer; }
  .btn.ghost { background: transparent; color: var(--color-ink); }
  .btn.go { background: var(--color-ink); color: var(--color-cream); width: 100%; padding-block: 17px; font-size: 16px; }
  .btn:disabled { opacity: 0.6; cursor: wait; }
  .options { display: grid; gap: 10px; }
  .opt { text-align: left; background: var(--color-cream); border: 1.5px solid var(--color-card-line); border-radius: 18px; padding: 13px 15px; cursor: pointer; display: grid; gap: 4px; font: inherit; color: var(--color-ink); }
  .opt[aria-pressed="true"] { border-color: var(--color-ink); background: var(--color-lime-soft); }
  .opt .k { font: 600 11px/1.3 var(--font-archivo), sans-serif; letter-spacing: 0.1em; text-transform: uppercase; color: var(--color-label); }
  .opt .t { font-size: 15px; }
  .done { background: var(--color-ink); color: var(--color-cream); border-radius: 24px; padding: 20px 22px; display: grid; gap: 6px; }
  .done h2 { font: 400 28px/1 var(--font-instrument-serif), serif; margin: 0; }
  .done p { margin: 0; font-size: 14px; color: #d9d3c4; }
  .done a { color: var(--color-lime); }
  .done .btn.ghost { color: var(--color-cream); border-color: var(--color-cream); justify-self: start; margin-top: 8px; }
  hr { border: 0; border-top: 1.5px dashed var(--color-line); margin: 0; }
  @media (prefers-reduced-motion: reduce) { .print { transform: none !important; } }
</style>
```

`src/scripts/admin.ts`:

```ts
// The post form on /admin. Keeps a draft in this browser, shrinks photos
// before upload, and talks to /api/admin/polish and /api/admin/post.
import { dogsOn, nowSGT, type FormGuest } from "../lib/admin/form.ts";

const DRAFT_KEY = "tgp-admin-draft";
const MAX_PHOTOS = 4;
const LONG_SIDE = 1600;
const MAX_PHOTO_BYTES = 1_000_000;
const BAD_SEND = "That didn't send properly. Try again.";
const BAD_PHOTO = "Can't read this photo. Try a JPEG or a screenshot of it.";

interface Draft {
  guest: string;
  iso: string;
  time: string;
  label: string;
  with: string[];
  text: string;
}

const $ = <T extends HTMLElement>(id: string) => document.getElementById(id) as T;
const guests: FormGuest[] = JSON.parse($("guests").textContent || "[]");
const form = $<HTMLFormElement>("post");
const iso = $<HTMLInputElement>("iso");
const time = $<HTMLInputElement>("time");
const text = $<HTMLTextAreaElement>("text");
const dogsBox = $("dogs");
const withBox = $("with");
const withField = $("with-field");
const labelsBox = $("labels");
const polishBtn = $<HTMLButtonElement>("polish");
const optionsField = $("options-field");
const optionsBox = $("options");
const polishNote = $("polish-note");
const photosBox = $("photos");
const addTile = $("add");
const files = $<HTMLInputElement>("files");
const errorBox = $("error");
const go = $<HTMLButtonElement>("go");
const done = $("done");

let state: Draft = { guest: "", iso: "", time: "", label: "", with: [], text: "" };
let photos: Blob[] = [];
let postKey = crypto.randomUUID();
let busy = false;

function save() {
  try {
    localStorage.setItem(DRAFT_KEY, JSON.stringify(state));
  } catch {}
}

function load(): Partial<Draft> {
  try {
    return JSON.parse(localStorage.getItem(DRAFT_KEY) || "{}");
  } catch {
    return {};
  }
}

function showError(message: string) {
  errorBox.textContent = message;
  errorBox.hidden = !message;
}

function chip(label: string, pressed: boolean, onClick: () => void): HTMLButtonElement {
  const button = document.createElement("button");
  button.type = "button";
  button.className = "chip";
  button.textContent = label;
  button.setAttribute("aria-pressed", String(pressed));
  button.addEventListener("click", onClick);
  return button;
}

function render() {
  const here = dogsOn(guests, state.iso);
  if (!here.some((g) => g.id === state.guest)) state.guest = here.length === 1 ? here[0].id : "";
  state.with = state.with.filter((id) => id !== state.guest && here.some((g) => g.id === id));

  dogsBox.replaceChildren(
    ...here.map((g) => chip(g.name, g.id === state.guest, () => {
      state.guest = g.id;
      update();
    })),
  );
  if (!here.length) {
    const none = document.createElement("p");
    none.className = "hint";
    none.textContent = "Nobody's staying that day.";
    dogsBox.append(none);
  }

  const others = here.filter((g) => g.id !== state.guest);
  withField.hidden = !state.guest || !others.length;
  withBox.replaceChildren(
    ...others.map((g) => chip(g.name, state.with.includes(g.id), () => {
      state.with = state.with.includes(g.id) ? state.with.filter((id) => id !== g.id) : [...state.with, g.id];
      update();
    })),
  );

  for (const button of labelsBox.querySelectorAll<HTMLButtonElement>("[data-label]")) {
    button.setAttribute("aria-pressed", String(button.dataset.label === state.label));
  }

  const name = guests.find((g) => g.id === state.guest)?.name;
  go.textContent = busy ? "Posting…" : name ? `Post to ${name}'s diary` : "Post";
  go.disabled = busy;
  addTile.hidden = photos.length >= MAX_PHOTOS;
}

function update() {
  save();
  render();
}

function renderPhotos() {
  for (const print of photosBox.querySelectorAll(".print")) print.remove();
  photos.forEach((blob, i) => {
    const print = document.createElement("div");
    print.className = "print";
    const img = document.createElement("img");
    img.src = URL.createObjectURL(blob);
    img.alt = `Photo ${i + 1}`;
    img.addEventListener("load", () => URL.revokeObjectURL(img.src), { once: true });
    const remove = document.createElement("button");
    remove.type = "button";
    remove.textContent = "Remove";
    remove.setAttribute("aria-label", `Remove photo ${i + 1}`);
    remove.addEventListener("click", () => {
      photos.splice(i, 1);
      renderPhotos();
    });
    print.append(img, remove);
    photosBox.insertBefore(print, addTile);
  });
  render();
}

/** Draw to a canvas, long side 1600px, JPEG 0.8, like scripts/prep-photo.sh. */
async function shrink(file: File): Promise<Blob> {
  const url = URL.createObjectURL(file);
  try {
    const img = new Image();
    img.src = url;
    await img.decode();
    const scale = Math.min(1, LONG_SIDE / Math.max(img.naturalWidth, img.naturalHeight));
    const canvas = document.createElement("canvas");
    canvas.width = Math.round(img.naturalWidth * scale);
    canvas.height = Math.round(img.naturalHeight * scale);
    canvas.getContext("2d")!.drawImage(img, 0, 0, canvas.width, canvas.height);
    for (const quality of [0.8, 0.7, 0.6, 0.5]) {
      const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/jpeg", quality));
      if (blob && blob.size < MAX_PHOTO_BYTES) return blob;
    }
    throw new Error("still too big");
  } finally {
    URL.revokeObjectURL(url);
  }
}

files.addEventListener("change", async () => {
  showError("");
  for (const file of Array.from(files.files ?? []).slice(0, MAX_PHOTOS - photos.length)) {
    try {
      photos.push(await shrink(file));
    } catch {
      showError(BAD_PHOTO);
    }
  }
  files.value = "";
  renderPhotos();
});

function card(kind: string, words: string, pressed: boolean): HTMLButtonElement {
  const button = document.createElement("button");
  button.type = "button";
  button.className = "opt";
  button.setAttribute("aria-pressed", String(pressed));
  const k = document.createElement("span");
  k.className = "k";
  k.textContent = kind;
  const t = document.createElement("span");
  t.className = "t";
  t.textContent = words;
  button.append(k, t);
  button.addEventListener("click", () => {
    text.value = words;
    state.text = words;
    save();
    for (const other of optionsBox.querySelectorAll(".opt")) other.setAttribute("aria-pressed", String(other === button));
  });
  return button;
}

function loggedOut(res: Response): boolean {
  if (res.status !== 401) return false;
  location.href = "/admin?expired=1";
  return true;
}

polishBtn.addEventListener("click", async () => {
  showError("");
  polishBtn.disabled = true;
  polishBtn.textContent = "Polishing…";
  try {
    const res = await fetch("/api/admin/polish", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ guest: state.guest, text: text.value, with: state.with }),
    });
    if (loggedOut(res)) return;
    const body = await res.json();
    if (!res.ok) return showError(body.error || BAD_SEND);
    const yours = text.value;
    optionsBox.replaceChildren(
      card("Yours", yours, true),
      card("Polished", body.polished, false),
      ...(body.twist ? [card("Twist", body.twist, false)] : []),
      ...(body.rewritten ? [card("Rewritten", body.rewritten, false)] : []),
    );
    polishNote.textContent = body.note || "";
    polishNote.hidden = !body.note;
    optionsField.hidden = false;
  } catch {
    showError(BAD_SEND);
  } finally {
    polishBtn.disabled = false;
    polishBtn.textContent = "Polish my words";
  }
});

form.addEventListener("submit", async (event) => {
  event.preventDefault();
  if (busy) return;
  showError("");
  busy = true;
  render();
  const data = new FormData();
  data.set("postKey", postKey);
  data.set("guest", state.guest);
  data.set("iso", state.iso);
  data.set("time", state.time);
  data.set("label", state.label);
  data.set("text", text.value);
  for (const id of state.with) data.append("with", id);
  photos.forEach((blob, i) => data.append("photos", blob, `photo-${i + 1}.jpg`));
  try {
    const res = await fetch("/api/admin/post", { method: "POST", body: data });
    if (loggedOut(res)) return;
    const body = await res.json().catch(() => ({}));
    if (!res.ok || !body.ok) return showError(body.error || BAD_SEND);
    const name = guests.find((g) => g.id === state.guest)?.name ?? "the";
    const link = $<HTMLAnchorElement>("done-link");
    link.href = body.url;
    link.textContent = name === "the" ? "See the diary" : `See ${name}'s diary`;
    try {
      localStorage.removeItem(DRAFT_KEY);
    } catch {}
    form.hidden = true;
    done.hidden = false;
  } catch {
    showError(BAD_SEND);
  } finally {
    busy = false;
    render();
  }
});

$("again").addEventListener("click", () => {
  const now = nowSGT();
  state = { guest: state.guest, iso: now.iso, time: now.time, label: "", with: [], text: "" };
  text.value = "";
  photos = [];
  postKey = crypto.randomUUID();
  optionsField.hidden = true;
  done.hidden = true;
  form.hidden = false;
  renderPhotos();
  save();
});

iso.addEventListener("change", () => {
  state.iso = iso.value;
  update();
});
time.addEventListener("change", () => {
  state.time = time.value;
  save();
});
text.addEventListener("input", () => {
  state.text = text.value;
  save();
});
for (const button of labelsBox.querySelectorAll<HTMLButtonElement>("[data-label]")) {
  button.addEventListener("click", () => {
    state.label = state.label === button.dataset.label ? "" : button.dataset.label!;
    update();
  });
}

const now = nowSGT();
const draft = load();
state = {
  guest: draft.guest ?? "",
  iso: draft.iso || now.iso,
  time: draft.time || now.time,
  label: draft.label ?? "",
  with: Array.isArray(draft.with) ? draft.with : [],
  text: draft.text ?? "",
};
iso.value = state.iso;
time.value = state.time;
text.value = state.text;
render();
```

- [ ] **Step 4: Run the tests to see them pass**

```bash
cd /Users/alantay/Developer/townergodpawrents-admin && npm test 2>&1 | grep -E "(pass|fail) [0-9]+$"
```

Expected: `fail 0`.

- [ ] **Step 5: Check it in a browser at phone width**

Uses the dev server and `.env` from Task 11 (start them again as in Task 11 Step 5 if they're gone). Run the Task 11 Step 5 curl lines 3 and 7 again: they should now pass.

Open `http://localhost:4321/admin` in Chrome at 390px wide and check:

1. Login: a wrong passphrase shows "That's not it." The right one shows the form.
2. Day defaults to today and time to now, in Singapore time.
3. Dog chips are the dogs staying that day. With one dog, it's already picked and the button says "Post to <Name>'s diary". A day nobody's staying shows "Nobody's staying that day."
4. "With" chips show only when another dog is staying that day.
5. Label chips toggle on and off.
6. "+ Add photo" adds a print. Four prints hide the tile. The remove control takes a print away. A HEIC from an iPhone either works or shows "Can't read this photo. Try a JPEG or a screenshot of it."
7. "Polish my words" with no `OPENAI_API_KEY` shows "Polish didn't work this time. Your words are still here." and the words stay.
8. Reload: dog, day, time, label, with and text come back (the draft). Photos don't.
9. "Log out" goes back to the login form.
10. No em dashes and no "lah" anywhere on the page.

Show Alan the logged-in form and get his OK on the look before committing. Then clean up:

```bash
cd /Users/alantay/Developer/townergodpawrents-admin && npx astro dev stop && rm .env /tmp/admin-jar
```

- [ ] **Step 6: Commit**

```bash
cd /Users/alantay/Developer/townergodpawrents-admin && git add src/lib/admin/form.ts src/lib/admin/form.test.ts src/pages/admin.astro src/scripts/admin.ts && git commit -m "Add admin posting page"
```

---

### Task 13: Docs

**Files:**
- Create: `docs/adr/0009-admin-posts-via-github-api.md`
- Modify: `docs/agents/add-entry.md` (section 3)
- Modify: `AGENTS.md` (Posting section; `CLAUDE.md` is a symlink to it)

**Interfaces:**
- Consumes: nothing
- Produces: docs only.

Words here are read by Alan and agents, not visitors, but `docs/agents/voice.md` still applies: no em dashes.

- [ ] **Step 1: Write the ADR**

`docs/adr/0009-admin-posts-via-github-api.md`:

```markdown
# ADR 0009: Admin posts go through the GitHub API

## Decision

Weiwen and Alan post diary entries from a phone at `/admin`. The page is our own, not a CMS. The server writes the entry and its photos to `main` as one commit through the GitHub API, and Vercel rebuilds as it does for any push.

Alan confirmed this on 16 October 2026.

## Context

One markdown file per dog holds every day and entry, with comment tags for entry IDs, "with" dogs and labels. Git CMSes (Decap, Tina, Keystatic) can only edit a file's whole body, so they can't add one entry in the right spot. Payload would need a second app, a database and blob storage, and would move entries out of git, which breaks the `add-entry.md` flow and the reactions keyed by guest and entry ID (ADR 0005).

A small custom page reuses the parser's own rules (`entryMinutes`, `resolveDay`, `stayOn`) to file the entry the way `add-entry.md` does by hand, and the build checks the result as it checks every entry.

## Consequences

`main` moves without the laptop knowing. Pull before filing an entry by hand.

Posts go live with no review. The page validates everything before writing, so a bad post is refused rather than breaking the build, but nobody reads the words before visitors do.

Entry IDs are numbered across every guest file, not per file, so a shared entry's ID stays unique on every page it appears on.

Secrets (`ADMIN_PASSPHRASE`, `ADMIN_SECRET`, `GITHUB_TOKEN`, `OPENAI_API_KEY`) live only in Vercel. The GitHub token is fine-grained, this repo only, Contents read and write. Changing `ADMIN_SECRET` logs everyone out.

Not handled yet: videos, editing or deleting entries, new dogs or stays. Those still go through Claude Code.
```

- [ ] **Step 2: Tell `add-entry.md` to pull first**

In `docs/agents/add-entry.md`, right under the `## 3. File it` heading (before the `**Photos:**` line), add:

```markdown
**First:** on main, `git pull`. Entries posted from `/admin` land on main without the laptop knowing.
```

- [ ] **Step 3: Add the phone route to `AGENTS.md`**

In the `## Posting` list in `AGENTS.md`, after the **Diary entry** bullet, add:

```markdown
- **From a phone**: Weiwen and Alan post at `/admin`, which commits to main through the GitHub API. See `docs/adr/0009-admin-posts-via-github-api.md`.
```

- [ ] **Step 4: Check for em dashes**

```bash
cd /Users/alantay/Developer/townergodpawrents-admin && grep -n "—" docs/adr/0009-admin-posts-via-github-api.md docs/agents/add-entry.md AGENTS.md; echo "exit $?"
```

Expected: `exit 1` (none found).

- [ ] **Step 5: Commit**

```bash
cd /Users/alantay/Developer/townergodpawrents-admin && git add docs/adr docs/agents/add-entry.md AGENTS.md && git commit -m "Document admin posting"
```

---

### Task 14: Alan's setup and launch (manual, Alan does these)

**Files:** none in the repo.

**Interfaces:**
- Consumes: the finished branch from Tasks 0–13.
- Produces: `/admin` live on the site.

The agent stops here and hands these steps to Alan. The agent never sees or types a secret.

- [ ] **Step 1: Push the branch and open the PR**

```bash
cd /Users/alantay/Developer/townergodpawrents-admin && npm test 2>&1 | grep -E "(pass|fail) [0-9]+$" && npm run build 2>&1 | tail -2 && git push -u origin feature/admin-posting && gh pr create --fill
```

Expected: `fail 0`, `Complete!`, then a PR URL. End the PR body with `🤖 Generated with [Claude Code](https://claude.com/claude-code)`.

- [ ] **Step 2: Alan makes a GitHub token**

github.com → Settings → Developer settings → Fine-grained tokens → Generate. Repository access: only `alantay/townergodpawrents`. Permissions: Contents, read and write. Nothing else.

- [ ] **Step 3: Alan makes a scratch branch for previews**

```bash
git push origin main:admin-scratch
```

- [ ] **Step 4: Alan sets the Vercel environment variables**

Vercel → project → Settings → Environment Variables:

| Name | Production | Preview |
|---|---|---|
| `ADMIN_PASSPHRASE` | the real phrase | a different test phrase |
| `ADMIN_SECRET` | 32+ random characters (`openssl rand -hex 32`) | a different random value |
| `GITHUB_TOKEN` | the token from Step 2 | same token |
| `OPENAI_API_KEY` | the key | same key |
| `ADMIN_BRANCH` | leave unset (`main`) | `admin-scratch` |

`KV_REST_API_URL` and `KV_REST_API_TOKEN` are already there for reactions. Redeploy the PR preview after adding them.

- [ ] **Step 5: Alan tests on the PR preview**

On a phone, on the preview URL's `/admin`, post:
1. Text only.
2. One photo only.
3. Text and 4 photos.
4. With a label.
5. With a "with" dog on a shared day.
6. A day outside every stay (should refuse with "<Name>'s here …").
7. Tap Post twice fast (should make one commit).

Check each lands as one commit on `admin-scratch` and that the `admin-scratch` preview build passes. Check the post function's duration in Vercel → Logs: 4 photos should finish well inside the function's time limit. If it gets close, tell the agent before merging.

- [ ] **Step 6: Merge, then the first real post together**

Merge the PR. Alan and Claude make the first real post on the live site and check it on the dog's diary. Then Alan gives Weiwen the passphrase. Delete `admin-scratch` once nothing needs it.
