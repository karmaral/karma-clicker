/**
 * Figures no single entity owns. A knob that should differ per world belongs in
 * `planets.ts` beside the world it differs for — this is the global tier.
 *
 * Invariants stay out: `MIN_INTERVAL` in the refinery is the guard that stops an
 * emitter re-queueing inside its own payout, not a figure anyone should tune.
 */

export default {
  /** Excess reads unpaired karma as a share of this much income. */
  excess: {
    wallSeconds: 600,
    /** Inside this, a first harvest locks as even rather than tilted. */
    evenBand: 0.02,
  },

  /**
   * What one worker clears from each pile, and how often. Placeholder figures.
   *
   * It levels on karma it actually moved, so it grows at the rate the world
   * feeds it rather than at the rate upgrades are bought. `expGrowth` must stay
   * above `1 + yieldPerLevel` or the ladder outruns its own thresholds.
   */
  refinery: {
    batchPerWorker: 250,
    interval: 4000,
    /** Karma to reach level 2, and how much steeper each rung gets. */
    expBase: 5_000,
    expGrowth: 1.35,
    /** Compounds on the batch base, before modifiers — never on the interval. */
    yieldPerLevel: 0.08,
  },

  /**
   * What the harness holds and how fast it goes down. `perWorker` is a rate, not
   * an amount: how much of a second of the job one worker places per real second,
   * so souls speed the clock rather than adding to a pile. `clickMs` is what one
   * press takes off the job — a deliberate trickle, so a hand can open a world
   * alone but stops mattering once souls arrive.
   */
  harness: {
    slots: 0,
    riders: 0,
    perWorker: 0.2,
    clickMs: 250,
    /** Finer every rung — a `step` upgrade that coarsened the lever would be a downgrade. */
    splitSteps: [0.25, 0.15, 0.1, 0.05, 0.025],
  },

  aim: {
    /** How far a resisted cohort wanders, in detents. */
    driftDetents: 0.55,
    driftMsPerLatticeUnit: 9000,
    /** What re-aiming costs, and how many phases it takes to pay off. */
    reaimPenalty: 0.65,
    reaimPhases: 2,
  },

  /** What the wave pays a polarity running with it, and against it. */
  wave: {
    biasWith: 1.5,
    biasAgainst: 0.5,
  },

  harvest: {
    evenExperienceBonus: 2.0,
    mergeHalving: 25,
    maxMergeSpeed: 8,
  },
};
