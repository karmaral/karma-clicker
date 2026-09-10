import type { BuildingData, Modifier, ModifierStat, ResourceType, YieldType } from '$types';
import { ResourceManager, PlanetManager } from '$lib/managers';
import { ResourceEmitter, EMITTER_EVENTS } from '$lib/emission';
import { ModifierSet } from '$lib/modifiers';
import { aim, type ResolvedAim } from '$lib/aim';

type Listener = (detail?: Record<string, unknown>) => void;

export interface BuildingSnapshot {
  count: number;
  total: number;
  isAutonomous: boolean;
}

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
   *
   * `extra` is the projection channel every readout below carries: modifiers
   * not held, priced as if they were. Nothing is added or removed to answer it.
   */
  productionWith(extra: Modifier[] = []) {
    const production: Partial<Record<YieldType, number>> = {};

    Object.keys(this.#baseProduction).forEach((type: YieldType) => {
      production[type] = this.#modifiers.apply(this.#baseProduction[type], 'yield', type, extra);
    });

    return production;
  }

  durationWith(extra: Modifier[] = []) {
    return this.#modifiers.apply(this.#data.duration ?? 0, 'duration', undefined, extra);
  }

  /** The no-projection case, and the only one anything reads every frame. */
  #production = $derived.by(() => this.productionWith());

  // `.by`, not the expression form: a field initializer runs before the
  // constructor, and `#data` is not assigned until it does.
  #duration = $derived.by(() => this.durationWith());

  #listeners: Record<string, Listener[]> = {
    count: [],
    total: [],
    add: [],
    remove: [],
  };

  /**
   * When the life in progress started, in world-lived ms — so its payout can
   * average the phase bias across the whole span rather than take the instant
   * it lands. See `docs/design.md` §6, *The phase bias*.
   */
  #lifeStartedAt: number | undefined;

  constructor(id: string, initData: BuildingData) {
    this.#id = id;
    this.#data = initData;
    this.#count = initData.count ?? 0;
    this.#emitter = new ResourceEmitter(
      (lives) => this.#generateResources(lives),
      () => this.#duration,
    );

    // Both a manual send and an autonomous requeue go through the emitter's
    // own `queue`, never through this class — this is the one place both are seen.
    this.#emitter.addListener('queue', (detail) => {
      // A re-armed wait is the same life on a shorter clock, so it keeps the
      // moment it began — the bias is averaged across the span it really lived.
      if (detail?.retimed) return;

      this.#lifeStartedAt = PlanetManager.getActive()?.lived;
    });

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

  /**
   * A save writes the counts raw and stops short of starting the clock. Not
   * `add`: it auto-queues on the `#total === 0` edge and fires the `add`
   * listener, which the wiring turns into a purchase burst — a load is not a
   * purchase. The clock waits for `startEmitter`, below.
   */
  restore({ count, total, isAutonomous }: BuildingSnapshot) {
    this.#count = count;
    this.#total = total;
    this.#emitter.toggleAutonomy(isAutonomous);
  }

  /**
   * Separate from `restore` because `#duration` is a modifier away from its base
   * and the upgrades have not landed yet when the counts do — queueing there
   * would run one life at the unmodified clock.
   */
  startEmitter() {
    if (!this.#emitter.isAutonomous || !this.#count) return;

    this.queueAction();
  }

  snapshot(): BuildingSnapshot {
    return { count: this.#count, total: this.#total, isAutonomous: this.#emitter.isAutonomous };
  }

  queueAction() {
    this.#emitter.queue();
  }

  executeAction() {
    this.#emitter.emit();
  }

  /**
   * `lives` is how many of them this payout stands for — 1 for a clock you can
   * watch, and a tick's worth once the cohort streams. The phase bias is still
   * averaged across the whole span, so a batch is paid at exactly what its lives
   * were each worth as they passed.
   */
  #generateResources(lives = 1) {
    Object.keys(this.#production).forEach((type: YieldType) => {
      const value = this.#production[type] * this.active * this.yieldScale * lives;

      if (type === 'karma') {
        this.#payKarma(value);
        return;
      }

      ResourceManager.add(type as ResourceType, value);
    });
  }

  /**
   * Aim sets the mix; the wave sets what each side of it is worth. `bias` reads
   * the world for one span — the life that just paid out, or the life a preview
   * is pricing — never the instant alone.
   */
  #splitKarma(value: number, { positiveShare, karmaYieldFactor }: ResolvedAim, bias: (positive: boolean) => number) {
    const earned = value * karmaYieldFactor;

    return {
      negative: earned * (1 - positiveShare) * bias(false),
      positive: earned * positiveShare * bias(true),
    };
  }

  /** The just-finished life's own span — falls back to the instant outside a world. */
  #livedBias(positive: boolean) {
    const planet = PlanetManager.getActive();
    if (!planet) return 1;
    if (this.#lifeStartedAt === undefined) return planet.bias(positive);

    return planet.biasBetween(this.#lifeStartedAt, planet.lived, positive);
  }

  /**
   * The life a purchase or a rate figure is pricing — starting now, not lived
   * yet. `duration` is passed rather than read, because a projected life is a
   * different span of wave to average over.
   */
  #upcomingBias(positive: boolean, duration: number) {
    const planet = PlanetManager.getActive();
    if (!planet) return 1;

    return planet.biasBetween(planet.lived, planet.lived + duration, positive);
  }

  #payKarma(value: number) {
    const { positive, negative } = this.#splitKarma(value, aim.resolve(), (p) => this.#livedBias(p));

    if (positive > 0) {
      ResourceManager.add('karma_positive', positive);
    }

    if (negative > 0) {
      ResourceManager.add('karma_negative', negative);
    }
  }

  /**
   * Both piles per second. `count` prices a purchase you have not made, `extra`
   * an upgrade you have not bought — the projected duration reaches the bias
   * too, since a halved life is averaged over half the wave.
   */
  karmaPerSecond(count?: number, extra: Modifier[] = []) {
    const duration = extra.length ? this.durationWith(extra) : this.duration;

    return this.#splitKarma(
      this.perSecond('karma', count, extra),
      aim.resolve(),
      (p) => this.#upcomingBias(p, duration),
    );
  }

  toggleAutonomy(toggle?: boolean) {
    this.#emitter.toggleAutonomy(toggle);

    if (toggle && this.#count) {
      this.queueAction();
    }
  }

  /**
   * Only on a real change. The fan-out re-offers every held modifier off the
   * loop, and a `retime` fires `queue` — four re-armings a second would restart
   * every sweep watching this row without the clock having moved at all.
   */
  addModifier(modifier: Modifier) {
    if (this.#modifiers.add(modifier)) this.#emitter.retime();
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
    if (this.#modifiers.remove(id)) {
      this.#emitter.retime();
    }
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
  payout(type: YieldType, count = this.#count, extra: Modifier[] = []) {
    const production = extra.length ? this.productionWith(extra) : this.#production;

    return (production[type] ?? 0) * this.activeAt(count) * this.yieldScale;
  }

  perSecond(type: YieldType, count = this.#count, extra: Modifier[] = []) {
    const yielded = this.payout(type, count, extra);
    const duration = extra.length ? this.durationWith(extra) : this.duration;

    return yielded / ((duration || 1000) / 1000);
  }

  get duration() { return this.#duration; }
  get modifiers() { return this.#modifiers.modifiers; }
  get isAutonomous() { return this.#emitter.isAutonomous; }
  get isInProgress() { return this.#emitter.isInProgress; }

  /**
   * Lives too short to be counted one at a time — the cohort pays by the tick
   * now. A status and not a rate: `perSecond` is unchanged by it, which is the
   * whole point of batching this way.
   */
  get isStreaming() { return this.#emitter.isStreaming; }

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
