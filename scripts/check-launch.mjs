// Lists anything that must be sorted before the site goes live, and fails if
// there is anything left. Run with: npm run check:launch
import { readdirSync } from 'node:fs';
import { site } from '../src/data/site.ts';
import { sample } from '../src/data/menu.ts';
import { sample as sampleReviews } from '../src/data/testimonials.ts';
import { photoSlots } from '../src/data/photos.ts';

const uploaded = new Set(
  readdirSync('src/assets/photos')
    .filter((file) => /\.(jpe?g|png|webp|avif)$/i.test(file))
    .map((file) => file.replace(/\.[^.]+$/, '').toLowerCase()),
);
const missing = photoSlots.filter((slot) => !uploaded.has(slot));

const problems = [];
if (sample) {
  problems.push('Menu: replace the sample items and prices in src/data/menu.ts, then set `sample` to false.');
}
if (sampleReviews) {
  problems.push('Reviews: replace the sample quotes in src/data/testimonials.ts with real ones, then set `sample` to false.');
}
if (/\.example(\/|$)/.test(site.url)) {
  problems.push('Domain: set the real site address as `url` in src/data/site.ts.');
}
if (missing.length) {
  problems.push(`Photos: ${missing.length} missing from src/assets/photos/: ${missing.join(', ')}.`);
}

if (problems.length) {
  console.error(`Not ready to launch. ${problems.length} thing(s) to sort out:\n`);
  for (const problem of problems) console.error(`  - ${problem}`);
  process.exit(1);
}

console.log('Ready to launch: menu, reviews, domain and photos are all in place.');
