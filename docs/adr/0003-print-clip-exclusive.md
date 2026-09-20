# ADR 0003: An entry has prints or one clip, never both

## Decision

An entry carries either up to four **prints** (photos) or exactly one **clip** (video), never a mix. Parsing throws a build error naming the guest and entry title if a clip is found alongside any other media.

## Context

Issue #6 asked for video support because "short videos would capture some moments better" than a photo. Its proposed scope already stated the shape as "one photo **or** one video per diary entry" — the alternative (allowing a clip and prints together in one entry) was never actually requested, and it introduces a real layout problem: prints tile in a fixed grid (`diary-prints`, `diary-prints--pair`, `diary-prints--quad`) sized by each photo's own aspect ratio, while a clip renders as a single fixed-16:9 box (Astro has no build-time access to a video's real dimensions the way it does for images). Mixing the two would mean designing a combined grid for two incompatible sizing models, for a case nobody asked for.

## Considered options

- **Allow mixing** — most flexible, but forces a combined-grid design for prints + a fixed-aspect clip in the same row, and no one has asked for it.
- **Prints or one clip, never both** — chosen. Matches the issue's own wording, keeps each entry's media rendering as one of two simple, already-built layouts (photo grid, or single video box), and if a moment genuinely needs both a photo and a video, it can be two entries at the same or adjacent times.

## Consequences

If Alan ever wants a photo and a clip for the same moment, that's two diary entries, not one. `parseDiary` rejects a mix at build time rather than silently picking one, so the failure is loud and immediate rather than a video quietly getting dropped.
