# ADR 0008: Shared days wear Sofa Green first

## Decision

A homepage day with more than one guest wears Sofa Green `#5F6E4F`, unless Sofa Green is too close to one of the guests on the page. Only then does the day take another palette shade, picked by the existing rule in `src/lib/group-hero-color.ts`.

Alan confirmed this on 13 October 2026.

"Too close" is the rule the function already had: the same hue family as a guest, or within 60 degrees of a guest's hue. With today's guests that means:

- Any day with Guapo takes another shade, because his Eucalyptus `#3F6655` is a green. Guapo & Luna are pinned to rust.
- Any day with Hugo & Luffy takes another shade, because their ochre sits near Sofa Green.
- Every other pairing is Sofa Green.

Days before 13 October 2026 keep Sofa Green whoever was staying.

## Context

Sofa Green is the only palette shade no dog wears, and the empty sofa already wears it, so it reads as the house's own colour.

Two simpler rules were tried and dropped:

- **Always Sofa Green.** Guapo is in six of the nine shared days on the calendar when this was decided. When Bobbi joined him on 8 October the hero went from his green to a slightly more olive green, and the shared card sat beside his own cards in nearly the same colour.
- **Always rotate** (#82). Every overlap so far has lasted a day or a few, so nobody learns a pairing's colour, and the shade it picks belongs to a dog who is not there. Luna & Tiny would have worn Bobbi's rose two days after Bobbi went home.

## Consequences

A shared day only steps off Sofa Green when it has to. A new guest in a green or ochre shade will push their shared days onto the rotation without anyone choosing that, so check their pairings when picking their colour.

A shared entry card on the homepage follows the same colour as its dogs' hero. Three dogs at once, and a shared card shown after one of its dogs has gone home, have not been looked at on a real page.
