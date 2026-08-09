import type { BadgeKind } from '$ui';
import type { ResourceType } from '$types';

/** Karma badges by polarity; tokens badge by colour. */
export function badgeFor(type: ResourceType): BadgeKind {
  if (type === 'experience') return 'xp';

  const [family, polarity] = type.split('_');
  if (family === 'karma') return polarity === 'negative' ? 'neg' : 'pos';

  return family as BadgeKind;
}
