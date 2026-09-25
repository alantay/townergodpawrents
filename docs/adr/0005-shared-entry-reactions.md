---
status: accepted
---

# Shared reactions on diary entries

Implementation note (25 Sep 2026): the interactive preview now stores counts in each visitor's browser and shows them in a compact badge at the top of each card. The endpoint and Redis code below remain dormant. Shared totals, rate limiting, and the private reset command are deferred until the hosted store is enabled.

The diary is currently built as static pages. Shared, permanent reaction totals need a write endpoint and durable storage, so add a small on-demand endpoint backed by a hosted store while keeping the diary pages static. Prefer a free tier with a spending cap. This adds an external service, but lets visitors see the same totals on the homepage and guest diary without rebuilding the site after every tap.

Each entry gets a stable ID in its Markdown, including existing entries, so editing its time or words does not detach its reactions. Any visitor may tap ❤️, 😂, 🥹, or 🐾 on any entry, including past stays. Each tap increments that emoji's total; there is no login, person identity, or per-browser claim. Show all four buttons even at zero, then show totals as they accrue. Apply simple rate limiting to bursts, and provide a private command for Alan to clear a bad count or remove an entry's totals.

If the reaction service is unavailable, the diary remains readable and a failed tap gets a quiet retry message. The store and endpoint serve only this feature; guest and diary content remain in Markdown.
