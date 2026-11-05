# Cafe' Co. by Virasha website

A single-page static site for Cafe' Co., built with [Astro](https://astro.build). It needs Node 22.12 or newer.

## Commands

| Command | What it does |
|---|---|
| `npm install` | Installs everything (first time only) |
| `npm run dev` | Runs the site locally at `http://localhost:4321` with live reload |
| `npm run build` | Builds the finished site into `dist/` |
| `npm run preview` | Serves the finished build locally |
| `npm run check:launch` | Lists anything still needed before going live |
| `npm run logo` | Regenerates the logo files, favicons and sharing image |

## Before going live

Run `npm run check:launch`. It fails until all three of these are done:

1. **Menu:** replace the sample items and prices in `src/data/menu.ts`, then set `sample` to `false`.
2. **Photos:** add them to `src/assets/photos/`. That folder's README lists the names and the best shot for each slot.
3. **Domain:** set `url` in `src/data/site.ts` to the real address.

Also check that the map and directions link point to the right spot. Once the cafe has a Google Business Profile, its exact map link can replace `links.directions` in `src/data/site.ts`.

## Making changes

| To change | Edit |
|---|---|
| Address, phone, hours, social links, page title | `src/data/site.ts` |
| Opening-hours logic behind the "Open now" label | `src/lib/hours.ts` |
| Menu | `src/data/menu.ts` |
| Photo descriptions (alt text) | `src/data/photos.ts` |
| Colours and fonts | The top of `src/styles/global.css` |
| Wording in a section | That section's file in `src/components/` |

Changing the hours takes two edits: `hours` in `site.ts` and the two values at the top of `hours.ts`.

**Accent colour:** change `--accent` in `src/styles/global.css`.

**Logo:** the source is `src/assets/brand/logo-source.png`. `npm run logo` traces it into the versions the site uses. If you replace the source with artwork laid out differently, update the crop boxes at the top of `scripts/prepare-logo.mjs`.

## Deploying

The site is plain static files, so any static host works. On Cloudflare Pages or Netlify, connect the project and use:

- **Build command:** `npm run build`
- **Output folder:** `dist`
- **Node version:** 22 (22.12 or newer)
