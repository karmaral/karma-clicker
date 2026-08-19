/**
 * The soul allocation: the share of every cohort held back from incarnating.
 * Held souls are still yours — unlike merged ones — they only stop earning,
 * which is the whole of what reserving costs.
 */

class Reserve {
  #fraction = $state(0);

  set(fraction: number) {
    this.#fraction = Math.max(0, Math.min(1, fraction));
  }

  /** Rounded per cohort, never off a total — the rule `countMergeable` follows. */
  countHeld(count: number) {
    return Math.round(count * this.#fraction);
  }

  get fraction() { return this.#fraction; }
}

export const reserve = new Reserve();
