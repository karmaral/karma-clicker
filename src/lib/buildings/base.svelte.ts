import type { BuildingData, ResourceType } from '$types';
import { ResourceManager, PlanetManager } from '$lib/managers';
import { biasedPolarity } from '$lib/utils';

type Listener = (detail?: Record<string, unknown>) => void;

export default class Building {
  #id: string;
  #data: BuildingData;
  #level = $state(0);
  #levelProgress = $state(0);
  #owned = $state(0);
  #total = $state(0);
  #duration = $state(0);
  #autonomous = $state(false);
  #inProgress = $state(false);
  #production: Partial<Record<ResourceType, number>> = $state({});

  #listeners: Record<string, Listener[]> = {
    level: [],
    owned: [],
    total: [],
    add: [],
    remove: [],
    queue: [],
    action: [],
  };

  constructor(id: string, initData: BuildingData) {
    this.#id = id;
    this.#data = initData;
    this.#duration = initData.duration;
    this.#owned = initData.owned ?? 0;

    const { yield_type, yield_unit } = initData;
    this.#production[yield_type] = yield_unit;
  }

  add(n: number = 1) {
    const amt = Math.trunc(n);
    this.#owned += amt;
    if (this.#total === 0 && this.#autonomous) {
      this.queueAction();
    }
    this.#total += amt;
    this.#levelProgress = this.#calcLevelProgress();

    this.#runCallbacks('owned', { owned: this.#owned });
    this.#runCallbacks('total', { total: this.#total });
    this.#runCallbacks('add', { added: amt });

    this.#syncLevel();
  }

  remove(n: number) {
    const amt = Math.trunc(n);
    this.#owned -= amt;

    this.#runCallbacks('owned', { owned: this.#owned });
    this.#runCallbacks('remove', { removed: amt });
  }

  #syncLevel() {
    const owned = this.#owned;
    const { upgrade_threshold } = this.#data;
    if (!upgrade_threshold) return;

    while (owned >= upgrade_threshold[this.#level]) {
      this.#increaseLevel();

      if (this.#level >= upgrade_threshold.length) break;
    }
  }

  #increaseLevel() {
    const { yield_multiplier, duration_reduction } = this.#data;
    this.#level++;
    Object.keys(this.#production).forEach((res: ResourceType) => {
      const unitYield = this.#production[res];
      this.#production[res] = unitYield + unitYield * yield_multiplier;
    });
    this.#duration = this.#duration - this.#duration * duration_reduction;

    this.#runCallbacks('level', { level: this.#level });
  }

  queueAction() {
    this.#inProgress = true;

    const duration = this.#duration;
    if (!duration) {
      this.executeAction();
    } else {
      setTimeout(() => this.executeAction(), duration);
      // when duration becomes ridiculously small, probably just tick by seconds
    }

    this.#runCallbacks('queue', { duration });
  }

  executeAction() {
    this.#generateResources();
    this.#runCallbacks('action');

    this.#inProgress = false;

    if (this.#autonomous) {
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
    this.#autonomous = toggle ?? !this.#autonomous;

    if (toggle && this.#owned) {
      this.queueAction();
    }
  }

  updateProduction(target: ResourceType, value: number) {
    if (!Boolean(target in this.#production)) return;

    this.#production[target] = value;
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
    if (!threshold) return 100;

    const from = lvl > 0 ? threshold[lvl - 1] : 0;
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

  addListener(identifier: string, fn: Listener) {
    this.#listeners[identifier].push(fn);
  }

  removeListener(identifier: string, fn: Listener) {
    this.#listeners[identifier] = this.#listeners[identifier].filter((cb) => cb !== fn);
  }

  #runCallbacks(identifier: string, detail?: Record<string, unknown>) {
    if (!(identifier in this.#listeners)) return;

    this.#listeners[identifier].forEach((callback) => callback(detail));
  }
}
