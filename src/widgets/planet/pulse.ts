/**
 * The click. One **flash** is one click, and it leaves two kinds of mark, born
 * together and dying apart: a **halo** — a pair of rings around the whole world,
 * facing the camera and *inverting* whatever they cross — and **sparks**,
 * landing at random points on the surface and lying in the terrain there.
 *
 * Nothing here is game state. The scene is told a click landed and never learns
 * what it bought, the same separation `orbit.ts` and `anchor.ts` keep.
 */

import type { SurfaceField } from './field';

/**
 * Slots per kind of mark. A click is transient rather than accumulated, so the
 * oldest slot is overwritten instead of the list growing — which is also why
 * nothing here has to be swept.
 */
export const PULSE_CAPACITY = 32;

/**
 * A ring is drawn on a quad whose *inscribed* circle is the ring's own radius,
 * so a stroke centred on that circle has its outer half cut off by the quad's
 * edge at the four cardinal points — the crop. Every ring quad is built this
 * much wider than the furthest thing on it, and its shader divides back out.
 */
export const STROKE_ROOM = 1.08;

export interface Mark {
  /** The pulse clock when it flashed. `-Infinity` is a slot never used. */
  born: number;
}

export interface Halo extends Mark {
  /**
   * Where this flash's echo starts its turn, in radians. Drawn once, so two
   * clicks in a row are not the same broken ring twice.
   */
  turn: number;
  /**
   * Its own draw against the lobe count, -1…1. The *draw* rather than the count
   * it produced: `echoScatter` scales it in the shader, so a slider moved while
   * a flash is still in the air moves that flash too.
   */
  scatter: number;
}

export interface Spark extends Mark {
  /** A unit direction in *object* space, so a flash sticks to the ground it hit. */
  x: number;
  y: number;
  z: number;
  /** The terrain's radius along it, sampled once — a flash outlives no slider. */
  r: number;
}

export interface PulseVisual {
  /**
   * Where the halo is born and where it has got to when it dies, in body radii.
   * Born outside the silhouette: a ring that starts on the world reads as a
   * band drawn on it rather than as something leaving it.
   */
  haloFrom: number;
  haloTo: number;
  /** Seconds from the flash to gone. */
  haloLife: number;
  /**
   * Its stroke, in px. A halo is a drawn edge — structure, not content — so it
   * is authored on screen and holds that weight at any radius, which is the
   * argument the outline and the contour already make.
   *
   * There is no `haloTone` beside it. The halo carries no ink at all: it
   * **inverts** what it passes over, so its colour is whatever was already
   * there, reversed — which is the one mark in the medium that cannot be wrong
   * against its background, and the reason the alpha-fade exception is gone.
   */
  haloWidth: number;

  /**
   * The halo's second ring, and the only one that is not a circle: its radius
   * is warped by an angular noise, so a flash leaves one clean edge and one
   * broken one. `echoWidth` 0 is the whole thing off.
   */
  echoWidth: number;
  /** Where it runs, as a multiple of the main ring's radius. 1 is on top of it. */
  echoScale: number;
  /** How far the warp pushes it, as a share of its own radius. */
  echoWarp: number;
  /** Lobes around the turn. Three sines off this, so it never closes on a rosette. */
  echoBands: number;
  /**
   * How far the lobe count wanders from flash to flash, as a share of itself.
   * The *count* and not the warp, because the quad is sized off the warp — a
   * scattered warp would have to reserve room for its own widest draw, where a
   * scattered count changes the rhythm and costs nothing. 0 is every echo alike.
   */
  echoScatter: number;
  /** How far it inverts, 0…1 — what makes it the subtler of the two. */
  echoDepth: number;

  /** How many sparks one flash makes. 0 leaves the halo on its own. */
  sparks: number;
  /** The flash's radius, in body radii — content, so sized like a soul. */
  sparkDot: number;
  /** How far its ring travels out, as a multiple of the dot. 1 is no travel. */
  sparkRing: number;
  /** The ring's stroke in px, on the halo's argument. */
  sparkWidth: number;
  sparkLife: number;

