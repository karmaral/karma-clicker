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
   * The one multiple that paces the cohort ladder. It buys two prices, not one:
   * a row is revealed at `revealFactor × cost(n)` lifetime experience, and its
   * clerk costs `revealFactor × COST_DECADE × cost(n)`. Since a cohort costs a
   * cost-decade more than the one below it, those are the same figure one rung
   * apart — **a row appears exactly when the row below it can be automated**,
   * and the rhythm reads *run it, clerk it, next row*. Derived rather than
   * authored twice so the pair cannot drift.
   *
   * Held against the **share of the row's own ladder** it buys, which is the
   * one reading that survives a per-cohort ramp: `175 × cost(n)` is 38 copies
   * at `BASE_RAMP` and 24 at cohort 2's 1.15, but both land between a quarter
   * and a third of the way to that row's reach. So a clerk always arrives a
   * couple of gates in, whatever the row. Neither a fixed copy count nor a
   * tier price anchors anything any more — the first moves with the ramp and
   * the second no longer exists.
   *
   * ⚠ Unmeasured against a clock: all of the delay between rows lands where
   * income is flattest. This is the knob the bench exists to sweep.
   */
  cohorts: {
    revealFactor: 25,
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
   * What held karma costs — see `docs/design.md` §21, *Karma as weight*. Read in
   * seconds of your own karma income, never in amounts, so it survives any
   * ladder change. `backlogHalving` is the backlog at which experience halves;
   * the first `grace` seconds are free. Placeholders, untuned.
   */
  weight: {
    backlogHalving: 300,
    grace: 0,
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
    /**
     * Its own ladder, not the harness's. Granularity is a harness axis now, so
     * the refining lever can no longer ride the one the harness bought — a
     * shared ladder would have made every anchor upgrade a refinery upgrade.
     * Same rungs to start with; the two are free to diverge.
     */
    splitSteps: [0.25, 0.15, 0.1, 0.05, 0.025],
  },

  /**
   * What the harness holds and how fast it goes down. `perWorker` is a rate, not
   * an amount: how much of a second of the job one worker places per real second,
   * so souls speed the clock rather than adding to a pile. `clickMs` is what one
   * press takes off the job — a deliberate trickle, so a hand can open a world
   * alone but stops mattering once souls arrive.
   *
   * `slots`, `riders` and `anchors` are bases, not placeholders to fill by
   * upgrade — an anchoring job must be workable and the finished harness must
   * pay its bonus the moment either is reached, so the capacity that used to be
   * free `slots_0`/`riders_0` grants is authored here instead.
   */
  harness: {
    slots: 6,
    riders: 200,
    /**
     * Anchor slots you can fill, before upgrades. A world offers its own
     * ceiling and this is capped against it, so one is "you can anchor any
     * world a little" rather than "you can anchor the second world".
     */
    anchors: 1,
    perWorker: 0.2,
    clickMs: 250,
    /** Finer every rung — a `step` upgrade that coarsened the lever would be a downgrade. */
    splitSteps: [0.25, 0.15, 0.1, 0.05, 0.025],
    /**
     * What a cohort line costs, in **each** crimson pile, and how much steeper
     * every line gets. Geometric like the inversion price and for the same
     * reason: a line is permanent capacity, so the tenth must not cost what the
     * first did. Placeholder figures.
     */
    lineBase: 400,
    lineGrowth: 1.6,
  },

  aim: {
    /**
     * The whole reward for committing to a side: Even pays ×1, a hard detent
     * pays this. No per-cohort figures any more — see `docs/design.md` §6.
     */
    extremityMultiplier: 2,
    /**
     * What re-aiming costs, and the **unit** it is paid in. A move buys
     * `reaimPhases × ceil(|Δdetent|/2)` of them, so the shortest step costs one
     * of these and a full swing two. The depth never moves: the wave strip's
     * end-of-penalty marker makes a duration legible and a depth invisible.
     */
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

  /**
   * What the wave pays a polarity running with it, and against it — at even.
   * `excessSpread` widens the pair from there as excess deepens, mean-preserving,
   * so the against-phase at a full ±1 tilt pays ×0.1 and never literally nothing.
   * Raising it past 0.5 would, and a phase paying zero is a different mechanic.
   * See `lib/wave.ts`. Placeholder, untuned.
   */
  wave: {
    biasWith: 1.5,
    biasAgainst: 0.5,
    excessSpread: 0.4,
  },

  /**
   * What a world leaves unsaid. `mergeHalving` is a *share* of the army now, not
   * a count — see `PlanetHarvestMerge`; a world authors it equal to its own toll.
   */
  harvest: {
    evenExperienceBonus: 2.0,
    mergeHalving: 0.25,
    maxMergeSpeed: 8,
    /**
     * What serving a world's pole is worth, when the world does not say. Nothing
     * is added to the payout — the same karma is redistributed across the poles,
     * which is `wave`'s bias pair one level up. Bounded on purpose: a third
     * unbounded multiplier on a figure that already compounds across five worlds
     * is how a payout runs away.
     */
    demand: 2,
  },

  /**
   * What a run leaves the next one — see `docs/design.md` §18. Wisdom is earned,
   * never bought, and the payout is one root over two axes: `√(produced/W + xp/X)`.
   * Either figure alone earns the first wisdom at its own constant; together they
   * sum inside the root, so the unit a run is climbing always widens.
   */
  prestige: {
    /** §18's `W`: crimson produced that alone earns the first wisdom. */
    firstWisdomAt: 1_000_000_000_000,

    /**
     * `X`: lifetime experience that alone earns the first wisdom — the second
     * axis, so a run that grows wide banks something even when refining is left
     * alone.
     *
     * ⚠ Unmeasured, and deliberately the weaker term. A cohort pays
     * `karma(n) = 2 × yield(n)` (`buildings.ts:6`), so xp tracks karma at a fixed
     * half and crimson is that karma times coverage times the refinery's ratio —
     * near coverage 0.5 and ratio 1 the two axes run about level. At `X = 4W`
     * that parity adds ~25% to the root's argument, or ~12% more wisdom, which is
     * a real term without displacing crimson as the thing the outer wheel reads.
     * Owed a recalibration alongside `firstWisdomAt`.
     */
    firstWisdomFromXp: 40_000_000_000_000,

    yieldPerWisdom: 0.02,
  },
};
