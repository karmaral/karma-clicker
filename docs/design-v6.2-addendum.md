# Karma Clicker — Design addendum **v6.2**

**2026-09-08** · splices into `design.md` v6.1 · does not supersede it

> **What this is.** One session's findings on excess, the aim dial and the
> upgrade rail, written in splice-ready form. Sections A–F replace or extend
> named parts of `design.md`; §G is a new §21; §H is drift found inside v6.1
> itself. **No section of v6.1 is deleted by this file** — where it says
> *replaces*, the replacement text is here in full and the old paragraph is
> quoted so the splice is unambiguous.
>
> **The headline is one number.** `extremityMultiplier: 3` sits exactly on the
> value where tilting the aim dial costs the refinery nothing. That is why the
> wave reads as negligible oscillation, and it is a one-character change to
> test.
>
> **What is deliberately not here:** the Burden/Comfort phase-shape debuffs are
> written up (§D) and **held**, because they would be a second tax on an axis
> whose first tax was never switched on.

---

## A. Tilting is free, and it is free by one decimal place

**Extends §6, *The dial*.**

The refinery draws from the **short** pile (§9), so what a detent costs is not
its total karma — it is what the short side still receives. Short-side income is
`shortShare × karmaYieldFactor`.

At `extremityMultiplier: 3`, base 100 karma/s:

| Detent | Split | Multiplier | Long pile | **Short pile** | Total |
|---|---|---|---|---|---|
| 0 · Even | 50 / 50 | ×1 | 50 | **50** | 100 |
| ±1 | 75 / 25 | ×2 | 150 | **50** | 200 |
| ±2 | 95 / 5 | ×3 | 285 | **15** | 300 |

> **The middle detent feeds the refinery exactly as well as Even and pays double
> the karma. Nobody should ever sit at Even.**

It is an algebraic coincidence, not a tuning slip. The short side at ±1 gets
`0.25 × (1 + 0.5(M−1))`; Even gets `0.5`; those are equal when **M = 3**:

```
0.25 × (1 + 0.5(M−1)) = 0.5   →   1 + 0.5(M−1) = 2   →   M = 3
```

So the live figure is precisely the value at which the middle detents stop
costing anything. §9's *"a one-sided life produces plenty of karma and little
understanding"* is currently true only at the hard detents.

### The proposed change

**`extremityMultiplier: 3` → `2`.** Same table:

| Detent | Split | Multiplier | Long pile | **Short pile** | Total | Refinery cost |
|---|---|---|---|---|---|---|
| 0 · Even | 50 / 50 | ×1 | 50 | **50** | 100 | — |
| ±1 | 75 / 25 | ×1.5 | 112.5 | **37.5** | 150 | −25% |
| ±2 | 95 / 5 | ×2 | 190 | **10** | 200 | −80% |

+50% karma for −25% refinery at ±1, +100% for −80% at ±2. That is a trade at
every detent, which is what §6 claims the dial is and what it currently is not.

⚠ **Retune knock-on.** §14's alignment trade and the ~1.7M `karma_negative` sink
were both sized against ×3 at the extremes. Wisdom is `√(crimson produced)`
(§18), and crimson production is short-pile-bound, so **lowering M raises the
wisdom a hard-tilted run banks relative to a balanced one** by shrinking the
tilted run's karma advantage. Measure before adjusting anything downstream.

---

## B. Excess correction is bounded, and the bound is cheap

**Extends §8. This is the reason the loop flattens, and it is §8's own diagnosis
returning one derivative up.**

§8 killed the income-rate version because income appeared on both sides and
cancelled — the reading depended only on how long you had been tilted, and
*growth cleaned you*. The ratio version fixed the jitter and the oscillating
denominator. It did not fix that.

**Both piles are mostly recent earnings.** Income compounds; a pile is the
running total of a compounding income, so it is dominated by the last stretch of
the run. Correcting therefore means out-earning your own history, which is cheap
by construction.

Small numbers. Say income doubles each minute and you sit at +1 for five minutes:

| Minute | Base karma that minute | Detent | P gains | N gains |
|---|---|---|---|---|
| 1 | 100 | +1 | 150 | 50 |
| 2 | 200 | +1 | 300 | 100 |
| 3 | 400 | +1 | 600 | 200 |
| 4 | 800 | +1 | 1,200 | 400 |
| 5 | 1,600 | +1 | 2,400 | 800 |
| | | | **P = 4,650** | **N = 1,550** |
| 6 | 3,200 | **−2** | 480 | 9,120 |

Excess after minute 5 is `(4650 − 1550) / 6200` = **0.5**. **One minute at the
opposite hard detent overshoots clean past zero**, because minute 6 alone is
larger than minutes 1–5 combined.

Slower growth stretches this but does not change the shape. At the design's own
`t^2.3` figure (§18) the general result is:

