import type { APIRoute, GetStaticPaths } from "astro";
import { getCollection } from "astro:content";
import sharp from "sharp";

// Link-preview image for each guest, so a WhatsApp'd link shows the dog, not
// a blank grey box. Deliberately just the cut-out on the guest's hero colour:
// the name travels in og:title, and text drawn here would need the site's
// fonts installed on the build machine.

const W = 1200;
const H = 630;

export const getStaticPaths = (async () => {
  const guests = await getCollection("guests");
  return guests.map((entry) => ({ params: { id: entry.id }, props: { entry } }));
}) satisfies GetStaticPaths;

export const GET: APIRoute = async ({ props }) => {
  const { photo, bgColor } = props.entry.data;
  const canvas = sharp({ create: { width: W, height: H, channels: 4, background: bgColor } });

  // ImageMetadata only carries a (non-enumerable) fsPath at build time; a
  // guest without a cut-out yet just gets their colour.
  const fsPath = (photo as { fsPath?: string } | undefined)?.fsPath;
  const layers = fsPath
    ? [
        {
          input: await sharp(fsPath)
            .resize({ width: W - 120, height: H - 60, fit: "inside" })
            .toBuffer(),
          gravity: "south",
        },
      ]
    : [];

  // JPEG, not PNG: WhatsApp quietly drops preview images over ~300KB.
  const jpg = await canvas.composite(layers).flatten({ background: bgColor }).jpeg({ quality: 82 }).toBuffer();
  return new Response(new Uint8Array(jpg), { headers: { "Content-Type": "image/jpeg" } });
};
