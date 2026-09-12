/**
 * What a price reads as, which is not always what it charges. A price naming
 * both sides of a family at the same amount is one purchase in one resource —
 * the harness is strung in crimson, not in two crimsons — so it is drawn as a
 * single figure under the family's own badge. Unequal sides stay two figures,
 * because then the two amounts are the reading.
 */

import type { ResourceType, YieldType } from '$types';

const PAIRS: [ResourceType, ResourceType, YieldType][] = [
  ['red_positive', 'red_negative', 'red'],
  ['karma_positive', 'karma_negative', 'karma'],
];

/** Charged entries in, figures to draw out. See `UpgradeData.costs`. */
export function readCostFigures(entries: [ResourceType, number][]): [YieldType, number][] {
  const figures: [YieldType, number][] = entries.map(([type, amount]) => [type, amount]);

  for (const [positive, negative, family] of PAIRS) {
    const at = figures.findIndex(([type]) => type === positive);
    const other = figures.findIndex(([type]) => type === negative);
    if (at === -1 || other === -1 || figures[at][1] !== figures[other][1]) continue;

    figures[Math.min(at, other)] = [family, figures[at][1]];
    figures.splice(Math.max(at, other), 1);
  }

  return figures;
}
