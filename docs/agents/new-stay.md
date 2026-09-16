# Adding a guest or a stay

Read `CONTEXT.md` and `docs/adr/0002-guest-has-many-stays.md` first. One dog is one file, forever.

## A dog that's been before

Add a stay to the existing file. Don't create a new one.

```yaml
stays:
  - checkIn: 2026-09-13
    checkOut: 2026-09-23
  - checkIn: 2026-11-02   # new
    checkOut: 2026-11-04
```

If a stay runs longer or shorter than planned, edit its `checkOut`. Diary days outside every stay fail the build.

## A new dog

Create `src/content/guests/<id>.md`. The id is the dog's name in lowercase, and it becomes `/guests/<id>`.

```yaml
---
name: Kopi
breed: Mini Schnauzer
photo: ./kopi/kopi-cutout.png   # optional, transparent PNG cut-out
bgColor: "#5F6E4F"              # hero colour, hex; pick one that isn't close to another guest's
showLive: true
badge: Sock thief               # 2–3 word description of the dog
tagline: sleeps with one eye on the treat jar   # a short character note, lowercase
stays:
  - checkIn: 2026-10-01
    checkOut: 2026-10-05
---
```

- Ask Alan for the breed, dates, and his take on the dog's character. Suggest a badge and tagline in chat for him to pick, the same way as the polish step in `docs/agents/add-entry.md`. Don't invent facts about the dog.
- The cut-out stays a PNG with transparency. **Don't** run it through `scripts/prep-photo.sh`. If the source file is huge, shrink it with `sips -Z 1400 <file>`.
- The body can start empty. Entries arrive with the add-entry flow.

Run `npm run build`, make one commit to main, and push.
