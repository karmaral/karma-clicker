import { type Readable, writable } from 'svelte/store';
import type { ResourceType } from '$types';
import data from '$data/upgrades';
import { ResourceManager, EffectManager, BuildingManager } from '$lib/managers';

const upgradeMap = {};
Object.keys(data).forEach(name => {
  upgradeMap[name] = {};
  data[name].forEach(upg => {
    upgradeMap[name][upg.id] = upg;
  });
});

class UpgradeManager {
  subscribe: Readable<this>['subscribe'];
  set: (value: this) => void;
  update: (updater: (value: this) => this) => void;
  #upgrades: Record<string, string[]> = {};

  constructor() {
    const { subscribe, set, update } = writable(this);
    this.subscribe = subscribe;
    this.set = set;
    this.update = update;
    Object.keys(data).forEach(name => {
      this.#upgrades[name] = [];
    });
  }

  isLocked(target: string, id: string) {
    if (!Boolean(target in this.#upgrades)) return;
    const item = data[target].find(i => i.id === id);
    if (!item) return;
    
    const { unlock_type, unlocks_at } = item;
    const total = ResourceManager.getTotal(unlock_type);

    return total < unlocks_at;
  }

  isAcquired(target: string, id: string) {
    if (!Boolean(target in this.#upgrades)) return;
    return this.#upgrades[target].includes(id);
  }

  purchase(target: string, id: string) {
    if (!Boolean(target in this.#upgrades)) return;
    if (this.#upgrades[target].includes(id)) return;

    const item = upgradeMap[target][id];
    if (!item) return;

    const { cost, cost_type } = item;

    const amount = ResourceManager.getAmount(cost_type);
    if (amount >= cost) {
      ResourceManager.remove(cost_type, cost);
      this.acquire(target, id);
      return true;
    }
  }

  acquire(target: string, id: string) {
    console.log('upgradeManager acquire',{ target, id, this: this, upgradeMap });
    if (!Boolean(target in this.#upgrades)) return;
    if (this.#upgrades[target].includes(id)) return;

    const item = upgradeMap[target][id];
    if (!item) return;

    this.update((self: typeof this) => {
      self.#upgrades[target].push(id);
      return self;
    });

    const { effect, effect_target } = item;
    if (effect) {
      this.#handleEffect(target, effect, effect_target);
    }
    // run callback?
  }
  #handleEffect(target: string, effect: string, effectTarget?: ResourceType) {
    if (!Boolean(target in this.#upgrades)) return;
    const building = BuildingManager.getBuilding(target);

    switch (effect) {
      case 'unlock':
        return BuildingManager.unlock(target);
      case 'autonomy':
        return BuildingManager.getBuilding(target).toggleAutonomy(true);
      default: break;
    }

    if (effect.includes('unitYield')) {
      if (effectTarget) {
        const unitYield = building.production[effectTarget];
        const value = eval(effect.replace('unitYield', String(unitYield)));
        building.updateProduction(effectTarget, value);
      }
    }

    
  }
}

const manager = new UpgradeManager();
export default manager;
