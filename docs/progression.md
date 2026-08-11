# Progression

Rationale and open decisions for `$lib/progression`. The ladder itself lives in
[`beats.ts`](../src/lib/progression/beats.ts) and the vocabulary in
[`keys.ts`](../src/lib/progression/keys.ts) — this file does not restate either,
nor CONTEXT v3.

## Why it is shaped this way

Three approaches were on the table:

| | |
|---|---|
| An explicit script | Reads well, but every beat needs bespoke sequencing code, and a save loaded mid-run has to replay it. |
| Bare thresholds | Trivial, but reveals fire out of order the moment two thresholds cross in an unplanned sequence. |
| **Data-driven monotonic** | **Chosen.** Beats are a list; the pointer only climbs. |

The pointer, `reached`, advances one beat at a time and never falls. A later
beat whose trigger happens to be satisfied early waits its turn, so the frame
accretes in the authored order regardless of how the player got there. Loading a
save is just re-running `evaluate()` — no replay, no bespoke state.

## Three invariants

**Reveals never regress.** `absent` → `inert` → `live` is one-way. `inert` means
drawn but unclickable — a promise, not a disabled control. It is distinct from
*availability*, which is live game state and freely reversible: `nav.detail` is
`live` from beat 4, but the Detail screen is only reachable while a planet is
active.

**Systems run before their panels appear.** `runs` is deliberately decoupled
from `reveals` — nothing is added that wasn't already running invisibly. The
wave ticks from beat 1 so that beat 5 *explains noise the player has already
felt* rather than introducing a new mechanic. `SYSTEM_SURFACES` exists so
`validate()` can enforce this.

**A beat can never stall.** Each beat carries an experience `floor` as a
fallback trigger, so a player who takes an unanticipated route still advances.
The exception is `eventOnly` beats, where no experience figure honestly stands
in for the event — those four have no floor *by design*, and must not be given
one. See the stubs below for why that matters right now.

## Verification

`validate()` runs on mount in DEV and checks the structural rules: duplicate
ids, reveals that regress, panels drawn before their system runs, and beats with
neither a floor nor `eventOnly`. It is a plain function, not a test — run it
standalone or read the console.

Every `RevealKey` has a render site. Panels that are revealed but unbuilt use
`RevealStub`, which reads its own key and dims itself when the state is `inert`
— so a screen accretes beat by beat even while its layout is pending.

`DevPanel` (DEV only) exposes beat −/+/reset, resource grants, and
`window.karma`. Yields are low and the later beats trigger at high figures, so
this is the only practical way to reach them by hand.

## Parked

Design decisions deferred on purpose. None of these are oversights.

- **The refinery** converts karma to red at an equal rate from each pile,
  **keeping polarity**. Yellow is then *bought* by pairing the two reds off, blue
  with yellow, and either red converts to its opposite at a steep scaling price.
  Matching therefore happens above the refinery, not inside it, and excess simply
  carries through into the token layer. Not implemented.
- **Overview and Harvest layouts** are stubbed pending a design pass. The two
  lists on Overview, and where Harvest's verb sits relative to its disc, are
  open questions — don't improvise them.
- **Per-cohort aiming** is far future. Rows read their lean; only the global
  detent steers.

## Producers

Anything that yields on a clock **composes** `ResourceEmitter` (`$lib/emission`)
rather than inheriting a base class. The emitter owns autonomy, `inProgress` and
the `queue`/`action` events; the payout and the duration are both injected.
`Building` holds one; `Planet` gains one on `harvest()`.

Inheritance was rejected because a finished planet wants none of `Building`'s
economy — there is exactly one of each, obtained by harvesting, not bought at a
compounding price — and would have to carry a fake `owned = 1` just to satisfy
the `unitYield * owned` arithmetic. The active planet is not a producer at all:
it is a state machine driven by accumulated experience and emits nothing.

`Planet` stayed **one class** rather than splitting active/harvested, so
identity and wave history survive the transition and still read on Overview.

