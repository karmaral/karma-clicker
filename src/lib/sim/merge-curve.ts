/**
 * What merging a share of your souls would buy from a world, before any run.
 * Pure, so the lab can redraw it while `mergeHalving` is still being dragged.
 *
 * Merged souls are counted off the total here, where the real merge rounds per
 * cohort — close enough for a curve, and the sweep walks the real path.
 */

import { resolveHarvestDuration, resolveHarvestYields } from '$lib/planets/harvest';
import type { PlanetData, Polarity } from '$types';
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
  alignment: Polarity = 0,
  steps = STEPS,
): MergeCurveRow[] {
  const harvest = planet?.harvest;
  if (!harvest) return [];

  const minimum = planet.firstHarvest.mergeMinimum ?? 0;
  const yields = resolveHarvestYields(harvest.yields, alignment);

  return Array.from({ length: steps + 1 }, (_, step) => {
    const fraction = step / steps;
    const merged = Math.round(souls * fraction);
    const durationMs = resolveHarvestDuration(harvest.duration, merged, harvest);
    const seconds = durationMs / 1000;

    const rate = (amount = 0) => (seconds > 0 ? amount / seconds : 0);

    return {
      planet: planetId,
      fraction,
      merged,
      soulsLeft: souls - merged,
      meetsMinimum: merged >= minimum,
      harvestDurationMs: durationMs,
      experiencePerSecond: rate(yields.experience),
      karmaPerSecond: rate(yields.karma_positive) + rate(yields.karma_negative),
    };
  });
}
