# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

Primarily the friends and neighbours whose dogs Alan and Weiwen are hosting — checking in on their own dog during a stay. Secondarily, any friend or neighbour browsing out of curiosity to see who's lepak-ing on the sofa today. Not a general public audience and not prospective customers — this is not a business.

## Product Purpose

A personal, just-for-fun website for Alan and Weiwen, who look after neighbours' and friends' dogs at their home in Towner, Singapore. The site shows visitors which dog is staying today (or that the sofa's free), and lets them read a running diary of the dog's day. Success is a warm, funny, personal page people enjoy checking — not conversions, leads, or bookings.

## Positioning

Not a pet-sitting service — a personal log of an informal, no-money hobby among friends and neighbours. The site's only claim is "here's who's on our sofa today," never a pitch for hosting services.

## Operating Context

- Each dog is a guest, one content entry (`src/content/guests/*.md`), with frontmatter (name, breed, photo, bgColor, badge, tagline, showLive) plus a `stays` list of check-in/check-out ranges — a dog who comes back gains a stay, not a file. See `CONTEXT.md` and `docs/adr/0002-guest-has-many-stays.md`.
- The diary body is `## 13 Sep` day dividers with `### 9:50am` entries under them, newest first. The year is never written; it comes from whichever stay contains the day.
- An entry carries either up to four **prints** (photos) or exactly one **clip** (video), never both — a mix fails the build, naming the guest and entry. A moment that needs both is two entries. See `docs/adr/0003-print-clip-exclusive.md`.
- Owners typically meet the site as a link Alan or Weiwen send into a chat, then check back on it directly during the stay. Each guest has a build-time link-preview image (`src/pages/og/[id].jpg.ts`) so a shared link shows the dog rather than a blank box.
- The homepage picks "today's" guest client-side in the Asia/Singapore timezone, showing either the live guest(s), a "Vacancy" state with the last guest, or a past-guests list. It scopes to today, not to the whole stay.
- Each guest gets a page at `/guests/[id]` holding their whole history, and `/guests` lists everyone who's stayed.

## Capabilities and Constraints

- Astro + Tailwind, static content collections — no backend, no bookings, no payments, no forms.
- `CONTEXT.md` is the canonical vocabulary (guest, stay, diary day, entry, print, clip, cut-out, live, vacancy, past guest), including the words to avoid. Use its terms rather than restating or renaming them.
- `badge` is a 2-3 word description of the dog, distinct from the `tagline` (see project memory on this convention).
- Hosting stays light and cheap: Vercel free/Hobby tier, no paid media or storage services. Photos and clips are committed to the repo, so they are compressed locally before commit — `scripts/prep-photo.sh` (sips) and `scripts/prep-video.sh` (ffmpeg, H.264 ≤1280px, CRF 28). See `docs/adr/0004-ffmpeg-video-transcode.md`. Adding a third-party service is a decision to raise, not to assume.
- Never write marketing copy, calls to action, pricing, service descriptions, testimonials, or FAQs — if a section starts sounding like a service, it's wrong.

## Brand Commitments

- Tagline: "No dog of our own, just everyone else's."
- Tone: personal, playful, warm, with a light sprinkle of Singlish ("lepak on the sofa", "10/10 would host again lah") — light enough that overseas friends still follow.
- Names: Alan & Weiwen (hosts); each dog is a guest with its own name and page (e.g. Ebi, Tiny).

## Evidence on Hand

- A growing roster of real guests with real diary entries, under `src/content/guests/` — Ebi the Pomsky, Tiny the Border Collie, and Guapo at the time of writing. Read the directory for the current list rather than trusting this one.
- A hand-cut host portrait of Alan and Weiwen (`public/images/alan-weiwen-portrait.jpg`) and per-dog cutout photos.
- No testimonials, pricing, or service claims exist or should be invented — this is not that kind of site.

## Product Principles

1. Playful and personal over polished and corporate — this is a hobby page, not a product.
2. Real dogs, real diary entries, real photos only — never fabricate guests, quotes, or stats.
3. Singlish and warmth should read as "talking to a neighbour," legible to overseas friends too.
4. If a section starts sounding like a business pitch (CTA, pricing, FAQ, testimonial), cut it.

## Accessibility & Inclusion

No specific accessibility requirement established; keep normal legibility standards for a casual personal site.
