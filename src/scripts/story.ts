// "Bean to cup": the illustrated story, played by the scroll position.
// Everything runs backwards when scrolling up.
//
//   Stage 1  Hero: two beans rest beside the name.
//   Journey  The same two beans let go, fall into the page's right-hand margin
//            and drift there while the next section passes, then glide over to
//            the grinder as its chapter arrives.
//   Stage 2  The grinder draws itself in, with the statement beside it, word by
//            word; the beans drop into the hopper. At the rim they hand over,
//            unseen, to identical beans drawn inside the grinder.
//   Stage 3  The crank turns; the beans sink, crack into pieces and vanish down
//            the throat; grounds fall behind the drawer windows and pile up;
//            the drawer slides out.
//   Stage 4  The camera eases left to a portafilter on the counter; the drawer
//            tips and pours its grounds into the basket; the camera travels on
//            to the espresso machine as it draws itself in, carrying the
//            portafilter, which rises into the group head and twists to lock.
//   Stage 5  A cup slides under the spout; the gauge needle rises; two fine
//            streams fill the cup and the crema forms. The ending: the camera
//            moves in on the finished cup as steam rises, and the statement
//            gives way to an invitation, with links on into the page.
//
// How it works: one smoothed "story clock" follows the scroll position, and every
// pose is a pure function of it. So everything stays in step, and scrolling back
// simply plays it in reverse. Runs only with the `story` class (set in
// Base.astro; never with reduced motion).
import { gsap, ScrollTrigger } from '../lib/gsap';

const root = document.documentElement;

const clamp01 = gsap.utils.clamp(0, 1);
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
/** Progress (0 to 1) of `s` through the range a to b. */
const span = (s: number, a: number, b: number) => clamp01((s - a) / (b - a || 1));
const ease = {
  sine: gsap.parseEase('sine.inOut'),
  fall: gsap.parseEase('power2.inOut'),
  drop: gsap.parseEase('power2.in'),
  settle: gsap.parseEase('power2.out'),
};
const fixed = (n: number) => n.toFixed(2);

/** How far (in the grinder drawing's units) the beans are lifted when they hand over. */
const LIFT = 34;

/**
 * The chapter's timeline while its stage is on screen, in screen-heights of
 * scrolling after the stage reaches the top. Must fit within --brew-scroll in
 * BrewChapter.astro.
 */
const T = {
  // Stage 2: into the hopper
  landed: 0.4, // the beans reach the hopper's rim
  settled: 0.5, // and have settled into the bowl
  // Stage 3: grinding
  grindFrom: 0.52, // the crank starts to turn
  crack: 0.72, // the beans crack
  split: 0.79, // their pieces have sprung apart
  gone: 1.05, // and have vanished down the throat
  powderFrom: 0.76, // grounds start falling into the drawer
  grindTo: 1.3, // the crank stops
  powderTo: 1.34, // the last grounds land
  drawerFrom: 1.36, // the drawer slides out
  drawerTo: 1.52,
  // Stage 4: into the portafilter, and into the machine
  panFrom: 1.52, // the camera eases left to the portafilter on the counter
  panTo: 1.68,
  tipFrom: 1.6, // the drawer lifts and tips
  tipTo: 1.74,
  pourFrom: 1.66, // its grounds pour into the basket
  pourTo: 1.92,
  travelFrom: 1.96, // the camera travels on to the machine, carrying the portafilter
  travelTo: 2.3,
  machineFrom: 2.04, // the machine draws itself in
  machineTo: 2.28,
  lockFrom: 2.3, // the portafilter rises into the group head and twists to lock
  lockTo: 2.44,
  // Stage 5: the pour, and the ending
  cupFrom: 2.44, // the cup slides under the spout
  cupTo: 2.58,
  needleFrom: 2.54, // the gauge needle rises
  needleTo: 2.7,
  streamFrom: 2.62, // two fine streams of espresso
  fillFrom: 2.66, // fill the cup
  fillTo: 3.0,
  streamStop: 3.0, // and taper off
  cremaFrom: 2.94, // the crema forms
  cremaTo: 3.08,
  zoomFrom: 3.06, // the cup is served forward, out from under the spout, as the
  zoomTo: 3.26, // camera moves in on it and the machine fades back behind it
  steamFrom: 3.12, // steam rises
  steamTo: 3.26,
  inviteFrom: 3.14, // and the statement gives way to the invitation
  inviteTo: 3.32,
  // (then it holds until the chapter's 3.5 screens are scrolled)
};
const CRANK_TURNS = 3;

