# Handoff — the residence-time refinery

Session orientation, not design. Follows `handoff-post-ladder.md`; `design.md`
remains the authority.

**Superseded.** §3/§4 (the dwell formula) shipped under the name **`dwell`**
rather than "residence" (the word chosen once "residence" needed to survive
being authored in worker-seconds and divided by souls — read as machining/HVAC
dwell time) but read as a stock and jittered on screen. `docs/handoff-coverage-
refinery.md` replaced them with coverage — a share of income, not of the pile.
`design.md` §9/§10 are the authority now; both this file's reasoning and the
coverage handoff are kept for the record. §1 and §6's clamp were already
resolved before the dwell session touched them — see §1.

**State of the build:** §5 (generated cohort ladder) and §13's two formulas
(`mergeMinimum` as a share, `time(p)` doubling) are implemented. Worlds 4 and 5
exist. Prestige does not. Three worlds harvested, **all three locked Even**.

Current run, world 4, aim at **hard positive**:

```
XP            +27.11M/s      (of which 5.13M/s is harvest income from behind)
K_P            +7.73M/s
K_N            +1.22M/s
Refinery         510,981/s   level 37, 16 slots, 0.75 s interval
Souls          ~700–800      capped in practice
```

---

## 1. Resolved: the 1.22M/s

`balance.aim.shortPileFloor: 0.05` already ships and is applied in
`aim.svelte.ts`'s `resolve()` — at hard positive `positiveShare` clamps to 0.95,
not 1.0. The unexplained karma is 5% of cohort karma × the wave's `biasWith 1.5`;
both piles read a common ~1.23× multiplier, not a leak. `buildings.ts` confirms
the per-cohort `resistance`/`bias` fields named below are gone. Nothing below was
blocked by this after all — kept for the record of what was checked.

### Original note

At hard positive, `positiveShare = 1.0` exactly. Cohorts send **nothing** to the
negative pile. All three finished worlds locked Even, and Even pays experience
only — no karma from behind.

So there is no authored source for **+1.22M/s of negative karma**, which is 13.6%
of total karma income.

Everything else reconciles exactly, which makes the residue sharp rather than
noise:

```
cohort XP     = 27.11M − 5.13M          = 21.98M/s
cohort karma  = 21.98M × 0.2 × 3        = 13.19M/s      (hard detent extremity)
dense phase   = 13.19M × 0.5            =  6.59M/s
```

6.59M/s against a reading of 7.73M/s leaves ~1.14M/s unexplained on the positive
side too. Both piles are receiving karma from something the formulas do not name.

**Prime suspect:** only §5 shipped. §6's removal of per-cohort `resistance`,
`polarity_bias` and `polarity_multiplier` is a different section. If those figures
are still live on cohort rows, they leak karma to both poles regardless of the
dial.

**Why this blocks the rest of the work:** if the dial is not authoritative, every
excess reading is built on sand, world 5's 0.02 gate is unreachable by aiming, and
the wisdom mechanic below reads a number nobody controls. Diagnose first.

---

## 2. The refinery is a fixed scoop against an unbounded economy

Verified: `250 × 1.08^36 × 3 × 16 ÷ 0.75 × 2 = 510,976` against a reading of
510,981. Per-lane draw is **255,490/s**.

The batch is a constant. Your economy is not. It has therefore been wrong in both
directions inside two sessions:

| Moment | Refinery vs economy |
|---|---|
| Level 29, world 3 | **4.6× ahead** — drained both piles, stalled, had to be idled |
| Level 37, world 4 | **moving 5.7%** of production — piles overflow unrefined |

Nothing about the refinery changed between those two readings. Income grew past
it. **Any authored slot or batch figure is correct for roughly twenty minutes of
one run**, which is why authoring `slots_3` would land in the same place at world
6.

### The level ladder guarantees the stall

Thresholds grow `expGrowth` 1.35 per level; throughput grows `yieldPerLevel` 1.08.

```
1.35 ÷ 1.08 = 1.25
```

**Every level takes 25% longer than the one before, forever.** Level 38 is ~8
minutes at current rates, 39 is ~10, 40 is ~12.5. All speed upgrades are bought,
so nothing arrests it. §9's guard (`expGrowth > 1 + yieldPerLevel`) keeps the
ladder from outrunning its own thresholds and is the same property that makes it
grind.

---

## 3. Residence time

**Author how long karma waits, not how much gets taken.**