Still open: `#generateResources` reaches into `PlanetManager.getActive()` to
credit experience. Once planets emit, that closes a loop — Planet →
ResourceManager → Building → PlanetManager. The injected payout makes it
containable; it is not yet contained.

## Aim

Karma is declared unrouted. `BuildingData.yields` is keyed by `YieldType`, which
is `ResourceType` plus the two **family** names (`karma`, `red`) — what data may
*declare*, as against what the ledger *stores*. `karma` is not a `ResourceType`
precisely so that `add('karma', n)` cannot typecheck against a pile that does not
exist. `aim.resolve()` turns a family into two credits at emission.

A cohort answers the global detent through `resistance`: 0 does as it is told, 1
is unaimable and wanders around its own `polarity_bias`. The wander is value
noise (`$lib/aim/noise`) rather than `Math.random`, because a per-emission coin
flip reads as a bug where a slow wander reads as personality. One clock drives
it — `aim.tick()` off the loop — so the row meters and the payout never disagree.

**The re-aim penalty is not a `Modifier`.** Two reasons: it decays continuously
rather than expiring, which the bucket list has no shape for; and it is priced in
*phases*, so it is read off `Planet.progress` rather than a wall clock. That
matters — phases advance on accumulated experience, so a penalty that slowed
experience would extend its own duration. It therefore touches karma only.

## Modifiers

Nothing folds into a producer's numbers. `Building` keeps `#baseProduction` and
the raw `duration`, and derives both through a `ModifierSet` (`$lib/modifiers`).
Removing a modifier therefore lands exactly where it would be had it never
applied — which is what makes expiry possible at all.

Five buckets, each combining order-independently, applied in a fixed order:

```
((base + Σ flat) × (1 + Σ boost) × Π mult) ^ Π pow  +  Σ final
```

`boost` values pool with each other — two `+50%` give ×2, not ×2.25 — while
`mult` compounds. That distinction is the reason for buckets rather than one
ordered list; without it, the result would depend on acquisition order and
removal could not be a plain list operation.

