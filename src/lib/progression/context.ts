import type { ResourceType } from '$types';
import { ResourceManager, BuildingManager, UpgradeManager, PlanetManager } from '$lib/managers';
import { getExcess } from '$lib/excess';
import { prestige } from '$lib/prestige.svelte';
import { refinery } from '$lib/refinery.svelte';

export interface TriggerContext {
  total(type: ResourceType): number;
  amount(type: ResourceType): number;
  hasUpgrade(target: string, id: string): boolean;
  getCount(building: string): number;
  /** Souls owned across every soul-role building. */
  readonly totalSouls: number;
  /** Signed: negative is Burden, positive is Comfort. `undefined` before any karma. */
  readonly excess: number | undefined;
  /** Whether the active planet's own conditions are all met. It sets them, not the beat. */
  readonly isActivePlanetHarvestable: boolean;
  /** Souls the split holds back, phase or no phase — see `countHeldBySplit`. */
  readonly reserve: number;
  /** Crimson per karma. Crosses 1.0 once the refinery stops being lossy — see `milestones.ts`. */
  readonly refineryRatio: number;
  readonly planetsUnlocked: number;
  readonly planetsFinished: number;
  /** Whether ending the run would bank a whole wisdom. The subject is the run. */
  readonly leavesLegacy: boolean;
}

export function createTriggerContext(): TriggerContext {
  return {
    total: (type) => ResourceManager.getTotal(type) ?? 0,
    amount: (type) => ResourceManager.getAmount(type) ?? 0,
    hasUpgrade: (target, id) => UpgradeManager.isAcquired(target, id) ?? false,
    getCount: (building) => BuildingManager.getBuilding(building)?.count ?? 0,

    get totalSouls() {
      return BuildingManager.countSouls();
    },

    get planetsUnlocked() {
      return PlanetManager.planets.length;
    },

    get excess() { return getExcess(); },

    get isActivePlanetHarvestable() {
      return PlanetManager.getActive()?.isFirstHarvestReady ?? false;
    },

    get planetsFinished() {
      return PlanetManager.finished;
    },

    get reserve() { return BuildingManager.countHeldBySplit(); },

    get refineryRatio() { return refinery.ratio; },

    get leavesLegacy() { return prestige.isOpen; },
  };
}
