/**
 * The two knowledge shelves — see `docs/design.md` §18. Every item sits on
 * exactly one: `run` goes with the run, `kept` survives prestige through the
 * legacy. Authored here and spread into the buckets their effects route through,
 * so a kept slots rung is an ordinary refinery modifier and needs no new plumbing.
 *
 * The in-run three are verbs on `global`: they own no entity and are read with
 * `isAcquired` where they act. The tier floor carries no effect either —
 * `UpgradeManager.isLocked` reads how many rungs of it are held.
 *
 * Gated on the first wisdom, which is the reveal: nothing here exists before a
 * run has ended. Placeholder figures, all of them in `balance.knowledge`.
 */

import type { ItemTextData, UpgradeData } from '$types';
import { roman } from '$lib/utils';
import balance from './balance';

const { costs, refinerySlots, harnessSlots } = balance.knowledge;

const GATE = { wisdom: 1 };

/** How many tier-floor rungs the kept shelf offers — one per price. */
export const TIER_FLOOR_RUNGS = costs.tierFloor.length;

function slotsRungs(value: number): UpgradeData[] {
  return costs.slots.map((cost, index) => ({
    id: `knowledge_slots_${index + 1}`,
    shelf: 'kept',
    effect: { op: 'flat', value, stat: 'slots' },
    unlocks_at: GATE,
    costs: { knowledge: cost },
  }));
}

export const knowledgeUpgrades: Record<string, UpgradeData[]> = {
  'global': [
    { id: 'max', shelf: 'run', unlocks_at: GATE, costs: { knowledge: costs.max } },
    { id: 'all_rows', shelf: 'run', unlocks_at: GATE, costs: { knowledge: costs.allRows } },
    { id: 'auto_aim', shelf: 'run', unlocks_at: GATE, costs: { knowledge: costs.autoAim } },
  ],
  'refinery': slotsRungs(refinerySlots),
  'harness': slotsRungs(harnessSlots),
  'cohorts': costs.tierFloor.map((cost, index) => ({
    id: `tier_floor_${index + 1}`,
    shelf: 'kept',
    unlocks_at: GATE,
    costs: { knowledge: cost },
  })),
};

function slotsTexts(noun: string, value: number): Record<string, ItemTextData> {
  return Object.fromEntries(costs.slots.map((_, index) => [`knowledge_slots_${index + 1}`, {
    title: `${noun} remembered ${roman(index + 1)}`,
    description: `Placeholder. ${value} more ${noun.toLowerCase()} slots, this run and every run after.`,
    effect: `+${value} slots, kept`,
  }]));
}

export const knowledgeTexts: Record<string, Record<string, ItemTextData>> = {
  'global': {
    'max': {
      title: 'All you can afford',
      description: 'Placeholder. Buy as many souls as the experience covers, in one press.',
      effect: 'Max, as a buy mode',
    },
    'all_rows': {
      title: 'Every row at once',
      description: 'Placeholder. The buy mode, applied down the whole ladder, cheapest row first.',
      effect: 'buy on every row',
    },
    'auto_aim': {
      title: 'Lean with the wave',
      description: 'Placeholder. The dial follows the phase — positive in light, negative in dense — and never owes for it. Never hard.',
      effect: 'aim follows the wave',
    },
  },
  'refinery': slotsTexts('Refinery', refinerySlots),
  'harness': slotsTexts('Harness', harnessSlots),
  'cohorts': Object.fromEntries(costs.tierFloor.map((_, index) => [`tier_floor_${index + 1}`, {
    title: `Born at Tier ${roman(index + 1)}`,
    description: `Placeholder. Every cohort holds its first ${index + 1 === 1 ? 'tier' : `${index + 1} tiers`} from its first soul, this run and every run after.`,
    effect: `tier ${roman(index + 1)} from one soul, kept`,
  }])),
};
