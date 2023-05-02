import { type Readable, type Writable, writable, readonly, get } from 'svelte/store';
import { experience, karma } from '$lib/resources';
import type { ResourceType } from '$types';
import type Resource from '$lib/resources/base';
import { EffectManager } from '.';

class ResourceManager {
  subscribe: Readable<this>['subscribe'];
  #set: (value: this) => void;
  #update: (updater: (value: this) => this) => void;
  #resources: Record<string, Resource>;
  #effects: Record<string, string[]> = {};
  constructor() {
    const store = writable(this);
    const { subscribe } = readonly(store);
    const { set, update } = store;
    this.subscribe = subscribe;
    this.#set = set;
    this.#update = update;

    this.#resources = {
      'experience': experience,
      'karma': karma,
    };
    Object.keys(this.#resources).forEach(type => {
      this.#effects[type] = [];
    });
  }

  getTotal(type: ResourceType) {
    if (!Boolean(type in this.#resources)) return;
    const $res = get(this.#resources[type]);
    return $res.total;
  }

  getAmount(type: ResourceType) {
    if (!Boolean(type in this.#resources)) return;
    const $res = get(this.#resources[type]);
    return $res.amount;
  }
  has(type: ResourceType, amount?: number) {
    if (!amount) {
      // check if resource unlocked
       return;
    }
    return this.getAmount(type) >= amount;
  }
  

  add(type: ResourceType, amount: number, origin?: string) {
    if (!Boolean(type in this.#resources)) return;
    const $res = get(this.#resources[type]);

    let y = 1;
    if (origin) {
      // or whatever effects come up
      y = EffectManager.get(origin, 'multiplier') as number;
    }
    return $res.add(amount * y);
  }

  remove(type: ResourceType, amount: number) {
    if (!Boolean(type in this.#resources)) return;
    const $res = get(this.#resources[type]);
    return $res.remove(amount);
  }

  addListener(type: ResourceType, listenerType: string, callback: (detail?: unknown) => void) {
    if (!Boolean(type in this.#resources)) return;
    const $res = get(this.#resources[type]);
    $res.addListener(listenerType, callback);
  }

  removeListener(type: ResourceType, listenerType: string, callback: (detail?: unknown) => void) {
    if (!Boolean(type in this.#resources)) return;
    const $res = get(this.#resources[type]);
    $res.removeListener(listenerType, callback);
  }
}

const manager = new ResourceManager();
export default manager;
