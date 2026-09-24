// Shorten only the pointed paper tip in Guapo's original cutout. Leave the
// diagonal torn side and every dog pixel untouched.
import sharp from "sharp";

const source = "src/content/guests/guapo/guapo-collage-v2.png";
const output = "src/content/guests/guapo/guapo-collage-v5.png";
const { data, info } = await sharp(source).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
const { width, height, channels } = info;

for (let y = 1170; y <= 1260; y++) {
  let edge = width - 1;
  while (edge >= 0 && data[(y * width + edge) * channels + 3] < 128) edge--;

  const taper = Math.exp(-(((y - 1225) / 35) ** 2));
  const trim = Math.round(taper * (13 + 2 * Math.sin(y * 0.35)));
  const newEdge = edge - trim;

  for (let x = newEdge + 1; x < width; x++) {
    const pixel = (y * width + x) * channels;
    data[pixel + 3] = 0;
  }
  data[(y * width + newEdge) * channels + 3] = Math.min(data[(y * width + newEdge) * channels + 3], 180);
}

await sharp(data, { raw: { width, height, channels } }).png().toFile(output);
