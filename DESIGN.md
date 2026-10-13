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
  tape: "#f7e27a"
  biro: "#b3261e"
  moss: "#4c6b3c"
  muted: "#4a4b41"
  label: "#55564a"
  card-line: "#cdbf9e"
  card-line-dark: "#5b6e50"
  line: "#a99b7f"
typography:
  display:
    fontFamily: "Instrument Serif, serif"
    fontSize: "clamp(62px, 19vw, 120px)"
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
  chip-badge:
    backgroundColor: "{colors.tape}"
    textColor: "{colors.ink}"
    typography: "{typography.chip}"
    rounded: "0px"
    padding: "7px 11px"
  nav-pill:
    textColor: "{colors.ink}"
    typography: "{typography.chip}"
    rounded: "{rounded.pill}"
    padding: "6px 13px"
  nav-pill-hover:
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

Every page is something Alan and Weiwen have just put down on the kitchen table: a warm paper ground with a few coloured cards on it, each a little crooked, photos slipped in as prints with a cream mat, notes on slips torn from a pad, and a scrap of post-it yellow tape holding something down. Nothing is aligned the way a template would align it, and nothing is decorated for its own sake either. Each tilt, tear and bit of tape copies something real you'd find in a scrapbook.

The page is one narrow column (700px) read on a phone. Each dog is the main subject. It gets a big serif name, a colour of its own and a cutout photo standing in the hero card. Everything else stays quiet: warm neutrals, one small sans for the functional bits and a single acid-lime accent that means "look here" or "this is live".

Motion is one-shot and physical. Cards arrive as if set down. Hover nudges a card up without straightening it: turning something big looks wonky, so only small things (the wordmark tag, a one-line link card) straighten. Once a card has arrived it stays put, apart from a couple of slow idle drifts on the cutout and the "Here today" tag. Those two loops are deliberate: they keep the page wacky and light, so don't stop them. The homepage hero also wears the day's weather (see Weather).

**Key Characteristics:**
- Warm paper ground, ink-green text, one lime accent, post-it yellow tape
- Instrument Serif for names and headings; Archivo for everything functional
- Every dog brings its own colour; the diary derives four skins from it
- Tilt everywhere (±1°–2°), kept on hover; only small things straighten
- Real paper effects: torn slips (SVG turbulence), clipped tape, prints on a cream mat
- Soft, warm-brown shadows; no hard elevation

## Colors

A sun-faded kitchen palette: oatmeal paper, deep olive-black ink one highlighter lime and a post-it yellow for tape, with each guest dog adding its own saturated colour.

### Primary
- **Highlighter Lime** (`lime`): The single accent. It marks what's current or active: the "Here today" and "Sofa's empty" tags, the NEW tag, the current nav page, the active day chip and the skip link. Nothing else.
- **Pale Lime Wash** (`lime-soft`): The quiet version of lime. It colours the italic tagline on a dark guest hero and the "photo soon" line under a blank print.
- **Post-it Yellow** (`tape`): Every piece of tape: calendar sheets and polaroids (85%), the reaction picker's corners (90%), the scrap under a reaction count (75%), the tag behind the italic "Godpawrents" wordmark, and the strip carrying a dog's badge. Tape is translucent paper, so it has square corners.
- **Red Biro** (`biro`): The pen on the calendar: the ring around today and the "busy sofa" note. Nowhere else.

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

Colours repeat across guests. Dates before 13 October 2026 keep the original Sofa Green hero. From that date, when multiple guest groups are staying, the homepage hero chooses a stable colour from Sofa Green `#5F6E4F`, blue `#39617E`, plum `#755A83`, rose `#8E4A5C`, rust `#A34A2E` and ochre `#7A5C24`. Sorted guest IDs determine the choice, so collection order, dates and returning stays do not change it. Different combinations can share a shade. Guapo & Luna use a fixed plum override (`#755A83`) from the same cutoff. A single guest group keeps its own colour, including a duo recorded together. Shared diary entries keep Sofa Green (always its pure-colour skin, cream text).

**The Same-Sofa Rule.** Two dogs whose stays overlap must have different colours, because their entries sit side by side in today's feed. Dogs staying on different dates may share a colour.

