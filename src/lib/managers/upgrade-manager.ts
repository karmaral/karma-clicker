import { type Readable, writable } from 'svelte/store';
import data from '$data/upgrades';
import { ResourceManager, EffectManager } from '$lib/managers';

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

    const { effect } = item;
    if (effect) {
      EffectManager.addEffect(target, effect);
    }

    // run callback?
  }
}

const manager = new UpgradeManager();
export default manager;
