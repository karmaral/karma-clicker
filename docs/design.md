# Karma Clicker — Design

**This file supersedes CONTEXT v3.** It states what the game *is*: mechanics,
economy, progression, and the authored numbers behind them. It contains no
implementation — no components, no architecture, no rendering. Where a filename
appears it is because that file is the **authoring surface for a design knob**
(`balance.ts`, `planets.ts`, `buildings.ts`, `upgrades.ts`), never because it is
where code lives.

Two companion documents remain, and neither owns design any more:

- `docs/progression.md` — implementation rationale, visual/shader arguments, and
  the record of *how* each decision was reached. Read it when you want the
  argument behind a conclusion stated here.
- `docs/handoff.md` — session orientation. Not design.

Every figure below is checked against source data as of this writing. Figures
that are placeholders are marked; §19 is the full index of what is untuned and
unplayed.

**This revision replaced the economy's shape.** §5 (cohorts), §6 (aim), §13
(worlds) and §18 (the larger wheel) are new; §3, §10, §16 and §20 changed to
follow them. The move was from **authored figures per thing** to **one formula and
an index**, on the Cookie Clicker / AdventureCapitalist model: every cohort, every
level and every world is now generated, and the game can be extended by
incrementing a number rather than by inventing a row. Nothing that is generated
has been played.

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

⚠ **The narration is placeholder and was barely authored.** It has been treated in
earlier drafts of this document as the fiction's specification. It is not. The
lines below are a handful of first passes that happened to be written down, and
**no argument anywhere in this file should rest on the wording of one.**

What survives scrutiny is the **register**, which is worth keeping and is cheap to
keep:

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

That constraint is the whole of what is settled. **Every line is replaceable and
most of them should be replaced** — several now describe mechanics that have moved
(a clerk is not "one of them", two worlds is not the end of a run) and the ones
that still fit fit by accident. **Treat the log as unwritten and the voice as
decided.**

### What is unwritten

- **The worlds have no identity.** They are `Planet 1 / Simple`,
  `Planet 2 / Harder`, `Planet 3 / Haderer` (sic). Names, character and any sense
  of *why these and in this order* do not exist. This is the largest fiction hole
  and it sits on the game's central object. It is now at least *indexed* — a world
  has a place in its system (§13) — which gives the naming something to lean on.
- **Boons are unauthored.** A world can leave you holding a permanent change
  when you finish it (§14). The mechanism is wired end to end and every world
  declares none, so the row reads `—`.
- **The cohorts have no names past the four inherited ones**, and those four were
  named for yield shapes the generated ladder no longer has (§5). Naming is now an
  indexed authoring surface like everything else.
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
10. **Arrive.** Every world past the first opens with a forced **anchoring**
   phase — held souls place anchors, a harness goes up, and souls ride it (§12).

11. **End the run.** A run walks every world of one system. What it moved becomes
    **wisdom**, which multiplies the next one or is spent to change what a run is
    (§18).

A run is one system long. The wheel it turns is the same wheel a soul turns, one
index up.

---

## 3. Currencies

| Resource | Polarised | Created by | Spent on |
|---|---|---|---|
| `experience` | no | press, cohorts, harvest income | cohort copies, level upgrades, clerks, some click and harness upgrades, **knowledge** |
| `karma_positive` | yes | press, cohorts aimed positive, harvest income | ~15 upgrades across click / harness / refinery / cohorts / planets |
| `karma_negative` | yes | cohorts aimed negative, harvest income | **nothing yet — see commerce, §18** |
| `red_positive` (Crimson) | yes | the refinery | three refinery upgrades, three harness upgrades, Ochre |
| `red_negative` (Crimson) | yes | the refinery | Ochre only |
| `yellow` (Ochre) | no | pairing Crimson from both piles | Indigo, two refinery upgrades, one harness upgrade |
| `blue` (Indigo) | no | Ochre | the deep end of the knowledge market (§18) |
| `knowledge` | no | **buying it with experience, at a worsening rate** | in-run unlocks, and the permanent shelf (§18) |
| `wisdom` | no | **prestige only** — `√(karma moved across the run)` | held it multiplies; spent it buys structure and stops multiplying (§18) |

### The two that changed

**`wisdom` is no longer an experience sink.** It was 1,000,000 experience for one
unit with nothing to do with the unit. It is now the prestige residue: earned only
when a run ends, never inside one, and it is the outer index of the same wheel
everything else turns on.

**`knowledge` is the currency wisdom used to be confused with.** Earned inside a
run by spending experience, spent inside a run — except for one shelf that
survives. Wisdom is what you *are* and knowledge is what you *have*; they are not
two names for one thing and §18 keeps them apart.

### The asymmetry that is now a design target

**Nothing costs `karma_negative`, and nothing costs `red_negative`.** So a Comfort
tilt (positive surplus) is partly self-correcting — your own purchases eat it —
while a Burden tilt has no sink but the aim dial.

This accumulated rather than being designed, and the commerce layer (§18) is the
answer it was waiting for: **a market has two sides, and selling the pile you are
long is the sink the negative side never had.** Until that is authored the
asymmetry stands as-is.

### Vocabulary note

Code says `red` / `yellow` / `blue`; the UI says **Crimson** / **Ochre** /
**Indigo**. This is deliberate and is not drift. Full table in §20.
## 4. The click

The press is `main`, and it is the only producer of `role: 'click'` — not a
cohort, excluded from everything that fans out over cohorts.

| | |
|---|---|
| Yield | 5 experience, 1 karma |
| Duration | 0 — instant, and never anything else |
| Aim | none — the press pays flat karma at any detent (§6) |

