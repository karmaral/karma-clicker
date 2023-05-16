import { type Readable, writable, readonly } from 'svelte/store';
import Planet from '$lib/planets/base';

import data from '$data/planets';

class PlanetManager {
  subscribe: Readable<this>['subscribe'];
  #set: (value: this) => void;
  #update: (updater: (value: this) => this) => void;

  #selected: string;
  #inspecting: boolean;
  #planets: Record<string, Planet> = {};

  constructor() {
    const store = writable(this);
    const { subscribe } = readonly(store);
    const { set, update } = store;
    this.subscribe = subscribe;
    this.#set = set;
    this.#update = update;
  }

  unlock(target: string) {
    if (!Boolean(target in data)) return;
    if (Boolean(target in this.#planets)) return;
    const item = data[target];
    this.#update((self: typeof this) => {
      self.#planets[target] = new Planet(target, item);
      return self;
    });
  }

  select(id: string) {
    if (!Boolean(id in this.#planets)) return;
    this.#update((self: typeof this) => {
      self.#selected = id; 
      return self;
    });
  }
  setActive(id: string) {
    if (!Boolean(id in this.#planets)) return;
    this.#update((self: typeof this) => {
      self.#selected = id; 
      self.#inspecting = true;
      return self;
    });

  }
  setInspecting(value: boolean) {
    this.#update((self: typeof this) => {
      self.#inspecting = value;
      return self;
    });
  }

  getPlanet(id: string) {
    if (!Boolean(id in this.#planets)) return;
    return this.#planets[id];
  }
  getActive() {
    return this.#planets[this.#selected];
  }

  get planets() { return Object.keys(this.#planets); }
  get selected() { return this.#selected; }
  get inspecting() { return this.#inspecting; }

  addListener(target: string, listenerType: string, callback: (detail?: unknown) => void) {
    if (!Boolean(target in data)) return;
    if (!Boolean(target in this.#planets)) return; // for now, simple
    const planet = this.#planets[target];
    planet.addListener(listenerType, callback);
  }

  removeListener(target: string, listenerType: string, callback: (detail?: unknown) => void) {
    if (!Boolean(target in data)) return;
    if (!Boolean(target in this.#planets))return;
    const planet = this.#planets[target];
    planet.removeListener(listenerType, callback);
  }
}

const manager = new PlanetManager();
export default manager;
