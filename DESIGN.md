---
name: The Towner Godpawrents
description: A hand-kept guest book for borrowed dogs — warm paper, one electric accent, and nothing quite straight.
colors:
  paper: "#efe7d8"
  ink: "#1e2019"
  cream: "#f7f2e7"
  cream-bright: "#f3f1e9"
  lime: "#d8f24e"
  lime-soft: "#e9f7ae"
  moss: "#5f6e4f"
  moss-deep: "#4c6b3c"
  muted: "#4a4b41"
  label: "#55564a"
  line: "#a99b7f"
  card-line: "#cdbf9e"
  card-line-dark: "#5b6e50"
typography:
  display:
    fontFamily: "Instrument Serif, Georgia, serif"
    fontSize: "clamp(62px, 19vw, 120px)"
    fontWeight: 400
    lineHeight: 0.88
    letterSpacing: "-0.02em"
  headline:
    fontFamily: "Instrument Serif, Georgia, serif"
    fontSize: "clamp(40px, 11vw, 72px)"
    fontWeight: 400
    lineHeight: 0.9
    letterSpacing: "-0.02em"
  title:
    fontFamily: "Instrument Serif, Georgia, serif"
    fontSize: "32px"
    fontWeight: 400
    lineHeight: 1
  subtitle:
    fontFamily: "Instrument Serif, Georgia, serif"
    fontSize: "22px"
    fontWeight: 400
    fontStyle: "italic"
    lineHeight: 1.2
  body:
    fontFamily: "Archivo, Helvetica, sans-serif"
    fontSize: "16px"
    fontWeight: 400
    lineHeight: 1.625
  label:
    fontFamily: "Archivo, Helvetica, sans-serif"
    fontSize: "13px"
    fontWeight: 600
    lineHeight: 1.2
  micro:
    fontFamily: "Archivo, Helvetica, sans-serif"
    fontSize: "11px"
    fontWeight: 600
    letterSpacing: "0.1em"
    textTransform: "uppercase"
  script:
    fontFamily: "Caveat, cursive"
    fontSize: "24px"
    fontWeight: 500
    lineHeight: 1.15
rounded:
  photo: "10px"
  mat: "16px"
  card: "22px"
  entry: "24px"
  hero: "32px"
  pill: "999px"
spacing:
  page-gutter: "1.25rem"
  rule-gap: "1.125rem"
  card-pad: "1.1875rem"
  section: "2rem"
  major: "3rem"
components:
  hero-card:
    textColor: "{colors.cream}"
    rounded: "{rounded.hero}"
    padding: "26px 24px 0"
  guest-card:
    rounded: "{rounded.card}"
  guest-card-caption:
    backgroundColor: "{colors.cream}"
    textColor: "{colors.ink}"
    padding: "11px 13px 14px"
  diary-entry:
    rounded: "{rounded.entry}"
    padding: "18px 19px 20px"
  print-mat:
    backgroundColor: "{colors.cream}"
    rounded: "{rounded.mat}"
    padding: "7px"
  chip-cream:
    backgroundColor: "{colors.cream}"
    textColor: "{colors.ink}"
    typography: "{typography.label}"
    rounded: "{rounded.pill}"
    padding: "7px 13px"
  chip-lime:
    backgroundColor: "{colors.lime}"
    textColor: "{colors.ink}"
    typography: "{typography.label}"
    rounded: "{rounded.pill}"
    padding: "7px 13px"
  nav-pill:
    textColor: "{colors.ink}"
    typography: "{typography.label}"
    rounded: "{rounded.pill}"
    padding: "6px 13px"
  nav-pill-hover:
    backgroundColor: "{colors.lime}"
  nav-pill-active:
    backgroundColor: "{colors.lime}"
  day-chip:
    textColor: "{colors.ink}"
    rounded: "{rounded.pill}"
    padding: "0.3rem 0.8rem"
  day-chip-active:
    backgroundColor: "{colors.lime}"
  status-badge:
    backgroundColor: "{colors.lime}"
    textColor: "{colors.ink}"
    rounded: "{rounded.pill}"
    padding: "8px 13px"
