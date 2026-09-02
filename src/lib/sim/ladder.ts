/**
 * What a cohort costs and earns as its count climbs. Aim- and wave-independent
 * on purpose: modulation is a run-time question and belongs in the timeline.
 */

import Cohort from '$lib/buildings/cohort.svelte';
import type Building from '$lib/buildings/base.svelte';
import type { ResourceType, YieldType } from '$types';
import data from '$data/buildings';
import type { LadderRow } from './types';

const COUNTS = [1, 2, 3, 5, 8, 12, 16, 20, 25, 30, 40, 50, 65, 80, 100, 125, 150, 175, 200];

/**
 * What one more would add, read in whatever resource it is priced in — asked of
 * the count rather than the building, since level crossings make it non-linear.
 */
export function marginalPerSecond(building: Building, type: ResourceType) {
  const count = building.count;

  if (type === 'karma_positive' || type === 'karma_negative') {
    const side = type === 'karma_positive' ? 'positive' : 'negative';

    return building.karmaPerSecond(count + 1)[side]
      - building.karmaPerSecond(count)[side];
  }

  return building.perSecond(type as YieldType, count + 1) - building.perSecond(type, count);
}

/** Seconds of a purchase's own income to repay it. Infinity when it earns none. */
export function paybackOf(cost: number, perSecond: number) {
  return perSecond > 0 ? cost / perSecond : Infinity;
}

export function buildLadder(counts: number[] = COUNTS): LadderRow[] {
  const rows: LadderRow[] = [];

  for (const id of Object.keys(data)) {
    const initData = data[id];
    if (initData.role === 'click') continue;

    const costType = initData.cost_type;
    if (!initData.cost || !costType) continue;

    const cohort = new Cohort(id, initData);
    let cumulativeCost = 0;
    let at = 0;

    for (const count of counts) {
      cumulativeCost += cohort.getCost(count - at) ?? 0;
      cohort.add(count - at);
      at = count;

      const nextCost = cohort.getCost(1) ?? 0;
      const marginal = marginalPerSecond(cohort, costType);

      rows.push({
        cohort: id,
        count,
        cumulativeCost,
        nextCost,
        costType,
        karmaPerSecond: cohort.perSecond('karma'),
        experiencePerSecond: cohort.perSecond('experience'),
        marginalPerSecond: marginal,
        paybackSeconds: paybackOf(nextCost, marginal),
      });
    }
  }

  return rows;
}
