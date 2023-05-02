import { type Readable, writable, readonly } from 'svelte/store';
import data from '$data/upgrades';

class EffectManager {
  subscribe: Readable<this>['subscribe'];
  #set: (value: this) => void;
  #update: (updater: (value: this) => this) => void;
  #listeners: Record<string, Array<(detail: Record<string, unknown>) => void>>;

  constructor() {
    const store = writable(this);
    const { subscribe } = readonly(store);
    const { set, update } = store;
    this.subscribe = subscribe;
    this.#set = set;
    this.#update = update;

    this.#listeners = {
      'add': [],
    }
    Object.keys(data).forEach(name => {
      this.#effects[name] = { unitYield: 1 };
    });
  }
  
  get effects() {
    return this.#effects;
  }


  get(target: string, property: string): number {
    if (!Boolean(target in this.#effects)) return;
    if (!Boolean(property in this.#effects[target])) return;
    return this.#effects[target][property];
  }
  addEffect(target: string, effect: string) {
    if (!Boolean(target in this.#effects)) return;
    this.update((self: typeof this) => {
      const unitYield = self.#effects[target].unitYield as number;
      self.#effects[target].unitYield = self.#processEffect(effect, unitYield);

      return self;
    });

    const addDetail = { target, effect };
    this.runCallbacks('add', addDetail);
  }
  #processEffect(effect: string, value: number) {
    if (effect.includes('unitYield')) {
      const run = effect.replace('unitYield', String(value));
      return eval(run);
    }
  }

  addListener(identifier: string, fn: (detail?: Record<string, unknown>) => void) {
    this.#listeners[identifier].push(fn);
  }
  removeListener(identifier: string, fn: (detail?: Record<string, unknown>) => void) {
    this.#listeners[identifier] = this.#listeners[identifier].filter(callback => callback !== fn);
  }
  private runCallbacks(identifier: string, detail?: Record<string, unknown>) {
    if (identifier in this.#listeners) {
      this.#listeners[identifier].forEach(callback => callback(detail));
    }
  }

}

const manager = new EffectManager();
export default manager;