**The press is instant from the first one.** It used to open on a 1,000 ms
cooldown and ramp down through a three-rung `speed_*` ladder ending in *It
clicked for you* — a pun worth one upgrade name and, in play, an obstacle in
front of the one verb the player uses continuously. **Click-and-wait now belongs
to unclerked cohorts alone** (§5): a row you send by hand and watch fill is a
timing decision against the wave, where a cooldown on the press was only a
throttle. One mechanic, one home.

**The click's karma is a flat 1, untouched by every strength upgrade.** That is
load-bearing: it makes a **karma gate a press count**. A cohort gated at 30
positive karma is 30 presses, and how fast they arrive is the player's hand
rather than a chip. An experience gate would be pulled forward by the strength
ladder instead, and there are already four of those.

### The ladder — paced, not priced

Five upgrades on one axis, and their **gates are the authored figure; their ids
are not the order they arrive in.** Read the gate column, not the name.

| Upgrade | Effect | Unlocks at | Costs |
|---|---|---|---|
| `str_1` | ×1.5 experience | 40 xp | 30 xp |
| `str_2` | ×2 experience | 2,500 xp | 1,800 xp |
| `str_3` | ×3 experience | 400 karma+ | 300 karma+ |
| `str_4` | ×9 experience | 2,000 karma+ | 1,500 karma+ |
| `carry_1` | +0.2% per riding soul | 60,000 karma− | 200,000 karma+ |

`str_1` alone is the tutorial. Its gate of 40 is also the gate that opens the
upgrade rail, deliberately, so the rail is never revealed empty and opens holding
exactly one chip.

The strength ladder compounds to **×81** (1.5 × 2 × 3 × 9). `str_4` squares
everything above it once, which is a retune hazard: moving `str_1`–`str_3` moves
`str_4`'s meaning.

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
- **`riding`** — `min(riders, incarnating)`, and 0 until an anchor is down. Souls
  held on the split are out: a soul *placing* the harness is not riding it.
- **`carry`** — what one rider is worth to you. Held by the hand. `carry_1`
  grants 0.2% per soul, so at the 200-rider cap it is +40% and at 2,000 it is
  +400%.

Deliberately linear and deliberately capped. The same modifier on a *cohort*
would be quadratic in souls, because a cohort's yield is already multiplied by
its count — which is exactly why this belongs to the hand and must stay there.
The ceiling being a purchase rather than an accident is the coupling worth
having: buying riders now pays twice.

`carry_1` is gated past `riders_1`. With nobody up there it buys nothing.

### During anchoring, the press pays differently

While a world is being anchored, the press buys **job-time instead of
experience**, not as well as it (§12). One verb with one payoff at a time, so the
trade the phase imposes is legible.

---

## 5. Cohorts and the army

Each cohort is a count of souls; each soul lives for `duration` and leaves its
yield behind when it ends. **There is no longer a fixed number of cohorts, and no
cohort has authored figures of its own.** A cohort is an index, and everything
about it falls out of that index.

### Three constants and an index

```
cost(n)     = 15  × 10^(n−1)        experience
yield(n)    = 1   × 10^(n−1)        experience per soul
duration(n) = 1s  × 2^(n−1)
karma(n)    = 0.2 × yield(n)
ramp        = 1.07                  every cohort, every copy
```

Two consequences fall straight out of that and both are worth memorising:

> **rate = 5^(n−1) per second.** Each cohort is five times the throughput of the
> one below it.
>
> **payback = 15 × 2^(n−1) seconds.** Each cohort takes twice as long to repay
> itself as the one below it.

Later cohorts are deliberately *worse purchases* at base. That is the shape, not a
flaw in it: they are bought for the ceiling they raise, and they only become good
through their levels and through time.

| # | Base cost | Yield | Life | Rate/s | Payback |
|---|---|---|---|---|---|
| 1 | 15 | 1 | 1 s | 1 | 15 s |
| 2 | 150 | 10 | 2 s | 5 | 30 s |
| 3 | 1,500 | 100 | 4 s | 25 | 1 m |
| 4 | 15,000 | 1,000 | 8 s | 125 | 2 m |
| 5 | 150,000 | 10,000 | 16 s | 625 | 4 m |
| 6 | 1.5M | 100,000 | 32 s | 3,125 | 8 m |
| 7 | 15M | 1M | 64 s | 15,625 | 16 m |
| 8 | 150M | 10M | 128 s | 78,125 | 32 m |

**Cohort 12 exists the moment somebody writes `n = 12`.** Its payback is eight and
a half hours, which is what the prestige multiplier is for (§18) and not a reason
to leave it unauthored.

### The staircase is a single number, and it never moves

The whole point of the geometric shape is that **the moment to move up the ladder
is the same moment at every rung, forever**:

```
1.07^n = 10   →   n ≈ 34
```

Your **34th** copy of cohort *n* costs exactly what the *first* copy of cohort
*n+1* costs, and that first copy produces five times as much. Below 34 you are
buying width; above it you are buying depth, and depth is only worth it once the
levels are paying. There is no per-cohort crossover to tune, because there is
only one crossover.

### Levels — why anyone owns four hundred of anything

Ten rungs, gated on **current count**, each granting **×2** to that cohort. Kept
as `level`, not renamed to `milestone` — §16 already uses that word for a
different thing, and §20 corrects the earlier call to rename this to it.

**`[10, 25, 50, 100, 150, 200, 250, 300, 350, 400]`**

A cohort at 400 with its ladder complete is `400 × 1,024` = **409,600×** its base
rate, against 400× without. **That is the entire reason to go deep on a cohort you
have already out-scaled** — a fully-levelled cohort 1 still earns while you are
buying cohort 8, and nothing else in the economy does that.

