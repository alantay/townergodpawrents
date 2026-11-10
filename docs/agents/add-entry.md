# Adding a diary entry

Alan tells you a moment, sometimes with one or two photos. You polish the words **with** him, then file the entry and ship it. Language: see `GLOSSARY.md` (guest, stay, diary day, entry, print).

## 1. Gather

- **Guest**: the live one if only one dog is here today (check `stays` in `src/content/guests/*.md` against today in Asia/Singapore). Otherwise ask.
- **Time**: use what he says. If he doesn't give one, it's a **No time** entry (below) by default. The heading then uses now in SGT (`TZ=Asia/Singapore date "+%-I:%M%p"`, lowercased, and drop `:00`, so `9am` and `2:45pm`), or the time on the photo or clip if it has one, just for ordering.
- **Label** (for an entry that isn't a moment from that time): keep the time heading as usual and add `<!-- label: Throwback -->` after the ID. The card shows the label where the time would; the time only orders the entry. Use one of three: `Throwback` (an old photo or moment from before today), `Thoughts` (something on his mind, not something that happened), `Fun fact` (a thing learned about the dog). Ask before using any other word.
- **No time** (the default when he gives no time, or when he wants neither a time nor a label on the card): keep the time heading as usual and add `<!-- no-time -->` after the ID. The card shows no time; the time only orders the entry.
- **Day**: today in SGT unless he says otherwise. It must fall inside one of the guest's stays, or the build fails. If it doesn't, ask whether a stay needs extending.
- **Media**: optional; up to four items per entry, with at most one short video. Agent-filed entries may mix photos and a video in any order; `/admin` still accepts photos or a video separately. Media on its own is a valid entry.

## 2. Polish the words (in chat, before touching any file)

Alan's grammar is shaky and he knows it. He wants help, but it's his diary. Show:

> **Yours:** his text, untouched
> **Polished:** grammar fixed, house voice applied, **every detail kept**
> **Twist (optional):** his entry kept, plus one funnier closing line, only if one comes naturally
> **Rewritten (optional):** work out what he's going for (usually the joke) and retell it with one narrative technique: punchline last, in medias res, unreliable narrator, deadpan, bathos, mock-heroic, callback to a recent entry, or rule of three. Name the technique. Keep his idea and every detail
> **Wordplay (optional):** rework one phrase with a double meaning, a twisted saying, a simile, or by playing off the photo instead of describing it. Name which one

Only offer Twist, Rewritten and Wordplay when relevant. Twist never rewords his entry; Wordplay never adds a closing line. Polished stays close to Alan's wording; Rewritten serves his intention: it can rebuild the entry around his joke, but doesn't add events or a new joke. Example: "Ebi doing custom immigration snack checks on Alan's bag before he leave for work" → "Alan's bag has to clear Ebi's customs before he leaves for work. She's searching for undeclared snacks."

Then wait for his pick: yours / polished / twist / rewritten / wordplay / his own edit. Don't write the entry until he picks. If the polished version is identical to his and neither optional version would help, say so and skip the choice.

Rules for the polished version:
- Fix grammar, tense and word order. Don't trim details or swap his words for "better" ones. Last time, cutting phrases like "right on cue" read as removing what he liked.
- Don't add jokes to the polished version. Humour goes in the Twist line only, so he can take it or leave it.
- Photo alt text: a plain description of each photo ("Tiny sprawled belly-up on the sofa"). Suggest it alongside the rest.

### House voice

Follow `docs/agents/voice.md`.

If you spot a POV or tense slip in another entry **from the same day**, mention it in one line as a suggestion. Don't edit it unasked.

## 3. File it

**First:** on main, `git pull`. Entries posted from `/admin` land on main without the laptop knowing.

**Photos:** always put each one through the script. Never copy a raw phone photo in.

```sh
scripts/prep-photo.sh <guest> <path-to-photo> <short-slug>
# → ./tiny/tiny-manja-moment.jpg (480KB)
```

**Videos:** put the raw clip (`.mp4` or `.mov`, straight off the phone) through the script. It transcodes and compresses automatically.

```sh
scripts/prep-video.sh <guest> <path-to-video> <short-slug>
# → ./tiny/tiny-zoomies.mp4 (12000KB)
```

It also writes two sidecars next to the clip — `.mp4.json` (dimensions) and
`.mp4.jpg` (a still of the first frame, used as the video's poster so phones
show something before you press play). Leave both alone; the build errors out
if either goes missing.

The slug is 2–4 words taken from the moment (`climbing-wall`, `lap-nap`).

**Markdown:** in `src/content/guests/<guest>.md`:
- Days are `## 16 Sep`, newest day at the top. If today's divider doesn't exist yet, add it above the previous newest day.
- Entries are `### 12:10pm`, newest first within the day. Put the new one in time order.
- Give each entry a unique, permanent ID in a comment just after its heading: `<!-- entry-id: e053 -->`. Check the guest's existing IDs and use the next free number. Keep the ID when editing the time or words; shared reactions use it.
- An entry about two dogs together is written once, under one dog, with `<!-- with: bobbi -->` after the ID (comma-separate for more). The build copies it into the other dog's diary in time order, labels both "with …", and both share one reactions count. That day must fall within the other dog's stay, or the build fails.
- Swap the time shown on the card for a word with `<!-- label: Throwback -->` after the ID. The heading keeps its time, so the entry still sorts and files like any other.
- Hide the time without a label using `<!-- no-time -->` after the ID. Same deal: the heading keeps its time for ordering.
- Credit borrowed music or media with `<!-- credit: Music: Name, from Pixabay -->` after the ID. It shows as small print under the entry, not in the words. For CC BY, link the source and licence: `[Name](https://...), [CC BY 3.0](https://creativecommons.org/licenses/by/3.0/)`. CC0 needs no credit.
- Leave a blank line between the heading, the text and each image. Put at most four media items under an entry, with at most one `.mp4`, in the order they should appear. Photos and a video use the same `![alt](./path)` syntax; the `.mp4` extension tells the video apart from a photo.

```md
### 10:30pm

<!-- entry-id: e053 -->

One of Tiny's many manja moments ❤️

![Tiny sprawled belly-up on the sofa](./tiny/tiny-manja-moment.jpg)

![Tiny waiting by the laptop for her dog run](./tiny/tiny-time-for-dog-run.jpg)
```

## 4. Check and ship

```sh
npm run build
```

The build fails on a day outside every stay, an entry with no day above it, or a missing image. Fix it and don't push a broken build. Follow **Pushing changes** in `AGENTS.md` before shipping. For a plain entry, make **one commit** straight to main and push (Vercel deploys from main):

```sh
git add src/content/guests && git commit -m "Add <Guest> <time> <few-word> entry" && git push
```

If he tweaks the wording after it's pushed, amend nothing. Make a small new commit.
