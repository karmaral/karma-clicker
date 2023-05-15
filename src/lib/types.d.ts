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

export interface UpgradeData {
  id: string;
  effect: string | string[];
  effect_target?: ResourceType | 'all';
  unlock_type: ResourceType;
  unlocks_at: number;
  cost?: number;
  cost_type?: ResourceType
}
export interface BuildingData {
  upgrade_threshold?: number[];
  cost?: number;
  cost_type?: ResourceType;
  cost_multiplier?: number;
  yield_type: ResourceType;
  yield_unit: number;
  yield_multiplier?: number;
  owned?: number;
  duration?: number;
  duration_reduction?: number;
  polarity_bias?: number;
  polarity_multiplier?: number;
}
export interface PlanetData {
  ages: number;
  cycles_per_age: number;
  cycle_stage_multiplier: number;
  cycle_initial_stage_amount: number;
  densities: number;
  max_initial_density: number;
}
export interface ItemTextData {
  title: string;
  description: string;
  flavour?: string;
}

export type WaveSlotType = 'low' | 'mid' | 'high';
