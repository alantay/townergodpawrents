# Admin posting page

Date: 2026-10-16. Status: design approved in chat, awaiting spec review.

## Goal

Let Weiwen (and Alan) post a diary entry from a phone, without git or Claude Code. A post goes live on the site about a minute after tapping Post.

Success: Weiwen opens `/admin`, types the passphrase once, picks a dog, types a few lines, adds up to 4 photos, optionally polishes the words, taps Post, and sees the entry on the dog's diary a minute later. Nothing she does can break the build.

## Scope

In v1:

- New entries only: text, up to 4 photos, or both.
- Dog, day, time, optional label (`Throwback`, `Thoughts`, `Fun fact`), optional "with" dogs.
- AI polish of the words (on request) and AI alt text for photos (always, automatic).
- One shared passphrase.

Not in v1: videos, editing or deleting entries, adding dogs or stays, credits, drafts on the server, more than one login.

## Decisions

| Question | Decision | Why |
|---|---|---|
| CMS (Decap, Tina, Keystatic, Payload) vs custom page | Custom page | One markdown file per dog holds many days and entries with comment tags. Git CMSes can only edit the whole body. Payload needs a second app, a database and blob storage, and moving entries out of git. |
| Where entries live | Markdown in git, as today | Keeps ADR 0005 (reactions keyed by guest + entry ID), the parser and Claude's `add-entry.md` flow unchanged. |
| How a post reaches main | Server commits through the GitHub API | No git on the phone. Same result as a push. |
| Rebuild per post | Yes | Already how entries ship. Build is about a minute. |
| Publish | Live straight away, no review step | Wanted. |
| Login | One shared passphrase, 30-day signed cookie | Simplest for two people. |
| Alt text | AI writes it, not shown or editable | Alan trusts it. |
| Live voice check | None | The polish prompt carries the voice rules. |

## Architecture

The site stays static. New on-demand routes (`export const prerender = false`), all under `/admin` and `/api/admin`:

| Route | Does |
|---|---|
| `GET /admin` | Login form if no valid cookie, else the post form. |
| `POST /api/admin/login` | Checks passphrase, sets cookie. Rate limited. |
| `POST /api/admin/logout` | Clears cookie. |
| `POST /api/admin/polish` | Returns polish options for the text. |
| `POST /api/admin/post` | Writes the entry and photos to main as one commit. |

All `/api/admin/*` routes except login reject a request without a valid cookie (401).

### Units

Each is a small module in `src/lib/admin/`, pure where possible, with its own tests.

- **`session.ts`**: `sign(payload, secret)`, `verify(cookie, secret)`. HMAC-SHA256 over `{exp}`. No user identity, just "logged in until".
- **`insert-entry.ts`**: `insertEntry(markdown, entry) -> markdown`. Pure. Adds the `## 16 Oct` heading if missing (in date order among existing days, newest first), places the `### 3:20pm` entry in time order (newest first, using `entryMinutes`), assigns the next free ID for that file (highest `eNNN` + 1, zero-padded to 3), and writes the comment lines in the order: entry-id, with, label. Blank line between heading, comments, text and each image, as in `add-entry.md`.
- **`photo-name.ts`**: `photoName(guest, text, taken: Set<string>) -> "luna-slipper-garden.jpg"`. Slug from the first 2 to 4 meaningful words of the text (or `photo` if empty). The first free name wins: `luna-slipper-garden.jpg`, then `-2`, `-3` and so on. Each photo in an entry is added to `taken` before naming the next.
- **`validate.ts`**: checks the day is inside one of the guest's stays and inside each "with" dog's stay (using `stayOn` from `guests.ts`), time format, label is one of the three, text or photos (at least one, at most 4 photos), each photo a JPEG under 1MB and all under 4MB. Returns a reason string on failure.
- **`github.ts`**: thin client over the GitHub REST API, injected with `fetch` so tests can fake it. `readFile(path, branch)`, `listDir(path, branch)`, `commitFiles(branch, files[], message)`.
- **`openai.ts`**: thin client, injected `fetch`. `polish(text, context)`, `altText(photo, context)`.
- **`clean-ai.ts`**: replaces em and en dashes used as punctuation in AI output with a comma or full stop. Leaves en dashes in number ranges.
- **`post-entry.ts`**: the orchestration behind `/api/admin/post`, with GitHub and OpenAI injected (same pattern as `reaction-api.ts` taking a store).

