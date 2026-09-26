---
name: The Towner Godpawrents
description: No dog of our own, just everyone else's.
colors:
  paper: "#efe7d8"
  ink: "#1e2019"
  cream: "#f7f2e7"
  slip-fibre: "#fdfaf1"
  lime: "#d8f24e"
  lime-soft: "#e9f7ae"
  moss-link: "#4c6b3c"
  muted: "#4a4b41"
  label: "#55564a"
  card-line: "#cdbf9e"
  card-line-dark: "#5b6e50"
  line: "#a99b7f"
typography:
  display:
    fontFamily: "Instrument Serif, serif"
    fontSize: "clamp(48px, 13vw, 88px)"
    fontWeight: 400
    lineHeight: 0.88
    letterSpacing: "-0.02em"
  headline:
    fontFamily: "Instrument Serif, serif"
    fontSize: "32px"
    fontWeight: 400
    lineHeight: 1
  title:
    fontFamily: "Instrument Serif, serif"
    fontSize: "24px"
    fontWeight: 400
    lineHeight: 1
  tagline:
    fontFamily: "Instrument Serif, serif"
    fontSize: "20px"
    fontWeight: 400
    lineHeight: 1.2
  body:
    fontFamily: "Archivo, Helvetica, sans-serif"
    fontSize: "16px"
    fontWeight: 400
    lineHeight: 1.625
  chip:
    fontFamily: "Archivo, Helvetica, sans-serif"
    fontSize: "13px"
    fontWeight: 600
    lineHeight: 1
  label:
    fontFamily: "Archivo, Helvetica, sans-serif"
    fontSize: "12px"
    fontWeight: 600
    lineHeight: 1.3
    letterSpacing: "0.1em"
  script:
    fontFamily: "Caveat, cursive"
    fontSize: "20px"
    fontWeight: 600
    lineHeight: 1
rounded:
  print-photo: "10px"
  print: "16px"
  thumb: "17px"
  card: "24px"
  hero: "32px"
  pill: "999px"
spacing:
  gutter: "20px"
  page: "700px"
  card-pad: "18px"
  print-mat: "7px"
components:
  guest-hero:
    backgroundColor: "{colors.ink}"
    textColor: "{colors.cream}"
    rounded: "{rounded.hero}"
    padding: "26px 24px 18px"
  chip-cream:
    backgroundColor: "{colors.cream}"
    textColor: "{colors.ink}"
    typography: "{typography.chip}"
    rounded: "{rounded.pill}"
    padding: "7px 13px"
  chip-lime:
    backgroundColor: "{colors.lime}"
    textColor: "{colors.ink}"
    typography: "{typography.chip}"
    rounded: "{rounded.pill}"
    padding: "7px 13px"
  nav-pill:
    textColor: "{colors.ink}"
    typography: "{typography.chip}"
    rounded: "{rounded.pill}"
    padding: "6px 13px"
  nav-pill-hover:
    backgroundColor: "{colors.lime}"
    textColor: "{colors.ink}"
  day-chip-active:
    backgroundColor: "{colors.lime}"
    textColor: "{colors.ink}"
    rounded: "{rounded.pill}"
    padding: "4.8px 12.8px"
  diary-entry:
    rounded: "{rounded.card}"
    padding: "18px 19px 20px"
  diary-print:
    backgroundColor: "{colors.cream}"
    rounded: "{rounded.print}"
    padding: "{spacing.print-mat}"
  diary-slip:
    backgroundColor: "{colors.cream}"
    textColor: "{colors.ink}"
    padding: "18px 16px 13px"
---

# Design System: The Towner Godpawrents

## Overview

**Creative North Star: "The Kitchen-Table Scrapbook"**

Every page is something Alan and Weiwen have just put down on the kitchen table: a warm paper ground with a few coloured cards on it, each a little crooked, photos slipped in as prints with a cream mat, notes on slips torn from a pad, and a scrap of lime tape holding something down. Nothing is aligned the way a template would align it, and nothing is decorated for its own sake either. Each tilt, tear and bit of tape copies something real you'd find in a scrapbook.

The page is one narrow column (700px) read on a phone. Each dog is the main subject. It gets a big serif name, a colour of its own and a cutout photo standing in the hero card. Everything else stays quiet: warm neutrals, one small sans for the functional bits and a single acid-lime accent that means "look here" or "this is live".

Motion is one-shot and physical. Cards arrive as if set down, and hover straightens a tilted card as if you'd picked it up. Once a card has arrived it stays put, apart from a couple of slow idle drifts on the cutout and the "Here today" tag.

