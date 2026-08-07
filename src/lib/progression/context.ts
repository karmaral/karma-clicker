import type { ResourceType } from '$types';
import { ResourceManager, BuildingManager, UpgradeManager, PlanetManager } from '$lib/managers';

export interface TriggerContext {
  total(type: ResourceType): number;
  amount(type: ResourceType): number;
  hasUpgrade(target: string, id: string): boolean;
  owned(building: string): number;
  /** Probes owned across every probe-role building. */
  readonly probes: number;
  /** Unpaired karma as a fraction of the active planet's wall. Not built yet. */
  readonly excess: number;
  /** Probes held back from incarnating — anchoring, then clearing. Not built yet. */
  readonly reserve: number;
  readonly planetsUnlocked: number;
  /** Completed oscillation cycles on the active planet. Not built yet. */
  readonly cyclesLived: number;
  /** Planets left for good. The departure, not its ongoing arrivals. Not built yet. */
  readonly planetsFinished: number;
}

export function createTriggerContext(): TriggerContext {
  return {
    total: (type) => ResourceManager.getTotal(type) ?? 0,
    amount: (type) => ResourceManager.getAmount(type) ?? 0,
    hasUpgrade: (target, id) => UpgradeManager.isAcquired(target, id) ?? false,
    owned: (building) => BuildingManager.getBuilding(building)?.owned ?? 0,

    get probes() {
      return BuildingManager.buildings.reduce((sum, id) => {
        const building = BuildingManager.getBuilding(id);
        if (!building || building.data.role === 'click') return sum;
        return sum + building.owned;
      }, 0);
    },

    get planetsUnlocked() {
      return PlanetManager.planets.length;
    },

    // Phase D and beyond. Zero until then, which is why beats depending on them
    // carry no experience floor — they must not fire on a stub.
    get excess() { return 0; },
    get reserve() { return 0; },
    get cyclesLived() { return 0; },
    get planetsFinished() { return 0; },
  };
}
