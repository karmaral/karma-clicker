import type { BadgeKind } from '$ui';
import type { YieldType } from '$types';

/** Karma badges by polarity; unrouted karma reads as both. Tokens badge by colour. */
export function badgeFor(type: YieldType): BadgeKind {
  if (type === 'experience') return 'xp';
  if (type === 'karma') return 'both';

  const [family, polarity] = type.split('_');
  if (family === 'karma') return polarity === 'negative' ? 'neg' : 'pos';

  return family as BadgeKind;
}