---

# Design System: The Towner Godpawrents

## Overview

**Creative North Star: "The Kitchen Table Guest Book"**

A guest book that never made it to a lectern. It lives on the kitchen table, where photos get taped in crooked, dates get written by hand, and somebody adds a joke in the margin. The formality of a guest book — every visitor named, dated, given a page — carried out with none of a guest book's stiffness. That tension is the whole system: rigorous record-keeping, scruffy execution.

The mood is **playful, scrappy and affectionate**. Warm paper under everything, one electric accent used sparingly, and a house rule that nothing sits perfectly straight until you reach for it. Personality arrives through small ambient movement — a badge that wiggles, a cut-out that drifts, a different footer line on every visit — rather than through visual noise. The site is small on purpose: one 700px column, no sidebars, no chrome, nothing to navigate.

Colour is the one thing the system gives away. The house palette is oat paper and olive ink; every large coloured surface on the site belongs to whichever dog is staying, drawn from that guest's own `bgColor`. The design frames; the dog colours.

**Key Characteristics:**
- Warm paper ground (`#efe7d8`), never white
- One electric accent (`#d8f24e`), rationed to "happening now"
- Serif for names, sans for sentences, handwriting once per page
- Every card tilted a degree or two at rest, straightening when approached
- Brown-green shadows, never grey — paper in a sunny room
- Single 700px column at every screen size

## Colors

Warm, low-contrast and organic, with one deliberate shock of electric yellow-green. Every neutral leans olive rather than blue.

### Primary
- **Tennis Ball** (`#d8f24e`): The only high-energy colour in the system, and the one the eye jumps to. Reserved for now-ness and action: the "Here today" badge, the active day chip, hover on the nav pill and "See all", the "New" tag on unread entries. Never a large field, never decorative.
- **Tennis Ball Wash** (`#e9f7ae`): The accent at low volume. The italic tagline sitting on a guest's coloured hero, and the tilted "Godpawrents" highlight in the wordmark. It exists because the full Tennis Ball would shout on top of a saturated hero.

### Secondary
- **Sofa Moss** (`#5f6e4f`): The house's own colour, used where no single guest owns the surface — the Vacancy hero, and the hero when two dogs are staying at once. When the site has to speak for itself rather than for a dog, it speaks in moss.
- **Damp Moss** (`#4c6b3c`): Link hover only. The one place a colour shift signals "this is a link, and you're on it."

### Neutral
- **Sunned Oat** (`#efe7d8`): The page ground. Everything rests on it. It is never white and never neutral grey — the whole warmth of the site starts here.
- **Wet Nose Black** (`#1e2019`): Body text, headlines, focus rings, and the dot on each diary day marker. An olive-cast near-black, softer on oat than true black.
- **Photo Mat** (`#f7f2e7`): The lighter cream that behaves like a mounting card — the mat behind every diary print and clip, the caption band under each dog card, the host portrait's backing, and text on the mid-dark guest surfaces.
- **Bleached Bone** (`#f3f1e9`): A half-step brighter than Photo Mat, used only for text on the deepest diary skin, where Photo Mat starts to sink into the background.
- **Old Muzzle** (`#4a4b41`): Secondary text — breed and dates on a dog card.
- **Collar Tag** (`#55564a`): The tiny engraved uppercase — footer lines, guest counts, "Latest stay".
- **Kibble Line** (`#a99b7f`): The standard 1.5px keyline: section rules, the nav underline, the diary timeline rail, day chips at rest.
- **Biscuit Line** (`#cdbf9e`): The warmer, quieter keyline on small light cards — print mats, the host portrait.
- **Moss Line** (`#5b6e50`): The same keyline role on the two dark diary skins, where Biscuit Line would glare.

### Named Rules

**The Guest Owns the Colour Rule.** Every large coloured surface — the hero, the dog card, every diary entry skin — takes its colour from that guest's `bgColor`, not from this palette. The palette is the house; the colour is the dog. Never hardcode a guest-surface colour.

