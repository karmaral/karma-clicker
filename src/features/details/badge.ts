import type { BadgeKind } from '$ui';
import type { YieldType } from '$types';

/**
 * The order a set of rates reads in, wherever it is drawn. Experience leads, as
 * it does in the frame's score block; karma follows negative-then-positive, the
 * order the detail cell and the grade table already take. A rate's own position
 * was `Object.keys(production)` — the order the yields happen to be typed in
 * `buildings.ts` — which agreed with the frame by luck and would not have kept
 * agreeing once the table's head had to match its rows.
 */
const RATE_ORDER: YieldType[] = [
  'experience',
  'wisdom',
  'karma',
  'karma_negative',
  'karma_positive',
  'red',
  'red_negative',
  'red_positive',
  'yellow',
  'blue',
];

/** Anything unlisted sorts last, in the order it arrived. */
export function byRateOrder(a: YieldType, b: YieldType) {
  const rank = (type: YieldType) => {
    const at = RATE_ORDER.indexOf(type);

    return at === -1 ? RATE_ORDER.length : at;
  };

  return rank(a) - rank(b);
}

/**
 * Karma and red badge by polarity; unrouted either reads as both. Yellow and
 * blue have no polarity left to carry, so they badge by colour alone.
 */
export function badgeFor(type: YieldType): BadgeKind {
  if (type === 'experience') return 'xp';
  if (type === 'karma') return 'both';
  if (type === 'red') return 'red-both';

  const [family, polarity] = type.split('_');
  if (family === 'karma') return polarity === 'negative' ? 'neg' : 'pos';
  if (family === 'red') return polarity === 'negative' ? 'red-neg' : 'red-pos';

  return family as BadgeKind;
}