> **Clearing any tilt, at any depth, at any economy size, costs about 10% of the
> run so far.** Sixteen minutes in, that is a hundred seconds.

§8 treats boundedness as a virtue — *there is no wall*. **Boundedness is the
flaw: the meter has a maximum badness and it is affordable.** That is the
sentence to add to §8.

### The test any excess debuff has to pass

> **Does it break the proportionality between correction rate and current
> income?**

Anything that scales with income will not. That rules out most throttles, and it
is why §D is held and §C is not.

---

## C. The short-pile skim

**Proposed addition to §8. The one lever that changes the correction cost rather
than decorating it.**

Karma arriving in the pile you are **short** of is multiplied by:

```
skim = 1 − k × |excess|
```

At `k = 0.8` and excess 0.9 you keep 28% of what you aim, so §B's hundred seconds
becomes about six minutes. It relaxes as you climb out — hard to start turning,
then it snowballs free.

**A hump, not a wall**, which is the shape §8 asks for everywhere else. *"The
books do not balance. What you took has started taking back"* is already written
for it (§1).

Three things it forces:

- **§8's standing line gets much heavier.** *"The only thing that lowers excess
  is aiming into the pile you are short of"* was written when that was nearly
  free.
- **§13's gate ladder was authored against free correction.** 0.12 → 0.03 across
  five worlds. World 5 at 0.03 may stop being passable. **Retune the gates in the
  same pass, not after.**
- ⚠ **It hits the refinery twice.** `capacity = coverage × shortPileIncome` (§9),
  and the skim cuts `shortPileIncome` directly — on top of the share cut the
  detent already applies. Deep tilt would starve the refinery through two
  channels at once. That may be correct and it may be double-counting; it is the
  first thing to watch in a sim.

---

## D. Held: the phase-shape debuffs

**Written up so the next session does not re-derive them. Not to be authored
until §A is measured.**

The idea from earlier explorations: Burden lengthens dense phases and shortens
light ones; Comfort flattens the light phase's payout.

### Why held

Excess debuffs punish a **state**. The refinery already prices the **choice**,
continuously, in the currency that decides wisdom — and §A shows it is not biting
because of an arithmetic coincidence, not because the mechanism is wrong. Drop
`extremityMultiplier` to 2, play it, and only then decide whether the wave still
needs a second tax.

### Two corrections to the idea, for when it is picked up

**Burden's skew is a spiral, not a brake.** Burden means N ≫ P; dense pays
negative ×1.5; more dense means more negative income. Whether that reads as a
debuff depends entirely on whether negative karma is worth having, which is §F.

**Comfort must flatten both phases, not the light one.** Flattening only the
light phase cuts positive income, which shrinks Comfort — a self-healing debuff
against a spiralling one, which makes Comfort the strictly safer pole and quietly
moralises the choice §1 says the game never moralises about. Collapse the
**amplitude** instead: `biasWith` and `biasAgainst` both converge toward 1.0 as
Comfort deepens. Income-neutral on average, so it does not self-correct, and what
it costs is exactly what §6 says carries cohort identity — the manual batch stops
being a lever and short cohorts stop being volatile.

> **Burden makes the wave hostile. Comfort makes it inert.** Both attack timing,
> from opposite sides, and both revert as excess clears.

### Two invariants any phase-shape change must respect

**1 — Conserve the cycle, never the phase.** §13's law is
`ages × cycles_per_age × 2 × phase_duration = time(p)`. Skew the duty cycle
*within a fixed cycle length* and it holds; change phase length and world length
starts depending on how you played, which is §7's fourth failure mode arriving
through the back door. **The authoring surface should become `cycle_duration` and
`lightShare`, not `phase_duration`.**

**2 — It breaks §9's coverage.** `shortPileIncome` excludes the phase bias on the
grounds that 1.5 and 0.5 over *equal halves* averages to exactly 1.0 — *"the
cycle mean, not an approximation."* At light share `s`:

| Light share `s` | Positive mean `0.5 + s` | Negative mean `1.5 − s` |
|---|---|---|
| 0.50 (today) | 1.00 | 1.00 |
| 0.35 | 0.85 | 1.15 |
| 0.25 | 0.75 | 1.25 |

Coverage would start reading the tilt it was designed not to see. The fix is
small — weight the mean by the duty cycle per lane rather than assuming halves —
but it has to land in the same pass.

### The phase-gated verb

Separate from the debuffs and cheaper than commerce (§18). A verb live **only**
during the phase paying against your tilt: dump a capped share of the pile you
are long, at a loss.

- It is the `karma_negative` sink §3 has been missing, without needing the income
  curve measured first.
- It restores a wave-timed decision **after** clerks, which is the hole in the
  mid-game the doc does not currently name.
