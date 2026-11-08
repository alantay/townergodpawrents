# ADR 0012: Dog notes live in Redis, behind the login

Alan and Weiwen keep private notes per guest (allergies, watch-outs like "lead on at the carpark") on `/admin/notes`, linked from the `/admin` header. The repo is public, so notes never go in frontmatter, git, built output or any public page or API. They live only in Redis, in one hash per guest (`admin-notes:<guestId>`, field = note id, value = JSON `{text, at}`), and load only after the login check. The page and `/api/admin/notes` send `no-store`.

A guest is the unit, so dogs sharing a guest (ADR 0006, Hugo & Luffy) share one list; name the dog in the note text when it matters. Each guest holds up to 20 notes of up to 200 characters. Add (with the cap) and edit (only if the note still exists) run as Lua scripts through Upstash `eval`, so two phones racing cannot exceed the cap or revive a removed note.

On the page, guests staying today show as open slips; everyone else folds to one line with a note count, tapping a line opens their slip. Tapping a note changes it; Remove lives inside that change view, so there is no one-tap delete. If Redis is unreachable the page says so and adding is disabled.