**Key Characteristics:**
- Warm paper ground, ink-green text, one lime accent
- Instrument Serif for names and headings; Archivo for everything functional
- Every dog brings its own colour; the diary derives four skins from it
- Tilt everywhere (±1°–2°), straightened on hover
- Real paper effects: torn slips (SVG turbulence), clipped tape, prints on a cream mat
- Soft, warm-brown shadows; no hard elevation

## Colors

A sun-faded kitchen palette: oatmeal paper, deep olive-black ink and one highlighter lime, with each guest dog adding its own saturated colour.

### Primary
- **Highlighter Lime** (`lime`): The single accent. It marks what's current or active: the "Here today" tag, a dog's badge, the active day chip, nav hover and the skip link. It also serves as tape. Seen through at 90% opacity, it holds the reaction picker to the card.
- **Pale Lime Wash** (`lime-soft`): The quiet version of lime. It sits behind the italic "Godpawrents" wordmark, colours the italic tagline on a guest hero and, at 80% opacity, forms the tape scrap holding a reaction count.

### Secondary: the guest colour
Each guest has a `bgColor` in its content frontmatter. The colour fills that dog's hero card. The diary then cycles through four skins mixed from it: a pale tint with ink text, the pure colour with cream text, a 38% ink-deepened version, and a 72% ink-deepened version.

Guest colours come from a fixed, reusable palette. Every one is mid-dark and slightly dusty, and cream text on it passes 5:1:

- **Terracotta** `#A34A2E`
- **Eucalyptus** `#3F6655`
- **Dusk Violet** `#755A83`
- **Harbour Blue** `#39617E`
- **Kaya Ochre** `#7A5C24`
- **Rosewood** `#8E4A5C`
- **Canal Teal** `#2F6B6B`
- **Monsoon Slate** `#4F5A66`

Colours repeat across guests. **Sofa Green** `#5F6E4F` is reserved for the shared hero on days when two dogs are staying, so it's not in the palette.

**The Same-Sofa Rule.** Two dogs whose stays overlap must have different colours, because their entries sit side by side in today's feed. Dogs staying on different dates may share a colour.

### Neutral
- **Oatmeal Paper** (`paper`): The page ground everywhere. It also forms the ring around the timeline dots, so they look punched through.
- **Olive Ink** (`ink`): All primary text, focus outlines and timeline dots. It's the text colour on lime and cream.
- **Cream Card** (`cream`): Card and print mats, caption slips, cream chips, and hero text on guest colours.
- **Slip Fibre** (`slip-fibre`): The 5px paler border on a torn slip, which shows as the rough fibre edge where the paper tore.
- **Moss Link** (`moss-link`): Hover colour for plain text links.
- **Muted Olive** (`muted`) / **Label Olive** (`label`): Secondary text, meta lines, uppercase labels and back links.
- **Kraft Keyline** (`card-line`): The 1.5px edge on cream cards and prints. **Moss Keyline** (`card-line-dark`) is the same edge on the dark diary skins.
- **Pencil Rule** (`line`): Section rules, nav underline, the timeline spine and outlined chips.

### Named Rules
**The One Highlighter Rule.** Lime means "current, active, or taped down." Never use it as a background panel, heading colour or decoration beyond those roles.

**The Dog Owns the Colour Rule.** Saturated colour on a page comes from the guest's `bgColor`. The system itself stays in warm neutrals, so each dog's page looks like that dog.

## Typography

**Display Font:** Instrument Serif (with serif)
**Body Font:** Archivo (with Helvetica, sans-serif)
**Script Font:** Caveat (with cursive)

**Character:** A tall, slightly literary serif carries the names and headings. A plain, sturdy grotesque handles the chips, labels and body text. The serif sets the mood and the sans does the practical work.

### Hierarchy
- **Display** (400, clamp(48px, 13vw, 88px), 0.88, −0.02em): A dog's name in its hero. Homepage names use `fit-headline`, which stays on one line and shrinks with fitText() if a long name or two names would overflow.
- **Headline** (400, 32px, 1): Section heads like "The full diary", plus the wordmark at 21–26px.
- **Title** (400, 24px, 1): Diary day labels ("13 Sep") and card names (22–27px).
- **Tagline** (italic 400, 20–22px): A dog's one-liner under its name, in Pale Lime Wash on the hero, and the rotating joke line in the homepage footer, in ink.
- **Body** (400, 16px, 1.625, max ~52ch): Diary notes and intro copy. Slips set lines at a fixed 28px so the writing sits like ruled paper.
- **Chip** (600, 13px): Pills, nav link and day chips.
- **Label** (600, 11–12px, 0.06–0.1em, uppercase): Stay ranges, "Here today", NEW tags and footer meta. Dates use tabular numbers.
- **Script** (500–600, 18–40px, 1–1.15): Caveat, for words Alan or Weiwen have written onto the calendar: month names (40px), the pup-count note (22px), names on polaroids (20px) and on tape (18px).

