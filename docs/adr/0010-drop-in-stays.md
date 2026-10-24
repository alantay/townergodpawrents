# ADR 0010: Drop-in stays are a flag on the stay

## Decision

Some dogs are looked after at their own home. That is a `dropIn: true` flag on the stay, not a new kind of guest. The same dog can sleep on our sofa one month and get a drop-in the next, and it stays one guest with one diary (ADR 0002).

A drop-in dog stays out of our hero. It gets its own card in its own colour, tucked under ours and peeking out below, with its name, "At his place. We pop over." and its cut-out. A dashed inner line marks it as not on our sofa. Tapping it pulls it out to show the stay day and a link to its diary. The guest's `sex` field picks "his" or "her". A guest with no `sex` gets "At home", and the build warns.

When a drop-in dog is the only one live, our hero says "No dog here" and "We're round at Marou's." When dogs are on the sofa too, our badge says "On our sofa".

We tried paper houses (a kennel, gingham) and props around the cut-out first. Mixing the drop-in dog into our hero's canvas muddled who was where.

The calendar and the guest page stay quiet (ADR 0007): a small house mark on the calendar strip and polaroid, and "· at hers" after the stay dates on the guest page.

## Context

Weiwen and Alan started popping over to look after Milk at her home. The site said every guest was on the sofa, which wasn't true.

## Consequences

Drop-ins count as live like any other stay. Overlapping stays still need different `bgColor`s even when one dog is at home, since they share the hero.

`/admin` can't add stays, so marking a drop-in still goes through Claude Code.
