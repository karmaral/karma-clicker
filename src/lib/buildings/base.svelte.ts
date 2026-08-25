import type { BuildingData, Modifier, ResourceType, YieldType } from '$types';
import { ResourceManager, PlanetManager } from '$lib/managers';
import { ResourceEmitter, EMITTER_EVENTS } from '$lib/emission';
import { ModifierSet } from '$lib/modifiers';
import { aim, type Detent, type ResolvedAim } from '$lib/aim';

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
  #baseProduction: Partial<Record<YieldType, number>> = {};

  #production = $derived.by(() => {
    const { yield_multipliers = {} } = this.#data;
    const production: Partial<Record<YieldType, number>> = {};

    Object.keys(this.#baseProduction).forEach((type: YieldType) => {
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
    this.#syncLevel();
  }

  add(n: number = 1) {
    const amt = Math.trunc(n);
    this.#count += amt;
    if (this.#total === 0 && this.#emitter.isAutonomous) {
      this.queueAction();
    }
    this.#total += amt;

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

    this.#syncLevel();
  }

  /** The level a count has earned. Thresholds ascend, so crossings are the level. */
  #levelFor(count: number) {
    const { upgrade_threshold } = this.#data;
    if (!upgrade_threshold) return this.#level;

    return upgrade_threshold.filter((threshold) => count >= threshold).length + 1;
  }

  /** Both ways — merged souls take their level with them, so a cohort can fall. */
  #syncLevel() {
    const level = this.#levelFor(this.#count);
    const changed = level !== this.#level;

    this.#level = level;
    this.#levelProgress = this.#calcLevelProgress();

    if (changed) {
      this.#runCallbacks('level', { level });
    }
  }

  queueAction() {
    this.#emitter.queue();
  }

  executeAction() {
    this.#emitter.emit();
  }

  #generateResources() {
    Object.keys(this.#production).forEach((type: YieldType) => {
      const value = this.#production[type] * this.active * this.yieldScale;

      if (type === 'karma') {
        this.#payKarma(value);
        return;
      }

      if (type === 'experience') {
        PlanetManager.getActive()?.addExperience(value);
      }

      ResourceManager.add(type as ResourceType, value);
    });
  }

  /** Aim sets the mix; the wave sets what each side of it is worth. */
  #splitKarma(value: number, { positiveShare, karmaYieldFactor }: ResolvedAim) {
    const planet = PlanetManager.getActive();
    const earned = value * karmaYieldFactor;

    return {
      negative: earned * (1 - positiveShare) * (planet?.bias(false) ?? 1),
      positive: earned * positiveShare * (planet?.bias(true) ?? 1),
    };
  }

  #payKarma(value: number) {
    const { positive, negative } = this.#splitKarma(value, aim.resolve(this.#id, this.#data));

    if (positive > 0) {
      ResourceManager.add('karma_positive', positive);
    }

    if (negative > 0) {
      ResourceManager.add('karma_negative', negative);
    }
  }

  /**
   * Both piles per second, off the settled aim so the figure does not churn with
   * drift. `detent` prices an aim you have not set — the row's arrow reads Even;
   * `count` prices a purchase you have not made.
   */
  karmaPerSecond(detent?: Detent, count?: number) {
    const resolved = aim.resolveSettled(this.#id, this.#data, detent);

    return this.#splitKarma(this.perSecond('karma', count), resolved);
  }

  toggleAutonomy(toggle?: boolean) {
    this.#emitter.toggleAutonomy(toggle);

    if (toggle && this.#count) {
      this.queueAction();
    }
  }

  addModifier(modifier: Modifier) {
    this.#modifiers.add(modifier);
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

    return (q - from) / (next - from) * 100;
  }

  get id() { return this.#id; }
  get data() { return this.#data; }
  get level() { return this.#level; }
  get levelProgress() { return this.#levelProgress; }
  get count() { return this.#count; }
  get total() { return this.#total; }
  get production() { return this.#production; }

  /**
   * How many of a count would be producing. Subclasses may hold some back, which
   * is the whole reason this takes a count instead of reading one — pricing a
   * purchase asks what the *next* count would earn, and only the class knows how
   * much of it works.
   */
  activeAt(count: number) { return count; }

  /** How many of the count are producing. */
  get active() { return this.activeAt(this.#count); }

  /**
   * What every yield is multiplied by after the count is settled. 1 here for the
   * same reason `activeAt` is identity: the base states the general case, and a
   * subclass that answers to something outside itself narrows it. Read in the
   * payout and in `perSecond` both, so the readout cannot drift from the ledger.
   */
  get yieldScale() { return 1; }

  perSecond(type: YieldType, count = this.#count) {
    const yielded = this.#production[type] ?? 0;
    return yielded * this.activeAt(count) * this.yieldScale / ((this.duration || 1000) / 1000);
  }

  get duration() { return this.#duration; }
  get modifiers() { return this.#modifiers.modifiers; }
  get isAutonomous() { return this.#emitter.isAutonomous; }
  get isInProgress() { return this.#emitter.isInProgress; }

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
