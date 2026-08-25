/**
 * What a purchase mode buys for one grade, asked from outside the row that
 * draws the button — the table's head has to price the same buy the row is
 * previewing. Each grade prices its ceiling differently (inversion is
 * geometric, yellow/blue are flat), so the max is asked for rather than owned.
 */

export type TokenPurchaseMode = '1' | '10' | '100' | 'Max';

/** Zero when nothing is affordable — `Max` is the only mode that can say that. */
export function resolveQuantity(mode: TokenPurchaseMode, max: () => number) {
  if (mode === 'Max') return max();

  return Number(mode);
}

/** What the button charges for. One is the floor — a zero purchase still shows a price. */
export function resolvePurchasable(mode: TokenPurchaseMode, max: () => number) {
  return Math.max(1, resolveQuantity(mode, max));
}
