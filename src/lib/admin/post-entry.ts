// POST /api/admin/post: check, write alt text, file the entry, one commit.
// The order matters: nothing is written until everything is checked, and a
// post key stops a double tap from posting twice.
import { requireAuth } from "./auth.ts";
import { fallbackAlt, sanitizeAlt } from "./format.ts";
import type { GitHub } from "./github.ts";
import { json } from "./http.ts";
import { insertEntry, nextId } from "./insert-entry.ts";
import { photoName, slugWords } from "./photo-name.ts";
import type { KeyStore } from "./store.ts";
import type { Ai, GuestInfo, Photo } from "./types.ts";
import { validate } from "./validate.ts";

const GUESTS_DIR = "src/content/guests";
const MAX_BODY = 4_500_000;
const KEY_RE = /^[A-Za-z0-9-]{8,100}$/;
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
      if (!KEY_RE.test(postKey)) return json({ error: BAD_SEND }, 400);

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
        },
        await deps.guests(),
      );
      if (!checked.ok) return json({ error: checked.error }, 400);
      const { guest, withGuests, input } = checked;

      // The double-tap guard. If Redis is down we post anyway, unguarded.
      const key = `admin-post:${postKey}`;
      let guarded = true;
      try {
        if (!(await deps.store().setNX(key, PENDING, PENDING_SECONDS))) {
          const earlier = await deps.store().get(key);
          if (earlier?.startsWith("/")) return json({ ok: true, url: earlier });
          return json({ error: "Still posting. Give it a moment." }, 409);
        }
      } catch (error) {
        console.error("[admin] post key unavailable", error);
        guarded = false;
      }

      const ctx = { name: guest.name, withNames: withGuests.map((g) => g.name), recent: guest.recent };
      const fallback = fallbackAlt(guest.name, input.iso, input.label ?? (input.noTime ? undefined : input.time));
      const alts = await Promise.all(
        input.photos.map(async (photo) => {
          try {
            return sanitizeAlt(await deps.ai().altText(photo.bytes, ctx, input.text), fallback);
          } catch (error) {
            console.error("[admin] alt text failed", error);
            return fallback;
          }
        }),
      );
      const words = slugWords(input.text, guest.name);
      const url = `/guests/${guest.id}`;

      // Read everything fresh at the branch head, so a retry after the branch
      // moved files the entry against what's really there.
      async function attempt(): Promise<void> {
        const gh = deps.gitHub();
        const head = await gh.head();
        const files = (await gh.listDir(GUESTS_DIR, head)).filter((name) => name.endsWith(".md"));
        const own = `${guest.id}.md`;
        if (!files.includes(own)) files.push(own);
        const markdowns = await Promise.all(files.map((name) => gh.readFile(`${GUESTS_DIR}/${name}`, head)));
        const taken = new Set(await gh.listDir(`${GUESTS_DIR}/${guest.id}`, head));
        const images = input.photos.map((_, i) => ({ alt: alts[i], file: photoName(guest.id, words, taken) }));
        const markdown = insertEntry(
          markdowns[files.indexOf(own)],
          { iso: input.iso, time: input.time, label: input.label, noTime: input.noTime, with: input.with, text: input.text, images, id: nextId(markdowns) },
          guest.stays,
          guest.id,
        );
        await gh.commit(
          head,
          [
            { path: `${GUESTS_DIR}/${own}`, content: markdown },
            ...images.map((img, i) => ({ path: `${GUESTS_DIR}/${guest.id}/${img.file}`, content: input.photos[i].bytes })),
          ],
          `Add ${guest.name} ${input.time} ${words.join(" ")} entry (via admin)`,
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
