export type ResourceType = 
| 'experience'
| 'karma_negative' 
| 'karma_positive'
| 'red_negative' 
| 'yellow_negative' 
| 'blue_negative'
| 'red_positive'
| 'yellow_positive'
| 'blue_positive';

export type CombinedResourceType = 'karma' | 'red' | 'yellow' | 'blue';

export type Polarity = -1 | 0 | 1;

export type BuyMode = number | 'next' | 'max';

export type ModifierOp = 'flat' | 'boost' | 'mult' | 'pow' | 'final';

export type ModifierStat = 'yield' | 'duration';

export interface Modifier {
  id: string;
  op: ModifierOp;
  value: number;
  stat?: ModifierStat;
  target?: ResourceType | 'all';
  snapshot?: boolean;
}

export type EffectVerb = 'unlock' | 'acquire' | 'autonomy';

export type Effect = EffectVerb | Omit<Modifier, 'id' | 'target'>;

export interface UpgradeData {
  id: string;
  effect: Effect | Effect[];
  effect_target?: ResourceType | 'all';
  unlock_type: ResourceType;
  unlocks_at: number;
  cost?: number;
  cost_type?: ResourceType
}
/**
 * `click` is you incarnating by hand — never allocatable, even once it auto-fires.
 * `probe` can incarnate, clear, or be left behind. Defaults to `probe`.
 */
export type BuildingRole = 'click' | 'probe';

export interface BuildingData {
  role?: BuildingRole;
  upgrade_threshold?: number[];
  cost?: number;
  cost_type?: ResourceType;
  cost_multiplier?: number;
  yields: Partial<Record<ResourceType, number>>;
  yield_multipliers?: Partial<Record<ResourceType, number>>;
  count?: number;
  duration?: number;
  duration_reduction?: number;
  polarity_bias?: number;
  polarity_multiplier?: number;
}
/**
 * A phase is a half-wave, light or dense; two make a cycle; `cycles_per_age` of
 * those make an age. The UI calls a phase a stage and an age a cycle.
 */
export interface PlanetData {
  ages: number;
  cycles_per_age: number;
  phase_multiplier: number;
  initial_phase_amount: number;
  densities: number;
  max_initial_density: number;
  /** Payout once harvested. Unset until the harvest pass. */
  yields?: Partial<Record<ResourceType, number>>;
  duration?: number;
}
export interface ItemTextData {
  title: string;
  description: string;
  flavour?: string;
}

export type WaveSlotType = 'low' | 'mid' | 'high';
