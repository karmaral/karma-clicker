import { type Readable, writable, get, readonly, derived } from 'svelte/store';
import { Experience } from '$lib/resources/experience';
import Karma from '$lib/resources/karma';
import type { PlanetData, Polarity } from '$types';
import { ResourceManager } from '$lib/managers';
import { getPolarityLabel } from '$lib/utils';

export default class Planet {
  subscribe: Readable<this>['subscribe'];
  #set: (value: this) => void;
  #update: (updater: (value: this) => this) => void;
  #listeners: Record<string, Array<(detail: Record<string, unknown>) => void>>;

  #id: string;
  #data: PlanetData;
  #experience: Experience;
  #karma: { 
    positive: Karma 
    negative: Karma,
    combined: Readable<number>;
  };

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
    this.#karma = {
      negative: new Karma(-1),
      positive: new Karma(1),
      combined: undefined,
    };
    this.#karma.combined = derived<Array<Karma>, number>(
      [this.#karma.negative, this.#karma.positive],
      ($values: Karma[], set) => { 
        set($values[0].amount + $values[1].amount); 
      }
    );

    this.#listeners = {}
  }

  addExperience(amount: number) {
    this.#update((self: typeof this) => {
      self.#experience.add(amount);
      return self;
    });
  }
  addKarma(amount: number, polarity: Polarity) {
    const p = getPolarityLabel(polarity);
    this.#update((self: typeof this) => {
      self.#karma[p].add(amount);
      return self;
    });
  }
  removeKarma(amount: number, polarity: Polarity) {
    const p = getPolarityLabel(polarity);
    this.#update((self: typeof this) => {
      self.#karma[p].remove(amount);
      return self;
    });
  }

  get experience() { return this.#experience.amount; }
  get karma() { 
    return { 
    'negative': this.#karma.negative.amount,
    'positive': this.#karma.positive.amount,
    'combined': get(this.#karma.combined),
    };
  }

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

