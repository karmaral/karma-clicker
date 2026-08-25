/**
 * What a purchase mode buys, asked from outside the row that draws the button.
 * The table's head has to price the same buy the row is previewing, so this
 * cannot live inside `CohortRow` any more.
 */

import { BuildingManager } from '$lib/managers';
import type Building from '$lib/buildings/base.svelte';
import type { PurchaseMode } from './types';

/** Zero when nothing is affordable — `Max` is the only mode that can say that. */
export function resolveQuantity(cohort: Building, mode: PurchaseMode) {
  if (mode === 'Max') return BuildingManager.getAffordableQuantity(cohort.id) ?? 0;
  if (mode === 'Next') return cohort.nextUntilThreshold;

  return Number(mode);
}

/** What the button charges for. One is the floor — a zero purchase still shows a price. */
export function resolvePurchasable(cohort: Building, mode: PurchaseMode) {
  return Math.max(1, resolveQuantity(cohort, mode));
}
