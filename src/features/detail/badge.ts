import type { BadgeKind } from '$ui';
import type { YieldType } from '$types';

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
