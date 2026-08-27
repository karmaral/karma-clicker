/**
 * The soul allocation: the share of every cohort held back from incarnating.
 * Held souls are still yours — unlike merged ones — they only stop earning,
 * which is the whole of what reserving costs.
 *
 * Two shares, not one. Anchoring and refining are separate decisions, so neither
 * can take from the other: a share is set against what the other leaves, and what
 * neither claims incarnates. A share larger than its slots is simply idle, which
 * is what a coarse step costs and what the granularity upgrades buy back.
 */

export type SplitJob = 'anchoring' | 'refining';

class Reserve {
  #anchoring = $state(0);
  #refining = $state(0);

  /** Clamped to what the other lever leaves, so a drag never moves the other one. */
  set(job: SplitJob, fraction: number) {
    const bounded = Math.max(0, Math.min(this.ceilingFor(job), fraction));

    if (job === 'anchoring') this.#anchoring = bounded;
    else this.#refining = bounded;
  }

  /**
   * Rounded per cohort, never off a total — the rule `countMergeable` follows.
   * Per job as well as per cohort, so the two asides sum to the reserved figure.
   */
  countHeld(count: number, job?: SplitJob) {
    if (job) return Math.round(count * this.shareOf(job));

    return Math.min(count, this.countHeld(count, 'anchoring') + this.countHeld(count, 'refining'));
  }

  shareOf(job: SplitJob) {
    return job === 'anchoring' ? this.#anchoring : this.#refining;
  }

  /** What the other lever leaves this one. */
  ceilingFor(job: SplitJob) {
    return 1 - this.shareOf(job === 'anchoring' ? 'refining' : 'anchoring');
  }

  get anchoring() { return this.#anchoring; }
  get refining() { return this.#refining; }
}

export const reserve = new Reserve();
