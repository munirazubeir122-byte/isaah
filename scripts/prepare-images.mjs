// Prepares the source photos in ../media for the web.
//
// - Physically crops every image so that NO faces (even blurred or partial)
//   and no baked-in headline text survive in the published file. Cropping in
//   CSS is not enough: the hidden pixels would still be downloaded.
// - Exports small WebP files (one desktop + one mobile width) for
//   low-bandwidth networks.
// - Recolours the navy "Islaah" wordmark so it reads on the dark theme.
//
// Run with:  npm run images
import sharp from 'sharp';
import { mkdir } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const SRC = path.resolve(here, '../../media');
const OUT = path.resolve(here, '../public/images');

// The site no longer uses photos: every image is now a hand-drawn illustration
// from make-illustrations.mjs. This script only prepares the logo. The old
// photo crops are kept below for reference but are not exported.
const IMAGES = [];

// Crop boxes are fractions of the source image (x, y, width, height), so they
// survive a different source resolution.
// eslint-disable-next-line no-unused-vars
const RETIRED_PHOTOS = [
  {
    // Interview table: recorder, notebook, clasped hands. No faces, no text.
    name: 'hero-interview',
    file: 'Gemini_Generated_Image_d7ekgbd7ekgbd7ek.jpg',
    crop: [0, 0, 1, 1],
  },
  {
    // Hands mending cloth in a camp shelter. Top strip removed: it holds
    // baked-in headline text and the edge of a chin (top right).
    name: 'camp-survival',
    file: 'Gemini_Generated_Image_nqwepvnqwepvnqwe.jpg',
    crop: [0, 0.27, 1, 0.73],
  },
  {
    // Close crop of the same scene: working hands and tins only.
    name: 'camp-hands',
    file: 'Gemini_Generated_Image_nqwepvnqwepvnqwe.jpg',
    crop: [0.5, 0.33, 0.5, 0.67],
  },
  {
    // Studio table: notebook and clasped hands. Top removed: baked-in text
    // and a mock website on the monitor.
    name: 'studio-hands',
    file: 'Gemini_Generated_Image_yizp9hyizp9hyizp.jpg',
    crop: [0, 0.47, 1, 0.53],
  },
  {
    // Community room: hands and a glass of water. Top half removed: the
    // background diners' faces are visible and there is baked-in text.
    name: 'community-table',
    file: 'Gemini_Generated_Image_m7e9v4m7e9v4m7e9.jpg',
    crop: [0, 0.55, 1, 0.45],
  },
];

const WIDTHS = { lg: 1400, sm: 720 };

await mkdir(OUT, { recursive: true });

for (const img of IMAGES) {
  const input = path.join(SRC, img.file);
  const { width, height } = await sharp(input).metadata();
  const [fx, fy, fw, fh] = img.crop;
  const region = {
    left: Math.round(fx * width),
    top: Math.round(fy * height),
    width: Math.round(fw * width),
    height: Math.round(fh * height),
  };
  for (const [suffix, w] of Object.entries(WIDTHS)) {
    const out = path.join(OUT, `${img.name}-${suffix}.webp`);
    const info = await sharp(input)
      .extract(region)
      .resize({ width: Math.min(w, region.width) })
      // Strip all metadata (EXIF, GPS, camera) for source protection.
      .webp({ quality: suffix === 'sm' ? 62 : 70 })
      .toFile(out);
    console.log(`${path.basename(out)}  ${info.width}x${info.height}  ${(info.size / 1024).toFixed(0)} KB`);
  }
}

// Logo: navy letters on white -> soft white letters on transparent.
const logoSrc = path.join(SRC, 'Islaah in Navy Serif.png');
const alpha = await sharp(logoSrc)
  .resize({ width: 600 })
  .greyscale()
  .negate()
  .linear(1.6, -60) // push the white background fully transparent
  .toColourspace('b-w')
  .raw()
  .toBuffer({ resolveWithObject: true });

const { width: lw, height: lh } = alpha.info;
const joined = await sharp({
  create: { width: lw, height: lh, channels: 3, background: '#f4f6f4' },
})
  .joinChannel(alpha.data, { raw: { width: lw, height: lh, channels: 1 } })
  .png()
  .toBuffer();
const logo = await sharp(joined)
  .trim() // drop the empty margin around the letters
  .png({ compressionLevel: 9 })
  .toFile(path.join(OUT, 'islaah-wordmark.png'));
console.log(`islaah-wordmark.png  ${logo.width}x${logo.height}  ${(logo.size / 1024).toFixed(0)} KB`);
