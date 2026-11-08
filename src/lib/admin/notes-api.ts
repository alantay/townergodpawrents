// POST /api/admin/notes: {guest, action: add|edit|remove, id?, text?} → {notes}.
// Login first, then Redis, so a logged-out request never touches the notes.
import { requireAuth } from "./auth.ts";
import { json } from "./http.ts";
import { NOTE_MAX, NOTES_PER_DOG, type NotesStore } from "./notes-store.ts";

const DOWN = "Can't reach the notes right now.";

export function notesApi(deps: {
  secret: string | undefined;
  guests: () => Promise<{ id: string }[]>;
  notesStore: () => NotesStore;
  now?: () => number;
  newId?: () => string;
}) {
  return {
    async post(request: Request): Promise<Response> {
      const denied = requireAuth(request, deps.secret, deps.now?.());
      if (denied) return denied;

      const body: { guest?: unknown; action?: unknown; id?: unknown; text?: unknown } =
        await request.json().catch(() => ({}));
      const guests = await deps.guests();
      const guest = guests.find((g) => g.id === body?.guest)?.id;
      if (!guest) return json({ error: "Pick a dog." }, 400);

      let store: NotesStore;
      try {
        store = deps.notesStore();
      } catch (error) {
        console.error("[admin] notes store", error);
        return json({ error: DOWN }, 503);
      }

      const text = typeof body.text === "string" ? body.text.trim() : "";
      const id = typeof body.id === "string" ? body.id : "";
      const needsText = body.action === "add" || body.action === "edit";
      if (needsText && !text) return json({ error: "Write something first." }, 400);
      if (needsText && text.length > NOTE_MAX) return json({ error: `Keep it under ${NOTE_MAX} characters.` }, 400);
      if (body.action !== "add" && !id) return json({ error: "Which note?" }, 400);

      try {
        if (body.action === "add") {
          const at = deps.now?.() ?? Date.now();
          if ((await store.add(guest, { id: deps.newId?.() ?? crypto.randomUUID(), text, at })) === "full")
            return json({ error: `That's ${NOTES_PER_DOG} already. Remove one first.`, notes: await store.list(guest) }, 400);
        } else if (body.action === "edit") {
          if ((await store.edit(guest, id, text)) === "gone")
            return json({ error: "That note's gone.", notes: await store.list(guest) }, 409);
        } else if (body.action === "remove") {
          await store.remove(guest, id);
        } else {
          return json({ error: "That didn't send properly. Try again." }, 400);
        }
        return json({ notes: await store.list(guest) });
      } catch (error) {
        console.error("[admin] notes failed", error);
        return json({ error: DOWN }, 503);
      }
    },
  };
}
