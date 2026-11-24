# The Egg Heist: art and gameplay experiments

**Status: illustrated rear-view art approved as the visual target; gameplay still experimental. Not approved for the live site.** Related to [issue #131](https://github.com/alantay/townergodpawrents/issues/131).

## Latest: illustrated Ebi, 12 November 2026

Alan chose the clean illustrated direction A, accepted its motion study, and approved the rear-view version with the same kitchen and egg position. [The illustrated studies](illustrated/README.md) preserve that progression and a one-button playable test: Ebi crouches, jumps, catches the eggs and lands. This is an interaction test with no timing challenge or scoring yet.

Open [the playable HTML](illustrated/ebi-a-playable-20261112.html) locally, or use the local server below at [the playable test](http://localhost:8877/illustrated/ebi-a-playable-20261112.html). Space, the Jump button or a click on the kitchen starts an attempt; Reset restores the eggs. Phone input has not been tested on a real device.

The earlier paper and painted prototypes below remain parked. Their KIV verdict does not describe the newer illustrated art, and approval of that art does not approve site integration or establish that the game is fun.

## Earlier KIV prototypes

Ebi tries to pull an egg tray off the kitchen counter while the house is empty. Hold to charge a jump and release in the green band. Weak jumps miss; a good jump pulls the tray closer; too much power pushes it back. Eventually the tray falls, and Ebi looks innocent beside the mess.

Alan preferred the layered-paper direction B over painted A, and preferred this game to the Tyrion pointer-chase experiment. After the polish pass, his latest verdict was: **“kiv these. still not a fan.”** The preference for B is a relative choice, not acceptance of the game. Keep this draft for reference. Do not merge or integrate into the homepage without a fresh decision.

## Try the archived versions

From the repository root:

```sh
python3 -m http.server 8877 --bind 127.0.0.1 --directory experiments/egg-heist
```

- [Paper B, polished](http://localhost:8877/paper/): latest paper prototype, with outcome feedback, paper reaction portraits, landing dust and the innocent ending pose.
- [Paper B, before polish](http://localhost:8877/paper/baseline.html): original B for comparison.
- [Painted A](http://localhost:8877/painted/): same hold-and-release rules, different art treatment.

Mouse, touch and Space are supported. No build, package install or API key is required. The HTML files also work when opened locally. The “Art directions” link in the earlier versions points to the private comparison Artifact; it is not needed to play.

## What is preserved

```text
paper/           B before/after polish, kitchen, sprite sheet and reaction sheet
painted/         A prototype, kitchen and sprite sheet
art-directions/  A gouache, B layered paper, C felt two-pose studies
screenshots/     B before/after, hook and ending captures
notes/           original plan, art prompts and design audit
illustrated/     approved art direction, side/rear motion studies and playable jump
```

Raster images were extracted unchanged from the self-contained Artifact files, so the archived HTML is readable. Runtime constants, scoring and input handling remain inline. These are disposable prototypes, not production components. All files live outside Astro's `src/` and `public/`; there is no route, homepage hook, production import or dependency change.

## Decisions and caveats

- Side view replaced the unsuccessful overhead/CCTV approach.
- Ebi launches vertically from beside the counter, with no run-up or horizontal gap.
- Paper Ebi, the kitchen and eggs share a material treatment. This exception was approved for the game studies; the real guest avatar stays photographic.
- Controls, ping-pong power, shifting green band, progress, overshoot penalty and no-loss flow were retained during the visual polish pass.
- The original plan in `notes/` is historical: it predates the side view, generated art and latest KIV verdict. This README is the current status.
- The baseline still contains hidden CCTV/door markup and other prototype remnants. The polished ending is a visual approximation rather than a complete eating animation. The four main jump poses can still feel like image swaps.
- Generated artwork has been checked for alpha transparency. Matching scale, natural motion and overall feel still need human judgment.
- Audio, site integration, production performance work and a real-phone playtest remain undone.

## Validation recorded before parking

The B polish pass was rendered in local Chrome at desktop and phone widths. Misses, perfect hooks, overshoots, win/replay, keyboard and pointer input, blur cancellation and reduced motion were checked; no page errors or horizontal overflow were observed. Scoring, power classification and input handler source were unchanged by that pass. See [the design review](notes/design-review.md) and [screenshots](screenshots/).

The archive extraction was separately checked for missing local assets, JavaScript syntax and browser loading. Technical checks passing do not mean the game feels right or is approved.

## Private Artifact references

These are snapshots for Alan and may require his Claude account. The local copies above are the durable source.

- [Three art directions](https://claude.ai/artifact/9ouwAj44h5WeZ5AcemnjFG)
- [Painted A](https://claude.ai/artifact/UxgzufXpCUPUWF7MsWZUy1)
- [Paper B, latest polished version](https://claude.ai/artifact/KjC8S9ZK8VwRrHkrjkPxAA)

To revisit: start with a small feel test and Alan's latest feedback, rather than treating the old plan or design scores as approval to build.