The old six-rung ceiling was set by a real constraint — ten rungs of compounding
speed took `chaos` to twenty milliseconds — and the constraint is now handled
rather than avoided:

> **A rung halves the life until the life reaches ~60 ms. Every rung past that
> doubles the yield instead.** Both are ×2; only the shape of the ×2 changes.

So the split is derived, never authored: **halvings = min(10, n + 3)**, and the
remainder are yield rungs.

| Cohort | Halvings | Yield rungs | Life at rung 10 |
|---|---|---|---|
| 1 | 4 | 6 | 62 ms |
| 2 | 5 | 5 | 62 ms |
| 3 | 6 | 4 | 62 ms |
| 4 | 7 | 3 | 62 ms |
| 5 | 8 | 2 | 62 ms |
| 6 | 9 | 1 | 62 ms |
| 7+ | 10 | 0 | 62 ms and up |

Millisecond lives are fine. The register is deadpan industrial and a life is a
ledger entry; nothing in the fiction asks a soul to last a perceptible time.

**The price is the existing rule, applied to generated figures.** §5 already had
it and it survives intact:

> **how many you own at the gate** × **how much better it makes each one** ×
> **what one more copy costs there** × `priceFactor`

which for a ×2 rung is simply `gate × cost(n) × 1.07^gate × priceFactor`.
`priceFactor` is now **one number for the whole game** instead of one per cohort.

| Gate | Cohort 1 rung price | Cohort 1 copies owned cost |
|---|---|---|
| 10 | 295 | 207 |
| 25 | 2,035 | 949 |
| 50 | 22,095 | 6,098 |
| 100 | 1.30M | 185,722 |
| 200 | 2.26G | 161M |
| 400 | 3.4 × 10¹⁵ | 1.2 × 10¹⁴ |

Four hundred copies of cohort 1 is a genuine late-game purchase. **You finish the
first cohort last**, which is the AdCap shape and the correct one.

### Clerks — the game is clicking several things before it is clicking one

**Every cohort starts manual, cohort 1 included, and every cohort has a clerk to
buy.** You click its row to send one batch of souls out. A **clerk** costs
`250 × cost(n)` and thereafter the cohort runs itself, forever.

⚠ **`clerk` is a placeholder — the word is unsettled.** It reads as an office the
retired word `manager` already ruled out, and nothing tried in its place (ledger
words, mechanical ones, managerial ones, continuous-process ones) has landed. See
§19.

**Cohort 1 is not exempt.** An earlier draft of this section gave it no clerk to
buy, on the reasoning that the first soul is something that happens to you and
should stay that way. That reasoning does not survive contact with §5's own arc —
*many hands, then fewer, then none* — since a row that can never be automated is
a row the arc cannot reach. What the first-soul beat actually wants is that the
row has to have been sent by hand **at least once** before the option exists,
which the uniform rule already gives it: cohort 1's first copy is free and
manual, same as every cohort's first copy is manual, and its clerk is bought like
any other's. There is a placeholder log line near the first-soul idea (§1) and it
should not be taken as the copy; the beat needs writing.

This restores the dropped `autonomous` flag, which was coded and then pinned open,
and it earns three things:

- **The early game has more than one verb.** Before the first clerk the run is a
  small floor of ledgers being worked by hand, which is the register the game
  wants and the shape the press alone cannot make.
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

- **Cohort 1's first copy is free**, and it is gated at **30 lifetime karma+**.
  That preserves §4's press-count argument, which is load-bearing exactly once —
  on the first cohort — and the first-soul beat, which is something that happens
  to you rather than a chip you find.
- **Every cohort past the first is revealed at `5 × cost(n)` experience** and has
  no separate entry price. The first copy *is* the entry. One reveal rule, no
  table.
  - **Corrected from `0.5×` this session**: at `0.5×cost(2)` cohort 2 unlocked
    before cohort 1 did — the 30 clicks the karma+ gate demands already pay
    more lifetime xp than that (5 xp a click, flat). `5×` sits past what
    reaching that gate by clicking alone earns, so the second cohort's row
    takes actually running the first one, not just pressing the same button
    thirty more times.

### What this deletes

Per-cohort ramps and the cap-at-200 retune. Per-cohort yields, biases, durations
and resistances. Per-tier speed and yield multipliers. The six-rung gate ladder and
the argument that chose it. `through` and per-cohort `priceFactor`. Cohort entry
prices. The `red_basic` cohort — **the refinery is now the only source of
Crimson**, which is a cleaner story than a cohort that eats its own output.

And `zealot`'s **ρ = ∞** resolves itself: every cohort yields experience, so
payback is defined everywhere and a buy-policy can rank the whole board.

### What survives untouched

**The merge rule.** A level is gated on current count, so:

> **A count-gated upgrade is held only while its count is held.**

A shallow merge costs a rung or two; merging everything costs the ladder. The
slider still prices its own consequence (§14), and it prices it harder now, because
ten rungs of ×2 are a bigger thing to lose than six rungs were.

**Prices are generated, never hand-typed.** More true than before: there is now
exactly one price formula and one `priceFactor` behind every purchase on the
board.

**An army is a ramp.** The §5 rule still holds — count is set by the ramp — but
the conclusion inverts. The old ladder had hand-picked yields with no fixed
relation between cohorts, so income went roughly linear once the last cohort was
bought and the counts stalled. **Here income compounds by construction**: each
cohort is a fixed multiple of the last, so the 1.07 curve never catches up, counts
never stall, and the cap that the retune installed is not needed and is gone.

### Open

