export default {
  'main': {
    role: 'click',
    yields: { experience: 5, karma: 1 },
    duration: 1000,
    count: 1,
    polarity_bias: 0,
    polarity_multiplier: 1,
    resistance: 0,
  },
  /**
   * Every cohort tops out around 200 now, so the gate list below is the same for
   * all five and means it — it used to run to 200 for cohorts that never passed
   * 15. What sets the count is `cost_multiplier` and almost nothing else: to
   * multiply the army by k, take the k-th root of the ramp. See *An army is a
   * ramp, not a yield*. Six rungs, not ten: `duration_reduction` compounds per
   * tier, and ten of them take a 3-second cohort under 50ms.
   *
   * The gaps widen (30/35/40/45/45) rather than holding even, because the tooth
   * ratio is `ramp^gap ÷ level multiplier` — widening gaps make the teeth climb
   * monotonically, so the ladder gets harder in one direction and never doubles
   * back. 5 stays as a tutorial rung; the rest is *The gate ladder* in the doc.
   */
  'basic': {
    // 1.15 capped near 75. 1.15^(1/2.67).
    upgrade_threshold: [5, 35, 70, 110, 155, 200],
    cost_multiplier: 1.054,
    yield_multipliers: {
      experience: 0.57,
      karma: 2.35,
    },
    cost: 5,
    cost_type: 'experience',
    yields: {
      experience: 1,
      karma: 1,
    },
    duration: 3000,
    duration_reduction: 0.34,
    polarity_bias: 0,
    polarity_multiplier: 1,
    resistance: 0,
  },
  'steady': {
    // The largest move of the five: 2.0 capped near 15. 2^(1/13.3). Its ramp was
    // the only brake on 250xp/500karma a soul, and this takes the brake off.
    upgrade_threshold: [5, 35, 70, 110, 155, 200],
    cost: 20,
    cost_multiplier: 1.053,
    yield_multipliers: { 
      experience: 1.5,
      karma: 3, 
    },
    cost_type: 'experience',
    yields: { 
      experience: 250,
      karma: 500,
    },
    duration: 5000,
    duration_reduction: 0,
    polarity_bias: 1,
    polarity_multiplier: 1.4,
    resistance: 0.35,
  },
  'chaos': {
    // 1.25 capped near 50. 1.25^(1/4). Fastest clock of the five — six tiers of
    // ×0.63 leave it around 125ms, so the sweep bar is a blur by the top.
    upgrade_threshold: [5, 35, 70, 110, 155, 200],
    cost: 20,
    cost_multiplier: 1.057,
    yield_multipliers: { 
      experience: 5,
      karma: 4.5,
    },
    cost_type: 'experience',
    yields: { 
      experience: 50,
      karma: 20,
    },
    duration: 2000,
    duration_reduction: 0.37,
    polarity_bias: 0,
    polarity_multiplier: 3,
    resistance: 1,
  },
  'zealot': {
    // 1.5 capped near 15. 1.5^(1/13.3). The 10k base is what keeps it late.
    upgrade_threshold: [5, 35, 70, 110, 155, 200],
    cost: 10_000,
    cost_multiplier: 1.031,
    yield_multipliers: { karma: 3 },
    cost_type: 'experience',
    yields: { karma: 2000 },
    duration: 5000,
    duration_reduction: 0.2,
    polarity_bias: -2,
    polarity_multiplier: 7,
    resistance: 0.8,
  },
  'red_basic': {
    // 1.15 capped near 25 — the flattest of the five, because it had the least
    // room. 1.15^(1/8). Priced in tokens, so its ramp answers to the refinery.
    upgrade_threshold: [5, 35, 70, 110, 155, 200],
    cost: 50,
    cost_multiplier: 1.018,
    yield_multipliers: { red_positive: 2 },
    cost_type: 'red_positive',
    yields: { red_positive: 1 },
    duration: 2000,
    duration_reduction: 0.2,
    polarity_bias: 1,
    polarity_multiplier: 1,
    resistance: 0,
  },
}