// The scene's camera (in drawing units): first a little way left to the
// portafilter, then on to the machine
const CAM_PORTAFILTER = -70;
const CAM_MACHINE = -460;
// The portafilter: on the counter, just below the group head, and locked in
const PF_START = { x: -16, y: 352 };
const PF_LOCKED = { x: -310, y: 252 };
const PF_LOCK_TWIST = -22;
// The ending: the cup is served forward along the tray, and the camera closes
// in on it (drawing units)
const CUP_SERVE = 56;
const CUP_FOCUS = { x: -310 + CUP_SERVE, y: 298 }; // the served cup's middle
const CUP_VIEW = { x: 150, y: 235 }; // where it ends up in the frame
const CUP_ZOOM = 1.9;
const GHOST = 0.15; // how faint the machine becomes behind the finished cup
// The gauge needle: resting, and at full pressure (degrees)
const NEEDLE_REST = -120;
const NEEDLE_FULL = 35;

interface HopperBean {
  el: SVGGElement;
  cx: number;
  cy: number;
  rot: number;
  w: number;
  // measured: centre relative to the stage, rendered width, lift in px
  relX: number;
  relY: number;
  size: number;
  lift: number;
}

interface Shard {
  el: SVGGElement;
  bean: number;
  k: number; // 0 top, 1 middle, 2 bottom
  cx: number;
  cy: number;
}

interface Grain {
  el: SVGCircleElement;
  i: number;
  x: number;
  p: number;
  v: number;
}

interface Courier {
  el: HTMLElement;
  hopper: HopperBean;
  spin: 1 | -1;
  phase: number;
  laneOffset: { x: number; y: number };
  fallTurn: number;
  // measured
  base: number; // the drawing's own resting tilt (CSS rotate)
  homeX: number; // centre at rest, page coordinates
  homeY: number;
  width: number;
  landTurn: number;
}

const SVG_NS = 'http://www.w3.org/2000/svg';
function svgEl<K extends keyof SVGElementTagNameMap>(tag: K, attrs: Record<string, string | number> = {}) {
  const el = document.createElementNS(SVG_NS, tag);
  for (const [name, value] of Object.entries(attrs)) el.setAttribute(name, String(value));
  return el;
}

// Two jagged breaks across a bean (in its own 60x80 drawing), and the three
// pieces they make, each with the height of its centre from the bean's centre
const BREAK_A = '-2,28 12,31 24,26 36,33 44,27 62,30';
const BREAK_B = '-2,52 10,56 22,51 34,57 46,50 62,54';
const PIECES = [
  { shape: '-2,-2 62,-2 62,30 44,27 36,33 24,26 12,31 -2,28', breaks: [BREAK_A], centre: -27 },
  { shape: '-2,28 12,31 24,26 36,33 44,27 62,30 62,54 46,50 34,57 22,51 10,56 -2,52', breaks: [BREAK_A, BREAK_B], centre: 1 },
  { shape: '-2,52 10,56 22,51 34,57 46,50 62,54 62,82 -2,82', breaks: [BREAK_B], centre: 26 },
];

/**
 * Cracks each hopper bean into three pieces: copies of the very same drawing,
 * each clipped to one jagged third with its broken edges inked. Made here rather
 * than in the page, because only the story ever shows them.
 */
function buildShards(grinder: SVGSVGElement, hopperBeans: HopperBean[]) {
  const slot = grinder.querySelector('[data-slot="shards"]');
  const groups: SVGGElement[] = [];
  const shards: Shard[] = [];

  hopperBeans.forEach((h, bean) => {
    const group = svgEl('g', { 'data-shards': '' });
    group.style.opacity = '0';
    const angle = (h.rot * Math.PI) / 180;

    PIECES.forEach((piece, k) => {
      const copy = h.el.firstElementChild!.cloneNode(true) as SVGGElement;
      const drawing = copy.querySelector('svg')!;
      const defs = drawing.querySelector('defs')!;
      const outlineClip = defs.querySelector('clipPath')!.id;
      const id = `shard-${bean}-${k}`;
      const clip = svgEl('clipPath', { id });
      clip.append(svgEl('polygon', { points: piece.shape }));
      defs.append(clip);
      drawing.querySelector('.body')!.setAttribute('clip-path', `url(#${id})`);
      const edges = svgEl('g', { 'clip-path': `url(#${outlineClip})` });
      piece.breaks.forEach((points) => edges.append(svgEl('polyline', { class: 'o', points })));
      drawing.append(edges);

      const el = svgEl('g');
      el.append(copy);
      group.append(el);
      const offset = (piece.centre * h.w) / 60;
      shards.push({ el, bean, k, cx: h.cx - Math.sin(angle) * offset, cy: h.cy + Math.cos(angle) * offset });
    });

    slot?.append(group);
    groups.push(group);
  });

  return { groups, shards };
}

/**
 * Ground coffee falling behind the drawer's two windows: a fixed, seeded scatter,
 * so every visit looks the same and scrolling back plays it exactly in reverse.
 */