Roughly: `flat` for starter upgrades, `boost` for the workhorse tier (they pool,
so the twentieth doesn't explode), `mult` for milestones, `pow` once or twice in
the whole game. `final` lands after everything and no multiplier touches it — a
fixed ± amount, deliberately outgrown, which is the safe shape for the wave
events under beats 5–7 since its magnitude can't be inflated by stacking
multipliers under a temporary buff.

### Snapshots are gone

`snapshot: true` froze a modifier at what it was worth on purchase, resolving to
a plain `mult` — one entry per affected resource. It only ever meant anything for
`pow`, the sole op whose worth depends on the value it lands on; `boost` and
`mult` are scale-invariant. It reproduced what the old destructive
`unitYield ** 2` did: square once, then ride normal growth.

It was cut for two costs nothing else in the layer carries:

- **It could not be rebuilt from data.** Every other number here is a pure
  function of `owned`, `level` and which upgrades are held — a save can store ids
  and rederive the rest. A frozen factor is a fact about a *moment*, so the
  resolved entries had to be serialised verbatim, and a rebalance would not reach
  figures already banked in old saves.
- **It reintroduced acquisition-order dependence**, the one thing the buckets were
  shaped to remove. `building:main` hit this: `str_4` and `str_3` are both
  affordable at 25 positive karma, and buying them in the other order gave 27
  instead of 81. If a modifier a snapshot was computed against later expired, the
  frozen factor still embedded it.

Worth being clear about what was *not* wrong with it, so it doesn't come back:
a live `pow` has neither problem. `apply()` recomputes from base on every read,
so the buckets stay order-independent and the figure stays a function of data.
The snapshot existed only to keep the square off everything bought *later* — a
balance intent, not a structural one. It is now written as the `mult` it always
resolved to: `building:main/str_4` is `mult 9`, the ×1.5 ×2 ×3 ladder above it
squared; `cohort:basic/str_1` became two targeted mults, since its yields ride different
level curves and never shared one factor.

The cost moved rather than vanished — those constants are hand-tuned, so
rebalancing `str_1`–`str_3` silently invalidates the 9. Cheaper than a save
format that cannot be rederived. `Effect` therefore carries an optional `target`
that overrides the upgrade's `effect_target`, so one array can hit two yields.

Level sits **outside** all five: `yield_multipliers` (per-resource) and `duration_reduction`
scale the base as `(1 ± x)^(level - 1)`, identical to the old repeated fold, but
recomputed rather than accumulated. Level is a pure function of `owned` and never
expires, so it is not a modifier.

Upgrade effects are structured data, not strings — a verb (`unlock`, `acquire`)
or a modifier the manager hands over. This is what retired both `eval()` calls.
`EffectManager` (`git show 64ed764:src/lib/managers/effect-manager.ts`) is **not**
worth recovering: Svelte 4 stores, `eval`, and `addEffect` writes the folded
result straight back.

The emitter no longer holds a duration. It takes a getter, the same way it takes
its payout, because it re-queues itself and must ask for the current figure at an
arbitrary later moment.

## Known gaps

Things that are simply unbuilt, and what they cost today.

- **One context value is still a stub** — `reserve` reads `0`. Beat 11 is gated on
  it and is `eventOnly`, so it carries no floor and **cannot currently fire**.
  Expected: `reserve` is the non-incarnating side of the soul split, and the split
  is `detail.split`, which beat 10 reveals and nothing yet renders.
- **The recurring harvest has structure, no numbers.** `Planet.completeFirstHarvest()`
  flips `harvested`, banks the merged count and the polarity, and builds an emitter
  over `PlanetData.yields` — but no planet in `data/planets.ts` sets `yields`, so a
  harvested planet emits nothing. Deliberate: the payout is balance, and it is the
  one thing §3.9 says to ship flat first.
- **The merged count and polarity are recorded and unread.** `Planet.merged` and
  `Planet.polarity` are set at the first harvest and locked, but nothing consumes
  them. §3.9's tier 1 is a flat bonus, so this is the intended half-step.
- **The `global`, `refinery` and `harness` buckets in `data/upgrades.ts` are
  empty.** They exist now, so planet-wide upgrades have somewhere to live — but
  `wider_wave` and `the_other_way` are named by beats 5 and 6 and by nothing else,
  so both beats still reach only via their floors.
- **Nothing travels.** `PlanetManager.select` is called once, by `App.svelte`, with
  `first`. Discovery now works — see Scopes below — but a discovered planet is
  somewhere you cannot go, so `planetsFinished` cannot pass 1. This is the whole
  of what beat 12 is waiting on.
- **Nothing expires anything yet.** The modifier layer exists (see above) and
  `Building.removeModifier` works, but no system calls it. The re-aim penalty is
  deliberately **not** a modifier — see Aim above.

## Roadmap

The gaps above say what is missing. This says in what order, and how to tell
where you are without reading any of it.

### The gauge

Two numbers, both countable in a minute:

- **Beats, by why they fire.** A beat that reaches on its `floor` is not
  finished — the floor is the anti-stall fallback, not the design. Count how many
  fire for their own reason.
- **Stubs retired.** `RevealKey` has 36 entries; every one not rendered by a real
  component is a `RevealStub`.

| own trigger | floor only | cannot fire |
|---|---|---|
| 1–4, 7, 8, 9, 10 | 5, 6 | 11, 12 |

Stubs: **15 of 36**. Detail 5/8 · Overview 2/6 · Harvest 3/4 · Refinery 0/7.
`reading.excess` is real; `reading.tokens` still renders a literal `—`.

### The course

Ordered by what each step unblocks, not by beat number. Every step is a pickup
point: it lands on its own and moves at least one number in the gauge.

| # | Step | Moves | Blocked by |
|---|---|---|---|
| ~~3~~ | ~~`excess` in `context.ts`~~ | ~~beat 7, half of beat 9~~ | **done** — see Excess below |
| ~~4~~ | ~~A caller for the first harvest~~ | ~~beats 9, 10~~ | **done** |
| ~~2~~ | ~~A path from data to `PlanetManager.unlock`~~ | ~~beat 8~~ | **done** — see Scopes below |
| 1 | Author `wider_wave` and `the_other_way` in the `global` bucket | beats 5, 6 onto real triggers | nothing |
| 8 | Travel | **beat 12** | reveal order — read on |
| 5 | `PlanetData.yields` | merged planets actually pay | balance |
| 6 | The soul split, then the refinery | `reserve`, beat 11, 7 stubs | §3.5 below |
| 7 | Overview, Harvest and Refinery layouts | 12 stubs | design pass — see Parked |

**Step 2 was supposed to be the keystone. It was half of one.** Discovery landed
beat 8 on its own trigger, but beat 12 asks for `planetsFinished >= 2` and a
discovered planet is not a reached one — nothing calls `PlanetManager.select`
after mount.

Step 8 is where it gets interesting, because the ladder as authored is
**circular**. `overview.setOut` is *"depart for the next planet"*, and beat 12
reveals it — but beat 12 fires on two finished planets, which departing is how
you get. So departure cannot live only behind `setOut`, or the last beat is
unreachable by construction.

The reading that resolves it: departure belongs to **`overview.ahead`** (beat 8,
*"unreached planets"* — a list of places to go, so going is what it is for), and
`setOut` at beat 12 is the beat's own line — *two producers, out of phase, and
nowhere to be* — the prompt to leave again once nothing needs you. That keeps
`ahead` a list you act on from beat 8 and gives `setOut` something to mean.

It is only a reading. Both keys are `RevealStub`s inside the parked Overview
layout, so step 8 is really step 7 for one panel — don't improvise it, but note
that beat 12 is blocked on a *layout* question, not a mechanical one.

Step 1 stays cheap and buys the least: it retires no stubs and only corrects
*why* two beats fire. Worth doing when touching that data anyway, not as a sprint.

Step 6 splits in two now that the first harvest exists. `reserve` is the
non-incarnating side of the soul split, not the kept side of the merge split — an
earlier reading of this doc had that wrong. The split is `detail.split`, revealed
at beat 10 and unrendered, so it comes first and beat 11 follows from it.

### The one question left

- **Where matching happens.** CONTEXT v3 §3.5 puts it inside the refinery, matched
  pairs first, emitting Ochre. The refinery entry under Parked above puts it
  above the refinery: karma refines to Crimson keeping polarity, and Ochre is
  *bought*. Both agree on Crimson ↔ Crimson at a scaling price and on Indigo
  bought with Ochre. Step 6 is the first thing that has to pick one; until then
  the two readings cost nothing.

## Excess — provisional, revisit before balancing

> **Open with this next session.** CONTEXT v3 §3.2 defines excess but never says
> what the wall *is*. What follows is a code-side decision taken to unblock beats
> 7 and 9, not something §3.2 sanctions. Either §3.2 gets amended to match, or
> this gets replaced. Do not treat the figures as settled.

§3.2 gives the numerator without argument: excess is the signed difference
between the two held piles, negative is Burden, positive is Comfort. The wall it
is read against is the part with no definition anywhere, and every obvious
candidate breaks something specific:

- **A lifetime total** (`karma ever earned`) only ever grows while the numerator
  is a stock, so excess decays toward zero on its own. The gate becomes free
  late, and the debuff quietly stops existing.
- **The two current piles** (`(P − N) / (P + N)`) invert under the refinery.
  Matched-pair refining takes equal amounts from both, so the numerator holds
  while the denominator shrinks — refining would *raise* your excess, against
  §3.2's "the refinery is the main way excess leaves you".
- **An authored figure per planet** matches the phrasing this doc used to carry,
  but §3.2 is explicit that excess is global and only the *gate* is per-planet.
  It also makes the reading jump on arrival somewhere new while the raw
  difference did not move.

What is in the code instead is **income rate**: the wall is karma per second
across every cohort, times a `WALL_SECONDS` window in `lib/excess.ts`. Excess
then reads as the share of that window you are holding unpaired. It survives all
three tests — it scales with progression so it cannot be outgrown, it does not
decay, and the refinery does not touch the denominator.

The window is set to **600s**, chosen so §4's "beat 7 lands around ten minutes in"
is the literal calibration rather than a coincidence. That is a guess with a
rationale, not a tuned number, and it is the single knob for how hard excess
bites.

Two consequences worth naming before anyone balances against this:

- **Spending karma lowers excess**, because excess is a stock of unspent karma.
  §3.2's "exactly two ways down" is about deliberate tools; this is an incidental
  third. It has not been closed.
- **The wall is zero until something earns karma automatically**, so `getExcess()`
  returns `undefined` rather than `0` — a zero would read as clean enough and
  open beat 9 on nothing.

The per-planet part went where §3.2 does put it: `PlanetData.firstHarvest` carries
the conditions the planet imposes, and `Planet` checks them. Beat 9 asks the
planet whether they hold rather than spelling any figure out itself.

## Scopes

`data/upgrades.ts` buckets are keyed `kind:entity` — `cohort:steady`,
`building:main`, `planet:second` — and `parseScope()` sits in that file, beside
the format it parses. A bare key (`global`, `refinery`, `harness`) names no
entity; verbs are inert there, since there is nothing for them to act on.

The colon is load-bearing: entity ids carry their own underscores (`red_basic`),
so an underscore separator would have made the split positional — "the first one
only" — a rule with nowhere to live but the parser.

Three kinds, because the alternative was worse. Before this, the bucket key *was*
a building id, which is why `unlock` reached only `BuildingManager` and planets
had no route from data at all. Putting discovery in one flat `planets` bucket
would have worked exactly once: a planet-specific upgrade would then sit as a
sibling of every *other* planet's, with authoring adjacency the only thing tying
it to its own — a convention nothing enforces and time erases. Containment does
that job instead.

`cohort` and `building` both route to `BuildingManager` and could have been one
word. They are two because `main` is `role: 'click'`, so a single `cohort:` would
have made one key lie, and `building:` leaves somewhere for a future non-soul
building that is not a cohort either.

`discover` is its own verb rather than a second meaning for `unlock`, so the
bucket can later hold planet-specific upgrades without the verb having to guess
what it is scoped to.

**`costs` decides the shape.** `purchase()` refuses an unpriced upgrade, so one
has no buyer by construction — `acquireUnpriced()` takes it off the loop the
moment `unlocks_at` holds. That is the whole of "some planets are bought, others
arrive": priced discoveries appear as chips in the rail, unpriced ones are
triggers wearing the upgrade shape. The rail filters unpriced entries out for the
same reason — it is where you buy things.

Figures on `planet:second` and `planet:third` are placeholders. They put
discovery near beat 8 and nothing more; nothing is balanced against them.

## Naming

`detail` (the design docs' "close-up") shows the planet's proper noun, so code
and label can never match there. `reading.*` rather than `header.*`, because
those figures predate the header: beat 4 relocates them into the frame instead of
revealing them again. None of this is drift; don't "fix" it.

Retired with CONTEXT v3: *clearing* (→ refining, and the screen is labelled
Refinery in both vocabularies now), *probe* (→ soul), *stage* (→ phase). Token
code names stay `red`/`yellow`/`blue` against the UI's Crimson/Ochre/Indigo.

The wave has its own three words. A **phase** is a half-wave, light or dense; two
make a **cycle**; `cycles_per_age` of those make an **age**. `ages` counts up
without limit — a planet is finished by harvesting, not by running out.
