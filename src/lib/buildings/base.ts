import { type Readable, writable, readonly } from 'svelte/store';
import type { BaseResourceType, BuildingData, ResourceType } from '$types';
import { ResourceManager, PlanetManager } from '$lib/managers';
import { 
  isPolarized,
  biasedPolarity,
  getPolarityLabel,
  splitResourceString,
} from '$lib/utils';

export default class Building {
  subscribe: Readable<this>['subscribe'];
  #set: (value: this) => void;
  protected _update: (updater: (value: this) => this) => void;
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
    this._update = update;
    this.subscribe = subscribe;

    this.#id = id;
    this.#data = initData;
    this.#duration = initData.duration;
    this.#owned = initData.owned ?? 0;

    const { base_yields } = initData;
    Object.keys(base_yields).forEach((res) => {
      this.#production[res] = base_yields[res];
    });

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
    this._update((self: typeof this) =>  {
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

    this._update((self: typeof this) =>  {
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
    this._update((self: typeof this) => {
      const { duration_reduction } = this.#data;
      self.#level++;
      Object.keys(self.#production).forEach((res: ResourceType) => {
        const currentYield = self.#production[res];
        const mult = this.getYieldMultiplier(res);        
        self.#production[res] = Number((currentYield + currentYield * mult).toFixed(2));
      });
      const duration = self.duration;
      self.#duration = duration - duration * duration_reduction;
      return self;
    });

    const detail = { level: this.#level };
    this.#runCallbacks('level', detail);
  }

  queueAction() {
    this._update((self: typeof this) => {
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
    this._generateResources();
    this.#runCallbacks('action');

    this._update((self: typeof this) => {
      this.#inProgress = false;
      return self;
    });

    if (this.autonomous) {
      this.queueAction();
    }
  }
  protected _generateResources() {
    const resources = Object.keys(this.#production);
    const activePlanet = PlanetManager.getActive();
    resources.forEach((type: ResourceType) => {
      const unitYield = this.#production[type];
      let value = unitYield * this.#owned; // + effects bonuses, eventually

      if (type === 'experience') {
        activePlanet.addExperience(value);
      }

      if (isPolarized(type)) {
        const { polarity_multiplier, polarity_bias } = this.#data;
        value = value * polarity_multiplier;

        const [base] = splitResourceString(type);
        const polarity = biasedPolarity(polarity_bias);
        const p = getPolarityLabel(polarity);
        const t = `${base}_${p}` as ResourceType;

        if (this.zealot) {
          const rnd = biasedPolarity(0);
          if (rnd > 0) {
            ResourceManager.add(type, value)
            if (base === 'karma') {
              activePlanet.addKarma(value, polarity);
            }
          } else {
            ResourceManager.remove(type, value);
            if (base === 'karma') {
              activePlanet.removeKarma(value, polarity);
            }
          }
          return;
        }

        if (base === 'karma') {
          activePlanet.addKarma(value, polarity);
        }
        return ResourceManager.add(t, value);
      }

      ResourceManager.add(type, value);
    });
  }
  toggleAutonomy(toggle?: boolean) {
    this._update((self: typeof this) => {
      self.#autonomous = toggle ?? !self.#autonomous;
      return self;
    });
    if (toggle && this.#owned) {
      if (!this.inProgress) {
        this.queueAction();
      }
    }
  }
  updateProduction(target: ResourceType, value: number) {
    if (!Boolean(target in this.#production)) return;
    this._update((self: typeof this) => {
      self.#production[target] = value;
      return self;
    });
  }

  getCosts(n: number): Partial<Record<ResourceType, number>> {
    if (n < 1) return null;

    const { base_costs, cost_multipliers } = this.#data;
    const result = { ...base_costs };

    for (const type in result) {
      const c = base_costs[type];
      const m = cost_multipliers[type] || cost_multipliers['all'] || 1;
      result[type] = this.#cumulativePrice(n, c, m);
    }
    return result;
  }
  #cumulativePrice(n: number, cost: number, multiplier: number) {
    let sum = 0;
    const currentOwned = this.#owned;
    const targetOwned = this.#owned + n;
    for (let i = currentOwned + 1; i <= targetOwned; i++) {
      sum += cost * Math.pow(multiplier, i) / multiplier;
    }
    return sum;
  }
  getYieldMultiplier(resource: ResourceType | BaseResourceType) {
    const { yield_multipliers: m } = this.#data;   
    return m[resource] || m['all'] || 1;
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
  get zealot() {
    return Math.abs(this.#data.polarity_bias) > 1;
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

