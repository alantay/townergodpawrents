// POST /api/admin/post: check, write alt text, file the entry, one commit.
// The order matters: nothing is written until everything is checked, and a
// post key stops a double tap from posting twice.
import { requireAuth } from "./auth.ts";
import { POST_KEY_RE } from "./constants.ts";
import { fallbackAlt } from "./format.ts";
import type { GitHub } from "./github.ts";
import { json } from "./http.ts";
import { sanitizeAlt } from "../diary-file.ts";
import { fileEntry } from "./file-entry.ts";
import { cachedAlt } from "./photo-descriptions.ts";
import type { KeyStore } from "./store.ts";
import type { Ai, GuestInfo, Photo } from "./types.ts";
import { validate } from "./validate.ts";

const GUESTS_DIR = "src/content/guests";
const MAX_BODY = 4_500_000;
const PENDING = "pending";
const PENDING_SECONDS = 300;
const DONE_SECONDS = 86_400;
const BAD_SEND = "That didn't send properly. Try again.";
const NOT_SAVED = "Couldn't save it. Nothing was posted. Try again.";

export function postApi(deps: {
  secret: string | undefined;
  guests: () => Promise<GuestInfo[]>;
  ai: () => Ai;
  gitHub: () => GitHub;
  store: () => KeyStore;
  /** Puts a photo on Blob for the video Action to fetch. Returns its URL. */
  upload: () => (path: string, bytes: Uint8Array) => Promise<string>;
  now?: () => number;
}) {
  return {
    async post(request: Request): Promise<Response> {
      const denied = requireAuth(request, deps.secret, deps.now?.());
      if (denied) return denied;
      if (Number(request.headers.get("content-length") ?? 0) > MAX_BODY) return json({ error: "Photos too big. Try fewer." }, 413);

      const form = await request.formData().catch(() => undefined);
      if (!form) return json({ error: BAD_SEND }, 400);
      const postKey = String(form.get("postKey") ?? "");
      if (!POST_KEY_RE.test(postKey)) return json({ error: BAD_SEND }, 400);

      const photos: Photo[] = [];
      for (const value of form.getAll("photos")) {
        if (typeof value === "string") continue;
        photos.push({ bytes: new Uint8Array(await value.arrayBuffer()), type: value.type });
      }
      const field = (name: string) => String(form.get(name) ?? "");
      const checked = validate(
        {
          guest: field("guest"),
          iso: field("iso"),
          time: field("time"),
          label: field("label"),
          with: form.getAll("with").map(String),
          text: field("text"),
          photos,
          videoUrl: field("videoUrl") || undefined,
          videoAt: form.has("videoAt") ? Number(field("videoAt")) : undefined,
        },
        await deps.guests(),
      );
      if (!checked.ok) return json({ error: checked.error }, 400);
      const { guest, withGuests, input } = checked;
      let descriptions: unknown;
      try { descriptions = JSON.parse(field("descriptions")); } catch { /* No suggestions requested, or an older client. */ }

      // The double-tap guard. If Redis is down we post anyway, unguarded.
      const key = `admin-post:${postKey}`;
      let guarded = true;
      try {
        if (!(await deps.store().setNX(key, PENDING, PENDING_SECONDS))) {
          const earlier = await deps.store().get(key);
          if (earlier?.startsWith("/")) return json({ ok: true, url: earlier, ...(input.videoUrl ? { pending: true } : {}) });
          return json({ error: "Still posting. Give it a moment." }, 409);
        }
      } catch (error) {
        console.error("[admin] post key unavailable", error);
        guarded = false;
      }

      const ctx = { name: guest.name, withNames: withGuests.map((g) => g.name), recent: guest.recent };
      const fallback = fallbackAlt(guest.name, input.iso, input.label ?? (input.noTime ? undefined : input.time));
      const url = `/guests/${guest.id}`;
      const alts = await Promise.all(
        input.photos.map(async (photo) => {
          const reused = cachedAlt(descriptions, photo, ctx);
          if (reused) return reused;
          try {
            return sanitizeAlt(await deps.ai().altText(photo.bytes, ctx, input.text), fallback);
          } catch (error) {
            console.error("[admin] alt text failed", error);
            return fallback;
          }
        }),
      );
      // A video post goes to the admin-video Action, photos and all, so the
      // whole entry lands in one commit once the clip is prepped.
      if (input.videoUrl) {
        const { photos, videoUrl, videoAt = 0, ...payload } = input;
        try {
          const upload = deps.upload();
          const urls = await Promise.all(photos.map((p, i) => upload(`admin-video/${postKey}-${i + 1}.jpg`, p.bytes)));
          const media = urls.map((url, i) => ({ url, alt: alts[i] }));
          media.splice(videoAt, 0, { url: videoUrl, alt: fallback });
          await deps.gitHub().dispatch("admin-video", { ...payload, media, postKey });
        } catch (error) {
          console.error("[admin] video dispatch failed", error);
          if (guarded) await deps.store().del(key).catch(() => {});
          return json({ error: NOT_SAVED }, 502);
        }
        if (guarded) await deps.store().set(key, url, DONE_SECONDS).catch(() => {});
        return json({ ok: true, url, pending: true });
      }
      // Read everything fresh at the branch head, so a retry after the branch
      // moved files the entry against what's really there.
      async function attempt(): Promise<void> {
        const gh = deps.gitHub();
        const head = await gh.head();
        const files = (await gh.listDir(GUESTS_DIR, head)).filter((name) => name.endsWith(".md"));
        const own = `${guest.id}.md`;
        if (!files.includes(own)) files.push(own);
        const markdowns = Object.fromEntries(await Promise.all(
          files.map(async (name) => [name.slice(0, -3), await gh.readFile(`${GUESTS_DIR}/${name}`, head)]),
        ));
        const taken = new Set(await gh.listDir(`${GUESTS_DIR}/${guest.id}`, head));
        const filed = fileEntry(input, guest, alts.map((alt) => ({ alt, video: false })), markdowns, taken);
        await gh.commit(
          head,
          [
            { path: `${GUESTS_DIR}/${own}`, content: filed.markdown },
            ...filed.media.map((m, i) => ({ path: `${GUESTS_DIR}/${guest.id}/${m.file}`, content: input.photos[i].bytes })),
          ],
          filed.message,
        );
      }

      try {
        await attempt().catch(() => attempt());
      } catch (error) {
        console.error("[admin] commit failed", error);
        if (guarded) await deps.store().del(key).catch(() => {});
        return json({ error: NOT_SAVED }, 502);
      }

      if (guarded) await deps.store().set(key, url, DONE_SECONDS).catch(() => {});
      return json({ ok: true, url });
    },
  };
}
