# Diary reactions

The reaction badge on each entry opens five choices: 😂, ❤️, 😍, 😑, and 😅. The heart-eyes, unimpressed and phew faces are placeholder doodles until custom stickers replace them. Every tap increments that emoji's count. The badge piles up to three used stickers, most-used on top, with "+N" for any more and the total on a scrap of pale lime tape. The open picker shows each choice's count, or "–" if none. On screen each emoji is drawn as a hand-drawn sticker (`STICKERS` in `src/scripts/reactions.ts`, keyed by label); the emoji itself stays the stored key.

For now, counts are stored in the visitor's `localStorage` under `towner-entry-reactions:v1`. The homepage and full guest diary read the same local data. Counts survive a refresh in that browser, but other people and devices do **not** see them. Clearing browser storage also clears the counts. No account, Redis database, or environment variables are needed for the current interaction.

The existing `/api/reactions` endpoint and Redis reset script are dormant while the browser uses local storage. [ADR 0005](../adr/0005-shared-entry-reactions.md) records the planned shared version; enable it only when permanent public totals are wanted again.

Each entry keeps its unique `entry-id` comment in Markdown, so reactions remain attached when its time or words change.
