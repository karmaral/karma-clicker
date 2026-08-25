/**
 * Throughput, not matching. X karma a batch every Y seconds, drawn at the same
 * rate from both piles — so the difference between them, which is the excess,
 * carries through into the token layer untouched. Polarity survives the step.
 */

import { ResourceEmitter, type Listener } from '$lib/emission';
import { ModifierSet } from '$lib/modifiers';
import { BuildingManager, ResourceManager } from '$lib/managers';
import { harness } from '$lib/harness.svelte';
import balance from '$data/balance';
import type { Modifier, ResourceType } from '$types';

/** Under this the emitter would re-queue inside its own payout. */
const MIN_INTERVAL = 100;

/** Each pile has exactly one destination; nothing crosses over in here. */
const PILES: [ResourceType, ResourceType][] = [
  ['karma_positive', 'red_positive'],
  ['karma_negative', 'red_negative'],
];

class Refinery {
  #modifiers = new ModifierSet();
  #emitter: ResourceEmitter;

  /** Bought slots. Reserved souls fill them — neither on its own refines anything. */
  #slots = $derived(this.#modifiers.apply(0, 'slots'));

  /**
   * Held souls the harness has not taken. One soul does one job: a world still
   * going down is what stands in the way, so anchoring draws first and the
   * refinery works the remainder — and gets them all back once it is down.
   */
  #free = $derived(Math.max(0, BuildingManager.countReserved() - harness.workers));

  #workers = $derived(Math.min(this.#free, this.#slots));

  /**
   * Per pile. Staffing is linear here and absent from the interval: in both, it
   * would make throughput quadratic in souls and the other two axes decorative.
   */
  #batch = $derived(this.#modifiers.apply(balance.refinery.batchPerWorker, 'yield') * this.#workers);

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

    PILES.forEach(([karma, red]) => {
      const taken = Math.min(batch, ResourceManager.getAmount(karma));
      if (taken <= 0) return;

      ResourceManager.remove(karma, taken);
      ResourceManager.add(red, taken);
    });
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

  /** When the queued batch lands. */
  get nextAt() { return this.#emitter.nextAt; }

  /** Karma cleared from each pile per second. */
  get perSecond() { return this.#batch / (this.#interval / 1000); }

  /** Across both piles, and uncapped by what they hold — this is the ceiling. */
  get clearedPerSecond() { return this.perSecond * PILES.length; }
}

export const refinery = new Refinery();
