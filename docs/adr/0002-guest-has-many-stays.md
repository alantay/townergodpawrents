# ADR 0002: A guest has many stays

## Decision

One markdown file is a **guest** — a dog — and it carries a list of **stays**, each a check-in/check-out range. The collection and the route are `guests`, so a dog keeps one page at `/guests/ebi` however many times she comes back. Dog facts (breed, cut-out, colour, badge, tagline) live once at the top of the file; the diary below is `## 13 Sep` day dividers with `### 9:50am` entries under them, newest first.

## Context

The original model was one file per stay, keyed by dog name, with a single check-in/check-out pair. That works only while every dog visits exactly once. With two dogs hosted so far the model had not yet been tested by a returning guest, and two assumptions had already quietly broken: a ten-day stay was writing time-only headings with no way to tell one day from the next, and the homepage was counting "the full day" against the whole file.

## Considered options

- **One file per stay** (`ebi-sep.md`, `ebi-nov.md`) — breed, photo and colour retyped every visit and free to drift; the same dog appearing repeatedly in a grid labelled "Past guests"; a new URL each time.
- **Two collections**, `dogs/` referenced by `stays/` — correct, but more machinery than a hobby site with two dogs and no backend needs.
- **Guest with many stays** — chosen. The dog is what people care about, and it is the only option where the past-guests grid means what its label says.

## Consequences

The year is never written in a diary day divider; it is derived from the stay containing that day. A divider falling outside every stay fails the build, naming the guest and the date — the stay list doubles as a checksum on the diary.

Overlapping stays for the same guest warn at build time rather than failing. Real hosting is messier than the model, and a warning can never block a real day from being written down.

The homepage scopes to **today**, not to the stay: today's entries, today's photo count. That keeps "which dog is on our sofa today" literally true, and keeps the existing labels honest on day six of a ten-day stay.
