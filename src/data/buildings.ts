/**
 * The cohort ladder, generated. See `docs/design.md` §5 — a cohort is an index
 * and everything about it falls out of that index: three constants and a ramp,
 * the same for every cohort, forever.
 *
 * `cost(n) = 15 × 10^(n−1)` experience, `yield(n) = 1 × 10^(n−1)` experience a
 * soul, `karma(n) = 0.2 × yield(n)`, `duration(n) = 1s × 2^(n−1)`. `ramp: 1.07`
 * on every cohort, every copy. Ten level gates, shared, because the ramps are
 * tuned so every cohort actually reaches the top of the list — see
 * `cohort-levels.ts` for what a level does.
 *
 * Nothing here is authored per cohort any more: no bias, no resistance, no
 * per-cohort aim figure. Duration alone carries identity now — a short cohort's
 * whole life sits inside one wave phase and takes its bias whole; a long one
 * spans several and averages them. See `docs/design.md` §6.
 */

import type { BuildingData } from '$lib/types';

export const COHORT_COUNT = 8;

export const LEVEL_GATES = [10, 25, 50, 100, 150, 200, 250, 300, 350, 400];

export const COHORT_RAMP = 1.07;

export function cohortId(n: number) {
  return `cohort_${n}`;
}

function cohortData(n: number) {
  const yieldXp = 1 * 10 ** (n - 1);

  return {
    upgrade_threshold: LEVEL_GATES,
    cost: 15 * 10 ** (n - 1),
    cost_type: 'experience' as const,
    cost_multiplier: COHORT_RAMP,
    yields: {
      experience: yieldXp,
      karma: 0.2 * yieldXp,
    },
    duration: 1000 * 2 ** (n - 1),
  };
}

const data: Record<string, BuildingData> = {
  'main': {
    role: 'click',
    yields: { experience: 5, karma: 1 },
    duration: 1000,
    count: 1,
  },
  ...Object.fromEntries(
    Array.from({ length: COHORT_COUNT }, (_, i) => [cohortId(i + 1), cohortData(i + 1)]),
  ),
};

export default data;
