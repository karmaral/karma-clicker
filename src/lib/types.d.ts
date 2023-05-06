export type ResourceType = 'experience' | 'karma';

export interface UpgradeData {
  id: string;
  title: string;
  description: string;
  effect: string | string[];
  effect_target?: ResourceType;
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
  quantity?: number;
  duration?: number;
  duration_reduction?: number;
}
export interface ItemTextData {
  title: string;
  description: string;
}

export type WaveSlotType = 'low' | 'mid' | 'high';