**The Tennis Ball Rule.** `#d8f24e` marks what is happening now or what to press. If an element is neither live nor interactive, it does not get the accent. Its rarity is what makes it work on a page that is otherwise entirely warm neutrals.

**The Olive Cast Rule.** Every neutral in this system is warm and slightly green. A cool grey, a pure black, or a true white anywhere on the page will read instantly as foreign.

## Typography

**Display Font:** Instrument Serif (with Georgia, serif)
**Body Font:** Archivo (with Helvetica, sans-serif)
**Script Font:** Caveat (cursive)

**Character:** A high-contrast editorial serif doing the shouting, a plain workhorse sans doing the talking, and a felt-tip handwriting that turns up exactly once. The serif set at huge sizes with tight leading (0.88) and negative tracking gives each dog's name the scale of a magazine cover; Archivo underneath keeps the diary readable and unfussy.

### Hierarchy
- **Display** (400, `clamp(62px, 19vw, 120px)`, 0.88, -0.02em): The live dog's name, and the word "Vacancy". Set on `.fit-headline`, which caps at the viewport and then hands off to a `fitText()` script that shrinks further if a long name — or two names joined by "&" — would still overflow. Two dogs drop to `clamp(42px, 12.5vw, 82px)`.
- **Headline** (400, `clamp(40px, 11vw, 72px)`, 0.9, -0.02em): Page titles — "Everyone who's stayed", and a guest's name on their own page at `clamp(48px, 13vw, 88px)`.
- **Title** (400, 32px, 1): Section heads — "Past guests", "The full diary". Always sitting directly under a 1.5px rule.
- **Subtitle** (400 italic, 20–22px): The tagline under a name, in Tennis Ball Wash on the hero. The only italic in the system.
- **Date** (400, 24px, serif): The `## 13 Sep` diary day divider, paired with a hairline rule that runs to the right edge.
- **Body** (400, 16px, 1.625): Diary entries and intro paragraphs. Measure is capped — 58ch inside a diary entry, 52ch in a page intro.
- **Label** (600, 13px): Chips, pills, and buttons.
- **Micro** (600, 11–12px, 0.1em, uppercase): Footer lines, guest counts, "Latest stay", entry timestamps (at 0.08em).
- **Script** (500, 24px): The rotating footer line on the homepage. Nothing else.

### Named Rules

**The Serif Says the Name Rule.** Instrument Serif is for names, page titles, section heads, and dates — things you point at. Archivo carries everything read as sentences. A serif paragraph is a bug.

**The One Line of Handwriting Rule.** Caveat appears exactly once on a page, as the host's aside in the footer. It reads as a note scrawled at the bottom because it is the only one. A second instance would turn a voice into a decoration.

**The Numbers Line Up Rule.** Any date or count that repeats down the page (`.archive-date`, `.diary-stay`) is set in `font-variant-numeric: tabular-nums`, so a column of stays doesn't shimmer.

## Layout

One column, `max-width: 700px`, `padding-inline: 1.25rem`, centred, at every screen size. There is no desktop layout and no mobile layout — there is one layout that gets more margin. This is a page read on a phone while someone waits for news of their dog, and the desktop view is the same page with air around it.

Vertical rhythm is carried by 1.5px rules rather than by space alone: a section break is `margin-top: 3rem`, a `border-top`, then `padding-top: 1.125rem` before the heading. Sections within a page step at `2rem`. The body carries `padding-bottom: 6rem` so the last entry never sits on the fold.

The past-guests grid is the one place the column subdivides: `repeat(auto-fill, minmax(160px, 1fr))` with a `0.875rem` gap, which yields two columns on a phone and four at full width without a single breakpoint. The newest guest spans two columns when three or more guests exist, giving the grid a deliberate off-balance first row.

Breakpoints are used sparingly and only where content demands: `480px` promotes paired and quadruple print grids to two columns; `640px` indents even-numbered diary entries by `1.5rem` so the timeline reads as a hand-stacked pile rather than a flush list, and reveals the "Latest stay" marginal note.

