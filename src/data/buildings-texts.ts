import type { ItemTextData } from '$lib/types';
import { COHORT_COUNT, cohortId } from './buildings';

/**
 * Indexed, like the ladder underneath it — see `docs/design.md` §5, *Open*. The
 * four inherited names (Impulse, Steady, Chaos, Zealot) described yield shapes
 * the generated ladder no longer has, so every title here is a placeholder
 * reading `Cohort n`, the way `planets-texts.ts` reads `Planet 1 / Simple`
 * until a name is authored.
 */
const data: Record<string, ItemTextData> = Object.fromEntries(
  Array.from({ length: COHORT_COUNT }, (_, i) => {
    const n = i + 1;

    return [cohortId(n), {
      title: `Cohort ${n}`,
      description: 'Placeholder. Unnamed.',
    }];
  }),
);

export default data;