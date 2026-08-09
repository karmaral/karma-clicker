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
