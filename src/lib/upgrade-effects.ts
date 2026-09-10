/**
 * An upgrade's effects as the modifiers they become. Lifted out of
 * `UpgradeManager` because a preview has to build the *same* modifier the
 * purchase would — a panel that prices an upgrade off its own reading of the
 * data is a panel that can be wrong about it.
 */
import type { Effect, Modifier, UpgradeData } from '$types';

/** An upgrade's effects as a list, however the one entry was authored. */
export function effectsOf(item: UpgradeData): Effect[] {
  if (!item.effect) return [];

  return Array.isArray(item.effect) ? item.effect : [item.effect];
}

/**
 * One effect entry, for whoever will hold it. `index` keeps an upgrade's several
 * effects individually removable, and `effect` spreads last so its own `target`
 * beats the upgrade's `effect_target`.
 */
export function modifierFor(item: UpgradeData, effect: Omit<Modifier, 'id'>, index: number): Modifier {
  return { id: `${item.id}:${index}`, target: item.effect_target, ...effect };
}

/**
 * Every modifier an upgrade would add — what a preview prices, and what
 * `release` will later take back off.
 *
 * The index is the entry's place in the **whole** list, verbs included, so the
 * ids match the ones the purchase adds one at a time.
 */
export function modifiersFor(item: UpgradeData): Modifier[] {
  return effectsOf(item).flatMap((effect, index) => {
    if (typeof effect === 'string') return [];

    return [modifierFor(item, effect, index)];
  });
}
