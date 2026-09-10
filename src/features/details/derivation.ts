/**
 * One whole reading of a cohort — every figure `CohortTooltip` prints, taken at
 * once so a panel can hold two of them and show what moved between.
 *
 * Two things can move a reading: a count you have not bought, and a modifier you
 * have not bought. Both are arguments here and neither is applied to anything —
 * the projection goes down through `Building` to `ModifierSet.apply`, which
 * combines order-independently, so nothing is ever added and taken back off.
 */
import { progression } from '$lib/progression';
import type Building from '$lib/buildings/base.svelte';
import type { Modifier, YieldType } from '$types';
import { byRateOrder } from './badge';

export interface Rate {
  type: YieldType;
  value: number;
}

export interface CohortReading {
  /** Yield types in the order they are drawn, karma unsplit. */
  yields: YieldType[];
  /** What one soul makes each, before the count and the scale. */
  production: Partial<Record<YieldType, number>>;
  duration: number;
  activeCount: number;
  heldBack: number;
  /** What one emission pays, count and scale folded in. */
  payout: Partial<Record<YieldType, number>>;
  yieldScale: number;
  /** Karma fans out into both piles here, and only here. */
  rates: Rate[];
}

interface Options {
  /** A count you have not bought. Defaults to the one held. */
  count?: number;
  /** Modifiers you do not hold, priced as if you did. */
  extra?: Modifier[];
}

export function readCohort(cohort: Building, { count, extra = [] }: Options = {}): CohortReading {
  const at = count ?? cohort.count;
  const isSplit = progression.runs('negKarma');

  const production = extra.length ? cohort.productionWith(extra) : cohort.production;
  const yields = (Object.keys(production) as YieldType[]).sort(byRateOrder);

  const activeCount = cohort.activeAt(at);

  const rates = yields.flatMap((type): Rate[] => {
    if (type !== 'karma') return [{ type, value: cohort.perSecond(type, at, extra) }];

    const karma = cohort.karmaPerSecond(at, extra);
    if (!isSplit) return [{ type, value: karma.positive }];

    return [
      { type: 'karma_negative' as YieldType, value: karma.negative },
      { type: 'karma_positive' as YieldType, value: karma.positive },
    ];
  });

  return {
    yields,
    production,
    duration: extra.length ? cohort.durationWith(extra) : cohort.duration,
    activeCount,
    heldBack: at - activeCount,
    payout: Object.fromEntries(yields.map((type) => [type, cohort.payout(type, at, extra)])),
    yieldScale: cohort.yieldScale,
    rates,
  };
}

/** What a rate would gain — the green figure, and never a loss. */
export function gainOf(now: CohortReading, preview: CohortReading, type: YieldType) {
  const before = now.rates.find((rate) => rate.type === type)?.value ?? 0;
  const after = preview.rates.find((rate) => rate.type === type)?.value ?? before;

  return after - before;
}