```
fraction = interval / residence           clamped to 1.0
batch    = min(P, N) × fraction           per pile, per pulse
```

The pulse and the two lanes are unchanged. Only the batch size is now proportional
to the pile instead of fixed.

### Why it self-scales

The draw is a percentage of what is there, so the pile is self-correcting: too big
and the draw grows, too small and income refills it. It settles where inflow
equals outflow — at exactly `residence` seconds' worth of current income. Small
economy, small pile; huge economy, huge pile; same residence either way, forever.

There is no constant to outgrow, because the only authored figure is a duration,
and durations do not go stale when income grows.

**Residence is not "time to empty."** With income flowing the pile never drains;
it parks. With income off it decays hyperbolically — 37% left at one residence,
14% at two — the same shape as §15's merge speed.

### What it hands you for free

At equilibrium, outflow equals inflow, so:

> **Karma moved per second = the short pile's income. Automatically, at every
> scale of the game.**

That is the wisdom mechanic stated as arithmetic, with nothing left to tune. Run
one pole hard and the short pile is a trickle, so the refinery moves a trickle,
so the run banks little wisdom despite enormous karma production. Refining is the
work that produces understanding; one-sided lives produce plenty of karma and
little learning.

### One mechanic disappears

§9's hard stall — an empty pile stops the machine outright, and the stall
compounds — **cannot happen under a proportional draw.** A pile approaches zero
and never reaches it, so the refinery slows smoothly in proportion to how thin the
short side is.

That is a better punishment than the binary one, but **inversion (§10) loses the
job §9 gave it** as the paid way out of a stall. It still buys the opposite
Crimson. Its stated purpose needs rewriting.

---

## 4. What the upgrades do

Souls set the rate, mirroring §12's harness exactly — souls do not add work there
either, they set how fast job-time runs.

```
residence = residenceBase / (workers × efficiency × levelSpeed)
workers   = min(reserve, slots)
```

`residenceBase` is in worker-seconds, stated per (worker × efficiency × 1.0).

| Axis | Job |
|---|---|
| **Slots** | ceiling on how many souls work at once |
| **Souls** | fill the slots — each lowers residence |
| **Efficiency** | what one worker is worth — multiplies every worker |
| **Speed** (interval) | no longer throughput — see below |

Slots pay off exactly when there are souls to fill them, so §9's coupling
survives. Staffing and efficiency stay distinct for §9's stated reason: staffing
costs incarnations every second it is held, efficiency is bought once.

### Speed becomes the last axis, not a redundant one

The pile sawtooths between pulses — refills for `interval`, then drops — which
adds about `interval / 2` to how long karma actually sits:

```
effective residence ≈ residence + interval / 2
```

At residence 20 s, a 0.75 s interval is worth 0.4 s: nothing. At residence 3 s it
is the difference between 5.0 s and 3.4 s: a third of throughput.

> **Speed matters more the more you have bought the other axes.**

So it is bought last and becomes the binding constraint once residence is short.
This makes §9's batch-vs-interval argument literal rather than incidental — the
sawtooth *is* the unrefined karma that excess measures.

### The level ladder must be re-denominated

Batch had no ceiling. Residence has a **floor**: it cannot fall below `interval`
without a pulse trying to take more than the pile holds.

The current multiplicative ladder blows straight through it. At level 37,
`1.08^36` = ×16, which would put residence at 0.42 s against a 0.75 s interval.

**Use a hyperbolic term**, the shape §15 already uses for merge speed:

```
levelSpeed = min(1 + (L − 1) / levelHalving, maxLevelSpeed)
```

It approaches a ceiling instead of crossing one, so the level ladder can run
forever without ever needing a separate cap — the same property that made
residence worth switching to.

### Starting figures

| Knob | Value | Note |
|---|---|---|
| `residenceBase` | 960 worker-seconds | placeholder |
| `levelHalving` | 36 | level 37 → ×2.0 |
| `maxLevelSpeed` | 4 | |
| `interval` | 750 ms | unchanged |

At the current build (16 workers, efficiency ×3, level 37) that gives **10 s**
residence — comfortably above the interval, and roughly double the throughput the
fixed scoop delivers at the moment.

**Invariant to assert in code:**

```
residenceBase / (maxSlots × maxEfficiency × maxLevelSpeed) > interval
```

Clamp `fraction` at 1.0 regardless, so a mis-authored ladder degrades instead of
breaking.

---

