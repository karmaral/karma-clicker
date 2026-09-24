# Karma Clicker — Design

**v6.5** · 2026-09-23 · supersedes CONTEXT v3

> **v6.5** — §21's *karma as weight* is built on `dev-next`, unsettled. §6, §9
>  and §14 carry ⚠ pointers where the build now departs from them; §21 holds
>  what was built and the sim: unpaired harvest karma was fatal, so `K` now
>  pays half into each pile.

> **v6.4** — a sync pass, no design moved. The v6.2 addendum is spliced: its
>  correction-cost finding into §8, *karma expires* into §19, and its held
>  proposals into a new §21. Drift against the data is fixed in §1, §3, §4, §12,
>  §14, §16 and §18 — the press pays no karma, wisdom reads two axes, lines go
>  round the ladder, beat 14 exists. **"Unplayed" is retired as a label**: the
>  author has played the full game, and §19 now lists findings *unrecorded*
>  rather than systems unseen. What was found in play is still owed to this file.
> **v6.3** — the harness became a system with a screen: §12 rewritten around the
>  world's offer as a *ceiling*, the rig's own visual ladder, cohort lines as a
>  bought curve, and a twelve-row upgrade table priced in both crimsons. §17
>  takes the fourth tab. §4's click table and §16's beat ladder are resynced to
>  `upgrades.ts` and `beats.ts` — both had drifted a full rewrite behind, and
>  neither figure moved by design, they were only mis-transcribed here.
>  **`docs/design-v6.2-addendum.md` is still unspliced**, and its headline is
>  spent: `extremityMultiplier` is 2 in `balance.ts` and §6 already reads 2.
> **v6.1** — §17 refitted to the frame that shipped: the screen tabs left the
>  header for a bottom action bar, the rail stopped truncating, the separate
>  harvest ledger is gone, the planet verbs went back to the columns they act
>  on, and prestige became a second takeover. **No economy figure moved** — §1–16
>  and §18–20 are untouched apart from §19's board. One new open question: where
>  the end-run verb belongs.
> **v6** — coverage saturates and the level moves off it: §9 rewritten. Upgrades
>  push an uncapped `reach`; `coverage = reach / (1 + reach)` approaches 1.0 and
>  never crosses it, so no ladder total can overshoot the milestone the way the
>  v5 model did. The level no longer scales `reach` — it earns a separate,
>  uncapped crimson-per-karma ratio that starts below 1, so the coverage-1.0
>  beat this version retires is replaced by ratio crossing 1.0. Wisdom (§18) now
>  reads crimson produced, not karma moved, so the level's climb compounds into
>  the outer wheel. §8's excess consequences are unaffected — pairing, the
>  unpaired remainder, and the hard-detent cliff (§6) are all untouched.
> **v5** — the refinery draws by coverage, a share of income, not a share of the
>  pile: §9 rewritten. Dwell/residence read as a stock and jittered; coverage
>  reads as a percentage and does not. §10's stall-escape note carries over
>  unchanged — coverage still leaves nothing to stall.
> **v4** — the refinery drew by dwell time, not by batch: §9 rewritten, and §10
>  lost its stall-escape job — an empty pile thinned smoothly instead of
>  stopping the machine. Superseded by v5 above.
> **v3** — replaced the economy's shape: §5 (cohorts), §6 (aim), §13 (worlds) and
>  §18 (the larger wheel) are new; §3, §10, §16 and §20 changed to follow them. The
>  move was from **authored figures per thing** to **one formula and an index**, on
>  the Cookie Clicker / AdventureCapitalist model: every cohort, every level and
>  every world is now generated, and the game can be extended by incrementing a
>  number rather than by inventing a row.

It states what the game *is*: mechanics, economy, progression, and the authored
numbers behind them. It contains no implementation — no components, no
architecture, no rendering. Where a filename appears it is because that file is
the **authoring surface for a design knob** (`balance.ts`, `planets.ts`,
`buildings.ts`, `upgrades.ts`), never because it is where code lives.

Two companion documents remain, and neither owns design any more:

- `docs/progression.md` — implementation rationale, visual/shader arguments, and
  the record of *how* each decision was reached. Read it when you want the
  argument behind a conclusion stated here.
- `docs/handoff.md` — session orientation. Not design.

Every figure below is checked against source data as of this writing. Figures
that are placeholders are marked; §19 is the full index of what is untuned and
of what play has settled but this file has not yet recorded.

---

## 1. Premise and fiction

### What is settled

You turn a wheel. Lives are born, are lived, and end, and each one leaves a
residue behind it. That residue is **karma**, and it has two sides.

- **A soul is a life-in-waiting.** Souls incarnate on the world you are standing
  on. Incarnation is what produces — a cohort's yield is what its souls' lives
  leave behind.
- **Karma has two poles and you choose which you run.** Positive karma is
  service to others. Negative karma is **service to self** — not harm, not
  cruelty, and not "the option that pays better". It is a life turned inward
  onto its own account. The game never moralises about the choice; it only makes
  you carry it.
- **Polarity is lived with, not toggled.** The one purchase that buys the
  opposite side (§10, *inversion*) gets permanently dearer every time you use
  it. Everything else in the game assumes you are living with the polarity you
  earned.
- **A world is a place with a lifespan, and it is left for good.** You stand on
  one world at a time. It breathes (§7), you work it, and eventually you end it
  — giving up some of your souls to do so. What you leave keeps turning and
  keeps paying, forever, from behind you.
- **The wheel outgrows the hand.** The press is where the game starts and the
  one producer you can never buy more of. Everything after it is about the
  crowd, and the hand's late upgrades (§4, `carry`) work by *borrowing* the
  crowd rather than by growing on their own.

### The log — a register, not a script

**Every beat and moment has a line** (`log-texts.ts`) — fourteen beats, five
moments, the prestige arrival and the ambient phase flips. Even so, **no argument
in this file should rest on the wording of one.** The lines are live copy, not the
fiction's specification.

What is settled is the **register**:

> *Something has to turn the wheel. For now that is you.*
> *The lives leave a residue behind them. It has a name.*
> *One of them stayed. It turns the wheel without being asked.*
> *There is another way to earn. The lives can be turned to serve themselves.*
> *The books do not balance. What you took has started taking back.*
> *This world is ready to end. How much of it you keep is yours.*
> *The first world is behind you. What you left in it still turns.*
> *Two worlds turn without you, out of phase. There is nowhere you need to be.*

Flat, declarative, second person. No exclamation, no reward language, nothing that
congratulates you. Two short sentences, the second doing the work.

**The voice is decided and every line is replaceable.** Some describe mechanics
that have moved — cohort 1's autonomy is not "one of them stayed", and two worlds
is not the end of a run.

### What is unwritten

- **The worlds have no identity.** They are `Planet 1…5`, subtitled *Simple*,
  *Harder*, *Harder*, *Hardest*, *The last one*. Names, character and any sense
  of *why these and in this order* do not exist. This is the largest fiction hole
  and it sits on the game's central object. It is now at least *indexed* — a world
  has a place in its system (§13) — which gives the naming something to lean on.
- **Boons are unauthored.** A world can leave you holding a permanent change
  when you finish it (§14). The mechanism is wired end to end and every world
  declares none, so the row reads `—`.
- **The cohorts have no names.** They are `Cohort n`; the four inherited names
  were retired with the yield shapes they described (§5).
- **The clerk has a mechanic and no fiction** (§5). A revision-and-reincarnation
  loop is the obvious shape and nothing has been written.
- **Prestige has a mechanism and one line of framing** (§18) — *you have been here
  before* — and no copy at all.

---

## 2. The core loop

```
                 ┌──────────────────────────────────────────┐
                 │                                          │
    press ──► experience ──► buy cohorts ──► souls ──► incarnate ──► karma ±
                 │               │                          │        │
                 │               ▼                          │        ▼
                 │            clerks                        │    the refinery
                 ▲          (send themselves)               │        │
                 │                                          │        ▼
                 └──────────────── the wave ────────────────┘  Crimson → Ochre → Indigo
                                (modulates payout)                   │
                                                                     ▼
                                                   knowledge ──► the run ends ──► wisdom
```

1. **Press.** Flat experience and flat karma. The tutorial and, for a while, the
   whole game.
2. **Buy cohorts.** Experience buys souls. A cohort is an index and everything
   about it — cost, yield, lifespan — falls out of that index (§5).
3. **Send them, then stop having to.** A cohort starts **manual**: you click its
   row to send a batch. A **clerk** makes it run itself forever. The early game is
   several ledgers worked by hand; the late game is one press and a floor that
   runs without you (§5).
4. **Aim.** Once the negative pile exists, a global dial decides which karma
   pile your cohorts fill. Committing hard to one side pays more (§6).
5. **The wave.** The world you stand on alternates between **light** and
   **dense** phases on a fixed clock. A phase pays the polarity running with it
   ×1.5 and the one running against it ×0.5 (§7).
6. **Excess.** Karma you hold that has nothing to pair with is your imbalance.
   It is read as a share, it is bounded, and a world will not let you leave
   until yours is small enough (§8).
7. **Hold souls back.** A soul held out of incarnation stops earning and does a
   job instead: refining, or anchoring (§11).
8. **The refinery** takes matched karma off both piles at once and returns
   Crimson. It cannot touch the unpaired remainder — so it strips your pairs
   away and leaves the tilt showing (§9).
9. **Leave.** When the world's conditions hold, you take a **first harvest**:
   merge some share of your souls into the world, lock your alignment, and go.
   What you merge you lose; what you left keeps paying forever (§14, §15).
10. **Arrive.** Every world past the first offers **anchor slots**. Taking the
   offer is optional: held souls place anchors, a harness goes up, the cohorts on
   a line ride it — and what you leave standing multiplies that world's harvest
   forever (§12).

11. **End the run.** A run walks every world of one system. What it moved becomes
    **wisdom**, which multiplies the next one or is spent to change what a run is
    (§18).

A run is one system long. The wheel it turns is the same wheel a soul turns, one
index up.

---

## 3. Currencies

| Resource | Polarised | Created by | Spent on |
|---|---|---|---|
| `experience` | no | press, cohorts, harvest income | cohort copies, clerks, `str_1`/`str_2`, `efficiency_1`, `split_1`, **knowledge** (unbuilt) |
| `karma_positive` | yes | cohorts aimed positive, harvest income | `read_the_wave`, `the_other_way`, `str_3`, `str_4` |
| `karma_negative` | yes | cohorts aimed negative, harvest income | `carry_1`, `harder_lives_1`, `hard_season` — 1.71M in all |
| `red_positive` (Crimson) | yes | the refinery | `reach_1`, `slots_1`, eight harness upgrades, lines, Ochre |
| `red_negative` (Crimson) | yes | the refinery | eight harness upgrades, lines, Ochre |
| `yellow` (Ochre) | no | pairing Crimson from both piles | Indigo, three refinery upgrades, three harness upgrades |
| `blue` (Indigo) | no | Ochre | `reach_4`; the deep end of the knowledge market (§18) |
| `knowledge` | no | **unbuilt** — buying it with experience, at a worsening rate | in-run unlocks, and the permanent shelf (§18) |
| `wisdom` | no | **prestige only** — `√(crimson/W + experience/X)` | held it multiplies; spent it buys structure and stops multiplying (§18) |

**The press pays no karma.** Karma comes from cohorts and finished worlds only.

**Karma has run out of buyers by mid-run.** Seven purchases take it and then the
refinery is its only consumer, forever — see §19, *Karma expires*.

### The two that changed

**`wisdom` is no longer an experience sink.** It was 1,000,000 experience for one
unit with nothing to do with the unit. It is now the prestige residue: earned only
when a run ends, never inside one, and it is the outer index of the same wheel
everything else turns on.

**`knowledge` is the currency wisdom used to be confused with.** Earned inside a
run by spending experience, spent inside a run — except for one shelf that
survives. Wisdom is what you *are* and knowledge is what you *have*; they are not
two names for one thing and §18 keeps them apart.

### The asymmetry, narrowed

Both crimsons now have buyers (the harness prices in both, §12), and three
purchases cost `karma_negative` (§14). What is left is a **timing** asymmetry: the
positive-karma prices all land before beat 7, the negative ones well after, so an
early Comfort tilt is eaten by your own purchases and a Burden tilt is not.

**Spending karma cleans excess**, since a price comes off one pile. §19's
*incurred prices* row asks whether it should.

### Vocabulary note

Code says `red` / `yellow` / `blue`; the UI says **Crimson** / **Ochre** /
**Indigo**. This is deliberate and is not drift. Full table in §20.
## 4. The click

The press is `main`, and it is the only producer of `role: 'click'` — not a
cohort, excluded from everything that fans out over cohorts.

| | |
|---|---|
| Yield | 1 experience, no karma |
| Duration | 0 — instant, and never anything else |
| Aim | none — it pays no karma to aim |
| Wisdom | half strength: +1% a wisdom against a cohort's +2% (§18) |

**The press is instant from the first one.** It used to open on a 1,000 ms
cooldown and ramp down through a three-rung `speed_*` ladder ending in *It
clicked for you* — a pun worth one upgrade name and, in play, an obstacle in
front of the one verb the player uses continuously. **Click-and-wait now belongs
to unclerked cohorts alone** (§5): a row you send by hand and watch fill is a
timing decision against the wave, where a cooldown on the press was only a
throttle. One mechanic, one home.

**The press pays no karma.** An earlier draft paid a flat 1 so that a karma gate
read as a press count; the build gates the opening on experience instead
(cohort 1 at 50/100, §5), and karma first arrives from cohort 1's souls.

### The ladder — paced, not priced

Five upgrades on one axis, and their **gates are the authored figure; their ids
are not the order they arrive in.** Read the gate column, not the name.

| Upgrade | Effect | Unlocks at | Costs |
|---|---|---|---|
| `str_1` | ×2 experience | 100 xp | 200 xp |
| `str_2` | ×2 experience | 2,500 xp | 5,000 xp |
| `str_3` | ×2 experience | 250 karma+ | 500 karma+ |
| `str_4` | ×9 experience | 2,000 karma+ | 1,500 karma+ |
| `carry_1` | +0.2% per riding soul | 60,000 karma− | 200,000 karma− |

`str_1` alone is the tutorial, but **it is not what opens the rail.** The rail
opens at 50 experience on **cohort 1's chip** (§5), which is revealed at exactly
that figure and priced at 100 — so the rail is never seen empty, and `str_1`
unlocks at that 100 as the chip beside it is bought. Two chips a beat apart, not
a wall of both at once.

The strength ladder compounds to **×72** (2 × 2 × 2 × 9). `str_4` is worth
slightly more than the whole ladder above it — ×9 against ×8 — which is a retune
hazard: moving `str_1`–`str_3` moves what `str_4` means.

⚠ **Retune hazard from the instant press.** Every early gate was paced against a
press that started at one a second and only reached instant at 20,000 xp. It now
runs at the player's click rate from the first press, so the opening minutes —
and the unstaffed anchoring of the second world, which is paid per press
(`harness.clickMs`, §12) — arrive faster than the authored figures assume. The
sim bench already models a fast hand at `clicksPerSecond: 4`; run it before
trusting any early figure.

### `carry` — the hand rides with the crowd

The press is the one producer you cannot buy more of, so it is the one that falls
behind by default: everything else scales with a count and the hand scales with
nothing. `carry` fixes that by **borrowing the population** — the click gains a
share of its yield for every soul riding the harness.

Three figures, each somebody's job:

- **`riders`** — the harness's cap on how many souls ride. Bought (§12).
- **`riding`** — how many are actually up there, and 0 until an anchor is down.
  Only cohorts holding a **line** count, and souls held on the split are out: a
  soul *placing* the harness is not riding it.
- **`carry`** — what one rider is worth to you. Held by the hand. `carry_1`
  grants 0.2% per soul, so at the 200-rider cap it is +40% and at 2,000 it is
  +400%.

Deliberately linear and deliberately capped. The same modifier on a *cohort*
would be quadratic in souls, because a cohort's yield is already multiplied by
its count — which is exactly why this belongs to the hand and must stay there.
The ceiling being a purchase rather than an accident is the coupling worth
having: buying riders now pays twice.

`carry_1` is gated past `riders_1`. With nobody up there it buys nothing.

### While an anchoring job runs, the press pays differently

With a job open, the press buys **job-time instead of experience**, not as well as
it (§12). One verb with one payoff at a time, so the trade is legible — and since
the job is now one you chose to begin, it is a trade rather than a toll.

---

## 5. Cohorts and the army

Each cohort is a count of souls; each soul lives for `duration` and leaves its
yield behind when it ends. **There is no longer a fixed number of cohorts, and no
cohort has authored figures of its own.** A cohort is an index, and everything
about it falls out of that index.

### Three constants and an index

```
cost(n)     = 15 × 7^(n−1)          experience
yield(n)    = 2  × 13^(n−1)         experience per soul
life(n)     = 1/16 × 2^(n−1)        phases of the world you stand on
karma(n)    = 2  × yield(n)
ramp(1)     = 1.07
ramp(n)     = max(1.07, 1.17 − 0.01n)             n ≥ 2
```

**A life is a length in phases, not in seconds.** The world converts it:
`seconds = life(n) × phase_duration`. The ladder doubles per index and so does
the wave — a cycle is two phases, an age is eight — so every cohort lands on a
landmark the wave already has a name for, and the eight-row ladder spans exactly
one sixteenth of a phase up to one age. See *Lives are phases* below.

**The ramp is the one figure that is not flat across the ladder**, and it is
AdCap's shape: the first row is the cheap outlier, the second is the steepest,
and it eases back to the floor by cohort 10. The level gates do not move with it
— see *Levels*. What it changes is how far up them a row gets.

**Price and production ride different ratios, and that is the whole of the
pacing.** Cost multiplies by 7 a row; yield by 13 against a life that doubles, so
throughput multiplies by 6.5. The gap between those two numbers is where the
decision to move up lives.

Two consequences fall straight out and both are worth memorising:

> **rate = 6.5^(n−1) × 16 / phase_duration per second.** On a 30 s world cohort 1
> is **one experience a second**, and each cohort is six and a half times the
> throughput of the one below it.
>
> **payback = 14 s × 1.077^(n−1) × phase_duration / 30 s.** Each cohort takes
> **1.077 times** as long to repay itself as the one below it.

Both carry `phase_duration` now. The table below reads the 30 s world — worlds 1
and 2, and what the bench prices the ladder against:

| # | Base cost | Yield | Life | at 30 s | Rate/s | Payback |
|---|---|---|---|---|---|---|
| 1 | 15 | 2 | 1/16 phase | 1.9 s | 1.07 | 14 s |
| 2 | 105 | 26 | 1/8 phase | 3.8 s | 6.9 | 15 s |
| 3 | 735 | 338 | 1/4 phase | 7.5 s | 45.1 | 16 s |
| 4 | 5,145 | 4,394 | 1/2 phase | 15 s | 292.9 | 18 s |
| 5 | 36,015 | 57,122 | **1 phase** | 30 s | 1,904 | 19 s |
| 6 | 252,105 | 742,586 | **1 cycle** | 60 s | 12,376 | 20 s |
| 7 | 1.76M | 9.65M | 2 cycles | 120 s | 80,447 | 22 s |
| 8 | 12.4M | 125M | **1 age** | 240 s | 522,904 | 24 s |

