# Diary reactions

The reaction badge on each entry opens five choices: 😂, ❤️, 😍, 😑, and 😅. The heart-eyes, unimpressed and phew faces are placeholder doodles until custom stickers replace them. Every tap increments that emoji's count. The badge piles up to three used stickers, most-used on top, with "+N" for any more and the total on a scrap of pale lime tape. The open picker shows each choice's count, or "–" if none. On screen each emoji is drawn as a hand-drawn sticker (`STICKERS` in `src/scripts/reactions.ts`, keyed by label); the emoji itself stays the stored key.

Totals are shared: everyone sees the same counts. The diary pages stay static; `/api/reactions` reads and writes totals in Upstash Redis. The page loads one guest's counts in a single request, shared by every widget for that guest, so a tap on the homepage appears on the full diary too. A tap shows straight away, then settles on the server's total. If it fails, the tap is undone and a small note says so. Visitors can tap without an account. The endpoint limits each source address to 20 taps in a 60-second window starting with its first tap.

If the store is down or not configured, the diary still renders and badges show no counts.

## Deployment

Add Upstash Redis to the Vercel project (Vercel Marketplace, free plan), or create a database at Upstash and set `UPSTASH_REDIS_REST_URL` and `UPSTASH_REDIS_REST_TOKEN` in the Vercel project's environment variables. The Marketplace's `KV_REST_API_URL` and `KV_REST_API_TOKEN` names work too. Set the same values in a local `.env` for development. Keep the token private. Redeploy after the variables are set.

## Clearing a count

From the repo, with the two variables in `.env`:

```sh
node --env-file=.env scripts/reset-reactions.mjs tiny e001 '❤️' --yes
node --env-file=.env scripts/reset-reactions.mjs tiny e001 --yes
```

The first command clears one emoji; the second clears all reactions for that entry. Check the entry ID in `src/content/guests/<guest>.md` first. The script changes only Redis counts, not diary content.

Each entry keeps its unique `entry-id` comment in Markdown, so reactions remain attached when its time or words change.
