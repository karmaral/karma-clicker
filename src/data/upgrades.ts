import type { UpgradeData, UpgradeScope } from '$types';
import { levelUpgrades } from './cohort-levels';

const ENTITY_KINDS = ['cohort', 'building', 'planet'] as const;

/**
 * Bucket keys are `kind:entity`; the colon is why entity ids may keep their own
 * underscores. A bare key is a global scope and owns no entity.
 */
export function parseScope(key: string): UpgradeScope {
  const [kind, entity] = key.split(':');

  // The scopes with a singleton, or a fan-out, behind them rather than an entity.
  if (!entity && (kind === 'refinery' || kind === 'harness' || kind === 'cohorts')) {
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
    {
      id: 'efficiency_2',
      effect: { op: 'mult', value: 2 },
      unlocks_at: { yellow: 500 },
      costs: { yellow: 1500 },
    },
    {
      id: 'speed_2',
      effect: { op: 'mult', value: 0.5, stat: 'duration' },
      unlocks_at: { yellow: 1000 },
      costs: { yellow: 5000 },
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
      // Both rider caps are soul counts, so they take the army's ×5 with it —
      // 40 out of a thousand incarnating would carry nobody worth counting.
      id: 'riders_1',
      effect: { op: 'flat', value: 200, stat: 'riders' },
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
      effect: { op: 'flat', value: 2000, stat: 'riders' },
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
  /**
   * The rail's opening act, and the only bucket that has to be *paced* rather
   * than priced. Every one of these is unlocked long before five souls, so left
   * bunched they arrive as a wall on the beat that reveals the rail and bury the
   * first cohort tier behind it. Two land early — one per axis, which is the
   * whole tutorial — and the rest are spaced to interleave with the cohort
   * ladder and the two global upgrades. Read the gates in order, not the ids.
   */
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
      unlocks_at: { experience: 6000 },
      costs: { experience: 4500 },
    },
    {
      // Last of the ladder, and past `read_the_wave` on purpose: the press is
      // still worth timing while the wave is the thing being learned.
      id: 'speed_3',
      effect: { op: 'mult', value: 0, stat: 'duration' },
      unlocks_at: { experience: 20_000 },
      costs: { experience: 15_000 },
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
      unlocks_at: { experience: 2500 },
      costs: { experience: 1800 }
    },
    {
      id: 'str_3',
      effect: { op: 'mult', value: 3 },
      effect_target: 'experience',
      unlocks_at: { karma_positive: 400 },
      costs: { karma_positive: 300 }
    },
    {
      id: 'str_4',
      // Squares the ladder above it once: 1 × 1.5 × 2 × 3 × 9 = 81. Retune with str_1–3.
      effect: { op: 'mult', value: 9 },
      effect_target: 'experience',
      unlocks_at: { karma_positive: 2000 },
      costs: { karma_positive: 1500 }
    },
    {
      // Not a `mult` like the rest of the ladder — it multiplies by something the
      // world is doing, which is what makes the press keep up instead of being
      // outgrown. Gated past `riders_1`: with nobody up there it buys nothing.
      // Priced per rider, so it moved down as the rider caps moved up: 0.2% a
      // soul lands on the same +40% / +400% the 1% figure bought before.
      id: 'carry_1',
      effect: { op: 'flat', value: 0.002, stat: 'carry' },
      unlocks_at: { karma_negative: 60_000 },
      costs: { karma_positive: 200_000 },
    },
  ],
  /**
   * `first` opens the bucket and hands you one — `acquire` carries autonomy, so
   * the verb is never authored beside it. Unpriced here on purpose: the rail is
   * beat 4 and the cohort table beat 3, so a priced first cohort has no buyer
   * before the beat that needs it.
   */
  /**
   * `first` opens the bucket, then the levels — priced in what the cohort itself
   * is bought with, so *another copy or the upgrade* is one comparison out of one
   * pocket. Anything priced in karma or tokens sits past them and is a reward
   * rather than a decision; `str_1` is the worked example.
   */
  'cohort:basic': [
    {
      id: 'first',
      effect: ['unlock', 'acquire'],
      unlocks_at: { karma_positive: 15 },
    },
    ...levelUpgrades('basic'),
    {
      // Past the level_4 gate at 50, so the karma reward does not land on the
      // same count as an experience-priced level.
      id: 'str_1',
      effect: [
        { op: 'mult', value: 1.6, target: 'experience' },
        { op: 'mult', value: 6.6, target: 'karma' },
      ],
      unlocks_at: { count_total: 60 },
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
    ...levelUpgrades('steady'),
    {
      // `duration_reduction: 0` — steady is the one cohort whose levels carry no
      // speed, so this is the only thing that shortens it.
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
    ...levelUpgrades('chaos'),
  ],
  'cohort:zealot': [
    {
      id: 'first',
      effect: ['unlock', 'acquire'],
      unlocks_at: { karma_positive: 10_000 },
      costs: { karma_positive: 10_000 },
    },
    ...levelUpgrades('zealot'),
  ],
  'cohort:red_basic': [
    {
      id: 'first',
      effect: ['unlock', 'acquire'],
      unlocks_at: { red_positive: 5000 },
      costs: { red_positive: 5000 },
    },
    ...levelUpgrades('red_basic'),
  ],
  /**
   * Every cohort at once, and only cohorts — the fan-out reads
   * `BuildingManager.cohorts`, which names its members by class, so the click is
   * out of it without anyone excluding it. Re-applied off the loop, so a cohort
   * unlocked after one of these was bought still gets it.
   *
   * `boost` and not `mult`, so the two of them sum to −18% rather than
   * compounding to −17%: these are a global shortening of every life, and a
   * global thing should add up the way the player expects it to.
   *
   * Placeholder figures. Both used to sit behind a billion karma purely to keep
   * them unreachable while nothing routed them; those parking values are gone.
   */
  'cohorts': [
    {
      id: 'shorter_lives_1',
      effect: { op: 'boost', value: -0.06, stat: 'duration' },
      unlocks_at: { karma_positive: 250_000 },
      costs: { karma_positive: 310_000 },
    },
    {
      // Twice the effect of `shorter_lives_1`, so it is priced past it. It used
      // to cost 2400 against that one's 310k, which was the parking value hiding
      // a straight inversion rather than a decision.
      id: 'hard_season',
      effect: { op: 'boost', value: -0.12, stat: 'duration' },
      unlocks_at: { karma_positive: 900_000 },
      costs: { karma_positive: 1_200_000 },
    },
  ],
};
export default data;