**The base is 2 so that the bottom row is a unit.** A rate is the figure a
player holds, and half of one is not a number anybody counts in. The yield axis
carries it and not the life on purpose: a 1 s base would have moved every life
on the ladder, and lives are what tell two cohorts apart (§6) and what every
level rung spends itself on. Doubling the column touches neither —
but it does halve payback, which is the second generosity step in a row and is
part of what the ⚠ below is about.

### Lives are phases

**`1/16` and not `1/32`, which was the other candidate.** Two things pick it. It
holds the economy where it already sat — rates are ×1.07 against the 2 s base it
replaces, which is no change at all — where `1/32` would have doubled every rate
and made the move an income grant wearing a clock's clothes. And it is the value
that lands the eighth row on an age exactly: at `1/32` the landmarks slide up one
row and no cohort reaches an age at all.

**It is nonetheless an income knob, and the only new one.** Halving it halves
every life, which doubles every cohort's rate. It is a module constant in
`buildings.ts` rather than a `balance.ts` figure because it does not differ per
world — the bench sweeps a generated row's `life` when it wants to ask the
question.

**A longer phase pays less per second**, and that is the point. A life's yield is
fixed and only its length stretches, so a world whose phase is twice as long pays
the same per life, half as often. On the live decomposition (§13) the phase
doubles exactly once, so income has **one step down, on arriving at world 3** —
and everything priced off income steps with it: the refinery's capacity (§9), the
wisdom it feeds (§18), and the harvest snapshot (§15). The press does not: its
yield is flat and it has no life, so it is worth twice as much of your income on
a long-phase world.

⚠ How the world 2 → 3 step reads in play is unrecorded — masked by the worlds
behind you, or the climb restarting. Settle it before touching the harvest ratios
or `firstWisdomAt`.

**Lives in flight at a harvest are called off, not carried or prorated.** With
the world harvested and the next not chosen there is nowhere to be born, so a
life still running would land on nothing; it is halted at departure and a fresh
full one begins on arrival, measured against the new world. What the departing
life had served is forfeit, bounded at one life a cohort. Prorating it was the
alternative and was dropped: it would pay for an incarnation that never finished,
and the payout rounds it to zero on the low rows anyway.

### Why 13 and not 10

A yield ratio of ten leaves every row's leading digit at 1. Eight rows reading
1, 10, 100, 1_000 are **one digit with zeros appended** — the number never
changes shape, only length — and since the K/M/B suffix flips every third
decade, a suffix boundary lands exactly on a row boundary and eats it: you cross
into cohort 7 and the readout says `1M`, which is what cohort 4 said.

What moves the leading digits is the *fractional* part of `log10(ratio)`. It is
0 at ten, 0.079 at twelve — AdCap's, which only scatters because their first
jump is ×60 and knocks the sequence off-phase before the rigid ratio takes over
— and 0.114 here. Over seven rungs that is eight tenths of a full turn, so off
a base of 2 the mantissa walks **2 → 2.6 → 3.4 → 4.4 → 5.7 → 7.4 → 9.7 → 1.25**,
the whole digit range once, and never doubles back. Every row has a face; 4,394
is recognisably cohort 4 the way 4320 is recognisably Pizza Delivery.

> ⚠ **This is not a cosmetic change and must not be read as one.** Payback
> growth falls from ×1.4 a row to ×1.077 and the base halves, so cohort 8 repays
> in 25 s where it wanted 316 s. Later cohorts were deliberately *worse
> purchases* at base — bought for the ceiling they raise — and at 13 they have
> stopped being worse by
> any amount a player can feel. **All of the pacing now rests on the gates** —
> twelve rungs a row across the two level tiers (*Levels*, below), ×4,096 — and
> on two yield boosts worth +18% for the whole game. This is the trade the
> change was made to buy.

**Cohort 12 exists the moment somebody writes `n = 12`.** Its payback is 34
seconds — and that flatness is now the ladder's problem rather than its
terminator. The prestige multiplier (§18) was load-bearing for termination when
the figure was eight and a half hours; nothing is load-bearing for it now.

### The crossover is a diagnostic, not the pacing

There is a moment where one more of cohort *n* and the first of cohort *n+1*
are the same buy, and it is a ratio of ratios:

```
ramp^k = costRatio ÷ rateRatio   →   ramp^k = 7 ÷ 6.5
```

That is **k ≈ 1** at cohort 1's 1.07 and **k ≈ 0.5** at cohort 2's 1.15 — below
the first copy on every row, so the next row is the better buy from the instant
it exists. At the old ×10 yield it read k ≈ 5 and k ≈ 2.4. An earlier draft made
the single value of k the section's law — *the moment to move up is the same
moment at every rung, forever* — and a per-cohort ramp ended that. It should not
have been the law in the first place, and at 13 it has stopped being a reading
at all:

> **You cannot act on the crossover, because the next row does not exist yet.**
> A row is revealed at `175 × cost(n)` of experience spent on the row below,
> which is 24 to 38 copies depending on the ramp. The crossover is passed five
> to fifteen times over before there is anything to move up *to*.

So the reveal rule under *Entry* is the pacing, and it is the more stable of the
two: it lands between a quarter and a third of the way up every row's ladder,
whatever that row's ramp. **Read k to check the ladder is not inverted, not to
schedule anything.**

> ⚠ **Do not read the raw price-parity figure as the crossover either.**
> `1.07^n = 7` gives n ≈ 29, which is where your *n*th copy costs what the next
> row's first copy costs — but that ignores the ×6.5 the next row produces, so
> it names a moment long past the one that matters. The earlier `n ≈ 34` was
> this same mistake at the old cost decade.

**What actually pulls you deeper is the gate**, and that is *Levels*.

### Levels — why anyone owns four hundred of anything

Six rungs, gated on **current count**, each granting **×2** to that cohort. Kept
as `level`, not renamed to `milestone` — §16 already uses that word for a
different thing, and §20 corrects the earlier call to rename this to it.

**`[25, 50, 100, 200, 300, 400]`** — AdCap's ladder, taken as authored.

**A level has no price.** It is granted the moment the count clears its gate and
taken back the moment a merge drops below it. That is the whole mechanic, and it
is the reference's: AdCap's milestones are free too.

A priced rung was tried first and was never a decision. Hold one against one
more copy at gate `g`, where `M` is what a copy currently earns:

```
rung at gate g:   costs  g · c · ramp^g · pf     gains  g · M
one more copy:    costs      c · ramp^g          gains      M
```

**The `g` cancels out of both sides**, so a rung came to exactly `1/pf` times the
value of a copy at every gate, on every cohort, forever. At `pf = 1` the two are
dead even and there is never a reason to prefer a rung; at any lower figure the
rung strictly dominates and you buy it on sight. **There is no value of `pf` at
which it is a choice** — only a tax, or an off switch. Free is the honest
version, and it costs nothing to state.

#### The gate is what pulls, and it grows teeth

Free does not mean weightless. The copy that *crosses* a gate doubles the entire
row, so it is worth wildly more than the copy before it — and the gap widens all
the way up:

| Gate | payback of the copy before it | payback of the gate copy |
|---|---|---|
| 25 | 142 s | **5.9 s** |
| 50 | 386 s | **8.1 s** |
| 100 | 5,684 s | **60 s** |
| 200 | 28 days | **3.6 hours** |

⚠ This table and the rate-per-experience one below were computed against the 2 s
base that *Lives are phases* replaced. Every absolute figure shifts by ×0.94 for
payback and ×1.07 for rate on a 30 s world, and doubles or halves with the phase
elsewhere. Both tables are arguments about **ratios** — the gate copy against the
copy before it, one row's rate-per-experience against another's — and every ratio
is untouched, so they are left as they were read rather than restated a
twentieth lower.

That is *three more to the milestone*, and it is the shape the priced rung was
trying to buy. ⚠ **A gate every hundred copies makes the run-up long**: the
approach to gate 200 is a hundred copies each paying back over days, with only
the gate copy worth having. A payback-ranked buyer will stop well short. The
pull is real but it is spread far thinner than a packed ladder spreads it, and
the bench is what says whether the run-up reads as a goal or as a wall.

#### Where the gates sit — AdCap's numbers, and what they cost here

The counts are the reference's, taken as authored rather than rescaled. **The
first gate is reached in ordinary play**: 25 copies of cohort 1 is 949
experience, and cohort 2 is not revealed until 2,625, so you cross it before
there is anywhere else to go. The last is not reached at all — **gate 400 costs
121 trillion experience**, some ten thousand times cohort 8's entire opening
price, and the practical ceiling at a 1.07 ramp is somewhere near 300.

A cohort at 400 with **both** ladders complete is `400 × 4,096` = **1,638,400×**
its base rate, against 400× with no rungs at all and 25,600× on its own six.

⚠ **Its own six rungs do not make a low row stay worth owning.** Spending only
on cohort 1 buys only the per-cohort tier — ×64 where ten rungs were ×1,024,
over four times the span — and that arrives far too slowly to outrun
`cost(n) = 15 × 7^(n−1)`:

| Cohort 1 count | rungs | experience spent | rate | **rate per 1M xp** |
|---|---|---|---|---|
| 25 | 1 | 949 | 25/s | 26,344 |
| 50 | 2 | 6,097 | 100/s | 16,402 |
| **100** | **3** | **186k** | **400/s** | **2,154** |
| 200 | 4 | 161M | 1,600/s | 10 |
| 400 | 6 | 121T | 12,800/s | 0.1 |

Cohort 8's first copy is **3,162 per 1M**. The row crosses *below* that bar at
around 100 copies and never returns, so **depth on one row is dominated by width
at every point past the third gate.** The old claim — *a fully-levelled cohort 1
still earns while you are buying cohort 8* — is false at these figures and is
retired rather than restated.

That is now the shape rather than the flaw. Width is what the all-cohort tier
is priced in: going deep on one row buys ×64 and loses the race, going 25 deep
on *every* row buys a seventh rung for all of them at once. Depth still pays —
it pays through width, which is the only spend that reaches every row.

**The way out taken: the gate pays twice.** Packing the gates back under 200 was
the other candidate and is not needed. AdCap's counts are kept, and so is the
×2 rung — what changes is that each count is now *two* rewards:

> **25 of one cohort levels that cohort. 25 of every cohort levels them all.**
> Same six counts, one number to learn, and six more rungs on every row.

Twelve rungs a row, so **×4,096** rather than ×64 — the figure the ×4 rung would
have bought, without a rung that reads as anything but a halving. The second
tier is the all-cohort scope (`cohorts` in `upgrades.ts`), fanned out by
machinery that already existed.

**The top cohort gatekeeps all six.** A cohort that is not unlocked counts as
holding none, so the tier cannot fire at all until the whole ladder exists and
every row is 25 deep. That is deliberate — read against unlocked cohorts only,
25 of cohort 1 alone would grant the first rung and the grant would be taken
straight back the moment cohort 2 opened at zero. It also gates on **held**
count, not the lifetime tally, so an all-cohort rung falls with a merge exactly
as a per-cohort level does.

#### A rung halves the life until the life hits the floor

Both tiers author the same rung and nothing else:

> **A rung halves the life — or doubles the yield, once the life is already at
> `emission.streamUnder`.** Both are ×2; only the shape of the ×2 changes.

**Halving the life and doubling the yield are the same income.** Rate is yield
over duration, so `(y × floor/raw) ÷ floor` is `y ÷ raw` — the conversion is
exact, and a rung that would push a life under the floor is never wasted.

The old split spent this rule as **`halvings = min(6, n + 4)`**, derived from the
index. That guessed. The conversion now happens in `Building.#clampDuration`,
live, at the rung where *that cohort's* clock actually reaches the floor —
counting its own levels, the all-cohort rungs, and the `boost` shortenings
together. Which rung that turns out to be differs per cohort and per run, which
is precisely why it cannot be authored, and why neither `cohort-levels.ts` nor
the milestone tier writes a yield rung at all.

Holding the life at the floor rather than past it also keeps the two axes honest:
below `streamUnder` the emitter stops keeping a timer per life and pays by the
tick, so further shortening is invisible where doubling the payout is not.

**The floor stays an absolute figure and does not become a phase fraction.** It
is about the eye, and the eye does not change per world: a sixteenth of a second
reads as a rate wherever you are standing, where `1/512` of a 60 s phase is
117 ms — eight and a half a second, which is still visibly a beat. The cost is
that a long-phase world needs one more halving to reach it, which is the honest
reading, and it costs nothing in rate because the conversion is income-neutral
either way.

So the count is **`n + 4` on a 30 s world and `n + 5` on a 60 s one**, against
twelve rungs across the two tiers:

| Cohort | Base life | at 30 s | Halvings | Yield rungs | Life, all 12 rungs |
|---|---|---|---|---|---|
| 1 | 1/16 phase | 1.9 s | 5 | 7 | 62.5 ms |
| 2 | 1/8 phase | 3.8 s | 6 | 6 | 62.5 ms |
| 3 | 1/4 phase | 7.5 s | 7 | 5 | 62.5 ms |
| 4 | 1/2 phase | 15 s | 8 | 4 | 62.5 ms |
| 5 | **1 phase** | 30 s | 9 | 3 | 62.5 ms |
| 6 | **1 cycle** | 60 s | 10 | 2 | 62.5 ms |
| 7 | 2 cycles | 120 s | 11 | 1 | 62.5 ms |
| 8 | **1 age** | 240 s | 12 | 0 | 62.5 ms |

**On a 30 s world every cohort bottoms out at 62.5 ms and nowhere else.** The
claim was retired as a ten-rung artefact; twelve rungs across two tiers restore
it, and this time it is not a coincidence of the authoring — cohort 8's age is
`2^12` floors of the eye, and every row below spends its surplus rungs on yield
instead. The ladder's rate ratio is untouched: ×4,096 on every row.

⚠ **On a 60 s world the top row never becomes a stream.** Cohort 8 would want a
thirteenth halving and there are twelve, so it bottoms out at 117 ms — a fast
beat, and zero yield rungs, as cohort 7 already had. Its *rate* is unaffected;
the floor is income-neutral, so all this changes is whether the row reads as a
clock or as a flow. Whether the top of the ladder losing its stream on the long
worlds is a loss or a texture is undecided.

⚠ **A `boost` shortening makes the conversion fractional**, and `payout` rounds.
On cohort 1, whose yield is 2, a 6% shortening past the floor rounds away
entirely. It is 6% of the smallest income in the game and is left alone.
Millisecond lives are fine where they happen: the register is deadpan industrial
and a life is a ledger entry.

#### How far up the ladder each ramp gets

The gates are shared; the ramp decides reach. Given the budget that takes cohort
1 to its top gate, as a multiple of each row's own base cost:

| Cohort | ramp | count reached | rungs | row multiplier |
|---|---|---|---|---|
| 1 | 1.07 | **400** | **6** | **×64** |
| 2 | 1.15 | 199 | 3 | ×8 |
| 3 | 1.14 | 211 | 4 | ×16 |
| 4 | 1.13 | 226 | 4 | ×16 |
| 5 | 1.12 | 243 | 4 | ×16 |
| 6 | 1.11 | 263 | 4 | ×16 |
| 7 | 1.10 | 287 | 4 | ×16 |
| 8 | 1.09 | 316 | 5 | ×32 |

**Cohort 1 is the only row that reaches all six**, which is the Lemonade Stand's
role exactly. ⚠ Honestly read, the differentiation is *cohort 1 against the
rest* — rows 3 through 7 all land on four rungs and are told apart by duration.
On a six-rung ladder the whole spread is three multiplier steps wide, so the
ramp says much less about a row than it did at ten.

Four hundred copies of cohort 1 is 121 trillion experience against cohort 8's
12.4M opener, so **you finish the first cohort last** in the strongest possible
sense: on current figures you do not finish it at all. That is the AdCap shape
taken literally, and whether a terminal gate nobody reaches reads as an horizon
or as a dead entry in the rail is the thing to watch.

### Clerks — the game is clicking several things before it is clicking one

**Every cohort past the first starts manual and has a clerk to buy.** You click
its row to send one batch of souls out. A **clerk** costs `175 × cost(n)` and
thereafter the cohort runs itself, forever.

⚠ **`clerk` is a placeholder — the word is unsettled.** It reads as an office the
retired word `manager` already ruled out, and nothing tried in its place (ledger
words, mechanical ones, managerial ones, continuous-process ones) has landed. See
§19.

**Cohort 1 is the exception, and it is autonomous from its first copy.** A middle
draft of this section argued the opposite — that a row which can never be
automated is a row the *many hands, then fewer, then none* arc cannot reach — and
that argument is answered rather than accepted. The arc is about the hand being
outgrown, and cohort 1 is the row the hand is *already* holding: by the time a
second row exists there is nothing left for clicking cohort 1 to teach, and a
clerk chip on it prices busywork you would buy on sight. So autonomy rides along
with the free first copy, on the same grant, and the row is never manual.

What this costs is one rung of practice: the first clerk anyone pays for is
cohort 2's, at a price nobody was ever charged. That is a **pacing**
problem and it is answered by pacing rather than by reinstating a purchase on
cohort 1 — the reveal multiplier under *Entry* now puts cohort 2's row and
cohort 2's clerk a full ladder apart, so the price is met after the row has been
run by hand and not on sight.

What it buys is that the first-soul beat stays a thing that happens to you. There
is a placeholder log line near that idea (§1) and it should not be taken as the
copy; the beat needs writing.

This restores the dropped `autonomous` flag, which was coded and then pinned open,
and it earns three things:

- **The early game has more than one verb.** From the second row to the last
  clerk the run is a small floor of ledgers being worked by hand, which is the
  register the game wants and the shape the press alone cannot make. Cohort 1
  running itself underneath that floor is the point, not an exception to it —
  it is the one row the hand has already finished with.
- **Manual batching makes the wave a lever rather than a readout.** You can hold a
  batch through a dense phase and release it into a light one. That is a polarity
  decision with no authored numbers behind it at all, and it is what the
  `resistance` mechanic was reaching for and never delivered (§6).
- **Automation becomes a trade.** A clerk buys throughput and sells timing. *The
  wheel outgrows the hand* stops being flavour and becomes the cost curve.

The arc is then legible end to end: **many hands, then fewer, then none — and the
press, which was instant all along, is the only thing left to do.** Waiting on a
clock is the cohort's verb and not the hand's; §4 says why the press gave it up.

Lore: a clerk keeps one cohort's ledger and does not need asking. The
revision-and-reincarnation loop sits here if it is ever written. The ledger
vocabulary already suits the register (§1), which is the only claim being made —
the log itself is placeholder and no line of it is load-bearing.

### Entry

- **Cohort 1 is one chip that does three things**: it unlocks the row, hands you
  the first copy, and clerks it. Revealed at **50 lifetime experience** and
  priced at **100 experience** — about a hundred presses, since the press pays 1
  xp flat before `str_1`. The first soul is still a thing that happens to you
  rather than a chip you go looking for; it is the pressing itself that gates it,
  which is §4's press-count argument surviving in experience rather than in
  karma+. An earlier draft of this section said *free, at 30 lifetime karma+*;
  the experience pair is what ships and what is meant.