## Data flow for a post

1. Phone: photos picked with `<input type="file" accept="image/*" multiple>`. Each is drawn to a canvas, long side 1600px, exported as JPEG quality 0.8 (matches `scripts/prep-photo.sh`). Keeps 4 photos well under Vercel's 4.5MB request limit.
2. Phone sends `multipart/form-data`: guest, day (ISO), time, label?, with[], text, photos[], and a one-time `postKey` (random, made when the form loads).
3. Server: verify cookie, then `validate`. On failure return 400 with the reason, nothing written.
4. Server: alt text for all photos in parallel (`altText`, 15s timeout each). On failure or timeout, fall back to `"<Name>, <d Mon> <time>"`. Output goes through `clean-ai`.
5. Server: `readFile("src/content/guests/<guest>.md", branch)`, `insertEntry`, `photoName` for each photo against `listDir("src/content/guests/<guest>/", branch)`.
6. Server: `commitFiles` makes one commit with the markdown and photos. Message: `Add <Name> <time> <slug words> entry (via admin)`. Steps, all plain code:
   1. `GET /git/ref/heads/<branch>` for the head SHA.
   2. `POST /git/blobs` for the markdown and each photo (base64).
   3. `POST /git/trees` with `base_tree` = head's tree.
   4. `POST /git/commits` with parent = head.
   5. `PATCH /git/refs/heads/<branch>` with `force: false`.
   If any GitHub call fails, or the ref update is refused because the branch moved, retry once from the file read (re-read, re-insert, re-name, re-commit). A second failure returns 502 and the "Couldn't save it" message (see Errors), with the GitHub error logged on the server. Alt text is not redone.
7. Server stores `postKey` in Redis for 1 day after success. A repeat request with the same key returns the earlier success without committing again.
8. Server returns `{ ok: true, url: "/guests/<guest>" }`. Vercel builds from the new commit.

`branch` comes from `ADMIN_BRANCH`, default `main`. Preview deploys set it to a scratch branch so testing never touches the real diary.

## The page

Matches the section 1 mockup (site tokens, phone width, single column).

- **Dog**: chips for dogs with a stay covering the chosen day. Computed in the browser from stays embedded at build time. Preselected if only one dog is here, else none.
- **Day / Time**: native `<input type="date">` and `<input type="time">`, default today and now in SGT. The server formats the time as in `add-entry.md` (`9am`, `2:45pm`).
- **Label**: optional, one of three chips.
- **With**: optional chips for the other dogs staying that day.
- **What happened**: textarea.
- **Photos**: up to 4, shown as prints. Note under the label: "AI writes the alt text when you post."
- **Polish my words**: sends the text, shows option cards. Yours first, then Polished, then Twist and Rewritten when returned. Tapping a card fills the textarea, which stays editable.
- **Post to <Name>'s diary**: locks while posting. On success: "Posted. Live on the site in about a minute." with a link to the diary.
- **Draft**: dog, day, time, label, with and text saved to `localStorage` on every change, cleared after a successful post. Photos are not saved.
- **Log out** link.

## AI