## 5. Wisdom

**Keep `karma moved`.** Generating karma is souls living; refining is the work
that turns it into understanding. Wisdom should cost effort. Under residence this
now works at every scale, because moved-per-second equals short-pile income
automatically.

```
wisdom = √(karma moved across the run / W)
```

Calibration, against a three-hour run:

| Aim | Short-pile income | Moved over 3 h | W = 10⁷ | W = 10⁸ |
|---|---|---|---|---|
| Even | ~4.5M/s | ~49G | 70 | **22** |
| ±1 | ~2.2M/s | ~24G | 49 | **16** |
| ±2 | ~5% of Even | — | — | — |

**`W = 10⁸` is the sane opening figure**, and it is what shipped, as
`balance.prestige.firstWisdomAt`.

The last row is **stale as first written** — it read 0 across, on the reasoning
that `positiveShare = 0` leaves the short pile receiving nothing. `shortPileFloor:
0.05` shipped after that, so a hard detent banks about 5% rather than nothing.
`W` was calibrated off the Even and ±1 rows, so the figure itself is unaffected.

**Ship minimal:** wisdom at the terminus, held only, +2% cohort yield per unit,
full reset otherwise. No knowledge, no shelves, no commerce — those make the fifth
run interesting, not the second. §18's own instruction is not to author the market
until the ladder is measured.

Beat 14 is `eventOnly`. It must not be given a floor — and it now exists, as
`terminus`, triggering on `ctx.leavesLegacy`.

---

## 6. Two decisions this session forced

### `positiveShare` wants a clamp — resolved

Shipped as `balance.aim.shortPileFloor: 0.05`, applied in `aim.svelte.ts`. See §1.

The hard detent keeps a legitimate second job — it is the only correction fast
enough to clear a deep tilt — which means the dial is two mechanics wearing one
control and nothing in the design says so.

### Even's bonus is settled by play, not argument

**Three harvests, three Evens.** The alignment lock has never once been exercised
as a choice. ×3 experience beats karma at any polarity, and Burden's karma buys
nothing at all (§3). `evenExperienceBonus` at 2.0 is not "may dominate" (§19) — it
is undefeated across every harvest played.

Either drop it to ×1.5 and see whether a tilted lock ever wins, or accept that Even
is the design and stop describing the lock as a trade.

---

## 7. Standing, unfixed by any of the above

**The crawl is structural.** Cost per index is ×10, rate per index is ×5, so
payback doubles every rung. Time to establish each index doubles while income only
quintuples, which makes income grow roughly as **t^2.3 — polynomial, not
exponential.** No upgrade ladder changes this: geometric income-gated ×2 rungs
raise the exponent (~t^3.5 at ratio 8) without restoring exponential growth. **Only
the outer wheel ends the crawl**, which is why AdCap and Cookie Clicker both expect
prestige rather than tuning it away.

**Souls cap at 700–800 by equilibrium, not by policy.** Past ~100 copies the 1.07
ramp beats the milestone rungs, so the optimum is ~100 each and climb. §5's *counts
never stall* is not holding — the cap the retune deleted has reappeared from the
ramp instead of from a rule.

**Milestone rungs 6–10 are dead at every index.** Rung price carries `1.07^gate`,
which is ~600 billion at gate 400, against a reward denominated in that cohort's
base units. Cohort 1 at 400 costs ~3.4×10¹⁵ for 0.4% of current income. **The
ten-rung ladder is four rungs in practice**, and §5's *you finish the first cohort
last* is not true and should not be made true.

**The click is vestigial.** ~700/click against 27.11M/s. `carry` cannot rescue it
by tuning — linear and capped, scaling with the quantity the ladder made scarce.
Needs a different shape (a share of income) or an explicit decision to let the hand
go.

---

## 8. Order of work

1. **Diagnose the 1.22M/s.** Everything downstream assumes the dial is
   authoritative.
2. **Residence-time refinery** — formula, four axes, hyperbolic level term, the
   floor invariant.
3. ~~**Minimal prestige**, `W` calibrated off short-pile income after one world of
   the residence build.~~ **Shipped**, against the coverage build and its `10⁸`.
4. **`positiveShare` clamp**, before prestige ships.
5. **Even's bonus** — decide, do not re-argue. **This is what is left.**

Deferred with reasons: the all-cohorts upgrade ladder (pacing inside a run, cannot
fix the crawl), the click, and the dead milestone rungs.
