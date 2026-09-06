/**
 * Figures no single entity owns. A knob that should differ per world belongs in
 * `planets.ts` beside the world it differs for — this is the global tier.
 *
 * Invariants stay out: `MIN_INTERVAL` in the refinery is the guard that stops an
 * emitter re-queueing inside its own payout, not a figure anyone should tune.
 */

export default {
  /**
   * Where a clock stops reading as a beat and starts reading as a rate. Past
   * `streamUnder` an emitter stops keeping one timer per life and pays a whole
   * `streamTick` at once — the same income, a fraction of the timers, and a bar
   * that flows instead of strobing.
   *
   * Two figures and not one, because they answer different questions. The
   * threshold is about the **eye**: sixteen a second is a rate, four a second is
   * still visibly a beat, so it sits at a sixteenth of a second and a cohort
   * spends a while being merely fast before it becomes a stream. The tick is
   * about the **machine**: it is the world's own `TICK_MS`, and paying more
   * often than the world thinks is work for nobody.
   *
   * The tick must stay at or above the threshold, or a stream would pay less
   * than a whole life at a time — the emitter floors the batch at 1 rather than
   * trusting this, but an authored pair that needs the floor is a mistake.
   */
  emission: {
    streamUnder: 62.5,
    streamTick: 250,
  },

  /**
   * Excess is unpaired karma over held karma — a share, with no figure to set.
   * All that is left to author is how close to paired counts as paired.
   */
  excess: {
    /** Inside this, a first harvest locks as even rather than tilted. */
    evenBand: 0.02,
  },

  /**
   * Capacity is a *saturating* share of what the cohorts produce, not a share
   * of what is held — see `docs/design.md` §9. `reach = coveragePerWorker ×
   * workers × efficiency` is bought and uncapped; `coverage = reach / (1 +
   * reach)` approaches 1.0 without ever crossing it, so no worker count or
   * upgrade total can push the refinery past what exists to clear. Multiplying
   * coverage by `interval` gives the karma one pulse draws — the interval
   * cancels back out of throughput, so it is pulse granularity, not a lever.
   *
   * The level moves a separate axis: crimson per karma, not throughput.
   * `ratioBase` is deliberately below 1 — the refinery starts lossy, and
   * `levelHalving` levels are how long it takes to break even. Placeholder
   * figures, calibrated so the live build reads ~12% coverage at 16 workers,
   * x3 efficiency, and crosses ratio 1.0 at level 28.
   *
   * `slots` is a base, not a placeholder to fill by upgrade — the refinery
   * must be able to do its one job the moment it is revealed, so the capacity
   * that used to be a free `slots_0` grant is authored here instead.
   */
  refinery: {
    slots: 4,
    coveragePerWorker: 0.00125,
    interval: 2000,
    /** Karma to reach level 2, and how much steeper each rung gets. */
    expBase: 5_000,
    expGrowth: 1.35,
    /** Crimson per karma at level 1 — four karma to make one crimson. */
    ratioBase: 0.25,
    /** Levels to raise the ratio by 1 — level 28 is where it crosses even. */
    levelHalving: 36,
  },

  /**
   * What the harness holds and how fast it goes down. `perWorker` is a rate, not
   * an amount: how much of a second of the job one worker places per real second,
   * so souls speed the clock rather than adding to a pile. `clickMs` is what one
   * press takes off the job — a deliberate trickle, so a hand can open a world
   * alone but stops mattering once souls arrive.
   *
   * `slots` and `riders` are bases, not placeholders to fill by upgrade — an
   * anchoring phase must be workable and the finished harness must pay its
   * bonus the moment either is reached, so the capacity that used to be free
   * `slots_0`/`riders_0` grants is authored here instead.
   */
  harness: {
    slots: 6,
    riders: 200,
    perWorker: 0.2,
    clickMs: 250,
    /** Finer every rung — a `step` upgrade that coarsened the lever would be a downgrade. */
    splitSteps: [0.25, 0.15, 0.1, 0.05, 0.025],
  },

  aim: {
    /**
     * The whole reward for committing to a side: Even pays ×1, a hard detent
     * pays this. No per-cohort figures any more — see `docs/design.md` §6.
     */
    extremityMultiplier: 3,
    /** What re-aiming costs, and how many phases it takes to pay off. */
    reaimPenalty: 0.65,
    reaimPhases: 1,
    /**
     * The least of the karma the short pile may ever get. Without it a hard
     * detent puts the short pile at exactly zero, the refinery pairs `min(batch,
     * 0)` forever, and it stops levelling — and refinery level experience is the
     * wisdom base, so the highest-income play would bank nothing. At 0.05 the
     * cliff's one honest job survives at 95% of its old speed: hard positive
     * with the refinery idled is still the fastest correction for a deep tilt.
     */
    shortPileFloor: 0.05,
  },

  /** What the wave pays a polarity running with it, and against it. */
  wave: {
    biasWith: 1.5,
    biasAgainst: 0.5,
  },

  /**
   * What a world leaves unsaid. `mergeHalving` is a *share* of the army now, not
   * a count — see `PlanetHarvestMerge`; a world authors it equal to its own toll.
   */
  harvest: {
    evenExperienceBonus: 2.0,
    mergeHalving: 0.25,
    maxMergeSpeed: 8,
  },

  /**
   * What a run leaves the next one — see `docs/design.md` §18. Wisdom is earned,
   * never bought, and the whole payout is one root over one constant.
   */
  prestige: {
    /** §18's `W`: crimson produced that earns the first wisdom. `√(produced / W)`. */
    firstWisdomAt: 1_000,
    yieldPerWisdom: 0.02,
  },
};
