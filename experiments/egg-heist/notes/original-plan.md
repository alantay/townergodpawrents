# Plan: Throwaway prototype of "The Egg Heist" (Ebi mini game) to test feel

## Goal
A single self-contained HTML page, published as a private Claude Artifact and opened in the browser, that Alan can play with mouse, finger or spacebar on desktop and phone, to judge whether the hold-and-release jump feels fun. Done = page plays start to finish (intro → jumps → tray falls → eggs smash → door opens → Ebi innocent + jump count → "go again"), with tuning constants at the top of the script. No site code changes.

## User-decided (settled in grilling, do not reopen)
- Throwaway prototype only; real homepage build is a separate later plan, only after Alan OKs the feel. Because: Tyrion game (PR #130) was built fully then rejected; issue #131 says prototype first.
- No pointer-chase mechanics. Because: #131 verdict.
- Hold to charge, release to jump. Power bar ping-pongs (fills, drains, fills) while held. Because: forces watching, not counting.
- Three jump outcomes: too weak = misses, nothing moves; sweet spot = hooks tray, inches it toward edge (slightly more for a near-perfect release); too strong = shoves tray back by one hook's worth. Because: Alan's idea; makes tenacity and lost progress the joke.
- Sweet spot shifts a little after every jump. Because: real timing, not muscle memory.
- Win = tray reaches edge after ~10 hooks' worth of progress. Player skill decides how many jumps it takes.
- No losing, no timer, no "caught" mechanic.
- Frame: Ebi only does this when no one is home. Opening beat (~2s, tap to skip): door shuts, keys jingle, "House empty." Ending: tray tips, eggs smash, Ebi eats, door opens, Ebi sits innocently by the mess, jump count shown, "go again" button.
- Tenacity shown via visible jump counter, visibly creeping tray, short Ebi thought bubbles between jumps.
- Input: hold anywhere on game area; mouse, touch, spacebar.
- Art: Ebi's existing cut-out (`src/content/guests/ebi/ebi-collage.png`) plus simple drawn counter, tray, eggs. Proper jump-pose cut-outs deferred to real build.
- View: top-down home CCTV look, matching the real reel (overhead, ticking timestamp overlay like `2025-09-29 11:28:49`, slight grain/vignette, wide-angle feel). Because: fits "no one home" and the real footage.
- Good jump = front paws land on counter and drag the tray toward her; tray twists a little each drag, as in the reel.
- Name: "The Egg Heist" (added to GLOSSARY.md).

## Approach
One HTML file in the session scratchpad, vanilla JS + CSS (no framework, no build), Ebi's cut-out embedded as a downscaled base64 data URI (or published as a supporting file). Game logic as a small pure state machine (`idle → charging → jumping → result → ... → won`) with a `requestAnimationFrame` render loop; DOM/CSS transforms for sprites (simpler than canvas, easy squash/stretch). Publish via the Artifact tool; open in browser to verify.

## Steps
1. Read `docs/agents/voice.md` (done) for all on-screen words. Draft thought-bubble lines in Ebi's voice: deadpan, short, no "lah", no em dashes. E.g. miss: "Again."; hook: "Nearly mine."; bonk/pushback: "That was the counter's fault."; win: "Worth it." ~4 lines per outcome, random no-repeat.
2. Downscale `ebi-collage.png` (single seated cut-out) to 300px wide (`sips --resampleWidth 300` into scratchpad) and base64 it. Check size < 200KB.
3. Write `<scratchpad>/egg-heist/index.html`:
   - `:root` colour tokens (site palette: warm cream bg, Ebi's `bgColor` #A34A2E accent), dark-mode tokens per artifact contract, explicit body bg. `<title>The Egg Heist</title>`.
   - Spatial contract (stylised, not literal overhead): camera looks down from above the counter. Counter top fills the lower ~65% of frame; its far edge is a horizontal line ~35% from the top; floor tiles above that line, where Ebi stands facing camera (frontal cut-out reads fine as she looks up at the counter). Jump = Ebi moves down toward the edge and scales up, her lower body hidden behind the edge line (counter layered over her lower half), paws drawn as two small CSS ovals landing on the counter at her contact point. Tray starts at a reachable distance (inside a hook's reach) below the edge; each hook drags it toward the edge from its current position. Tray rotation accumulates ±3–6° per drag, total clamped to ±MAX_TILT_DEG; overhang/tip visual only fires at the integer win.
   - Scene: overhead CCTV frame. Grey counter top fills most of frame; its near-floor edge is a horizontal line near the top; floor tiles beyond it, where Ebi stands. Tray of eggs (pink/red carton grid, CSS) on counter; its distance from the edge = progress (start far, win = overhangs edge), with small accumulated rotation (±3–6° per drag). Ebi on the floor side seen from above: cut-out scaled small; on jump she scales up (closer to camera) and her front half overlaps the counter edge. Timestamp overlay top-left ticks in real seconds from a fixed start (e.g. 11:28:49); faint grain + vignette via CSS. Power bar is HUD outside/at the side of the CCTV frame with highlighted sweet band.
   - Constants block: `TARGET_UNITS=20`, `SWEEP_MS=1100` (one fill, 2200ms round trip), `SWEET_WIDTH=0.14`, `PERFECT_WIDTH=0.05` (both full widths), `SHIFT=0.08`, `CENTRE_MIN=0.47`, `CENTRE_MAX=0.85`, `INITIAL_CENTRE=0.7`, `MAX_TILT_DEG=20`.
   - Power: `triangle(elapsedMs)` new helper, elapsed = now − chargeStart (same calc for render and release, using event.timeStamp on release); 0 rising to 1 over SWEEP_MS, then falling. Release: below band → miss; in band → hook (perfect if within the central PERFECT_WIDTH); above band → too strong. Works on rising or falling sweep.
   - Progress in integer half-hook units: target 20; hook +2, perfect +3, too strong −2 (clamped ≥0). ≥20 → win. Visual tray position derived from units.
   - Sweet band centre shifts ±SHIFT random after each jump, clamped to [CENTRE_MIN, CENTRE_MAX]; frozen during a charge. After release keep the release marker + band visible ~0.6s so the result reads.
   - Jump animation (~600ms), outcome-driven poses (not literal physics): miss = Ebi pops up small, paws don't clear the edge; hook = paws land on counter, reach tray, drag it toward edge with a twist; too strong = Ebi lunges far over the counter, body bumps the tray further away (it slides away from edge), brief wobble. Input ignored during animation.
   - Input: charge owned by whichever started it (pointerId or Space). `pointerdown` + `setPointerCapture`; release on that pointer's `pointerup`, or `pointermove` outside game bounds; `pointercancel`, window `blur`, `visibilitychange` hidden = cancel charge with no jump. `keydown Space` (ignore `repeat`) / `keyup Space`. Space on focused button doesn't also charge. `touch-action: none` on game area; `preventDefault` on space to stop scroll.
   - HUD: "Jumps: N". Thought bubble near Ebi after each result (~1.2s), non-blocking: next charge allowed immediately, next result replaces it.
   - Intro: overlay "House empty." with door-shut text cue (CSS, no audio required; optional tiny WebAudio jingle off by default). Tap/space skips. Then "Hold to jump" hint until first jump.
   - Win: tray tips over edge and drops onto floor side (scale down + twist), eggs crack (yellow splats), Ebi eats; short pause; door-open beat (light change + timestamp jumps to 18:42:07 as the door opens), Ebi sits innocently by the mess; card: "N jumps. Worth it." + "Go again" button resets state.
   - Layout: scene scales to width (aspect-ratio box), works at 360px phone width, 16px gutters, no horizontal scroll.
   - Build in two passes: pass 1 = CCTV layout, bar, three contact animations, tray, progress, replay; check a hook at both start and near-edge tray positions; check several consecutive jumps feel responsive. Pass 2 = intro, bubbles, ending.
   - Playtest stats: attempts, hooks, perfects, overshoots, elapsed time logged to console after every jump (so abandoned sessions count) and on end card.
4. Publish with Artifact tool (load `artifact-design` skill first), icon "game".
5. Open in Chrome; play through on desktop width and phone width (resize). Use touch emulation too. Verify all three outcomes, mixed pointer/Space, blur mid-charge, hidden tab cancel, second-finger ignored, boundary exit then pointerup (no second jump), intro-skip tap doesn't charge, Space on replay button, reduced motion, hook on falling sweep, repeated replay, pushback clamp at 0, win sequence, go again, spacebar, no page scroll on hold.
6. Hand to Alan with a short list of tuning knobs to adjust after he plays.

## Edge cases
- Release before any fill (tap) → p≈0 → miss; fine.
- Holding forever → ping-pong continues; no auto-release.
- Pushback at progress 0 → stays 0, still bonk animation + line.
- Pointer leaves area while held → treat as release.
- Multi-touch → only first pointer tracked.
- Space held with key repeat → ignore repeats.
- Input during intro/animation/win → ignored (except intro skip, go again).
- `prefers-reduced-motion` → shorten animations, keep game playable.

## Tests / verification
Throwaway: no unit tests. Manual playthrough in Chrome at desktop and ~375px width, checklist in step 5. Console free of errors.

## Open risks
- Overshoot penalty vs random play: baseline ~14% hooks vs ~23% overshoots at start, so a careless player can stall. Settled mechanic; watch in playtest and tune band/centre if Alan stalls.
- Feel depends entirely on tuning (bar speed, band width); expect Alan to want changes. Keep constants obvious.
- Single static cut-out may make jumps look stiff; squash/stretch + rotation should carry it for a feel test.
- Real phone check needs Alan.