  /**
   * The flare: a cross of two quads standing on the dot along the surface
   * normal, tapered wider at the base, so a spark reads as a small cone struck
   * off the ground rather than as a sticker on it.
   *
   * Its height, in multiples of the dot's radius, at the flash and where it has
   * got to when it dies — the halo's `From`/`To` again, because a flare that
   * holds one height for its whole life reads as a decal, not as a strike. Both
   * at 0 is the flare off, and leaves the dot and its ring alone.
   *
   * The flare is the one part of a mark that is **not** drawn on the far side —
   * a cone struck away from the camera has no near-side reading — so it fades
   * out at the limb and `sparkBack` does not reach it.
   */
  sparkRiseFrom: number;
  sparkRiseTo: number;
  /**
   * The blade's base as a multiple of its top, over the same two moments. 1 is
   * a slab rather than a cone, so wide-to-narrow is a flame collapsing into a
   * spike and narrow-to-wide is one opening out.
   */
  sparkFlareFrom: number;
  sparkFlareTo: number;

  /**
   * What the *dot and its ring* keep on the far side of the body, 0…1. The
   * silhouette decides the ink; this decides how much of it, because a mark on
   * the back of the world sits inside the silhouette and would otherwise be
   * indistinguishable from one on the front. 1 is the far side as loud as the
   * near, 0 is the near half only — and it is the near half only for the flare
   * either way.
   */
  sparkBack: number;

  /**
   * The flash, and the ring around it — **over the body**. Off it both invert
   * to the far end of the ramp, so a spark that stands out past the silhouette
   * changes ink at exactly the place the harness and the souls already do.
   */
  sparkTone: number;
  sparkRingTone: number;

  /**
   * An outline around the mark, in pixels — a drawn edge, so it is authored on
   * screen like every other one and holds its weight at any world size. 0 is
   * off.
   *
   * It goes round the **whole mark at once**: the dot, the ring travelling out
   * of it and both blades are grown together and the border of what they cover
   * between them is what gets inked, so nothing is outlined against the inside
   * of anything else. Its ink is `sparkTone` flipped, on both sides of the
   * silhouette, which is why there is no tone beside it — an outline that could
   * be authored the same as its fill could be authored invisible.
   */
  sparkOutline: number;
}

/**
 * How far past its own radius a halo's quad has to reach: the echo's widest
 * warped radius, or the main ring's own 1, plus the room every stroke needs.
 * Read by the component to size the quad and by the shader to divide it back
 * out, so the two cannot drift.
 */
export function haloSpreadOf(visual: PulseVisual) {
  const echo = visual.echoWidth > 0 ? visual.echoScale * (1 + visual.echoWarp) : 0;

  return Math.max(1, echo) * STROKE_ROOM;
}


/**
 * How far through its life a mark is: 0 at the flash, 1 when it is gone. Past
 * 1 nothing draws it, which is the whole of the expiry — a slot is free because
 * it is old, not because anything swept it.
 */
export function lifeOf(mark: Mark, now: number, life: number) {
  return life > 0 ? (now - mark.born) / life : 2;
}

/**
 * Out, so a mark leaves fast and eases — but only *quadratically* out, and the
 * fade below is the steeper of the two on purpose. Cubed here against a squared
 * fade put the halo at 99% of its travel while still a quarter visible, which
 * reads as a ring that stops in mid-air and is then rubbed out. It has to still
 * be moving when it goes.
 */
export function growOf(t: number) {
  const left = 1 - t;

  return 1 - left * left;
}

/** Cubed, so a mark is spent well before it is done travelling. */
export function fadeOf(t: number) {
  const left = 1 - t;

  return left * left * left;
}