- Priced like inversion — climbing, never resetting — it stays a confession
  rather than a maintenance task.

> **The rule that separates a lever from a chore:** an action you *must* take
> every phase is a chore and fights §5's *many hands, then fewer, then none*. An
> action that is *only available* in one phase and *only worth taking* when
> excess is deep is a lever.

---

## E. World preferences as duty-cycle skew

**Extends §13 and pays into §1's largest hole.**

One authored fraction per world — `lightShare(p)` — with cycle duration fixed
(§D, invariant 1). A world where dense runs 70% of the cycle is a different world
to work.

**The reason to author this even while karma has no buyer:** duty-cycle skew
changes what a **long** life averages to and how volatile a **short** one is,
which is §6's cohort-identity mechanic. It is denominated in cohorts and
experience, not karma. A dense-heavy world is a world where your cohort mix
should differ — **world identity bought with a single authored fraction, landing
whether or not §F is ever solved.**

---

## F. Karma expires — the problem to solve next

**New standing entry for §19, and the stated target of the next session.**

There are ~23 authored one-off karma purchases and then karma's only consumer,
forever, is the refinery. So:

> **Once the upgrade table is bought, more karma buys nothing, extremity has no
> upside at any detent, and Even wins by default — permanently, not just while
> clearing for a gate.**

That is the deeper reason the endgame oscillation is flat, and **no excess debuff
touches it.** §A makes tilting a real trade for as long as karma has a buyer; it
does not create one.

§18 already holds the shape of the answer — commerce, selling the pile you are
long at a rate priced off excess, *turning excess from a wall into a price* — and
correctly parks it behind measuring the cohort ladder. **Keep it parked.** Note
only that §18's conclusion and this session's arrive at the same place from
opposite ends, which is some evidence it is the right one.

---

## G. §21 — The upgrade tree

**New section. Written against the standing intent to replace the linear rail.**

### A tree adds choice, not sink

The arithmetic does not support the second job. Convert ~23 one-offs into a
40-node tree with exclusive forks and the player buys perhaps 23 of them.
**Exclusivity is a rule about what you cannot buy, so the tree makes the karma
sink smaller, not larger.**

What creates an ongoing sink is a purchase repeatable at a rising price. The game
has exactly one and it is the thing that works: cohort copies and level rungs,
generated and ramped. Karma has no equivalent.

> **A tree fixes *every purchase is click-when-affordable*. It does not fix
> *karma expires* (§F). Build one tree for both jobs and it will be tuned for
> neither.**

### The line: the rail sells quantity, the tree sells kind

Do not replace the rail. Split it.

| | Stays on the rail | Moves to the tree |
|---|---|---|
| What | cohort copies, level rungs, clerks | the ~23 authored one-offs |
| Why | **generated** — §5's staircase has one crossover (34) and no per-cohort decision. A solved purchase dressed as a choice is a lie. | **authored** — each is a statement about what kind of run this is |
| Shape | click-when-affordable, correctly | forks, prerequisites, exclusions |

The tree's first version is therefore **the existing chips with edges drawn
between them**, not forty new nodes. One real prerequisite already exists in the
data: `carry_1` past `riders_1`.

### The 23 nodes, and where the forks actually are

| Branch | Nodes | Real internal fork? |
|---|---|---|
| The hand (§4) | `str_1–4`, `carry_1` | **yes** — flat strength vs borrowing the crowd |
| The harness (§12) | `slots_1–2`, `split_1–3`, `riders_1–2` | **yes, three-way** — work capacity vs granularity vs payout |
| The refinery (§9) | `efficiency_1–2`, `reach_1–4`, `slots_1` | **weak** — see below |
| All-cohorts (§5) | `shorter_lives_1`, `hard_season` | no — one axis, two rungs |
| Beat purchases (§16) | `read_the_wave`, `the_other_way` | no — priced triggers, likely tree roots |

⚠ **The refinery's fork is fake.** §9 states plainly that `reach` is *"the same
channel as efficiency, renamed for the fiction"* — both multiply `reach`. So the
refinery can supply at most a two-way fork (staffing vs multiplier), and **§9's
parked third axis — the saturation constant `c`, bought down — is what would make
it three.** If the tree is going ahead, that parked axis stops being optional.

**Verdict on the fork test:** about three real branches, not four. Borderline,
and the refinery is the reason.

### Polarity-priced branches

§14 already reprices five upgrades into `karma_negative` and calls it service to
self. **That is a tree edge waiting to be drawn.**

> Some branches cost karma+, some cost karma−, and **the tree becomes the visible
> record of which polarity you ran.** A Burden run cannot afford the Comfort
> branch — not by a rule, by a price.

The five that already price in `karma_negative` (§14, and see §H): `refinery:slots_1`,
`harness:riders_1`, `main:carry_1`, `cohorts:shorter_lives_1`, `cohorts:hard_season`.

