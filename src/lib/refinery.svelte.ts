/**
 * Matching, not throughput. One draw serves both lanes and the shorter pile caps
 * it, so a matched pair of karma becomes a matched pair of red and the *unpaired*
 * remainder — the excess — can never leave the karma layer. Polarity still
 * survives the step; what no longer survives it is the imbalance.
 *
 * An empty pile stalls the whole machine rather than letting the other lane run
 * on alone. That stall is the point: it is the only pressure in the game that the
 * aim dial answers, and it compounds, because a stalled refinery moves no karma
 * and so earns no levels either.
 *
 * It levels on the karma it moved, so throughput keeps climbing after the upgrade
 * table runs dry. Level scales the batch base only — never the interval.
 */

import { ResourceEmitter, type Listener } from '$lib/emission';
import { ModifierSet } from '$lib/modifiers';
import { BuildingManager, ResourceManager } from '$lib/managers';
import balance from '$data/balance';
import type { Modifier, ResourceType } from '$types';

/** Under this the emitter would re-queue inside its own payout. */
const MIN_INTERVAL = 100;

/** A free rung would let one batch level forever. The lab can dial `expBase` to 0. */
const MIN_RUNG = 1;

/** Each pile has exactly one destination; nothing crosses over in here. */
const PILES: [ResourceType, ResourceType][] = [
  ['karma_positive', 'red_positive'],
  ['karma_negative', 'red_negative'],
];

class Refinery {
  #modifiers = new ModifierSet();
  #emitter: ResourceEmitter;
  #level = $state(1);
  #exp = $state(0);

  /** Bought slots. Reserved souls fill them — neither on its own refines anything. */
  #slots = $derived(this.#modifiers.apply(0, 'slots'));

  /**
   * The refining share, capped by the slots. Its own lever, not a remainder: the
   * harness cannot reach these souls and they are never released to it, so a
   * world going down does not quietly stop the refinery.
   */
  #workers = $derived(Math.min(BuildingManager.countRefining(), this.#slots));

  /** Earned growth, on the base. The interval is deliberately not on this axis. */
  #leveled = $derived(Math.pow(1 + balance.refinery.yieldPerLevel, this.#level - 1));

  /**
   * Per pile. Staffing is linear here and absent from the interval: in both, it
   * would make throughput quadratic in souls and the other two axes decorative.
   */
  #batch = $derived(
    this.#modifiers.apply(balance.refinery.batchPerWorker * this.#leveled, 'yield') * this.#workers,
  );

  #interval = $derived(
    Math.max(MIN_INTERVAL, this.#modifiers.apply(balance.refinery.interval, 'duration')),
  );

  constructor() {
    this.#emitter = new ResourceEmitter(() => this.#refine(), () => this.#interval);
  }

  /** The clock runs from the beat on, staffed or not. Idempotent. */
  start() {
    if (this.#emitter.isAutonomous) return;

    this.#emitter.toggleAutonomy(true);
    this.#emitter.queue();
  }

  /**
   * One draw for every lane, capped by the shortest pile — so the surplus in the
   * longest is untouchable by construction, and an empty pile stops the machine
   * instead of letting the others run on alone.
   */
  #refine() {
    const batch = this.#batch;
    if (batch <= 0) return;

    const paired = Math.min(batch, ...PILES.map(([karma]) => ResourceManager.getAmount(karma)));
    if (paired <= 0) return;

    PILES.forEach(([karma, red]) => {
      ResourceManager.remove(karma, paired);
      ResourceManager.add(red, paired);
    });

    this.#gainExp(paired * PILES.length);
  }

  /** What the next rung costs. Ascends, so a fat batch can cross more than one. */
  #expForNext(level: number) {
    const rung = balance.refinery.expBase * Math.pow(balance.refinery.expGrowth, level - 1);

    return Math.max(MIN_RUNG, rung);
  }

  /** Karma refined is the only thing that levels it — an empty pull earns nothing. */
  #gainExp(amount: number) {
    if (amount <= 0) return;

    this.#exp += amount;

    while (this.#exp >= this.#expForNext(this.#level)) {
      this.#exp -= this.#expForNext(this.#level);
      this.#level += 1;
    }
  }

  addModifier(modifier: Modifier) {
    this.#modifiers.add(modifier);
  }

  addListener(identifier: string, fn: Listener) {
    this.#emitter.addListener(identifier, fn);
  }

  removeListener(identifier: string, fn: Listener) {
    this.#emitter.removeListener(identifier, fn);
  }

  get slots() { return this.#slots; }
  get workers() { return this.#workers; }
  get batch() { return this.#batch; }
  get interval() { return this.#interval; }
  get level() { return this.#level; }
  get exp() { return this.#exp; }
  get expToNext() { return this.#expForNext(this.#level); }

  /** 0–100, matching Building's convention so Meter takes it directly. */
  get levelProgress() { return (this.#exp / this.#expForNext(this.#level)) * 100; }

  /** When the queued batch lands. */
  get nextAt() { return this.#emitter.nextAt; }

  /** Karma cleared from each pile per second. */
  get perSecond() { return this.#batch / (this.#interval / 1000); }

  /** Across both piles, and uncapped by what they hold — this is the ceiling. */
  get clearedPerSecond() { return this.perSecond * PILES.length; }
}

export const refinery = new Refinery();