- **Nothing above is tuned against a clock.** The ladder is internally consistent;
  whether cohort 5 arrives at the right minute of the run has not been measured.
- **`priceFactor` is unauthored** and is now the single pacing knob on every
  level in the game.
- **The clerk multiplier of 250×** is lifted straight from AdCap's manager ratio
  and has not been checked against this economy.
- **Cohorts are `cohort_1`…`cohort_8` in code and `Cohort n` in the UI —
  placeholders, not names.** The four inherited names — Impulse, Steady, Chaos,
  Zealot — were named for yield shapes that no longer exist and are gone from
  the data entirely. Naming is now an indexed authoring surface like everything
  else, the same shape as `Planet 1 / Simple` in §1.
- **`clerk`'s own name is unsettled** — see §19.

### All-cohorts upgrades

Two, and they fan out over every cohort — by class, so the click is excluded
without anyone writing a rule that says so.

| Upgrade | Effect | Unlocks at | Costs |
|---|---|---|---|
| `shorter_lives_1` | −6% duration, all cohorts | 250,000 karma+ | 310,000 karma+ |
| `hard_season` | −12% duration, all cohorts | 900,000 karma+ | 1,200,000 karma+ |

They **sum** to −18% rather than compounding to −17%. A global shortening of every
life should add up the way a player reading two percentages expects.

⚠ Both are now much smaller than a single level rung and want re-siting
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

`extremityMultiplier: 3`, global. **Extremity is the whole reward for
committing:** at Even you take ×1, at a hard detent ×3, and the middle detents sit
at ×2. Running a side pays; the game never says which side.

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

**Duration replaces them, and does the job better because it is already there:**

> **A life accumulates the phase bias across its whole span.** A one-second life
> sits inside a single phase and takes that phase's bias whole. A 128-second life
> spans several and averages them.

So **short cohorts are volatile and can be timed; long cohorts are smooth and
cannot.** That is a real reason to own both ends of the ladder at once, it is
derived entirely from `duration(n)`, and it costs zero authored numbers.

**The manual batch is the lever this hands you.** A cohort without a clerk (§5)
sends its souls when you click it, so you can hold a batch through a dense phase
and release it into a light one. Buying the clerk sells that timing for
throughput. **This is the polarity decision the removed numbers were reaching
for**, and it is legible without a needle diagram.

### The phase bias

`biasWith: 1.5` / `biasAgainst: 0.5`. A phase pays the polarity running with it
×1.5 and the one running against it ×0.5.

It is a **square wave**: a rate sits flat for a whole phase and then jumps by a
factor of 3 on the flip. Making it continuous over the phase position is still a
real option, but it changes the average bias across a phase and the excess reading
is a function of income — so it is a **balance change, not a display one**. Open.

**Now that lives span phases, the square wave has a second job**: it is what makes
a long life's averaging worth anything. Against a continuous bias the two ends of
the cohort ladder would converge, and the identity §5 leans on would flatten out.
That is an argument *for* the square wave that did not exist before.

### The re-aim penalty

Changing the detent costs you. `reaimPenalty: 0.65` — a 65% cut to karma —
decaying linearly to nothing over `reaimPhases: 2`.

**It is priced in phases, not seconds.** That matters and is a rule worth keeping:
phases are a clock nothing can buy (§7), so a penalty priced in phases is a fixed,
readable cost. It touches **karma only** — a penalty that slowed experience would,
under the old experience-priced wave, have extended its own duration.

⚠ The penalty was tuned against an economy where resisted cohorts kept earning
through a re-aim. Nothing resists now, so it bites harder than it did. It wants
re-measuring, not necessarily changing.
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

**Bounded ±1, and ±1 means something specific: a pile is at zero, which is the
same event as the refinery stalling.** The meter's end and the machine stopping
are one thing, so full scale is not "very bad" — it is a named state.

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

**An empty pile stalls the machine outright, and the stall compounds** — a
stalled refinery moves no karma, so it earns no levels either. That is deliberate.
Inversion (§10) is the paid way out.

### Three axes, and no fourth

| Axis | Moves | How |
|---|---|---|
| **staffing** | reserved souls working it | `min(reserve, slots)`, linear on the batch |
| **efficiency** | the X — karma per batch | yield multiplier |
| **speed** | the Y — seconds per batch | duration multiplier |

**Staffing appears in X and never in Y.** In both, throughput would go quadratic
in souls and the other two axes would be decorative. Slots pay off exactly when
there are souls to fill them, which couples the split to the upgrades instead of
stacking with them.

That leaves efficiency and staffing both scaling X, kept apart only because they
are *paid* differently: staffing costs incarnations every second it is held,
efficiency is bought once. **Batch and interval stay genuinely distinct for a
separate reason:** at equal throughput, big slow batches leave karma sitting
unrefined longer, and unrefined karma is exactly what excess measures.

### The level is not a fourth axis

All three axes above only move when something is bought, so throughput is a step
function of the upgrade table and flatlines when that table runs out. **The level
is growth the refinery earns by running.** It scales the *base* of an existing
axis — `batchPerWorker × (1 + yieldPerLevel)^(level − 1)` — before any bought
modifier applies.

**It scales the batch and never the interval**, for the same reason the staffing
knob is closed.

**Its experience is karma actually moved**, summed from what the piles gave up,
not a flat tick per pulse. **That same running total is what prestige reads** —
wisdom is `√(karma moved across the run)` (§18) — so the refinery's own level
counter is the game's measure of what a run was worth, and nothing new needs
measuring for the outer wheel. That is what makes it scale late: the refinery levels
at the rate the world feeds it, a starved pile halves the rate, and an unstaffed
one earns nothing while its clock keeps pulsing.