/**
 * The scene's marks and the clock they are timed by, together — two components
 * draw them and a clock either of them owned would be a second one.
 */
export function createPulses() {
  const halos: Halo[] = Array.from({ length: PULSE_CAPACITY }, () => ({
    born: -Infinity, turn: 0, scatter: 0,
  }));

  const sparks: Spark[] = Array.from({ length: PULSE_CAPACITY }, () => ({
    born: -Infinity, x: 0, y: 1, z: 0, r: 1,
  }));

  let now = 0;
  let nextHalo = 0;
  let nextSpark = 0;

  /**
   * Clamped, because the widget renders on demand: a world that has been idle
   * or in a hidden tab can come back with a delta longer than a flash's whole
   * life, and the click that woke it would be over before it was drawn.
   */
  function advance(delta: number) {
    now += Math.min(delta, 0.1);
  }

  /**
   * One click. The directions are `Math.random` and not the seeded stream the
   * swarm and the caps use: a flash is an *event*, so two clicks landing in the
   * same place is the failure, not the unreproducibility.
   */
  function flash(count: number, field: SurfaceField) {
    const halo = halos[nextHalo];

    halo.born = now;
    halo.turn = Math.random() * Math.PI * 2;
    halo.scatter = Math.random() * 2 - 1;

    nextHalo = (nextHalo + 1) % PULSE_CAPACITY;

    for (let i = 0; i < count; i++) {
      const mark = sparks[nextSpark];

      // Uniform on the sphere: the axis component first, then a point on the
      // ring of the radius that leaves. Y, because the world spins about it.
      const y = Math.random() * 2 - 1;
      const around = Math.random() * Math.PI * 2;
      const ring = Math.sqrt(Math.max(0, 1 - y * y));

      mark.born = now;
      mark.x = Math.cos(around) * ring;
      mark.y = y;
      mark.z = Math.sin(around) * ring;
      mark.r = field.sampleRadius(mark.x, mark.y, mark.z);

      nextSpark = (nextSpark + 1) % PULSE_CAPACITY;
    }
  }

  /** Whether anything is still drawing, so a quiet world stops asking for frames. */
  function isLive(life: number) {
    return halos.some((mark) => now - mark.born < life)
      || sparks.some((mark) => now - mark.born < life);
  }

  return {
    halos,
    sparks,
    get now() { return now; },
    advance,
    flash,
    isLive,
  };
}

export type Pulses = ReturnType<typeof createPulses>;

export type PulseGroup = 'Halo' | 'Echo' | 'Spark';

export interface PulseParam {
  key: keyof PulseVisual;
  label: string;
  group: PulseGroup;
  min: number;
  max: number;
  step: number;
}

export const PULSE_GROUPS: PulseGroup[] = ['Halo', 'Echo', 'Spark'];

