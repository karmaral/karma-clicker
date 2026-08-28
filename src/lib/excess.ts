/**
 * Excess is the share of the karma you are holding that has nothing to pair
 * with. Global, per CONTEXT v3 §3.2 — only the gate that lets you leave a planet
 * is per-planet.
 *
 * A share of the piles themselves, so there is no clock in it and no income
 * term: growing the economy cannot wash it out, and the phase flip cannot swing
 * it while the piles sit still. It moves when the piles move, and nothing else.
 */

import { ResourceManager } from '$lib/managers';
import balance from '$data/balance';
import type { Polarity } from '$types';

/** Signed and unbounded: negative is Burden, positive is Comfort. */
export function getUnpairedKarma() {
  return ResourceManager.getAmount('karma_positive') - ResourceManager.getAmount('karma_negative');
}

/** Everything still on hand, paired or not — what the unpaired part is a share of. */
export function getHeldKarma() {
  return ResourceManager.getAmount('karma_positive') + ResourceManager.getAmount('karma_negative');
}

/**
 * Unpaired karma as a share of held, so ±1 is a pile at zero and the refinery
 * stalled — the reading's ceiling and the machine stopping are the same event.
 *
 * `undefined` until both piles have ever existed: before the choice that makes
 * negative karma there is only one pole, and a lone pile is not an imbalance.
 */
export function getExcess() {
  if (ResourceManager.getTotal('karma_positive') <= 0) return undefined;
  if (ResourceManager.getTotal('karma_negative') <= 0) return undefined;

  const held = getHeldKarma();
  if (held <= 0) return 0;

  return getUnpairedKarma() / held;
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
