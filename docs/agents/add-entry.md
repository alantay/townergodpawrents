# Adding a diary entry

Alan tells you a moment, sometimes with one or two photos. You polish the words **with** him, then file the entry and ship it. Language: see `CONTEXT.md` (guest, stay, diary day, entry, print).

## 1. Gather

- **Guest**: the live one if only one dog is here today (check `stays` in `src/content/guests/*.md` against today in Asia/Singapore). Otherwise ask.
- **Time**: use what he says. If he doesn't give one, use now in SGT (`TZ=Asia/Singapore date "+%-I:%M%p"`, lowercased, and drop `:00`, so `9am` and `2:45pm`).
- **Day**: today in SGT unless he says otherwise. It must fall inside one of the guest's stays, or the build fails. If it doesn't, ask whether a stay needs extending.
- **Media**: optional; either up to four photos, or one short video, per entry. Never mix a video with a photo in the same entry. A photo or video on its own is a valid entry.

## 2. Polish the words (in chat, before touching any file)

Alan's grammar is shaky and he knows it. He wants help, but it's his diary. Show:

> **Yours:** his text, untouched
> **Polished:** grammar fixed, house voice applied, **every detail kept**
> **Twist (optional):** one funnier closing line or rewording, only if one comes naturally

Then wait for his pick: yours / polished / twist / his own edit. Don't write the entry until he picks. If the polished version is identical to his, say so and skip the choice.

Rules for the polished version:
- Fix grammar, tense and word order. Don't trim details or swap his words for "better" ones. Last time, cutting phrases like "right on cue" read as removing what he liked.
- Don't add jokes to the polished version. Humour goes in the Twist line only, so he can take it or leave it.
- Photo alt text: a plain description of each photo ("Tiny sprawled belly-up on the sofa"). Suggest it alongside the rest.

### House voice

- **What happened: humans named.** The dog is the main character: "Alan got home." "Tiny eyed Weiwen's toast." There are two of them, so names keep it clear who did what.
- **"We / us / our"** when both of them did it together: "We took Tiny to Kallang."
- **Personal reaction: "I" is fine.** Asides like "I swear…", "I melted". These are voice, not events, and "I" makes them warmer and funnier. Don't reword these into "Alan swears…".
- **Never mix "I" and a name in one sentence** ("I took Tiny out and Alan…").
- **Past tense** for what happened ("Tiny finally pooped"). **Present participle** is fine for a photo caption ("Tiny napping on the lap while the human tries to work").
- Short sentences. Light Singlish (lepak, manja, lah), light enough for overseas friends.
- **No em dashes.** Use a full stop or comma.
- Good humour here is deadpan understatement ("House intact."), the dog's point of view ("Burdensome, Tiny says."), or a mix-up ("Cow spotted grazing… No wait, that's Tiny."). Not puns stacked on puns, and not exclamation marks everywhere.

If you spot a POV or tense slip in another entry **from the same day**, mention it in one line as a suggestion. Don't edit it unasked.

## 3. File it

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

The slug is 2–4 words taken from the moment (`climbing-wall`, `lap-nap`).

**Markdown:** in `src/content/guests/<guest>.md`:
- Days are `## 16 Sep`, newest day at the top. If today's divider doesn't exist yet, add it above the previous newest day.
- Entries are `### 12:10pm`, newest first within the day. Put the new one in time order.
- Leave a blank line between the heading, the text and each image. Put at most four images under an entry, or a single video (same `![alt](./path)` syntax — the `.mp4` extension is what tells it apart from a photo).

```md
### 10:30pm

One of Tiny's many manja moments ❤️

![Tiny sprawled belly-up on the sofa](./tiny/tiny-manja-moment.jpg)

![Tiny waiting by the laptop for her dog run](./tiny/tiny-time-for-dog-run.jpg)
```

## 4. Check and ship

```sh
npm run build
```

The build fails on a day outside every stay, an entry with no day above it, or a missing image. Fix it and don't push a broken build. Then make **one commit** straight to main and push (Vercel deploys from main):

```sh
git add src/content/guests && git commit -m "Add <Guest> <time> <few-word> entry" && git push
```

If he tweaks the wording after it's pushed, amend nothing. Make a small new commit.
