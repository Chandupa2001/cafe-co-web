// Plays the site's motion. Components only describe what they want with data
// attributes; this file is the one place that decides how it moves.
//
//   data-reveal="rise|fade|mask|words"  Plays in once, when scrolled into view.
//   data-delay="0.2"                    Optional extra wait, in seconds.
//   data-stagger + data-reveal-child    Children rise in one after another.
//   data-parallax="0.03"                The frame's photo drifts inside it.
//   data-drift="24"                     The element drifts up to 24px as you scroll.
//   data-hero-root                      The opening sequence at the top of the page.
//
// The starting states live in src/styles/global.css. With reduced motion, or if
// this script never runs, those states don't apply and everything simply shows.
import { gsap, ScrollTrigger } from '../lib/gsap';
import { allowsParallax, dur, ease, prefersReducedMotion, rise, step } from '../lib/motion';

declare global {
  interface Window {
    __ccMotion?: boolean;
  }
}

const root = document.documentElement;

/** Runs one effect. If it fails, everything is shown rather than left hidden. */
function safely(effect: () => void) {
  try {
    effect();
  } catch (error) {
    console.error(error);
    root.classList.add('motion-off');
  }
}

/** Plays once, when the element's top comes into the lower part of the screen
 *  (or straight away if the page opens already scrolled past it). */
function onceInView(el: Element, play: () => void) {
  ScrollTrigger.create({ trigger: el, start: 'top 92%', end: 'max', once: true, onEnter: play });
}

function riseIn(el: Element, delay = 0) {
  gsap.fromTo(el, { opacity: 0, y: rise }, { opacity: 1, y: 0, duration: dur.base, delay, ease: ease.pour });
}

function playReveal(el: HTMLElement) {
  const delay = Number(el.dataset.delay ?? 0);

  switch (el.dataset.reveal) {
    case 'fade':
      gsap.fromTo(el, { opacity: 0 }, { opacity: 1, duration: dur.base, delay, ease: ease.steam });
      break;

    // Light through a window: the frame opens upwards while the photo settles inside it
    case 'mask': {
      gsap.fromTo(
        el,
        { clipPath: 'inset(100% 0% 0% 0%)' },
        { clipPath: 'inset(0% 0% 0% 0%)', duration: dur.slow, delay, ease: ease.pour },
      );
      const photo = el.querySelector('.photo');
      if (photo) gsap.fromTo(photo, { scale: 1.08 }, { scale: 1, duration: dur.slow + 0.4, delay, ease: ease.pour });
      break;
    }

    // A sentence said slowly, with a small pause before the italic close
    case 'words': {
      let pause = 0;
      el.querySelectorAll<HTMLElement>('.w').forEach((word, i) => {
        if (!pause && word.closest('em')) pause = 0.3;
        gsap.fromTo(
          word,
          { opacity: 0, y: 6 },
          { opacity: 1, y: 0, duration: dur.base, delay: delay + i * step.word + pause, ease: ease.pour },
        );
      });
      break;
    }

    default:
      riseIn(el, delay);
  }
}

function setUpReveals() {
  document.querySelectorAll<HTMLElement>('[data-reveal]').forEach((el) => {
    // A fully clipped mask has no visible area to measure. Watch its parent instead.
    const watch = el.dataset.reveal === 'mask' ? (el.parentElement ?? el) : el;
    onceInView(watch, () => safely(() => playReveal(el)));
  });

  document.querySelectorAll<HTMLElement>('[data-stagger]').forEach((group) => {
    onceInView(group, () =>
      safely(() => {
        group.querySelectorAll('[data-reveal-child]').forEach((child, i) => riseIn(child, i * step.item));
      }),
    );
  });
}

function playHero() {
  const hero = document.querySelector<HTMLElement>('[data-hero-root]');
  if (!hero) return;

  // Begin as the welcome screen starts to lift, or straight away
  const start = root.classList.contains('preload') ? 0.65 : 0.1;

  hero.querySelectorAll('[data-hero="line"]').forEach((line, i) => {
    // y: 0 stops GSAP from reading the CSS starting offset as an extra pixel shift
    gsap.fromTo(line, { y: 0, yPercent: 105 }, { yPercent: 0, duration: dur.slow, delay: start + i * step.line, ease: ease.pour });
  });

  hero.querySelectorAll<HTMLElement>('[data-hero="fade"]').forEach((el) => {
    riseIn(el, start + Number(el.dataset.delay ?? 0));
  });

  hero.querySelectorAll('[data-hero="aside"] > *').forEach((el, i) => {
    riseIn(el, start + 0.7 + i * step.line);
  });

  // The photo settles slowly, like morning light on a table. Opacity is left
  // alone so it still counts as painted straight away.
  const photo = hero.querySelector<HTMLElement>('[data-hero="media"] .photo');
  if (!photo) return;

  const drift = allowsParallax() ? 0.02 : 0;
  // Enough extra scale that the drift never shows an edge (matches global.css)
  const base = drift ? 1.045 : 1;
  gsap.fromTo(
    photo,
    { scale: base + 0.06 },
    { scale: base, duration: dur.drift, delay: Math.max(0, start - 0.4), ease: ease.pour },
  );

  if (drift) {
    gsap.to(photo, {
      yPercent: drift * 100,
      ease: 'none',
      scrollTrigger: { trigger: hero, start: 'top top', end: 'bottom top', scrub: true },
    });
  }
}

function setUpParallax() {
  // A photo drifts gently inside its frame while its section passes by
  document.querySelectorAll<HTMLElement>('[data-parallax]').forEach((frame) => {
    const photo = frame.querySelector<HTMLElement>('.photo');
    if (!photo) return;
    const amount = (Number(frame.dataset.parallax) || 0.03) * 100;
    gsap.set(photo, { scale: 1 + (amount / 100) * 2 + 0.005 });
    gsap.fromTo(
      photo,
      { yPercent: -amount },
      {
        yPercent: amount,
        ease: 'none',
        scrollTrigger: { trigger: frame.closest('section') ?? frame, start: 'top bottom', end: 'bottom top', scrub: true },
      },
    );
  });

  // An element floats a few pixels against the scroll, like the middle gallery column.
  // It uses the separate CSS `translate` property so it never fights the reveal's transform.
  document.querySelectorAll<HTMLElement>('[data-drift]').forEach((el) => {
    const distance = Number(el.dataset.drift) || 24;
    ScrollTrigger.create({
      trigger: el.closest('section') ?? el,
      start: 'top bottom',
      end: 'bottom top',
      onUpdate: ({ progress }) => {
        el.style.translate = `0 ${((1 - progress * 2) * distance).toFixed(2)}px`;
      },
    });
  });
}

function init() {
  window.__ccMotion = true;

  // Too late (the fallback timer already showed everything) or not wanted
  if (root.classList.contains('motion-off') || prefersReducedMotion()) return;

  safely(playHero);
  safely(setUpReveals);
  if (allowsParallax()) safely(setUpParallax);

  // The welcome screen has faded by now. Tidy it away.
  if (root.classList.contains('preload')) {
    setTimeout(() => root.classList.remove('preload'), 1400);
  }
}

init();