### Neutral
- **Oatmeal Paper** (`paper`): The page ground everywhere. It also forms the ring around the timeline dots, so they look punched through.
- **Olive Ink** (`ink`): All primary text, focus outlines and timeline dots. It's the text colour on lime and cream.
- **Cream Card** (`cream`): Card and print mats, caption slips, cream chips, and hero text on guest colours.
- **Slip Fibre** (`slip-fibre`): The 5px paler border on a torn slip, which shows as the rough fibre edge where the paper tore.
- **Moss** (`moss`): Hover colour for plain text links, and the small uppercase labels on the Next up and Last seen cards.
- **Muted Olive** (`muted`) / **Label Olive** (`label`): Secondary text, meta lines, uppercase labels and back links.
- **Kraft Keyline** (`card-line`): The 1.5px edge on cream cards and prints. **Moss Keyline** (`card-line-dark`) is the same edge on the dark diary skins.
- **Pencil Rule** (`line`): Section rules, nav underline, the timeline spine and outlined chips.

### Named Rules
**The One Highlighter Rule.** Lime means "current or active", nothing more. Hovers get inked, badges are tape strips, and tape is post-it yellow. Never use lime as a background panel, heading colour, hover fill or decoration.

**The Dog Owns the Colour Rule.** Saturated colour on a page comes from the guest's `bgColor`. The system itself stays in warm neutrals, so each dog's page looks like that dog.

## Typography

**Display Font:** Instrument Serif (with serif)
**Body Font:** Archivo (with Helvetica, sans-serif)
**Script Font:** Caveat (with cursive)

**Character:** A tall, slightly literary serif carries the names and headings. A plain, sturdy grotesque handles the chips, labels and body text. The serif sets the mood and the sans does the practical work.

### Hierarchy
- **Display** (400, clamp(62px, 19vw, 120px), 0.88, −0.02em): A dog's name in its hero. Two or more dogs stack one name per line at clamp(56px, 17vw, 96px), starting below the "Here today" tag so each line gets the full width. Homepage names use `fit-headline`, which keeps each line unbroken and shrinks with fitText() if a long name would overflow.
- **Headline** (400, 32px, 1): Section heads like "The full diary", plus the wordmark at 21–26px.
- **Title** (400, 24px, 1): Diary day labels ("13 Sep") and card names (22–27px).
- **Tagline** (italic 400, 20–22px): A dog's one-liner under its name, in Pale Lime Wash on the hero, and the rotating joke line in the homepage footer, in ink.
- **Body** (400, 16px, 1.625, max ~52ch): Diary notes and intro copy. Slips use 15px text on 24px lines so the writing sits like ruled paper.
- **Chip** (600, 13px): Pills, nav links and day chips.
- **Label** (600, 11–12px, 0.06–0.1em, uppercase): Stay ranges, "Here today", NEW tags and footer meta. Dates use tabular numbers.
- **Script** (500–600, 18–40px, 1–1.15): Caveat, for words Alan or Weiwen have written onto the calendar: month names (40px), the pup-count note (22px), names on polaroids (20px) and on tape (18px).

Chip, Label, caption and slip sizes are written in rem, so they grow when a reader turns up their browser's text size. The px figures above are what they come to at the default 16px. Display sizes stay in px.

### Named Rules
**The Pen on Paper Rule.** Caveat is Alan or Weiwen's own handwriting, so it only goes where one of them could have picked up a pen and written on something. Before using it, check all six:

1. **It's written on a paper object**: a calendar sheet, a polaroid, a strip of tape or a slip. Never directly on the page background (that's the kitchen table), and never on chrome: nav, chips, buttons or uppercase labels.
2. **A person wrote it**: a name, a heading on a sheet, a quick aside. Not text that explains something, and nothing the site itself is saying.
3. **It's one short line, about six words at most.** If it wraps, it's no longer a scribble.
4. **Facts stay in Archivo.** Dates, times, stay ranges and anything that has to be exact are set in Archivo with tabular numbers. The polaroid shows how: the name is handwritten and the dates are printed underneath.
5. **It's never the reading voice.** Diary notes, captions and intro copy are Archivo. One-liners and jokes go in Instrument Serif italic, the same voice as a dog's tagline.
6. **It's 18px or larger, weight 500–600.** A name that runs out of room on a tape strip is cut off with "…"; that's accepted for now.

