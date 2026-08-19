import type { UpgradeData, UpgradeScope } from '$types';

const ENTITY_KINDS = ['cohort', 'building', 'planet'] as const;

/**
 * Bucket keys are `kind:entity`; the colon is why entity ids may keep their own
 * underscores. A bare key is a global scope and owns no entity.
 */
export function parseScope(key: string): UpgradeScope {
  const [kind, entity] = key.split(':');

  // The refinery is the one scope with a singleton behind it rather than an entity.
  if (!entity && kind === 'refinery') {
    return { kind: 'refinery' };
  }

  if (!entity) {
    return { kind: 'global' };
  }

  if (!ENTITY_KINDS.includes(kind as (typeof ENTITY_KINDS)[number])) {
    return { kind: 'global' };
  }

  return { kind: kind as (typeof ENTITY_KINDS)[number], entity };
}

const data: Record<string, UpgradeData[]> = {
  /**
   * Owns no entity, so nothing here carries a verb or a modifier — the price is
   * the whole of the choice. Both unlock under their beat's floor. Placeholder figures.
   */
  'global': [
    {
      id: 'read_the_wave',
      unlocks_at: { experience: 9000 },
      costs: { karma_positive: 750 },
    },
    {
      id: 'the_other_way',
      unlocks_at: { experience: 30_000 },
      costs: { karma_positive: 4000 },
    },
  ],
  /**
   * Three axes and no fourth. Seats cap the souls, efficiency moves the batch,
   * speed moves the interval — staffing must never touch the interval, or
   * throughput goes quadratic in souls. Each is priced in what buying it should
   * make you feel: seats in karma, efficiency in lifetimes, speed in what the
   * refinery itself makes. Placeholder figures.
   */
  'refinery': [
    {
      id: 'seats_1',
      effect: { op: 'flat', value: 4, stat: 'seats' },
      unlocks_at: { karma_negative: 5000 },
      costs: { karma_positive: 25_000 },
    },
    {
      id: 'efficiency_1',
      effect: { op: 'mult', value: 1.5 },
      unlocks_at: { red_positive: 500 },
      costs: { experience: 1_000_000 },
    },
    {
      id: 'speed_1',
      effect: { op: 'mult', value: 0.75, stat: 'duration' },
      unlocks_at: { red_positive: 2000 },
      costs: { red_positive: 1500 },
    },
    {
      id: 'seats_2',
      effect: { op: 'flat', value: 12, stat: 'seats' },
      unlocks_at: { red_positive: 8000 },
      costs: { red_positive: 6000 },
    },
  ],
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
      unlocks_at: { karma_positive: 20_000 },
      costs: { karma_positive: 30_000 },
    },
  ],
  'planet:third': [
    {
      id: 'discover',
      effect: 'discover',
      unlocks_at: { karma_positive: 750_000 },
    },
  ],
  'building:main': [
    // {
    //   id: 'speed_3',
    //   effect: { op: 'flat', value: -10_000 },
    //   effect_target: 'duration',
    //   unlocks_at: { experience: 500 },
    // },
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
  /**
   * `first` opens the bucket and hands you one — `acquire` carries autonomy, so
   * the verb is never authored beside it. Unpriced here on purpose: the rail is
   * beat 4 and the cohort table beat 3, so a priced first cohort has no buyer
   * before the beat that needs it.
   */
  'cohort:basic': [
    {
      id: 'first',
      effect: ['unlock', 'acquire'],
      unlocks_at: { karma_positive: 15 },
    },
    {
      id: 'str_1',
      // The two yields ride different level curves, so they take different factors.
      effect: [
        { op: 'mult', value: 1.6, target: 'experience' },
        { op: 'mult', value: 6.6, target: 'karma' },
      ],
      unlocks_at: { karma_positive: 10_000 },
      costs: { karma_positive: 10_000 },
    },
  ],
  'cohort:steady': [
    {
      id: 'first',
      effect: ['unlock', 'acquire'],
      unlocks_at: { karma_positive: 100 },
      costs: { karma_positive: 100 },
    },
    {
      // `duration_reduction: 0` — steady is the one cohort count never speeds up.
      id: 'speed_1',
      effect: { op: 'mult', value: 0.75, stat: 'duration' },
      unlocks_at: { karma_positive: 20 },
      costs: { experience: 200 },
    }
  ],
  'cohort:chaos': [
    {
      id: 'first',
      effect: ['unlock', 'acquire'],
      unlocks_at: { karma_positive: 50 },
      costs: { karma_positive: 50 },
    },
  ],
  'cohort:zealot': [
    {
      id: 'first',
      effect: ['unlock', 'acquire'],
      unlocks_at: { karma_positive: 10_000 },
      costs: { karma_positive: 10_000 },
    },
  ],
  'cohort:red_basic': [
    {
      id: 'first',
      effect: ['unlock', 'acquire'],
      unlocks_at: { red_positive: 5000 },
      costs: { red_positive: 5000 },
    },
  ]
};
export default data;
