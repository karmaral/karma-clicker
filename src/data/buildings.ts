/**
 * The cohort ladder, generated. See `docs/design.md` §5 — a cohort is an index
 * and everything about it falls out of that index: three constants and a ramp,
 * the same for every cohort, forever.
 *
 * `cost(n) = 15 × 7^(n−1)` experience, `yield(n) = 2 × 13^(n−1)` experience a
 * soul, `karma(n) = 2 × yield(n)`, `duration(n) = 2s × 2^(n−1)`. The ramp is
 * per cohort and the ten level gates are shared — how far up them a row gets is
 * what the ramp decides. See `cohort-levels.ts` for what a level does.
 *
 * Nothing here is authored per cohort any more: no bias, no resistance, no
 * per-cohort aim figure. Duration alone carries identity now — a short cohort's
 * whole life sits inside one wave phase and takes its bias whole; a long one
 * spans several and averages them. See `docs/design.md` §6.
 */

import type { BuildingData } from '$lib/types';

export const COHORT_COUNT = 8;

/**
 * AdCap's ladder, shared by every cohort. A level is granted free on reaching
 * its count, so a gate carries no price and can sit wherever it reads best.
 *
 * ⚠ Six rungs of ×2 is ×64, against ten rungs' ×1_024, and the counts are
 * spread over four times the span. Both cut the same way: a low row levelled as
 * far as anyone reaches stops being worth owning long before the top of the
 * ladder. See `docs/design.md` §5, *Where the gates sit* — this is the live
 * authoring and the open question is whether the rung wants to be worth more
 * than ×2.
 */
export const LEVEL_GATES = [25, 50, 100, 200, 300, 400];

/** Cohort 1's ramp, and the floor every other cohort eases back down to. */
export const BASE_RAMP = 1.07;

/**
 * The first row is the cheap outlier and the second is the steepest — AdCap's
 * shape, and the only thing that tells two cohorts apart besides duration. The
 * gates do not move with it: a steep row simply reaches fewer of them for the
 * same spend, and cohort 1 is the one row that reaches all ten.
 */
export function rampFor(n: number) {
  return n < 2 ? BASE_RAMP : Math.max(BASE_RAMP, 1.17 - 0.01 * n);
}

/**
 * What a cohort's *price* multiplies by per index. Separate from the yield
 * ratio because only one of them sets where buying up beats buying more:
 * `ramp^k = COST_DECADE ÷ 6.5` is ~1 copy at `BASE_RAMP` and under one on a
 * steeper row. Not the thing that paces the ladder, though — the next row is
 * not revealed for another thirty copies, and a gate pulls harder than either.
 *
 * ⚠ At a yield ratio of 13 the crossover falls below the first copy, so the
 * next row is the better buy from the moment it exists. It has stopped being a
 * diagnostic and become a constant — see §5, *The crossover is a diagnostic*.
 * It is also what makes a clerk and the next row's reveal the same figure —
 * see `balance.cohorts.revealFactor`.
 */
export const COST_DECADE = 7;

/**
 * What a cohort's *production* multiplies by per index. Throughput is ×6.5
 * against a life that doubles.
 *
 * **Not a decade, on purpose.** A yield ratio of 10 leaves every row's leading
 * digit at 1 — eight rows reading 1, 10, 100, 1_000 are one digit with zeros
 * appended, and a suffix boundary lands on a row boundary every third row and
 * eats it. What moves the digits is the *fractional* part of `log10(ratio)`:
 * 0 at ten, 0.079 at twelve (AdCap's, which only scatters because their first
 * jump is ×60), 0.114 here — eight tenths of a full turn over seven rungs. Off
 * `YIELD_BASE` the mantissa walks 2 → 2.6 → 3.4 → 4.4 → 5.7 → 7.4 → 9.7 → 1.25,
 * which is the whole digit range once, and every row has a face.
 *
 * ⚠ This is not cosmetic. Payback growth falls from ×1.4 a row to ×1.077 —
 * cohort 8 repays in 25 s where it wanted 316 s — so rows are now near-equal
 * purchases and *all* of the pacing rests on the gates and on multipliers the
 * cohorts do not yet have. See `docs/design.md` §5.
 */
export const YIELD_DECADE = 13;

/**
 * What cohort 1's soul is worth, and so where the whole yield column starts.
 * Two and not one so the bottom row reads **one experience a second** against
 * its 2 s life — a rate is the figure the player holds, and half of one is not
 * a unit anybody counts in.
 *
 * It is the yield axis that carries this and not `duration`, deliberately: a
 * 1 s base would have moved every life on the ladder, and lives are what tell
 * two cohorts apart (see the header) and what every level rung spends itself on
 * (see `cohort-levels.ts`). Doubling the column touches neither.
 *
 * ⚠ Rate doubles, so payback halves: the ladder now opens at 15 s rather than
 * 30 s and tops out at 25 s. Hold it by moving the cost base off 15 instead.
 */
export const YIELD_BASE = 2;

export function cohortId(n: number) {
  return `cohort_${n}`;
}

function cohortData(n: number) {
  const yieldXp = YIELD_BASE * YIELD_DECADE ** (n - 1);

  return {
    upgrade_threshold: LEVEL_GATES,
    cost: 15 * COST_DECADE ** (n - 1),
    cost_type: 'experience' as const,
    cost_multiplier: rampFor(n),
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
