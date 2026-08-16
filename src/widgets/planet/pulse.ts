/**
 * The click. One **flash** is one click, and it leaves two kinds of mark, born
 * together and dying apart: a **halo** — a single ring around the whole world,
 * facing the camera — and **sparks**, landing at random points on the surface
 * and drawn through the body.
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

export interface Mark {
  /** The pulse clock when it flashed. `-Infinity` is a slot never used. */
  born: number;
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
   */
  haloWidth: number;
  /** Its ink. 0 is paper and 6 is the darkest slot, as everywhere else. */
  haloTone: number;

  /** How many sparks one flash makes. 0 leaves the halo on its own. */
  sparks: number;
  /** The flash's radius, in body radii — content, so sized like a soul. */
  sparkDot: number;
  /** How far its ring travels out, as a multiple of the dot. 1 is no travel. */
  sparkRing: number;
  /** The ring's stroke in px, on the halo's argument. */
  sparkWidth: number;
  sparkLife: number;
  /** The flash, and the ring around it. */
  sparkTone: number;
  sparkRingTone: number;
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
  const halos: Mark[] = Array.from({ length: PULSE_CAPACITY }, () => ({ born: -Infinity }));

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
    halos[nextHalo].born = now;
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

export type PulseGroup = 'Halo' | 'Spark';

export interface PulseParam {
  key: keyof PulseVisual;
  label: string;
  group: PulseGroup;
  min: number;
  max: number;
  step: number;
}

export const PULSE_GROUPS: PulseGroup[] = ['Halo', 'Spark'];

/** Shaped like `SWARM_PARAMS`, so wiring a panel onto it is mechanical. */
export const PULSE_PARAMS: PulseParam[] = [
  { key: 'haloFrom', label: 'From', group: 'Halo', min: 0.5, max: 3, step: 0.01 },
  // Past the framing on purpose: a halo that stops inside the frame reads as a
  // ring that was drawn and rubbed out, not as one that left.
  { key: 'haloTo', label: 'To', group: 'Halo', min: 0.5, max: 6, step: 0.01 },
  { key: 'haloLife', label: 'Life', group: 'Halo', min: 0.05, max: 4, step: 0.05 },
  // 0 is the halo off, so the pair needs no switch of its own.
  { key: 'haloWidth', label: 'Stroke px', group: 'Halo', min: 0, max: 12, step: 0.25 },
  { key: 'haloTone', label: 'Ink', group: 'Halo', min: 0, max: 6, step: 1 },

  // A count, and an upgrade axis: a click that incarnates more should mark the
  // world in more places. 0 is the sparks off.
  { key: 'sparks', label: 'Sparks', group: 'Spark', min: 0, max: 8, step: 1 },
  { key: 'sparkDot', label: 'Dot', group: 'Spark', min: 0, max: 0.25, step: 0.002 },
  { key: 'sparkRing', label: 'Ring reach', group: 'Spark', min: 1, max: 10, step: 0.1 },
  { key: 'sparkWidth', label: 'Ring px', group: 'Spark', min: 0, max: 8, step: 0.25 },
  { key: 'sparkLife', label: 'Life', group: 'Spark', min: 0.05, max: 3, step: 0.05 },
  { key: 'sparkTone', label: 'Dot ink', group: 'Spark', min: 0, max: 6, step: 1 },
  { key: 'sparkRingTone', label: 'Ring ink', group: 'Spark', min: 0, max: 6, step: 1 },
];

export const DEFAULT_PULSE: PulseVisual = {
  haloFrom: 1.05,
  haloTo: 2.2,
  haloLife: 0.9,
  haloWidth: 2,
  haloTone: 6,
  sparks: 1,
  sparkDot: 0.045,
  sparkRing: 4,
  sparkWidth: 1.5,
  sparkLife: 0.45,
  sparkTone: 0,
  sparkRingTone: 0,
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
