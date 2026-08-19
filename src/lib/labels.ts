/**
 * The one place code names and UI labels meet. `detail` has no fixed label —
 * it takes the active planet's proper noun. See nav.label().
 */

import type { FirstHarvestCondition, Polarity } from '$types';

export type ScreenName = 'overview' | 'detail' | 'refinery';

export const SCREENS: ScreenName[] = ['overview', 'detail', 'refinery'];

export const SCREEN_LABELS: Record<ScreenName, string> = {
  overview: 'Overview',
  refinery: 'Refinery',
  detail: '—',
};

/**
 * The grades, in ladder order. Code says red / yellow / blue and the screen says
 * Crimson / Ochre / Indigo; red is the only one still holding a side, so it is
 * the only one whose name takes a qualifier.
 */
export type GradeKey = 'red_negative' | 'red_positive' | 'yellow' | 'blue';

export const GRADES: GradeKey[] = ['red_negative', 'red_positive', 'yellow', 'blue'];

export const GRADE_LABELS: Record<GradeKey, string> = {
  red_negative: 'Crimson · negative',
  red_positive: 'Crimson · positive',
  yellow: 'Ochre',
  blue: 'Indigo',
};

/** What each grade comes out of — the row's whole explanation of itself. */
export const GRADE_SOURCES: Record<GradeKey, string> = {
  red_negative: 'Refined from negative karma',
  red_positive: 'Refined from positive karma',
  yellow: 'Refined from matched Crimson',
  blue: 'Refined from Ochre',
};

/**
 * How a planet was first harvested, which sets what its recurring harvest pays.
 * The karma column words, so nobody mistakes them for the excess poles.
 */
export const FIRST_HARVEST_ALIGNMENT_LABELS: Record<Polarity, string> = {
  '-1': 'In the negative',
  '0': 'Even',
  '1': 'In the positive',
};

/**
 * Which pole the excess sits on. One signed reading, never two bars — the side
 * is a qualifier on the label, not a resource of its own (CONTEXT v3 §3.2).
 */
export function getExcessSideLabel(excess: number | undefined) {
  if (!excess) return undefined;

  return excess > 0 ? 'Comfort side' : 'Burden side';
}

/**
 * The record is what makes the order exhaustive: `strict` is off, so a missing
 * switch case compiles fine, but a missing key here does not. Widen
 * `PlanetFirstHarvest` and this fails until the condition is placed.
 */
const CONDITION_ORDER: Record<FirstHarvestCondition, number> = {
  agesLived: 1,
  mergeMinimum: 2,
  excessGate: 3,
};

/**
 * Canonical order. Anything listing a planet's conditions walks this, so what it
 * asks reads the same on the Ahead row as on the Harvest button.
 */
export const FIRST_HARVEST_CONDITIONS = (Object.keys(CONDITION_ORDER) as FirstHarvestCondition[])
  .sort((a, b) => CONDITION_ORDER[a] - CONDITION_ORDER[b]);

/** Why a planet will not let you take the first harvest yet. */
export function getFirstHarvestConditionLabel(
  condition: FirstHarvestCondition,
  value: number,
): string {
  switch (condition) {
    case 'agesLived':
      return `${value} ${value === 1 ? 'age' : 'ages'} lived`;
    case 'mergeMinimum':
      return `${value} souls to merge`;
    case 'excessGate':
      return `excess under ${Math.round(value * 100)}%`;
    default: {
      const unhandled: never = condition;

      return unhandled;
    }
  }
}
