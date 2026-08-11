/**
 * Excess is karma you are still holding and have not paired off, read against
 * everything you have ever earned. Global, per CONTEXT v3 §3.2 — only the gate
 * that lets you leave a planet is per-planet.
 */

import { BuildingManager, ResourceManager } from '$lib/managers';
import type { Polarity } from '$types';

/**
 * How much income the wall is worth. Excess reads as the share of this window
 * you are holding unpaired, so §4's "around ten minutes in" is the calibration.
 */
const WALL_SECONDS = 600;

/** Inside this, a planet counts as first harvested even rather than tilted either way. */
const EVEN_BAND = 0.02;

/** Signed and unbounded: negative is Burden, positive is Comfort. */
export function getUnpairedKarma() {
  return ResourceManager.getAmount('karma_positive') - ResourceManager.getAmount('karma_negative');
}

/**
 * The stuck threshold, in raw karma. Read off income rather than off anything
 * cumulative: a lifetime total only grows, which would decay excess to nothing,
 * and the two piles shrink as the refinery works, which would inflate it.
 */
export function getWall() {
  return BuildingManager.countKarmaPerSecond() * WALL_SECONDS;
}

/**
 * Unpaired karma against the wall. `undefined` while nothing earns karma — a
 * zero there would read as "clean enough" and open beat 9 on nothing.
 */
export function getExcess() {
  const wall = getWall();
  if (wall <= 0) return undefined;

  return getUnpairedKarma() / wall;
}

/**
 * Read once, at the first harvest. It locks what the planet's recurring harvest
 * pays for good (§3.9), so nothing afterwards may consult it again.
 */
export function getFirstHarvestPolarity(): Polarity {
  const reading = getExcess() ?? 0;
  if (Math.abs(reading) < EVEN_BAND) return 0;

  return reading > 0 ? 1 : -1;
}
