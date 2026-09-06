# Handoff — the coverage refinery

Session orientation, not design. **Supersedes §3 and §4 of
`handoff-residence-refinery.md`** (residence time). Everything else in that
document — the 1.22M/s diagnosis, prestige, the `positiveShare` clamp, Even's
bonus, the standing structural findings — is unchanged and still the plan.

**§3's axis table and §4's calibration are themselves now superseded by
`design.md` §9 v6.** The shipped ladder overshot §4's stated 1.2 milestone to
2.88 — every rung after `efficiency_1` multiplied an uncapped product straight
past what a saturating share can spend — and crossing coverage 1.0 turned out
to be a dead end rather than a payoff: past it the backlog drains and the
refinery starves on arrivals forever. `coverage = reach / (1 + reach)` (§9 v6)
replaces the `levelFactor` cap with an asymptote no ladder can cross, and the
level moved off `reach` entirely onto crimson-per-karma. §5's wisdom formula
is superseded too — it now reads crimson produced, not karma moved, so the
level's ratio compounds into prestige. Read this document for the *coverage
vs. residence* decision, which still stands; read §9 v6 for the live axis
model.

`design.md` remains the authority.

**Implemented.** §2–§6 below are shipped: `balance.ts`'s refinery block, the
`shortPileIncome` accumulator (`BuildingManager.countKarmaEarnedPerSecond` +
`getShortPileIncome` in `$lib/income`), `speed_1`–`speed_4` folded into the same
coverage channel `efficiency_1`/`efficiency_2` use, and coverage surfaced on the
Refinery screen (`RefiningStatus`'s headline, the new `Coverage.svelte`
replacing `Dwell.svelte`, `Frame`'s caption, DevPanel). `design.md` §9/§10 are
the authority now. §7's fallback and §8's remaining order-of-work items
(prestige, Even's bonus) are untouched — still open.

---

## 1. Why residence was dropped

It self-scaled correctly and it was the wrong target.

- **The readout jittered.** Refined karma/s was computed from `min(P, N)`, a
  stock, so the number moved whenever the backlog moved — including when the
  player had done nothing.
- **Nothing visibly improved.** Upgrades shortened an invisible dwell time. There
  was no number on screen that went up when you bought one.
- **It aimed at a diagnostic.** How long karma waits is a symptom worth measuring,
  not a goal anyone plays toward.

The property worth keeping is that the refinery must scale with the economy
instead of being a fixed batch that is 4.6× ahead at world 3 and 5.7% behind at
world 4. Coverage keeps that and fixes all three problems above.

---

## 2. Coverage

**Capacity is a share of what you produce, not a share of what you are holding.**

```
capacity = coverage × shortPileIncome        per lane, karma/s
batch    = capacity × interval
```

Coverage reads as a percentage: *the refinery keeps up with 36% of what you make.*
Upgrades raise that percentage. It is one number, always on screen, always rising
when something is bought.

### No stock term, so no jitter

`shortPileIncome` is computed from **cohort yields with the phase bias excluded**.

That exclusion is exact, not an approximation: the bias is 1.5 and 0.5 over equal
halves of a cycle, so it averages to precisely 1.0. Excluding it *is* the cycle
mean.

```
shortPileIncome = cohortXP × karmaRatio × min(positiveShare, 1 − positiveShare)
                  × karmaYieldFactor
```

Deterministic. No rolling window, no forecast, no stock anywhere in the formula.

### It is the readout §17 already asked for

> Backlog on this screen is drawn as **a pressure, not a quantity**: a rate
> against a ceiling, not a held figure.

Coverage is literally that ratio. The design already specified this display and
the refinery had no quantity that expressed it.

---

## 3. The axes

```
coverage    = coveragePerWorker × workers × efficiency × levelFactor
workers     = min(reserve, slots)
levelFactor = min(1 + (L − 1) / 36, 4)
```

| Axis | Job |
|---|---|
| **Slots** | ceiling on how many souls work at once |
| **Souls** | fill the slots — each raises coverage |
| **Efficiency** | what one worker is worth |
| **Level** | earned, hyperbolic, approaches a ceiling |

Souls set the rate, mirroring §12's harness. Slots pay off exactly when there are
souls to fill them, so §9's coupling survives. Staffing and efficiency stay
distinct for §9's stated reason: staffing costs incarnations every second it is
held, efficiency is bought once.

The level term is hyperbolic for the same reason §15's merge speed is — it
approaches a ceiling rather than crossing one, so the ladder can run forever
without needing a separate cap.

### Interval needs re-siting

Under coverage, `capacity × interval` cancels the interval out of throughput
entirely. The two speed upgrades no longer do anything.

**Fold them into coverage multipliers.** §9's principle — each upgrade priced in
what buying it should make you feel — survives untouched; only the quantity they
move changes. Interval then becomes pure pulse granularity and stops being a
balance knob.

---

## 4. Calibration against the live build

Short-pile income at Even:

```
21.98M cohort XP × 0.2 × 0.5 = 2.20M/s per pile
```

Current per-lane draw is 255,490/s, so the build today sits at **11.6%
coverage**.

| Knob | Value |
|---|---|
| `coveragePerWorker` | **0.00125** |
| `levelHalving` | 36 |
| `maxLevelFactor` | 4 |

At 16 workers, ×3 efficiency, level 37 (`levelFactor` = 2) that gives **12%** —
the current build, reproduced.

At the full ladder (40 slots, ×6 efficiency, level cap) it gives **1.2**.

> **Coverage passing 1.0 is a real endgame beat** — the refinery catches up with
> production and begins eating the backlog it could never reach before. That is a
> milestone the log can carry and the old fixed batch had no equivalent for.

---

## 5. Wisdom

Unchanged in principle. Karma moved stays the measure, for the reason that
survived scrutiny: generating karma is souls living, refining is the work that
turns it into understanding.

```
karma moved/s = 2 × coverage × shortPileIncome
```

Still proportional to the **weak** side, so a hard detent still banks nothing and
balance still pays. Now it is also legible — the wisdom rate is coverage times
short-pile income, and both are numbers on screen.

Recalibration: at Even with coverage averaging ~0.5 across a run, ~2.2M/s moved
across both lanes, three hours → ~24G.

**`W = 10⁸` gives ~15 wisdom per run.** Same order as the residence calibration,
so that figure holds.

---

## 6. Migration

1. Replace `batchPerWorker × workers × modifiers` with
   `coverage × shortPileIncome × interval`.
2. Add the `shortPileIncome` accumulator — cohort yields, bias excluded.
3. Convert `speed_1` and `speed_2` to coverage multipliers; keep interval fixed
   at 750 ms as pulse granularity.
4. Swap the level term from `1.08^(L−1)` to the hyperbolic factor.
5. Surface coverage as a percentage on the Refinery screen. **This is the
   mechanic** — if it is not on screen the model has the same problem residence
   had.

Assert `coverage ≤ some ceiling` only if the ladder is later extended past ×1.2;
nothing in the current table needs a clamp.

---

## 7. Fallback if coverage still reads as indirect

A blunter version that keeps a concrete batch:

```
batchPerWorker = 250 × 5^(highest cohort index owned − 1)
```

The economy grows ×5 per index by construction (§5), so pegging the batch to the
same ×5 tracks it exactly. One ratio, nothing to tune, and buying a new cohort
visibly jumps the refinery — a step function rather than a percentage, which some
players read better.

Coarser: it ignores how many of that cohort are owned, so it drifts within an
index. But it is a four-character change and it kills the treadmill.

---

## 8. Order of work

Unchanged from the previous handoff except for item 2:

1. **Diagnose the 1.22M/s.** Everything downstream assumes the dial is
   authoritative.
2. **Coverage refinery**, with the percentage on screen.
3. ~~**Minimal prestige**, `W = 10⁸`, confirmed after one world.~~ **Shipped** as
   `prestige.firstWisdomAt`, beat 14 `terminus`, and a legacy across the reload.
4. **`positiveShare` clamp**, before prestige ships.
5. **Even's bonus** — decide, do not re-argue. **This is what is left.**
