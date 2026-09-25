# The Towner Godpawrents

Who's on Alan and Weiwen's sofa today, and a diary of their day. Live at https://townergodpawrents.vercel.app. Push to `main` and Vercel deploys.

## Posting

Easiest: tell Claude or Codex the moment and give it the photo. It follows `docs/agents/add-entry.md`, which covers polishing the wording with you, shrinking the photo, filing the entry and pushing.

By hand:

```sh
scripts/prep-photo.sh tiny ~/Downloads/IMG_1234.HEIC lap-nap   # → ./tiny/tiny-lap-nap.jpg
```

Then in `src/content/guests/tiny.md`, newest first:

```md
## 16 Sep

### 2pm

<!-- entry-id: e053 -->

Tiny napping on the lap while the human tries to work.

![Tiny napping on lap](./tiny/tiny-lap-nap.jpg)
```

`npm run build` catches days outside a stay and missing photos. New dog or new stay: `docs/agents/new-stay.md`. Words used here (guest, stay, entry, print): `CONTEXT.md`.

Shared reaction setup and the private reset command: [docs/agents/reactions.md](docs/agents/reactions.md). Each new entry needs a unique, permanent `entry-id` comment; see [the posting guide](docs/agents/add-entry.md).

## Handy

- `npm run dev`: local site at localhost:4321
- `/?date=2026-09-20`: preview the homepage as if it were another day
