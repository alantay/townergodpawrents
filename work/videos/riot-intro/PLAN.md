# Riot intro video: build plan

## Goal
One HyperFrames composition in `index.html` (this folder): a 28s, 1080x1920 deadpan "crime report" intro for Riot, a Maltese. Storyboard is approved; this is the edit, not a redesign.

## Acceptance criteria
- `npx hyperframes lint` and `npx hyperframes check` pass with no errors.
- Root `data-duration="28"`, 1080x1920, 30fps.
- Beats, sources and VO placement exactly as the table below. Clip audio muted (`muted` / volume 0). No music.
- All seven VO files play at the listed starts, unclipped.
- Fonts only from `assets/fonts/` via `@font-face`; GSAP from `assets/gsap.min.js` (no CDN, no network).
- On-screen copy exactly as written (no em/en dashes anywhere).
- "Voice generated with ElevenLabs" readable on the end card (>= 30px, >= 80% opacity).

## Read first
- `../../../.claude/skills/hyperframes-core/SKILL.md` and `references/creator-editing-recipes.md` (source ranges: `data-media-start`, `data-playback-rate`, tracks).
- `../../../.claude/skills/hyperframes-keyframes/SKILL.md` for the push-in and freeze.
- Never restructure the timeline beyond the table.

## Assets (all in `assets/`)
- `riot-off-leash-marking.mp4` 576x1024, 30fps, 17.2s
- `riot-manja-weiwen.mp4` 464x832, 30fps, 19.8s
- `riot-proud-pooper.jpg`, `riot-sleeping-away-obstacle.jpg` 1200x1600 (3:4, cover-crop to 9:16, keep the dog centred)
- `riot-collage-v2.png` 1055x1400, transparent torn-paper cutout
- `line1.mp3` .. `line7.mp3` (Bill VO; speech starts near 0 in each file)
- fonts: `InstrumentSerif-Regular/Italic.woff2`, `Caveat-600.woff2`, `Archivo-600/800.woff2`

## Palette and type
Teal `#2F6B6B`, stamp red `#C2332B`, ink `#1E2423`, white. Display: Instrument Serif. Labels: Archivo 600/800. Script: Caveat 600.

## Timeline (film seconds)
| # | Film | Picture | Overlay | VO file @ start |
|---|---|---|---|---|
| 1 | 0-3.3 | marking.mp4 from 0.0, 1x, cover | Bottom-left, Archivo 800, letter-spacing .18em, ~40px, white with soft shadow: `TOWNER CREST, SINGAPORE`. Fade in 0.3-0.6, out by 3.1 | line1 @ 0.3 |
| 2 | 3.3-7.0 | marking.mp4 from 3.3, 1x (to 7.0) | Field card, lower third: white 94% panel, 8px teal left border. `RIOT` Instrument Serif ~88px tracked .06em; `Maltese` Archivo 600 ~34px; `Known vandal` Instrument Serif italic ~46px. Slide up + fade in at 3.5 (0.35s), out at 6.7 | line2 @ 3.6 |
| 3 | 7.0-9.9 | marking.mp4 from 7.0, playback-rate 0.7 for 1.6s of film (source 7.0-8.12), then hold that last frame to 9.9 | none | line3 @ 7.2 |
| 4 | 9.9-13.3 | proud-pooper.jpg, cover, slow push-in scale 1.0 to 1.08 over the beat | Red stamp `ON RECORD`: Archivo 800 ~78px, tracked .12em, 7px red border, rotate -12deg, centred at ~58% height, multiply blend. Slams in at 11.2 (scale 1.6 to 1, 0.18s, power4.out) | line4 @ 9.9 |
| 5 | 13.3-19.2 | manja.mp4 source 2.0-5.0 (film 13.3-16.3), hard cut to source 9.5-12.4 (film 16.3-19.2), 1x | none | line5 @ 13.5 |
| 6 | 19.2-22.2 | sleeping-away-obstacle.jpg, static, `object-fit: contain` on teal so the whole sprawl shows | none | line6 @ 19.4 |
| 7a | 22.2-23.2 | manja.mp4 source 15.3, play 0.5s then freeze on the frame at source 15.8 | none | line7 @ 22.6 |
| 7b | 23.2-28.0 | teal ground; collage png centred, ~78% width, gentle drop-in (y 40 to 0, 0.4s) | Under the cutout: `Riot` Instrument Serif ~150px white; `Known vandal` Caveat 600 ~70px white; bottom `Voice generated with ElevenLabs` Archivo 600 32px white 85% | (line7 continues) |

Freezes: if a mid-source freeze cannot be authored safely, extract a still with `ffmpeg -ss <t> -frames:v 1` into `assets/` and cut to the image (ffmpeg is local, no network needed). Note which you used in the report.

## Checks
- Coder: `npx hyperframes lint`, `npx hyperframes check`, `npx hyperframes timeline` (paste the timeline into the report).
- Planner (mine): snapshots of each beat, Studio preview with Alan, final render.

## Coder settings
Codex `gpt-6.1-sol` at `medium`: one file, fully specified timeline, a couple of judgement calls (freeze method, crop).

## Out of scope
Site placement, music, sound effects, any file outside this folder.
