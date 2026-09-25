# Diary reactions

The reaction badge on each entry opens four choices: ❤️, 😂, 🥹, and 🐾. Every tap increments that emoji's count. The badge shows up to three used emoji and the total.

For now, counts are stored in the visitor's `localStorage` under `towner-entry-reactions:v1`. The homepage and full guest diary read the same local data. Counts survive a refresh in that browser, but other people and devices do **not** see them. Clearing browser storage also clears the counts. No account, Redis database, or environment variables are needed for the current interaction.

The existing `/api/reactions` endpoint and Redis reset script are dormant while the browser uses local storage. [ADR 0005](../adr/0005-shared-entry-reactions.md) records the planned shared version; enable it only when permanent public totals are wanted again.

Each entry keeps its unique `entry-id` comment in Markdown, so reactions remain attached when its time or words change.
