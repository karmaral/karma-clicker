/**
 * What merging a share of your souls would buy from a world, before any run.
 * Pure, so the lab can redraw it while `mergeHalving` is still being dragged.
 *
 * Both axes are relative now: the share is what the clock reads, and the payout
 * is a multiple of the income you hand it. `souls` is here only so the curve can
 * print counts beside the shares — it no longer decides anything.
 */

import { resolveHarvestDuration, resolveHarvestYields } from '$lib/planets/harvest';
import type { HarvestRates, PlanetData, Polarity } from '$types';
import type { MergeCurveRow } from './types';

const STEPS = 20;

/**
 * Takes the world's data rather than its id, so the lab can hand it a planet
 * with the sliders already applied and watch the curve move.
 */
export function buildMergeCurve(
  planetId: string,
  planet: PlanetData | undefined,
  souls: number,
  rates: HarvestRates,
  alignment: Polarity = 0,
  steps = STEPS,
): MergeCurveRow[] {
  const harvest = planet?.harvest;
  if (!harvest) return [];

  const minimum = planet.firstHarvest.mergeMinimum ?? 0;
  const yields = resolveHarvestYields(harvest.yields, alignment, rates);

  return Array.from({ length: steps + 1 }, (_, step) => {
    const fraction = step / steps;
    const merged = Math.round(souls * fraction);
    const durationMs = resolveHarvestDuration(harvest.duration, fraction, harvest);
    const seconds = durationMs / 1000;

    const rate = (amount = 0) => (seconds > 0 ? amount / seconds : 0);

    return {
      planet: planetId,
      fraction,
      merged,
      soulsLeft: souls - merged,
      meetsMinimum: fraction >= minimum,
      harvestDurationMs: durationMs,
      experiencePerSecond: rate(yields.experience),
      karmaPerSecond: rate(yields.karma_positive) + rate(yields.karma_negative),
    };
  });
}