function buildGrains(grinder: SVGSVGElement): Grain[] {
  const slot = grinder.querySelector('[data-slot="grains"]');
  const windows = [
    { x: 90, w: 34 },
    { x: 156, w: 34 },
  ];
  let seed = 11;
  const rand = () => (seed = (seed * 16807) % 2147483647) / 2147483647;

  return Array.from({ length: 40 }, (_, j) => {
    const win = windows[j % 2];
    const x = win.x + 3 + rand() * (win.w - 6);
    const r = 0.55 + rand() * 0.6;
    const p = rand();
    const v = 0.8 + rand() * 1.2;
    const el = svgEl('circle', {
      'data-grain': '',
      cx: x.toFixed(1),
      cy: 300,
      r: r.toFixed(2),
      fill: rand() < 0.55 ? '#2b1d13' : '#70441d',
      opacity: 0,
    });
    slot?.append(el);
    return { el, i: Math.floor(j / 2), x, p, v };
  });
}

interface PourGrain {
  el: SVGCircleElement;
  i: number;
  p: number;
  v: number;
  jitter: number;
}

/** Grounds pouring from the tipped drawer into the basket: a seeded stream. */
function buildPour(grinder: SVGSVGElement): PourGrain[] {
  const slot = grinder.querySelector('[data-slot="pour"]');
  let seed = 23;
  const rand = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
  return Array.from({ length: 18 }, (_, i) => {
    const el = svgEl('circle', {
      'data-pour': '',
      cx: 0,
      cy: 0,
      r: (0.6 + rand() * 0.6).toFixed(2),
      fill: rand() < 0.55 ? '#2b1d13' : '#70441d',
      opacity: 0,
    });
    slot?.append(el);
    return { el, i, p: rand(), v: 0.9 + rand() * 0.6, jitter: (rand() - 0.5) * 4 };
  });
}

