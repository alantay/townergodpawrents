// Add short paper fibres to Guapo's lower-right edge without touching his photo.
// The source stays in place so the portrait can be regenerated or compared.
import sharp from "sharp";

const source = "src/content/guests/guapo/guapo-collage-v3.png";
const output = "src/content/guests/guapo/guapo-collage-v4.png";
const { data, info } = await sharp(source).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
const { width, height, channels } = info;

for (let y = 1130; y <= 1270; y++) {
  let edge = width - 1;
  while (edge >= 0 && data[(y * width + edge) * channels + 3] < 128) edge--;

  const progress = (y - 1130) / 140;
  const taper = Math.sin(Math.PI * progress) ** 2;
  const fibre = 5 * Math.sin(y * 0.12) + 2 * Math.sin(y * 0.27);
  const reach = Math.max(0, Math.round(taper * (11 + fibre)));

  for (let step = 1; step <= reach && edge + step < width; step++) {
    const sample = (y * width + edge - 8 - (step % 4)) * channels;
    const pixel = (y * width + edge + step) * channels;
    data[pixel] = data[sample];
    data[pixel + 1] = data[sample + 1];
    data[pixel + 2] = data[sample + 2];
    data[pixel + 3] = step === reach ? 90 : step === reach - 1 ? 190 : 252;
  }
}

await sharp(data, { raw: { width, height, channels } }).png().toFile(output);
