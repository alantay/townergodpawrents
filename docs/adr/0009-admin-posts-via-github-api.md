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
