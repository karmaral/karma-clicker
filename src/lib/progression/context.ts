import type { ResourceType } from '$types';
import { ResourceManager, BuildingManager, UpgradeManager, PlanetManager } from '$lib/managers';

export interface TriggerContext {
  total(type: ResourceType): number;
  amount(type: ResourceType): number;
  hasUpgrade(target: string, id: string): boolean;
  getCount(building: string): number;
  /** Probes owned across every probe-role building. */
  readonly totalSouls: number;
  /**
   * Unpaired karma as a fraction of the active planet's wall. `undefined` while
   * unbuilt — a zero would read as "clean enough" and open beat 9.
   */
  readonly excess: number | undefined;
  /** Probes held back from incarnating — anchoring, then clearing. Not built yet. */
  readonly reserve: number;
  readonly planetsUnlocked: number;
  readonly activePlanetAgesLived: number;
  /** Planets left for good. The departure, not its ongoing arrivals. Not built yet. */
  readonly planetsFinished: number;
}

export function createTriggerContext(): TriggerContext {
  return {
    total: (type) => ResourceManager.getTotal(type) ?? 0,
    amount: (type) => ResourceManager.getAmount(type) ?? 0,
    hasUpgrade: (target, id) => UpgradeManager.isAcquired(target, id) ?? false,
    getCount: (building) => BuildingManager.getBuilding(building)?.count ?? 0,

    get totalSouls() {
      return BuildingManager.buildings.reduce((sum, id) => {
        const building = BuildingManager.getBuilding(id);
        if (!building || building.data.role === 'click') return sum;
        return sum + building.count;
      }, 0);
    },

    get planetsUnlocked() {
      return PlanetManager.planets.length;
    },

    get activePlanetAgesLived() {
      return PlanetManager.getActive()?.agesLived ?? 0;
    },

    // Phase D and beyond. Zero until then, which is why beats depending on them
    // carry no experience floor — they must not fire on a stub.
    get excess() { return undefined; },
    get reserve() { return 0; },
    get planetsFinished() { return 0; },
  };
}