The calendar is the one page that's meant to look handwritten. Everywhere else, the default is no Caveat.

**Homepage exceptions.** Two homepage jokes are handwriting on purpose, even though neither is Alan or Weiwen writing on a sheet: the hero note (the dog answering a pat, or what the sofa coughed up) and the "part-time" scribble under the wordmark tape. Keep them to a few words and never below 18px. Nowhere else.

## Layout

One centred column, 700px max, with a 20px side gutter, built for phones first. Sections are separated by generous vertical space (32–48px) and a 1.5px Pencil Rule with an 18px gap beneath it, never by boxes. The diary is a timeline: a 1px spine on the left, an ink dot punched through the paper at each day heading, and entry cards alternating their tilt (−1° / 1°). From 640px up, every even entry also steps in by 24px, which keeps the pile looking loose. Prints sit in a single column, or in a 2-up grid from 480px when there's a pair or a set of four.

A day strip sticks to the top on long stays. It's a horizontally scrolling row of chips on 92% paper with a 6px backdrop blur, and anchored days scroll to 64px below it. Small targets (chips, reaction badges) get an invisible `::before` hit area so they stay small visually but meet ~44px on touch.

## Elevation & Depth

Depth here is paper lying on paper. Shadows are soft and warm (a brown-olive tint, never neutral grey), and they're paired with tilt, not with lift. Cards cast a low, wide shadow. Prints add a faint inset highlight on top, as if they had a glossy face. Torn slips and the reaction picker cast a drop-shadow through their torn outline, so the shadow follows the tear. Hover nudges a card up 2px with a 4% brightness lift, keeping its tilt; that's the only "elevation change".

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
**The Nothing Sits Square Rule.** Cards, prints, slips, tape and stickers each carry a small rotation. Only functional chrome stays level: nav, chips, day strip and buttons. Video cards and their mats are also level, because a filter or transform on an ancestor makes `<video>` flicker; their caption slip leans 1.5° instead to keep the crooked feel.

**The Real Tear Rule.** Torn edges come from the SVG filters on the paper layer only, never on the text. Where filters aren't supported, fall back to a 14px-radius keylined card rather than a hard rectangle.

## Components

### Guest Hero
The dog's own card. It fills with the guest's `bgColor`, has a 32px radius and cream text. It holds the display-size name, a Pale Lime Wash italic tagline, a row of chips and the cutout photo standing at the bottom edge (280px tall on the guest page). A lime "Here today" tag sits top-right; on the homepage it wiggles slowly and the hero pops in with a small rotate-and-scale.