### Named Rules

**The One Column Rule.** Never introduce a sidebar, a split view, or a second reading column. If something doesn't fit in 700px, it is cut or it goes on its own page.

**The Rule Above the Heading Rule.** Every major section opens with a hairline across the full column, then its heading. The line is the section break; extra whitespace is not a substitute.

## Elevation & Depth

**Paper on paper.** Every surface is a sheet resting on the oat ground, and depth comes from three properties of a sheet: it casts a warm shadow, it sits at a slight angle, and it has a keyline edge where the paper is cut. No surface floats, no surface is glassy, and nothing uses a neutral drop shadow.

Shadows are brown-green and translucent because they are cast by paper in a sunny room, not by a UI element on a grey canvas. They are soft and low-offset; the largest in the system lifts 16px. Rest state is always the smaller shadow, and hover raises rather than spreads.

Tilt is the second depth cue and the more characteristic one. Diary entries alternate `-1deg` / `+1deg`; prints lean the opposite way to their card (`+1.5deg` / `-1.5deg`) so each photo reads as laid into the page rather than placed by a grid; the host portrait sits at `-1.5deg`; the "Godpawrents" highlight at `-2deg`. Approaching a tilted thing straightens it.

### Shadow Vocabulary
- **Card rest** (`box-shadow: 0 10px 20px rgb(92 76 41 / 0.1)`): Dog cards in the past-guests grid.
- **Card lifted** (`box-shadow: 0 16px 26px rgb(70 92 56 / 0.17)`): The same card on hover — deeper, and shifted greener as it rises toward the moss.
- **Entry rest** (`box-shadow: 0 9px 17px rgb(92 76 41 / 0.08)`): Diary entries. Lighter than a dog card because entries stack densely.
- **Print mat** (`box-shadow: inset 0 1px 0 rgb(255 255 255 / 0.44), 0 6px 12px rgb(30 32 25 / 0.12)`): The only inset in the system — a highlight along the mat's top edge that reads as the cut of thick card — over a cool, tight drop shadow. Print mats sit on coloured diary skins, so their shadow is neutral-cool where every other shadow is warm.

### Named Rules

**The Warm Shadow Rule.** Shadows are `rgb(92 76 41 / …)` or `rgb(70 92 56 / …)` — brown and moss. Never grey, never pure black. The single exception is the print mat, which sits on saturated colour rather than on paper.

**The Nothing Sits Straight Rule.** A card, print or portrait at rest is rotated between 0.75° and 2°. Zero degrees is a state, not a default — it means the visitor is touching this.

## Shapes

Soft, generous, fully-rounded rectangles throughout; there is not a sharp corner on the site. Radius scales with the size of the sheet — the bigger the piece of paper, the rounder its corner:

- **Hero** (32px): The full-width coloured card carrying a dog's name.
- **Diary entry** (24px): A single moment's card.
- **Dog card / portrait** (22px): Grid tiles and the host photo.
- **Print mat** (16px): The cream card a photo or clip is mounted on.
- **Photo** (10px): The image itself, inside its mat — a smaller radius so the mat's corner stays visibly outside the photo's.
- **Pill** (999px): Everything interactive and everything that labels — chips, badges, day chips, nav, the "New" tag, the print viewer's close button.

Edges are 1.5px keylines, never 1px — at 1px a warm low-contrast line disappears on oat. The weight is consistent from the nav underline to a print mat; only the colour changes with the surface underneath (Kibble Line on paper, Biscuit Line on cream, Moss Line on dark skins).

Cut-outs are the deliberate exception: a guest's portrait has no frame, no radius and no shadow. It is a dog photographed and cut from its background, sitting directly on the coloured hero with its feet at the bottom edge, overflowing the card. That is a different photographic language from a print on a mat, and mixing them would flatten both.

### Named Rules