The compounding is real but self-damping — the batch grows
`(1 + yieldPerLevel)^(L−1)` while the rung grows `expGrowth^(L−1)`. **`expGrowth`
must stay above `1 + yieldPerLevel`** or the ladder outruns its own thresholds.

### Authored figures — all placeholders

| Knob | Value |
|---|---|
| `batchPerWorker` | 250 karma from each pile |
| `interval` | 4,000 ms |
| `expBase` | 5,000 karma to reach level 2 |
| `expGrowth` | 1.35 |
| `yieldPerLevel` | 0.08 |

Conversion is **1:1** — efficiency scales the karma *consumed*, and no separate
karma-to-red ratio exists. That ratio is the obvious next balance knob if the
refinery turns out to pay too well, and it is deliberately not there yet.

### Upgrades

| Upgrade | Effect | Unlocks at | Costs |
|---|---|---|---|
| `slots_1` | +4 slots | 5,000 karma− | 25,000 karma+ |
| `efficiency_1` | ×1.5 batch | 500 Crimson+ | 1,000,000 xp |
| `speed_1` | ×0.75 interval | 2,000 Crimson+ | 1,500 Crimson+ |
| `slots_2` | +12 slots (16 total) | 8,000 Crimson+ | 6,000 Crimson+ |
| `efficiency_2` | ×2 batch | 500 Ochre | 1,500 Ochre |
| `speed_2` | ×0.5 interval | 1,000 Ochre | 5,000 Ochre |

Each is **priced in what buying it should make you feel**: slots in karma,
efficiency in lifetimes, speed in what the refinery itself makes.

### Parked

Soul *types* feeding the refinery differently, and any partial-staffing curve
where empty slots slow the batch rather than shrink it. Both considered and set
aside as too complex for a first pass.

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

The verb is **`invert`** and the noun is **`inversion`**. Not *reverse* —
reversing implies undoing a step, and this undoes nothing: it buys the opposite
side at a loss, which is a different admission.

### Open

- **Wisdom has left this section.** It is no longer bought with experience at all;
  it is the prestige residue (§18) and it is earned, not priced.
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

**The anchoring share only bites while a world is going down.** Off-phase it
releases and those souls incarnate, so a lever left set between worlds costs
nothing.

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

**Watch for:** a bar that cannot help reading *idle* at every position past the
first detent may read as a mistake rather than as a cost. The surplus is the
point, but the point has to land.

---

## 12. Anchoring and the harness

Arriving at a world **past the first** puts you in a forced anchoring phase. A
world declares whether it has one; the first world has none, which is why the
phase is first met on the second world.

**It is a tax, not a gate.** Souls still incarnate throughout. The cost of
anchoring is the held souls not earning, not a stopped world.

The **hand is the exception**: while placing, the press buys job-time *instead*
of experience, not as well as it. One verb with one payoff at a time.

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
| `slots` base | 0 | bought |
| `riders` base | 0 | bought — this is `riders_1`'s whole content |

| World | Anchors | Each | Total job | Bonus per anchor |
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

### Two capacities, and a covered share

**Work slots** cap how many reserved souls place at once, so the split has an
optimum rather than *always max*. **Rider slots** cap how many souls the finished
harness pays.

"Only riders get the bonus" resolves into one scalar rather than two soul
populations:

```
multiplier = 1 + bonusPerAnchor × placed × min(riders, souls) / souls
```

The **covered share** scales it, which keeps a cohort's payout a single multiply
and keeps the cap honest at every count.

**A rider is a count, not a share.** Riders appear as the lines do, not when the
last anchor lands, so the swarm populates a growing harness.

### Upgrades

| Upgrade | Effect | Unlocks at | Costs |
|---|---|---|---|
| `slots_1` | +6 work slots | 40,000 karma+ | 60,000 karma+ |
| `split_1` | one rung finer | 80,000 karma+ | 500,000 xp |
| `riders_1` | +200 riders | 50,000 karma− | 150,000 karma+ |
| `slots_2` | +24 work slots (30 total) | 1,000 Crimson+ | 2,500 Crimson+ |
| `split_2` | one rung finer | 4,000 Crimson+ | 5,000 Crimson+ |
| `riders_2` | +2,000 riders | 10,000 Crimson+ | 12,000 Crimson+ |
| `split_3` | one rung finer | 500 Ochre | 750 Ochre |

Both rider caps are raw soul counts, so they took the army's ×5 with it — 40 out
of a thousand incarnating would carry nobody worth counting.

**Anchor-slot upgrades toward a higher anchor count are deferred.** Work slots
and rider slots are the two capacities chosen; a third is speculative.

---

## 13. The worlds

**Three was a placeholder and is now an authored count.** A run walks the worlds of
one **system**, inward, and the **star is the last world** rather than a different
kind of object. `worlds(system 1) = 3` is what the current build ships.

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
moving pacing. Under a total-first law you can author a world's breathing rate
freely — a slower phase just means fewer of them.

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

**A three-world system is 28 minutes of floor instead of 124.** Five worlds is 124
— so the old third world's length is now where the *fifth* sits, which is about
where that commitment belongs once there is a prestige loop behind it.

### The other indexed figures

```
excessGate(p)    = 0.12 × 0.7^(p−1)         0.12 · 0.08 · 0.05 · 0.04 · 0.03
mergeMinimum(p)  = min(0.5, 0.15 + 0.10(p−1))
mergeHalving(p)  = mergeMinimum(p)
```

