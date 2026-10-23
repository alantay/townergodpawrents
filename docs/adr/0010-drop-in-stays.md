# ADR 0010: Drop-in stays are a flag on the stay

## Decision

Some dogs are looked after at their own home. That is a `dropIn: true` flag on the stay, not a new kind of guest. The same dog can sleep on our sofa one month and get a drop-in the next, and it stays one guest with one diary (ADR 0002).

A drop-in dog's hero cut-out sits in a paper house: a cardboard kennel with striped tape for a boy, gingham with a heart for a girl. The guest's `sex` field picks the house and the "at hers" or "at his" chip. A guest with no `sex` gets the kennel and "at home", and the build warns.

The house keeps the pack's proportions whether one, two or three dogs are live, so it never stretches.

The calendar and the guest page stay quiet (ADR 0007): a small house mark on the calendar strip and polaroid, and "· at hers" after the stay dates on the guest page.

## Context

Weiwen and Alan started popping over to look after Milk at her home. The site said every guest was on the sofa, which wasn't true.

## Consequences

Drop-ins count as live like any other stay. Overlapping stays still need different `bgColor`s even when one dog is at home, since they share the hero.

`/admin` can't add stays, so marking a drop-in still goes through Claude Code.
