import type { UpgradeData, UpgradeScope } from '$types';

const ENTITY_KINDS = ['cohort', 'building', 'planet'] as const;

/**
 * Bucket keys are `kind:entity`; the colon is why entity ids may keep their own
 * underscores. A bare key is a global scope and owns no entity.
 */
export function parseScope(key: string): UpgradeScope {
  const [kind, entity] = key.split(':');

  // The two scopes with a singleton behind them rather than an entity.
  if (!entity && (kind === 'refinery' || kind === 'harness')) {
    return { kind };
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
   * Three axes and no fourth. Slots cap the souls, efficiency moves the batch,
   * speed moves the interval — staffing must never touch the interval, or
   * throughput goes quadratic in souls. Each is priced in what buying it should
   * make you feel: slots in karma, efficiency in lifetimes, speed in what the
   * refinery itself makes. Placeholder figures.
   */
  'refinery': [
    {
      id: 'slots_1',
      effect: { op: 'flat', value: 4, stat: 'slots' },
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
      id: 'slots_2',
      effect: { op: 'flat', value: 12, stat: 'slots' },
      unlocks_at: { red_positive: 8000 },
      costs: { red_positive: 6000 },
    },
  ],
  /**
   * Two capacities and a precision. Work slots decide how many reserved souls
   * can place at once, so the split gets an optimum instead of "always max";
   * rider slots cap how many souls the finished harness pays the anchor bonus
   * to. `step` is a rung down the split ladder, not a fraction — see
   * `balance.harness.splitSteps`. Placeholder figures.
   */
  'harness': [
    {
      id: 'slots_1',
      effect: { op: 'flat', value: 6, stat: 'slots' },
      unlocks_at: { karma_positive: 40_000 },
      costs: { karma_positive: 60_000 },
    },
    {
      id: 'split_1',
      effect: { op: 'flat', value: 1, stat: 'step' },
      unlocks_at: { karma_positive: 80_000 },
      costs: { experience: 500_000 },
    },
    {
      id: 'riders_1',
      effect: { op: 'flat', value: 40, stat: 'riders' },
      unlocks_at: { karma_negative: 50_000 },
      costs: { karma_positive: 150_000 },
    },
    {
      id: 'slots_2',
      effect: { op: 'flat', value: 24, stat: 'slots' },
      unlocks_at: { red_positive: 1000 },
      costs: { red_positive: 2500 },
    },
    {
      id: 'split_2',
      effect: { op: 'flat', value: 1, stat: 'step' },
      unlocks_at: { red_positive: 4000 },
      costs: { red_positive: 5000 },
    },
    {
      id: 'riders_2',
      effect: { op: 'flat', value: 400, stat: 'riders' },
      unlocks_at: { red_positive: 10_000 },
      costs: { red_positive: 12_000 },
    },
    {
      id: 'split_3',
      effect: { op: 'flat', value: 1, stat: 'step' },
      unlocks_at: { yellow: 500 },
      costs: { yellow: 750 },
    },
  ],
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
    // Ramps the click's duration back toward instant. mult 0 on speed_3 lands
    // on the same zero-duration path the emitter already treats as synchronous.
    {
      id: 'speed_1',
      effect: { op: 'mult', value: 0.6, stat: 'duration' },
      unlocks_at: { experience: 100 },
      costs: { experience: 80 },
    },
    {
      id: 'speed_2',
      effect: { op: 'mult', value: 0.5, stat: 'duration' },
      unlocks_at: { experience: 400 },
      costs: { experience: 300 },
    },
    {
      id: 'speed_3',
      effect: { op: 'mult', value: 0, stat: 'duration' },
      unlocks_at: { experience: 900 },
      costs: { experience: 700 },
    },
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
      effect: [
        { op: 'mult', value: 1.6, target: 'experience' },
        { op: 'mult', value: 6.6, target: 'karma' },
      ],
      unlocks_at: { count_total: 25 },
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
      unlocks_at: { count_total: 25 },
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
