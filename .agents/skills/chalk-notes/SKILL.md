---
name: chalk-notes
description: Add or adjust the handwritten chalk notes and arrows beside a Towner Godpawrents diary portrait. Use for chalk note wording, placement, or changes to a portrait that already has notes.
---

Keep the dog as the main subject, with short cream handwritten asides nearby.

Vary the marks across notes. When a phrase suits underlining, use `portraitNotes.leftUnderline` or `rightUnderline` and omit that note’s arrow. Keep arrows on other notes so the portrait does not give every aside the same treatment. Luna’s “Has no chill” underlines only “no chill”.

1. Inspect the current diary portrait in the configured Playwright browser. Read `docs/agents/voice.md` before changing wording. Preserve approved copy unless the user requests a change.
2. Place text and marks close to the visible dog's outline, with a clear gap. Judge the photographic silhouette, including its torn-paper edge, rather than the rectangular image bounds or transparent padding. The dog must not overlap any letters or marks.
3. Draw each arrow from its note toward the dog. Its arrowhead should clearly aim at a nearby part of the dog and stop just short of the outline. Follow the tangent into the arrowhead when judging direction; an arrow aimed into empty space fails even if it is nearby.
4. Use the existing `PortraitNotes.astro` treatment. The guest's `portraitNotes.inset.left/right` values move notes inward by fractions of the image width to compensate for transparent margins. Tune against the rendered portrait; replacing the cutout requires checking these values again. Preserve the pat interaction and keep chalk notes hidden below 640px.
5. Inspect the rendered result at desktop and at the narrowest width showing notes (640px), then verify the notes are hidden on mobile. For shared-component edits, check every guest with `portraitNotes`. Examine every letter, arrowhead, and the visible outline, including the portrait's normal motion. Open previews in the browser for Alan; links alone are insufficient.

Finish only when the notes are near the dog, no text or marks touch the dog, and every arrow visibly points at the dog. A build or bounding-box check alone cannot establish this. Report any missing visual verification. Build and ship using `AGENTS.md`; shared rendering changes go through a PR.
