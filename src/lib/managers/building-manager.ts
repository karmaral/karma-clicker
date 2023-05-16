import { type Readable, writable, readonly } from 'svelte/store';
import Building from '$lib/buildings/base';
import { ResourceManager } from '.';

import data from '$data/buildings';

class BuildingManager {
  subscribe: Readable<this>['subscribe'];
  #set: (value: this) => void;
  #update: (updater: (value: this) => this) => void;

  #buildings: Record<string, Building> = {};

  constructor() {
    const store = writable(this);
    const { subscribe } = readonly(store);
    const { set, update } = store;
    this.subscribe = subscribe;
    this.#set = set;
    this.#update = update;
  }

  purchase(target: string, quantity = 1) {
    if (!Boolean(target in data)) return;

    const item = data[target];
    const { cost_type } = item;

    const canAfford = this.canAfford(target, quantity);
    if (canAfford) {
      this.unlock(target);
      const cost = this.#buildings[target].getCost(quantity);
      ResourceManager.remove(cost_type, cost);

      this.acquire(target, quantity);
      return true;
    }
  }
  unlock(target: string) {
    if (!Boolean(target in data)) return;
    if (Boolean(target in this.#buildings)) return;
    const item = data[target];
    this.#update((self: typeof this) => {
      self.#buildings[target] = new Building(target, item);
      return self;
    });
  }
  acquire(target: string, quantity = 1) {
    if (!Boolean(target in data)) return;

    const building = this.#buildings[target];
    building.add(quantity);

    // this.#update((self: typeof this) => {
    //   self.#buildings[target].push(id);
    //   return self;
    // });

    // const { effect } = item;
    // if (effect) {
    //   EffectManager.addEffect(target, effect);
    // }

    // run callback?
  }

  canAfford(target: string, quantity = 1) {
    if (!Boolean(target in data)) return false;

    const item = data[target];
    const { cost_type } = item;

    // multi costs will come later
    const cost = this.#buildings[target].getCost(quantity);
    return ResourceManager.has(cost_type, cost);
  }
  getAffordableQuantity(target: string) {
    if (!Boolean(target in data)) return;
    
    const item = data[target];
    const { cost_type } = item;
    let q = 1;
    let cost = this.#buildings[target].getCost(q);

    while (ResourceManager.has(cost_type, cost)) {
      q++;
      cost = this.#buildings[target].getCost(q);
    }
    return q - 1;
  }

  getBuilding(id: string) {
    if (!Boolean(id in this.#buildings)) return;
    return this.#buildings[id];
  }
  get buildings() {
    return Object.keys(this.#buildings);
  }

  // #add(quantity: number) {
  //   const $res = get(this.#resources[type]);
  //
  //   let y = 1;
  //   if (origin) {
  //     // or whatever effects come up
  //     y = EffectManager.get(origin, 'multiplier') as number;
  //   }
  //   return $res.add(amount * y);
  // }

  // remove(type: ResourceType, amount: number) {
  //   if (!Boolean(type in this.#resources)) return;
  //   const $res = get(this.#resources[type]);
  //   return $res.remove(amount);
  // }

  addListener(target: string, listenerType: string, callback: (detail?: unknown) => void) {
    if (!Boolean(target in data)) return;
    if (!Boolean(target in this.#buildings)) return; // for now, simple
    const building = this.#buildings[target];
    building.addListener(listenerType, callback);
  }

  removeListener(target: string, listenerType: string, callback: (detail?: unknown) => void) {
    if (!Boolean(target in data)) return;
    if (!Boolean(target in this.#buildings))return;
    const building = this.#buildings[target];
    building.removeListener(listenerType, callback);
  }
}

const manager = new BuildingManager();
export default manager;
