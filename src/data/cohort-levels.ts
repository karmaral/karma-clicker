/**
 * The cohort levels, as purchases. A count unlocks the upgrade; buying it grants
 * the multiplier — see *Levels become purchases* in `docs/progression.md`.
 *
 * Generated from each cohort's own figures rather than retyped, so the fifth
 * entry cannot drift from the first. `buildings.ts` still authors what a level is
 * worth and how many it has; it no longer applies either.
 */

import type { ItemTextData, Modifier, ResourceType, UpgradeData, YieldType } from '$lib/types';
import { roman } from '$lib/utils';
import buildings from './buildings';

interface LevelSpec {
  /**
   * The last gate worth authoring. Past it a copy costs more than the game ever
   * holds, so the upgrade priced against it is decoration.
   */
  through: number;
  /**
   * 1 prices the upgrade level with another copy at its gate, so it becomes the
   * better buy a copy or two later. Under 1 is a treat, over 1 a goal.
   */
  priceFactor?: number;
  /**
   * The yield whose multiplier the price is measured against. Defaults to what
   * the cohort is bought with — the same pocket, so it reads as a trade. Only a
   * cohort that yields none of its own cost currency needs to say otherwise.
   */
  pricedOn?: YieldType;
}

/**
 * Placeholder figures. `through` is 200 across the board now — the ramps were
 * retuned so every cohort actually reaches the top of the shared gate list,
 * which is what makes one figure right for all five. It used to differ per
 * cohort only because the list was fiction for four of them.
 */
const SPECS: Record<string, LevelSpec> = {
  'basic': { through: 200 },
  'steady': { through: 200 },
  'chaos': { through: 200 },
  'zealot': { through: 200, pricedOn: 'karma' },
  'red_basic': { through: 200 },
};

/** Two significant figures: an authored price nobody would write as 373_519. */
function round(value: number) {
  if (value <= 0) return 0;

  const scale = Math.pow(10, Math.max(0, Math.floor(Math.log10(value)) - 1));

  return Math.round(value / scale) * scale;
}

/** What one level is worth to the resource the price is paid in. Unitless. */
function improvementOf(id: string, pricedOn: YieldType) {
  const { yield_multipliers = {}, duration_reduction = 0 } = buildings[id];

  return (1 + (yield_multipliers[pricedOn] ?? 0)) / (1 - duration_reduction) - 1;
}

/**
 * `1 + 0.57` is 1.5699999999999998 in binary, and `getModifierFigure` prints a
 * `mult` raw — so a generated figure has to arrive clean or the rail's chip reads
 * it out in full.
 */
function clean(value: number) {
  return Math.round(value * 1e6) / 1e6;
}

/** One level, as the modifiers it used to be folded into `#production`. */
function effectsOf(id: string) {
  const { yield_multipliers = {}, duration_reduction = 0 } = buildings[id];

  const effects: Omit<Modifier, 'id'>[] = Object.keys(yield_multipliers)
    .map((target: YieldType) => ({
      op: 'mult',
      value: clean(1 + yield_multipliers[target]),
      target,
    }));

  if (duration_reduction > 0) {
    effects.push({ op: 'mult', value: clean(1 - duration_reduction), stat: 'duration' });
  }

  return effects;
}

export function levelUpgrades(id: string): UpgradeData[] {
  const spec = SPECS[id];
  const initData = buildings[id];
  if (!spec || !initData?.upgrade_threshold || !initData.cost_type) return [];

  const { cost = 0, cost_multiplier: growth = 1, cost_type: costType } = initData;
  const improvement = improvementOf(id, spec.pricedOn ?? (costType as YieldType));
  const effect = effectsOf(id);

  return initData.upgrade_threshold
    .filter((gate) => gate <= spec.through)
    .map((gate, index) => ({
      id: `level_${index + 1}`,
      effect,
      unlocks_at: { count: gate },
      costs: {
        [costType]: round(
          gate * improvement * cost * Math.pow(growth, gate) * (spec.priceFactor ?? 1),
        ),
      } as Partial<Record<ResourceType, number>>,
    }));
}

/**
 * Reads the effects back out, so a description cannot claim a figure it does not
 * carry. `effect` is the chip's one line and stays short on purpose — a level
 * moves three figures at once, and printing all three turns the rail into a
 * paragraph. The figures are the tooltip's job, which is what a hover is for.
 */
export function levelTexts(id: string): Record<string, ItemTextData> {
  const texts: Record<string, ItemTextData> = {};

  levelUpgrades(id).forEach((item, index) => {
    const parts = effectsOf(id).map((effect) => (effect.stat === 'duration'
      ? `x${effect.value} seconds per life`
      : `x${effect.value} ${effect.target}`));

    texts[item.id] = {
      title: `Tier ${roman(index + 1)}`,
      description: `Placeholder. Every soul in the cohort: ${parts.join(', ')}.`,
      effect: 'stats improved',
    };
  });

  return texts;
}
