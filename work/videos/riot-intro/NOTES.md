# Riot intro video (on hold)

Deadpan crime report: "Riot, known vandal". 28s, 9:16, HyperFrames, voice is ElevenLabs "Bill".

## Status (6 Nov 2026)

First full build works and passes `npm run check`. Parked because:

- It needs more footage. Beats 4 to 6 can take better clips (the opener and the no-charges ending stay).
- The freeze frames look bad (beat 3 planter hold at 8.6-9.9s, beat 7a hold at 22.7-23.2s). Rethink or replace them.

## Files

- `PLAN.md`: build plan with the beat timeline.
- `storyboard.html`: approved storyboard (open in a browser).
- `index.html`: the composition. `assets/`: footage, photos, VO lines, fonts, GSAP.

## VO script (line1-7.mp3)

1. Towner Crest. A vandal is spotted.
2. Every planter on the street gets tagged.
3. Even with an empty can.
4. He has also pooped. Several times.
5. Back at the den, the suspect requires pats.
6. The suspect rests.
7. Riot. (pause) Paw Patrol will not be pressing charges.

Bill: voice ID pqHfZKP75CvOlQylNhV4, eleven_multilingual_v2, stability 0.55, similarity 0.75, style 0.2.
Any new lines need an ElevenLabs API key (never commit it).

## Resume

`npx hyperframes preview --background`, then `npm run check` and `npx hyperframes snapshot --at ...`.
