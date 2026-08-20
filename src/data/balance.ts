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

  /** What one worker clears from each pile, and how often. Placeholder figures. */
  refinery: {
    batchPerWorker: 25,
    interval: 4000,
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
    biasWith: 1.4,
    biasAgainst: 0.6,
  },

  /** Defaults for what a world does not author itself. */
  harvest: {
    /** What an even alignment takes instead of the karma it cannot place. */
    evenExperienceBonus: 0.5,
    mergeHalving: 50,
    maxMergeSpeed: 8,
  },
};