### The node type worth building for

> **A node priced from both piles at once**, the way Ochre is (§10). E.g. 5,000
> karma+ **and** 5,000 karma−.

Buyable only by a run that has worked both sides. Today the entire reward for
balance is passing a door and locking Even at a harvest. This makes a balanced
pair of piles **buy** something, which §14 says the game wants and currently does
exactly once.

### Wide, not tall

§18's rule for the permanent shelf, arrived at here from the other direction:

> **A steep ladder climbed in a fixed order makes every run's decision the same
> decision.**

Twenty to thirty nodes, wide and shallow, **never the thing carrying growth.**
The generated ladders carry growth.

⚠ **Authoring hazard.** The doc's direction since v3 is away from hand-typed
rows — one formula and an index. A tree is the opposite by nature, and forty
authored nodes is the *invent a row* pattern §5 spent a version deleting. This is
survivable only if the tree stays small and is explicitly doing the other job.
§18 carved that distinction and left it open as uncomfortable — *wisdom buys what
exists and knowledge buys facts about your run, scale against texture.*
**A tree is texture, and it is a decent answer to that open question.**

### Respec

Exclusivity with no respec means a wrong choice at minute four poisons a
124-minute run, and the first time that happens the player stops experimenting.
Free respec makes exclusivity theatre.

**Price it like inversion** (§10): climbing, never resetting, a confession rather
than a maintenance action. It is the same admission in another channel — buying
your way out of a commitment you made.

### Which index it lives at

| | **In-run tree** | **Permanent tree** |
|---|---|---|
| Priced in | karma, both poles | wisdom or knowledge |
| Resets | on prestige | never |
| Job | this run's identity | this *player's* identity |

**Ship the in-run one first.** It touches the felt problem, it reuses chips that
already exist, and §18's permanent shelf cannot be priced until a run has been
played anyway.

### Frame

**A fifth tab, not a takeover.** §17 rejected a harvest tab because it is one
world's decision and not a place you live; a tree is the opposite of that.

⚠ **It breaks §17's rail rule.** *The rail belongs to the screen under it — a
chip lights its target on the screen below it.* A tree node targets the refinery
while you are standing on the tree. Either the tree screen carries a preview of
what a node lights, or **the rule gets an explicit exception written into §17.**

### The cheap first move

**Draw the edges over the 23 chips that exist and count the forks that fall out
naturally.** Three or four and the tree is real. If the forks have to be
invented, the rail was fine and the problem was always §F.

---

## H. Drift found inside v6.1 this session

Not new decisions — places where v6.1 disagrees with itself. All five of the
first group are the **same** drift: §14's repricing was written into §14's table
and never propagated to the sections that own those upgrades.

| Upgrade | Section table says | §14 says | Live? |
|---|---|---|---|
| `main:carry_1` | 200,000 karma+ (§4) | 200,000 **karma−** | §14 |
| `cohorts:shorter_lives_1` | 310,000 karma+ (§5) | 310,000 **karma−** | §14 |
| `cohorts:hard_season` | 1,200,000 karma+ (§5) | 1,200,000 **karma−** | §14 |
| `harness:riders_1` | 150,000 karma+ (§12) | 150,000 **karma−** | §14 |
| `refinery:slots_1` | 12,000 Crimson+ (§9) | 25,000 **karma−** | **unresolved — two different currencies, not just two signs** |

**These five are exactly the polarity-priced nodes §G wants to build on**, so
resolving them is a prerequisite for the tree and not housekeeping.

Two smaller ones:

- **§19, *A karma-to-red ratio*** is listed as unsettled and *"now needed rather
  than merely absent"*, but §9 v6 authored `ratioBase` / `levelHalving` and states
  the knob **is spent**. The §19 row is stale.
- **§19, *Resolved by the ladder rewrite*** still defines wisdom as
  `√(karma moved)`. §18 v6 reads **crimson produced**. Stale row.

---

## I. Suggested order of work

1. **`extremityMultiplier: 3 → 2`** and play it (§A). One character, fully built
   mechanism, and it decides whether §C and §D have a job at all.
2. **Resolve the five repricings** (§H). Blocks the tree, cheap to do.
3. **Karma's ongoing buyer** (§F) — the stated next session.
4. **Draw edges over the existing 23 chips** (§G, last subsection). Diagnostic,
   costs nothing, and tells you whether the tree is real.
5. **The short-pile skim** (§C) *with* §13's gate ladder retuned in the same pass.
6. Held: phase-shape debuffs (§D), world `lightShare` (§E), the phase-gated dump
   verb (§D).

**Unplayed and unmeasured throughout.** Everything in §A–§C is desk arithmetic
against v6.1's authored figures; none of it has been through the sim bench.