- **Every cohort past the first is revealed at `25 × cost(n)` experience** and
  has no separate entry price. The first copy *is* the entry. One reveal rule, no
  table.
  - **`25×`, and it is `175 × cost(n−1)` wearing a different hat.** A cohort
    costs a cost-decade more than the one below it, so `reveal(n+1)` and
    `clerk(n)` are the same figure: **a row appears at the exact moment the row
    below it can be automated.** Run it, clerk it, next row. The two multipliers
    are one knob and the code derives one from the other so they cannot drift.
  - **Held against the share of the row's ladder it buys.** `175 × cost(n)` of
    experience is **38 copies** at cohort 1's ramp and **24** at cohort 2's, but
    both sit between a quarter and a third of the way to that row's reach — so a
    clerk always arrives a couple of gates in, whatever the row. At the old cost
    decade it was `250×` and 43 copies, the same place.
  - ⚠ **Two framings this used to argue from are retired.** It read *the clerk
    sits just past the row's own tier II*, which needed a rung to have a price;
    rungs are free now. Then it read *38 copies, just short of tier IV's gate*,
    which needed one ramp and one gate ladder to be the same for everyone. The
    share is what survives both.
  - ⚠ **The cost lands entirely in the first ten minutes.** Income is nearly
    flat while there is one row and a button, so a threshold is close to a wait
    in direct proportion. After that income compounds and the delay stops being
    felt. **Not measured against a clock** — see *Open*.

### What this deletes

The cap-at-200 retune. Per-cohort yields, biases, durations and resistances.
Per-tier speed and yield multipliers. The six-rung gate ladder and the argument
that chose it. `through`, and `priceFactor` in every form — **a level has no
price at all now**, per-cohort or otherwise. Cohort entry prices. The `red_basic`
cohort — **the refinery is now the only source of Crimson**, which is a cleaner
story than a cohort that eats its own output.

⚠ **Per-cohort ramps are not deleted.** An earlier draft of this list cut them,
on the argument that one ramp made the crossover a single number. They came back
once rungs were free: a steeper row simply reaches fewer gates, nothing is
stranded because nothing was bought, and the ladder stays shared.

And `zealot`'s **ρ = ∞** resolves itself: every cohort yields experience, so
payback is defined everywhere and a buy-policy can rank the whole board.

### What survives untouched

**The merge rule.** A level is gated on current count, so:

> **A count-gated upgrade is held only while its count is held.**

A shallow merge costs a rung or two; merging everything costs the ladder. The
slider still prices its own consequence (§14), though more softly than the
ten-rung draft did: six rungs spread over four hundred copies means a merge has
to be deep to cost you anything at all.

**It reads better free than priced.** A merge now costs you milestones and the
counts that earned them, not money — and the way back is to re-earn the count,
with nothing to re-buy. The rule did not change; what it takes away got cleaner.

**Prices are generated, never hand-typed.** Still true, and there is now one
fewer of them: cohorts and clerks are priced by formula, and levels are not
priced at all.

**An army is a ramp.** The §5 rule still holds — count is set by the ramp — but
the conclusion inverts. The old ladder had hand-picked yields with no fixed
relation between cohorts, so income went roughly linear once the last cohort was
bought and the counts stalled. **Here income compounds by construction**: each
cohort is a fixed multiple of the last, so no row's ramp catches up, counts
never stall, and the cap that the retune installed is not needed and is gone.

### Open

- **When each cohort arrives in the run** is known from play and not written
  here.
- ~~**The depth axis does not pay.**~~ Answered by the all-cohort tier, not by a
  ×4 rung: *the gate pays twice*, twelve rungs a row, ×4,096.
- **Whether a player ever reaches gate 200.** The hundred copies before it each
  pay back over days.
- **Gate 400 is reachable, and pointless.** Play took cohort 1 to 400 — the
  121-trillion figure is small against late income — and the rung moved nothing.
  Depth wants a synergy (a count that feeds other rows), not more direct output.
  See §19, *Findings from play*.
- **The clerk multiplier of 175×** is derived from the reveal multiplier and the
  cost decade, and it has been re-checked against this economy: it prices a clerk
  between a quarter and a third of the way up the row's own ladder, whatever that
  row's ramp, which is the right moment to sell your timing.
- **Cohorts are `cohort_1`…`cohort_8` in code and `Cohort n` in the UI —
  placeholders, not names** — see §1.
- **`clerk`'s own name is unsettled** — see §19.

### All-cohorts upgrades

Two, and they fan out over every cohort — by class, so the click is excluded
without anyone writing a rule that says so.

| Upgrade | Effect | Unlocks at | Costs |
|---|---|---|---|
| `harder_lives_1` | +6% yield, all cohorts | 250,000 karma+ | 310,000 karma− |
| `hard_season` | +12% yield, all cohorts | 900,000 karma+ | 1,200,000 karma− |

They **sum** to +18% rather than compounding to +19%. A global lift on every
cohort should add up the way a player reading two percentages expects.

**Yield and not duration, and that is structural.** A life prints in the wave's
own landmarks — `1/16 phase`, `1 phase`, `2 cycles`, `1 age` — and only a power
of two lands on one. These two used to shorten by −6% / −12%, and one purchase
dropped every row of the table to seconds, permanently, on every world. Rate is
yield over duration, so the same income arrives on the axis that cannot break
the vocabulary: it is `#clampDuration`'s own substitution, moved up to where the
entry is authored. **Nothing but a halving may ever touch `duration` again.**

⚠ The pair is 3.2% weaker than the shortening it replaces — `1/0.82` is 1.2195
against 1.18. Exact parity wanted +7.32% / +14.63%, which costs the readable
pair above; both figures are placeholders wanting re-siting anyway.

⚠ Both are still much smaller than a single level rung and want re-siting
against the generated ladder.
## 6. Aim and polarity

### The dial

One **global detent**, five positions:

`−2 Hard negative · −1 Negative · 0 Even · +1 Positive · +2 Hard positive`

It decides how every cohort's karma is split between the two piles. There is no
per-cohort aiming and there is no per-cohort answer to the dial any more — **every
cohort does exactly as it is told.**

```
positiveShare    = clamp((detent + 2) / 4, shortPileFloor, 1 − shortPileFloor)
extremity        = |detent| / 2
karmaYieldFactor = (1 + extremity × (extremityMultiplier − 1)) × (1 − reaimPenalty)
```

⚠ **1 on `dev-next` since 2026-09-23** — under karma as weight a bonus here is
a cost, and the dial's new job is open (§21). The reasoning below is for 2.

`extremityMultiplier: 2`, global. **Extremity is the whole reward for
committing:** at Even you take ×1, at a hard detent ×2, and the middle detents sit
at ×1.5. Running a side pays; the game never says which side.

It was 3, and at 3 the middle detents fed the refinery exactly as well as Even —
tilting to ±1 was a free lunch and nobody had a reason to sit anywhere else. At 2
it is a trade: **+50% karma for −25% refinery at ±1, +100% for −80% at ±2.**

### The dial had a cliff, and it was a wisdom kill switch

Unclamped, `±2` put `positiveShare` at exactly 0 or 1. Short-pile income is
`positiveShare × karmaYieldFactor`, so the five detents read **0.5 · 0.5 · 0.5 ·
0.5 · 0** — three identical positions and two dead ends, not the smooth
commitment reward this section describes.

At an exact zero the refinery's `min(batch, shorter pile)` is 0 forever, so it
stops levelling — and refinery level experience is the wisdom base (§18).

> **The highest-income play banked zero prestige currency, forever.**

`shortPileFloor: 0.05` is the fix, and the cliff's one legitimate job survives at
95% of its old speed: **hard positive with the refinery idled is the only
correction fast enough to clear a deep tilt**, and that is still true at 0.05.

The floor is not applied before beat 6 — there is no negative pile yet to keep
breathing. **The dial is still two mechanics wearing one control**, and nothing
in the UI says so. Open.

### What was cut, and what replaced it

**`resistance`, `polarity_bias` and per-cohort `polarity_multiplier` are gone.**
Three authored numbers per cohort became zero, and with them go `wavePull`, the
four lean states, the greyed needle, the *turns* / *tidal* readings and the whole
geometry that drew them.

They were cut for a plain reason: **the game has never been in tune enough for
anyone to see them work.** They were a theory of cohort identity that was never
observed doing its job, sitting on top of an economy that could not be played long
enough to test it. Removing an untested mechanic costs nothing and removes a
tuning surface from every cohort at once.

**The life replaces them, and does the job better because it is already there:**

> **A life accumulates the phase bias across its whole span**, and a life is
> measured in phases (§5). So the line is exact:
>
> **A life of one phase or less can be timed. A life of one cycle or more cannot.**

Lives are powers of two, so nothing sits between those two lengths and the rule
has no middle. A life of a whole cycle spends exactly half of itself in each half
of the wave and comes out at ×1.0 — always, wherever it started — and stays there
under the excess spread below, because that spread is mean-preserving. Shorter
than a phase and where it starts is the whole of it:

| Life | Starting at a flip | Starting mid-phase |
|---|---|---|
| ¼ phase | ×1.5 or ×0.5 | ×1.5 or ×0.5 |
| 1 phase | ×1.5 or ×0.5 | ×1.0 |
| **1 cycle or more** | **×1.0** | **×1.0** |

So **short cohorts are volatile and can be timed; long cohorts are smooth and
cannot.** That is a real reason to own both ends of the ladder at once, it is
derived entirely from `life(n)`, and it costs zero authored numbers.

**The square wave is load-bearing here**, and this is the strongest argument for
keeping it. A continuous bias would blur the one-phase / one-cycle line into a
gradient and there would be no rule left to state. See §19.

⚠ **A halving changes a cohort's character, not only its speed.** A cohort
becomes timeable the rung its life drops to one phase — after `n − 5` halvings —
so levelling a long row erodes the smooth end of the ladder from underneath.
Whether that is a feature to keep or a thing to cap is undecided; see §19.

**The manual batch is the lever this hands you.** A cohort without a clerk (§5)
sends its souls when you click it, so you can hold a batch through a dense phase
and release it into a light one. Buying the clerk sells that timing for
throughput. **This is the polarity decision the removed numbers were reaching
for**, and it is legible without a needle diagram.

⚠ **The lever only exists for cohorts of one phase or less.** Holding a
cycle-long batch for the right phase changes nothing, so a manual long cohort
offers waiting and nothing else, and its clerk sells throughput alone — which
breaks §5's *automation is a trade* at that end of the ladder. Cheaper clerks for
long rows, or long rows arriving clerked, would both fix it and both break
`clerk(n) = reveal(n+1)`, so neither is taken. Unresolved; see §19.

### The phase bias

`biasWith: 1.5` / `biasAgainst: 0.5`. A phase pays the polarity running with it
×1.5 and the one running against it ×0.5 — **at even. Excess widens the pair.**

```
spread      = 0.5 + excessSpread × |excess|
biasWith    = 1 + spread
biasAgainst = 1 − spread
```

`excessSpread: 0.4`, placeholder. At |excess| 1.0 the pair is ×1.9 / ×0.1. It is
**mean-preserving** — the two always sum to 2.0, so this is not a tax and a tilted
run earns the same karma per cycle as it did before. Phase durations are untouched,
so §9's cycle mean and §13's age arithmetic never see it. `excessSpread` must stay
under 0.5: a phase paying literally nothing is a different mechanic. Before both
piles exist the reading is undefined (§8) and the authored pair stands — undefined
is *unknown*, not even.

**This is the first thing excess does other than say no.** It only ever gated a
door. Now a deep tilt is audible: correction is fast in one phase and near-stalled
in the other, so digging out is *wait for the phase, then aim* rather than holding
a dial for a hundred seconds. It also makes three things observable that the design
already leaned on — the re-aim penalty is priced in phases, so *when* you pay it
now matters; the short-vs-long cohort identity below; and the manual batch as a
lever.

It is a **square wave**: a rate sits flat for a whole phase and then jumps on the
flip — by a factor of 3 at even, and up to 19 at a full tilt. Making it continuous over the phase position is still a
real option, but it changes the average bias across a phase and the excess reading
is a function of income — so it is a **balance change, not a display one**. Open.

**Now that lives span phases, the square wave has a second job**: it is what makes
a long life's averaging worth anything. Against a continuous bias the two ends of
the cohort ladder would converge, and the identity §5 leans on would flatten out.
That is an argument *for* the square wave that did not exist before.

### The re-aim penalty

Changing the detent costs you. `reaimPenalty: 0.65` — a 65% cut to karma —
decaying linearly to nothing over a span the move itself buys.

**The cost is the distance, not the destination.**

```
phases = reaimPhases × ceil(|Δdetent| / 2)
```

`reaimPhases: 1` is the **unit**, so the shortest step costs one phase and a full
swing across the track costs two.

| Move | \|Δ\| | Phases |
|---|---|---|
| 0 → ±1 | 1 | 1 |
| 0 → ±2, or ±1 → ∓1 | 2 | 1 |
| ±2 → ∓1 | 3 | 2 |
| ±2 → ∓2 | 4 | 2 |

A flat cost was the wrong shape: it made re-aiming constant and turned the
penalty into permanent background, and **a cost that is always on is not a
cost**. It also priced a nudge and a full reversal identically.

⚠ **Do not price by destination.** Making ±2 expensive to *enter* is thematically
right and mechanically wrong: hard aim with the refinery idled is the only
correction fast enough to clear a deep tilt, and that emergency brake has to stay
cheap to pull.

⚠ **Halved and rounded up, not `|Δ|` outright.** World 1 is eight phases, so a
raw `|Δ|` puts a full swing at half the first world. `ceil(|Δ|/2)` is the safe
authoring; §19's standing question — whether `reaimPhases` should be a share of
the world rather than a count — is the one that would make `|Δ|` affordable.

**Scale the duration, never the depth.** The wave strip's end-of-penalty marker
is what made this feel deliberate, and a marker can only move if the duration
does. `reaimPenalty: 0.65` therefore stays put at every distance.

**The dial is drafted, then confirmed.** Pointing it is free; one verb in the
Aim panel's aside buys the change. It used to commit the instant the detent
moved, which made a drag across the track pay the penalty once per detent it
crossed — the cost of a decision depended on how you happened to make it.

> **The confirm button is also what makes distance pricing possible.** That
> objection was the reason per-detent pricing was rejected, and it is spent:
> `|Δdetent|` is well defined at the moment of confirm, whatever path the handle
> took to get there.

The draft is not saved: a pending aim surviving a reload is a decision nobody
made.

**The wave draws where it ends.** A solid line on the phase strip marks the
phase the penalty runs out at, and a fainter one previews where it would land if
you confirmed a pending draft now. A cost priced in phases belongs on the phase
clock, so *wait for the phase, then aim* is a thing you can see rather than a
thing you have to count.

**It is priced in phases, not seconds.** That matters and is a rule worth keeping:
phases are a clock nothing can buy (§7), so a penalty priced in phases is a fixed,
readable cost. It touches **karma only** — a penalty that slowed experience would,
under the old experience-priced wave, have extended its own duration.

⚠ The penalty was tuned against an economy where resisted cohorts kept earning
through a re-aim. Nothing resists now, so it bites harder than it did. It wants
re-measuring, not necessarily changing.

### Reaching a world resets the dial

> **You arrive at every world at Even, free.** The reset is not a move, so it
> costs no phases and it clears whatever penalty was still owed.

Three things make it the right rule rather than a convenience:

- **The penalty's clock is the world's, not the run's.** The mark is kept in the
  active world's progress units (§7), so a penalty owed at phase 12 of the world
  behind you would read against a new clock that has just restarted at zero — and
  hang at full depth until the new world caught up to a phase it never shared.
- **A world's demand has to start neutral.** §14 reads `matchShare` off the karma
  earned on the world. A hard tilt carried across the gap would begin filling the
  next world's tally — against a pole that **alternates** — before its screen had
  said a word about it.
- **The swing gets cheaper, and that is the intent.** From Even, committing to
  either pole is one phase; carried across, a full reversal is two. §14 asks for
  the swing once a world, and this is what keeps asking for it affordable.

It fires on **reaching** a world and nowhere else. Restoring a save resumes
exactly where the run was, and the boot's first world is already at Even.
## 7. The wave is a clock

> **A phase is a fixed span of time spent on the world. Income must never buy
> wave speed.**

This is the single most load-bearing invariant in the design.

### Vocabulary

A **phase** is a half-wave, **light** or **dense**. Two phases make a **cycle**.
`cycles_per_age` cycles make an **age**. `ages` counts up without limit — a
planet is finished by harvesting, not by running out of ages.

`phase_duration` is authored per world. Only the world you are standing on ages;
a harvested one freezes where you left it. The gap between worlds is free.

The clock is **unclamped**: a backgrounded tab still spends the time. The wave is
the one clock nothing can be bought to hurry, so it should not be the one clock
that quietly stops when you look away.

### Why it is not priced in experience

It used to be, on a geometric ramp, which put phases at `log_r(experience)`. The
failure was not a bad number, it was the shape. All four reasons are the standing
argument against any proposal to re-couple them:

1. **Income and time entered identically**, as multipliers on one stock. A
   tenfold income bought `log_r(10)` phases outright. Since income in an
   incremental multiplies while time only adds, **buying always beat waiting** at
   advancing the wave — so the wave was an income readout wearing a clock's face,
   and you could buy past an unfavourable phase, which quietly deleted it as a
   decision.
2. **It was a race between two exponentials with nothing tying them together.**
   Phases "stay about as long as each other" only holds if income also multiplies
   by exactly `r` per phase. Early it beat that and phases flew; once the cost
   ladders bit it fell under and they crawled. Any fixed `r` is right at one
   moment of the run.
3. **The crawl and income-resistance were the same knob pulled opposite ways.**
   Raising `r` to blunt income also made the gate unreachable — the third world
   wanted 10^41 experience for its `agesLived: 4`.
4. **World length depended on the run before it.** A strong player reached the
   third world faster than the second, so the pacing curve inverted under exactly
   the players it should have stretched.

**There is no middle.** A self-normalising output clock — phase *n* costs a
multiple of what phase *n−1* delivered — makes a tenfold income buy tenfold wave
speed *permanently*, which is worse than the log. The only pricing that holds a
phase steady is `income × seconds`, which is a seconds clock in a costume. Either
income buys wave speed or it does not; this is the version where it does not.

### What it costs, taken knowingly

The wave is no longer connected to the thing the game is about. "Experience as
time" was a concept worth liking and was let go on the pacing argument. **If it
comes back, it comes back as an explicit, priced upgrade axis on phase speed —
not as the pricing of the clock itself.**

What it buys: `agesLived` is now a promise you can read (4 / 8 / 16 minutes, §13),
`reaimPhases` means something fixed, and a countdown to the next phase is
arithmetic rather than a forecast.

---

## 8. Excess — there is no wall

> **Excess is the share of the karma you are holding that has nothing to pair
> with.**