### Chips
- **Cream chip:** cream on the hero, ink text, 13px/600, 7px 13px, pill. Used for breed, stay range and stay day.
- **Badge tape:** the dog's badge (and the "N dogs, one sofa" chip) is a nickname stuck on the dog, not a fact, so it's a strip of Post-it Yellow tape rather than a chip: square corners, tilted −2°, same Chip type in ink. It sits last in the row, after the cream fact chips.
- **Outlined chip:** 1.5px Pencil Rule, pill, no fill. On hover it gets inked: an ink line is drawn round it by hand (the `inked` class, wobbled by the calendar's `#pencil-rule` filter), a little off the pencil. Text stays ink, never moss. A press pushes it in, and a tap inks it for a moment. Used for the nav links, "See all" and day chips.
- **NEW tag:** lime pill, 11px uppercase, 0.06em tracking.

### Diary Entry Card
A 24px-radius card in one of the four guest-colour skins, with a 1.5px keyline (Kraft on light skins, Moss on dark), 18px 19px 20px padding, the alternating tilt and the diary-entry shadow. The timestamp and note sit inside, with prints and slips below. Each entry fades and rises into place once as it scrolls into view. Today uses the compact variant with 17px 19px padding and no diary shadow; the full diary keeps its timeline spacing and shadow. Captions and prints stay the same in both.

Homepage cards have plain timestamps and backgrounds. Each guest's name links to that moment in their own diary, including on shared entries. Names keep the header's colour without an underline, with a visible keyboard focus outline. Prints, clips and reactions keep their own controls.

### Guest Card
A past guest on /guests and the homepage: a 24px card in the dog's `bgColor` with the cutout standing in it, a cream strip below for the name (22px serif) and dates, and the 1.5px keyline (Kraft on light coats, Moss on dark). Cards alternate −1° / +1° and keep the tilt when they lift on hover. On the homepage, the Next up card has no fill, just a dashed Pencil Rule outline on the paper, like the calendar's upcoming stays: the spot is marked out but the dog hasn't arrived. Last seen stays solid cream.

### Print
A photo on a 7px cream mat with a Kraft keyline and 16px radius; the photo inside has a 10px radius. The mat edge turns 72% white against coloured skins so it stays quiet. It leans against its card's tilt. Tapping opens a full-screen viewer on an 88% ink backdrop with a cream circular close button.

### Empty Polaroid
Stands in for a cut-out when a guest has no photo yet: one cream Polaroid per dog (88 × 107 proportions, print shadow), tilted −3° and +2.5° so a pair leans apart. The photo area is ruled in a dashed pencil line (`--color-line`) with "photo soon" in small Archivo label grey (dropped on prints under 90px wide). When the box is tall enough (200px, whatever its width, so a pair sharing the hero on a phone still gets it), the dog's name goes on the strip in Instrument Serif italic and a lime-soft italic line sits underneath: "Still waiting for them to sit still long enough." Smaller (chips, past-guest cards), just the blank prints. Where a frame is already drawn around it (the calendar polaroid and bar dot), only the dashed cream slot shows.

### Caption Slip
A note too long for a print's mat goes on a torn cream slip. It's two layers: the torn, shadowed paper layer and the text layer, which is never distorted. The paper has a 5px Slip Fibre border that the tear cuts through. The text is 15px Archivo with 24px lines, inset 8px plus 16px from the edges so the writing clears the ragged edge.

### Reaction Badge and Picker
The empty badge is a faint (65% opacity) add-reaction icon in the card's top-right corner that comes to full strength on hover or focus. It's faint on purpose, and so is the photo credit under a print (70% opacity): the words and photos are the point, and neither of these should pull the eye from them. Once an entry has reactions, the badge becomes up to three stickers (2.1rem) piled −8° / 6° / −4° and overlapping by 0.85rem, with the most-used on top. The total sits on a Post-it Yellow tape scrap in one of three clip-path cuts. The picker is a torn cream strip hanging under the badge, taped at both corners with Post-it Yellow scraps. Its stickers sit 0.4rem apart in 2.75rem slots, so a thumb lands on the right one, and they scale up and tilt on hover. A sticker you left yourself is ringed in ink, off-round like the biro ring on the calendar, and a second tap takes it back. Errors appear as a small italic cream note under the badge.

### Navigation
The wordmark sits on the left: "The Towner" in serif, then an italic "Godpawrents" on a Post-it Yellow tape tag rotated −2°, which straightens on hover. On the right are two outlined pills, Calendar and Guests; each gets inked on hover, and lime with the ink line already drawn marks the current page. Below them is a 1.5px Pencil Rule. Focus shows a 2px ink ring offset onto paper.

### Day Strip
A sticky, horizontally scrolling row of outlined day chips on translucent paper. Hover inks the chip like any outlined chip; the active day turns lime with a lime border. In a diary of more than one day, each day's rule ends with its entry count in Label type, and the diary closes with two outlined chips: "Back to the top" and "Everyone who's stayed".

The exit chip (`day-chip--exit`) is the same pill filled with ink, paper text, a size up (14px). It's the homepage's way into a dog's full diary, sitting under today's entries, and it hovers moss.

### Weather
The homepage hero wears one weather at a time, read from NEA for Kallang (which covers Towner). The diary and every other page stay dry.

- **Haze** when the central 24-hour PSI is over 100: three layers of grey smog (`--smog: 192 195 198`) drift across the dogs and thin out before the chips, so the name stays clear. It thickens with the reading, from 0.4 just over 100 to full strength at about 230.
- **Rain** when the 2-hour forecast says showers: streaks and drops drawn on a canvas over the hero, heavier when the forecast says heavy or thundery. Thundery showers add a pale double flash (`#f4f6ff`) every 7 seconds.
- **Heat** at 33°C or more: the cutouts shimmer like a road in the sun, with a warm glow coming up from the bottom of the card.

Haze wins over rain, and rain over heat. A small tilted tag in the hero's bottom-right corner says which it is ("PSI 170", "Thundery Showers", "34°C"): haze grey, rain `#b9cdd6`, storm `#e4e0a6`, heat `#f3bf7e`, always ink text. These colours belong to the sky and are used nowhere else.

Rain and shimmer stop while the hero is scrolled out of sight. Under `prefers-reduced-motion` the smog, rain and shimmer hold still and the lightning is off. `?psi=170`, `?sky=Thundery Showers` and `?temp=34` preview each one.

## Do's and Don'ts

### Do:
- **Do** build new surfaces from paper objects: a card, a print on a mat, a torn slip, a scrap of tape, a sticker.
- **Do** give every new card or print a small tilt (±0.4°–2°) and keep it on hover. Straighten only small things, with the 200ms `cubic-bezier(0.16, 1, 0.3, 1)` ease; a big card turning looks wonky. The calendar doesn't move on hover at all, since its sheets and polaroids are taped down. A focus ring still shows. A tape strip opens that dog's diary on a tap, and the first sheet with a stay prints a key in Label type under its weeks: Here now, Coming up, Gone home.
- **Do** take saturated colour from the guest's `bgColor` and derive tints with `diarySkin()` instead of inventing new colours.
- **Do** keep entrances one-shot (520–620ms, same ease, 90ms stagger), and turn every animation off under `prefers-reduced-motion`.
- **Do** give small controls an invisible `::before` hit area rather than enlarging them.
- **Do** put hover movement inside `@media (hover: hover)`, so a lift doesn't stick after a tap on a phone.
- **Do** use tabular numbers for dates, counts and stay ranges.

### Don't:
- **Don't** use lime for anything other than current/active state. Tape is post-it yellow.
- **Don't** use grey or blue-black shadows, glows or glassmorphism. Shadows are warm and low.
- **Don't** put a transform or filter on an ancestor of a `<video>`; video entries stay level.
- **Don't** add a fourth typeface, or use Caveat anywhere the Pen on Paper Rule doesn't allow.
- **Don't** add buttons, forms or sections that look like a service site (CTA bars, pricing cards, testimonial blocks). The only interactive pieces are navigation, day chips, prints and reactions.
- **Don't** apply the tear filter to text; tear the paper layer only.
- **Don't** make the photo credit or the empty reaction icon louder, and don't end the wiggle or the cutout drift. They're faint, and looping, on purpose.


## Implementation reference

`src/styles/global.css` owns the shared paper objects. Use these classes in Astro markup and browser-generated homepage markup alike:

| Object | Shared class | Variant |
| --- | --- | --- |
| Cream fact | `fact-chip` | None |
| Nickname tape | `badge-tape` | None |
| Current status | `status-tag` | `status-tag--compact` on guest cards |
| Entry spacing | `entry-surface` | `entry-surface--compact` on today |
| Print mat and media | `diary-print`, `print-media` | Width and tilt come from the existing diary helpers |
| Mat caption | `print-caption` | 13.5px, centered |
| Torn caption | `slip-caption` inside `diary-slip` / `diary-note` | 15px, 24px lines |
| Day chip | `day-chip` | `day-chip--exit` for the homepage's link into a full diary |
| Sky tag | `sky-tag` | `sky-tag--rain`, `sky-tag--storm`, `sky-tag--heat`; plain is haze |
| Multiple prints | `diary-prints` | `diary-prints--pair` or `diary-prints--quad` |

Two and four prints use two columns from 480px up and one column below it. Three prints remain a single column. Video cards and mats stay level. The dark diary link hovers moss, keeping lime for current state. The calendar's red biro ring around today and red busy-sofa annotation are intentional pen-on-paper accents.

The unlisted, noindex `/design` page shows these shared classes using real diary photos. It is a reference for changes, not another visitor destination. This document and the implementation are the design sources; there is no generated design sidecar to keep in sync.
