import type { APIRoute } from "astro";
import { getCollection } from "astro:content";
import sharp from "sharp";
import { dateStr, todaySGT } from "../../lib/guests";

// The homepage's link preview: every dog who has stayed so far, lined up as
// tilted prints on the site's paper. Unlike "who's here today", this can't go
// stale in a chat thread; it only grows as the build picks up new guests.
// No drawn text, for the same reason as og/[id].jpg.ts.

const W = 1200;
const H = 630;
const PAPER = "#efe7d8";
const MAT = "#f7f2e7";
const BORDER = 14;
const GAP = 28;

export const GET: APIRoute = async () => {
  const today = todaySGT();
  const guests = (await getCollection("guests"))
    .map((g) => ({
      fsPath: (g.data.photo as { fsPath?: string } | undefined)?.fsPath,
      bgColor: g.data.bgColor,
      firstIn: g.data.stays.map((s) => dateStr(s.checkIn)).sort()[0],
    }))
    .filter((g) => g.fsPath && g.firstIn <= today)
    .sort((a, b) => a.firstIn.localeCompare(b.firstIn));

  // Prints are 4:5 and as big as the frame allows. Past three or so they
  // start to overlap, like a stack spread on a table, rather than shrink to
  // stamps; past six, only the most recent arrivals make the row.
  const row = guests.slice(-6);
  const n = Math.max(row.length, 1);
  const printW = Math.max(280, Math.min(360, Math.floor((W - 80 - GAP * (n - 1)) / n)));
  const printH = Math.round(printW * 1.25);
  const step = n > 1 ? Math.min(printW + GAP, (W - 80 - printW) / (n - 1)) : 0;
  const rowW = printW + step * (n - 1);

  const layers = await Promise.all(
    row.map(async (g, i) => {
      const innerW = printW - BORDER * 2;
      const innerH = printH - BORDER * 2;
      const dog = await sharp(g.fsPath!)
        .resize({ width: innerW - 20, height: innerH - 12, fit: "inside" })
        .toBuffer();
      const inner = await sharp({ create: { width: innerW, height: innerH, channels: 4, background: g.bgColor } })
        .composite([{ input: dog, gravity: "south" }])
        .png()
        .toBuffer();
      const angle = i % 2 === 0 ? -3 : 2.5;
      // Composite first, then rotate: sharp runs rotate before composite
      // within a single pipeline.
      const flat = await sharp({ create: { width: printW, height: printH, channels: 4, background: MAT } })
        .composite([{ input: inner, left: BORDER, top: BORDER }])
        .png()
        .toBuffer();
      const print = await sharp(flat)
        .rotate(angle, { background: { r: 0, g: 0, b: 0, alpha: 0 } })
        .png()
        .toBuffer();

      // A soft offset shadow, cut from the print's own silhouette.
      const { width = 0, height = 0 } = await sharp(print).metadata();
      // Padded first so the blur has room to fade out instead of being
      // clipped into a hard block at the print's edges.
      const PAD = 30;
      const shadow = await sharp(
        await sharp(print)
          .extend({ top: PAD, bottom: PAD, left: PAD, right: PAD, background: { r: 0, g: 0, b: 0, alpha: 0 } })
          .png()
          .toBuffer(),
      )
        .linear([0, 0, 0, 0.3], [30, 32, 25, 0])
        .blur(12)
        .png()
        .toBuffer();

      const left = Math.round((W - rowW) / 2 + i * step + printW / 2 - width / 2);
      const top = Math.round(H / 2 - height / 2 + (i % 2 === 0 ? 6 : -6));
      return [
        { input: shadow, left: left - PAD + 3, top: top - PAD + 10 },
        { input: print, left, top },
      ];
    }),
  );

  // JPEG, not PNG: WhatsApp quietly drops preview images over ~300KB.
  const jpg = await sharp({ create: { width: W, height: H, channels: 4, background: PAPER } })
    .composite(layers.flat())
    .flatten({ background: PAPER })
    .jpeg({ quality: 82 })
    .toBuffer();
  return new Response(new Uint8Array(jpg), { headers: { "Content-Type": "image/jpeg" } });
};
