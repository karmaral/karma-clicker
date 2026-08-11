/** Red only ever exists polarised; yellow and blue are matched pairs, so neutral. */
export type ResourceType =
| 'experience'
| 'karma_negative'
| 'karma_positive'
| 'red_negative'
| 'red_positive'
| 'yellow'
| 'blue';

/** Families holding two piles at once. A family name is a routing instruction. */
export type PolarizedResourceType = 'karma' | 'red';

/** What data may declare. Wider than what the ledger stores — aim routes the rest. */
export type YieldType = ResourceType | PolarizedResourceType;

export type Polarity = -1 | 0 | 1;

export type BuyMode = number | 'next' | 'max';

export type ModifierOp = 'flat' | 'boost' | 'mult' | 'pow' | 'final';

export type ModifierStat = 'yield' | 'duration';

export interface Modifier {
  id: string;
  op: ModifierOp;
  value: number;
  stat?: ModifierStat;
  target?: YieldType | 'all';
}

/** Verbs act on the entity its bucket names — see `UpgradeScope`. */
export type EffectVerb = 'unlock' | 'acquire' | 'autonomy' | 'discover';

/**
 * What an upgrade bucket is scoped to. `cohort` and `building` both route to
 * `BuildingManager` — the split exists so a non-soul building has somewhere to
 * go that does not call itself a cohort.
 */
export type UpgradeScope =
  | { kind: 'global'; entity?: undefined }
  | { kind: 'cohort' | 'building' | 'planet'; entity: string };

/** `target` overrides the upgrade's `effect_target`, so one array can hit two yields. */
export type Effect = EffectVerb | Omit<Modifier, 'id'>;

export interface UpgradeData {
  id: string;
  effect: Effect | Effect[];
  effect_target?: YieldType | 'all';
  /** Single-entry table: `{ karma_positive: 15 }`. Only the first entry is read. */
  unlocks_at: Partial<Record<ResourceType, number>>;
  /** Single-entry table: `{ karma_positive: 15 }`. Only the first entry is read. */
  costs?: Partial<Record<ResourceType, number>>;
}
/**
 * `click` is you incarnating by hand — never allocatable, even once it auto-fires.
 * `soul` can incarnate, refine, or be merged. Defaults to `soul`.
 */
export type BuildingRole = 'click' | 'soul';

export interface BuildingData {
  role?: BuildingRole;
  upgrade_threshold?: number[];
  cost?: number;
  cost_type?: ResourceType;
  cost_multiplier?: number;
  yields: Partial<Record<YieldType, number>>;
  yield_multipliers?: Partial<Record<YieldType, number>>;
  count?: number;
  duration?: number;
  duration_reduction?: number;
  /** The detent this cohort drifts toward, −2…2. */
  polarity_bias?: number;
  /** What a hard detent pays, relative to an even one. */
  polarity_multiplier?: number;
  /** 0 does as it is told; 1 is unaimable, drifting around its own bias. */
  resistance?: number;
}
/**
 * What a planet demands before it will let you take the first harvest — the
 * one-off event that ends it, not the yield it pays afterwards. Every field is
 * optional: a planet authors only what it imposes, absent means unrestricted.
 * A new kind of restriction is a field here, a guard in `Planet`, and a label.
 */
export interface PlanetFirstHarvest {
  excessGate?: number;
  agesLived?: number;
}

export type FirstHarvestCondition = keyof PlanetFirstHarvest;
/**
 * A phase is a half-wave, light or dense; two make a cycle; `cycles_per_age` of
 * those make an age. Three words, used the same way in code and in the UI.
 */
export interface PlanetData {
  ages: number;
  cycles_per_age: number;
  phase_multiplier: number;
  initial_phase_amount: number;
  densities: number;
  max_initial_density: number;
  firstHarvest: PlanetFirstHarvest;
  /** What the recurring harvest pays. Unset until the harvest pass. */
  yields?: Partial<Record<ResourceType, number>>;
  duration?: number;
}
export interface ItemTextData {
  title: string;
  description: string;
  flavour?: string;
}

export type WaveSlotType = 'low' | 'mid' | 'high';
