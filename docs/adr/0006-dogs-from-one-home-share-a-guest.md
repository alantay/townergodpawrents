# ADR 0006: Dogs from one home share a guest

## Decision

Dogs that arrive together from one home are one **guest**: one file, one page, one diary, with the dogs' names joined by " & " in `name` (`name: Hugo & Luffy`, file `hugo-and-luffy.md`). Wherever the site counts dogs rather than guests ("Three dogs, one sofa", "4 pups this month", "are" vs "is"), it splits the name with `dogNames` in `src/lib/guests.ts`.

## Context

Hugo and Luffy belong to the same human and always come as a pair. The model from ADR 0002 said a guest is a dog, so they had no clean home: two files would duplicate every diary entry, since a photo of them on the sofa is a photo of both.

## Considered options

- **One guest per dog, same stay dates** — the homepage already handles two live guests, but every moment would be written twice or split arbitrarily between two diaries, and their human would have to read two pages.
- **A `dogs` list inside a guest** — precise, but adds schema, per-dog breeds and per-dog cut-outs for a site that has one pair so far.
- **One guest per home, names joined with " & "** — chosen. The diary is the unit people read, and the pair lives it together.

## Consequences

Breed is one free-text field; for a pair it reads like "Poodle & Schnauzer". The cut-out is one photo of both dogs.

If one of the pair ever comes alone, it's still that guest — the stay is simply written about as one dog. If that becomes common, revisit the `dogs` list option.
