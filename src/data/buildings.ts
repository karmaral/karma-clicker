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

/**
 * What a cohort multiplies by per index. Named because it is load-bearing twice
 * over: cost and yield both ride it, and it is what makes a clerk and the next
 * row's reveal the same figure — see `balance.cohorts.revealFactor`.
 */
export const COHORT_DECADE = 10;

export function cohortId(n: number) {
  return `cohort_${n}`;
}

function cohortData(n: number) {
  const decade = COHORT_DECADE ** (n - 1);
  const yieldXp = 1 * decade;

  return {
    upgrade_threshold: LEVEL_GATES,
    cost: 15 * decade,
    cost_type: 'experience' as const,
    cost_multiplier: COHORT_RAMP,
    yields: {
      experience: yieldXp,
      karma: 2 * yieldXp,
    },
    duration: 2000 * 2 ** (n - 1),
  };
}

const data: Record<string, BuildingData> = {
  // Instant from the first press — 0 is the emitter's synchronous path. The
  // click-and-wait verb belongs to unclerked cohorts alone now; a cooldown on
  // the one thing you do continuously was only ever an obstacle. See §5.
  'main': {
    role: 'click',
    yields: { experience: 1 },
    duration: 0,
    count: 1,
  },
  ...Object.fromEntries(
    Array.from({ length: COHORT_COUNT }, (_, i) => [cohortId(i + 1), cohortData(i + 1)]),
  ),
};

export default data;