| | **1** | **2** | **3** | **4** | **5** |
|---|---|---|---|---|---|
| **Minimum stay** | **4 min** | **8 min** | **16 min** | **32 min** | **64 min** |
| Phase duration | 30 s | 30 s | 60 s | 60 s | 60 s |
| `agesLived` required | 1 | 2 | 2 | 4 | 8 |
| `excessGate` | 0.12 | 0.08 | 0.05 | 0.04 | 0.03 |
| `mergeMinimum` | 15% | 25% | 35% | 45% | 50% |
| `mergeHalving` | 15% | 25% | 35% | 45% | 50% |
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

**`reaimPhases: 2` is a shrinking cost.** Two phases is a quarter of world 1 and a
twenty-fourth of world 5. That was true before and is now easier to see. **Whether
the re-aim penalty should be a share of the world rather than a fixed count of
phases is open** — the §6 argument for pricing it in phases was that phases are a
clock nothing can buy, and that argument survives either way.

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

**The fix is repricing, not new content.** Three upgrades already *gated* on
`karma_negative` and then *charged* `karma_positive` — the design was already
calling them service to self and only the price had fallen back to the default
pile. Two more are plainly the same register:

| Upgrade | Now costs | Why |
|---|---|---|
| `refinery:slots_1` | 25,000 karma− | already gated on `karma_negative` |
| `harness:riders_1` | 150,000 karma− | " |
| `building:main:carry_1` | 200,000 karma− | " |
| `cohorts:shorter_lives_1` | 310,000 karma− | spending lives faster for throughput |
| `cohorts:hard_season` | 1,200,000 karma− | the same, doubled |

Roughly 1.7M of negative sink against positive's remainder, so Burden's `K` is
worth about what Comfort's is and the reading is a three-way trade again.

> ⚠ **`evenExperienceBonus` stays at 2.0, so Even still pays ×3.** The finding
> that ×3 dominates was measured while `K` was worth zero on one side. It has to
> be re-measured now that it is not, and only then decided.

### Boons

A world may leave you holding a permanent change when you finish it. **A boon is
a reward, so it is not one of the world's conditions** — the conditions are what
a world *demands* before it lets you go; a boon is what it leaves you holding
afterwards.

Shaped like an upgrade's effect, keyed by world so two worlds granting the same
change both land. **Unauthored on all three worlds.**

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
perDelivery = yields[type] × departureRate[type]
duration    = base / min(1 + mergedShare / mergeHalving, maxMergeSpeed)
rate        = perDelivery ÷ duration
```

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

**Karma is phase-averaged, never read off the instant.** The wave swings karma
income ×3 (`biasWith` 1.5 / `biasAgainst` 0.5), so an instantaneous reading would
pay triple for the accident of leaving on a dense phase and make the wave a thing
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

## 16. Progression — the twelve beats

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
for the event — **those four have no floor by design and must not be given one.**

### The ladder

| # | Beat | Fires on | Floor | Starts | Reveals |
|---|---|---|---|---|---|
| 1 | `click` | start | — | incarnation, **wave** | the disc, the log, the experience reading |
| 2 | `karma` | any positive karma | 340 | positive karma | the karma reading |
| 3 | `rail` | 40 experience | 40 | — | the upgrade rail |
| 4 | `first_soul` | 1 soul | 1,100 | cohorts | the cohort table, **the send verb on each row** |
| 5 | `rows` | 5 souls | 4,200 | — | the header, the status row, the Details tab |
| 6 | `wave` | buy `read_the_wave` | 26,900 | — | the wave reading |
| 7 | `negative_karma` | buy `the_other_way` | 74,200 | negative karma, aim | the negative reading, the aim dial |
| 8 | `excess` | \|excess\| ≥ 0.3 | 186,000 | excess | the excess reading, the Refinery tab (inert) |
| 9 | `discovery` | 2 worlds known | 430,000 | — | the Overview tab and its bands, first-harvest gate (inert) |
| 10 | `harvest` | the world's conditions hold | *event* | harvest | the first-harvest verb (live), the harvest screen |
| 11 | `anchor` | 1 world finished | *event* | anchoring, harvest income | the anchor field, the split, the Behind band |
| 12 | `refining` | souls held **and** both karma piles exist | *event* | refining | the Refinery tab (live), the token readings, the refinery screen |
| 13 | `second_harvest` | 2 worlds finished | *event* | — | **nothing** |

Thirteen entries, twelve beats plus the terminal one. **The last beat reveals
nothing** — the log carries it, and everything it could have shown is already
reachable.

⚠ That beat fires on *two worlds finished*, which was the end of a three-world game
and is no longer the end of anything. With a system to finish and a run to end
(§18) it wants re-siting, and its line — like every line in the log — is
placeholder.

**Every beat now fires for its own reason.** None reaches only on its floor.

### The beats and the two new systems

**Clerks do not get a beat.** The send verb arrives with the cohort table at beat
4, and the first clerk is a purchase on the rail like any other — the frame does
not change when you buy one, only the amount of clicking does. What it wants is a
**milestone** (below), and that milestone's line is unwritten like the rest of the
log (§1).

**Prestige has no beat either, and it needs one.** The beat ladder currently ends
at `second_harvest` revealing nothing, on the argument that everything is already
reachable. With a system to finish and a run to end that is no longer true, and
**beat 14 is unwritten.** It is `eventOnly` and it must not be given a floor.

⚠ The floors in the table were fitted to the old cohort economy and every one of
them is now wrong. They are fallbacks, so nothing breaks — but a floor that fires
before its own trigger turns a beat into a timer. **Refit all nine against the
generated ladder.**

### Two beats are purchases

`read_the_wave` and `the_other_way` are **priced triggers with no effect of their
own** — the price is the whole of the choice.

- `read_the_wave`: 9,000 xp to unlock, 750 karma+ to buy. The wave is *a clock
  you read, not a lever* — the upgrade cannot widen anything, it lets you see it.
- `the_other_way`: 30,000 xp to unlock, 4,000 karma+ to buy. **This is the beat
  that lets the negative pile exist**, and it is the single most important thing
  the log has to say. Its current line is a placeholder like the rest (§1).

Both are **priced rather than granted**, because beat 7 asks *how dirty do you
want to run* and **a choice you are handed is not one.**

### Milestones

Four **firsts the log narrates that no beat covers**. A beat changes the frame; a
milestone only says something happened.

| Milestone | Fires on |
|---|---|
| `first_negative_karma` | any negative karma exists |
| `first_reserve` | any soul held back |
| `first_token` | any Crimson exists |
| `deep_excess` | \|excess\| ≥ 0.6 — twice beat 8's threshold |
| `first_clerk` | any cohort running itself |

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

A picture on every row, and **size is the only thing separating the bands** —
Ahead's are the biggest, because **an unreached world is a place you know nothing
else about and the silhouette is the only thing you have to want it by.**

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

`Not yet` stays on this screen even though the tabs above already offer a way
out: **it is the only thing on the screen that says leaving is free.**

### Unsettled: which screen the harvest belongs to

It takes the **Overview's body** today. **Details is the live alternative** —
the world being left is the one Details is about — which is why the flag that
opens it belongs to neither screen.

The argument for the Overview: harvesting is about *where you are and where you
go next*, which is what that screen is for. The argument for Details: the
decision is about *this world and your souls on it*, which is what that screen is
for. Both are real. It has not been decided.

Two things already rejected: **hiding the whole frame** (a screen reached by one
verb and left by one word, with nothing lit above it, is a room with no walls)
and **making it a fourth tab** (it is one world's decision, not a place you live,
and it would sit in a strip beside three screens that are).

### One layout rule worth stating as design

**The rail belongs to the screen under it.** The upgrade rail shows the active
screen's upgrades plus the global ones — because a chip lights its target on the
screen below it, and a chip whose target lives two tabs away could only ever
light nothing.

What the rail stops showing, the header says: each tab carries **a count of what
is buyable behind it right now** — affordable, not merely available, since an
upgrade you have unlocked and cannot pay for is a standing fact and a tab marked
at all times is not a mark.

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
wisdom gained = √(karma moved across the whole run / W)
```