**The Radius Ladder Rule.** 32 → 24 → 22 → 16 → 10 → pill. A new component picks the step that matches its physical size, never an arbitrary value.

**The Mat And The Cut-Out Rule.** Photographs appear in exactly two forms: mounted on a cream mat with a keyline (diary prints and clips), or cut from their background with no frame at all (guest portraits). There is no third treatment.

## Components

Interactive things are **nudged and nudging back**. Elements react a little more than expected, and several have an idle life of their own. The signature easing is `cubic-bezier(0.16, 1, 0.3, 1)` — a fast, overshoot-free settle — at 200ms for state changes and 520–620ms for arrivals.

### Buttons and Pills
- **Shape:** Fully round (`999px`), 1.5px Kibble Line border, `6px 13px`.
- **Type:** Archivo 600 at 13px.
- **Hover:** Fills Tennis Ball and rises 1px (`-translate-y-px`). Active presses back to 0 and scales to `0.98`.
- **Focus:** A 2px Wet Nose Black ring at 3–4px offset against paper, never a browser default.
- **Touch target:** Compact pills carry an invisible `::before` overlay extending 5–6px above and below, so a 13px chip meets ~44px without growing. Every pill smaller than 44px must do this.

### Chips
- **Cream chip** (`#f7f2e7` on the guest's colour): Facts — breed, stay dates, which day of the stay it is.
- **Lime chip** (`#d8f24e`): The guest's `badge` — the one characterful phrase. One per hero, maximum.
- Chips sit in a single wrapping row under the tagline, `8px` gap, `7px 13px` padding.

### Day chips
- A sticky horizontal strip under the top edge, with a `blur(6px)` backdrop over 92% paper — the only backdrop-filter in the system.
- Scrolls sideways rather than wrapping, scrollbar hidden, so a long stay stays one row.
- Rest is a Kibble Line outline; hover and active fill Tennis Ball, active also taking a Tennis Ball border. The active chip is driven by scroll position and auto-scrolls itself into view.
- Anchored days carry `scroll-margin-top: 4rem` so a jumped-to day lands below the strip rather than under it.

### Dog cards
- **Shape:** 22px, coloured by the guest's `bgColor`, cut-out on top in a `9px` bed, cream caption band below.
- **Caption:** Serif name at 22px, then breed and latest stay at 13px in Old Muzzle.
- **Hover:** The one place the system tilts *toward* chaos instead of away — the card rotates to `1.5deg`, lifts 4px, scales `1.02`, and its shadow deepens and greens. It behaves like a photo being picked up off a pile.
- **Entrance:** `.reveal-card` — fades and rises 18px on scroll into view, via an IntersectionObserver at `0.12` threshold, observed through a MutationObserver so client-rendered cards animate too.

### Diary entries
The signature component. Each entry is a tilted card on a **skin derived from the guest's own colour** — a four-step ladder that repeats down the page, so a long day reads as a stack of different papers rather than a list of rows:

1. Guest colour mixed 72% into cream — pale, dark ink.
2. The guest colour, neat — cream text.
3. Guest colour mixed 38% toward ink — dark, cream text.
4. Guest colour mixed 72% toward ink — darkest, near-white text.

Skins 3 and 4 switch their keyline to Moss Line. Each entry carries a timestamp in uppercase micro type next to a small dot, both in the skin's own accent tone. Entries alternate `-1deg`/`+1deg` and straighten with a 2px lift and `brightness(1.04)` on hover.

- **Prints:** Up to four, each mounted on a cream mat and leaned against the card's tilt. Width is computed from the photo's real aspect ratio against a 420px height cap, so a tall portrait goes narrow rather than towering, and nothing is ever cropped. Click opens a full-viewport `<dialog>` with an 88% Wet Nose Black backdrop.
- **Clips:** One per entry, never alongside prints. Same cream mat, native controls, no autoplay, `preload="metadata"`.
- **The video exception:** Clip cards stay at `0deg` at rest and do not lift or brighten on hover. A CSS `filter` on an ancestor forces a `<video>` through software compositing and garbles the frame — so the tilt is dropped rather than letting a card snap straight the moment you press play and tilt back as you move away to watch.

### Timeline
A 1px Kibble Line rail down the left of the diary, with each day's heading marked by a 0.55rem Wet Nose Black dot ringed in a 2px paper border — a punched hole rather than a bullet. The rail stops short at both ends so it reads as drawn, not as a container edge.

### Navigation
- Wordmark in 21–26px serif, with "Godpawrents" in an italic Tennis Ball Wash highlight rotated `-2deg` that straightens on hover — the site's handshake, and the clearest statement of the tilt rule.
- A single "Past guests" pill on the right, filled Tennis Ball with a Wet Nose Black border when it's the current page, and carrying `aria-current="page"`.
- Separated from the page by a 1.5px rule. There is no mobile nav — two items never need one.

### Motion
- **Arrivals:** `.entrance` (fade + 14px rise, 520ms) and `.entrance-hero` (fade + 12px rise, `-0.75deg` and `0.98` scale settling to zero, 620ms), staggered at 90/180/270ms. Deliberately one-shot — content settles like a card put down on a table and then stays still.
- **Ambient loops:** `drift` (8px vertical, 6–7s) on hero cut-outs, `wiggle` (`+5deg`/`-3deg`, 4.5s) on the "Here today" badge. These are the only perpetual animations; they belong to the dog and its status, never to layout.
- **Reduced motion:** `prefers-reduced-motion: reduce` kills every animation and transition and forces reveal cards visible. Any new animation must be added to that block.

### Named Rules

**The Straighten On Approach Rule.** Tilted things rotate to `0deg` on `:hover` and `:focus-visible`. Interaction squares the paper to you. The lone exception is a clip card, for the compositing reason above.

**The Skins Belong To The Dog Rule.** Diary skins are always computed from the guest's `bgColor` through `diarySkin()`. Never add a fixed entry background — it would break the page's identity the moment a different dog is staying.

**The Idle Life Rule.** Only two things move on their own: the status badge and the hero cut-out. Everything else is still until scrolled to or touched. A third perpetual animation would make the page restless.

## Do's and Don'ts

### Do:
- **Do** take every large coloured surface from the guest's own `bgColor`, via `diarySkin()` for entries.
- **Do** use the 1.5px keyline at every scale, switching its colour to match the surface (`card-line` on cream, `card-line-dark` on dark skins, `line` on paper).
- **Do** tilt new cards between 0.75° and 2°, and straighten them on hover and focus.
- **Do** give any pill under 44px an invisible `::before` hit area rather than enlarging it.
- **Do** cap measure — 58ch inside diary entries, 52ch in intros.
- **Do** add every new animation to the `prefers-reduced-motion` block in the same commit.
- **Do** size prints from their real aspect ratio against the 420px height cap; never crop a dog.
- **Do** keep focus rings as a 2px Wet Nose Black outline at 3–4px offset.

### Don't:
- **Don't** introduce a cool grey, a pure black, or a true white. Every neutral here is warm and olive-cast.
- **Don't** use Tennis Ball (`#d8f24e`) on anything that is neither live nor interactive, and never as a large field.
- **Don't** set body copy in Instrument Serif, or use Caveat more than once on a page.
- **Don't** add a second column, a sidebar, or a desktop-specific layout. 700px, one column, everywhere.
- **Don't** use a neutral grey drop shadow — shadows are `rgb(92 76 41 / …)` or `rgb(70 92 56 / …)`.
- **Don't** apply a CSS `filter` or a transform to any ancestor of a `<video>`; it garbles the frame.
- **Don't** frame a cut-out or leave a print unmatted. Those are the only two photo treatments.
- **Don't** add a third perpetual animation.
- **Don't** hardcode a hex where a token exists. Every colour in this palette lives in `@theme` in `src/styles/global.css` — reach for `var(--color-…)`, including inside JS-built markup. The single exception is the arguments to `mixHex()`/`mix()`, which parse the string themselves and must stay literal hex.
