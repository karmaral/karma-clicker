/**
 * What a finished world pays, resolved. No runes and no imports that reach
 * three.js or the DOM, so this is probeable off the model the way the widget's
 * geometry is — which is the only reason it is not sitting inside `Planet`.
 *
 * The three figures a world may leave unsaid live in `data/balance.ts`.
 */

import balance from '$data/balance';
import type { HarvestRates, PlanetHarvestMerge, Polarity, ResourceType, YieldType } from '$types';

/** One finished world's take, as the summing needs it. */
export interface HarvestSource {
  yields: Partial<Record<ResourceType, number>>;
  duration: number;
}

/**
 * The locked alignment picks karma's pile. Even can pick neither, so it takes
 * the experience bonus instead of the karma — on top it would be strictly best
 * and the reading would stop being a choice.
 *
 * `declared` is **seconds of production**, so one delivery is worth that many
 * seconds of the income you left with. Nothing here is an absolute, which is
 * what keeps a world authored once through a ladder change.
 *
 * `anchorBonus` is what the anchors left standing on the world are worth, read
 * once on the way out — so anchoring a world you mean to leave is an investment
 * in its take rather than only in the time you spend there. 1 is unanchored.
 */
export function resolveHarvestYields(
  declared: Partial<Record<YieldType, number>>,
  alignment: Polarity,
  rates: HarvestRates,
  anchorBonus = 1,
): Partial<Record<ResourceType, number>> {
  const isEven = alignment === 0;
  const paid: Partial<Record<ResourceType, number>> = {};

  Object.keys(declared).forEach((type: YieldType) => {
    const amount = (declared[type] ?? 0) * (rates[type] ?? 0) * anchorBonus;

    if (type === 'karma') {
      if (isEven) return;

      paid[alignment > 0 ? 'karma_positive' : 'karma_negative'] = amount;
      return;
    }

    if (type === 'experience' && isEven) {
      paid.experience = amount * (1 + balance.harvest.evenExperienceBonus);
      return;
    }

    paid[type as ResourceType] = amount;
  });

  return paid;
}

/**
 * Merging buys tempo; holding buys size. This is the tempo half — hyperbolic
 * and capped, so no merge can drive the duration to 0: a clock with no interval
 * does not run fast, it does not run.
 *
 * `mergedShare` is the share of the army left with the world, not a count. With
 * `mergeHalving` authored equal to the toll, paying exactly the toll always
 * buys ×2 and merging everything lands near `maxMergeSpeed`, on every world and
 * at every population.
 */
export function resolveHarvestDuration(
  base: number,
  mergedShare: number,
  {
    mergeHalving = balance.harvest.mergeHalving,
    maxMergeSpeed = balance.harvest.maxMergeSpeed,
  }: PlanetHarvestMerge = {},
) {
  const halving = mergeHalving > 0 ? mergeHalving : balance.harvest.mergeHalving;
  const speed = Math.min(1 + Math.max(0, mergedShare) / halving, Math.max(1, maxMergeSpeed));

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