### Named Rules
**The Pen on Paper Rule.** Caveat is Alan or Weiwen's own handwriting, so it only goes where one of them could have picked up a pen and written on something. Before using it, check all six:

1. **It's written on a paper object**: a calendar sheet, a polaroid, a strip of tape or a slip. Never directly on the page background (that's the kitchen table), and never on chrome: nav, chips, buttons or uppercase labels.
2. **A person wrote it**: a name, a heading on a sheet, a quick aside. Not text that explains something, and nothing the site itself is saying.
3. **It's one short line, about six words at most.** If it wraps, it's no longer a scribble.
4. **Facts stay in Archivo.** Dates, times, stay ranges and anything that has to be exact are set in Archivo with tabular numbers. The polaroid shows how: the name is handwritten and the dates are printed underneath.
5. **It's never the reading voice.** Diary notes, captions and intro copy are Archivo. One-liners and jokes go in Instrument Serif italic, the same voice as a dog's tagline.
6. **It's 18px or larger, weight 500–600.** A name that runs out of room on a tape strip is cut off with "…"; that's accepted for now.

The calendar is the one page that's meant to look handwritten. Everywhere else, the default is no Caveat.

## Layout

One centred column, 700px max, with a 20px side gutter, built for phones first. Sections are separated by generous vertical space (32–48px) and a 1.5px Pencil Rule with an 18px gap beneath it, never by boxes. The diary is a timeline: a 1px spine on the left, an ink dot punched through the paper at each day heading, and entry cards alternating their tilt (−1° / 1°). From 640px up, every even entry also steps in by 24px, which keeps the pile looking loose. Prints sit in a single column, or in a 2-up grid from 480px when there's a pair or a set of four.

A day strip sticks to the top on long stays. It's a horizontally scrolling row of chips on 92% paper with a 6px backdrop blur, and anchored days scroll to 64px below it. Small targets (chips, reaction badges) get an invisible `::before` hit area so they stay small visually but meet ~44px on touch.

## Elevation & Depth

Depth here is paper lying on paper. Shadows are soft and warm (a brown-olive tint, never neutral grey), and they're paired with tilt, not with lift. Cards cast a low, wide shadow. Prints add a faint inset highlight on top, as if they had a glossy face. Torn slips and the reaction picker cast a drop-shadow through their torn outline, so the shadow follows the tear. Hover straightens a card and nudges it up 2px with a 4% brightness lift; that's the only "elevation change".

### Shadow Vocabulary
- **Card rest** (`box-shadow: 0 10px 20px rgb(92 76 41 / 0.1)`): Dog cards on the index and homepage.
- **Card hover** (`box-shadow: 0 16px 26px rgb(70 92 56 / 0.17)`): The same card when picked up; the shadow shifts toward moss.
- **Diary entry** (`box-shadow: 0 9px 17px rgb(92 76 41 / 0.08)`): Entry cards on the timeline.
- **Print** (`box-shadow: inset 0 1px 0 rgb(255 255 255 / 0.44), 0 6px 12px rgb(30 32 25 / 0.12)`): Photo prints on their mat.
- **Torn paper** (`filter: drop-shadow(0 4px 7px rgb(30 32 25 / 0.2))`): Caption slips and the reaction picker, applied after the tear filter.
- **Sticker** (`filter: drop-shadow(0 2px 2px rgb(30 32 25 / 0.28))`): Reaction stickers piled on a card corner.

### Named Rules
**The Paper Not Glass Rule.** No blur-glow shadows, no neutral-grey elevation, no floating cards. If an object wouldn't cast that shadow lying on a table, don't give it that shadow. The day strip's backdrop blur is the single exception, because it's functional.

## Shapes

Soft rectangles in stepped radii: 10px on a photo inside its print, 16px on the print mat, 24px on cards, 32px on the guest hero, and full pills for every chip and tag. Anything that's meant to be paper breaks the rectangle. Slips are torn by one of three `feTurbulence` displacement filters (`#torn-slip-0/1/2`, defined once in the layout) and rotated through the diary. Tape and reaction counts are `clip-path` polygons with ragged ends, each rotated −32° to +4°. Everything leans: cards ±1°, prints ±1.5° against their card, slips ±0.4° with their card, the picker −1.5°. Cutout dog photos have no box at all; they stand on the hero colour.

