/**
 * Excess is karma you are still holding and have not paired off, read against
 * everything you have ever earned. Global, per CONTEXT v3 §3.2 — only the gate
 * that lets you leave a planet is per-planet.
 */

import { BuildingManager, ResourceManager } from '$lib/managers';
import balance from '$data/balance';
import type { Polarity } from '$types';

/** Signed and unbounded: negative is Burden, positive is Comfort. */
export function getUnpairedKarma() {
  return ResourceManager.getAmount('karma_positive') - ResourceManager.getAmount('karma_negative');
}

/**
 * The stuck threshold, in raw karma. Read off income rather than off anything
 * cumulative: a lifetime total only grows, which would decay excess to nothing,
 * and the two piles shrink as the refinery works, which would inflate it. The
 * window is `excess.wallSeconds` — §4's "around ten minutes in" is its calibration.
 */
export function getWall() {
  return BuildingManager.countKarmaPerSecond() * balance.excess.wallSeconds;
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
 * pays for good (§3.9), so nothing afterwards may consult it again. `Polarity`
 * is the shape; the planet calls it its alignment, to keep it off the resources.
 */
export function getFirstHarvestAlignment(): Polarity {
  const reading = getExcess() ?? 0;
  if (Math.abs(reading) < balance.excess.evenBand) return 0;

  return reading > 0 ? 1 : -1;
}
