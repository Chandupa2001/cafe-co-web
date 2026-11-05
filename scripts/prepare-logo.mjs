// Turns the supplied logo into the versions the site needs. Nothing is redrawn:
// each SVG is a direct trace of the source artwork.
//
// Run with: npm run logo
// To use a better source later, replace src/assets/brand/logo-source.png. The
// boxes below assume the same layout, so check them if the artwork changes.
import { writeFile, mkdir } from 'node:fs/promises';
import sharp from 'sharp';
import potrace from 'potrace';

const SOURCE = 'src/assets/brand/logo-source.png';
const OUT = 'src/assets/brand';
const INK = { r: 112, g: 68, b: 29 }; // Sampled from the logo: #70441D

// Regions in source-image pixels. A shape is kept only if it sits fully inside.
const ASSETS = {
  seal: { left: 465, top: 207, right: 1521, bottom: 1236, scale: 3 },
  mark: { left: 698, top: 499, right: 1283, bottom: 828, scale: 3 },
};

const { data, info } = await sharp(SOURCE)
  .flatten({ background: '#ffffff' })
  .removeAlpha()
  .raw()
  .toBuffer({ resolveWithObject: true });
const { width: W, height: H, channels: CH } = info;

// The blue channel has the strongest ink/paper contrast. Map ink to 0, paper to 255.
const grey = new Uint8ClampedArray(W * H);
for (let i = 0; i < W * H; i++) {
  grey[i] = ((data[i * CH + 2] - INK.b) / (255 - INK.b)) * 255;
}

// Label connected shapes so neighbouring strokes can be separated cleanly.
const label = new Int32Array(W * H);
const shapes = [];
const stack = [];
for (let s = 0; s < W * H; s++) {
  if (grey[s] > 128 || label[s]) continue;
  const id = shapes.length + 1;
  const shape = { id, minX: W, maxX: 0, minY: H, maxY: 0 };
  stack.push(s);
  label[s] = id;
  while (stack.length) {
    const p = stack.pop();
    const x = p % W;
    const y = (p / W) | 0;
    shape.minX = Math.min(shape.minX, x);
    shape.maxX = Math.max(shape.maxX, x);
    shape.minY = Math.min(shape.minY, y);
    shape.maxY = Math.max(shape.maxY, y);
    const near = [x > 0 ? p - 1 : -1, x < W - 1 ? p + 1 : -1, y > 0 ? p - W : -1, y < H - 1 ? p + W : -1];
    for (const q of near) {
      if (q >= 0 && grey[q] <= 128 && !label[q]) {
        label[q] = id;
        stack.push(q);
      }
    }
  }
  shapes.push(shape);
}

function isolate(box) {
  const keep = new Set(
    shapes
      .filter((s) => s.minX >= box.left && s.maxX <= box.right && s.minY >= box.top && s.maxY <= box.bottom)
      .map((s) => s.id),
  );
  const out = Uint8ClampedArray.from(grey);
  const R = 3; // Also clears the soft anti-aliased edge around removed shapes.
  for (let y = 0; y < H; y++) {
    for (let x = 0; x < W; x++) {
      const id = label[y * W + x];
      if (!id || keep.has(id)) continue;
      for (let dy = -R; dy <= R; dy++) {
        for (let dx = -R; dx <= R; dx++) {
          const nx = x + dx;
          const ny = y + dy;
          if (nx < 0 || ny < 0 || nx >= W || ny >= H) continue;
          if (!keep.has(label[ny * W + nx])) out[ny * W + nx] = 255;
        }
      }
    }
  }
  return out;
}

function trace(png) {
  return new Promise((resolve, reject) => {
    potrace.trace(
      png,
      { threshold: 128, turdSize: 8, optCurve: true, optTolerance: 1, color: 'currentColor', background: 'transparent' },
      (err, svg) => (err ? reject(err) : resolve(svg)),
    );
  });
}

await mkdir(OUT, { recursive: true });
await mkdir('public', { recursive: true });

const svgs = {};
for (const [name, box] of Object.entries(ASSETS)) {
  const width = box.right - box.left;
  const height = box.bottom - box.top;
  const isolated = isolate(box);
  const png = await sharp(Buffer.from(isolated), { raw: { width: W, height: H, channels: 1 } })
    .extract({ left: box.left, top: box.top, width, height })
    .resize(width * box.scale, height * box.scale, { kernel: 'lanczos3' })
    .png()
    .toBuffer();
  const traced = await trace(png);
  const d = [...traced.matchAll(/ d="([^"]+)"/g)]
    .map((m) => m[1])
    .join(' ')
    .replace(/\d+\.\d+/g, (n) => String(Math.round(Number(n)))); // Sub-pixel precision only adds weight.
  const svg =
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width * box.scale} ${height * box.scale}" fill="currentColor">` +
    `<path fill-rule="evenodd" d="${d}"/></svg>\n`;
  svgs[name] = svg;
  console.log(`${name}  ${(svg.length / 1024).toFixed(1)} KB`);
}

const paint = (svg, colour) => Buffer.from(svg.replaceAll('currentColor', colour));
const WHITE = '#FFFFFF';
const BROWN = '#70441D';

// Header logo: the supplied artwork itself, with only the empty margins cropped off.
await sharp(SOURCE)
  .extract({
    left: ASSETS.seal.left,
    top: ASSETS.seal.top,
    width: ASSETS.seal.right - ASSETS.seal.left,
    height: ASSETS.seal.bottom - ASSETS.seal.top,
  })
  .png()
  .toFile(`${OUT}/logo-original.png`);
// Footer logo: used as a cached image file, because it's too heavy to inline.
await writeFile(`${OUT}/seal-brown.svg`, paint(svgs.seal, BROWN));

// Favicons: the small mark in white on a brown disc.
for (const [file, size] of [
  ['favicon-32.png', 32],
  ['favicon-192.png', 192],
  ['apple-touch-icon.png', 180],
]) {
  const inner = Math.round(size * (size <= 32 ? 0.88 : 0.74)); // Fill more of the tiny icon.
  const mark = await sharp(paint(svgs.mark, WHITE), { density: 300 })
    .resize({ width: inner })
    .png()
    .toBuffer();
  const round = file === 'apple-touch-icon.png' ? 0 : size / 2;
  const disc = `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}"><rect width="${size}" height="${size}" rx="${round}" fill="${BROWN}"/></svg>`;
  await sharp(Buffer.from(disc))
    .composite([{ input: mark, gravity: 'center' }])
    .png()
    .toFile(`public/${file}`);
}

// Social sharing image: the brown seal on white.
const seal = await sharp(paint(svgs.seal, BROWN), { density: 200 }).resize({ height: 460 }).png().toBuffer();
await sharp({ create: { width: 1200, height: 630, channels: 3, background: WHITE } })
  .composite([{ input: seal, gravity: 'center' }])
  .jpeg({ quality: 88 })
  .toFile('public/og-image.jpg');

console.log('Favicons and social image written to public/');
