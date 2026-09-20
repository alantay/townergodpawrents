# ADR 0004: prep-video.sh transcodes with ffmpeg rather than trusting a pre-compressed file

## Decision

`scripts/prep-video.sh` takes a raw phone clip (`.mp4` or `.mov`) and transcodes it with `ffmpeg` — H.264 capped at 1280px on the long side, CRF 28, AAC 128kbps audio, `faststart` — rather than copying the source file as-is. This adds `ffmpeg` as a required local tool for filing a diary clip, the same way `sips` is already required (and already present on macOS) for `prep-photo.sh`.

## Context

Astro does not process video the way it processes images through `astro:assets` — whatever file lands in `src/content/guests/` is served byte-for-byte, and it's committed straight into git, deployed on Vercel's free/Hobby tier. The site owner explicitly wants to keep hosting light and cheap (no paid video service, no S3-style storage — which wouldn't compress anything anyway, it's just object storage). That leaves compression as something that has to happen before the file is committed, and it can either be done by hand each time or automated.

## Considered options

- **Manual compression, script just warns on size** — no new dependency, but relies on remembering to export/trim every clip correctly before running the script; a missed step means a bloated file sits in git history forever.
- **Automatic transcode via ffmpeg** — chosen. Same reasoning as why `prep-photo.sh` already auto-resizes photos instead of trusting a raw phone export: a guardrail that runs every time beats one that depends on remembering.

## Consequences

Filing a video now requires `ffmpeg` installed locally (`brew install ffmpeg`) — a new one-time setup step, documented in `docs/agents/add-entry.md`. In exchange, any `.mp4`/`.mov` straight off a phone can be filed directly; the script always produces a web-sized `.mp4` output. If a transcoded clip is still over the ~20MB guidance (a long clip at fixed CRF), the script only warns — trimming the clip is left to the author rather than the script auto-retrying at a lower quality.