function setUp() {
  const hero = document.querySelector<HTMLElement>('[data-hero-root]');
  const beansWrap = hero?.querySelector<HTMLElement>('.hero-beans');
  const brew = document.querySelector<HTMLElement>('[data-brew]');
  const stage = brew?.querySelector<HTMLElement>('[data-brew-stage]');
  const grinder = brew?.querySelector<SVGSVGElement>('svg.grinder');
  if (!hero || !beansWrap || !brew || !stage || !grinder) return;

  const all = <T extends Element>(selector: string, scope: ParentNode = grinder) => [...scope.querySelectorAll<T>(selector)];


  const heroBeans = [...beansWrap.querySelectorAll<HTMLElement>('[data-story-bean]')];
  const hopperBeans: HopperBean[] = all<SVGGElement>('[data-hopper-bean]').map((el) => ({
    el,
    cx: Number(el.dataset.cx),
    cy: Number(el.dataset.cy),
    rot: Number(el.dataset.rot),
    w: Number(el.dataset.w),
    relX: 0,
    relY: 0,
    size: 0,
    lift: 0,
  }));
  if (heroBeans.length !== 2 || hopperBeans.length !== 2) return;

  const couriers: Courier[] = heroBeans.map((el, i) => ({
    el,
    hopper: hopperBeans[i],
    spin: i === 0 ? 1 : -1,
    phase: i === 0 ? 0.3 : 2.1,
    laneOffset: i === 0 ? { x: -6, y: 0.4 } : { x: 7, y: 0.54 },
    fallTurn: i === 0 ? 150 : -120,
    base: 0,
    homeX: 0,
    homeY: 0,
    width: 0,
    landTurn: 0,
  }));

  // The grinder's moving parts
  const reveal = grinder.querySelector<SVGRectElement>('[data-grinder-reveal]');
  const shades = all<SVGGElement>('[data-grinder-shade]');
  const { groups: shardGroups, shards } = buildShards(grinder, hopperBeans);
  const grains = buildGrains(grinder);
  const heap = grinder.querySelector<SVGGElement>('[data-heap]');
  const crank = grinder.querySelector<SVGGElement>('[data-crank]');
  const spindle = grinder.querySelector<SVGGElement>('[data-spindle]');
  const hubCap = crank?.nextElementSibling; // the crank's usual place: just before the hub cap
  const armFill = grinder.querySelector<SVGPathElement>('[data-arm-fill]');
  const armTop = grinder.querySelector<SVGPathElement>('[data-arm-top]');
  const armBottom = grinder.querySelector<SVGPathElement>('[data-arm-bottom]');
  const knob = grinder.querySelector<SVGGElement>('[data-knob]');
  const drawer = grinder.querySelector<SVGGElement>('[data-drawer]');
  const drawerSides = all<SVGPolygonElement>('[data-drawer-side]');
  const drawerTops = all<SVGPolygonElement>('[data-drawer-top]');

  // Stage 4: the camera, the pour, the portafilter and the machine
  const world = grinder.querySelector<SVGGElement>('[data-world]');
  const grinderBody = grinder.querySelector<SVGGElement>('[data-grinder-body]');
  const pour = buildPour(grinder);
  const portafilter = grinder.querySelector<SVGGElement>('[data-portafilter]');
  const grounds = grinder.querySelector<SVGGElement>('[data-grounds]');
  const machineReveal = grinder.querySelector<SVGRectElement>('[data-machine-reveal]');
  const machineShades = all<SVGGElement>('[data-machine-shade]');

  // Stage 5: the cup, the gauge, the streams; the steam and the invitation
  const cup = grinder.querySelector<SVGGElement>('[data-cup]');
  const coffee = grinder.querySelector<SVGGElement>('[data-cup-coffee]');
  const liquid = grinder.querySelector<SVGEllipseElement>('[data-cup-liquid]');
  const crema = grinder.querySelector<SVGGElement>('[data-cup-crema]');
  const steam = grinder.querySelector<SVGGElement>('[data-cup-steam]');
  const needle = grinder.querySelector<SVGGElement>('[data-needle]');
  const backdrop = [...all<SVGGElement>('[data-machine-part]'), ...(portafilter ? [portafilter] : [])];
  const streams = all<SVGLineElement>('[data-stream]');
  const say = brew.querySelector<HTMLElement>('[data-brew-say]');
  const invite = brew.querySelector<HTMLElement>('[data-brew-invite]');

  // The statement beside the drawing
  const words = [...brew.querySelectorAll<HTMLElement>('[data-brew-word]')];
  const fades = [...brew.querySelectorAll<HTMLElement>('[data-brew-fade]')];

  // Geometry, re-measured whenever the layout changes
  let vh = 0;
  let phone = false;
  let laneX = 0;
  let stageLeft = 0;
  let chapterTop = 0;
  let stuckFor = 0;
  // Key scroll positions
  let letGo = 0; // the beans leave the name
  let inLane = 0; // they've fallen into the margin
  let glide = 0; // they start over towards the grinder
  let stuck = 0; // the chapter's stage reaches the top of the screen
  let landed = 0; // the beans reach the hopper's rim
  let drawFrom = 0;
  let drawTo = 0;

  function measure() {
    vh = window.innerHeight;
    phone = window.matchMedia('(max-width: 767.98px)').matches;
    const vw = root.clientWidth;
    const y = window.scrollY;

    // Where each bean rests beside the name, ignoring any motion in progress
    const wrapShift = Number(gsap.getProperty(beansWrap, 'y')) || 0;
    couriers.forEach((c) => {
      gsap.set(c.el, { clearProps: 'transform,opacity' });
      const r = c.el.getBoundingClientRect();
      c.homeX = r.left + r.width / 2;
      c.homeY = r.top + r.height / 2 + y - wrapShift;
      c.width = r.width;
      c.base = parseFloat(getComputedStyle(c.el.querySelector('svg')!).rotate) || 0;
    });

    // The lane: the page's right-hand margin, or the very edge on narrow screens
    const heroBox = hero!.getBoundingClientRect();
    const contentRight = heroBox.right - parseFloat(getComputedStyle(hero!).paddingRight);
    const margin = vw - contentRight;
    const beanW = couriers[0].width;
    laneX = margin >= beanW + 16 ? contentRight + margin / 2 : vw - beanW / 2 - 4;

    // The chapter, and where the hopper beans sit on its stage
    const brewBox = brew!.getBoundingClientRect();
    const stageBox = stage!.getBoundingClientRect();
    chapterTop = brewBox.top + y;
    stuckFor = brew!.offsetHeight - stage!.offsetHeight;
    stageLeft = stageBox.left;
    const ctm = grinder!.getScreenCTM();
    if (!ctm) return;
    hopperBeans.forEach((h) => {
      const p = new DOMPoint(h.cx, h.cy).matrixTransform(ctm);
      h.relX = p.x - stageBox.left;
      h.relY = p.y - stageBox.top;
      h.size = h.w * ctm.a;
      h.lift = LIFT * ctm.a;
    });

    letGo = 0.1 * vh;
    inLane = letGo + 0.55 * vh;
    stuck = chapterTop;
    glide = Math.max(inLane + 0.15 * vh, stuck - 1.0 * vh);
    drawFrom = stuck - 0.8 * vh;
    drawTo = stuck - 0.05 * vh;
    landed = at(T.landed);

    // The final turn must leave each bean at the hopper bean's angle,
    // still spinning the way it was going
    couriers.forEach((c) => {
      const atGlide = drift(c, glide).r;
      const target = c.hopper.rot - c.base;
      c.landTurn =
        c.spin > 0
          ? target + 360 * Math.ceil((atGlide + 60 - target) / 360)
          : target + 360 * Math.floor((atGlide - 60 - target) / 360);
    });
  }

  /** The scroll position of a point on the chapter's timeline. */
  function at(screens: number) {
    return stuck + screens * vh;
  }

  /** The stage's top edge on screen at scroll position `y`. */
  function stageTop(y: number) {
    if (y < stuck) return stuck - y;
    if (y <= stuck + stuckFor) return 0;
    return stuck + stuckFor - y;
  }

  function laneSpot(c: Courier) {
    return { x: laneX + c.laneOffset.x, y: c.laneOffset.y * vh };
  }

  /** A bean drifting in the margin: a slow sway, a gentle bob, a lazy turn. */
  function drift(c: Courier, s: number) {
    const d = Math.max(0, s - inLane);
    const lane = laneSpot(c);
    const sway = phone ? 4 : 10;
    const bob = phone ? 8 : 14;
    const wave = (period: number) => Math.sin((d / (period * vh)) * Math.PI * 2 + c.phase) - Math.sin(c.phase);
    return {
      x: lane.x + wave(0.8) * sway,
      y: lane.y + wave(1.3) * bob,
      r: c.fallTurn + d * 0.03 * c.spin,
    };
  }

  /** Where a travelling bean is on screen (centre), its turn and size, at story time `s`. */
  function pose(c: Courier, s: number, y: number) {
    const h = c.hopper;
    const landScale = h.size / c.width;

    if (s <= letGo) return { x: c.homeX, y: c.homeY - s, r: 0, scale: 1, shown: true };

    if (s <= inLane) {
      const t = span(s, letGo, inLane);
      const lane = laneSpot(c);
      return {
        x: lerp(c.homeX, lane.x, ease.sine(t)),
        y: lerp(c.homeY - letGo, lane.y, ease.fall(t)),
        r: lerp(0, c.fallTurn, ease.fall(t)),
        scale: 1,
        shown: true,
      };
    }

    if (s <= glide) return { ...drift(c, s), scale: 1, shown: true };

    // Above the hopper, then down onto its rim, tracking the stage as it arrives
    const top = stageTop(y);
    const rim = { x: stageLeft + h.relX, y: top + h.relY - h.lift };
    const hover = { x: rim.x + c.spin * -14, y: rim.y - 0.2 * vh };
    const from = drift(c, glide);
    const midTurn = lerp(from.r, c.landTurn, 0.55);
    const midScale = lerp(1, landScale, 0.5);

    if (s <= stuck) {
      const t = ease.sine(span(s, glide, stuck));
      return { x: lerp(from.x, hover.x, t), y: lerp(from.y, hover.y, t), r: lerp(from.r, midTurn, t), scale: lerp(1, midScale, t), shown: true };
    }

    if (s < landed) {
      const t = span(s, stuck, landed);
      return {
        x: lerp(hover.x, rim.x, ease.sine(t)),
        y: lerp(hover.y, rim.y, ease.drop(t)),
        r: lerp(midTurn, c.landTurn, ease.settle(t)),
        scale: lerp(midScale, landScale, t),
        shown: true,
      };
    }

    // Handed over to the bean in the drawing
    return { x: rim.x, y: rim.y, r: c.landTurn, scale: landScale, shown: false };
  }

  /** The crank: its arm swings round the spindle, foreshortened as it circles. */
  function drawCrank(angle: number) {
    const hub = { x: 152, y: 64 };
    const end = { x: hub.x + 62 * Math.cos(angle), y: 64.75 + 14 * Math.sin(angle) };
    const along = (t: number) => ({ x: lerp(hub.x, end.x, t), y: lerp(hub.y, end.y, t) });
    const c1 = along(0.37);
    const c2 = along(0.7);
    const edge = (o: number) =>
      `M${fixed(hub.x)} ${fixed(hub.y + o)}C${fixed(c1.x)} ${fixed(c1.y + o - 2.3)} ${fixed(c2.x)} ${fixed(c2.y + o + 3.3)} ${fixed(end.x)} ${fixed(end.y + o * 0.9)}`;
    const topEdge = edge(-2.5);
    armTop?.setAttribute('d', topEdge);
    armBottom?.setAttribute('d', edge(2.5));
    armFill?.setAttribute(
      'd',
      `${topEdge}L${fixed(end.x)} ${fixed(end.y + 2.25)}C${fixed(c2.x)} ${fixed(c2.y + 2.5 + 3.3)} ${fixed(c1.x)} ${fixed(c1.y + 2.5 - 2.3)} ${fixed(hub.x)} ${fixed(hub.y + 2.5)}Z`,
    );
    knob?.setAttribute('transform', `translate(${fixed(end.x - 214)} ${fixed(end.y - 64.75)})`);

    // On the far side of its circle, the arm passes behind the spindle
    const behind = Math.sin(angle) < 0;
    if (crank && spindle && hubCap) {
      if (behind && crank.nextElementSibling !== spindle) spindle.before(crank);
      if (!behind && crank.nextElementSibling !== hubCap) hubCap.before(crank);
    }
  }

  function render(s: number) {
    const y = window.scrollY;
    const rel = (s - stuck) / vh; // screens since the stage reached the top

    beansWrap!.classList.toggle('is-travelling', s > letGo * 0.5);

    // Turning the crank
    const turn = ease.sine(span(rel, T.grindFrom, T.grindTo));
    const angle = turn * CRANK_TURNS * Math.PI * 2;
    drawCrank(angle);

    // The beans: hand-over from the travelling beans, settling into the bowl,
    // jiggling and sinking as the crank turns, until they crack
    const sink = ease.sine(span(rel, T.grindFrom, T.crack));
    const jiggle = Math.sin(angle * 2) * 4 * sink * (1 - span(rel, T.crack - 0.05, T.crack));
    const shrink = 1 - 0.12 * sink;

    couriers.forEach((c, i) => {
      const p = pose(c, s, y);
      gsap.set(c.el, {
        x: p.x - c.homeX,
        y: p.y - (c.homeY - y),
        rotation: p.r,
        scale: p.scale,
        opacity: p.shown ? 1 : 0,
      });

      const h = c.hopper;
      const settle = ease.settle(span(rel, T.landed, T.settled));
      const dy = -LIFT * (1 - settle) + 7 * sink;
      h.el.style.opacity = s >= landed && rel < T.crack ? '1' : '0';
      h.el.setAttribute(
        'transform',
        `translate(0 ${fixed(dy)}) translate(${h.cx} ${h.cy}) rotate(${fixed(jiggle * c.spin)}) scale(${fixed(shrink)}) translate(${-h.cx} ${-h.cy})`,
      );
      shardGroups[i].style.opacity = rel >= T.crack && rel < T.gone ? String(1 - span(rel, T.gone - 0.12, T.gone)) : '0';
    });

    // The pieces spring apart, tumble, and vanish down the throat
    const split = ease.settle(span(rel, T.crack, T.split));
    const fall = ease.sine(span(rel, T.crack + 0.04, T.gone));
    shards.forEach((p) => {
      const h = hopperBeans[p.bean];
      const side = p.bean === 0 ? -1 : 1;
      const a = (h.rot * Math.PI) / 180;
      const apart = (p.k - 1) * 5;
      // Where the piece was when the whole bean cracked (shrunk and sunk with it)
      const startX = h.cx + shrink * (p.cx - h.cx) - Math.sin(a) * apart * split + side * 2 * split;
      const startY = h.cy + shrink * (p.cy - h.cy) + 7 + Math.cos(a) * apart * split;
      const throat = { x: 152 + side * (3 + p.k * 2), y: 126 };
      const x = lerp(startX, throat.x, fall);
      const yy = lerp(startY, throat.y, fall);
      const rotation = (p.k - 1) * 28 * split + side * 140 * fall;
      const scale = shrink * (1 - 0.65 * fall);
      p.el.setAttribute(
        'transform',
        `translate(${fixed(x)} ${fixed(yy)}) rotate(${fixed(rotation)}) scale(${fixed(scale)}) translate(${-p.cx} ${-p.cy})`,
      );
    });

    // Grounds fall behind the drawer windows and pile up
    const grind = span(rel, T.powderFrom, T.powderTo);
    const flow = Math.min(span(rel, T.powderFrom, T.powderFrom + 0.06), 1 - span(rel, T.powderTo - 0.08, T.powderTo));
    const pile = ease.sine(span(rel, T.powderFrom + 0.05, T.powderTo));
    heap?.setAttribute('transform', `translate(0 ${fixed(36 * (1 - pile))})`);
    const surface = 346 - 20 * pile;
    grains.forEach((g) => {
      const shown = !phone || g.i < 7;
      const cycle = (g.p + g.v * grind * 6) % 1;
      g.el.setAttribute('cy', fixed(306 + cycle * (surface - 306)));
      g.el.setAttribute('opacity', shown ? fixed(flow * 0.9) : '0');
    });

    // The drawer slides out towards you, showing its side and its top full of
    // grounds; then lifts and tips (about its front bottom-left corner) to pour
    const out = ease.sine(span(rel, T.drawerFrom, T.drawerTo));
    const dx = 30 * out;
    const dy = 22 * out;
    const tip = ease.sine(span(rel, T.tipFrom, T.tipTo));
    const tilt = -35 * tip;
    const lift = 10 * tip;
    drawer?.setAttribute('transform', `translate(${fixed(-dx)} ${fixed(dy - lift)}) rotate(${fixed(tilt)} 78 356)`);
    const sidePoints = `202,300 ${fixed(202 + dx)},${fixed(300 - dy)} ${fixed(202 + dx)},${fixed(356 - dy)} 202,356`;
    const topPoints = `78,300 202,300 ${fixed(202 + dx)},${fixed(300 - dy)} ${fixed(78 + dx)},${fixed(300 - dy)}`;
    drawerSides.forEach((el) => el.setAttribute('points', sidePoints));
    drawerTops.forEach((el) => el.setAttribute('points', topPoints));

    // Stage 4. The camera: a little way left to the portafilter, then on to the machine
    const toPortafilter = ease.sine(span(rel, T.panFrom, T.panTo));
    const travel = ease.sine(span(rel, T.travelFrom, T.travelTo));
    const cam = CAM_PORTAFILTER * toPortafilter + (CAM_MACHINE - CAM_PORTAFILTER) * travel;
    // ...and, at the very end, in close on the finished cup
    const closeIn = ease.sine(span(rel, T.zoomFrom, T.zoomTo));
    const zoom = lerp(1, CUP_ZOOM, closeIn);
    const anchorX = lerp(CUP_FOCUS.x - cam, CUP_VIEW.x, closeIn);
    const anchorY = lerp(CUP_FOCUS.y, CUP_VIEW.y, closeIn);
    world?.setAttribute(
      'transform',
      `translate(${fixed(anchorX - zoom * CUP_FOCUS.x)} ${fixed(anchorY - zoom * CUP_FOCUS.y)}) scale(${zoom.toFixed(3)})`,
    );
    if (grinderBody) grinderBody.style.opacity = fixed(1 - span(rel, T.travelFrom, T.travelFrom + 0.18));

    // Grounds pour from the drawer's tipped lip, in an arc, into the basket
    const a = (tilt * Math.PI) / 180;
    const lip = { x: 78 + 56 * Math.sin(a) - dx, y: 356 - 56 * Math.cos(a) + dy - lift };
    const basket = { x: PF_START.x + 2, y: PF_START.y - 2 };
    const bend = { x: lip.x - 20, y: lip.y + 2 };
    const pouring = span(rel, T.pourFrom, T.pourTo);
    const stream = Math.min(span(rel, T.pourFrom, T.pourFrom + 0.04), 1 - span(rel, T.pourTo - 0.05, T.pourTo));
    pour.forEach((g) => {
      const u = (g.p + g.v * pouring * 4) % 1;
      const w = 1 - u;
      const x = w * w * lip.x + 2 * w * u * bend.x + u * u * basket.x + g.jitter * u;
      const y = w * w * lip.y + 2 * w * u * bend.y + u * u * basket.y;
      const shown = !phone || g.i < 9;
      g.el.setAttribute('cx', fixed(x));
      g.el.setAttribute('cy', fixed(y));
      g.el.setAttribute('opacity', shown ? fixed(stream * 0.9 * (u > 0.9 ? (1 - u) / 0.1 : 1)) : '0');
    });
    grounds?.setAttribute('transform', `scale(1 ${fixed(ease.settle(span(rel, T.pourFrom + 0.04, T.pourTo)))})`);

    // The portafilter: carried in a gentle arc to just below the group head,
    // turned for the bayonet; then pushed up into it and twisted to lock
    const below = { x: PF_LOCKED.x, y: PF_LOCKED.y + 46 };
    let pfX = lerp(PF_START.x, below.x, travel);
    let pfY = lerp(PF_START.y, below.y, travel) - Math.sin(travel * Math.PI) * 30;
    let pfTurn = lerp(0, PF_LOCK_TWIST, travel);
    const lock = ease.settle(span(rel, T.lockFrom, T.lockTo));
    pfX = lerp(pfX, PF_LOCKED.x, lock);
    pfY = lerp(pfY, PF_LOCKED.y, lock);
    pfTurn = lerp(pfTurn, 0, lock);
    portafilter?.setAttribute('transform', `translate(${fixed(pfX)} ${fixed(pfY)}) rotate(${fixed(pfTurn)})`);

    // The machine draws itself in as the camera arrives, then its shading
    const machine = span(rel, T.machineFrom, T.machineTo);
    const machineLines = ease.sine(clamp01(machine / 0.75));
    machineReveal?.setAttribute('y', fixed(lerp(420, -20, machineLines)));
    machineReveal?.setAttribute('height', fixed(lerp(0, 440, machineLines)));
    const machineShade = fixed(span(machine, 0.5, 1));
    machineShades.forEach((g) => (g.style.opacity = machineShade));

    // Stage 5. The cup slides along the drip tray to sit under the spout;
    // at the end it's served forward, and the machine fades back behind it
    const cupIn = ease.settle(span(rel, T.cupFrom, T.cupTo));
    cup?.setAttribute('transform', `translate(${fixed(190 * (1 - cupIn) + CUP_SERVE * closeIn)} 0)`);
    const ghost = fixed(lerp(1, GHOST, closeIn));
    backdrop.forEach((g) => (g.style.opacity = ghost));

    // The gauge needle rises to brewing pressure, trembling a little as it pours
    const pressure = ease.sine(span(rel, T.needleFrom, T.needleTo));
    const brewing = span(rel, T.streamFrom, T.streamFrom + 0.04) * (1 - span(rel, T.streamStop - 0.04, T.streamStop));
    const tremble = Math.sin(rel * 260) * 1.5 * brewing;
    needle?.setAttribute('transform', `rotate(${fixed(lerp(NEEDLE_REST, NEEDLE_FULL, pressure) + tremble)} 94 176)`);

    // Two fine streams run down into the cup, then taper off from the top
    const runDown = ease.sine(span(rel, T.streamFrom, T.streamFrom + 0.06));
    const runOut = ease.sine(span(rel, T.streamStop - 0.06, T.streamStop));
    streams.forEach((line, i) => {
      const fromX = i === 0 ? 137.4 : 142.6;
      const toX = i === 0 ? 138.6 : 141.4;
      const lerpX = (t: number) => fixed(lerp(fromX, toX, t));
      line.setAttribute('x1', lerpX(runOut));
      line.setAttribute('y1', fixed(lerp(279.5, 298, runOut)));
      line.setAttribute('x2', lerpX(runDown));
      line.setAttribute('y2', fixed(lerp(279.5, 298, runDown)));
      line.setAttribute('opacity', runDown > 0 && runOut < 1 ? '1' : '0');
    });

    // The cup fills, and the crema forms on top
    const fill = ease.sine(span(rel, T.fillFrom, T.fillTo));
    if (coffee) coffee.style.opacity = rel >= T.fillFrom ? '1' : '0';
    liquid?.setAttribute('transform', `translate(0 ${fixed(14 * (1 - fill))})`);
    const foam = ease.settle(span(rel, T.cremaFrom, T.cremaTo));
    if (crema) {
      crema.style.opacity = fixed(foam);
      crema.setAttribute('transform', `translate(120 117.5) scale(${fixed(lerp(0.6, 1, foam))}) translate(-120 -117.5)`);
    }

    // Steam rises from the finished cup (it drifts on its own while it's on screen)
    const steaming = span(rel, T.steamFrom, T.steamTo);
    if (steam) steam.style.opacity = fixed(steaming);
    const onScreen = Math.abs(stageTop(y)) < vh;
    grinder!.classList.toggle('steaming', steaming > 0 && onScreen);

    // The statement gives way to the invitation
    const handover = span(rel, T.inviteFrom, T.inviteFrom + 0.08);
    const welcome = ease.settle(span(rel, T.inviteFrom + 0.06, T.inviteTo));
    if (say) say.style.opacity = fixed(1 - handover);
    if (invite) {
      invite.style.opacity = fixed(welcome);
      invite.style.visibility = welcome > 0.01 ? 'visible' : 'hidden';
      invite.style.transform = `translateY(${fixed((1 - welcome) * 10)}px)`;
    }

    // The grinder draws itself in from the bottom up as its chapter arrives,
    // then its shading; the statement beside it arrives word by word
    const draw = span(s, drawFrom, drawTo);
    const lines = ease.sine(clamp01(draw / 0.75));
    reveal?.setAttribute('y', String(lerp(420, -20, lines)));
    reveal?.setAttribute('height', String(lerp(0, 440, lines)));
    const shade = String(span(draw, 0.5, 1));
    shades.forEach((g) => (g.style.opacity = shade));

    const said = span(draw, 0.3, 1);
    words.forEach((word, i) => {
      const start = (i / words.length) * 0.7;
      const t = ease.settle(span(said, start, start + 0.3));
      word.style.opacity = fixed(t);
      word.style.transform = `translateY(${fixed((1 - t) * 6)}px)`;
    });
    fades.forEach((el, i) => {
      const t = i === 0 ? span(draw, 0.25, 0.6) : span(draw, 0.85, 1);
      el.style.opacity = fixed(t);
    });
  }

  // The story clock: follows the scroll, smoothed a little so movement feels poured
  const clock = { s: window.scrollY };
  const follow = gsap.quickTo(clock, 's', {
    duration: window.matchMedia('(max-width: 767.98px)').matches ? 0.4 : 0.6,
    ease: 'power3.out',
    onUpdate: () => render(clock.s),
  });

  window.addEventListener(
    'scroll',
    () => {
      follow(window.scrollY);
      render(clock.s);
    },
    { passive: true },
  );

  const remeasure = () => {
    measure();
    render(clock.s);
  };
  ScrollTrigger.addEventListener('refresh', remeasure);
  window.addEventListener('load', remeasure);
  remeasure();
}

function init() {
  if (!root.classList.contains('story') || root.classList.contains('motion-off')) return;

  // The beans just float on their own until you scroll, so the story can wait
  // until the page has painted (and the welcome screen has lifted) before doing
  // its measuring. Any scroll starts it at once.
  let started = false;
  const start = () => {
    if (started) return;
    started = true;
    window.removeEventListener('scroll', start);
    try {
      setUp();
    } catch (error) {
      console.error(error);
    }
  };
  window.addEventListener('scroll', start, { passive: true });

  const whenIdle = () =>
    'requestIdleCallback' in window ? window.requestIdleCallback(start, { timeout: 1000 }) : setTimeout(start, 200);
  const afterWelcome = root.classList.contains('preload') ? 1300 : 0;
  const afterLoad = () => setTimeout(whenIdle, afterWelcome);
  if (document.readyState === 'complete') afterLoad();
  else window.addEventListener('load', afterLoad, { once: true });
}

init();
