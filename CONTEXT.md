# The Towner Godpawrents

A personal site showing which dog is on Alan and Weiwen's sofa today, and a diary of the dog's day. Not a business, not a booking system — a log of an informal hobby among friends and neighbours.

## Language

**Guest**:
A dog Alan and Weiwen host, or dogs from one home who come together ("Hugo & Luffy") — see ADR 0006. One guest, one file, one page, forever — a dog that comes back is the same guest, not a new one.
_Avoid_: Dog (fine in prose, but the modelled thing is a Guest), client, pet, boarder

**Guest's human**:
The person who looks after a guest when the guest is home, and who may read that guest's diary while the guest stays with Alan and Weiwen.
_Avoid_: Owner (ambiguous with the site's owners), client

**Stay**:
One visit by a guest, from check-in to check-out. A guest has one or more; each is a date range.
_Avoid_: Booking, reservation, visit, session

**Diary day**:
One calendar day within a stay, written as a `## 13 Sep` divider. The year is not written down — it comes from whichever stay contains the day.
_Avoid_: Date section, day entry

**Entry**:
One timestamped moment inside a diary day, written as a `### 9:50am` heading and the words under it. May be up to four prints, or one clip, with no words.
_Avoid_: Post, note, log line, update

**Reaction**:
One of ❤️, 😂, 🥹, or 🐾 left by a visitor on an entry. Reactions remain available after a stay ends and their totals are visible to everyone.
_Avoid_: Like, rating, review

**Print**:
A photo attached to an entry, shown on the diary page as a tilted snapshot on a cream mat. An entry can have up to four prints. Deliberately a different photo language from the cut-outs.
_Avoid_: Image, snap, thumbnail

**Clip**:
A short video attached to an entry, shown on the diary page on a tilted cream mat like a print, but with native playback controls instead of a click-to-zoom (no autoplay). An entry has either prints or one clip, never both.
_Avoid_: Video, movie, reel

**Cut-out**:
A guest's own portrait — a photo cut from its background, used in the hero and the past-guests grid. One per guest; a guest without one shows an initials sticker instead.
_Avoid_: Avatar, headshot, profile photo

**Live**:
A guest whose stay contains today, in Singapore time. More than one guest can be live at once.
_Avoid_: Active, current, checked-in

**Vacancy**:
No guest is live today. The homepage says the sofa is free and names the last guest to leave.
_Avoid_: Empty, idle, available

**Past guest**:
A guest whose most recent stay has ended. Each dog appears once in the past-guests grid however many times they have stayed.
_Avoid_: Alumni, former client, previous dog
