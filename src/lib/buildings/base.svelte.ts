import type { BuildingData, Modifier, ModifierStat, ResourceType, YieldType } from '$types';
import { ResourceManager, PlanetManager } from '$lib/managers';
import { ResourceEmitter, EMITTER_EVENTS } from '$lib/emission';
import { ModifierSet } from '$lib/modifiers';
import { aim, type ResolvedAim } from '$lib/aim';

type Listener = (detail?: Record<string, unknown>) => void;

export default class Building {
  #id: string;
  #data: BuildingData;
  #count = $state(0);
  #total = $state(0);
  #emitter: ResourceEmitter;
  #modifiers = new ModifierSet();
  #baseProduction: Partial<Record<YieldType, number>> = {};

  /**
   * Base and modifiers, and nothing else. A level is a purchase now, so its
   * multiplier arrives here as a `mult` modifier like any other — see
   * `cohort-levels.ts`. Nothing about production reads the count.
   */
  #production = $derived.by(() => {
    const production: Partial<Record<YieldType, number>> = {};

    Object.keys(this.#baseProduction).forEach((type: YieldType) => {
      production[type] = this.#modifiers.apply(this.#baseProduction[type], 'yield', type);
    });

    return production;
  });

  // `.by`, not the expression form: a field initializer runs before the
  // constructor, and `#data` is not assigned until it does.
  #duration = $derived.by(() => this.#modifiers.apply(this.#data.duration ?? 0, 'duration'));

  #listeners: Record<string, Listener[]> = {
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
    if (this.#total === 0 && this.#emitter.isAutonomous) {
      this.queueAction();
    }
    this.#total += amt;

    this.#runCallbacks('count', { count: this.#count });
    this.#runCallbacks('total', { total: this.#total });
    this.#runCallbacks('add', { added: amt });
  }

  remove(n: number) {
    const amt = Math.trunc(n);
    this.#count -= amt;

    this.#runCallbacks('count', { count: this.#count });
    this.#runCallbacks('remove', { removed: amt });
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
    const { positive, negative } = this.#splitKarma(value, aim.resolve(this.#data));

    if (positive > 0) {
      ResourceManager.add('karma_positive', positive);
    }

    if (negative > 0) {
      ResourceManager.add('karma_negative', negative);
    }
  }

  /** Both piles per second. `count` prices a purchase you have not made. */
  karmaPerSecond(count?: number) {
    return this.#splitKarma(this.perSecond('karma', count), aim.resolve(this.#data));
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

  /**
   * A stat of this building's own that is neither its yields nor its clock —
   * those two are already derived. For a subclass holding an axis the base has
   * no opinion about; `#modifiers` stays private either way.
   */
  modify(base: number, stat: ModifierStat) {
    return this.#modifiers.apply(base, stat);
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

  get #gates() { return this.#data.upgrade_threshold ?? []; }

  get id() { return this.#id; }
  get data() { return this.#data; }
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

  /**
   * What one emission actually pays out — the same expression `#generateResources`
   * spends, so a readout cannot drift from the ledger. `production` is the base
   * and its modifiers and stops short of `yieldScale`, which is the half that
   * moves under the harness; anything printing a payout wants this instead.
   */
  payout(type: YieldType, count = this.#count) {
    return (this.#production[type] ?? 0) * this.activeAt(count) * this.yieldScale;
  }

  perSecond(type: YieldType, count = this.#count) {
    const yielded = this.#production[type] ?? 0;
    return yielded * this.activeAt(count) * this.yieldScale / ((this.duration || 1000) / 1000);
  }

  get duration() { return this.#duration; }
  get modifiers() { return this.#modifiers.modifiers; }
  get isAutonomous() { return this.#emitter.isAutonomous; }
  get isInProgress() { return this.#emitter.isInProgress; }

  /**
   * Gates the count has passed — which level upgrades are *unlocked*, not which
   * are owned. It falls with a merge, and what it gates re-locks with it. Every
   * question about the run to the next gate is asked of this; nothing prints it.
   */
  get #gatesPassed() { return this.#gates.filter((gate) => this.#count >= gate).length; }

  /**
   * Levels bought — you are the tier you paid for, not the tier you walked past.
   * Counted off the modifiers rather than asked of `UpgradeManager`, which
   * imports us: an id is `level_N:index`, so the distinct `level_N` are the rungs
   * held. A release takes its modifiers, so a merge takes the tier with them.
   */
  get tier() {
    const held = this.#modifiers.modifiers
      .map((modifier) => modifier.id.split(':')[0])
      .filter((id) => id.startsWith('level_'));

    return new Set(held).size;
  }

  get isMaxLevel() { return this.#gatesPassed >= this.#gates.length; }

  /** The count the next gate wants. 1 past the last, so `Next` still buys one. */
  get currentThreshold() { return this.#gates[this.#gatesPassed] ?? 1; }

  get nextUntilThreshold() {
    return this.isMaxLevel ? 1 : this.#gates[this.#gatesPassed] - this.#count;
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
