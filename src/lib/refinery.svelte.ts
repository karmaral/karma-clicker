/**
 * Throughput, not matching. X karma a batch every Y seconds, drawn at the same
 * rate from both piles — so the difference between them, which is the excess,
 * carries through into the token layer untouched. Polarity survives the step.
 *
 * It also levels on the karma it moved, so throughput keeps climbing after the
 * upgrade table runs dry. Level scales the batch base only — never the interval.
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

  /** An empty pile does not stall the other: each is capped on its own. */
  #refine() {
    const batch = this.#batch;
    if (batch <= 0) return;

    let moved = 0;

    PILES.forEach(([karma, red]) => {
      const taken = Math.min(batch, ResourceManager.getAmount(karma));
      if (taken <= 0) return;

      ResourceManager.remove(karma, taken);
      ResourceManager.add(red, taken);
      moved += taken;
    });

    this.#gainExp(moved);
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