**`karma moved` is a quantity the game already computes.** It is the refinery's
own level experience (§9) — karma actually taken off the piles, summed from what
they gave up. Nothing new needs measuring.

**And it has now been measured once.** A run reaching refinery level 29 moved
`5,000 × (1.35^28 − 1) / 0.35` ≈ **64,000,000** karma. So `W` has a figure to be
authored against for the first time: `W = 10^6` pays about **8 wisdom for a run**,
which is a sane opening; `W = 1` pays 8,000, which is absurd.

**The square root is what makes this fractal rather than merely repeatable.**
Doubling a run's output gives about 1.41× the wisdom, so each turn of the larger
wheel is worth roughly a constant amount of *progress* instead of a constant amount
of currency. It is the same shape as the merge slider one index down: you give up
everything specific and you keep a rate.

**Held, each wisdom is +2% to all cohort yield, permanently.** Spent, it buys
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
Nothing costs `karma_negative` or `red_negative` (§3). **Selling the pile you are
long** is the natural sink, and the rate you get for it should depend on how long
you are — which is the excess reading (§8), already computed, currently doing
nothing but gating a door.

> **That would turn excess from a wall into a price**, which is the largest single
> upgrade available to that mechanic. Excess currently only ever says *no*. As a
> spread it would say *how much*.

**Do not author any of this until the cohort ladder is measured.** A market needs
an income curve to price against and §5's is generated but unplayed.

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

### Framing

**Not another galaxy.** A bigger box is not a higher index, and the game's whole
argument is that the same wheel turns at every scale.

The stronger reading is that **the system was always one turn, and you have been
here before.** That makes prestige an instance of the game's own premise rather
than a layer above it, and the log voice can carry it in one flat line without
explaining anything.

The test the framing has to pass: **a sentence written for a finished world should
still read true one index up, about a finished system.** If it does, the recursion
is in the fiction and not just in the arithmetic. None of the current log lines are
authored well enough to run that test against — see §1.

### Open

- **The overlap between wisdom's structural purchases and knowledge's permanent
  shelf.** Both are permanent, both are bought. The distinction held here is that
  **wisdom buys what exists and knowledge buys facts about your run** — scale
  against texture. It is a real distinction and it is not yet a comfortable one.
- **`W` and `P`, and the +2% per wisdom.** All three unauthored.
- **What the in-run knowledge shelf actually sells**, which is unwritten.
- **Whether prestige is chosen or forced.** A run ends when the system is
  finished; whether you may end one early is undecided.
- **Whether commerce is a system or a framing.** It may be enough that the rates
  worsen, without a market screen ever existing.
## 19. Open design questions

### Unsettled by decision

