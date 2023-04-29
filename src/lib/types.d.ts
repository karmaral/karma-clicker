export type ResourceType = 'experience' | 'karma';

export interface UpgradeData {
  id: string;
  title: string;
  description: string;
  effect: string;
  unlocks_at: number;
  unlock_type: ResourceType;
  cost?: number;
  cost_type?: ResourceType
}
export interface ItemData {
  upgrade_cost: number[];
  yield_multiplier: number;
  cost_multiplier: number;
  cost: number;
  duration: number;
  duration_reduction: number;
}
export interface ItemTextData {
  title: string;
  description: string;
}
