/**
 * The one place code names and UI labels meet. `detail` has no fixed label —
 * it takes the active planet's proper noun. See nav.label().
 */

import type { FirstHarvestCondition, Polarity } from '$types';

export type ScreenName = 'overview' | 'detail' | 'refinery';

export const SCREENS: ScreenName[] = ['overview', 'detail', 'refinery'];

export const SCREEN_LABELS: Record<ScreenName, string> = {
  overview: 'Overview',
  detail: '—',
  refinery: 'Refinery',
};

/**
 * How a planet was first harvested, which sets what its recurring harvest pays.
 * The karma column words, so nobody mistakes them for the excess poles. Flat
 * placeholders, deferred rather than open (CONTEXT v3 §3.9).
 */
export const FIRST_HARVEST_POLARITY_LABELS: Record<Polarity, string> = {
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

/** Why a planet will not let you take the first harvest yet. */
export function getFirstHarvestConditionLabel(condition: FirstHarvestCondition, value: number) {
  switch (condition) {
    case 'agesLived':
      return `${value} ${value === 1 ? 'age' : 'ages'} lived`;
    case 'excessGate':
      return `excess under ${Math.round(value * 100)}%`;
  }
}
