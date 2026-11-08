# ADR 0013: Dog games are opt-in, one per dog

## Decision

A guest can have a mini game, set with `game:` in its file (`game: circles` for Tyrion). Most dogs don't get one. The game only shows on the homepage, and only when that dog is here alone: a "Chase Tyrion" button sits by the chips, and the game plays inside the hero card in place of the portrait.

Each game is modelled on what that dog really does. Tyrion runs circles round the coffee table with his ball, keeping it between you and him. Stop chasing and he drops the ball as bait, then snatches it back the moment you reach for it.

## Context

Alan wanted small games for the dogs, but said not every dog needs one. A generic game for every guest would turn into a feature to maintain. One game per dog, built from a real habit, keeps it a joke about that dog.

The homepage is where playful things go (ADR 0007). With two dogs in the hero there is no room to play, and a game about one dog would ignore the other, so shared days show no button.

## Consequences

- A game's pure logic lives in `src/lib/<game>/step.ts` with tests; the DOM shell (`mount.ts`) is loaded only when someone presses the button.
- The homepage hero exposes `window.__tgpHero` so a game can stop the thought bubbles, hide the pat buttons and put everything back on close.
- Adding a game for another dog means a new enum value, its own art and its own module. No shared engine until a second game shows what is actually shared.
- This is an experiment. If it isn't fun, delete the module and the `game:` field.