```
excess = (P − N) / (P + N)
```

Signed: **negative is Burden**, **positive is Comfort**. No denominator to
author, no window, no seconds figure. It is a proportion of the piles themselves.

**Bounded ±1, and ±1 means a pile is at zero.** Under the coverage model (§9)
that is no longer the same event as the refinery stalling — coverage never
reaches 1.0, so there is nothing left here that stalls — but it is still the
meter's honest end: one pile fully spent, the other holding everything.

It reads `undefined` until **both piles have ever existed**. Before the choice
that creates negative karma there is one pole and no imbalance to read.

### Why the income-rate version was wrong

The first shipped version read unpaired karma against income × a 600-second
window. It failed for a reason worth keeping written down, because it is not
obvious:

**The income wall could not spiral, arithmetically.** Unpaired karma is roughly
tilt × the integral of income; the wall is income × 600. Income appears on both
sides and cancels, leaving *tilt × minutes ÷ 10*. The reading never depended on
how big your economy was, only on how long you had been tilted — and every new
cohort widened the wall the instant it was bought, so **growth cleaned you**. The
thing that was supposed to be a debt was being paid off by playing well.

It was also unreadable: karma income carries the extremity payoff and the phase
bias, so the flip swung the denominator by up to 2.3× and the meter jumped while
the piles had not moved at all. A stock read against a rate that oscillates is a
reading you cannot act on.

Two other candidates fail the same way: a **lifetime total** decays to zero
because it only grows, and an **authored per-planet figure** would make the
reading jump on arrival somewhere new.

### The objection that killed this candidate is now the feature

It was originally rejected because matched-pair refining takes equal amounts from
both piles — numerator holds, denominator shrinks — so refining would *raise*
your excess, against the premise that the refinery was the main way excess left
you. Both halves moved. **The refinery pairs now, so it cannot reach the unpaired
remainder at all.** And a reading that climbs as the refinery eats your matched
stock is exactly right: what is left when the pairs are gone *is* your imbalance,
undisguised.

### Consequences

- **The gates are honest percentages.** `excessGate` at 0.12 / 0.08 / 0.05 reads
  as *at most 12% of what you hold is unpaired*, tightening per world.
- **`evenBand` at 0.02** — the window inside which a first harvest locks as Even
  rather than tilted — is strictly tighter than the tightest gate, so **locking
  Even is harder than passing any door**. That resolves a mismatch that had been
  flagged as a problem.
- **Reserving souls raises the reading**, because refining shrinks held karma
  while leaving the unpaired part alone. That is correct and it is the pressure:
  staffing the refinery does not clean you, it strips the pairs away and leaves
  the tilt showing. **The only thing that lowers excess is aiming into the pile
  you are short of.**
- **Spending karma is a third way down, and it is one-sided** — see §3.
- **Merging souls no longer moves the reading.**
- **It is flat while you pay a deep tilt off.** With one pile pinned near zero by
  a refinery that eats it on arrival, the ratio sits near ±1 until the big pile
  actually drains. The debt is the meter; the *rate* you are paying it at is a
  separate reading. **Worth watching in play — if it reads as dead rather than as
  ominous, the answer is a second readout, not a different denominator.**

The per-planet part is only the gate. Excess itself is global.

### Correction is bounded, and the bound is cheap

The income-rate version failed because income cancelled out of its own reading.
The ratio version fixed the jitter and **kept that flaw one derivative up**: both
piles are the running total of a compounding income, so they are mostly recent
earnings, and correcting means out-earning your own history.

At income doubling each minute, five minutes at +1 leaves excess at 0.5 — and
**one minute at −2 overshoots clean past zero**, because that minute alone is
larger than the five before it. At the design's `t^2.3`:

> **Clearing any tilt, at any depth, at any economy size, costs about 10% of the
> run so far.**

*There is no wall* was read as a virtue. **The meter has a maximum badness and it
is affordable** — which is why excess rarely bites. Any debuff meant to fix this
has one test: **does it break the proportionality between correction rate and
current income?** Anything that scales with income will not. §21 holds the one
candidate that passes, the short-pile skim.

---

## 9. The refinery

Reserved souls feed matched karma into the refinery, which returns Crimson.

> **A mix problem sitting on a throughput one.**

**One draw serves both lanes and the shorter pile caps it.** Polarity survives
the step — a matched pair of karma becomes a matched pair of Crimson — but the
*imbalance* does not survive it, because the imbalance never enters. The unpaired
remainder is trapped in karma, where the aim dial is the only thing that can
reach it.

**This replaced two independent lanes**, each drawing from its own pile as fast
as it could. That shape was neutral on excess by construction, and then *worse*
than neutral: once the shorter pile emptied, the surviving lane ground the
surplus away on its own. **The refinery was quietly cleaning up after the
player**, which is the whole reason excess never read as dangerous.

⚠ **Superseded on `dev-next`, 2026-09-23:** capacity now draws on the stock,
`min(P, N) × reach / drawSeconds`, and coverage is retired — see §21, *Karma as
weight*. The argument below is kept until that proposal is settled.

**Capacity is a saturating share of what you produce, not a share of what you
are holding.** A fixed batch is a fixed figure against an economy with no
ceiling: it is correct for a few minutes of one run and then either drains
both piles on arrival or moves a rounding error of production once income has
grown past it. A residence-time draw — proportional to the *pile* — fixed that
but read as a stock, so the number jittered whenever the backlog moved and
never visibly answered "is this upgrade working." A first pass at coverage
fixed the jitter but let upgrades multiply an unbounded product straight past
1.0 — coverage above 1.0 asks for karma that does not exist, which nothing can
spend, so the rungs above the milestone bought nothing. Coverage is now a
*saturating view* over that product instead:

```
reach     = coveragePerWorker × workers × efficiency   per lane, unitless, uncapped
coverage  = reach / (1 + reach)                        approaches 1.0, never reaches it
capacity  = coverage × shortPileIncome                 per lane, karma/s
batch     = capacity × interval
```

`shortPileIncome` is cohort karma with the wave's phase bias excluded — the bias
is 1.5 and 0.5 over equal halves of a cycle, so it averages to exactly 1.0, and
excluding it *is* the cycle mean, not an approximation. That is what keeps
coverage from jittering: nothing about it depends on the size of a pile.

⚠ **Capacity halves on arrival at world 3.** It is a share of income, and income
halves when the phase doubles (§5, §13) — so crimson per second, and the wisdom
it feeds (§18), step down with everything else. `firstWisdomAt` was already due a
recalibration and now has a second reason.

**The backlog always grows, by construction, and that is deliberate.**
Coverage never reaches 1.0, so capacity is permanently pinned under
production — there is nothing here that stalls, and no worker count or
upgrade total can ever push the refinery past what exists to clear. There is
no coverage milestone any more; the payoff for running the refinery lives in
the level's conversion ratio instead (below).

### Two bought axes, and the level moves a third that upgrades cannot touch

| Axis | Moves | How |
|---|---|---|
| **staffing** | reserved souls working it | `min(reserve, slots)`, linear |
| **efficiency** | what one worker is worth | multiplies `reach` |
| **reach** | the same channel as efficiency, renamed for the fiction | multiplies `reach` |

**None of these buy rate directly — they buy `reach`, and `coverage` reads it
back as a saturating share.** `capacity × interval` cancels the interval clean
out of throughput, so a duration modifier here would do nothing; `reach_*`
upgrades multiply `reach`, on the same channel `efficiency_*` does. `interval`
is fixed as pulse granularity, nothing more — free to move for feel, since the
saturating pile can never run thin the way a fixed batch could.

### The level

Both axes above only move when something is bought, so `reach` — and the
coverage read off it — would flatline once the upgrade table runs out. **The
level is growth the refinery earns by running, but it no longer feeds
`reach`.** Coverage would have no ceiling to approach if the level pushed it
too, and prior drafts of this section paid the level onto the same product
efficiency and speed did — a fourth name on one multiplier, not a fourth axis.
The level now owns a genuinely separate quantity: crimson paid per karma
drawn.

```
ratio = ratioBase + (level − 1) / levelHalving
```

**Deliberately below 1 at level 1.** The refinery starts lossy — four karma in
for one crimson out at the authored figures below — and levelling is what
closes the gap. Crossing `ratio` 1.0 is a real milestone the log calls out:
the refinery stops wasting what passes through it. Uncapped past that, so it
keeps climbing after the upgrade table runs dry, but `expGrowth` makes every
level 35% steeper than the last, so it self-limits in wall-clock without an
authored ceiling.

Pairing and polarity still survive the step exactly as before — the draw is
still symmetric across both lanes, still capped by the shorter pile, and the
unpaired remainder still never enters. What changes is only the size of the
matched pair that comes out the other side.

**Its experience is karma actually moved**, summed from what the piles gave
up, not a flat tick per pulse — and only the karma side, never the crimson
`ratio` pays out, or the level would be raising its own input. **A separate,
never-decremented total of *crimson produced* is what prestige reads** —
wisdom is `√(crimson produced across the run / W)` (§18), so a level's climbing
ratio compounds into the outer wheel the same run that earned it. That is what
makes it scale late: the refinery levels at the rate the world feeds it, a
starved pile halves the rate, and an unstaffed one earns nothing while its
clock keeps pulsing.

### What throughput actually is

> **Karma moved per second is `coverage × shortPileIncome`, and crimson paid
> per second is that times `ratio` — two different figures, legible on their
> own screens, at every scale the economy reaches.**

Run one pole hard and the short pile is a trickle, so the refinery moves a
trickle and the run banks little wisdom despite enormous karma production —
refining is the work that produces understanding, and a one-sided life produces
plenty of karma and little of it.

### Authored figures — all placeholders

| Knob | Value |
|---|---|
| `slots` base | 4 |
| `coveragePerWorker` | 0.00125 |
| `interval` | 2,000 ms |
| `expBase` | 5,000 karma to reach level 2 |
| `expGrowth` | 1.35 |
| `ratioBase` | 0.25 — four karma to make one crimson at level 1 |
| `levelHalving` | 36 — crosses ratio 1.0 at level 28 |

`slots` used to open at 0 and reach 4 through a free `slots_0` grant. Baked in
as a base instead: the refinery must be able to pair from the moment it is
revealed, not sit inert until an unrelated karma total crosses a threshold
nobody is told about. `slots_1` below now adds to this base rather than to zero.

At 16 workers and ×64 efficiency (the full ladder, uniform ×2 rungs) that
gives `reach` 1.28 → **56.1%** coverage, and the ladder's coverage steps grow
monotonically rung to rung. Coverage plateaus there — it is a stable
characterization, not a growth axis — while `ratio` keeps climbing past 1.0
for as long as the refinery keeps running.

Conversion is no longer 1:1. `ratio` is now authored and earned rather than
fixed — the knob this section once reserved as "the obvious next balance
knob" is spent.

### Upgrades

| Upgrade | Effect | Unlocks at | Costs |
|---|---|---|---|
| `efficiency_1` | reach ×2 | 2,000 Crimson+ | 1,000,000 xp |
| `reach_1` | reach ×2 | 8,000 Crimson+ | 6,000 Crimson+ |
| `slots_1` | +12 slots (16 total) | 16,000 Crimson+ | 12,000 Crimson+ |
| `efficiency_2` | reach ×2 | 500 Ochre | 1,500 Ochre |
| `reach_2` | reach ×2 | 1,000 Ochre | 5,000 Ochre |
| `reach_3` | reach ×2 | 50,000 Ochre | 150,000 Ochre |
| `reach_4` | reach ×2 | 1 Indigo | 50 Indigo |

Every rung is now ×2, uniformly — the ×1.5 rungs made the earliest steps
mushy for no benefit once coverage reads as a saturating percentage. Each is
**priced in what buying it should make you feel**: slots in karma, efficiency
and reach in what the refinery itself makes. The crimson-denominated gates sit
further out than they would at 1:1 conversion, because the refinery is lossy
early — an early gate in crimson is scarcer than the same figure was before
`ratio` existed.

