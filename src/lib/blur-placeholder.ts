import { resolve } from "node:path";
import sharp from "sharp";

/**
 * A blurry hint of a diary photo or video poster, small enough (well under a
 * kilobyte) to sit in the page itself, so a print isn't blank while the real
 * file loads. A 16px webp, blurred by an SVG filter rather than shown as
 * chunky pixels. The alpha step keeps the blur from fading at the edges.
 *
 * Takes the import.meta.glob key the media was found under, like
 * "../../content/guests/ebi/ebi-nap.jpg", and reads that file from src/.
 */
export async function blurPlaceholder(globKey: string): Promise<string> {
  const file = resolve("src", globKey.slice(globKey.indexOf("content/")));
  const { data, info } = await sharp(file)
    .rotate()
    .resize(16)
    .webp({ quality: 50 })
    .toBuffer({ resolveWithObject: true });
  const w = info.width * 40;
  const h = info.height * 40;
  const svg =
    `<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 ${w} ${h}'>` +
    `<filter id='b' color-interpolation-filters='sRGB'><feGaussianBlur stdDeviation='24'/>` +
    `<feComponentTransfer><feFuncA type='discrete' tableValues='1 1'/></feComponentTransfer></filter>` +
    `<image width='100%' height='100%' preserveAspectRatio='none' filter='url(#b)' href='data:image/webp;base64,${data.toString("base64")}'/></svg>`;
  return "data:image/svg+xml," + svg.replace(/[%#<>]/g, encodeURIComponent);
}

/** The blur as a CSS background, for an img that hasn't loaded yet. */
export const blurBackground = (blur: string) => `background:url("${blur}") center/cover no-repeat`;
