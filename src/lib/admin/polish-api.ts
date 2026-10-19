// POST /api/admin/polish: multipart guest, with, text, photos → suggestions.
// never loses the words; the page keeps them.
import { requireAuth } from "./auth.ts";
import { json } from "./http.ts";
import { descriptionKey } from "./photo-descriptions.ts";
import { sanitizeAlt } from "./format.ts";
import type { Ai, GuestInfo, Photo } from "./types.ts";
import { isJpeg, MAX_PHOTOS, MAX_PHOTO_BYTES, MAX_TEXT, TOO_LONG } from "./validate.ts";

export function polishApi(deps: { secret: string | undefined; guests: () => Promise<GuestInfo[]>; ai: () => Ai; now?: () => number }) {
  return {
    async polish(request: Request): Promise<Response> {
      const denied = requireAuth(request, deps.secret, deps.now?.());
      if (denied) return denied;

      if (Number(request.headers.get("content-length") ?? 0) > 4_500_000) return json({ error: "Photos too big. Try fewer." }, 413);
      let body: { guest?: unknown; text?: unknown; with?: unknown };
      const photos: Photo[] = [];
      if (request.headers.get("content-type")?.includes("multipart/form-data")) {
        const form = await request.formData().catch(() => undefined);
        if (!form) return json({ error: "That didn't send properly. Try again." }, 400);
        body = { guest: form.get("guest"), text: form.get("text"), with: form.getAll("with") };
        const files = form.getAll("photos");
        if (files.length > MAX_PHOTOS) return json({ error: "Four photos at most." }, 400);
        for (const file of files) {
          if (typeof file === "string") return json({ error: "Can't read this photo. Try a JPEG or a screenshot of it." }, 400);
          if (file.size >= MAX_PHOTO_BYTES) return json({ error: "Photos too big. Try fewer." }, 400);
          const photo = { bytes: new Uint8Array(await file.arrayBuffer()), type: file.type };
          if (!isJpeg(photo)) return json({ error: "Can't read this photo. Try a JPEG or a screenshot of it." }, 400);
          photos.push(photo);
        }
      } else {
        body = await request.json().catch(() => ({}));
      }
      const guests = await deps.guests();
      const guest = guests.find((g) => g.id === body?.guest);
      if (!guest) return json({ error: "Pick a dog." }, 400);
      const text = typeof body?.text === "string" ? body.text.trim() : "";
      if (!text && !photos.length) return json({ error: "Add some words or a photo." }, 400);
      if (text.length > MAX_TEXT) return json({ error: TOO_LONG }, 400);
      const withNames = [...new Set(Array.isArray(body?.with) ? body.with : [])]
        .map((id: unknown) => guests.find((g) => g.id === id && g.id !== guest.id)?.name)
        .filter(Boolean) as string[];

      try {
        const ctx = { name: guest.name, withNames, recent: guest.recent };
        const { alts = [], ...options } = await deps.ai().polish(text, ctx, photos);
        const descriptions = alts.length === photos.length ? photos.flatMap((photo, i) => {
          const alt = typeof alts[i] === "string" ? sanitizeAlt(alts[i], "") : "";
          return alt ? [{ key: descriptionKey(photo, ctx), alt }] : [];
        }) : [];
        return json({ ...options, descriptions });
      } catch (error) {
        console.error("[admin] polish failed", error);
        return json({ error: "Couldn't suggest words this time. Your words and photos are still here. Try again." }, 502);
      }
    },
  };
}