Model from `OPENAI_MODEL`, default a small, cheap current model (pick when implementing, check OpenAI's model list then). Structured JSON output.

**Polish** prompt is built at build time (`?raw` imports) from `docs/agents/voice.md` and the polish rules in `docs/agents/add-entry.md` section 2, so the rules live in one place. It also gets the dog's name, the "with" dogs and the 3 most recent entries for that dog as tone reference. Returns `{ polished, twist?, rewritten?, note? }`. Polished keeps every detail and adds no jokes. `note` is a one-line hint for things like a POV slip, shown under the cards. All fields go through `clean-ai`.

**Alt text** prompt: a plain description, names the dog(s) by name, no jokes, no "image of" or "photo of", under 20 words. Gets the dog name, "with" dogs and the entry text as context.

Only cookie-holders can reach either endpoint, so nobody else can spend the API key.

## Errors

Copy follows `docs/agents/voice.md`.

| Case | Message | Behaviour |
|---|---|---|
| Wrong passphrase | "That's not it." | 5 wrong tries per IP in 10 minutes, then 429: "Too many tries. Wait 10 minutes." Counted in the existing Upstash Redis. |
| Cookie expired or missing | "Logged out. Type the passphrase again." | Draft kept in `localStorage`. |
| Polish fails or takes over 15s | "Polish didn't work this time. Your words are still here." | Post still works. |
| Alt text fails | none | Fallback alt text, post continues. |
| Day outside every stay | "<Name>'s here <stay range>. Pick a day in there, or ask Alan to add a stay." | Range is the stay nearest the chosen day. 400, nothing written. |
| "With" dog not here that day | "<Name> wasn't staying on <d Mon>." | 400, nothing written. |
| Photo can't be decoded in the browser | "Can't read this photo. Try a JPEG or a screenshot of it." | Photo not added. |
| GitHub fails, after one quiet retry | "Couldn't save it. Nothing was posted. Try again." | Draft kept. |
| Post tapped twice | Button shows "Posting…" and is disabled | `postKey` prevents a second commit. |

## Secrets

Vercel environment variables, never in git. Read with `getSecret` from `astro:env/server`.

| Name | Purpose |
|---|---|
| `ADMIN_PASSPHRASE` | The phrase Alan and Weiwen type. |
| `ADMIN_SECRET` | Signs the cookie. Changing it logs everyone out. |
| `GITHUB_TOKEN` | Fine-grained, this repo only, Contents read and write. |
| `OPENAI_API_KEY` | Polish and alt text. |
| `OPENAI_MODEL` | Optional model override. |
| `ADMIN_BRANCH` | Optional, defaults to `main`. Set to a scratch branch on previews. |
| `KV_REST_API_URL`, `KV_REST_API_TOKEN` | Already set for reactions. Reused for login rate limit and `postKey`. |

Main's branch protection blocks force pushes and deletion but allows direct commits, so the token can commit with no settings change.

## Docs to update

- `docs/agents/add-entry.md`: `git pull` on main before filing an entry, since admin posts land on main without the laptop knowing.
- New ADR `docs/adr/0009-admin-posts-via-github-api.md` recording the custom page over a CMS, and commits through the GitHub API.
- `CLAUDE.md` Posting section: one line pointing to `/admin` for posting from a phone.

## Testing

- Unit (`npm test`): `insertEntry` (new day at top, new day between existing days, time order, next ID, with and label comments, blank lines, photos), `photoName` (slug, collisions, multiple photos), `validate` (stay edges on check-in and check-out day, with dog outside stay, label, counts), `session` (valid, expired, tampered), `clean-ai` (em dash, en dash in a range kept).
- Endpoint: `post-entry` with fake GitHub and OpenAI. Happy path makes one commit with the right files. Ref conflict retries once. OpenAI failure uses fallback alt text. Repeat `postKey` makes no second commit.
- Manual: on the PR's Vercel preview with `ADMIN_BRANCH` set to a scratch branch. Post with text only, photos only, both, a label, a "with" dog, and a day outside a stay. Check the scratch branch builds.
- After merge: Alan and Claude make the first real post together, then Alan hands Weiwen the passphrase.