/** Shaped like `SWARM_PARAMS`, so wiring a panel onto it is mechanical. */
export const PULSE_PARAMS: PulseParam[] = [
  { key: 'haloFrom', label: 'From', group: 'Halo', min: 0.5, max: 3, step: 0.01 },
  // Past the framing on purpose: a halo that stops inside the frame reads as a
  // ring that was drawn and rubbed out, not as one that left.
  { key: 'haloTo', label: 'To', group: 'Halo', min: 0.5, max: 6, step: 0.01 },
  { key: 'haloLife', label: 'Life', group: 'Halo', min: 0.05, max: 4, step: 0.05 },
  // 0 is the main ring off, leaving the echo on its own.
  { key: 'haloWidth', label: 'Stroke px', group: 'Halo', min: 0, max: 12, step: 0.25 },

  // 0 is the whole echo off, so the four below need no switch of their own.
  { key: 'echoWidth', label: 'Stroke px', group: 'Echo', min: 0, max: 8, step: 0.25 },
  { key: 'echoScale', label: 'Radius', group: 'Echo', min: 0.5, max: 2, step: 0.01 },
  { key: 'echoWarp', label: 'Warp', group: 'Echo', min: 0, max: 0.4, step: 0.005 },
  { key: 'echoBands', label: 'Lobes', group: 'Echo', min: 1, max: 16, step: 0.5 },
  { key: 'echoScatter', label: 'Scatter', group: 'Echo', min: 0, max: 1, step: 0.02 },
  { key: 'echoDepth', label: 'Depth', group: 'Echo', min: 0, max: 1, step: 0.02 },

  // A count, and an upgrade axis: a click that incarnates more should mark the
  // world in more places. 0 is the sparks off.
  { key: 'sparks', label: 'Sparks', group: 'Spark', min: 0, max: 8, step: 1 },
  { key: 'sparkDot', label: 'Dot', group: 'Spark', min: 0, max: 0.25, step: 0.002 },
  { key: 'sparkRing', label: 'Ring reach', group: 'Spark', min: 1, max: 10, step: 0.1 },
  { key: 'sparkWidth', label: 'Ring px', group: 'Spark', min: 0, max: 8, step: 0.25 },
  // Both at 0 is the flare off, so the two below need no switch of their own.
  { key: 'sparkRiseFrom', label: 'Rise from', group: 'Spark', min: 0, max: 8, step: 0.1 },
  { key: 'sparkRiseTo', label: 'Rise to', group: 'Spark', min: 0, max: 8, step: 0.1 },
  { key: 'sparkFlareFrom', label: 'Base from', group: 'Spark', min: 1, max: 6, step: 0.05 },
  { key: 'sparkFlareTo', label: 'Base to', group: 'Spark', min: 1, max: 6, step: 0.05 },
  { key: 'sparkLife', label: 'Life', group: 'Spark', min: 0.05, max: 3, step: 0.05 },
  { key: 'sparkBack', label: 'Far side', group: 'Spark', min: 0, max: 1, step: 0.02 },
  { key: 'sparkTone', label: 'Dot ink', group: 'Spark', min: 0, max: 6, step: 1 },
  { key: 'sparkRingTone', label: 'Ring ink', group: 'Spark', min: 0, max: 6, step: 1 },
  // Around the whole mark at once, and inked against it, so it has no tone of
  // its own to author. 0 is the outline off.
  { key: 'sparkOutline', label: 'Outline px', group: 'Spark', min: 0, max: 6, step: 0.25 },
];

export const DEFAULT_PULSE: PulseVisual = {
  haloFrom: 0.88,
  haloTo: 2.11,
  haloLife: 0.9,
  haloWidth: 12,
  echoWidth: 0.75,
  echoScale: 0.81,
  echoWarp: 0.26,
  echoBands: 1,
  echoScatter: 1,
  echoDepth: 0.8,
  sparks: 1,
  sparkDot: 0.045,
  sparkRing: 4,
  sparkWidth: 1.5,
  // The flare is off: both heights at 0 and neither draw runs. Parked, not
  // removed — the shaders, the materials and the four sliders are all still
  // there, so raising either rise brings it back. It was authored at 0.6 → 2.4
  // over a 3.2 → 1.4 base, which is where to put it back to see what was judged.
  sparkRiseFrom: 0,
  sparkRiseTo: 0,
  sparkFlareFrom: 3.2,
  sparkFlareTo: 1.4,
  sparkLife: 0.8,
  sparkBack: 0.25,
  sparkTone: 0,
  sparkRingTone: 0,
  sparkOutline: 1.5,
};

export function clonePulse(visual: PulseVisual): PulseVisual {
  return { ...visual };
}

/** A TS literal, ready to paste back over `DEFAULT_PULSE`. */
export function printPulse(visual: PulseVisual) {
  const lines = Object.entries(visual).map(
    ([key, value]) => `  ${key}: ${Number(value.toFixed(4))},`,
  );

  return `export const DEFAULT_PULSE: PulseVisual = {\n${lines.join('\n')}\n};`;
}
