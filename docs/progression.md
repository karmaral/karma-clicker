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
  shaped to remove. `main_action` hit this: `str_4` and `str_3` are both
  affordable at 25 positive karma, and buying them in the other order gave 27
  instead of 81. If a modifier a snapshot was computed against later expired, the
  frozen factor still embedded it.

Worth being clear about what was *not* wrong with it, so it doesn't come back:
a live `pow` has neither problem. `apply()` recomputes from base on every read,
so the buckets stay order-independent and the figure stays a function of data.
The snapshot existed only to keep the square off everything bought *later* — a
balance intent, not a structural one. It is now written as the `mult` it always
resolved to: `main_action/str_4` is `mult 9`, the ×1.5 ×2 ×3 ladder above it
squared; `basic/str_1` became two targeted mults, since its yields ride different
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

- **Three context values are stubs** — `reserve` and `planetsFinished` read `0`,
  `excess` reads `undefined`. Beats 9–12 are gated on them and are all
  `eventOnly`, so they carry no floor and **cannot currently fire**. Expected.
  Beat 7 reads `excess` too, but it has a floor and reaches on that instead.
  `excess` is not zeroed like the others because beat 9 asks `excess < 0.12`, and
  a zero would read as clean enough and open it the moment an age is lived.
  `planetsFinished` is now the cheap one: `Planet.harvested` exists, so it is a
  filter over `PlanetManager.planets` — but nothing calls `harvest()` yet, so it
  would still read `0`.
- **Harvest has structure, no numbers.** `Planet.harvest()` flips `harvested` and
  builds an emitter over `PlanetData.yields`, but no planet in `data/planets.ts`
  sets `yields`, so a harvested planet emits nothing. Deliberate — the payout is
  balance, and the layout is parked above.
- **No `global` bucket in `data/upgrades.ts`.** That file is keyed by building
  target, so planet-wide upgrades have nowhere to live and beats 5 and 6 reach
  only via their floors.
- **Nothing expires anything yet.** The modifier layer exists (see above) and
  `Building.removeModifier` works, but no system calls it. The re-aim penalty is
  deliberately **not** a modifier — see Aim above.

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