### Named Rules
**The Nothing Sits Square Rule.** Cards, prints, slips, tape and stickers each carry a small rotation. Only functional chrome stays level: nav, chips, day strip and buttons. Video entries are also level, because a filter or transform on an ancestor makes `<video>` flicker.

**The Real Tear Rule.** Torn edges come from the SVG filters on the paper layer only, never on the text. Where filters aren't supported, fall back to a 14px-radius keylined card rather than a hard rectangle.

## Components

### Guest Hero
The dog's own card. It fills with the guest's `bgColor`, has a 32px radius and cream text. It holds the display-size name, a Pale Lime Wash italic tagline, a row of chips and the cutout photo standing at the bottom edge (280px tall on the guest page). A lime "Here today" tag sits top-right; on the homepage it wiggles slowly and the hero pops in with a small rotate-and-scale.

### Chips
- **Cream chip:** cream on the hero, ink text, 13px/600, 7px 13px, pill. Used for breed, stay range and stay day.
- **Lime chip:** the dog's badge, same shape in Highlighter Lime.
- **Outlined chip:** 1.5px Pencil Rule, pill, no fill. It fills with lime on hover. Used for the nav "Past guests" link and day chips.
- **NEW tag:** lime pill, 11px uppercase, 0.06em tracking.

### Diary Entry Card
A 24px-radius card in one of the four guest-colour skins, with a 1.5px keyline (Kraft on light skins, Moss on dark), 18px 19px 20px padding, the alternating tilt and the diary-entry shadow. The timestamp and note sit inside, with prints and slips below. Each entry fades and rises into place once as it scrolls into view.

### Print
A photo on a 7px cream mat with a Kraft keyline and 16px radius; the photo inside has a 10px radius. The mat edge turns 72% white against coloured skins so it stays quiet. It leans against its card's tilt. Tapping opens a full-screen viewer on an 88% ink backdrop with a cream circular close button.

### Caption Slip
A note too long for a print's mat goes on a torn cream slip. It's two layers: the torn, shadowed paper layer and the text layer, which is never distorted. The paper has a 5px Slip Fibre border that the tear cuts through. The text is 16px Archivo with 28px lines, inset 8px plus 16px from the edges so the writing clears the ragged edge.

### Reaction Badge and Picker
The empty badge is a faint (35% opacity) add-reaction icon in the card's top-right corner that comes to full strength on hover or focus. Once an entry has reactions, the badge becomes up to three stickers (2.1rem) piled −8° / 6° / −4° and overlapping by 0.85rem, with the most-used on top. The total sits on a Pale Lime Wash tape scrap in one of three clip-path cuts. The picker is a torn cream strip hanging under the badge, taped at both corners with lime scraps. Its stickers scale up and tilt on hover. Errors appear as a small italic cream note under the badge.

### Navigation
The wordmark sits on the left: "The Towner" in serif, then an italic "Godpawrents" on a Pale Lime Wash tag rotated −2°, which straightens on hover. On the right is the outlined "Past guests" pill; it fills with lime on hover, and lime with an ink border marks the current page. Below them is a 1.5px Pencil Rule. Focus shows a 2px ink ring offset onto paper.

### Day Strip
A sticky, horizontally scrolling row of outlined day chips on translucent paper. The active day turns lime with a lime border.

## Do's and Don'ts

### Do:
- **Do** build new surfaces from paper objects: a card, a print on a mat, a torn slip, a scrap of tape, a sticker.
- **Do** give every new card or print a small tilt (±0.4°–2°) and straighten it on hover with the 200ms `cubic-bezier(0.16, 1, 0.3, 1)` ease. The calendar is the exception: its sheets and polaroids are taped down, so they keep their tilt and don't move on hover. A focus ring still shows.
- **Do** take saturated colour from the guest's `bgColor` and derive tints with `diarySkin()` instead of inventing new colours.
- **Do** keep entrances one-shot (520–620ms, same ease, 90ms stagger), and turn every animation off under `prefers-reduced-motion`.
- **Do** give small controls an invisible `::before` hit area rather than enlarging them.
- **Do** use tabular numbers for dates, counts and stay ranges.

### Don't:
- **Don't** use lime for anything other than current/active state, badges and tape.
- **Don't** use grey or blue-black shadows, glows or glassmorphism. Shadows are warm and low.
- **Don't** put a transform or filter on an ancestor of a `<video>`; video entries stay level.
- **Don't** add a fourth typeface, or use Caveat anywhere the Pen on Paper Rule doesn't allow.
- **Don't** add buttons, forms or sections that look like a service site (CTA bars, pricing cards, testimonial blocks). The only interactive pieces are navigation, day chips, prints and reactions.
- **Don't** apply the tear filter to text; tear the paper layer only.