`slots_2` is not yet authored. Slots enter `reach` linearly and saturation
makes any worker count safe, but souls cap well below the 40 this section once
assumed (`countRefining()` is bounded by what a run's souls actually reach) —
a slot rung past the reachable soul supply is a dead rung, the same disease in
a different channel. Author it once the real ceiling is known.

### Parked

Soul *types* feeding the refinery differently, and any partial-staffing curve
where empty slots slow coverage rather than shrink it. Both considered and set
aside as too complex for a first pass. A blunter, step-function alternative to
coverage — pegging the batch to the cohort ladder's own ×5-per-index growth — is
kept as a fallback if coverage still reads as too indirect once played.

A **bought** third axis is reserved but not spent: the saturation constant
itself (`coverage = reach / (c + reach)`, `c` bought down from 1 — the same
reach going further rather than more of it) is the leading candidate. A bought
conversion-ratio upgrade is explicitly rejected for now — the level already
owns that quantity, and a second source on it would recreate the very
one-multiplier-two-names problem this rewrite just resolved.

Letting the refinery reach the unpaired remainder — rather than only the
matched pairs — was considered as a replacement for the retired coverage
milestone and rejected for this pass: it contradicts "the imbalance never
enters" above, it would make excess *fall* rather than rise when the refinery
runs (see §8's "staffing the refinery does not clean you"), and it would blunt
the hard-detent cliff `shortPileFloor` exists to keep survivable (§6). Worth
its own design pass, not a rider on this one.

---

## 10. Grades and inversion

The grade layer sits **above** the refinery and is the only place matching
happens. Nothing here runs on a clock — a purchase is a click.

| Purchase | Costs | Gives |
|---|---|---|
| **Ochre** | 1,500 Crimson **from each pile** | 1 Ochre |
| **Indigo** | 3,000 Ochre | 1 Indigo |
| **Inversion** | opposite Crimson, at a climbing price | 1 Crimson of the side you want |

**Ochre's price is per side, not the total.** Pairing is the point, so what the
button reads is what each pile loses. A total would have the watched pile drop by
half what was clicked.

**The two grade prices are flat, forever.** A scaling Ochre would make refining
throughput pay *less* the longer you play, which fights all three refinery axes
at once — you would buy speed and efficiency to stand still. **The grades are a
ladder, not a shop**, and 1,500-from-each-pile is a ratio rather than a price
curve.

**Indigo opens on holding any Ochre.** No authored figure, because the ladder
teaches itself: the rung above appears once the one below exists.

### Inversion is the one price that climbs

```
cost of the nth inversion = 24 × 1.25^(inversions ever made + n)
```

**`inversions` never resets** — not on harvest, not on reaching. The alternatives
both fail the same way: a per-transaction curve is dodged by dribbling, and a
per-world budget makes inverting a renewable resource.

This is the only purchase that must never become the cheap way to run a single
polarity, because the wave, the aim and the whole excess reading assume you are
living with the polarity you earned. **Each inversion is a confession and makes
the next dearer for the rest of the run.**

**Inversion no longer buys an escape from a stalled refinery** (§9) — coverage
saturates below 1.0 and pins capacity under production forever, so the pile
only ever grows and there is no stall left to be paid out of. What inversion still buys
is the opposite Crimson directly, at a climbing price, which stands on its own:
a run committed to one polarity can still want a little of the other grade
without re-aiming the whole fleet. Whether that alone is enough of a reason for
the price to keep climbing is open.

The verb is **`invert`** and the noun is **`inversion`**. Not *reverse* —
reversing implies undoing a step, and this undoes nothing: it buys the opposite
side at a loss, which is a different admission.

### Open

- **Wisdom has left this section**, and this is no longer a promise: the token row
  and its price are deleted, and wisdom is the prestige residue (§18), earned by
  ending a run and never bought.
- **Indigo's buyer is the deep end of the knowledge market** (§18) and that market
  is unauthored.
- **The flat grade prices are the discrete version of an idea §18 argues should be
  a rate.** The defence above — *a ladder, not a shop* — is a good argument for
  keeping conversion legible and a poor one for keeping it fixed. Commerce
  supersedes this in intent and not yet in figures.
- All remaining figures are placeholders and are not tuned against the refinery's
  placeholders either.

---

## 11. Souls as labour

### The split is a fraction

A held soul is **a share of every cohort**, taken proportionally, never chosen by
flavour. Rounding is per cohort. Reserved souls are still yours, unlike merged
ones — **they only stop earning, and that is the whole of what reserving costs.**

### Two levers, not one

`Reserve` holds an **anchoring** share and a **refining** share. Both are shares
of the whole population, clamped so they sum to at most one; whatever neither
claims incarnates.

This replaced a single fraction with a priority rule underneath it — the harness
drained the pool and the refinery worked the remainder. That made two decisions
into one: staffing the harness silently stopped the refinery, and there was no
way to say so.

**Neither lever can take from the other.** A lever clamps against what the other
leaves rather than pushing it down. A handle that can be dragged somewhere it
springs back from is a bar arguing with the hand on it.

### One soul, one job

The pool is exclusive, and **anchoring draws first** — a world still going down
is what stands in the way. The harness takes its slots' worth; the refinery gets
the remainder. A finished world hands every soul back rather than holding a crew
for a job that is done.

**The anchoring share only bites while a job you began is going down.** With no
job open it releases and those souls incarnate, so a lever left set between
worlds — or on a world whose offer you declined — costs nothing.

### Overshoot is the cost

> **A share larger than its slots leaves souls idle: neither working nor
> incarnating.**

That is what makes the granularity upgrades worth buying. A 25% detent cannot
land on the slot count, so the coarse lever is paid for in wasted souls, and each
rung down buys some back. The readout names it: `96 out · 6 anchoring · 12 idle`.
Those twelve are what the split is overspending.

**The ladder is `[0.25, 0.15, 0.1, 0.05, 0.025]`** and it must stay monotonically
finer — a `step` upgrade that coarsened the lever would be a downgrade sold as a
reward. Three `split_*` upgrades buy rungs down it (§12).

**Two ladders, one shape.** Granularity is a *harness* upgrade axis, so the
refinery keeps a ladder of its own — identical to start with, and free to
diverge. Shared, every anchor purchase would have quietly bought the refining
lever too.

**Watch for:** a bar that cannot help reading *idle* at every position past the
first detent may read as a mistake rather than as a cost. The surplus is the
point, but the point has to land.

---

## 12. Anchoring and the harness

A world **past the first** *offers* anchor slots. A world declares how many its
surface has; the first world has none, which is why anchoring is first met on the
second world.

> **Anchoring is opt-in.** A world with slots is not a world being anchored.

It used to be a forced phase from the moment you arrived, and the only thing you
decided was how fast to pay for it. It is now a **trade you may decline**: begun
from a verb under the planet on Details, cancelled from the same verb, and worth
taking because the anchors pay twice — while you live there, and forever after
you leave.

**Cancelling forfeits everything.** Placed job-ms goes back to zero and the
anchors come out. A job resumed from a saved fraction would make cancelling free,
which is the one thing it must not be.

**The cost, once begun, is what it always was.** Souls still incarnate
throughout; what anchoring costs is the held souls not earning. And the **hand is
the exception**: while placing, the press buys job-time *instead* of experience,
not as well as it. One verb with one payoff at a time.

### The world offers, the rig answers

Two numbers decide how many anchors go down:

```
anchorsAsked = min(harness anchors, world's anchor slots)
```

The world's figure is a **ceiling**, not a demand. A late world offering five
slots to a rig that can fill two is a world you anchor partway — and a reason to
come back to the Harness tab.

### Progress is a time

> **The thing that moves is milliseconds of the job, never an abstract work
> unit.**

An anchor is `duration` ms of job. Souls do not add work — **they set how fast
job-time runs.** `perWorker` is job-ms per real ms per worker, so:

```
speed        = workers × perWorker          [workers = min(souls held for anchoring, slots)]
next anchor in = anchorRemaining / speed
```

The division lives at the *reading*, not at the base. So **a split dragged
mid-anchor moves the countdown at once and never moves the fill** — work done is
work done.

**The press is the reason for the denomination.** `clickMs` comes off the job
directly, so a world can be clicked open at zero staffing — and the same press is
a much smaller dent in the *countdown* once souls are on it. Clicking matters at
the start of a world and stops mattering as souls arrive, which is the shape the
lever wants.

### Authored figures

| Knob | Value | Note |
|---|---|---|
| `perWorker` | 0.2 job-ms per real ms | placeholder |
| `clickMs` | 250 job-ms per press | placeholder |
| `slots` base | 6 | the harness must be workable the moment it is revealed |
| `riders` base | 200 | the finished harness must pay the moment it is revealed |
| `anchors` base | 1 | every world is anchorable a little; none is anchorable whole |
| `lineBase` / `lineGrowth` | 400 each pile, ×1.6 | what a cohort line costs, and how fast |

Both bases used to be free grants (`slots_0`, `riders_0`) gated on an unrelated
karma total, so a harness could sit revealed and inert until that total
happened to be crossed. Baked in as bases instead — `slots_1`/`riders_1` below
now add to them rather than to zero.

| World | Slots offered | Each | Total job at full rig | Bonus per anchor |
|---|---|---|---|---|
| first | — | — | — | — |
| second | 2 | 36,000 ms | 72,000 | +25% |
| third | 3 | 180,000 ms | 540,000 | +45% |

**⚠ These no longer produce the pacing they were designed for.** At `perWorker`
0.2 the second world's harness goes down in **~60 seconds** at the six slots
`slots_1` buys, and the third in **~90 seconds** at thirty slots. The argument
that set these durations assumed `perWorker` 0.02 and targeted ~10 minutes and
~50 minutes. Either `perWorker` or the durations wants a factor of ten. **A
job-ms figure is only meaningful beside the `perWorker` rate and the slot count
that will be in hand — retune the three together.** See §19.

### Who is carried

**Work slots** cap how many reserved souls place at once, so the split has an
optimum rather than *always max*. **Rider slots** cap how many souls the finished
harness pays. And a **cohort line** decides *which* cohorts are eligible at all.

> **A line is permission; riders are capacity.** A cohort with no line rides
> nothing and is paid nothing extra, however many anchors are down.

**Line `k` strings cohort `k mod 8`.** The first eight go up the ladder in order;
the ninth goes back to cohort 1, and **every line a cohort holds pays its bonus
again**. The rider cap is shared across lined cohorts in proportion to what each
has out — so a new line reaches further *and* spreads what you already have.

**A world caps the lines, not the rig.** Its anchors make a figure, and the figure
holds one line per family — `1, 3, 6, 10, 14, 18, 22, 24` for 1…8 anchors. Lines
bought beyond that wait unstrung on a smaller world; a line is only buyable when a
family and a cohort both exist for it.

"Only riders get the bonus" resolves into one scalar per cohort rather than two
soul populations:

```
multiplier(cohort) = 1 + bonusPerAnchor × placed × covered × linesHeld
                   = 1                              if the cohort holds no line
covered            = min(riders for cohort, souls) / souls
```

The **covered share** scales it, which keeps a cohort's payout a single multiply
and keeps the cap honest at every count.

**A rider is a count, not a share.** Riders appear as the lines do, not when the
last anchor lands, so the swarm populates a growing harness.

### And what a finished world keeps

The anchors stay on the world when you leave. So the first harvest reads them the
way it reads the alignment and the income — once, on the way out — and every
delivery afterwards is multiplied by it, forever:

```
anchorBonus = 1 + bonusPerAnchor × placed          locked at departure
```

**Nominal, with no coverage cut.** The living multiplier is scaled by the carried
share because riders are souls standing on the world; after departure the world is
empty and the anchors remain, so what the harvest is worth is the anchors alone.

This is the whole reason to take a world's offer. While you are there, anchoring
costs you souls and presses and pays a multiplier back; once you have gone, it is
the only thing you can still change about what a finished world pays.

### Upgrades

Bought on the **Harness tab** (§17), and priced in **both crimsons** — a harness
is strung by souls of both kinds, and a rig bought out of one pile would be a way
to run a single polarity without paying the refinery's matching for it.

| Upgrade | Effect | Unlocks at | Costs |
|---|---|---|---|
| `split_1` | one rung finer | 80,000 karma+ | 500,000 xp |
| `anchors_1` | +1 anchor placeable | 400 Crimson+ | 900 each Crimson |
| `lines` | opens cohort lines | 600 Crimson+ | 1,200 each Crimson |
| `slots_1` | +24 work slots | 1,000 Crimson+ | 2,500 each Crimson |
| `work_1` | +50% placing speed | 2,000 Crimson+ | 3,500 each Crimson |
| `split_2` | one rung finer | 4,000 Crimson+ | 5,000 each Crimson |
| `press_1` | +0.5s per press | 6,000 Crimson+ | 7,500 each Crimson |
| `anchors_2` | +2 anchors placeable | 8,000 Crimson+ | 9,000 each Crimson |
| `riders_1` | +2,000 riders | 10,000 Crimson+ | 12,000 each Crimson |
| `work_2` | +100% placing speed | 200 Ochre | 400 Ochre |
| `split_3` | one rung finer | 500 Ochre | 750 Ochre |
| `anchors_3` | +4 anchors placeable | 900 Ochre | 1,400 Ochre |

Both rider caps are raw soul counts, so they took the army's ×5 with it — 40 out
of a thousand incarnating would carry nobody worth counting.

**Anchor count is an upgrade axis now**, reversing §12's earlier deferral. It
stopped being speculative when the world's figure became a ceiling: without a
`anchors` axis there is nothing to buy toward the slots a late world offers, and
the ceiling is decoration.

**Lines are the one capacity that is not a modifier.** An upgrade opens them and
then each is bought on its own, repeatedly, at a price that climbs — the shape
the refinery's inversions already use. A fixed ladder of `lines_1`, `lines_2`
would have to guess how many cohorts you will have; a curve does not.

**Split granularity is the harness's alone.** The refinery keeps its own ladder
(§11), or every anchor purchase would quietly buy the refining lever too.

### Upgrades are visible

Four axes move the rig's drawing — `slots` its anchors' size, `riders` the cage's
density and levels, `step` its twist, and each **line lights the family its
cohort claims**. `work` and `press` have no picture: facets, chamfer and ink are
the anchor's identity, not axes, and were taken back. The `DEFAULT_ANCHOR` and
`DEFAULT_HARNESS` literals are the **starting** values, not the target: each map
runs from the default toward a ceiling and never below it, hyperbolically, so an
axis bought in thousands keeps moving the picture instead of saturating.

The Harness tab draws the rig on a flat, nameless body for this reason. It is
equipment, not a world — the deformation is zeroed because deformation reads as
*size*, and every anchor draws placed because what it shows is what the rig can
put down, not how far along a job is. That body is the `harness` record in
`planet-visuals`, authored in the lab like any other picture in the game.

**An axis that moves no picture is a dead purchase** — which `work` and `press`
now are, pictorially; see §19. The ceilings that decide whether an axis reads are
all guesses. So the map is a pure function of the axes rather
than a reading of the live rig, and `?widgets` → *Rig ladder* replays this bucket
of `upgrades.ts` to draw every rung at once. A rung that looks like the one before
it is a ceiling set too far off.

---

## 13. The worlds

**Three was a placeholder and is now an authored count.** A run walks the worlds of
one **system**, inward, and the **star is the last world** rather than a different
kind of object. `worlds(system 1) = 5` is what the current build ships.

Nothing below is hand-typed. A world is an index, and the one figure that is not
free to choose is how long the world takes.

### The total is the law

The old figures scaled three terms at once — ages doubling, cycles at `4p`, phase
duration at `15(p+1)` — so total time went roughly **cubic**: 4 → 24 → 96 minutes,
a 6× step and then a 4×. That is far too aggressive and it was nobody's decision;
it fell out of three innocent formulas multiplying.

> **A world takes twice as long as the one outside it. That is the whole scaling
> law.**

```
time(p) = 240 s × 2^(p−1)
```

Everything else is then a **free authoring choice**, constrained only to multiply
out to that total:

```
ages(p) × cycles_per_age(p) × 2 × phase_duration(p)  =  time(p)
```

**That constraint is the point.** `phase_duration` is one of the few things making
worlds feel different, and under the old formulas it could not be touched without
moving pacing. Under a total-first law the decomposition is yours to author — a
slower phase just means fewer of them, and the world still takes the same time.

⚠ **`phase_duration` is no longer a free feel knob.** Since §5 a life is a length
in phases, so phase length is also an **income multiplier of `30 s ÷ phase`**: a
world breathing twice as slowly pays half as much a second. Authoring it is
therefore a pacing decision as well as a texture one, and the freedom the law
hands you is freedom over *where the income steps*, not freedom from stepping it.

| World | Total | Phase | Phases | Cycles | Ages | Cycles/age |
|---|---|---|---|---|---|---|
| 1 | **4 min** | 30 s | 8 | 4 | 1 | 4 |
| 2 | **8 min** | 30 s | 16 | 8 | 2 | 4 |
| 3 | **16 min** | 60 s | 16 | 8 | 2 | 4 |
| 4 | **32 min** | 60 s | 32 | 16 | 4 | 4 |
| 5 | **64 min** | 60 s | 64 | 32 | 8 | 4 |

**Built, and this is the live decomposition.** `cycles_per_age` holds at 4 on
every world, so the wave reads the same everywhere and an age is always eight
phases; `phase_duration` doubles exactly once, between worlds 2 and 3; `ages`
carries the rest. The freedom the total-first law hands you is real and this
first pass spends almost none of it — one world breathing at 30 s and four at
60 s. **Making them differ is the authoring work still outstanding.**

Because the phase doubles exactly once, **income has exactly one step down, on
arriving at world 3**, and holds at ×0.5 for the rest of the run:

| World | Phase | Income vs world 1 |
|---|---|---|
| 1 | 30 s | ×1 |
| 2 | 30 s | ×1 |
| 3 | 60 s | **×0.5** |
| 4 | 60 s | ×0.5 |
| 5 | 60 s | ×0.5 |

Unaffected by any of it: excess, which is a ratio of piles; the harvest cadence;
world length itself; and §7's rule that nothing buys wave speed — which now
matters *more*, since a phase-shortening upgrade would no longer be a feel change
but a direct income multiplier.

**A three-world system is 28 minutes of floor instead of 124.** Five worlds is 124
— so the old third world's length is now where the *fifth* sits, which is about
where that commitment belongs once there is a prestige loop behind it.

### The other indexed figures

```
excessGate(p)    = 0.12 × 0.7^(p−1)         0.12 · 0.08 · 0.05 · 0.04 · 0.03
mergeMinimum(p)  = min(0.5, 0.15 + 0.10(p−1))
mergeHalving(p)  = mergeMinimum(p)
wants(p)         = −1 on odd p, +1 on even   the swing, priced and never gated
```

| | **1** | **2** | **3** | **4** | **5** |
|---|---|---|---|---|---|
| **Minimum stay** | **4 min** | **8 min** | **16 min** | **32 min** | **64 min** |
| Phase duration | 30 s | 30 s | 60 s | 60 s | 60 s |
| `agesLived` required | 1 | 2 | 2 | 4 | 8 |
| `excessGate` | 0.12 | 0.08 | 0.05 | 0.04 | 0.03 |
| `mergeMinimum` | 15% | 25% | 35% | 45% | 50% |
| `mergeHalving` | 15% | 25% | 35% | 45% | 50% |
| **`wants`** | **Burden** | **Comfort** | **Burden** | **Comfort** | **Burden** |
| — | | | | | |
| Anchoring | none | 2 × 36 s | 3 × 180 s | 4 × 240 s | 5 × 300 s |
| Harvest pays, xp · karma | 15 s · 45 s | 30 · 90 | 45 · 135 | 60 · 180 | 80 · 240 |
| Harvest cadence | 60 s | 60 s | 60 s | 60 s | 60 s |
| Max merge speed | ×8 | ×5 | ×4 | ×3.5 | ×3 |
| Densities | 3 | 3 | 6 | 6 | 9 |
| — | | | | | |
| Discovery gate | start | 20,000 karma+ | 750,000 karma+ | 2,000 Crimson+ | 500 Ochre |

**All five worlds are authored.** `worlds(system 1) = 5` — worlds 4 and 5 cost
almost nothing to add once nothing in the row was denominated in souls, which is
the whole argument for the section below.

### Nothing here is an absolute

The section used to argue this for the toll alone. It is now the law of the whole
table, and it is the one idea worth carrying out of the post-ladder rebalance:

> **Stop authoring absolutes.** The toll is a share of your army, the harvest is
> a multiple of your income, the world floor is wall-clock. Once no figure is
> denominated in a quantity the ladder can move, the next ladder change cannot
> invalidate the balance.

**`mergeMinimum` is a share.** It was 50 / 350 / 1,000 souls, authored against an
army capped near 200 a cohort. The generated ladder (§5) then took power from
*index* rather than headcount and cut population by roughly an order of magnitude
— so the third world asked 1,000 souls of a run that peaked at ~450 and the game
stopped dead. §13 predicted that failure in one direction (*any absolute toll
stops being a toll within one prestige run*); the opposite happened, same root
cause, sign flipped. A share is immune to both. Capped at half: **no world may ask
for more souls than it leaves you.**

**`mergeHalving` is a share too, and it is authored equal to the toll.** An
absolute halving point is reached at a wildly different army size after every
ladder change — at 50/200/800 against ~450 souls, merging *everything* on world 3
bought ×1.56 against a ×4 cap, so the deep merge the design asks you to weigh was
unreachable. Tying it to the toll gives one invariant that holds on every world at
every population:

> **Paying exactly the toll always buys ×2 speed. Merging everything lands near
> the world's `maxMergeSpeed`.**

### The toll is a toll, not a condition

A share of your army is **always payable** — you own all of yourself. So
`mergeMinimum` is no longer one of §14's first-harvest conditions: it cannot fail,
so it can never be the reason a door is shut. It survives as the merge slider's
floor and nothing else, and `agesLived` and `excessGate` carry the gating alone.

### Three things the shortening knocks on

**The floor stops mattering, which is what this section always claimed it wanted.**
The standing line is that world length is a *floor* and the excess gate and merge
toll are what you actually wait on — but at 96 minutes the floor **was** the wait
and the gates were decoration. At 16 the gates do the work, and the gates respond
to how you played. That is the better pacing surface and this is the change that
hands it back.

**World 1's floor is a formality.** Four minutes was never going to contain beats
1–10; `the_other_way` alone unlocks at 30,000 experience. Nobody has ever left the
first world on its floor and nobody will. It should be read as a formality rather
than retuned to be met.

**The re-aim penalty is a shrinking cost.** A full swing is two phases (§6) — a
quarter of world 1 and a twenty-fourth of world 5. That was true before and is now
easier to see. **Whether the penalty should be a share of the world rather than a
fixed count of phases is open** — the §6 argument for pricing it in phases was
that phases are a clock nothing can buy, and that argument survives either way.

### What is still authored by hand

- **The decomposition on every row** — phase duration, ages and cycles are free
  within the total, and the live set spends almost none of that freedom.
- **`maxMergeSpeed`**, which resisted every formula tried. It may not want one.
  Note it is now load-bearing in a way it was not: with `mergeHalving` tied to
  the toll, the cap is the only thing separating a full merge from `1 + 1/toll`.
- **Anchoring durations and bonuses**, which cannot be indexed until `perWorker`
  is retuned (§19) — and which must now be retuned against **these** totals, not
  the old ones. A 36-second harness against a 16-minute world is a different
  proposition to one against 24 minutes. Worlds 4 and 5 continue the hand-authored
  pattern (`anchors` and `duration` both climbing) and are guesses.
- **The harvest ratios** — the seconds-of-income figures in the table. Starting
  figures to measure against, not settled ones. See §15.
- **Harvest cadence**, now 60 s on all five. At 16 minutes that is about twelve
  batches before you leave, which is probably still enough to read as a rhythm —
  but it was not chosen for this length.
- **All four discovery gates**, which put discovery near the harvest beat and
  nothing more.
- **`densities`**, which is a visual figure.
### The system is the next rung

> **A finished world pays forever (§15). A finished *system* is a world at the
> next index.**

When every world in a system is behind you, the system collapses into a single
emitter whose output stands in the same relation to its planets as a planet's does
to its souls. The recursion is literal and it uses the ladder the cohorts already
use.

This is not reachable on a first run and is not meant to be. See §18.

**The worlds still have no identity.** Names, character, and any sense of *why
these and in this order* do not exist. Indexing them makes that hole cheaper to
fill — a world's place in its system is now a fact the fiction can lean on — but it
does not fill it.
## 14. The first harvest

The one-off event that ends a world. Three things happen at once: you **merge**
some share of your souls into the world, your **alignment locks**, and you are
free to leave.

### The conditions

A world authors its own. Both must hold:

| Condition | Reads |
|---|---|
| `agesLived` | you have spent the world's full authored length on it |
| `excessGate` | your excess is inside the world's band |

**Two, not three.** `mergeMinimum` was a condition while it was a soul count; as
a share of the army it is always payable and so can never be a reason (§13). It
is the slider's floor and it is not listed here.

The excess gate is the only one that reads a **live** figure, so readiness can
lapse while you are looking at it. That is reached by drifting, never by
arriving.

### The merge is the decision

The slider chooses what share of every cohort you leave behind. **What you merge
you lose.**

- **`mergeMinimum` is the slider's floor**, not something to fail against. The
  handle cannot go below the toll, so a short split is not a state the UI can
  express and there is no disabled button explaining one.
- **The floor falls as the population grows**, so the slider's position is
  `max(chosen, floor)` — held up to the toll rather than clamped down to it, so a
  handle dragged high stays where it was put.
- **What merging costs is the upgrade ladder.** Count-gated levels release
  as the count falls below their gates (§5). A shallow merge costs a level or
  two; merging everything costs the ladder. **The slider prices its own
  consequence**, which is what makes it weigh.
- **Merging does not move the excess reading**, so there is no ordering trap.

### Alignment locks, and it is a trade

Read at the moment of harvest — **before** the merge, since the merge shrinks
what excess is read against.

| Locked alignment | The world then pays |
|---|---|
| **−1** (Burden) | experience E, **karma_negative** K |
| **+1** (Comfort) | experience E, **karma_positive** K |
| **0** (Even) | experience **E × 3**, **no karma** |

**Instead of, not on top of.** On top, Even would be strictly dominant and the
reading would stop being a choice; as a trade it buys progression and gives up
currency.

This is the first thing in the game that pays excess *management* back rather
than merely gating on it. Until now excess was a wall and nothing else; a
balanced pair of piles at the moment of harvest is now worth something for good.

Even locks inside `evenBand: 0.02` — strictly tighter than the tightest world
gate, so **locking Even is harder than passing any door**.

### `K` has to be worth something, or this is a two-way trade

The lock paid `E + K` on a tilted alignment while **nothing in the game cost
`karma_negative`**. So a Burden lock paid `E` where Even paid `3E`, and the
central choice quietly resolved to *run negative for the income, lock Even at
every harvest* — worst of all for exactly the polarity the income curve favours.
One measured run found this at the second world and it read as the climb
restarting.

**The fix was repricing, not new content.** Three upgrades now charge
`karma_negative`:

| Upgrade | Costs | Why |
|---|---|---|
| `building:main:carry_1` | 200,000 karma− | gated on `karma_negative` already |
| `cohorts:harder_lives_1` | 310,000 karma− | taking more out of the same span |
| `cohorts:hard_season` | 1,200,000 karma− | the same, doubled |

`refinery:slots_1` and `harness:riders_1` were repriced here too and have since
moved to crimson (§9, §12), so the sink is these three: 1.71M.

⚠ **It did not hold.** A one-off sink is spent once, and after it `K` is worth
nothing again — see §19, *Karma expires*.

> ⚠ **`evenExperienceBonus` stays at 2.0, so Even still pays ×3.** The finding
> that ×3 dominates was measured while `K` was worth zero on one side. It has to
> be re-measured now that it is not, and only then decided.

### A world wants a pole, and pays for it

Everything above prices the *lock*. Nothing in the game had yet asked for a
specific pole — and the one target every reading names is **zero**, which is
where you already are if you never touch the dial. Even wins by default, not
because it is strong.

> **A world declares a polarity it wants. Serving it multiplies `K`; opposing it
> divides `K` by the same figure.**

⚠ **Superseded on `dev-next`, 2026-09-23:** the world pulls `demandPull` (5%) of
its wanted pile per phase instead, and `D`, `matchShare` and the tally are
retired — see §21, *Karma as weight*.

```
K × D^(2 · matchShare − 1)
```

**It cannot read the harvest's own reading.** `excessGate` puts the excess inside
±0.12 at the instant of harvest by construction, ±0.03 by world 5 — there is no
room there to record that a world wanted Burden and got it. So the demand reads a
**running** quantity, accumulated across the whole stay:

```
matchShare = karma paid into the demanded pile while on this world
             ÷ all karma earned on this world
```

Then the gate and the demand stop competing and start composing:

> **Tilt hard for most of the world to earn the demand. Spend the last stretch
> cleaning up to pass the gate and leave.**

The share is **banked as it is earned**, so the cleanup costs nothing it already
paid for. Keyed on the *locked* alignment instead, cleaning up would land you in
`evenBand` and wipe the demand you spent the world earning — the arc would not
work at all.

**Nothing is added to the payout.** `D` redistributes the same `K` across the
poles, mean-preserving in log space, which is §6's bias pair's own idiom. A third
unbounded multiplier on a figure that already compounds across five worlds is how
a payout runs away; this is bounded and authored per world, `D = 2` to start.

| `matchShare` | Karma pays |
|---|---|
| 1.0 — everything its way | **× D** |
| 0.5 — an even split | ×1 |
| 0.0 — everything the other way | **× 1/D** |

**The alternation is authored, priced, and never gated.** `wants` across system 1
is **− / + / − / + / −**. The swing is forced economically and never by a lock,
which is §13's *the toll is a toll, not a condition* one level up: a player who
wants to eat the penalty and run one pole forever still can, and almost nobody
will. That lands the first-run-as-tutorial idea **without a tutorial** — the first
system teaches the swing by paying for it, and by the time prestige is behind you
the habit is built.

**It is an offer, not a cleanup job.** Not karmic pollution: a world that needs
cleaning has a right answer, and §1 says the game never moralises about the pole.
The neutral shape is §12's, already written — **the world offers and you may
decline**. A world paying double for a Burden life is an offer; locking Even for
the experience is a legal answer.

> ⚠ **Even is now the only lock a world can neither improve nor spoil**, since it
> pays no karma for `D` to move. That may be correct — Even is the *refusal* of
> the offer — but it interacts with §19's standing *Even's experience bonus: ×1.5,
> ×2 or ×3* question, and the two want re-measuring together.

> ⚠ **The correction cost moves from once-a-run to once-a-world**, and has never
> been measured at that cadence. Clearing any tilt was measured at ~10% of the run
> so far; paid five times instead of once is a different number. Measure it before
> authoring any short-pile skim — this may be all the teeth the axis needs.

> ⚠ **The gate ladder is now under pressure from two directions.** `excessGate`
> tightens 0.12 → 0.03 while the demand asks for a deeper tilt on the later
> worlds. **Check world 5 is passable at all.** It is one retune, not two.

### Boons

A world may leave you holding a permanent change when you finish it. **A boon is
a reward, so it is not one of the world's conditions** — the conditions are what
a world *demands* before it lets you go; a boon is what it leaves you holding
afterwards.

Shaped like an upgrade's effect, keyed by world so two worlds granting the same
change both land. **Unauthored on all five worlds.**

### After

The active world stays in *where you are* until you reach somewhere else, so it
can show what you merged while sitting in the band it started in.

**A world must be harvested before it can be left.** A world is left for good, so
leaving an unharvested one would strand it.

**Between worlds, souls earn nothing.** From the last harvest until the next
world is reached there is no active planet, and a soul incarnates *somewhere* —
with nowhere to be born the roster keeps its count and stops earning. Your income
in that gap is entirely what the worlds behind you send.

> **Watch:** this should read as *the souls have nowhere to go* and not as the
> game having stopped. There may want to be a word for it in the empty state.

---

## 15. What a finished world pays

A harvested world pays **experience and karma into the piles**, forever, on a
slow clock.

```
perDelivery = yields[type] × departureRate[type] × anchorBonus
duration    = base / min(1 + mergedShare / mergeHalving, maxMergeSpeed)
rate        = perDelivery ÷ duration
```

`anchorBonus` is what the anchors you left standing are worth, read once on the
way out like the alignment and the income (§12). 1 on a world you never anchored.

### Merging buys tempo. Holding buys size.

The two levers separate cleanly, and they did not before. `yields` used to be a
flat authored amount and merged souls bought speed alone, capped — so past
`merged = halving × (cap − 1)`, **staying longer and growing the army bought
literally nothing.** That is the answer to *holding should be worth more*.

> **`yields` is authored in seconds of your production**, and the payout
> multiplies it by an income snapshot taken at departure.

So world 1's `15 s` of experience means one delivery is worth fifteen seconds of
whatever you were earning when you left. Nothing in `planets.ts` is denominated
in a quantity the cohort ladder can move (§13), and each world carries its own
ratio so progression still climbs: a later world banks a larger multiple of a
larger income.

**The snapshot is taken pre-merge.** Merging must not destroy the thing you are
being paid for.

⚠ **The snapshot is halved from world 3 on.** A life is a length in phases (§5),
so income halves when the phase doubles, and a payout denominated in *seconds of
income* halves with it. The `15 / 30 / 45 / 60 / 80` ladder may want raising on
the long-phase worlds to compensate — or may not, if a smaller banked multiple is
exactly the progression cost the phase length was meant to charge. Measure the
world 2 → 3 arrival before deciding; see §19.

**Karma is phase-averaged, never read off the instant.** The wave swings karma
income by at least ×3 (§6's bias pair, wider the deeper the tilt), so an
instantaneous reading would overpay for the accident of leaving on a dense phase and make the wave a thing
you time a *permanent* reward against. The bias is divided back out of the live
figure rather than recomputed, so the two cannot drift. Experience needs no such
treatment — the bias lives only in the karma split.

**Merged souls buy speed, and that is the whole of what they buy.** Hyperbolic,
so it cannot reach zero, and capped, so no merge runs away. `mergedShare` is a
share of the army and `mergeHalving` is authored equal to the toll, so the toll
always buys ×2 (§13).

**The experience goes to the pile only, and never to the active world.** A world
behind you buys **progression**; it does not walk the phases of the world you are
standing on. Those stay yours to earn.

### Exactly three axes now, deliberately

**How much you merged**, **how you were aligned**, and **what you were earning
when you left**. The third is new and it is what makes holding pay: it is read
once, before the merge, and then it is fixed forever.

Total souls at the harvest is still not an axis. The merge is a share, so the
population is already inside it — a bigger army merged at the same share pays the
same toll and buys the same speed. Reading the count separately would count one
quantity twice and hand the player two knobs that cannot be traded off.

### The floor is also a promise

Since the merge toll is a floor on `mergedShare`, and that buys speed, the toll
also sets the **slowest** a world can ever pay. **No world can be left in a state
where it barely delivers.**

With `mergeHalving` authored equal to the toll, the promise is now exact and the
same on every world: **the floor is ×2**, and merging everything is near the
world's cap. What each world guarantees at its floor, as a multiple of the income
you left with:

| World | at the toll (×2) | at a full merge |
|---|---|---|
| 1 | 0.5× xp/s · 1.5× karma/s | ×7.7 speed |
| 2 | 1.0× · 3.0× | ×5 |
| 3 | 1.5× · 4.5× | ×3.9 |
| 4 | 2.0× · 6.0× | ×3.2 |
| 5 | 2.7× · 8.0× | ×3 |

The old figures here — ×1.2 / ×1.6 / ×1.75 — were computed from an absolute toll
of 50 / 350 / 1,000 souls against an army that outran them.

### Cadence

The base is 60 seconds on every world. Chosen so a per-year figure is worth
reading and a countdown counts. It sits at the slow end on purpose: **a cadence is
easier to judge downward than a trickle is to discover was never readable.**

Batch sizes do not add across worlds — every world's duration moves with its own
merged share — so the only honest total is per second.

### The ratios are placeholders; the denomination is not

The seconds-of-income figures (§13's row) are starting figures to measure against.
**What is settled is that they are seconds and not amounts** — that is the part
that survives the next ladder change, and re-tuning them is a one-column edit
rather than a rescale of the file.

Whether the payout repays a **deep** merge is the question §5's upgrade-burn
argument hands off, and it is now askable: it could not be tested before, because
`mergeHalving` was unreachable at the population the ladder produces.

---

## 16. Progression — the fourteen beats

The frame accretes in an authored order. A pointer advances one beat at a time
and **never falls**; a later beat whose trigger happens to be satisfied early
waits its turn. So the frame arrives in the same order regardless of how the
player got there.

### Three invariants

**Reveals never regress.** `absent → inert → live` is one-way. **`inert` means
drawn but unclickable — a promise, not a disabled control.** It is distinct from
*availability*, which is live game state and freely reversible.

**Systems run before their panels appear.** Nothing is ever added that was not
already running invisibly. The wave ticks from beat 1 so that beat 6 *explains
noise the player has already felt* rather than introducing a new mechanic.

**A beat can never stall.** Each beat carries an experience **floor** as a
fallback trigger, so a player who takes an unanticipated route still advances.
The exception is `eventOnly` beats, where no experience figure honestly stands in
for the event — **those five have no floor by design and must not be given one.**

### The ladder

| # | Beat | Fires on | Floor | Starts | Reveals |
|---|---|---|---|---|---|
| 1 | `click` | start | — | incarnation, **wave** | the disc, the log, the experience reading |
| 2 | `rail` | 50 experience | 50 | — | the upgrade rail |
| 3 | `first_soul` | 1 soul | 1,100 | cohorts | the cohort table, **the send verb on each row** |
| 4 | `karma` | any positive karma | 340 | positive karma | the karma reading |
| 5 | `rows` | 5 souls | 4,200 | — | the header, the status row, the Details tab |
| 6 | `wave` | buy `read_the_wave` | 26,900 | — | the wave reading |
| 7 | `negative_karma` | buy `the_other_way` | 74,200 | negative karma, aim | the negative reading, the aim dial |
| 8 | `excess` | \|excess\| ≥ 0.3 | 186,000 | excess | the excess reading, the Refinery tab (inert) |
| 9 | `discovery` | 2 worlds known | 430,000 | — | the Overview tab and its bands, first-harvest gate (inert) |
| 10 | `harvest` | the world's conditions hold | *event* | harvest | the first-harvest verb (live), the harvest screen |
| 11 | `anchor` | 1 world finished | *event* | anchoring, harvest income | the anchor field, the split, **the Harness tab**, the Behind band |
| 12 | `refining` | souls held **and** both karma piles exist | *event* | refining | the Refinery tab (live), the token readings, the refinery screen |
| 13 | `second_harvest` | 2 worlds finished | *event* | — | **nothing** |
| 14 | `terminus` | the run would bank a whole wisdom | *event* | — | the end-run verb and the prestige screen |

Fourteen entries. **Beat 13 reveals nothing** — the log carries it. ⚠ It fires on
*two worlds finished*, which was the end of a three-world game and is no longer
the end of anything; it wants re-siting or cutting.

**Every beat now fires for its own reason.** None reaches only on its floor.

### The beats and the two new systems

**Clerks do not get a beat.** The send verb arrives with the cohort table at beat
3, and the first clerk is a purchase on the rail like any other — the frame does
not change when you buy one, only the amount of clicking does. No milestone marks
it either.

**Prestige is beat 14, `terminus`**, `eventOnly` with no floor: it measures what
the run earned (§18), and no experience figure stands in for that.

⚠ The floors in the table were fitted to the old cohort economy and every one of
them is now wrong. They are fallbacks, so nothing breaks — but a floor that fires
before its own trigger turns a beat into a timer. **Refit all eight against the
generated ladder**, and note they no longer even climb: `karma`'s 340 sits under
`first_soul`'s 1,100 on the beat above it, so the fallback order and the beat
order disagree.

### Two beats are purchases

`read_the_wave` and `the_other_way` are **priced triggers with no effect of their
own** — the price is the whole of the choice.

- `read_the_wave`: 9,000 xp to unlock, 750 karma+ to buy. The wave is *a clock
  you read, not a lever* — the upgrade cannot widen anything, it lets you see it.
- `the_other_way`: 30,000 xp to unlock, 4,000 karma+ to buy. **This is the beat
  that lets the negative pile exist**, and it is the single most important thing
  the log has to say.

Both are **priced rather than granted**, because beat 7 asks *how dirty do you
want to run* and **a choice you are handed is not one.**

### Milestones

Five **firsts the log narrates that no beat covers**. A beat changes the frame; a
milestone only says something happened.

| Milestone | Fires on |
|---|---|
| `first_negative_karma` | any negative karma exists |
| `first_reserve` | any soul held back |
| `first_token` | any Crimson exists |
| `deep_excess` | \|excess\| ≥ 0.6 — twice beat 8's threshold |
| `ratio_even` | the refinery's crimson-per-karma ratio reaches 1 (§9) |

---

## 17. What each screen asks

Each screen exists for one decision. This is the design framing, not the layout.

**Details** — *which souls, and where do they lean?* The cohort roster, the buy
decision, the aim dial, and the wave you are aiming against. The world itself
sits here as a portrait. It is where most of the run is spent.

**Overview** — *which world, and when do I leave this one?* One axis, three
bands: **Behind** (what you left, what it sends, when the next batch lands),
**Active** (where you are), **Ahead** (where you could go). The verb travels with
the selection — Harvest on the world you are on, Reach on one ahead, nothing on
one behind. **The row that names a world is the row that reports it**; there is
no separate ledger re-listing the same names in a second column.

**A verb sits at the foot of the column it acts on**, not in a bar the screen
shares. The travelling verb used to be a slot in the frame's strip, which put
Harvest and Reach the same distance from every world and made the selection the
only thing saying which one they meant. Pushed to the bottom of the selected
world's own column, the button is under the picture it is about. The separate
harvest ledger this section already argued against is now actually deleted —
the Behind rows carry their own rates.

A picture on every row, and **size is the only thing separating the bands** —
Ahead's are the biggest, because **an unreached world is a place you know nothing
else about and the silhouette is the only thing you have to want it by.**

**Harness** — *what can the rig do, and who rides it?* The rig drawn on a flat,
nameless body; under it what it can place, carry and how fast; and beside both the
roster of cohorts with a line, which is bought here. It is the only screen about a
thing you own rather than a place you are, which is why its picture is not a world.

The left column is **one panel**, the way Details' is — the picture and its figures
under a single heading, the figures at the weight the Overview's ahead panel uses.
Two cards would have spent the column's height on a second heading and a second
padding, and the stage already takes most of it.

The **job is not run from here.** Anchoring is begun, watched and cancelled on the
world it acts on, because that is what it acts on. This screen is what the
harness *is*.

**Refinery** — *what is the mix, and what do I make of it?* The intake (matched
against unpaired), the ceiling (arriving against cleared), the grade ladder, and
the split lever. The lever lives here because **the refinery is where the cost of
reserving is felt.**

Backlog on this screen is drawn as **a pressure, not a quantity**: a rate against
a ceiling, not a held figure. A held figure says how much karma you have — which
the header already says — and it goes *up* when you are doing well. A rate says
the thing worth knowing: whether the piles are growing, and by how much.

**Harvest** — *how much of this world do I leave in it, and aligned how?* A
takeover, not a tab. The world is bigger here than anywhere else in the game and
the decision is laid out over it: **world, split, verb**, top to bottom, in the
order the decision is made. Dragging the split pulls the souls staying with the
world in against its surface and pushes the ones leaving out past their orbits —
**the cost is seen before it is read.**

`Not yet` is now the **only** way out, and that is a change. It used to be kept
as the one thing on the screen saying leaving is free, with the tabs still lit
above it as the real door. The tabs now collapse for the duration — see below —
so the word carries the exit on its own.

### A takeover keeps the header and drops everything else

Two screens take a body over: the **first harvest** and the **end of a run**.
Both hide the upgrade rail and collapse the tab strip, and both draw their own
verb across the whole card.

**Exactly one verb on screen at a time** is what the collapse buys. A takeover
asks one question, and a tab strip beside it offers three other places to be
while it is asking.

**The header is what stops this being a room with no walls.** That objection —
*a screen reached by one verb and left by one word, with nothing lit over it* —
was the argument for keeping the tabs, and the header answers it better: your
totals stay on screen throughout, so the takeover reads as a panel over the game
rather than as somewhere the game went. **Making the harvest a tab** stays
rejected for the reason it always was: it is one world's decision, not a place
you live.

### The test, now that there are four

The tabs used to be *exactly three, permanently* — an invariant asserted in
`progression/keys.ts` and nowhere argued. The Harness tab broke it deliberately,
so the rule it replaces has to be stated:

> **A tab is where you configure a system you own. A takeover is a decision that
> ends something.**

The harness has capacities to buy and a rig to look at, and you come back to it
for the rest of the run — a tab. The first harvest ends a world and the terminus
ends a run — takeovers. Three was never the principle; it was the count that
happened to satisfy it.

A fourth tab costs the strip nothing: a tab is a fixed width, so the strip is
simply one tab wider and the run verb beside it keeps what is left.

### Settled: the frame hosts the takeovers

**Neither screen owns the harvest.** Both takeovers are screens of the frame
itself, beside the tabs, and each returns you to the tab you opened it from.
Details and the Overview both carry a Harvest verb at the foot of their world
column; the door is wherever you are looking at the world, and the room is one
place. The flag lives on navigation, not on a screen.

### One layout rule worth stating as design

**The rail belongs to the screen under it.** The upgrade rail shows the active
screen's upgrades plus the global ones — because a chip lights its target on the
screen below it, and a chip whose target lives two tabs away could only ever
light nothing.

**It shows all of them.** The rail is a tall column rather than a wide strip, so
there is no cut-off and no *N more* chip standing in for what did not fit; the
queue scrolls past the fold and an escape opens the full window. The only thing
the rail withholds is now the only thing it should: other screens' upgrades.

What the rail withholds, **the tabs** say — each carries **a count of what is
buyable behind it right now**, affordable rather than merely available, since an
upgrade you have unlocked and cannot pay for is a standing fact and a tab marked
at all times is not a mark.

**The tabs sit in a strip along the bottom of the card, not in the header.** The
header is a register of readings, and a reading is something you consult while a
tab is something you press — putting the two in one band asked one row to be
both. Along the bottom the tabs measure the body they switch: a tab is the width
of half the planet column, so the seam after the second one lands on the rule
that column already draws, and every tab after it continues at the same width.
Beside them sits the one verb that is about the run rather than about a world
(§18), which is the only thing left in the strip now that the planet verbs went
back to their columns.

And: **a continuous quantity may colour a thing in place, but it may not decide
where the thing sits.** Sorting the rail on affordability made chips reshuffle
under the cursor at the one moment you were reading them.

---

## 18. The larger wheel

Everything before this section happens inside one run. This section is the claim
that **a run is itself a life**, and that it leaves a residue the same way a soul's
life does.

> A world you have harvested keeps turning behind you and keeps paying (§15). A
> system you have finished does the same, one index up. So does a run.

The premise the game already states is recursive; this is the game taking it
literally rather than bolting a meta-layer above it.

### Wisdom is the residue, and it is the only thing prestige makes

```
wisdom gained = ⌊√(crimson produced / W  +  lifetime experience / X)⌋
W = 10¹²      X = 4 × 10¹³
```

**Crimson is the main axis.** `crimson produced` is a lifetime, never-decremented
total the refinery keeps, distinct from the karma moved that levels it (§9).
Reading crimson rather than karma is what lets the level's earned ratio compound
into the outer wheel: two runs that move identical karma but level to different
ratios leave different wisdom.

**Experience is the second, weaker axis**, so a run that grew wide without
refining still banks something. Both sum *inside* the root, so there is one climb
and the unit always widens. At coverage near 0.5 and ratio near 1 the two run
about level, and `X = 4W` makes experience worth ~12% more wisdom — a real term
that does not displace crimson.

The verb opens at the first whole wisdom, and the *n*th lands at `n²·W`.

⚠ Both constants were set without a recorded run to fit against.

**The square root is what makes this fractal rather than merely repeatable.**
Doubling a run's output gives about 1.41× the wisdom, so each turn of the larger
wheel is worth roughly a constant amount of *progress* instead of a constant amount
of currency. It is the same shape as the merge slider one index down: you give up
everything specific and you keep a rate.

**Held, each wisdom is +2% to all cohort yield, permanently** — and +1% to the
press, which rides it at half strength. Spent, it buys
**structure** — a further cohort index, a further system, the things that change
what a run *is* — and **the spend costs you the multiplier.** That trade is the
whole of the wisdom layer and it is deliberately the angel-investor shape: the
stock that makes you strong is the stock that buys permanence, and you cannot have
both.

### Knowledge is the currency wisdom was being confused with

**Wisdom is what you are; knowledge is what you have.** They are earned at
different indices and they are not two names for one thing.

```
knowledge bought = √(experience spent / P)
P rises with the knowledge already held
```

Earned inside a run by spending experience, at a rate that gets worse the more you
hold. **The second million buys less than the first did, and there is no ceiling
and no threshold to sit below.**

That square root is the point, and it is the answer to the trap this design nearly
walked into. `1,000,000 experience → 1 wisdom` was a **denomination**: a fixed
price producing a discrete unit, which is a shop, not an economy. So is
`1,500 Crimson from each pile → 1 Ochre` (§10). **Refined experience is not a
higher denomination — it is a worse exchange rate**, and that is what stops the
whole upper economy from being a set of thresholds to cross.

Knowledge is spent on **two shelves**:

- **The in-run shelf** buys power now and goes when the run goes.
- **The permanent shelf** is dearer and is still there next time.

That is the merge slider again, in a third place: what you spend on the run you
lose with the run, what you spend on permanence keeps paying from behind you.

### Knowledge does not convert to wisdom, and this is load-bearing

The obvious move — cash your unspent knowledge in at the harvest, the way souls are
merged — **must not be made.** The failure is arithmetic and it is a classic:

**Both paths already lead to the same currency.** Spending knowledge buys unlocks,
unlocks make the run stronger, a stronger run moves more karma, and wisdom is
`√(karma moved)`. Spending *already* pays into wisdom. A direct conversion is not a
trade between two things; it is a second route to one thing, and one route wins.

You can predict which. **The spend path goes through a square root and a linear
conversion does not**, so past some point late in every run, hoarding beats buying.
The correct play becomes *stop purchasing and sit on the pile*. **A game that
rewards you for not playing it in the last stretch of every loop is the single
thing to avoid here.** A punitive exponent on the conversion shrinks the magnitude
and keeps the shape, and adds a figure that needs retuning every time run length
moves.

There is a quieter reason too: knowledge is bought with experience, experience and
karma come from the same souls, and wisdom already reads that production.
Converting would count one run twice.

**AdCap gets this right and it is deliberate there**: angels come from lifetime
earnings, never from cash on hand, so there is never a reason to sit on money.

The decision the boundary wants is real; it is just not a conversion. **It is which
shelf.** Holding knowledge at the harvest is strictly worse than spending it either
way, so the end of a run is a purchasing decision rather than an abstention.

> **The permanent shelf must be wide, not tall.** A steep ladder climbed in a fixed
> order makes every run's decision the same decision. Many cheap-ish permanent
> items mean *which* permanence you bought is a fact about that run.

### Commerce

The framing the upper economy is aiming at: **experience is wealth and knowledge is
currency.** Not settled, and the numbers below are shapes rather than figures.

Two things follow from it that are worth stating now because they resolve standing
holes:

**The grade ladder becomes a market.** Crimson → Ochre → Indigo as fixed 1,500 /
3,000 conversions are three denominations, and §10 defends them as *a ladder, not a
shop*. As **exchange rates that worsen with what you hold**, the interesting play
becomes *when to convert* rather than *whether you have reached the number* — and
§3's dead ends at the top of the ladder mostly stop being dead ends, because there
is no top, only a rate that gets bad. Indigo's buyer is the deep end of the
knowledge market.

**A market has two sides, and that is the sink the negative pile never had.**
Three one-offs are all that cost `karma_negative` (§3). **Selling the pile you are
long** is the natural sink, and the rate you get for it should depend on how long
you are — which is the excess reading (§8), already computed, currently doing
nothing but gating a door.

> **That would turn excess from a wall into a price**, which is the largest single
> upgrade available to that mechanic. Excess currently only ever says *no*. As a
> spread it would say *how much*.

A market needs an income curve to price against; the one play has produced is
not yet written into §5.

### What survives a run

| Survives | Resets |
|---|---|
| **wisdom** — held or spent | souls, and every cohort count |
| **the permanent knowledge shelf** | every level rung and every clerk |
| **collapsed systems**, still emitting | the worlds of the current system |
| **the inversion counter** (§10 already never resets) | tokens, and unspent knowledge |
| **boons** | the click ladder |

**Collapsed systems emitting across runs is the thing that makes a second run more
than the first run faster.** It is §15's mechanism at the outer index and it needs
no new machinery.

**What ships today is the first row alone.** Wisdom survives; everything else in
the left column is ambition. No knowledge, no shelves, no commerce — those make
the fifth run interesting, not the second.

**Prestige is chosen, not forced**, and this is settled. The crawl into the outer
worlds is structural — income grows about `t^2.3` and only the outer wheel ends it
— so waiting for the system to finish itself would be waiting for a wall rather
than arriving at a decision. The verb appears from the moment the run would bank
a whole wisdom, which is long before every world is reached.

**Where that verb sits is open.** This section used to say *on the Overview's
axis*, beside the worlds. What shipped puts it in the bottom strip beside the
tabs, shown only while the Overview is up (§17) — because ending a run is about
the run and not about any one world, and the axis is a list of worlds. The
counter-argument is that the strip is a navigation control cluster, and the one
verb in the game that discards everything should not sit two centimetres from
the buttons you press to change screens. **Undecided; the strip is live.**

### Framing

**Not another galaxy.** A bigger box is not a higher index, and the game's whole
argument is that the same wheel turns at every scale.

The stronger reading is that **the system was always one turn, and you have been
here before.** That makes prestige an instance of the game's own premise rather
than a layer above it, and the log voice can carry it in one flat line without
explaining anything.

The test the framing has to pass: **a sentence written for a finished world should
still read true one index up, about a finished system.** If it does, the recursion
is in the fiction and not just in the arithmetic. `terminus` and the arrival line
(*It has all turned over again…*) are the first lines to run it against.

### Open

- **The overlap between wisdom's structural purchases and knowledge's permanent
  shelf.** Both are permanent, both are bought. The distinction held here is that
  **wisdom buys what exists and knowledge buys facts about your run** — scale
  against texture. It is a real distinction and it is not yet a comfortable one.
- **`P`.** `W` and the +2% per wisdom are now authored in `balance.ts` as
  `prestige.firstWisdomAt` and `prestige.yieldPerWisdom`; `P` is what is left.
- **What the in-run knowledge shelf actually sells**, which is unwritten.
- **Whether commerce is a system or a framing.** It may be enough that the rates
  worsen, without a market screen ever existing.
## 19. Open design questions

### Karma expires — the standing problem

There are a handful of authored one-off karma purchases, and then karma's only
consumer, forever, is the refinery. So:

> **Once the upgrade table is bought, more karma buys nothing, extremity has no
> upside at any detent, and Even wins by default.**

The world's demand (§14) was meant to give `K` a direction and does not carry
enough weight in play to do it. §6's `extremityMultiplier: 2` makes tilting a
real trade *for as long as karma has a buyer*; it does not create one. Commerce
(§18) — selling the pile you are long, at a rate priced off excess — is the
shape the doc has held for the answer. **No excess debuff touches this**, which
is why §21's proposals are held behind it.

### Unsettled by decision

| Question | Where it bites |
|---|---|
| **Karma as weight** — held karma drags experience, the refinery sheds it, prices incur on both poles | §21 — proposed 2026-09-23 as the answer to *karma expires*. Breaks every karma-paid reward and leaves the aim dial without a job. Undecided |
| **`work` and `press` have no picture** | §12 — pulled from the rig's drawing as the anchor's identity; against §12's own *an axis that moves no picture is a dead purchase* |
| **Where the end-run verb sits** | §17, §18 — the bottom strip beside the tabs today; §18 argued for the Overview's axis and the strip shipped without the argument being settled |
| **Even's experience bonus: ×1.5, ×2, or ×3** | §14 — ×3 is live; the "×3 dominates" reading was taken while `K` was worth zero and must be re-measured. Now also the only lock a world's demand cannot move |
| **What the per-world correction cost actually is** | §8, §14 — ~10% of the run so far, once; the demand asks for it once a world. Gates any short-pile skim (§21) |
| **Whether world 5 is passable under both pressures** | §13, §14 — `excessGate` tightens to 0.03 while the demand asks for a deeper tilt |
| **`D = 2`, and whether the demand stays** | §14 — authorable per world, authored nowhere. Too weak to matter in play |
| **Whether the Burden/Comfort sink asymmetry is right** | §3 — three one-offs price in `karma_negative`, all past beat 7; the stopgap before commerce |
| **Whether commerce is a system or a framing** | §18 — the rates worsening may be enough without a market screen |
| **Wisdom's structure shelf vs knowledge's permanent shelf** | §18 — both permanent, both bought; the distinction is real and uncomfortable. Neither is built |
| **The click** | §4 — 700/click against 150k/s is 0.5% of income. `carry` is linear and capped against income compounding ×5 per index; it needs a different shape (a share of *income*) or an explicit decision to let the hand go vestigial |
| **Continuous vs square-wave phase bias** | §6 — now load-bearing: the square wave is what makes the one-phase / one-cycle line a rule rather than a gradient |
| **`BASE_LIFE`, and whether the world 3 step reads** | §5, §13 — `1/16` holds today's economy and lands cohort 8 on an age; how the halving on arrival at world 3 reads is unrecorded |
| **Whether a halving should be allowed to make a long cohort timeable** | §6 — a row becomes timeable `n − 5` rungs in, so levelling erodes the smooth end of the ladder. Feature or cap, undecided |
| **Clerk handling for cycle-long cohorts** | §5, §6 — their clerk sells throughput and no timing. Cheaper clerks or arriving clerked both fix it and both break `clerk(n) = reveal(n+1)` |
| **Whether the life forfeited at departure wants recovering** | §5, §14 — halted, not prorated, and bounded at one life a cohort. An age-long life on world 5 is 8 minutes, which is where it would start to be felt |
| **Harvest ratios on long-phase worlds** | §15 — the snapshot halves from world 3; whether `15…80 s` compensates is unmeasured |
| **Lumpiness of age-long lives** | §5, §17 — an age on world 5 is 8 minutes between payouts, and the row's bar has to carry that wait on its own |
| **How many worlds a system has** | §13 — 5 is authored, not derived |
| **Per-cohort aiming** | §6 — parked, and further away now that cohorts have no aim figures. `LeanMeter` is kept in the tree, unwired, against this coming back |
| **`clerk`'s own name** | §5, §20 — the mechanic shipped, the word did not; ledger, mechanical and managerial candidates all tried and set aside |
| **Whether anchoring should cost anything to begin** | §12 — it is free, and the cost is entirely the souls and presses it consumes once open. Whether a world should charge for the offer is unasked |
| **Which cohorts hold the lines** | §12 — round the ladder from cohort 1, repeats stacking the bonus; riders split by active count. Simplest rules, neither argued |
| **The worlds' identity, and the cohorts'** | §1 — the largest fiction hole, now with an index to hang on |
| **The log's lines** | §1 — every beat has one; the register is settled and some lines describe moved mechanics |
| **Whether `reaimPhases` should be a share of the world** | §6, §13 — a full swing is two phases, a quarter of world 1 and a twenty-fourth of world 5. Resolving this toward a share is what would let §6 price at `\|Δ\|` outright instead of halving it |
| **Every world decomposition** | §13 — phase duration, ages and cycles are now free within a fixed total and have had one pass |

### Resolved by the ladder rewrite

| Was | Now |
|---|---|
| **Even's experience bonus: ×1.5, ×2, ×3** | still open — §14 is untouched by the rewrite and ×3 is still live |
| **A sink for Indigo and wisdom** | Indigo buys the deep end of the knowledge market; wisdom is no longer bought at all (§18) |
| **What wisdom *is*** | the prestige residue, `√(crimson/W + experience/X)` (§18) |
| **`zealot`'s ρ = ∞** | gone — every cohort yields experience, so payback is defined everywhere |
| **The cap at 200 a cohort** | gone — income compounds by construction, so counts no longer stall |
| **Six rungs and not ten** | **six**, at AdCap's counts, paid twice — per cohort and all-cohort — so twelve rungs a row, ×4,096 (§5) |
| **Per-cohort `resistance` / `polarity_bias` / `polarity_multiplier`** | cut; duration and the manual batch carry cohort identity (§6) |

### Resolved by the post-ladder rebalance

The ladder rewrite shipped alone, took power from headcount and gave it to index,
and every figure still written in raw souls or raw resources was mis-scaled by
about an order of magnitude. One measured run found all of the below; the
rebalance is the answer to all of it at once.

| Was | Now |
|---|---|
| **Whether the harvest payout repays a deep merge** | askable at last — `mergeHalving` is a share tied to the toll, so a full merge is reachable on every world (§13) |
| **Whether excess reading flat near ±1 lands as ominous or dead** | **terminal** — at ±2 the short pile was exactly zero, so the refinery starved and the wisdom base stopped accruing. Clamped (§6) |
| **The entire generated cohort ladder** | runs, and is fun. Verified against formula at 150k xp/s |
| **Whether a 4 / 8 / 16-minute system is too short** | five worlds now, 124 minutes of floor |
| **Worlds 4 and 5** | authored. They cost almost nothing once no row was denominated in souls |
| **`riders_1`'s +2,000** | flagged as ~80% buying nobody at the headcount of the time; lines now stack and cycle, which changes the count it is read against |

### Doc-vs-data drift found and resolved into this file

`progression.md` argues at length from figures that have since moved. **This file
carries the live value.** Each is now also a tuning question:

| Figure | Argued from | Live | Consequence |
|---|---|---|---|
| `evenExperienceBonus` | 0.5 (×1.5) | **2.0 (×3)** | Even may now dominate the alignment choice |
| `harness.clickMs` | 10 | **250** | 25× — the second world is ~288 unstaffed presses |
| `harness.perWorker` | 0.02 (implied) | **0.2** | **the whole anchoring phase is 10× faster than designed** |
| `harness.splitSteps` | `0.5 / 0.25 / 0.1 / 0.05` | **`0.25 / 0.15 / 0.1 / 0.05 / 0.025`** | the lever opens at quarters, not halves; five rungs, not four |
| third world anchoring | `5 × 360_000` | **3 × 180_000** | ~90 s staffed against a designed ~50 min |

**The anchoring one is the serious one.** At the live figures the second world's
harness goes down in about a minute and the third in about ninety seconds, against
an intent of ten and fifty minutes. Either `perWorker` drops back to 0.02 or the
durations gain a zero. **Retune `perWorker`, `clickMs`, the anchor durations and
the slot counts together** — no one of them is meaningful alone.

### Placeholder figures — authored without a recorded fit

"Placeholder" means no recorded run was fitted against, not that it is unplayed.
Anything play has already settled belongs back in its section.

- **Every refinery figure** — `coveragePerWorker`, interval, both
  experience-ladder terms, `ratioBase`, `levelHalving`, and all seven upgrades.
  Whether coverage plateauing at ~56% and ratio crossing even at level 28 read
  right is unrecorded.
- **All four token prices** — Ochre, Indigo, inversion base and growth. Not tuned
  against the refinery's placeholders either.
- ~~**`priceFactor`**, now a single number and the pacing knob on every level in
  the game.~~ **Retired — a level has no price.** It was granted a value of 0.2
  and fitted to the acceptance test before the realisation that no value of it
  is a decision: a rung came to a fixed multiple of one more copy at every gate
  on every cohort, so it was a tax or an off switch. What remains a placeholder
  is the **gate ladder**, which is the only knob depth has left. See §5,
  *Levels*.
- ~~**The clerk multiplier**, 250× a cohort's base cost, lifted from AdCap and
  never checked against this economy.~~ **Checked, re-derived, and kept** — at a
  cost decade of 7 it reads 175×, a quarter to a third of the way up the row's
  own ladder whatever that row's ramp. Both framings it used to be argued from
  are retired: the tier price needed a rung to have one, and the flat 38 copies
  needed one ramp for everybody. The **wall clock** between rows is unrecorded.
  See §5, *Entry*.
- **`W`, `X` and the +2% per wisdom** — set at 10¹² and 4 × 10¹³ without a
  recorded run behind them. `P` is still unwritten because nothing spends wisdom
  yet.
- **Every beat floor in §16**, all eight fitted to an economy that no longer
  exists. **Re-fit them after this pass is measured, not during it** — they were
  fitted to the pre-ladder economy and are all wrong in the same direction.
- **Every harvest ratio** — the seconds-of-income figures, never measured. The
  denomination is settled; the numbers are not (§15).
- **All anchoring durations and both bonus figures**, worlds 4 and 5 included and
  those two are guesses.
- **All four world-discovery gates.** They put discovery near the harvest beat and
  nothing more.
- **The whole click ladder**, whose gates were set against the old cohort costs.
- **`harder_lives_1` and `hard_season`**, still much smaller than a single
  level rung — and the whole of the `karma_negative` sink but `carry_1` (§14).
  They are on the yield axis now and must stay there; see §5.
- **`shortPileFloor`**, chosen so the cliff's one honest use survives at 95%.

### Findings from play

The author's full play-through, recorded 2026-09-23. Impressions, not timed
measurements.

**What works**

- **Cohort pacing** feels balanced — too fast, if anything, once the high rows
  snowball (§5).
- **The world 3 income step** is barely felt, visible only in the sweep bars
  (§5, §13).
- **The opening has a real decision** — keep pressing, or micromanage the manual
  sends of freshly unlocked rows (§4, §5).
- **The refinery's ratio climb reads as progress**, past `ratio_even` — slow
  below it, a rush above it, which follows from its tie to karma income (§9).
- **Lines round the ladder** progress correctly; their *presentation* doesn't
  explain them (§12).
- `work` and `press` without a picture is fine for now — the harness is a meta
  layer (§12).

**What doesn't**

- **Karma has no purpose.** Even is locked at nearly every harvest because ×3
  experience is the fastest progression; the dial sits centred except to correct
  (§6, §14).
- **Excess is a chore**, quick to clear unless left flooding for a long while
  (§8).
- **The demand's purpose is unclear** — a bonus to a currency nothing needs (§14).
- **The press is vestigial past the opening**, `carry_1` included. Missing: more
  click upgrades, and a golden-cookie equivalent — a temporary boost that makes
  pressing profitable again (§4).
- **Manual timing is a microgame.** Lives shorten too fast for it to matter, and
  the extended info mode makes the timing trivial. Long cohorts spiking excess was
  interesting, and short-lived (§5, §6).
- **Short and long cohorts feel like different speeds**, not different kinds of
  row — §6's cohort identity does not land (§6).
- **Depth is only for fun.** Cohort 1 reached **400** — gate 400 is reachable —
  and moved nothing. High counts want a synergy (Cookie Clicker's grandmas,
  cursors), not more direct output (§5).
- **The grades are completion purchases.** At billions of crimson, max Ochre →
  max Indigo is a formality; inversion is never worth it (§10).
- **The split's idle count** is a small tax that does little; the refinery, with
  no split upgrades, suffers it most (§11).
- **Anchoring** gets taken on most worlds, reads as a slightly cumbersome
  minigame, and the bonus isn't evident. `perWorker` could be slower, and some
  harness upgrades appear before the Harness tab (§12).
- **Later worlds feel too slow to be worth it** (§13).
- **Harvesting early can leave nowhere to reach** until the discovery beat — and
  with two worlds known, world 3 can be skipped for 4. Legal today, and it felt
  wrong (§13, §16).
- **Wisdom goes stale.** A second run is only faster; raising `W` slowed it
  without changing that (§18).
- **Re-buying the level tiers every run** is click-spam — affordable almost at
  once. Candidate: knowledge that permanently raises cohort tiers (§5, §18).
- **The log is placeholder and hidden** — never opened, and nothing asks you to
  (§1).
- **Beats need readjusting**, with gaps to fill; the author is recording them
  (§16).

**Direction from the author**

- Knowledge stays in the plan, and should reach **across lifetimes** — a variable
  like max refinery workers, which feels short and stale within one run (§18).
- The end-run verb stays in the bottom strip; opening it from the header's legacy
  cell would bring back header buttons (§18).
- Names wait until progression is settled (§1).

**Not yet answered:** holding vs merging (§15), whether the worlds behind you
matter, the takeover with tabs collapsed (§17), and when the first prestige opened
and what it paid (§18).

---

## 20. Vocabulary

Code and UI differ in places, **on purpose**. These are not drift and should not
be "fixed".

| Code | UI / this document |
|---|---|
| `detail` | the world's own proper noun |
| `red` | **Crimson** |
| `yellow` | **Ochre** |
| `blue` | **Indigo** |
| `refining` | **Refinery** |
| `reserve` | souls held back / the split |
| `alignment` (on a world) | the polarity locked at its harvest |
| `polarity` (elsewhere) | the two sides of karma |
| `cohort` | a row of the ladder — one index, one kind of soul |
| `level` | a count-gated ×2 on one cohort |
| `clerk` | what makes a cohort send its own souls (placeholder — see §19) |

### Retired words — do not reintroduce

**clearing** → refining. **probe** → soul. **stage** → phase. **seats** → slots
(a seat is furniture and implies a room; a slot is a capacity, which is all the
number ever was). **reversal** → inversion.

**`tier` and `level` are kept, not retired.** An earlier pass here called for
both to be replaced by `milestone`, on the reasoning that `tier` was doing double
duty for *which cohort* as well as *which rung*. Struck this session: **one word
for one thing** still holds, but the word is `level`, not `milestone` —
`milestone` already names a different thing in §16 (a firsts the log narrates
that no beat covers), and reusing it for a cohort's rung would be the exact
collision this rule exists to prevent. A **cohort** is which row, a **level** is
which rung.

**body** → **world**. A star is a world too; the game has one word for *the place
you are standing on* and does not need a second for *the kind of thing it is*.

**manager** → **clerk**. The mechanic is AdCap's; the word is not, and *manager*
carries an org chart the fiction does not have.

**angel**, **ascension**, **rebirth** → say **the run ends**, and name what is
left: **wisdom**. The game has never used a word that congratulates and should not
start at its largest beat.

### The wave's three words

A **phase** is a half-wave, light or dense. Two phases make a **cycle**.
`cycles_per_age` cycles make an **age**. Ages count up without limit — a world is
finished by harvesting, not by running out.

### Three distinctions that are easy to lose

**First harvest vs harvest.** The **first harvest** is the gated one-off event
that ends a world and costs you souls. The **harvest** is the recurring yield
that world then sends forever. They are different things and the words are not
interchangeable.

**Alignment vs polarity.** `Polarity` is the shape — negative, even, positive.
**Alignment** is the role that shape plays when it is locked onto a world at its
first harvest.

**Wisdom vs knowledge.** **Wisdom** is what you are: earned only when a run ends,
from what that run moved, and it multiplies while you hold it. **Knowledge** is
what you have: bought with experience inside a run, at a rate that worsens, and
spent inside it. They are different objects at different indices and **knowledge
never becomes wisdom** — §18 explains why that conversion would break the end of
every run.

---

## 21. Held proposals

None is built and none is decided. The first answers §19's *karma expires*; the
rest are spliced from the v6.2 addendum and wait on it — they tax or reshape
karma, and a tax on a currency nobody wants is decoration.

### Karma as weight

Proposed 2026-09-23, **built on `dev-next` the same day, not settled.** **Karma
stops being a currency and becomes a burden: what you hold slows you, and the
refinery is how you put it down.**

**As built** — where it departs from the argument below:

- **Drag reaches cohort and harvest experience, never the press.** Inert until
  the `refining` beat: weight arrives with the tool to shed it.
- **The departure snapshot divides the drag back out**, as it does the bias, so
  a heavy moment is not locked into a world's harvest.
- **An incurred price adds `incurs × income ÷ 2` to each pole**, into the pile
  but not the lifetime total, so a price opens no karma gate. `carry_1`,
  `harder_lives_1` and `hard_season` incur 60 / 120 / 300 s.
- **`read_the_wave` and `the_other_way` are unpriced**, arriving at their xp
  gate — they open core systems, not choices. `str_3`/`str_4` still spend.
- **The demand is the pull**, 5% of the wanted pile a phase. **Extremity is ×1.**
- **Harvest `K` pays half into each pile** and counts as weight, in the piles
  and in income. Even still takes ×3 experience and no karma, so the lock now
  trades crimson feedstock for experience.
- `drawSeconds` 3, `backlogHalving` 900, grace 0 — one sim pass, below.

**First sim, 6 h, `cheapest`, detent Even, 25% refining** — against `a05b94e`:

| | terminus | worlds harvested | xp at 1.65 h |
|---|---|---|---|
| Before | 216 m | 3 | 5.0 × 10¹¹ |
| Stock draw at 18 s, no drag | 112 m | 2 | — |
| As built, no pull | 126 m | 3 | 6.7 × 10⁹ |
| `K` to one pile | never | 4, then stalls | — |
| As built, `K` split | 170 m | 4 | ~1.3 × 10¹⁰ |

- **The stock draw alone halves the run to terminus.** It pays far more crimson
  than coverage did; wisdom's `W` is now mis-set.
- **Paired weight is survivable.** Without the pull, drag climbs back from ×0.54
  to ×0.95 as the refinery settles the backlog near 38 s.
- **Unpaired streams were fatal once every world was behind you.** With `K`
  paid to one pile, `N` reached 0, pairing stopped and drag fell to ×0.05 by
  6 h — no cohort was earning, so no dial could correct it. Splitting `K`
  fixed it: after the last harvest the piles hold level, drag sits near ×0.95
  and crimson keeps climbing.
- **After the last world the run is a cash-out.** The worlds behind you feed
  the refinery, and wisdom's square root makes when to end the run a choice.
  Whether that stretch should be short by design or a real phase is open.
- **The dial's job is serving the pull**: a world empties its wanted pile, so
  you aim toward it to stay paired. Unpaired stock is the balancer's — below.
- ⚠ **Experience runs ~75× below the old curve** at 1.65 h even when it
  survives, and the harness, lines and level ladder are priced against the old
  curve.

§3's piles only grow, and xp and karma grow together at a fixed 1 : 2, so there is
no state in which a strong run carries little karma. This makes that state the
goal: 2B xp/s on 100k held karma is a run that refines well.

**Weight is read in seconds, never in amounts.**

```
backlog  = (P + N) ÷ karma income        seconds of your own karma, cycle-mean
drag     = 1 ÷ (1 + backlog / B₀)        multiplies experience
```

Income is the bias-excluded cycle mean §9 already computes, so the reading does
not swing with the wave. Both poles weigh — service to others is carried too, and
the game does not say which is heavier. A grace allowance under which `drag` is 1
is an option, not a requirement.

**The refinery has to draw on the stock.** Coverage (§9) draws a share of
*income* that never reaches 1, so the pile grows forever: under compounding income
an uncleared backlog is about a third of the run so far, and grows with the clock
whatever you buy. A stock draw settles instead:

```
draw     = min(P, N) × reach / τ₀        per second, from both piles
crimson  = draw × ratio
```

At equilibrium the matched backlog sits at `τ₀ / reach` seconds, and every refinery
upgrade visibly lowers it. This is v4's residence draw brought back for a reason
v4 did not have — the backlog **is** the reading now, so a stock-shaped number is
the point rather than jitter. `coverage`'s saturation goes: a draw on a stock
cannot exceed the stock. **Pairing survives untouched** — the unpaired remainder
never enters (§9), and the level, `ratio` and wisdom's crimson axis are unchanged.

**Excess gets teeth for free.** The refinery cannot touch the unpaired remainder,
so a tilt is weight nothing but the aim dial can shed. §8's correction is still
cheap; what changes is that *being* tilted now costs you every second you stay.

**Prices incur rather than spend.** An upgrade `incurs 60 s` of karma, on **both
poles** — excess-neutral, scale-free, a cost you work off rather than a balance
you draw down. What you incur becomes crimson later, so a karma price is deferred
crimson rather than a loss.

**What it fixes**

- **Refinery staffing matters**: clearing weight is what lets experience grow, so
  the split, worker slots and knowledge's *max refinery workers* all bite (§11,
  §18).
- **Karma has a job**: feedstock and burden, the §1 premise — *it only makes you
  carry it* — as a mechanic.

**What it breaks — every karma reward becomes a penalty**

- **The harvest's `K`** (§14) pays karma into the piles. It would have to pay
  crimson, or pay *relief* — a finished world that lifts weight off you.
- **Even's ×3** already wins, and would win harder: it is the one lock paying no
  karma. The alignment trade needs rebuilding with the harvest.
- **The demand's `D`** (§14) multiplies a penalty. Replaced by *the world pulls
  its wanted pole off you* — a share of that pile each phase, a sink with a
  direction. `matchShare` retires.
- **The extremity bonus** (§6) becomes a pure cost: more karma, a smaller short
  pile, less pairing. **The dial needs a new job** — today it would only correct
  excess. Open.

**Open**

- `B₀`, `τ₀`, the grace allowance, and the incurred seconds per upgrade.
- **Does the drag reach the press?** Exempting it makes the hand the one thing
  weight cannot slow — a reason to press under a heavy backlog (§4).
- **Harvest income from worlds behind you** — weight, or exempt?
- **The gap between worlds**: income is zero there, so `backlog` is undefined.
  Freeze the last reading.
- **Never touch `duration` or the wave** (§7): the drag is a yield multiplier and
  nothing else.

#### The balancer

Specified 2026-09-23, not built. **A load balancer for the piles: refinery souls
that move karma from the long pile to the short one, so unpaired karma becomes
feedstock.** The name is a working name.

- **A second split on the refinery screen**, reusing `SplitControl`. It divides
  the refinery's *staffed* souls between drawing and balancing; the existing
  split still sets how many souls the refinery gets.
- **1 : 1, nothing destroyed.** Karma leaves the game only as crimson. Balancing
  makes pairing possible; it never clears weight itself.
- **Stock-shaped, like the draw, and self-stopping:**

  ```
  moved = (L − S) / 2 × reachBalance / drawSeconds    per second, L → S
  reachBalance = reachPerWorker × balancers × efficiency
  ```

  Half the gap, so it converges and never overshoots. At `L = S` it does
  nothing. Direction is automatic — nothing to aim.
- **Its cost is the souls.** A balancing soul is not drawing: balance now buys
  crimson later. `draw` reads the drawing souls only.
- **On the refinery's clock, not the wave's.** It runs between worlds and after
  the last one; since `K` split, the endgame rarely needs it.
- **Unlocked by purchase, not by the refining beat.** A refinery upgrade priced
  in crimson, gated around the second harvest — after world 1 has taught the
  swing through the dial, and after an imbalance has visibly weighed. Later
  rungs raise its rate on its own stat.

**Open**

- ⚠ **The harvest gate.** A staffed balancer holds excess at 0, so `excessGate`
  becomes a staffing cost rather than a correction. Either that is the intent,
  or its rate is tuned so reaching 0.03 still takes longer than re-aiming (§8).
- The unlock's price and gate, and the rate per soul — sim figures.
- **Where weight reads.** Built as a *Weight* figure beside the Excess reading in
  the Karma cell. The meter reads the piles' *difference*; weight reads their
  *size* — two quantities, so they stay two figures, side by side.

### The short-pile skim

Karma arriving in the pile you are **short** of is multiplied by
`skim = 1 − k × |excess|`. At `k = 0.8` and excess 0.9 you keep 28% of what you
aim, so §8's hundred-second correction becomes about six minutes — hard to start
turning, then it snowballs free. **A hump, not a wall.** It is the only candidate
that passes §8's test, because it slows correction without scaling with income.

- **Retune `excessGate` in the same pass.** 0.12 → 0.03 was authored against free
  correction; world 5 may stop being passable.
- ⚠ **It hits the refinery twice** — `capacity = coverage × shortPileIncome`, and
  the skim cuts `shortPileIncome` on top of the detent's share cut.

### Phase-shape debuffs

Excess reshaping the wave rather than taxing income. **Burden makes the wave
hostile; Comfort makes it inert** — both attack timing, both revert as excess
clears.

- **Burden** skews the duty cycle toward dense. Whether that is a brake or a
  spiral depends on whether negative karma is worth having — §19 again.
- **Comfort** collapses the wave's *amplitude*, both phases toward ×1. Flattening
  only the light phase would self-heal and make Comfort the safer pole, which
  moralises the choice §1 says the game never does.
- **Conserve the cycle, never the phase** — skew within a fixed cycle, or world
  length starts depending on play (§7). The authoring surface would become
  `cycle_duration` and `lightShare`.
- **It breaks §9's cycle mean**, which assumes equal halves. Weight the mean by
  the duty cycle per lane, in the same pass.

### World preference as duty-cycle skew

One authored `lightShare(p)` per world. A dense-heavy world changes what a long
life averages to and how volatile a short one is — §6's cohort identity — so it
buys **world identity** with a single fraction, whether or not karma ever finds a
buyer. The cheapest of the four.

### The phase-gated dump

A verb live **only** in the phase paying against your tilt: shed a capped share of
the pile you are long, at a loss, at a climbing never-resetting price like
inversion. A karma sink without commerce, and a wave-timed decision after the
clerks have taken the others.

> **A lever, not a chore:** an action you *must* take every phase fights *many
> hands, then fewer, then none*. One only *available* in one phase and only
> *worth taking* when excess is deep is a lever.

### An upgrade tree

**A tree adds choice, not sink** — exclusive forks mean fewer purchases, not
more. So it does not fix karma expiring; it fixes *every purchase is
click-when-affordable*.

- **Split the rail, don't replace it.** Generated purchases (copies, levels,
  clerks) stay on the rail; the authored one-offs move to the tree.
- **First version: the existing chips with edges drawn.** Count the forks that
  fall out. Three or four and the tree is real; if they have to be invented, it
  isn't. The hand (strength vs `carry`) and the harness (capacity vs granularity
  vs payout) fork; the refinery's fork is fake, since `efficiency` and `reach`
  are one channel.
- **Polarity-priced branches** make the tree a record of which pole you ran; a
  **node priced from both piles** makes balance buy something.
- **Respec priced like inversion** — climbing, never resetting.
- **In-run first, as a fifth tab.** It breaks §17's *the rail belongs to the
  screen under it*, which then needs an explicit exception.
