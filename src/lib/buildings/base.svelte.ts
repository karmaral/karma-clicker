import type { BuildingData, Modifier, ResourceType } from '$types';
import { ResourceManager, PlanetManager } from '$lib/managers';
import { ResourceEmitter, EMITTER_EVENTS } from '$lib/emission';
import { ModifierSet, applyOp } from '$lib/modifiers';
import { biasedPolarity } from '$lib/utils';

type Listener = (detail?: Record<string, unknown>) => void;

export default class Building {
  #id: string;
  #data: BuildingData;
  #level = $state(1);
  #levelProgress = $state(0);
  #count = $state(0);
  #total = $state(0);
  #emitter: ResourceEmitter;
  #modifiers = new ModifierSet();
  #baseProduction: Partial<Record<ResourceType, number>> = {};

  #production = $derived.by(() => {
    const { yield_multipliers = {} } = this.#data;
    const production: Partial<Record<ResourceType, number>> = {};

    Object.keys(this.#baseProduction).forEach((type: ResourceType) => {
      const multiplier = yield_multipliers[type] ?? 0;
      const leveled = Math.pow(1 + multiplier, this.#level - 1);
      const base = this.#baseProduction[type] * leveled;
      production[type] = this.#modifiers.apply(base, 'yield', type);
    });

    return production;
  });

  #duration = $derived.by(() => {
    const { duration = 0, duration_reduction = 0 } = this.#data;
    const base = duration * Math.pow(1 - duration_reduction, this.#level - 1);

    return this.#modifiers.apply(base, 'duration');
  });

  #listeners: Record<string, Listener[]> = {
    level: [],
    count: [],
    total: [],
    add: [],
    remove: [],
  };

  constructor(id: string, initData: BuildingData) {
    this.#id = id;
    this.#data = initData;
    this.#count = initData.count ?? 0;
    this.#emitter = new ResourceEmitter(
      () => this.#generateResources(),
      () => this.#duration,
    );

    this.#baseProduction = { ...initData.yields };
  }

  add(n: number = 1) {
    const amt = Math.trunc(n);
    this.#count += amt;
    if (this.#total === 0 && this.#emitter.autonomous) {
      this.queueAction();
    }
    this.#total += amt;
    this.#levelProgress = this.#calcLevelProgress();

    this.#runCallbacks('count', { count: this.#count });
    this.#runCallbacks('total', { total: this.#total });
    this.#runCallbacks('add', { added: amt });

    this.#syncLevel();
  }

  remove(n: number) {
    const amt = Math.trunc(n);
    this.#count -= amt;

    this.#runCallbacks('count', { count: this.#count });
    this.#runCallbacks('remove', { removed: amt });
  }

  #syncLevel() {
    const count = this.#count;
    const { upgrade_threshold } = this.#data;
    if (!upgrade_threshold) return;

    while (count >= upgrade_threshold[this.#level - 1]) {
      this.#increaseLevel();

      if (this.#level > upgrade_threshold.length) break;
    }
  }

  #increaseLevel() {
    this.#level++;

    this.#runCallbacks('level', { level: this.#level });
  }

  queueAction() {
    this.#emitter.queue();
  }

  executeAction() {
    this.#emitter.emit();
  }

  #generateResources() {
    const resources = Object.keys(this.#production);
    resources.forEach((type: ResourceType) => {
      const unitYield = this.#production[type];
      let value = unitYield * this.#count; // + effects bonuses, eventually

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
    this.#emitter.toggleAutonomy(toggle);

    if (toggle && this.#count) {
      this.queueAction();
    }
  }

  addModifier(modifier: Modifier) {
    if (!modifier.snapshot) {
      this.#modifiers.add(modifier);
      return;
    }

    this.#resolveSnapshot(modifier).forEach((mod) => this.#modifiers.add(mod));
  }

  /** Settles a snapshot at the factor it is worth now, one entry per resource. */
  #resolveSnapshot({ snapshot, ...modifier }: Modifier): Modifier[] {
    const { op, value, stat = 'yield' } = modifier;
    const factor = (current: number) => (current ? applyOp(current, op, value) / current : 1);

    if (stat === 'duration') {
      return [{ ...modifier, op: 'mult', value: factor(this.#duration) }];
    }

    const scope = modifier.target ?? 'all';

    return Object.keys(this.#production)
      .filter((type) => scope === 'all' || scope === type)
      .map((type: ResourceType) => ({
        ...modifier,
        target: type,
        op: 'mult' as const,
        value: factor(this.#production[type]),
      }));
  }

  removeModifier(id: string) {
    this.#modifiers.remove(id);
  }

  getCost(n: number) {
    if (n < 1) return null;

    return this.#cumulativePrice(n);
  }

  #cumulativePrice(n: number) {
    let sum = 0;
    const currentCount = this.#count;
    const targetCount = this.#count + n;
    const { cost_multiplier: mult, cost } = this.#data;
    for (let i = currentCount + 1; i <= targetCount; i++) {
      sum += cost * Math.pow(mult, i) / mult;
    }

    return sum;
  }

  #calcLevelProgress() {
    const lvl = this.#level;
    const q = this.#count;
    const threshold = this.#data.upgrade_threshold;
    if (!threshold) return 100;

    const from = lvl > 1 ? threshold[lvl - 2] : 0;
    const next = threshold[lvl - 1];
    if (!next) return 100;

    const progress = (q - from) / (next - from) * 100;

    return progress % 100;
  }

  get id() { return this.#id; }
  get data() { return this.#data; }
  get level() { return this.#level; }
  get levelProgress() { return this.#levelProgress; }
  get count() { return this.#count; }
  get total() { return this.#total; }
  get production() { return this.#production; }

  perSecond(type: ResourceType) {
    const yielded = this.#production[type] ?? 0;
    return yielded * this.#count / ((this.duration || 1000) / 1000);
  }

  get duration() { return this.#duration; }
  get modifiers() { return this.#modifiers.modifiers; }
  get autonomous() { return this.#emitter.autonomous; }
  get inProgress() { return this.#emitter.inProgress; }

  get isMaxLevel() {
    const threshold = this.#data.upgrade_threshold;
    if (!threshold) return true;

    return this.#level > threshold.length;
  }

  get currentThreshold() {
    const lvl = this.#level;
    const threshold = this.#data.upgrade_threshold;
    if (!threshold) return 1;

    return lvl <= threshold.length ? threshold[lvl - 1] : 1;
  }

  get nextUntilThreshold() {
    const lvl = this.#level;
    const threshold = this.#data.upgrade_threshold;
    if (!threshold) return 1;

    return lvl <= threshold.length
      ? threshold[lvl - 1] - this.#count
      : 1;
  }

  addListener(identifier: string, fn: Listener) {
    if (EMITTER_EVENTS.includes(identifier)) return this.#emitter.addListener(identifier, fn);

    this.#listeners[identifier].push(fn);
  }

  removeListener(identifier: string, fn: Listener) {
    if (EMITTER_EVENTS.includes(identifier)) return this.#emitter.removeListener(identifier, fn);

    this.#listeners[identifier] = this.#listeners[identifier].filter((cb) => cb !== fn);
  }

  #runCallbacks(identifier: string, detail?: Record<string, unknown>) {
    if (!(identifier in this.#listeners)) return;

    this.#listeners[identifier].forEach((callback) => callback(detail));
  }
}
