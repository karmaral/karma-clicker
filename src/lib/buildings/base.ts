import { type Readable, writable, readonly } from 'svelte/store';
import type { BuildingData, ResourceType } from '$types';
import { ResourceManager, PlanetManager } from '$lib/managers';
import { biasedPolarity } from '$lib/utils';

export default class Building {
  subscribe: Readable<this>['subscribe'];
  #set: (value: this) => void;
  #update: (updater: (value: this) => this) => void;
  #listeners: Record<string, Array<(detail: Record<string, unknown>) => void>>;

  #id: string;
  #data: BuildingData;
  #level: number = 0;
  #levelProgress: number = 0;
  #owned: number = 0;
  #total: number = 0;
  #duration: number;
  #autonomous: boolean = false;
  #inProgress: boolean = false;
  #production: Partial<Record<ResourceType, number>> = {};

  constructor(id: string, initData: BuildingData) {
    const store = writable(this);
    const { set, update } = store;
    const { subscribe } = readonly(store);
    this.#set = set;
    this.#update = update;
    this.subscribe = subscribe;

    this.#id = id;
    this.#data = initData;
    this.#duration = initData.duration;
    this.#owned = initData.owned ?? 0;

    const {yield_type, yield_unit } = initData;
    this.#production[yield_type] = yield_unit;

    this.#listeners = {
      'level': [],
      'owned': [],
      'total': [],
      'add': [],
      'remove': [],
      'queue': [],
      'action': [],
    }
  }

  add(n: number = 1) {
    const amt = Math.trunc(n);
    this.#update((self: typeof this) =>  {
      self.#owned += amt;
      if (self.total === 0 && self.autonomous) {
        this.queueAction();
      }
      self.#total += amt;
      self.#levelProgress = self.#calcLevelProgress();
      return self;
    });

    const ownedDetail = { owned: this.#owned };
    const totalDetail = { total: this.#total };
    const addDetail = { added: amt };
    this.#runCallbacks('owned', ownedDetail);
    this.#runCallbacks('total', totalDetail);
    this.#runCallbacks('add', addDetail);

    this.#syncLevel();
  }
  remove(n: number) {
    const amt = Math.trunc(n);

    this.#update((self: typeof this) =>  {
      self.#owned -= amt;
      return self;
    });

    const ownedDetail = { owned: this.#owned };
    const removeDetail = { removed: amt };
    this.#runCallbacks('owned', ownedDetail);
    this.#runCallbacks('remove', removeDetail);
  }

  async #syncLevel() {
    const owned = this.#owned;
    const { upgrade_threshold } = this.#data;

    while (owned >= upgrade_threshold[this.#level]) {
      this.#increaseLevel();
      
      if (this.#level >= upgrade_threshold.length) {
        break;
      }
    }
  }
  #increaseLevel() {
    this.#update((self: typeof this) => {
      const { yield_multiplier, duration_reduction } = this.#data;
      self.#level++;
      Object.keys(self.#production).forEach(res => {
        const unitYield = self.#production[res];
        self.#production[res] = unitYield + unitYield * yield_multiplier;
      });
      const duration = self.duration;
      self.#duration = duration - duration * duration_reduction;
      return self;
    });

    const detail = { level: this.#level };
    this.#runCallbacks('level', detail);
  }

  queueAction() {
    this.#update((self: typeof this) => {
      this.#inProgress = true;
      return self;
    });

    const duration = this.#duration;
    if (!duration) {
      this.executeAction();
    } else {
      setTimeout(() => this.executeAction(), duration);
      // when duration becomes ridiculously small, probably just tick by seconds
    }

    const queueDetail = { duration };
    this.#runCallbacks('queue', queueDetail);
  }
  executeAction() {
    this.#generateResources();
    this.#runCallbacks('action');

    this.#update((self: typeof this) => {
      this.#inProgress = false;
      return self;
    });

    if (this.autonomous) {
      this.queueAction();
    }
  }
  #generateResources() {
    const resources = Object.keys(this.#production);
    resources.forEach((type: ResourceType) => {
      const unitYield = this.#production[type];
      let value = unitYield * this.#owned; // + effects bonuses, eventually

      if (type.startsWith('karma')) {
        const { polarity_multiplier, polarity_bias } = this.#data;
        value = value * polarity_multiplier;

        const polarity = biasedPolarity(polarity_bias);
        const t = `karma_${polarity > 0 ? 'positive' : 'negative'}` as ResourceType;

        const zealot = Math.abs(polarity_bias) > 1;
        if (zealot) {
          const rnd = biasedPolarity(0);
          return rnd > 0
            ? ResourceManager.add(type, value)
            : ResourceManager.remove(type, value);
        }

        return ResourceManager.add(t, value);
      }

      if (type === 'experience') {
        PlanetManager.getActive().addExperience(value);
      }

      ResourceManager.add(type, value);
    });
  }
  toggleAutonomy(toggle?: boolean) {
    this.#update((self: typeof this) => {
      self.#autonomous = toggle ?? !self.#autonomous;
      return self;
    });
    if (toggle && this.#owned) {
      this.queueAction();
    }
  }
  updateProduction(target: ResourceType, value: number) {
    if (!Boolean(target in this.#production)) return;
    this.#update((self: typeof this) => {
      self.#production[target] = value;
      return self;
    });
  }

  getCost(n: number) {
    if (n < 1) return null;
    return this.#cumulativePrice(n);
  }
  #cumulativePrice(n: number) {
    let sum = 0;
    const currentOwned = this.#owned;
    const targetOwned = this.#owned + n;
    const { cost_multiplier: mult, cost } = this.#data;
    for (let i = currentOwned + 1; i <= targetOwned; i++) {
      sum += cost * Math.pow(mult, i) / mult;
    }
    return sum;
  }

  #calcLevelProgress() {
    const lvl = this.#level;
    const q = this.#owned;
    const threshold = this.#data.upgrade_threshold;
    const from = lvl > 0
      ? threshold[lvl - 1]
      : 0;
    const next = threshold[lvl];
    if (!next) return 100;

    const progress = (q - from) / (next - from) * 100;
    return progress % 100;
  }

  get id() { return this.#id; }
  get data() { return this.#data; }
  get level() { return this.#level; }
  get levelProgress() { return this.#levelProgress; }
  get owned() { return this.#owned; }
  get total() { return this.#total; }
  get production() { return this.#production; }
  get duration() { return this.#duration; }
  get autonomous() { return this.#autonomous; }
  get inProgress() { return this.#inProgress; }
  get currentThreshold() {
    const lvl = this.#level;
    const threshold = this.#data.upgrade_threshold;
    return lvl < threshold.length ? threshold[lvl] : 1;
  }
  get nextUntilThreshold() { 
    const lvl = this.#level;
    const threshold = this.#data.upgrade_threshold;
    return lvl < threshold.length 
      ? threshold[lvl] - this.#owned
      : 1;
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

