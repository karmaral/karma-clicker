import type { UpgradeData, UpgradeScope } from '$types';

const ENTITY_KINDS = ['cohort', 'building', 'planet'] as const;

/**
 * Bucket keys are `kind:entity`; the colon is why entity ids may keep their own
 * underscores. A bare key is a global scope and owns no entity.
 */
export function parseScope(key: string): UpgradeScope {
  const [kind, entity] = key.split(':');
  if (!entity) return { kind: 'global' };
  if (!ENTITY_KINDS.includes(kind as (typeof ENTITY_KINDS)[number])) return { kind: 'global' };

  return { kind: kind as (typeof ENTITY_KINDS)[number], entity };
}

const data: Record<string, UpgradeData[]> = {
  'global': [],
  'refinery': [],
  'harness': [],
  /**
   * Entity is the planet id. `costs` decides the shape: a priced discovery is
   * sought from the rail, a costless one arrives once `unlocks_at` holds.
   * `first` has no bucket — it is where you start, not something you find.
   * Placeholder figures.
   */
  'planet:second': [
    {
      id: 'discover',
      effect: 'discover',
      unlocks_at: { karma_positive: 20000 },
      costs: { karma_positive: 30000 },
    },
  ],
  'planet:third': [
    {
      id: 'discover',
      effect: 'discover',
      unlocks_at: { karma_positive: 750000 },
    },
  ],
  'building:main': [
    {
      id: 'str_1',
      effect: { op: 'mult', value: 1.5 },
      effect_target: 'experience',
      unlocks_at: { experience: 40 },
      costs: { experience: 30 }
    },
    {
      id: 'str_2',
      effect: { op: 'mult', value: 2 },
      effect_target: 'experience',
      unlocks_at: { experience: 200 },
      costs: { experience: 200 }
    },
    {
      id: 'str_3',
      effect: { op: 'mult', value: 3 },
      effect_target: 'experience',
      unlocks_at: { karma_positive: 10 },
      costs: { karma_positive: 15 }
    },
    {
      id: 'str_4',
      // Squares the ladder above it once: 1 × 1.5 × 2 × 3 × 9 = 81. Retune with str_1–3.
      effect: { op: 'mult', value: 9 },
      effect_target: 'experience',
      unlocks_at: { karma_positive: 25 },
      costs: { karma_positive: 25 }
    },
  ],
  'cohort:basic': [
    {
      id: 'core_0',
      effect: ['unlock', 'autonomy'],
      unlocks_at: { karma_positive: 50 },
      costs: { experience: 60 },
    },
    {
      id: 'str_1',
      // The two yields ride different level curves, so they take different factors.
      effect: [
        { op: 'mult', value: 1.6, target: 'experience' },
        { op: 'mult', value: 6.6, target: 'karma' },
      ],
      unlocks_at: { karma_positive: 10000 },
      costs: { karma_positive: 10000 },
    },
  ],
  'cohort:steady': [
    {
      id: 'core_0',
      effect: ['unlock', 'acquire'],
      unlocks_at: { karma_positive: 100 },
      costs: { karma_positive: 100 },
    },
    {
      id: 'core_1',
      effect: 'autonomy',
      unlocks_at: { karma_positive: 20 },
      costs: { experience: 200 },
    }
  ],
  'cohort:chaos': [
    {
      id: 'core_0',
      effect: ['unlock', 'acquire', 'autonomy'],
      unlocks_at: { karma_positive: 50 },
      costs: { karma_positive: 50 },
    },
  ],
  'cohort:zealot': [
    {
      id: 'core_0',
      effect: ['unlock', 'acquire'],
      unlocks_at: { karma_positive: 10000 },
      costs: { karma_positive: 10000 },
    },
  ],
  'cohort:red_basic': [
    {
      id: 'core_0',
      effect: ['unlock', 'acquire', 'autonomy'],
      unlocks_at: { red_positive: 5000 },
      costs: { red_positive: 5000 },
    },
  ]
};
export default data;
