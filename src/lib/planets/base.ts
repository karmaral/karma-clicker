import { type Readable, writable, readonly } from 'svelte/store';
import { Experience } from '$lib/resources/experience';
import type { PlanetData } from '$types';
import { ResourceManager } from '$lib/managers';

export default class Planet {
  subscribe: Readable<this>['subscribe'];
  #set: (value: this) => void;
  #update: (updater: (value: this) => this) => void;
  #listeners: Record<string, Array<(detail: Record<string, unknown>) => void>>;

  #id: string;
  #data: PlanetData;
  #experience: Experience;

  constructor(id: string, initData: PlanetData) {
    const store = writable(this);
    const { subscribe } = readonly(store);
    const { set, update } = store;
    this.subscribe = subscribe;
    this.#set = set;
    this.#update = update;

    this.#id = id;
    this.#data = initData;

    this.#experience = new Experience();

    this.#listeners = {}
  }

  addExperience(amount: number) {
    this.#update((self: typeof this) => {
      self.#experience.add(amount);
      return self;
    });
  }

  get experience() { return this.#experience.amount; }

  addListener(identifier: string, fn: (detail?: Record<string, unknown>) => void) {
    this.#listeners[identifier].push(fn);
  }
  removeListener(identifier: string, fn: (detail?: Record<string, unknown>) => void) {
    this.#listeners[identifier] = this.#listeners[identifier].filter(callback => callback !== fn);
  }
  #runCallbacks(identifier: string, detail?: Record<string, unknown>) {
    if (identifier in this.#listeners) {
      this.#listeners[identifier].forEach(callback => callback(detail));
    }
  }
}

