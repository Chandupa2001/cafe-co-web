// Motion tokens for the scripted (GSAP) animations. These mirror the CSS custom
// properties at the top of src/styles/global.css, so keep the two in step.
// Durations are in seconds (GSAP's unit).

export const ease = {
  /** Entrances: a quick start, then a long, soft settle. Same curve as --ease-pour. */
  pour: 'quint.out',
  /** Crossfades and show/hide: gentle in and out. Close to --ease-steam. */
  steam: 'sine.inOut',
  /** Hovers and small state changes. Same curve as --ease-settle. */
  settle: 'cubic.out',
};

export const dur = {
  micro: 0.32,
  short: 0.6,
  base: 1,
  slow: 1.4,
  drift: 2.4,
};

export const step = {
  /** Between lines of text. */
  line: 0.08,
  /** Between list rows and gallery tiles. */
  item: 0.09,
  /** Between words in a headline. */
  word: 0.03,
};

/** The fade-and-rise distance in pixels. Matches --rise (0.75rem). */
export const rise = 12;

const query = (q: string) => typeof window !== 'undefined' && window.matchMedia(q).matches;

export const prefersReducedMotion = () => query('(prefers-reduced-motion: reduce)');

/** A mouse or trackpad, not a finger. */
export const isFinePointer = () => query('(hover: hover) and (pointer: fine)');

/** Scroll-linked drift is kept for larger screens with a fine pointer. */
export const allowsParallax = () => isFinePointer() && query('(min-width: 960px)');
