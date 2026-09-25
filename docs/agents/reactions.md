# Shared diary reactions

The public diary stays static. `/api/reactions` reads and writes reaction totals in Upstash Redis. Both pages use the same guest and entry IDs, so a tap on the homepage appears on the full diary too. Visitors can tap without an account; every accepted tap adds one. The endpoint limits each source address to 20 taps in a 60-second window starting with its first tap.

## Deployment

Create an Upstash Redis database and set `UPSTASH_REDIS_REST_URL` and `UPSTASH_REDIS_REST_TOKEN` in the Vercel project's environment variables. Set them in a local `.env` too for development. Keep the token private. Use the provider's free tier and set a spending cap before launch. Deploy after both values are set; static diary pages still render if the reaction service is unavailable.

## Clearing a count

From the repo, with the two variables in `.env`:

```sh
node --env-file=.env scripts/reset-reactions.mjs tiny e001 '❤️' --yes
node --env-file=.env scripts/reset-reactions.mjs tiny e001 --yes
```

The first command clears one emoji; the second clears all reactions for that entry. Check the entry ID in `src/content/guests/<guest>.md` first. The script changes only Redis counts, not diary content.
