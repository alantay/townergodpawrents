// POST /api/admin/polish: { guest, with, text } → polish options. A failure
// never loses the words; the page keeps them.
import { requireAuth } from "./auth.ts";
import { json } from "./http.ts";
import type { Ai, GuestInfo } from "./types.ts";
import { MAX_TEXT, TOO_LONG } from "./validate.ts";

export function polishApi(deps: { secret: string | undefined; guests: () => Promise<GuestInfo[]>; ai: () => Ai; now?: () => number }) {
  return {
    async polish(request: Request): Promise<Response> {
      const denied = requireAuth(request, deps.secret, deps.now?.());
      if (denied) return denied;

      const body = await request.json().catch(() => ({}));
      const guests = await deps.guests();
      const guest = guests.find((g) => g.id === body?.guest);
      if (!guest) return json({ error: "Pick a dog." }, 400);
      const text = typeof body.text === "string" ? body.text.trim() : "";
      if (!text) return json({ error: "Add some words first." }, 400);
      if (text.length > MAX_TEXT) return json({ error: TOO_LONG }, 400);
      const withNames = (Array.isArray(body.with) ? body.with : [])
        .map((id: unknown) => guests.find((g) => g.id === id && g.id !== guest.id)?.name)
        .filter(Boolean) as string[];

      try {
        return json(await deps.ai().polish(text, { name: guest.name, withNames, recent: guest.recent }));
      } catch (error) {
        console.error("[admin] polish failed", error);
        return json({ error: "Polish didn't work this time. Your words are still here." }, 502);
      }
    },
  };
}
