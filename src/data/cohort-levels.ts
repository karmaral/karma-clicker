/**
 * The cohort's level upgrades, generated off the index rather than authored per
 * cohort — see `docs/design.md` §5, *Milestones — why anyone owns four hundred
 * of anything*. `tier` and `level` stay the vocabulary (kept, not retired — see
 * §20): a **cohort** is which row, a **level** is which rung.
 *
 * `buildings.ts` still says which counts unlock a level; this file says what
 * each one is worth and what it costs. Every rung is ×2 — only the shape of the
 * ×2 changes: the first `n + 3` rungs halve the life, capped at ten, and the
 * rest double the yield instead. The split is derived from the cohort's own
 * index, never authored.
 */

import type { ItemTextData, Modifier, ResourceType, UpgradeData } from '$lib/types';
import { roman } from '$lib/utils';
import buildings, { LEVEL_GATES } from './buildings';

/** 1 prices a level with another copy at its gate — the same trade every rung. */
const PRICE_FACTOR = 1;

/** Rungs before this (0-indexed) halve the life; the rest double the yield. */
function halvingsFor(n: number) {
  return Math.min(LEVEL_GATES.length, n + 3);
}

/** Two significant figures: an authored price nobody would write as 373_519. */
function round(value: number) {
  if (value <= 0) return 0;

  const scale = Math.pow(10, Math.max(0, Math.floor(Math.log10(value)) - 1));

  return Math.round(value / scale) * scale;
}

/** One level, as the modifiers it used to be folded into `#production`. */
function effectOf(index: number, n: number): Omit<Modifier, 'id'>[] {
  if (index < halvingsFor(n)) {
    return [{ op: 'mult', value: 0.5, stat: 'duration' }];
  }

  return [
    { op: 'mult', value: 2, target: 'experience' },
    { op: 'mult', value: 2, target: 'karma' },
  ];
}

/** `cohort_7` → 7. Anything else — the click included — has no levels to build. */
function cohortIndex(id: string) {
  const n = Number(id.match(/^cohort_(\d+)$/)?.[1]);

  return Number.isFinite(n) && n > 0 ? n : undefined;
}

export function levelUpgrades(id: string): UpgradeData[] {
  const n = cohortIndex(id);
  const initData = buildings[id];
  if (!n || !initData?.cost || !initData.cost_type) return [];

  const { cost, cost_multiplier: ramp = 1, cost_type: costType } = initData;

  return LEVEL_GATES.map((gate, index) => ({
    id: `level_${index + 1}`,
    effect: effectOf(index, n),
    unlocks_at: { count: gate },
    costs: {
      [costType]: round(gate * cost * Math.pow(ramp, gate) * PRICE_FACTOR),
    } as Partial<Record<ResourceType, number>>,
  }));
}

/**
 * Reads the effects back out, so a description cannot claim a figure it does
 * not carry. `effect` is the chip's one line and stays short on purpose — the
 * figures are the tooltip's job, which is what a hover is for.
 */
export function levelTexts(id: string): Record<string, ItemTextData> {
  const n = cohortIndex(id);
  const texts: Record<string, ItemTextData> = {};
  if (!n) return texts;

  levelUpgrades(id).forEach((item, index) => {
    const halving = index < halvingsFor(n);

    texts[item.id] = {
      title: `Tier ${roman(index + 1)}`,
      description: halving
        ? 'Placeholder. Every soul in the cohort: half the life, same yield each.'
        : 'Placeholder. Every soul in the cohort: x2 experience, x2 karma each.',
      effect: halving ? 'life halved' : 'yield doubled',
    };
  });

  return texts;
}