| Question | Where it bites |
|---|---|
| **Which screen hosts the harvest** | §17 — Overview today, Details is live |
| **Even's experience bonus: ×1.5, ×2, or ×3** | §14 — ×3 is live; the "×3 dominates" reading was taken while `K` was worth zero and must be re-measured |
| **Whether the Burden/Comfort sink asymmetry is right** | §3, §8 — five upgrades now price in `karma_negative`; whether that is the *shape* of the answer or just the stopgap before commerce is still open |
| **Whether commerce is a system or a framing** | §18 — the rates worsening may be enough without a market screen |
| **Wisdom's structure shelf vs knowledge's permanent shelf** | §18 — both permanent, both bought; the distinction is real and uncomfortable |
| **Whether prestige is chosen or forced** | §18 — may you end a run early |
| **A karma-to-red ratio** | §9 — the refinery ran 4.6× ahead of the economy at level 29, so this is now needed rather than merely absent. Held until worlds 4–5 are played |
| **The click** | §4 — 700/click against 150k/s is 0.5% of income. `carry` is linear and capped against income compounding ×5 per index; it needs a different shape (a share of *income*) or an explicit decision to let the hand go vestigial |
| **Continuous vs square-wave phase bias** | §6 — now also the thing that keeps the two ends of the cohort ladder distinct |
| **How many worlds a system has** | §13 — 5 is authored, not derived |
| **Per-cohort aiming** | §6 — parked, and further away now that cohorts have no aim figures. `LeanMeter` is kept in the tree, unwired, against this coming back |
| **`clerk`'s own name** | §5, §20 — the mechanic shipped, the word did not; ledger, mechanical and managerial candidates all tried and set aside |
| **Whether the anchor count should be an upgrade axis** | §12 — deferred as speculative |
| **The worlds' identity, and the cohorts'** | §1 — the largest fiction hole, now with an index to hang on |
| **The entire log** | §1 — placeholder throughout; the register is settled and no line is |
| **Whether `reaimPhases` should be a share of the world** | §6, §13 — two phases is a quarter of world 1 and a twenty-fourth of world 5 |
| **Every world decomposition** | §13 — phase duration, ages and cycles are now free within a fixed total and have had one pass |

### Resolved by the ladder rewrite

| Was | Now |
|---|---|
| **Even's experience bonus: ×1.5, ×2, ×3** | still open — §14 is untouched by the rewrite and ×3 is still live |
| **A sink for Indigo and wisdom** | Indigo buys the deep end of the knowledge market; wisdom is no longer bought at all (§18) |
| **What wisdom *is*** | the prestige residue, `√(karma moved)` (§18) |
| **`zealot`'s ρ = ∞** | gone — every cohort yields experience, so payback is defined everywhere |
| **The cap at 200 a cohort** | gone — income compounds by construction, so counts no longer stall |
| **Six rungs and not ten** | ten rungs; the emission-rate constraint is handled by a 60 ms floor rather than by a shorter ladder |
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
| **Whether a 4 / 8 / 16-minute system is too short** | still unplayed, but there are now five worlds and 124 minutes to sit in |
| **Worlds 4 and 5** | authored. They cost almost nothing once no row was denominated in souls |
| **`riders_2`'s +2,000** | still wrong — ~80% of the purchase buys nobody at current headcount. Same denomination error, but it wants the click decision first |

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

### Placeholder figures — nobody has tuned these

- **Every refinery figure** — batch, interval, both experience-ladder terms,
  per-level yield, and all six upgrades.
- **All four token prices** — Ochre, Indigo, inversion base and growth. Not tuned
  against the refinery's placeholders either.
- **`priceFactor`**, now a single number and the pacing knob on every level in
  the game.
- **The clerk multiplier**, 250× a cohort's base cost, lifted from AdCap and never
  checked against this economy.
- **`W`, `P`, and the +2% per wisdom** — every figure in §18.
- **Every beat floor in §16**, all nine fitted to an economy that no longer
  exists. **Re-fit them after this pass is measured, not during it** — they were
  fitted to the pre-ladder economy and are all wrong in the same direction.
- **Every harvest ratio** — the seconds-of-income figures, never measured. The
  denomination is settled; the numbers are not (§15).
- **All anchoring durations and both bonus figures**, worlds 4 and 5 included and
  those two are guesses.
- **All four world-discovery gates.** They put discovery near the harvest beat and
  nothing more.
- **The whole click ladder**, whose gates were set against the old cohort costs.
- **`shorter_lives_1` and `hard_season`**, now much smaller than a single
  level rung — and now the bulk of the `karma_negative` sink (§14), so they are
  load-bearing for the alignment trade as well as for duration.
- **`shortPileFloor`**, chosen so the cliff's one honest use survives at 95%.
- **Worlds 4 and 5's pictures**, which are existing specimens at a new seed and
  have never been through the widget lab.

### Unplayed — no one has watched these run

- **The opening, beats 1–4**, on the current gates — and now on an **instant
  press**, which removes the throttle every one of those gates was paced behind.
  Beats 1–4 and the second world's unstaffed anchoring both come at the player's
  click rate; §4 marks the hazard.
- **The whole anchoring phase.** Nothing about it has been played.
- **The whole Refinery screen.**
- **Whether the second world at its current length is the right second world.**
- **Whether holding now reads as worth it** — §15 makes departure income an axis,
  and nobody has yet harvested one world twice to feel the difference.
- **Whether the idle count on the split lever reads as a cost or as a bug.**
- **Whether `riders_1` reads as a purchase**, given nothing rides before it.
- **Worlds 3, 4 and 5.** No run has ever finished the third world, which is where
  the rebalance's whole argument gets tested.
- **Whether manual cohorts are a floor of ledgers or a chore**, and how many is
  too many before the first clerk.
- **Whether a life spanning several phases reads as steadiness or as mush**, which
  is the whole of §6's replacement for the cut aim figures.
- **Everything in §18.** No run has ever ended. **Prestige is deliberately not
  built yet** — it needs a finishable, measured run first, and this rebalance is
  what produces one. Beat 14 stays unwritten and must never be given a floor.
- **Whether a 4 / 8 / 16 / 32 / 64-minute system is too short**, which is the
  opposite risk to the one §13 fixed and the only way to find out is to sit in one.

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
