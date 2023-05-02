import { type Readable, writable, readonly } from 'svelte/store';
import type { BuildingData, ResourceType } from '$types';
import { ResourceManager } from '$lib/managers';

export default class Building {
  subscribe: Readable<this>['subscribe'];
  #set: (value: this) => void;
  #update: (updater: (value: this) => this) => void;
  #listeners: Record<string, Array<(detail: Record<string, unknown>) => void>>;

  #id: string;
  #data: BuildingData;
  #level: number = 0;
  #levelProgress: number = 0;
  #quantity: number = 0;
  #total: number = 0;
  #duration: number;
  #unitYield: number;
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
    this.#quantity = initData.quantity ?? 0;

    const {yield_type, yield_unit } = initData;
    this.#unitYield = yield_unit;
    this.#production[yield_type] = yield_unit;

    this.#listeners = {
      'level': [],
      'quantity': [],
      'total': [],
      'add': [],
      'remove': [],
      'queue': [],
      'action': [],
    }
  }

  add(n: number) {
    const amt = Math.trunc(n);

    this.#update((self: typeof this) =>  {
      self.#quantity += amt;
      self.#total += amt;
      self.#levelProgress = self.#calcLevelProgress();
      return self;
    });

    const quantityDetail = { quantity: this.#quantity };
    const totalDetail = { total: this.#total };
    const addDetail = { added: amt };
    this.#runCallbacks('quantity', quantityDetail);
    this.#runCallbacks('total', totalDetail);
    this.#runCallbacks('add', addDetail);

    this.#syncLevel();
  }
  remove(n: number) {
    const amt = Math.trunc(n);

    this.#update((self: typeof this) =>  {
      self.#quantity -= amt;
      return self;
    });

    const quantityDetail = { quantity: this.#quantity };
    const removeDetail = { removed: amt };
    this.#runCallbacks('quantity', quantityDetail);
    this.#runCallbacks('remove', removeDetail);
  }

  async #syncLevel() {
    const quantity = this.#quantity;
    const { upgrade_cost } = this.#data;

    while (quantity >= upgrade_cost[this.#level]) {
      this.#increaseLevel();
      
      if (this.#level >= upgrade_cost.length) {
        break;
      }
    }
  }
  #increaseLevel() {
    this.#update((self: typeof this) => {
      const unitYield = self.unitYield;
      const duration = self.duration;
      const { yield_multiplier, duration_reduction } = this.#data;
      self.#level++;
      self.#unitYield = unitYield + unitYield * yield_multiplier;
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
    this.#addResources();
    this.#runCallbacks('action');

    this.#update((self: typeof this) => {
      this.#inProgress = false;
      return self;
    });

    if (this.autonomous) {
      this.queueAction();
    }
  }
  #addResources() {
    const resources = Object.keys(this.#production);
    resources.forEach((type: ResourceType) => {
      const unitYield = this.#production[type];
      const value = unitYield * this.#quantity; // + effects bonuses, eventually
      ResourceManager.add(type, value);
    });
  }
  toggleAutonomy(value?: boolean) {
    this.#update((self: typeof this) => {
      self.#autonomous = value ?? !self.#autonomous;
      return self;
    });
    if (value) {
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
    return this.#cost(n);
  }
  #cost(n: number) {
    const q = n + (this.#quantity ?? 1); // this smells, check
    return this.#data.cost * (1 + this.#data.cost_multiplier) ** (q - 1);
  }

  #calcLevelProgress() {
    const lvl = this.#level;
    const q = this.#quantity;
    const data = this.#data;
    const from = lvl > 0
      ? data.upgrade_cost[lvl - 1]
      : 0;
    const next = data.upgrade_cost[lvl];
    if (!next) return 100;

    const progress = (q - from) / (next - from) * 100;
    return progress % 100;
  }
  get id() { return this.#id; }
  get data() { return this.#data; }
  get level() { return this.#level; }
  get levelProgress() { return this.#levelProgress; }
  get quantity() { return this.#quantity; }
  get total() { return this.#total; }
  get production() { return this.#production; }
  get duration() { return this.#duration; }
  get unitYield() { return this.#unitYield; }
  get autonomous() { return this.#autonomous; }
  get inProgress() { return this.#inProgress; }

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

