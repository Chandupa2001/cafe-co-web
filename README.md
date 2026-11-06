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

Run `npm run check:launch`. It fails until all four of these are done:

1. **Menu:** replace the sample items and prices in `src/data/menu.ts`, then set `sample` to `false`.
2. **Reviews:** replace the sample quotes in `src/data/testimonials.ts` with real ones (with permission), then set `sample` to `false`.
3. **Photos:** add them to `src/assets/photos/`. That folder's README lists the names and the best shot for each slot.
4. **Domain:** set `url` in `src/data/site.ts` to the real address.

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

## Motion

The site moves slowly and quietly, like a morning pour-over. Everything respects the "reduce motion" setting on phones and computers, and all content still shows without JavaScript.

| To change | Edit |
|---|---|
| Speeds and easing curves | The motion values at the top of `src/styles/global.css`, and the same values in `src/lib/motion.ts` |
| How sections play in as you scroll | `src/scripts/site-motion.ts` (the list at the top explains the `data-reveal` attributes components use) |
| The welcome screen (seal and steam, first visit only) | `src/components/Preloader.astro`. To turn it off, remove `<Preloader />` from `src/layouts/Base.astro` |
| Reviews | `src/data/testimonials.ts` (they are samples until `sample` is set to `false`) |
| Gallery lightbox | `src/components/Lightbox.astro` |

To switch an effect off, remove its `data-reveal` (or `data-parallax` / `data-drift`) attribute from the component. The element then simply shows.

## The "Bean to cup" story

Two beans beside the name travel down the page as you scroll, land in a hand grinder, are ground, poured into a portafilter, brewed in the espresso machine, and end as a steaming cup with an invitation to visit. It's drawn in fine brown line art and scrubbed to the scroll position, so it runs backwards when you scroll up. With "reduce motion" on (or without JavaScript), visitors see the grinder, the statement and the invitation as still content instead.

| To change | Edit |
|---|---|
| Timing of every step, and how far the camera moves | `T` and the constants at the top of `src/scripts/story.ts` |
| How long the chapter stays on screen (its scroll length) | `--brew-scroll` in `src/components/story/BrewChapter.astro`. Keep it a little longer than the last step in `T` |
| The statement, the invitation and their links | `src/components/story/BrewChapter.astro` |
| The drawings | `src/components/story/` (`Bean`, `Grinder`, `Portafilter`, `Machine`, `Cup`, `Steam`) |
| Shading density (hatching), and the lighter level on small screens | `--hatch` and `--tone` near the top of `src/styles/global.css` |

All drawings share one pen: two line weights in the logo brown (`.o` and `.d` in `global.css`) and the hatching patterns in `src/components/story/InkDefs.astro`. Reuse them for anything new so it looks like the same illustrator drew it.

## Deploying

The site is plain static files, so any static host works. On Cloudflare Pages or Netlify, connect the project and use:

- **Build command:** `npm run build`
- **Output folder:** `dist`
- **Node version:** 22 (22.12 or newer)
