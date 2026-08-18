/**
 * Throughput, not matching. X karma a batch every Y seconds, drawn at the same
 * rate from both piles — so the difference between them, which is the excess,
 * carries through into the token layer untouched. Polarity survives the step.
 */

import { ResourceEmitter } from '$lib/emission';
import { ModifierSet } from '$lib/modifiers';
import { BuildingManager, ResourceManager } from '$lib/managers';
import type { Modifier, ResourceType } from '$types';

/** What one worker clears from each pile per batch. Placeholder figures. */
const BATCH_PER_WORKER = 25;

const INTERVAL = 4000;

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

  /** Bought seats. Reserved souls fill them — neither on its own refines anything. */
  #seats = $derived(this.#modifiers.apply(0, 'seats'));

  #workers = $derived(Math.min(BuildingManager.countReserved(), this.#seats));

  /**
   * Per pile. Staffing is linear here and absent from the interval: in both, it
   * would make throughput quadratic in souls and the other two axes decorative.
   */
  #batch = $derived(this.#modifiers.apply(BATCH_PER_WORKER, 'yield') * this.#workers);

  #interval = $derived(Math.max(MIN_INTERVAL, this.#modifiers.apply(INTERVAL, 'duration')));

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

  get seats() { return this.#seats; }
  get workers() { return this.#workers; }
  get batch() { return this.#batch; }
  get interval() { return this.#interval; }

  /** Karma cleared from each pile per second. */
  get perSecond() { return this.#batch / (this.#interval / 1000); }
}

export const refinery = new Refinery();
