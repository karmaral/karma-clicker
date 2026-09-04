/** Red only ever exists polarised; yellow and blue are matched pairs, so neutral. */
export type ResourceType =
| 'experience'
| 'wisdom'
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

/**
 * `slots` is how many souls a singleton can put to work — the refinery's third
 * axis and the harness's first. `riders` is what the finished harness carries;
 * `step` counts rungs down the split ladder, so it is an index, not a fraction.
 * `carry` is what one soul riding the harness is worth to *you* — it is held by
 * the hand and only reads the harness for the count. A share per soul, so its
 * `flat` value is a rate and prints as a percent.
 */
export type ModifierStat = 'yield' | 'duration' | 'slots' | 'riders' | 'step' | 'carry';

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
 * go that does not call itself a cohort. `refinery` names no entity because
 * there is exactly one of it — as with `harness`; `global` names none because it
 * owns nothing yet. `cohorts` (plural) names no entity because it names every
 * one of them: `#fanOut` puts the modifier on each, and `syncFanOut` keeps it
 * true for cohorts unlocked later.
 */
export type UpgradeScope =
  | { kind: 'global' | 'refinery' | 'harness' | 'cohorts'; entity?: undefined }
  | { kind: 'cohort' | 'building' | 'planet'; entity: string };

/** `target` overrides the upgrade's `effect_target`, so one array can hit two yields. */
export type Effect = EffectVerb | Omit<Modifier, 'id'>;

/**
 * `count` is what is held now and falls with a merge, so what it gates re-locks
 * and comes back one gate at a time as the ladder is rebuilt. `count_total` is
 * the lifetime tally and never falls — for anything meant to stay earned.
 */
export type UnlockType = ResourceType | 'count' | 'count_total';

export interface UpgradeData {
  id: string;
  /** Omitted where the purchase itself is the point — a `global` trigger has nothing to act on. */
  effect?: Effect | Effect[];
  effect_target?: YieldType | 'all';
  /** Single-entry table: `{ karma_positive: 15 }`. Only the first entry is read. */
  unlocks_at: Partial<Record<UnlockType, number>>;
  /** Single-entry table: `{ karma_positive: 15 }`. Only the first entry is read. */
  costs?: Partial<Record<ResourceType, number>>;
}
/**
 * `click` is you incarnating by hand — never allocatable, even once it auto-fires.
 * `soul` can incarnate, refine, or be merged. Defaults to `soul`.
 */
export type BuildingRole = 'click' | 'soul';

/**
 * `upgrade_threshold` authors the cohort's level upgrades — the counts that
 * unlock them. `Building` does not read it: a level is bought, not earned, so
 * its multiplier arrives as a modifier. See `cohort-levels.ts`.
 */
export interface BuildingData {
  role?: BuildingRole;
  upgrade_threshold?: number[];
  cost?: number;
  cost_type?: ResourceType;
  cost_multiplier?: number;
  yields: Partial<Record<YieldType, number>>;
  count?: number;
  duration?: number;
}
/**
 * What a planet demands before it will let you take the first harvest — the
 * one-off event that ends it, not the yield it pays afterwards. Every field is
 * optional: a planet authors only what it imposes, absent means unrestricted.
 * A new kind of restriction is a field here, a guard in `Planet`, and a label.
 */
export interface PlanetFirstHarvestConditions {
  excessGate?: number;
  agesLived?: number;
}

export interface PlanetFirstHarvest extends PlanetFirstHarvestConditions {
  /**
   * The share of your army the world takes for letting you leave, 0…1. A toll
   * and not a condition: you always own all of yourself, so a share can never
   * fail to be payable — it is the merge slider's floor and nothing else.
   */
  mergeMinimum?: number;
}

/** Only what can fail. The toll is out of it — see `mergeMinimum` above. */
export type FirstHarvestCondition = keyof PlanetFirstHarvestConditions;

/**
 * What merged souls are worth to a world's harvest clock. Authored, because a
 * late world should ask more souls for the same step and stop giving it back
 * sooner. Both fall back to a default when a world says nothing.
 */
export interface PlanetHarvestMerge {
  /**
   * The merged *share* that doubles the rate, 0…1. Authored equal to the toll,
   * which is what makes paying exactly the toll always buy ×2 and merging
   * everything land near `maxMergeSpeed`. A share for the same reason the toll
   * is one: an absolute halving point moves under every ladder change.
   */
  mergeHalving?: number;
  /** The most any merge can multiply the rate by. */
  maxMergeSpeed?: number;
}

/**
 * Income per second at the moment you left, read **before** the merge. What a
 * finished world pays is a multiple of this rather than an authored amount, so
 * no figure in `planets.ts` is denominated in a quantity the ladder can move —
 * see `docs/design.md` §15. `karma` is phase-averaged, never the instant.
 */
export type HarvestRates = Partial<Record<YieldType, number>>;
/**
 * What taking the first harvest leaves you holding, for good. A reward, so it is
 * not a `PlanetFirstHarvest` field — that interface is what the world *demands*.
 *
 * Shaped like an upgrade's effect and routed the same way: `target` names the
 * building the change lands on, and the modifier is the change.
 */
export interface HarvestBoon {
  target: string;
  effect: Omit<Modifier, 'id'>;
}

/**
 * What a world asks before it will let its souls incarnate. Authored per world
 * rather than fixed globally, for the same reason `harvest` is: a late world
 * should ask more anchors and pay less for each.
 */
export interface PlanetAnchoring {
  /** How many the world asks for, 1…`ANCHOR_MAX`. */
  anchors: number;
  /** What one anchor takes, in ms of the job. Souls set how fast that job runs. */
  duration: number;
  /** What each placed anchor adds to a carried soul's yields. */
  bonusPerAnchor: number;
}

/**
 * A phase is a half-wave, light or dense; two make a cycle; `cycles_per_age` of
 * those make an age. Three words, used the same way in code and in the UI.
 */
export interface PlanetData {
  ages: number;
  cycles_per_age: number;
  /**
   * How long one phase lasts, in ms of time spent on this world. The wave is a
   * clock: nothing you own makes it turn faster, so a world's length is authored
   * here — `ages × cycles_per_age × 2 × phase_duration` — and not a consequence
   * of how good the run before it was.
   */
  phase_duration: number;
  densities: number;
  max_initial_density: number;
  firstHarvest: PlanetFirstHarvest;
  /**
   * What the recurring harvest pays, and how often. One object because a payout
   * with no clock pays once and stops. `karma` is declared as a family and the
   * planet routes it by the alignment it locked; `duration` is the base, which
   * merged souls shorten.
   */
  harvest?: PlanetHarvestMerge & {
    /** **Seconds of your income at departure**, not amounts. See `HarvestRates`. */
    yields: Partial<Record<YieldType, number>>;
    duration: number;
  };
  /** Absent means a world you may incarnate on the moment you arrive. */
  anchoring?: PlanetAnchoring;
  /** Kept when you leave, unlike the yields — see `HarvestBoon`. */
  boons?: HarvestBoon[];
}
export interface ItemTextData {
  title: string;
  description: string;
  flavour?: string;
  /** Wins over a derived effect line where the formula reads true but ugly. */
  effect?: string;
}

export type WaveSlotType = 'low' | 'mid' | 'high';
