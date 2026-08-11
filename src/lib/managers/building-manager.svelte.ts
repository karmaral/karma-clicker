import Building from '$lib/buildings/base.svelte';
import { ResourceManager } from '.';
import data from '$data/buildings';

class BuildingManager {
  #buildings: Record<string, Building> = $state({});

  purchase(target: string, quantity = 1) {
    if (!Boolean(target in data)) return;

    const { cost_type } = data[target];
    if (!this.canAfford(target, quantity)) return;

    this.unlock(target);
    const cost = this.#buildings[target].getCost(quantity);
    ResourceManager.remove(cost_type, cost);
    this.acquire(target, quantity);

    return true;
  }

  unlock(target: string) {
    if (!Boolean(target in data)) return;
    if (Boolean(target in this.#buildings)) return;

    this.#buildings[target] = new Building(target, data[target]);
  }

  acquire(target: string, quantity = 1) {
    if (!Boolean(target in data)) return;

    const building = this.#buildings[target];
    if (!building) return;

    const firstAcquire = building.count === 0;
    building.add(quantity);

    if (firstAcquire && data[target].role !== 'click') {
      building.toggleAutonomy(true);
    }
  }

  /**
   * Buildings holding souls. Filtered in by role, never by excluding the click —
   * a later role that is not souls must not fall in here by default.
   */
  #cohorts() {
    return this.buildings
      .map((id) => this.#buildings[id])
      .filter((building) => (building.data.role ?? 'soul') === 'soul');
  }

  countSouls() {
    return this.#cohorts().reduce((sum, cohort) => sum + cohort.count, 0);
  }

  /** Both polarities together — the scale, not the mix. The click is manual, so it is out. */
  countKarmaPerSecond() {
    return this.#cohorts().reduce((sum, cohort) => sum + cohort.perSecond('karma'), 0);
  }

  /**
   * One fraction taken out of every cohort, proportionally — you never choose
   * which flavour goes (CONTEXT v3 §3.3). Rounding is per cohort, so read the
   * count off `countMergeable` rather than recomputing it from the fraction.
   */
  #takeFromCohorts(mergeFraction: number) {
    const fraction = Math.max(0, Math.min(1, mergeFraction));

    return this.#cohorts()
      .map((cohort) => ({ cohort, count: Math.round(cohort.count * fraction) }))
      .filter(({ count }) => count > 0);
  }

  /** What merging at this fraction would take. The split control reads it. */
  countMergeable(mergeFraction: number) {
    return this.#takeFromCohorts(mergeFraction).reduce((sum, { count }) => sum + count, 0);
  }

  /** Merged souls stop being yours. Returns how many went. */
  mergeSouls(mergeFraction: number) {
    let merged = 0;

    this.#takeFromCohorts(mergeFraction).forEach(({ cohort, count }) => {
      cohort.remove(count);
      merged += count;
    });

    return merged;
  }

  canAfford(target: string, quantity = 1) {
    if (!Boolean(target in data)) return false;
    if (!Boolean(target in this.#buildings)) return false;

    const { cost_type } = data[target];
    const cost = this.#buildings[target].getCost(quantity);

    return ResourceManager.has(cost_type, cost);
  }

  getAffordableQuantity(target: string) {
    if (!Boolean(target in this.#buildings)) return;

    const { cost_type } = data[target];
    let q = 1;
    let cost = this.#buildings[target].getCost(q);

    while (ResourceManager.has(cost_type, cost)) {
      q++;
      cost = this.#buildings[target].getCost(q);
    }

    return q - 1;
  }

  getBuilding(id: string) {
    return this.#buildings[id];
  }

  get buildings() {
    return Object.keys(this.#buildings);
  }

  addListener(target: string, listenerType: string, callback: (detail?: Record<string, unknown>) => void) {
    this.#buildings[target]?.addListener(listenerType, callback);
  }

  removeListener(target: string, listenerType: string, callback: (detail?: Record<string, unknown>) => void) {
    this.#buildings[target]?.removeListener(listenerType, callback);
  }
}

const manager = new BuildingManager();
export default manager;
