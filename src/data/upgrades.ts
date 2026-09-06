import type { ResourceType, UpgradeData, UpgradeScope } from '$types';
import { levelUpgrades } from './cohort-levels';
import buildingData, { cohortId, COHORT_COUNT } from './buildings';

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
   * Slots cap the souls; efficiency and reach both push `reach`, uncapped —
   * `coveragePerWorker × workers × efficiency` — which `coverage = reach / (1 +
   * reach)` then reads as a saturating share. Multiplying coverage by the
   * interval to get a pulse's draw cancels the interval straight back out, so
   * a duration modifier here would do nothing. `interval` stays fixed as pulse
   * granularity; `reach_*` stacks on the same channel `efficiency_*` does. The
   * level is a separate, unbought axis — see `refinery.svelte.ts` — so nothing
   * here touches it. Slots start with a base — see `balance.refinery` — so the
   * refinery can pair from the moment it is revealed; `slots_1` only adds to it.
   *
   * Every rung is now ×2, uniformly. Each is priced in what buying it should
   * make you feel: slots in karma, efficiency and reach in what the refinery
   * itself makes. The crimson-denominated gates sit further out than the karma
   * ones because the refinery starts lossy — `ratioBase` under 1 — so an early
   * gate in crimson is scarcer than the same figure would have been at 1:1.
   * Placeholder figures.
   */
  'refinery': [
    {
      id: 'efficiency_1',
      effect: { op: 'mult', value: 2 },
      unlocks_at: { red_positive: 2000 },
      costs: { experience: 1_000_000 },
    },
    {
      id: 'reach_1',
      effect: { op: 'mult', value: 2 },
      unlocks_at: { red_positive: 8000 },
      costs: { red_positive: 6000 },
    },
    {
      id: 'slots_1',
      effect: { op: 'flat', value: 12, stat: 'slots' },
      unlocks_at: { red_positive: 16_000 },
      costs: { red_positive: 12_000 },
    },
    {
      id: 'efficiency_2',
      effect: { op: 'mult', value: 2 },
      unlocks_at: { yellow: 500 },
      costs: { yellow: 1500 },
    },
    {
      id: 'reach_2',
      effect: { op: 'mult', value: 2 },
      unlocks_at: { yellow: 1000 },
      costs: { yellow: 5000 },
    },
    {
      id: 'reach_3',
      effect: { op: 'mult', value: 2 },
      unlocks_at: { yellow: 50_000 },
      costs: { yellow: 150_000 },
    },
    {
      id: 'reach_4',
      effect: { op: 'mult', value: 2 },
      unlocks_at: { blue: 1 },
      costs: { blue: 50 },
    },
  ],
  /**
   * Two capacities and a precision. Work slots decide how many reserved souls
   * can place at once, so the split gets an optimum instead of "always max";
   * rider slots cap how many souls the finished harness pays the anchor bonus
   * to. `step` is a rung down the split ladder, not a fraction — see
   * `balance.harness.splitSteps`. Both capacities start with a base — see
   * `balance.harness` — so the harness can do its job the moment it is
   * revealed; every row here only adds to that base. Placeholder figures.
   */
  'harness': [
    {
      id: 'split_1',
      effect: { op: 'flat', value: 1, stat: 'step' },
      unlocks_at: { karma_positive: 80_000 },
      costs: { experience: 500_000 },
    },
    {
      id: 'slots_1',
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
      id: 'riders_1',
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
    },
  ],
  'planet:third': [
    {
      id: 'discover',
      effect: 'discover',
      unlocks_at: { karma_positive: 750_000 },
    },
  ],
  'planet:fourth': [
    {
      id: 'discover',
      effect: 'discover',
      unlocks_at: { red_positive: 2000 },
    },
  ],
  'planet:fifth': [
    {
      id: 'discover',
      effect: 'discover',
      unlocks_at: { yellow: 500 },
    },
  ],
  /**
   * The rail's opening act, and the only bucket that has to be *paced* rather
   * than priced. `str_1`'s gate is the one the `rail` beat opens on, so the rail
   * arrives holding exactly this chip and the ladder is walked a rung at a time
   * — it used to unlock into no rail at all and then land as a wall on the beat
   * that finally drew one. `str_1` alone is the tutorial; the rest interleave
   * with the cohort ladder and the two globals. Read the gates in order, not the ids.
   *
   * One axis, not two: the press is instant from the start, so the `speed_*`
   * ladder that used to ramp its duration is gone. Waiting on a clock is the
   * unclerked cohort's verb now.
   */
  'building:main': [
    {
      id: 'str_1',
      effect: { op: 'mult', value: 2 },
      effect_target: 'experience',
      unlocks_at: { experience: 100 },
      costs: { experience: 200 }
    },
    {
      id: 'str_2',
      effect: { op: 'mult', value: 2 },
      effect_target: 'experience',
      unlocks_at: { experience: 2500 },
      costs: { experience: 5000 }
    },
    {
      id: 'str_3',
      effect: { op: 'mult', value: 2 },
      effect_target: 'experience',
      unlocks_at: { karma_positive: 250 },
      costs: { karma_positive: 500 }
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
      costs: { karma_negative: 200_000 },
    },
  ],
  /**
   * Generated off the index — see `docs/design.md` §5, *Entry*. Cohort 1's
   * first copy is free and gated on the press-count argument (`karma_positive`
   * is what the click pays flat, untouched by `str_*`); every cohort past it is
   * only *revealed* at `5 × cost(n)` experience — the first copy is bought
   * from the row at its own price, so there is no second table.
   *
   * `5×`, not the `0.5×` §5 first wrote: at `0.5×cost(2)` cohort 2 unlocked
   * before cohort 1 did — the 30 clicks the karma+ gate demands already earn
   * more lifetime xp than that. `5×` sits past what clicking to that gate
   * alone pays, so a second cohort takes actually running the first one.
   *
   * `clerk` is every other cohort's own to buy — a row that could never be
   * automated would fight the arc the doc states (*many hands, then fewer,
   * then none*). Cohort 1 is the exception: by the time a second row exists,
   * clicking the first is busywork with nothing left to teach, so it grants
   * itself alongside the free first soul rather than waiting on a purchase.
   * Priced at `250 × cost(n)`, the same ratio §5 lifted from AdCap's manager
   * rung. The label is a placeholder — `clerk` is unsettled, see §19.
   */
  ...Object.fromEntries(
    Array.from({ length: COHORT_COUNT }, (_, i) => {
      const n = i + 1;
      const id = cohortId(n);
      const { cost = 0, cost_type: costType = 'experience' } = buildingData[id] ?? {};

      const first: UpgradeData = n === 1
        ? {
          // The one that stays costless, so `acquireUnpriced` still grants it:
          // this is the `first_soul` beat, and the first soul is something
          // that happens to you, not a chip you find. Autonomy rides along —
          // see the block comment above.
          id: 'first',
          effect: ['unlock', 'acquire', 'autonomy'],
          unlocks_at: { experience: 50 },
          costs: { experience: 100 },
        }
        : {
          // Unlocks the row only — no free copy. The first copy is bought at
          // `getCost(1)`, which is `cost` above, so the entry price lives in
          // exactly one place.
          id: 'first',
          effect: 'unlock',
          unlocks_at: { experience: 5 * cost },
        };

      // Cohort 1 already has autonomy for free — see `first` above.
      const clerk: UpgradeData[] = n === 1 ? [] : [{
        id: 'clerk',
        effect: 'autonomy',
        unlocks_at: { count: 1 },
        costs: { [costType]: 250 * cost } as Partial<Record<ResourceType, number>>,
      }];

      return [`cohort:${id}`, [first, ...levelUpgrades(id), ...clerk]];
    }),
  ),
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
      // Priced in negative karma, and the two of them are the bulk of that
      // pile's sink. Spending lives faster for throughput is the register
      // exactly — it is not gated there like the other three, it simply reads
      // as service to self on its face.
      id: 'shorter_lives_1',
      effect: { op: 'boost', value: -0.06, stat: 'duration' },
      unlocks_at: { karma_positive: 250_000 },
      costs: { karma_negative: 310_000 },
    },
    {
      // Twice the effect of `shorter_lives_1`, so it is priced past it. It used
      // to cost 2400 against that one's 310k, which was the parking value hiding
      // a straight inversion rather than a decision.
      id: 'hard_season',
      effect: { op: 'boost', value: -0.12, stat: 'duration' },
      unlocks_at: { karma_positive: 900_000 },
      costs: { karma_negative: 1_200_000 },
    },
  ],
};
export default data;
