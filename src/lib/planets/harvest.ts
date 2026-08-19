/**
 * What a finished world pays, resolved. No runes and no imports that reach
 * three.js or the DOM, so this is probeable off the model the way the widget's
 * geometry is — which is the only reason it is not sitting inside `Planet`.
 */

import type { PlanetHarvestMerge, Polarity, ResourceType, YieldType } from '$types';

/** One finished world's take, as the summing needs it. */
export interface HarvestSource {
  yields: Partial<Record<ResourceType, number>>;
  duration: number;
}

/** What an even alignment takes instead of the karma it cannot pick a pile for. */
export const EVEN_EXPERIENCE_BONUS = 0.5;

/** Merged souls that double the harvest's rate, where a world does not say. */
export const MERGE_HALVING = 50;

/** The ceiling on that, so a world's hundreds do not run away. */
export const MAX_HARVEST_SPEED = 8;

/**
 * The locked alignment picks karma's pile. Even can pick neither, so it takes
 * the experience bonus instead of the karma — on top it would be strictly best
 * and the reading would stop being a choice.
 */
export function resolveHarvestYields(
  declared: Partial<Record<YieldType, number>>,
  alignment: Polarity,
): Partial<Record<ResourceType, number>> {
  const isEven = alignment === 0;
  const paid: Partial<Record<ResourceType, number>> = {};

  Object.keys(declared).forEach((type: YieldType) => {
    const amount = declared[type] ?? 0;

    if (type === 'karma') {
      if (isEven) return;

      paid[alignment > 0 ? 'karma_positive' : 'karma_negative'] = amount;
      return;
    }

    if (type === 'experience' && isEven) {
      paid.experience = amount * (1 + EVEN_EXPERIENCE_BONUS);
      return;
    }

    paid[type as ResourceType] = amount;
  });

  return paid;
}

/**
 * Merged souls buy speed. Hyperbolic and capped, so no merge can drive the
 * duration to 0 — a clock with no interval does not run fast, it does not run.
 * Both terms are authored per world: a late one asks more souls for the same
 * step and stops giving it back sooner.
 */
export function resolveHarvestDuration(
  base: number,
  merged: number,
  { mergeHalving = MERGE_HALVING, maxMergeSpeed = MAX_HARVEST_SPEED }: PlanetHarvestMerge = {},
) {
  const halving = mergeHalving > 0 ? mergeHalving : MERGE_HALVING;
  const speed = Math.min(1 + Math.max(0, merged) / halving, Math.max(1, maxMergeSpeed));

  return base / speed;
}

/**
 * Batches do not add — every world's duration moves with its own merged count —
 * so a total has to be per second.
 */
export function sumHarvestRates(sources: HarvestSource[]) {
  const summed = new Map<ResourceType, number>();

  for (const { yields, duration } of sources) {
    // A 0 duration is a world that pays once, so there is no rate to divide out.
    const seconds = duration / 1000;
    if (!seconds) continue;

    for (const type of Object.keys(yields) as ResourceType[]) {
      summed.set(type, (summed.get(type) ?? 0) + (yields[type] ?? 0) / seconds);
    }
  }

  return [...summed].map(([type, perSecond]) => ({ type, perSecond }));
}
