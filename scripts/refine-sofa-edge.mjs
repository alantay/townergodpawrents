// Roughen only the paper border of the Vacancy cutout; keep the bed and toys.
import sharp from "sharp";

const source = "src/assets/sofa-cutout.png";
const output = "src/assets/sofa-cutout-v2.png";
const { data: original, info } = await sharp(source).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
const data = Buffer.from(original);
const { width, height, channels } = info;

function paperAt(pixel) {
  return original[pixel + 3] > 200 && original[pixel] > 200 && original[pixel + 1] > 175;
}

function addFibre(to, sample, reach) {
  if (!paperAt(sample)) return;
  for (let step = 1; step <= reach; step++) {
    const pixel = to(step);
    if (pixel < 0 || pixel + 3 >= data.length || original[pixel + 3] > 128) continue;
    data[pixel] = original[sample];
    data[pixel + 1] = original[sample + 1];
    data[pixel + 2] = original[sample + 2];
    data[pixel + 3] = step === reach ? 90 : step === reach - 1 ? 190 : 252;
  }
}

for (let x = 0; x < width; x++) {
  let top = 0;
  while (top < height && original[(top * width + x) * channels + 3] < 128) top++;
  let bottom = height - 1;
  while (bottom >= 0 && original[(bottom * width + x) * channels + 3] < 128) bottom--;
  if (top >= bottom) continue;

  const taper = Math.sin(Math.PI * x / width) ** 2;
  const reach = Math.max(0, Math.round(taper * (9 + 4 * Math.sin(x * 0.04) + 2 * Math.sin(x * 0.13))));
  const topSample = ((top + 8) * width + x) * channels;
  const bottomSample = ((bottom - 8) * width + x) * channels;
  addFibre((step) => top - step >= 0 ? ((top - step) * width + x) * channels : -1, topSample, reach);
  addFibre((step) => bottom + step < height ? ((bottom + step) * width + x) * channels : -1, bottomSample, reach);
}

for (let y = 0; y < height; y++) {
  let left = 0;
  while (left < width && original[(y * width + left) * channels + 3] < 128) left++;
  let right = width - 1;
  while (right >= 0 && original[(y * width + right) * channels + 3] < 128) right--;
  if (left >= right) continue;

  const taper = Math.sin(Math.PI * y / height) ** 2;
  const reach = Math.max(0, Math.round(taper * (8 + 3 * Math.sin(y * 0.06) + 2 * Math.sin(y * 0.18))));
  const leftSample = (y * width + left + 8) * channels;
  const rightSample = (y * width + right - 8) * channels;
  addFibre((step) => left - step >= 0 ? (y * width + left - step) * channels : -1, leftSample, reach);
  addFibre((step) => right + step < width ? (y * width + right + step) * channels : -1, rightSample, reach);
}

await sharp(data, { raw: { width, height, channels } }).png().toFile(output);
