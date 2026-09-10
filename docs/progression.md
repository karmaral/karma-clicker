# Progression

Rationale and open decisions for `$lib/progression`. The ladder itself lives in
[`beats.ts`](../src/lib/progression/beats.ts) and the vocabulary in
[`keys.ts`](../src/lib/progression/keys.ts) — this file does not restate either.

**The design itself lives in [`design.md`](./design.md)**, which supersedes
CONTEXT v3. This file is *how it got there and how it is built*: the arguments
behind each conclusion, the visual and widget rationale, and what is open in the
implementation. For what the game **is**, read `design.md` first.

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
`live` from beat 5, but the Detail screen is only reachable while a planet is
active.

**Systems run before their panels appear.** `runs` is deliberately decoupled
from `reveals` — nothing is added that wasn't already running invisibly. The
wave ticks from beat 1 so that beat 6 *explains noise the player has already
felt* rather than introducing a new mechanic. `SYSTEM_SURFACES` exists so
`validate()` can enforce this.

**A beat can never stall.** Each beat carries an experience `floor` as a
fallback trigger, so a player who takes an unanticipated route still advances.
The exception is `eventOnly` beats, where no experience figure honestly stands
in for the event — those four have no floor *by design*, and must not be given
one. See the stubs below for why that matters right now.

### The rail opens on what it holds

Beat 3 is `rail`, and it reveals `frame.rail` alone. It used to ship inside beat
5 — then `rows_and_rail` — gated on `totalSouls >= 5`, which was the wrong
quantity twice over. What the rail holds at that point in the run is the *click's*
own ladder, and souls have nothing to do with it; and `building:main`'s first two
chips unlock at 40 and 100 experience, both long before a fifth soul, so they
unlocked into no rail at all and then landed together the moment one was finally
drawn. The bucket's own comment had been warning about that wall without naming
its cause.

So the beat gates on `FIRST_CHIP` — `building:main/str_1`'s own gate, 40, held in
one const beside the beat so the two cannot drift. The rail is never revealed
empty, and it opens holding exactly one chip. `when` and `floor` are the same
figure here, which is not redundancy worth removing: this beat *is* an experience
threshold, and `validate()` requires a floor or an `eventOnly` mark from every
beat that is not the first.

That left beat 5 revealing the header, the status row and `nav.details` — the
"figures fly up into the frame" moment, which is genuinely about there being
enough souls to count. It is now `rows`.

**The rail is rendered from `App.svelte`, not `Frame.svelte`.** It was nested
inside `Frame`, which mounts only behind `frame.header`, so a rail revealed
before the header could not draw however early its own beat fired. `Rail` is a
plain flow element with a bottom rule and no positioning of its own, so lifting
it a level costs nothing. `UpgradeRail` reads `nav.active`, which defaults to
`details` and does not depend on `nav.details` being revealed — the pre-header
opening is a live Detail screen with no tabs over it.

## Verification

`validate()` runs on mount in DEV and checks the structural rules: duplicate
ids, reveals that regress, panels drawn before their system runs, and beats with
neither a floor nor `eventOnly`. It is a plain function, not a test — run it
standalone or read the console.

Every `RevealKey` has a render site. Panels that are revealed but unbuilt use
`RevealStub`, which reads its own key and dims itself when the state is `inert`
— so a screen accretes beat by beat even while its layout is pending.

`strict` is **false** in the inherited `@tsconfig/svelte`, so a switch that misses
a union member returns `undefined` and typechecks clean. Nothing that fans out over
a union can rely on the compiler unless it is made to: use an exhaustive `Record`
for the list and a `const unhandled: never` default for the branches. Both fail
without `strictNullChecks`; the missing return does not. `FIRST_HARVEST_CONDITIONS`
in `labels.ts` is the worked example.

`DevPanel` (DEV only) exposes beat −/+/reset, resource grants, and
`window.karma`. Yields are low and the later beats trigger at high figures, so
this is the only practical way to reach them by hand. Its experience grants go to
the **active planet as well as the pile**, unlike a harvest's — otherwise nothing
by hand walks a world's phases, and `agesLived` is a first-harvest condition.

**The widget work is verified by probe rather than by eye.** `esbuild --bundle
--platform=node --format=cjs` the model modules into the scratchpad and run them
under node — seconds, no browser. `pulse.ts`, `harness.ts`, `anchor.ts`,
`orbit.ts`, `visual.ts` and `field.ts` **never import three.js**, which is what
makes this possible; keeping it that way is worth more than any single check the
probe has caught. It found the halo's growth curve, the swell's mask, and the
rider rate, all before anything was drawn.

What it cannot reach is anything inside a shader, because a shader is a string.
A fragment reading a `uniform` its material never supplied typechecks, builds,
probes clean and draws a solid quad — which is exactly what happened to the
sparks. The one automation worth adding is a regex matching every `uniform`
declared in a shader against the `uniforms` of the material that compiles it.

### Screenshots

`chrome --headless --screenshot` silently produces no file for an `http://` URL
in this environment. Driving Chrome over **CDP** does work:

```
chrome --headless=new --remote-debugging-port=9222 --remote-allow-origins=*
       --no-sandbox --no-proxy-server --enable-unsafe-swiftshader
       --use-gl=angle --use-angle=swiftshader --hide-scrollbars
       --force-device-scale-factor=1 --user-data-dir=<fresh> about:blank
```

then over the websocket from `/json/list`: `Emulation.setDeviceMetricsOverride`,
`Page.navigate`, wait ~9s for the contexts, `Page.captureScreenshot` with a
`clip` from `getBoundingClientRect`. Two gotchas: the workbench scrolls its inner
`.page` div and not the document, so `captureBeyondViewport` is useless and you
must `scrollIntoView` first; and the `PlanetView`s exceed the WebGL context cap,
so the console fills with "Too many active WebGL contexts" and the oldest
canvases go blank.

**Use it for a genuine doubt and not to confirm an edit landed** — *"You get
really wound up trying to corroborate with screenshots. It's not that necessary.
I have the dev server up and I'm watching all the time."*

## Parked

Design decisions deferred on purpose. None of these are oversights.

- ~~**The Harvest layout**~~ — the design pass came and the layout is built. The
  verb stands on the world rather than beside it; see *The harvest screen*.
  Overview is no longer one of these either; see Overview below.
- **Which screen the harvest belongs to.** It takes the Overview's body today.
  Details is the live alternative — the world being left is the one Details is
  about — which is why the flag lives on `nav` and not on either screen.
- **Per-cohort aiming** is far future. Rows read their lean; only the global
  detent steers.
- **A shared renderer.** One canvas drawing many worlds. It is not what the
  Overview needed — see *A still world needs no context* — and it only pays for
  a screen wanting many **live** worlds, which nothing does. Its price, so it is
  not re-derived a third time: `PlanetScene` would have to become
  framing-agnostic (`zoom` and background from props, the camera hoisted to the
  host — it is the only component reading `useThrelte().size` or `scene`), and
  `invalidate()` is **canvas-global** while *seven* components call it, so every
  one would need a slot-scoped invalidate or one soul moving would redraw every
  slot. The shape itself: one `<Canvas>`, each slot a group offset far apart in
  world space, camera moved plus viewport and scissor per slot, then the sub-rect
  blitted to a per-slot 2D canvas — so slots stay ordinary DOM and keep their
  scrolling, clipping and overlaid captions, which a full-viewport scissor
  overlay gives up.

## Producers

Anything that yields on a clock **composes** `ResourceEmitter` (`$lib/emission`)
rather than inheriting a base class. The emitter owns autonomy, `isInProgress` and
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

### A payout with no clock

An autonomous emitter with a duration of 0 does not run fast — it does not run at
all. `queue()` emits **synchronously** when there is no duration to wait out, and
`emit()` re-queues when autonomous, so the two call each other until the stack
goes. It was reachable from one authoring slip: `PlanetData` had `yields` and
`duration` as independent optionals, and `completeFirstHarvest` turns autonomy on.

Fixed at both ends, because either alone leaves something wrong.

**The emitter will not self-requeue on a zero duration.** A clock with no interval
is not a clock. This is the general guard — `Building` composes the same emitter
and is exposed to the same slip — and it is deliberately silent, since an
instant one-shot on a manual `queue()` is a legitimate thing to want.

**`PlanetData.harvest` pairs the payout with its clock**, so the slip cannot be
authored. Without it the guard makes the defect *quieter* rather than absent: a
world would pay once and never again, which is harder to notice than a freeze.
The shape was fixed while no record declared a harvest, which is why it was
cheap; all three declare one now, and none of them can express the slip.

A `duration` of 0 stays legal and means *pays once*. `HarvestRates` and
`sumHarvestRates` both read it that way and show no rate, rather than dividing by
zero.

### The stream

The other end of the same axis. Zero duration is a clock that never comes round;
`balance.emission.streamUnder` is the point where it comes round faster than
anyone can watch — four halvings put `cohort_1` near 60ms, which is a timer
sixteen times a second paying an amount too small to read, driving a bar that
cancels and restarts its animation just as often.

**Past the threshold an emitter pays by the tick and not by the life.** The wait
becomes `streamTick`, and the payout is handed how many lives it covers —
fractional, so the ledger comes to exactly what those lives would have paid one
at a time. `perSecond` does not move, and neither does anything priced off it:
the batch is a change of *cadence*, not of rate, which is the whole reason it is
safe to do behind the player's back.

**Threshold and tick are two figures, and they answer different questions.** The
first draft made them one — the cadence a stream pays on being the one at which
discrete stopped being legible — which is tidy and wrong the moment the threshold
wants to move. It sat at 250ms and cohorts turned into streams while four a
second was still visibly a beat; at the honest threshold of a sixteenth of a
second, one figure would have meant paying sixteen times a second, which is the
cost the batching exists to avoid.

So `streamUnder` is about the **eye** (62.5ms — a cohort spends a good while
merely fast before it becomes a stream) and `streamTick` is about the **machine**
(250ms, the world's own `TICK_MS`; paying more often than the world thinks is
work for nobody). A cohort between the two keeps one timer per life, which is
simply what it always did.

The tick must stay at or above the threshold or a stream would pay less than a
whole life at a time. The emitter floors the batch at 1 rather than trusting the
data — paying less than was earned is the one way this could be wrong that
nobody would ever see — but an authored pair that needs the floor is a mistake.

Two constraints fell out of writing it:

- **Only an autonomous run streams.** One press buys one life however short it
  is; batching a manual send would pay for lives nobody asked for.
- **Every payout must spend the count it is handed.** One that ignores it
  silently loses whatever the batch collected. `Building.#generateResources`
  multiplies its yields by it and `Refinery.#refine` scales its draw — the cap
  is taken *after*, so a batch is still stopped by the shorter pile.

The phase bias needed no change and is the reason the batch is honest at all:
`#livedBias` already averages across the span from `#lifeStartedAt`, so a tick
holding four lives is paid at what those four lives were worth as they passed.

**In the UI it is a status, not a number.** `SweepBar` takes a `streaming` flag
and draws a full track with a soft band running across it — the skeleton-loader
reading — and subscribes to nothing at all, which is where the DOM cost went.
The row's `0.06s` gives way to the word *stream*: a life too short to time is not
a fast time, it is a rate.

The sweep is deliberately **slower than a loading bar**, at 2.4s a pass. A quick
sweep says *hurry up*; the cohort under this one has already arrived and is
simply working, and the bar should say so.

### The wave

The swarm needed the same fact for the opposite reason. A streaming band's
payouts land on the emitter's tick, so striking on them would show the tick and
not the cohort — `SoulSwarm` takes `streaming` alongside `yields` and puts such a
band on `streamWaveOf` instead: a front sweeping round the world, on the same
seconds the bar takes.

The one decision that matters here is that **the wave is asked of a position and
not of a soul**. The band rhythm is a property of the seed — which soul, which
band — and so it holds still while the swarm turns under it; the first version of
this spread each soul's own phase across the cycle, which gives an even scatter
that is *statistically* a wave and never reads as one. A wave is a property of
the world: what decides whether a soul is lit is where it stands when the front
arrives, so two souls that meet are struck together, a soul crossing the front is
struck as it crosses, and every band rides one front however wide its orbit. It
is azimuth in the body's own frame, so the sweep leans and tilts with the world
rather than with the camera.

`boltWave` is its own knob and not `boltEvery`, for two reasons. The band period
doubles per band to show a slow cohort tolling against a quick one, and a band
whose lives have collapsed into a rate has nothing to toll — every streaming band
is the same speed by definition, so one figure carries all of them. And it is
seconds *per pass of the world* rather than per strike, a different quantity by
an order of magnitude: at `boltEvery`'s scale a wave is a strobe.

`boltLife / boltWave` is how much of the ring is lit at once — 8% at the defaults
— which makes those two the width of the band, the way the sweep bar's gradient
is a share of its track. Neither reads alone, and that is the pair to dial if the
front is too thin or too fat.

The swarm lab's `Streaming` slider collapses that many inner bands, since nothing
there earns.

### What a finished world pays

The numbers arrived. A harvested world pays **experience and karma into the
piles**, on a slow clock the merge decision speeds up, and the two fields that
were banked-and-unread now do the work.

**The experience goes to the pile only, and never to the active planet.** That is
the one place this deliberately differs from `Building.#generateResources`, which
credits both. A world behind you buys **progression** — `beat.floor` reads
`ctx.total('experience')` — and does not walk the phases of the world you are
standing on. Those stay yours to earn, which is the whole reason a planet is a
state machine driven by accumulated experience rather than a producer. It also
keeps the loop above open: a finished planet's payout never calls
`PlanetManager`, so Planet → ResourceManager → Building → PlanetManager still
does not close.

**Alignment picks karma's pile, and even trades the karma for experience.**

| locked alignment | pays |
|---|---|
| −1 | `experience: E`, `karma_negative: K` |
| +1 | `experience: E`, `karma_positive: K` |
| 0 | `experience: E × (1 + harvest.evenExperienceBonus)`, **no karma** |

Instead of, not on top of. On top, even would be strictly dominant and the
reading would stop being a choice; as a trade it buys progression and gives up
currency. It is also the first thing that pays excess *management* back rather
than merely gating on it — until now excess was a wall and nothing else, and a
balanced pair of piles at the moment of harvest is now worth something for good.

**Merging buys tempo; holding buys size.** This is the tempo half.

```
duration = base / min(1 + mergedShare / mergeHalving, maxMergeSpeed)
```

Hyperbolic, so it cannot reach 0 — the freeze above is unreachable from here —
and capped, so no merge runs away. `mergedShare` is a share of the army and
`mergeHalving` is authored equal to the world's toll, which is what makes the
toll always buy exactly ×2 and a full merge land near the cap, on every world at
every population. A world that declares neither term takes the module defaults.

*Both terms were absolute counts once — 50/×8, 200/×6, 800/×4 — and the argument
for that was the same one now made for shares: a late world should ask more for
the same step. It still does. See* Denominate everything relatively.

**A world also names a floor.** `firstHarvest.mergeMinimum` is the toll it takes
for letting you leave, and it is **not a first-harvest condition**: as a share of
your army it is always payable, so it can never be the reason a door is shut.
`FirstHarvestCondition` is `keyof PlanetFirstHarvestConditions` and the toll sits
outside that interface, which is what makes leaving it out of a `switch` a
compile error rather than a silent hole.

In the screen it is **the slider's minimum**, not something to fail against: the
handle cannot go below the toll, so a short split is not a state the UI can
express and there is no disabled button explaining one. The slider's position is
`max(chosen, floor)` — held up to the toll rather than clamped down to it, so a
handle dragged high stays where it was put.

Finding that minimum is still a search, not a division. Rounding in
`#takeFromCohorts` is per cohort, so the fraction that predicts a count is not the
one that reaches it; `findMergeFloor` bisects whole percents against
`countMergeable`, which is exact because the count is monotone in the fraction.
`findMergeFloorForShare` only converts the toll to a count first, with a `ceil`.

`PlanetManager` still guards before calling `mergeSouls`, now on the *realised*
share rather than the handle's. Unreachable from the screen, and kept anyway: it
is the check that makes the toll true of the *model* rather than of one control,
and `mergeSouls` is destructive — a guard that ran after it would have already
taken the souls.

The floor is not only a toll: since it is a floor on `mergedShare`, and that is
what buys speed, it also sets the **slowest** the world can ever pay. With the
halving tied to the toll the guarantee is now exact and identical everywhere —
**the floor is ×2** — so no world can be left in a state where it barely delivers.

**Total souls at the first harvest is deliberately not an axis.** The merge is a
share, so the population is already inside it — a bigger army merged at the same
share pays the same toll and buys the same speed. Reading the count separately
would count one quantity twice and give the player two knobs that cannot be
traded against each other.

**Income at departure is the third axis, and it is the one that pays for
holding.** Before it existed, `yields` was a flat authored amount and merged
souls bought speed alone, capped — so past `halving × (cap − 1)`, staying longer
and growing the army bought literally nothing. `yields` is authored in *seconds
of production* now and multiplied by a snapshot read on the way out.

Two things about that snapshot are load-bearing. It is taken **pre-merge**, or
merging destroys the thing it is being paid for. And its karma is
**phase-averaged** — `countKarmaPerSecondAveraged` divides the wave's blend back
out of the live figure rather than recomputing it from `buildings.ts`, so the two
cannot drift, and leaving on a dense phase does not pay ×3 forever.

**`polarity` on a planet is now `alignment`.** The type stays `Polarity` — it is
structurally identical to any alias, so a separate one would catch nothing and
`strict` is off besides. The collision was on the *word*: `planet.polarity`
beside the polarity `karma.ts`, `polarized.ts`, `learning-token.ts` and `aim` all
mean. `Polarity` is the shape, `alignment` is the role.

**The resolution lives in `planets/harvest.ts` rather than in `Planet`**, and only
because runes are not probeable: `base.svelte.ts` cannot be bundled by esbuild
and run under node, and two pure functions can. Same argument as the widget model
modules never importing three.

**A row reads deliveries, not rates.** It shows what one delivery brings and an
`mm:ss` countdown to it; the emitter gained `nextAt` for that, and the Overview
keeps one 1s clock for the whole band. **The total stays `/s` and is the only
rate on the screen** — batch sizes do not add, since every world's duration moves
with its own merged share. The base cadence is 60s, chosen so `/y` is a figure worth
reading and the countdown counts; it sits at the slow end on purpose, since a
cadence is easier to judge downward than a trickle is to discover was never
readable.

The ratios themselves are placeholders; **the denomination is not.** Five worlds
are authored, and their lengths follow one law — `240 s × 2^(p−1)`, so 4 / 8 / 16
/ 32 / 64 minutes of time on the world. See *The wave is a clock* and
*Denominate everything relatively*.

## Souls

The soul split is a **fraction**, not a count: the share of every cohort held
back from incarnating, taken proportionally, never chosen by flavour — the rule
`countMergeable` already follows for merging (§3.3). Reserved souls are still
yours, unlike merged ones. They only stop earning, and that is the whole of what
reserving costs. Rounding is per cohort, so `countReserved()` sums what each
cohort actually holds rather than recomputing from the fraction.

### Two levers, not one

`Reserve` holds an **anchoring** share and a **refining** share. Both are shares
of the whole population, clamped so they sum to at most one; whatever neither
claims incarnates. This replaced a single fraction that both screens drew and a
priority rule underneath it — the harness drained the pool and the refinery
worked the remainder. That made two decisions into one: staffing the harness
silently stopped the refinery, and there was no way to say so.

Neither lever can take from the other, so `set` clamps against what the other
leaves rather than pushing it down. The bar draws that ceiling as dead ground at
the far end, the same treatment `floor` already had — a handle that can be
dragged somewhere it springs back from is a bar arguing with the hand on it.

**Overshoot is the cost.** A share larger than its slots leaves souls idle:
neither working nor incarnating. That is what makes the granularity upgrades
worth buying — a 25% detent cannot land on the slot count, so the coarse lever is
paid for in wasted souls, and each rung down `splitSteps` buys some back. The
asides name `idle` for exactly this reason. The ladder is
`[0.25, 0.15, 0.1, 0.05, 0.025]`; it must stay monotonically finer, since a
`step` upgrade that coarsened the lever would be a downgrade sold as a reward.

**The anchoring share only bites while a world is going down.** Off-phase it
releases and those souls incarnate, so a lever left set between worlds costs
nothing. The gate lives on `Cohort`, which already imports `harness` — putting it
on `Reserve` would close a cycle back through `BuildingManager`.

One consequence worth keeping: progression reads `countHeldBySplit()`, the
*ungated* sum, not `countReserved()`. The `refining` beat asks whether the player
has ever held a soul back, and a gated count falls back to zero the moment the
world it was anchoring finishes — which would un-fire the beat and strand the
refinery.

**`Cohort extends Building`** — the one place inheritance beat composition, which
is worth reconciling with Producers above rather than reading as drift. `Planet`
was refused a `Building` base because it wants none of Building's economy and
would carry a fake `owned = 1` to satisfy arithmetic that does not apply to it. A
cohort wants all of that economy and adds exactly one thing: its count is souls.
That is the test — a subclass that only adds, never one that has to fake what it
inherits.

What is genuinely cohort-only is narrower than it first looks. `aim` and the
karma split stay on `Building`, because `main` is `role: 'click'` and yields
karma too; only holding, reserving and merging souls move down.

`role` is now read **once**, in `BuildingManager.unlock`, to pick the class.
Everything downstream asks `instanceof Cohort`. The predicate it replaced had to
be spelled "is soul" rather than "is not click" so a future non-soul building
would not fall in by default — a rule that lived only in a comment. Class
identity makes it structural.

`Building.activeAt(count)` is the seam: how many of *a* count would be producing.
The base returns all of them, `Cohort` subtracts the reserve, `get active()` is
that function asked about the count you actually have, and both
`#generateResources` and `perSecond` read it — so income and the excess wall can
never disagree about who is working. It takes a count rather than reading one
because pricing a purchase asks what the *next* count would earn, and only the
class knows how much of it works. §*A purchase is priced before you make it*.

### A level is a reading of the count, not a record of it

`#syncLevel` only ever climbed, so a merge left every cohort holding a level its
count no longer earned: basic at 50 still reading level 7, still producing at
level 7's multiplier, and — because `nextUntilThreshold` measures from the level
rather than the count — the **Next** purchase priced exactly the souls you had
just given away, so one click bought the pre-merge number back. `levelProgress`
was not recomputed on the way out either, and went negative on the next buy.

Levels now follow the count in both directions: `#levelFor` counts the crossings
and `#syncLevel` sets level and progress together, from `add`, from `remove`, and
from the constructor so an authored starting count arrives at its own level.
Merged souls take their level with them — the level is a reading of what you
hold, never a record of what you once held. `#calcLevelProgress` lost its `% 100`
with the climb-only loop that needed it.

## Header

The design bundle drew three candidate orders (3a / 3b / 3c) and left the pick
open. **3a ships.** The whole layout rests on one division:

> **Bars are quantities, the meter is state.**

Two lengths under Detail say how big each karma pile is and which is bigger. The
meter in the third cell says how far that difference has carried you and where the
door is. Nothing is drawn twice, and no reading appears before the screen that
acts on it. 3b fused both into a single nested instrument and 3c only reordered
what was already there; both are recorded in the bundle if this needs revisiting.

### Experience is not a tab

The pin 3a pulls: experience is the score and there has never been a screen that
acts on it, so keeping it among the tabs forced Overview to carry a number that is
not about places. It moves into a tinted 214px block at the left with a heavier
seam and no tab rule, ever. Overview then reads what it is a screen about —
places, and the next gate.

**Beat 4 lost its Overview promise as a direct consequence.** With experience
gone the cell has nothing to read until beat 8, and an empty column is a worse
promise than no column, so `nav.overview` now goes straight `absent → live` at
`discovery`. This is the one place the frame does not accrete a cell before its
screen, and it is deliberate. The cost is at beats 7 → 8: Overview arrives
*between* two cells that already exist, so the row inserts rather than appends —
which is why `SCREENS` is now header order (`detail`, `overview`, `refinery`) and
the third cell's `1fr` slot is held open from the first beat.

### Three rules, three states

The tab affordance is the rule at the top of each cell and nothing else: 3px ink
for the screen you are on, a hairline for one you could open, a dash for one with
nothing behind it. Figures stay full black in all three — **an inactive section is
a live reading, not a disabled control.**

The dashed state is new and needed a fact to hang on: `nav.isAvailable('detail')`
now excludes a *harvested* world. A finished planet still reads, but there is
nothing left to do on it, so Detail closes with it, `nav.active` falls back to
Overview on its own, and the section drops to the generic word with `no active
planet` beside it. This is beat 12's picture and it now has a cause rather than a
beat number.

### The bars divide by the larger pile

Not by the excess reading. That one is a share of the two piles together
(§*Excess*), so dividing by it would say the same thing the meter already says
and would not draw how big either pile is — which is what these bars are for. The
larger pile fills its track, the smaller reads as its share of it, and the
hairline where the shorter one ends is matched. Pure comparison, no constant.

### The gate is a doorway, not a tick

The reference drew one gate mark at a signed position. The condition is
`Math.abs(excess) < threshold` — a band around zero — so the meter draws **two
posts**, at ±threshold, and the label reads `Gate ±12%`. One tick would have said
the door was only on the Comfort side. The reference's faint 46% / 54% guides were
the same idea drawn twice and are gone.

The track spans a full wall either way, zero at centre, and the slug runs from
zero out to the reading — so its length is the excess and which way it runs is the
side. **Side**, not pole: `anchor.ts` and the veil mask have owned *pole* since the
harness was drawn, and a `getExcessPoleLabel` beside `veilPole` reads as the same
word about the same sphere. `getExcessSideLabel` gives the bare word the meter
prints, `getExcessSideNote` the `Comfort side` qualifier a section label wants.

### Three hatch scales

`--hatch-*-badge` (3/4) in a 9px badge, `--hatch-*` (4/5) in a short meter,
`--hatch-*-bar` (7/9) in the header's bars and the meter slug, where a finer
stripe fizzes to grey. Same stops throughout, so all three read as one mark.

### Open

- The flexible column is now Refinery rather than Detail, so window slack lands at
  the right edge instead of on the cell that dies. Untested at any width but 1440.
- The data says `cycles_per_age`, the screens say **phase**. The reference said
  cycle. `getWaveLabel` is the one place the word is chosen; a rename is its own
  decision, not a side effect of a layout pass.
- `Label`'s default ink lightened `--ink-400` → `--ink-300` at weight 700 to match
  the reference. Every `Section` and `Cell` label in the game moved with it.

## The cohort table

One rule, and everything else on the table follows from it:

> **The head is the sum of its rows.**

The per-second total used to sit in `RateStatus`, a 48px strip in Detail's *left*
column — one unified karma figure, nowhere near the rows that produce it, and
summing the harvest income of worlds already left on top. That last part is why it
could not simply move: a head that includes harvest is not the sum of anything
under it. The rail now sums the rows' own figures, cohort by cohort, so the two
cannot read different numbers. The harvest-inclusive total still exists, once, in
the frame's Details cell. `RateStatus.svelte` is gone.

**Rates are quiet until you point at a row.** Twelve rows each printing two karma
figures is a wall, and a wall has no answer to *what is this one doing*. At rest
the table shows one rail of totals; a row's own figures appear on hover, which
makes hovering the question and the row the answer. Hidden with `visibility`, so
the column holds its width and nothing reflows. The row tint moved with it — it
used to mean *you can afford this*, which the button already says; it now means
*this is the row you are reading*.

### A purchase is priced before you make it

Hovering the purchase button re-reads every rate at the count the buy would leave,
with the difference in green above each figure — and the rail re-reads with it,
because a head that is the sum of its rows has to move when a row does.

That costs one seam and one callback. The seam is **`Building.activeAt(count)`**,
which generalises `get active()`: the base returns the count, `Cohort` subtracts
the reserve *from the count it was handed*, and `perSecond` / `karmaPerSecond` both
take an optional count that defaults to today's. So the reserve is priced into the
preview for free — ten bought into a third held back adds seven, and the figure
says seven rather than ten. The callback is `onpreview(id)`, pushed from the
button's own mouse handlers; the table holds the id and re-sums that one cohort at
`count + resolveQuantity(...)`. `resolveQuantity` had to leave `CohortRow` for
`purchase.ts` to make that possible — the head prices the same buy the row is
previewing, off one function.

The delta is drawn only when it is positive. A rounding in the reserve can leave a
buy adding nothing, and `+0` is worse than silence. `--status-gain` had been
declared in `app.css` with no consumer since it was written; this is its first.

### The cost head is the switcher

`COST × 1 10 NEXT MAX` on one rail, and the whole cell is a `<button>` that cycles
`1 → 10 → Next → Max`. The four words are a read-out of where the cycle is, not
four targets — a button cannot contain a button, and one hit area with one hover
state beats four with an ambiguous parent. `Tabs` gained `interactive`, which
renders spans instead of buttons and makes the strip pointer-transparent, so the
look stays defined in one component rather than restated in the table.

The cell needs ~184px against the 96px it had. The identity column is the `1fr`,
so it absorbs all of it and Lean slides left — which is what the design wanted
anyway. Both widths are first guesses at real text.

### One canonical rate order

A row drew its rates in `Object.keys(production)` order — the order the yields
happen to be typed in `buildings.ts`. That agreed with the frame's score block by
luck, and luck stops being good enough the moment a head has to match its rows.
`byRateOrder` in `badge.ts` sorts both: experience first, as in the score block,
then karma negative-then-positive, as in Details and the grade table.

## Figures

### A decimal earns its place only under ten

`f` printed two decimals at every magnitude, so a rail read `424.36` beside `0.33`
and all the noise sat on the largest number. The rule now is one sentence: **a
decimal earns its place only under ten, at whatever scale.** Under ten it is the
difference between nothing and something (`basic` is one karma over three seconds,
so a first cohort really does earn `0.33/s`, and rounding that to `0` would erase
the early game). Between ten and a thousand the integer has already said it, and
the tail is a precision you cannot act on. Past a thousand the suffix puts the
number back under ten, so `1.24k` keeps its decimals for the same reason `4.17`
does — there they carry magnitude rather than dust.

It is a default, not a rule: `f(val, floats)` still takes an explicit count. No
call site passes one, which is why changing the default changed every figure in
the game at once, which is what was wanted.

Dropping decimals lets a rounding carry past its own suffix — `999.99k` becomes
`1,000k`, a scale nobody writes. `f` steps the suffix instead and prints `1M`.

### A cost rounds up; a rate rounds to nearest

`formatCost` is `f` with the rounding forced upward at whatever precision `f` will
print. The asymmetry is the point: **a rate that reads low is an estimate, a cost
that reads low is a button that does nothing when you press it.** A cohort priced
at 1,234.6 shown as `1.23k` invites a player holding exactly `1.23k` to press a
dead button and read it as a bug; shown as `1.24k` the only error left is the
harmless one, and the button's own `affordable` state carries the truth either way.

The cost of the ceiling is that it overstates by up to one displayed unit — a real
42,360 reads `43k`. That is the same coarseness the rate rule imposes, pointed in
the direction that cannot mislead. Four call sites use it: `CohortRow`, `TokenRow`
(both the price and the passive alternative), `Chip`, `UpgradeRail`.

## Overview

One axis, three bands, each its own `Section` and its own reveal key: **Active**
(beat 8), **Behind** (beat 10), **Ahead** (beat 8). Active is pinned first — the
world you are on is the one you act on — and the other two follow in axis order.

**Behind is hidden entirely while it is empty**, rather than drawing an empty
line. It reveals at beat 10, when the first world is harvested, but you are still
standing on that world; it has nothing to list until you reach somewhere else.
Active and Ahead always draw, and Ahead carries the empty line.

**Every row carries a picture**, snapshots rather than live views — see *A still
world needs no context*. Size is the only thing that separates the bands:
**Behind 24, Active 24, Ahead 40**, at one shared framing of 2.2. **Ahead is the
band a picture is actually for** — an unreached world is a place you know nothing
else about, and the silhouette is the only thing you have to want. Active already
has its 180px portrait in the detail column and Behind is a list of things you
have left, so neither needs size in the row. All three are provisional and are
one constant each in `OverviewScreen`.

Picking a world in any band feeds the right column, and **the verb travels with
the selection** — Harvest on the world you are on, Reach on one that is ahead,
nothing on one that is behind. The right column names the band its selection sits
in, so the same three words label both halves of the screen. There is no separate verb panel, which is what
retired `overview.setOut`.

**`overview.setOut` and `overview.cameHome` are gone**, and the two that remain
say what they are:

| was | is | draws |
|---|---|---|
| `overview.harvest` | `overview.firstHarvest` | the gated one-off button |
| `overview.cameHome` | `overview.harvest` | the recurring take from everything behind you |

That pairing is the same distinction the code already makes — `completeFirstHarvest`,
`isFirstHarvestReady`, `PlanetData.firstHarvest` against `PlanetData.harvest`. The
string `overview.harvest` now names a different panel than it did before; it is
worth knowing when reading an old diff.

### Reaching

`PlanetManager.reach(id)` is the verb, and **a world must be harvested before it
can be left**. That is the whole gate: a world is left for good, so leaving an
unharvested one would strand it — `finished` would never count it and beat 12
would go back to being unreachable, which is the circularity this was resolving.
It is one predicate, `canReach`, if that turns out to be the wrong call.

`behind` and `ahead` are derived on the manager, not on the screen, and they
partition by `isHarvested` around whatever is selected. The active world stays in
**where you are** after its first harvest — you are still on it until you reach
somewhere else — so it can read `merged` while sitting in the band it started in.

### The harvest is a column of the axis, not a panel beside it

`HarvestLedger` used to sit in the detail column and re-list every world the
Behind band already listed — the same names, twice, in two columns. So **the
rates moved onto the rows**: a Behind row is still, name, then what that world
sends and when the next batch lands, and the band's `Section` header carries the
`/s` total. One list, and the row that names a world is the row that reports it.

The row drops `merged` to make space. The axis is the narrow column, and a
one-line row cannot hold a count, two badged rates and a clock; `merged` survives
in the detail column whenever that world is selected, which is where you go to
ask about a world rather than to scan them.

`PlanetList` grew two snippet props for this — `rowAside` replacing the row's stat
text, `aside` forwarded to `Section` — so a band supplies text *or* a component
and nothing else on the screen learns what a harvest is.

**What is left of `HarvestLedger` is the beat-8 promise.** `overview.harvest` is
revealed live at beat 8, when nothing is behind you and nothing pays, but
`overview.behind` waits for beat 10 — so for two beats there is no band to hang
the rates on. The ledger stands in the detail column across that gap, drawing
nothing but *Nothing is behind you yet*, and disappears the moment the Behind
band can carry the same fact itself. It stays deliberately absent from
`SYSTEM_SURFACES`: it precedes `finishedPlanets` by two beats, which `validate()`
would otherwise flag, and correctly.

Rates are computed from the planet's *resolved* harvest, not from `PlanetData` —
the merge speedup and the alignment routing both move after authoring — so a
world with no `harvest` still reads *nothing yet*, which is honest rather than a
stub. The summing is `sumHarvestRates` in `planets/harvest.ts` rather than in the
component, for the same reason the resolution is: that file takes plain
`{ yields, duration }` and stays probeable. See *What a finished world pays*.

## Planet visuals

A world's picture is authored in the widget lab and pasted into
[`planet-visuals.ts`](../src/data/planet-visuals.ts), keyed by planet id.
**`Planet` never reads it** — a world's numbers and its picture are separate
files on purpose, and nothing couples them. The cost of that is real: no id
mismatch is caught, and three entries in the file are not planets at all.

**Threlte was kept, but not because the look needs 3D.** A stepped fresnel on an
undistorted sphere is a posterised radial gradient and nothing more; the picture
comes from the noise. It was kept because the orbiting swarm and the planned
surface objects are 3D composites, and an SVG planet would strand both.

Four calls sit under everything else:

1. **Orthographic camera.** Perspective foreshortening fights a flat vector read,
   and it makes a constant-weight outline impossible. Ortho collapses the view
   vector to a constant, so the fresnel is `1 − |N.z|` — no lighting rig, and no
   light anywhere in the medium. The `key` term is the same maths as one, and is
   the only term that says which way a slope faces. Both are screen-fixed: at
   `amplitude` 0 each is a pure function of position on the disc, and the planet
   slides underneath them. That is why neither is allowed into the texture.
2. **Threlte sizes an ortho frustum in pixels**, so `zoom` *is* pixels per world
   unit. That is what holds an outline authored in px to its weight from 40px to
   420px. It is the one piece of Threlte-specific knowledge the whole thing rests
   on.
3. **The outline is an inverted hull offset radially, not along the face normal.**
   A radially displaced sphere stays star-shaped about its origin while
   |amplitude| < 1, so radial offset provably cannot self-intersect — which is
   the usual reason hull outlines look bad on lumpy meshes.
4. **Ink only, and enforced.** Bands quantise to an index into a ramp read out of
   the CSS tokens, so no shader can invent a grey the design system does not own.

### The field is normalised, and why that is load-bearing

`field.ts` is the seam: given any direction it returns the height the mesh was
built from, so a marker and the terrain under it cannot disagree. That is why the
noise is a single TS implementation rather than being duplicated into GLSL.

It **measures its own range at construction and remaps to −1…1**. Without that,
`land` was worth whatever the octave settings happened to leave it: fbm divides
by the amplitude *sum*, which is the theoretical range, but Perlin rarely leaves
±0.7 and decorrelated octaves shrink it further. Measured, the field only ever
spanned about ±0.5 — and two of the four authored worlds had terrain worth **less
than a single band step**, so most of their surface could never cross a contour
whatever the seed. Their pictures were coming from `key`, not from land.

`land` now reads directly: 1 is the terrain owning the whole ramp. The four
worlds authored before this were carried across by the affine inverse rather than
re-tuned, so their numbers moved and their pictures did not.

Normalisation is also what lets a new field mode be added at all. `ridge`, `warp`
and `strata` each change the raw range, and normalisation absorbs the change
instead of silently re-scaling every band setting already in the file.

### Terrain as features, not as octaves

Noise can be asked for a *scale* and never for a *count*. Turning `frequency`
down until the blobs are continent-sized gives you however many the seed felt
like, which is why every world authored out of fbm alone reads as weather rather
than as a place. A world that is meant to have **three continents** cannot say so.

[`caps.ts`](../src/widgets/planet/caps.ts) is the other way round. A tier is a
count and a size in radians — three at 0.42, six at 0.20, seven at 0.09 — and the
field is what those round caps contribute where they land. There are three tiers,
coarse, mid and fine, and each carries a signed **lift**, so the same three rows
of sliders make continents at one end and craters at the other. It is a raw field
in exactly the sense `sampleFbm` is: `field.ts` normalises it and nothing else
touches it, so it inherits `clip`, `amplitude`, the bands and the outline free.

Four decisions in it:

1. **Summed, not maxed.** Where two caps overlap the ground stands higher than
   either. Taking the max would union them into one flat plateau; summing makes
   the seam between two landmasses the highest ground on them, which is where a
   range belongs.
2. **Blended into the noise, not added to it.** At 1 there is nothing but smooth
   domes. Adding would pile a second landscape on top of the first; blending
   spends the noise on the *edges* of the caps instead, so the middle of the
   slider is a shaped world with a rough coastline — the thing neither field can
   produce alone.
3. **Read at the warped direction.** `warp` already exists and already slides the
   sample point across the sphere, so it bends the caps for nothing. That is what
   keeps a continent from being a circle, and it means the coastline detail and
   the landmass shape are the same knob.
4. **Scaled by the largest lift, not by its measured range.** A cap standing on
   its own reaches exactly ±1 and the bare sphere between them sits at 0, which
   is what makes the blend honest — both sides on the same scale, so a half is a
   half. Measuring instead would have folded the seed into the scale, and folded
   it badly: the 4096-probe grid is coarse enough to step over a fine cap
   entirely, so a reseed would move the whole world's tone rather than just where
   its craters fell. Overlaps run past ±1 and are left for the outer
   normalisation, the same allowance `ridge` already has.

**`clip` is doing as much work as the caps are.** At 1 it flattens the field's
negative half onto the sphere, so on a cap world the sea *is* the sphere and only
land ever rises — which is the reading the whole system was after and which no
amount of noise tuning gets to.

### The water is drawn, not noised

A blend at 1 leaves the ground between caps at exactly one value, and a constant
has no band boundary in it — so the water goes dead, and `contour` has nothing to
draw. Measured on a two-continent world: **92.6% of the sphere in a single band.**

The obvious repair is to leave some fbm in the water, and it is the wrong one.
Water carrying the land's noise reads as *land that happens to be submerged* —
same grain, same crinkle, same frequency — and weighting it down does not help,
because it is the wrong structure and not the wrong amount. So the water is given
the two things water is actually organised by: **distance from a coast**, and a
**swell**. Both go in as height and both are then quantised and ruled by the
machinery already there, which is what makes them line work rather than mottle.

**`capSkirt` is the coast.** A ring just outside each cap's rim, running against
its lift and back to nothing. It has to be a ring rather than a wider skirt for a
reason that is not a preference: the inner falloff is already zero at the rim, so
anything continuous added outside it has to come back. The reach is fixed at half
the cap's own radius and the slider is the ring's *depth*, since depth is what
decides whether it survives at 80px. Signed, because the ring is the only thing
saying which way the ground leans as it leaves a cap: positive digs a trough
hugging the coast and drawn *below* the open water, and on a crater the same ring
is the raised rim a crater has — one slider, both readings, no special-casing of
the sign. Negative banks it into a shoal, lighter than the sea it sits in. At 0.6
it puts 8.1% of the sphere into its own bands.

**`capSwell` is the open sea**, which the skirt by definition cannot reach.
Warped latitude bands — the same term `strata` uses, so `warp` swirls them and
they read as swell rather than as a ruled grid — added across the water and
masked out over the land. Measured at skirt 0.6: the largest single band falls
from 84.9% of the sphere to 68.6% at a swell of 0.08 and 29.3% at 0.3, which is
the flat sea breaking into ruled tones with contour lines along their edges.

**The mask is coverage, not the cap sum**, and this is the part that is easy to
get wrong. The sum is zero in two unrelated places: far out at sea, and *exactly
on a coast*, where the falloff has come back to nothing. A mask built from it is
therefore wide open at the shoreline — measured, 1.0000 at the coast against
0.4293 for the coverage mask — so the swell would run straight over every beach.
Coverage is monotone from a cap's centre to the outer edge of its skirt, taken as
a max across caps, and cannot do that.

**None of it deforms the sea.** With `clip` at 1 the field's negative half is
flattened onto the sphere, so skirt and swell survive as tone and as line and the
water stays perfectly smooth — texture without geometry, which is the useful half
of asking for normals instead of a heightfield. The other half is not available:
`relief` scales the shading normal from the *field's own slope*, and on a clipped
world the water's slope is zero by construction, so there is nothing there for it
to amplify.

The skirt also **softens the reseed hazard above**. With no skirt the flat ground
sits at an extreme of the measured range and a stray crater pair can flip it
across the midline; the skirt gives the datum a neighbourhood, and it walks in
from band −4 to band 0 of nine as the slider goes 0 → 1.

**Known, and the author's call.** The outer normalisation puts the field's
midline at the centre of its measured range, and on a cap world the ocean sits
very near that midline. A seed where two craters happen to stack drops the
minimum below what the tallest continent reaches, and the ocean crosses from just
under the midline to just over it — the sphere's tone inverts on a reseed. It is
the documented normalisation behaving as specified, not a fault, but it makes
`land` and `bias` unreliable across a reseed. Clamping the cap sum to ±1 would
pin sea level at 0 for every seed, at the cost of decision 1 above.

Every world already in the file carries the tiers at `caps: 0`, so their pictures
are untouched; `capped` is the only entry with the blend turned up, and it is a
specimen rather than a world. **The type→parameter table that would author these
numbers from a planet's type and seed is not built** — that is the half of the
idea that answers the id-mismatch problem, and it is still open.

### The texture and the shade are two layers, not one sum

Everything used to be summed into one coordinate and quantised once, which meant
the picture was part terrain and part screen gradient with no way to tell them
apart. **The band coordinate is now body-fixed alone** — `land` plus `bias`,
where `land` reads a vertex attribute and therefore turns with the surface. `rim`
and `key` are quantised separately and composited afterwards as a shift of whole
slots along the ink ramp, `shadeDepth` deep.

The point is not the tidiness. It is that `shadeDepth: 0` now gives a genuinely
flat texture that belongs to the world, and that contours stop being drawn on a
coordinate half of which does not rotate.

**The contour is the band boundary as a stroked path.** `fwidth` converts the
distance to a boundary into pixels, so a hairline is the weight it claims at any
zoom and any `detail`, and is absent where the field is flat rather than smearing
across it. Its *path* is not resolution-free — it follows a per-vertex
interpolant and kinks at triangle scale. It carries two inks, chosen by which
side of the terminator the line falls on rather than by the tone beneath it. That
switch is computed whatever `shadeDepth` is, so on a flat texture the contour's
ink can be the only thing on the planet saying where the light is.

The cost was paid in the authored file: all six entries were tuned under the
summed model and are stale.

### Shading terrain the surface does not have

The medium is authored as a disc, which means `amplitude` near 0 — and at 0 the
baked normal is the sphere's own, so the shade has no terrain in it and its bands
come out as plane cuts of a sphere. **`relief` is the terrain's worth to the
shading normal alone**, added to `amplitude` when normals are baked. A bump map,
per vertex, from the same analytic field slope. It is what lets a flat disc be lit
by its own landscape.

`amplitude` is signed, and `clip` flattens the field's negative half onto the
sphere so the displacement only ever works one way — a negative amplitude cuts
pits into a smooth ball instead of also bulging where the field runs low. Both
live in `field.ts` rather than in the mesh builder, and the normal is
differenced from the *displacement* rather than the raw height, so a clipped
world's flat half shades flat. The texture is not clipped: it keeps the whole
field, so the same map can be cut or raised without the pattern changing.

### What the sizes taught

**Legibility at 40px comes from feature size, not from `detail`.** A coarse field
with few octaves survives the reduction; a fine one turns to mottle regardless of
how finely it is polygonised. `detail` is a quality knob and nothing more — since
the contour arrived it no longer even sets a band edge's width, only how smoothly
its path is polygonised.
`ridge` is the sharp case: it creases *every* octave, so fine octaves stop being
texture and become their own crevasse network. It wants a coarse field and takes
its detail from the crease, which is the opposite of how the smooth worlds tune.

### Souls in orbit

The swarm was rebuilt in the planet's own medium — same orthographic camera, same
ink ramp, inside the body's tilt group. Four things in it are decisions rather
than mechanics.

**A cohort is a band of orbits, not a ring.** Each soul runs its own trajectory,
drawn from its band's by three scatters: two thicken the band, one opens its
plane out into a shell. Beads on a shared wire read as a diagram; a clump of
paths reads as a population. All scatters at zero collapses a cohort back to the
wire, which is the failure mode to recognise on sight.

**A band comes from its index alone**, so cohort 3 looks like cohort 3 on every
world and nothing is authored per planet. Inclination alternates, and *direction
alternates with it*. That pairing is the point: counter-rotation is only jarring
between bands sharing a plane, so separating the planes is what turns opposed
directions into two orbits instead of a mistake against the body's spin.

**The outline is authored in pixels and the souls in body radii**, and the
difference is structure against content. The outline is the drawn edge of the
widget and must hold its weight at any size. Souls are content: a px-authored dot
at 40px is nearly as wide as the world it circles, and the swarm reads as noise.
Sizing them in radii is also the only thing that makes a push-in work, since zoom
then carries them. One px number survives — the floor a dot never falls below, so
a small widget has dots rather than dust.

**Ink is chosen by where a soul is, per fragment.** Two inks, off the body and in
front of it; behind it, nothing. A pale third ink for the far half was built and
cut — motion already says the path closes, and a dot that is neither in front nor
gone only asks to be read as a nearer dot. Per fragment rather than per dot
because a dot on the silhouette should be cut in half, not switch colour when its
centre crosses; at 4px the switch reads as a bug. The far half is discarded
analytically rather than depth-tested, so the hide radius and the ink-switch
radius are the same number instead of the depth buffer cutting along terrain
while the ink cuts along the sphere.

Place cannot know what is *under* a dot, and the body owns the whole ramp — so
every dot also carries a ring in the ramp's far end, which is the argument the
planet's outline already makes. Its ink is derived from the fill rather than
authored, because a fourth authored tone would need setting once per place a soul
can be and would still be wrong for one of them. The one exception is the core,
where the fill and the ring are both fixed with the rest of the reading — there
what is under the dot *is* known, and the pair is the mark.

`SOUL_CAPACITY` is the instance allocation and nothing else, so it is set to what
the lab's own sliders can ask for rather than to a guess at a good number: eight
bands of a hundred, 800. It was 256, which the lab could exceed by dragging two
sliders a third of the way — and a slider that stops meaning anything partway
along is worse than a slider that is not there. Only `souls.length` is drawn per
frame, so the ceiling costs one allocation and no work.

### Anchors on the surface

The harness poles, and the first thing that is *on* the planet rather than
around it. Five decisions.

**Placement is the count.** Anchors stand where n points on a sphere go when
they push each other as far apart as they can — the optimal spherical codes,
every one of which is a named symmetric figure at these counts: antipodal,
triangle, tetrahedron, triangular bipyramid, octahedron, pentagonal bipyramid,
square antiprism. So the count alone fixes the picture and nothing is authored
per world, which is the argument `bandAt` already makes for the swarm. The design
handoff specified an equator ring; that is superseded, because eight anchors on
one great circle put all twenty-eight future loops in the same family of planes,
and the point of the 3D rebuild was that a loop can now genuinely go behind.
Two and three come out as a ring either way, which is the case the 2D drawing
was tuned against, so nothing that was judged is lost.

**A chamfered pyramid is three rings.** A sharp pyramid's profile has exactly two
corners — the base rim and the apex — and one `chamfer` cuts back both. At 0 it
is a plain n-gonal pyramid, at 0.5 the cuts meet and it is two frusta base to
base, and in between the silhouette is the cut-cornered polygon the 2D mark
draws. One knob, and the 3-sided cone the handoff specifies is one setting of it.

**Anchors stand on the terrain, not on the sphere.** The base reads
`field.sampleRadius`, so a pole and the ground under it cannot disagree — the
reason the field is one implementation and never duplicated. The reference parks
them at a flat 0.99 of the node, which on an engraved world would float a pole
over its own pit.

**One magnitude, and it is where scale will arrive.** Base radius and height are
the authored proportion and are not on the panel; a single `size` multiplies
both, and `sink` with them, so a bigger anchor is the same anchor. This is the
hook for the parked world-scale parameter: anchors sized against the body cannot
say how big the body is, and anchors sized against the screen can — small poles
read as a large world.

**The two states are a fill and its absence.** Placed is the solid with its
edges; unplaced is the same edges, dashed, hollow, and **never occluded** — an
anchor's *place* does not stop existing when the world turns away from it, so
hiding the far ones would be hiding the information the ghost exists to carry.
It says it is far by inverting less instead. That front/back reading is taken
from the anchor's origin and not per fragment, which is the opposite of the
souls' rule and for a reason: a dot straddling the silhouette should be cut in
half, but an anchor is a place, and a place is on one side or the other.

**The ghost carries no ink**, and this is the second mark to give one up. It used
to hold two authored tones chosen by *place* — paper over the body, ink over the
canvas — which was already the right shape of answer and still the wrong kind of
one: paper over the body is `--surface`, and on a world whose surface is
`--surface` the ghost was drawn in the colour of the thing it was drawn on.
Session 13 found it that way, on the white worlds. No pair of tones survives
every planet a type table can produce, because the pair is a guess about the body
and the body is authored somewhere else.

So it takes the halo's blend: it writes a factor, the framebuffer supplies the
colour, and a dash comes out as whatever it crossed, reversed. `ghostTone` and
`ghostOutTone` are gone the way `haloTone` went, and `ghostFade` — which stepped
toward mid-ramp, an idea that needs a ramp — becomes `ghostBack`, the share of
the inversion the far half keeps, on `sparkBack`'s argument and in its units.

**What an inversion cannot do is contrast with mid-grey.** `src·(1−dst) +
dst·(1−src)` is 0.5 at dst 0.5 whatever `src` says, so a ghost over `--ink-400`
is the fixed point of its own rule and disappears there exactly as surely as it
used to disappear on white. This is a real trade and not a strictly better
answer: it exchanges a failure at one end of the ramp for a failure in the
middle, and it buys that the failure is now *narrow* and *the same on every
world* rather than depending on which planet is on screen. If it shows on a real
world, the answer is a cased line — the dash drawn twice, wide in one ink and
narrow in the other, which is what the spark's outline does — and not a return to
authored tones.

### The harness lines

The lines the anchors exist to carry. The construction is the design handoff's
§2 and is not reinterpreted: every *pair* carries a family, each loop a true
slerp from one anchor to the other, bulged outward by a sine and turned about
the chord between them. The twist is not decoration — a planar loop collapses to
a hard straight needle every time it turns edge-on to an orthographic camera,
and alternating its sign per level is what makes a family weave instead of
stack. Five decisions sit on top of that.

**A line is strung between anchors that exist.** The harness is built from the
*placed* nodes only, not from every node the count names. So it grows as anchors
are driven in — one anchor, then a pair's band, then a cage — and the ghost keeps
marking a place that carries nothing yet. This is what makes the count legible:
at any moment the drawing says how far the world has been taken, and it says it
in lines rather than in a figure.

**Every anchor is a crown, and the same slider opens it into a cage.** The
two-anchor minimum is dropped, because the first anchor placed *is* one anchor
and the harness has to draw something. A crown is a family that closes on its own
anchor: each loop is the circle on the sphere that passes through the anchor,
centred `reach` away from it, so the curve leaves the anchor and comes back to it
and the only corner in it is the grip. At small `reach` that is a tuft; at π/2 the
circle is a great circle through the anchor and its antipode, which is the full
onion cage. One parameter covers the whole range, so the visual for a crown is a
slider to be judged and not a choice between two constructions to be argued
about. It was first built as the lone anchor's substitute for the pair it has not
got; on sight it turned out to be the best thing the harness draws, so every
anchor carries one and the pair lines connect crowns. One anchor is now the
general case seen alone rather than a special case that happens to look better.

**A line is tied to the top of its pole.** The lines first converged on the
*surface* — on the ground at the anchor's foot — which drew a pole standing beside
a harness rather than a pole holding one up. Each placement now carries a `peak`,
its solid's tip in body radii, and that is the radius a loop leaves from and
returns to. Two consequences were chosen rather than fallen into. It is taken per
anchor, from the same `field.sampleRadius` the solid was placed with, so a pole on
high ground is tied higher and the line cannot float off a tip the terrain moved.
And only the *ends* lift: a loop's radius is a sine blend from the grip at the
ends to `1 + bulge` at the middle, so the peak stays exactly where it was authored
instead of the whole cage scaling outward with the anchor and leaving the frame.
The blend degenerates to the old `1 + bulge·sin πt` when the grip is 1, which is
what a node with no `peak` still gets — the probe and anything holding bare
figure nodes are unchanged.

**The budget is spent per family, not per loop.** Pairs go as n², so eight anchors
carry twenty-eight of them; a fixed count per family would make the last anchor
six times as expensive as the first. Rotations are cut to the share of a fixed
total each family is owed — a crown counts as one, an edge as one — so `density`
stops buying loops well before its slider ends and the harness thickens with the
count without the count squaring the cost. The lab prints the number actually
drawn beside the number strung, because the slider's own value stops meaning
anything past that point.

**The ink rule is the ghost's rule, finished.** Two inks by *place* — paper over
the body, ink off it — chosen per fragment, because one loop crosses the
silhouette twice and has to invert where it does. Both ways of saying *far* are
then the same gesture spent twice: a step toward the middle of the ramp, which is
away from whichever end the ink was chosen to contrast with. Behind the body's
centre plane is one step; being an outer loop is the other, and that second one
is what sinks a family into what it sits on instead of letting every loop claim
the same weight. It is stepped and never mixed — a blend between two ramp slots
is a gradient, and the system does not own one. The design handoff's table gives
four hex values with asymmetric fades (paper → #7a7a7a over the body, ink →
#bcbcbc off it); ours is symmetric, which is one slider fewer and the rule the
unplaced anchor already draws by.

`backHide` is the other end of that rule and not a fifth ink: at 1 the stretch of
every line running behind the body is discarded outright, which is what the fade
can only approach. It is cut per fragment at the same silhouette the ink switches
at, and by the same test the souls already hide their far half by — so a rider and
the line under it go together, instead of a dot vanishing off a line that stayed.
It reaches the panel as an integer slider with two stops, because the lab draws
every field the same way and a checkbox for one of them would be a second kind of
control to maintain.

### Souls ride the lines, or they do not

The design handoff has souls travelling *on* the harness. The swarm built two
sessions earlier has them on their own scattered orbits. Both are defensible and
the choice is visual, so it became a parameter: `harness`, 0 to 1. It was first
authored as *how much of a soul's path the lines own*, and that reading did not
survive being looked at — see below. What the parameter is really asking is how
much of the **swarm** the lines own.

It was built as a blend and not a switch, and the thing that made a blend look
possible is that both curves are read at the **same phase**. A soul's angle round
its own orbit, taken as a fraction of a turn, indexes its loop as well — so at
0.5 a soul should have been halfway between the two places it could be, rather
than two things moving at different rates averaged into a wobble.

**Judged, and wrong.** Seen running, the middle of that slider does not read as
souls settling onto the lines; it reads as the swarm being reshuffled, with dots
cutting straight through the body on the way. The phase argument was sound and
the interpolation was not: the two places a soul could be are two points on a
sphere, and a straight lerp between them is a *chord*, which passes through the
interior whenever they are far apart. Only 0 and 1 are worth looking at, which is
the tell that the parameter is not continuous in the first place.

**So the quantity is a count, not a weight**, and `harness` became `riders`. How
much of the swarm rides is *how many souls do* — which is also what the mechanic
will be, since riders are bought by anchor upgrades and an upgrade grants a whole
soul rather than a fraction of everyone's path. The slider stays a share because
that is the honest way to author it against a swarm whose size changes, but it
resolves to a count and the lab prints the count, the way the harness panel
prints loops drawn beside anchors strung: a share that buys no additional soul is
a share that did nothing.

Assignment is stable as it climbs. Each soul is dealt a `place` at creation — a
shuffle of the whole swarm, drawn from the same seed the orbits come from — and
rides while its place is under the count, so raising the share puts one more soul
on a line instead of dealing the swarm again. Shuffled and not taken in index
order, which would fill the innermost cohort before the next one had a rider.
Which *line* a rider takes is fixed by its own index and not by how many ride, so
buying a rider adds a dot to the harness and moves none of the others.

Souls are spread across the whole harness rather than taking loops in order:
at eight anchors there are more loops than souls, and modulo would crowd every
soul onto the first few pairs.

The swarm sits outside the world's spin and the harness inside it, since a line
ends at an anchor and an anchor turns with the ground. So the spin stopped being
the body's and became the scene's: one angle, integrated once, handed to the body
to turn by and to the swarm to put a loop back where the world has since carried
it. A body that kept its own angle and a swarm that kept another would be two
clocks for one rotation.

**What a soul does at the end of a line is unjudged.** A pair loop runs from one
anchor to the other, so a soul reaching the far end reappears at the near one.
Read generously that is the harness's traffic — souls sinking into one pole and
rising at another — and with several dots per line at different phases it should
read as a flow. Read badly it is a pop. The crown does not have the problem at
all, since its loops close on their own anchor. The alternative is a ping-pong,
which is one line and costs the direction.

### The crowded harness wants a figure, not a graph

Also judged on sight: **the crown a lone anchor carries is the best thing the
harness draws**, and the many-anchor case is the worst. One anchor gives a
flower; eight give chaos. The original reading was an electromagnetic sheet — a
field wrapped round a body — but what the drawing actually earns its keep with is
geometry, and geometry is precisely what is lost as the count climbs.

The cause is not density, and turning density down will not buy harmony back.
It is that **every pair is drawn**. Anchors are placed on an optimal spherical
code, which is a *figure* — a triangle, a bipyramid, a cube — and drawing all
n² pairs draws that figure's complete graph rather than the figure. At three
anchors the two are the same thing, which is why the low counts read well and
the high ones do not. Drawing only the pairs that are **edges** of the figure —
the near neighbours, the convex hull — leaves the harness saying the shape the
anchors are actually in. Long diagonals are what cross everything else.

**`span` is how that is decided, and it is a ratio rather than an angle.** Each
pair is measured against the *closest* pair in the same figure, so the test is
the figure's own scale and nothing has to be authored per count. At 1 only the
shortest links are strung; at about 1.4 the links are the figures' own edges; and
2.6 clears the longest pair in every figure, so the top of the slider is the
complete graph back again and the two readings can be compared by dragging. The
default is 1.4. What that buys, one to eight anchors: 0, 1, 3, 6, 9, 12, 15, 16
links — against 0, 1, 3, 6, 10, 15, 21, 28 pairs. Counts one to four are
untouched, because at those every pair already is an edge.

At `span` 1 — where `DEFAULT_HARNESS` actually sits — the counts are 0, 1, 3, 6,
6, 12, 5, 16, and **seven anchors draw fewer lines than six**. That is `span`
doing what it says and not a fault: the pentagonal bipyramid's closest pair is
one of the ring's, and both poles' links are longer than it, so almost everything
fails a test measured against that pair. Dragging to 1.6 gives 20 at eight and
2.6 gives all 28. Worth knowing before someone reads the dip as a bug.

The other half of it is the flower, and it is built: **every anchor carries a
crown** and the links are what *connect* crowns rather than what the harness
mostly is. That gives the two constructions one voice instead of making one
anchor a special case that happens to look better than the general one, and it
takes the seam with it for the loops that carried it worst — a crown closes on
its own anchor, so a rider on one never jumps. Whether families should
additionally share a frame, so their rotations land in register instead of at
unrelated angles, is a smaller question underneath the same one and is not built.

The loop budget absorbs both changes: a crown is a family and an edge is a
family, and the same total is divided among them. At eight anchors that is 24
families against 28 pairs before, and 160 loops against 168.

### Every harness parameter is an upgrade axis

The reason to keep all of this as parameters rather than resolving it to one good
default: **the harness is a thing the player improves.** Anchors are already
bought one at a time, and everything the lines are made of is a plausible thing
to buy next — more loops, deeper bulge, a wider reach, more souls riding. So a
harness slider is not only an authoring knob to be frozen once it looks right;
it is the shape of an upgrade, and the value in `DEFAULT_HARNESS` is the
*starting* value of one. That is an argument for keeping the ranges wide enough
that the far end still reads as an achievement, and against collapsing two
parameters into one because a single default happened to fit both.

`twist` is the first range judged short on those grounds: it stopped at 0.8 rad
and now runs to 2π, a full turn along a loop's own length. The *range* is the
decision recorded here; where `DEFAULT_HARNESS` sits inside it is authored on the
lab's sliders and has moved since. `span` arrives the same way — the choice
between the figure's edges and its complete graph could have been a constant, and
is a slider because "the harness reaches further" is a plausible thing to buy.

Two things deliberately did **not** become axes. An anchor's `peak` is derived
from the solid it belongs to, because a line tied anywhere but the tip is a
mistake rather than a setting — and the anchor's own `size` is already the axis
that moves it, so a second slider could only disagree with the first. `backHide`
is a legibility switch: it says what the drawing shows, not how good the harness
is, and nothing about the player's progress should turn it on.

### One light, and worlds only choose how much

The key's *aim* is a system token now, sitting beside the ink ramp rather than
inside `PlanetVisual`, and read the same ambient way. There is one fake light;
worlds differing on where it comes from was never saying anything — every world
that had actually been aimed sat in the same quadrant, and the ones that
differed differed only by never having been touched. The anchors made it a real
problem, since a pole lit from somewhere other than the ground it stands on
reads as a paste-up. What stays per world is `key`, the weight: how much of the
light a world takes is a property of the world.

**Faceting is gone.** The shade is unconditionally the field's own surface
normal. A low-poly reading was one slider away for several sessions and was never
wanted; keeping it cost a varying, a per-fragment cross product and a false
promise in `detail`'s doc comment, which claimed coarse meshes had a use.

### The click leaves marks

The first thing in the widget that answers the *player* rather than an author's
slider. One click is one **flash**, and a flash leaves two kinds of mark.

**The halo is about the world, not on it.** A ring around the whole body, facing
the camera, born just outside the silhouette and growing past the frame. It hangs
outside `PlanetBody` altogether, so neither the tilt nor the spin reaches it —
a halo that turned with the world would be a band drawn on the world. Being born
*outside* radius 1 is the same argument: a ring that starts on the body reads as
something painted there and then wiped, not as something leaving.

Its stroke is authored in **pixels**, which is the outline's argument reused. A
halo is a drawn edge — structure, not content — so it must hold its weight at
every widget size, and it must not thin as it expands. `fwidth` gives that for
nothing: the same derivative measure `contourAt` draws a band boundary with makes
a px stroke px-wide at any radius, so the instance's scale is the only thing that
grows.

**And it is always behind the world.** The fragment's own distance from the
centre in body radii is `q · vRadius`, and anything under 1 is discarded — the
same unit-sphere silhouette the harness and the souls are cut at. This costs
nothing while `haloFrom` is above 1, and is what makes dragging it below 1 a real
setting rather than a ring drawn across the planet's face.

**The quad has to be bigger than the ring it holds.** The ring lands on the
quad's *inscribed* circle, so a stroke centred there has its outer half cut off
at the four cardinal points — a halo with four flat spots, which is exactly what
was reported after the first sitting. Every ring quad is now built `haloSpreadOf`
times wider than the furthest thing on it and the shader divides that back out,
so `q` is still 1.0 on the ring. At a 420px view the overhang measured 1.5px at
every radius — small, and the four places it happened were the four places the
eye checks a circle.

**The echo is the only thing here that is not a circle.** A second ring at a
multiple of the first's radius, its radius pushed by three sines whose
frequencies do not divide — so it never closes into a rosette however many lobes
it is given. It is the *subtler* of the two by inverting only as deep as
`echoDepth` asks, which is a fraction the main ring does not have. Warp is
authored as a share of the ring's own radius rather than in body radii, so the
wobble grows with the mark instead of flattening out as it leaves.

**And no two echoes are the same echo.** One authored shape drawn twice in a row
is a stamp, not a strike, so every flash turns the warp by a random angle and
draws its own lobe count off `echoScatter`. The scatter is on the *count* and not
on the warp, and that is the whole of why it is free: the quad is sized off
`echoWarp`, so a scattered warp would have to reserve room for its own widest
possible draw and every ring would pay for the one that never happened. A
scattered count changes the rhythm inside a quad that was already the right size.

The mark stores the *draw* — a signed unit — rather than the count it produced,
so `echoScatter` moved while a flash is still in the air reaches that flash too.
That is the same reason the radius sampled at a spark is frozen and everything
else about it is not: a slider is a thing being designed, and a mark in flight is
the only place you can see what you just changed.

**A lobe count has to be a whole number, and for a while this one was not.** The
warp is a function of `atan`, which runs −π to π and jumps at the far side of the
ring; the pattern was sampled at whatever fractional count the slider and the
scatter produced, so it met its own start mid-stride there. Measured across the
whole slider, the step at the seam reached **1.91** against a warp normalised to
about ±1 — very nearly the full range, a notch in the echo that stayed where it
was while the flash turned under it. Session 13 found it as *the polar seam*, and
it was not a bug in the noise. It was the slider saying something true: 5.4 lobes
cannot go round a closed ring.

So the warp is built at whole counts only — **all three harmonics**, not just the
first, since any one of them landing off a whole count reopens the seam by
itself — and a fractional count is the **value blend of the two whole ones on
either side**. A mix of two patterns that close is a pattern that closes, so the
slider and the scatter stay continuous while every shape they land on is exactly
periodic. The measured step is now 2.8e-14, which is float noise. Rounding does
not cost the rosette argument either: 5 lobes carries 9 and 15, which share no
factor.

What it does cost is a little amplitude at half-steps, where the blend is 50/50
between two decorrelated patterns. Probed: the peak warp holds at 0.93–0.99 for
whole counts and for half-steps at five lobes and up, and dips to **0.71** at 1.5
lobes, where there are only two patterns and they have nowhere to agree. The
authored `echoWarp` was tuned with the seam in it and at `echoBands` 1 with full
scatter, which is exactly the range that softens — if the echo now reads flatter
than it did, that is where it went, and the number to move is `echoWarp`.

**A spark is on the ground it hit.** A dot with a ring leaving its own edge,
placed at a random direction and sitting at `field.sampleRadius` — on the terrain,
not on the sphere the terrain was displaced from — and inside the spin, so it
travels with the surface. The direction is `Math.random` and not the seeded stream
the swarm and the caps draw from, because a flash is an *event*: two clicks landing
in the same place is the failure here, not the unreproducibility. The radius is
sampled once, at the flash, so a flash never outlives a slider.

**And it lies in the ground rather than facing the camera.** Billboarded, a spark
at the limb was a full circle floating beside the world; turned into the terrain's
own tangent plane it foreshortens into the surface, and the ring becomes the thing
that says which way the ground faces. One quaternion from +Y to the sampled
direction does it, which is the turn `Anchors` already makes for the same reason.

**The flare is what stops the mark from being a sticker.** Two quads crossed about
the surface normal, each widened at the base, so the pair reads as a small cone
struck off the ground. The taper is applied in the vertex shader rather than
baked, so a slider moves it without rebuilding anything.

A cross of two quads has one bad angle — seen straight down its own axis it is two
edges and nothing else. That angle is *exactly* where the dot and ring lying in the
terrain are seen full-on, and the terrain quad's own bad angle, at the limb, is
where the cross opens up. The two marks cover each other, and neither needed a
third quad to do it.

**A flare that holds one shape is a decal.** It has two heights and two tapers —
`From` and `To`, the halo's own vocabulary — and travels between them on `growOf`,
the same curve the ring leaves the dot by. The height is a scale and is written
into the instance matrix; the taper is a *shape* and stays in the vertex shader,
reading the `grow` attribute the ring already writes rather than a second one
timed slightly differently. Wide-to-narrow is a flame collapsing into a spike;
narrow-to-wide is one opening out. Both rises at 0 is the flare off and the old
mark back.

**The flare is on the near half only, and it is the only part of a mark that
is.** Watched, the far-side flares were the thing that read wrong: a dot and a
ring lying in the ground on the back of the world foreshorten, so they *say*
they are on the back even while showing through it — but a cone struck away from
the camera is drawn identically to one struck towards it, and no weight fixes
that. It is not too loud on the far side, it is facing the wrong way, and
`sparkBack` can only make a wrong shape quieter. So the flare drops out there and
`sparkBack` no longer reaches it; the dot and the ring keep the far side and keep
their weight.

**The foot decides, not the vertex.** The near-half test is taken once at the
point the cross stands on, normalised off the body's centre, and passed down as a
varying — so a blade leaning its tip across the limb cannot buy its own mark back
or lose it. Per fragment, which is right for the ring being *cut* at the
silhouette, is wrong for a solid that either belongs to this half or does not.
The *ink* is still per fragment: the part of a blade standing out over open sky
inverts exactly where everything else does.

It fades over the last `FLARE_LIMB` of the near half rather than switching off at
the limb, because the world turns under these marks. A hard cull would pop a
whole cross out of existence on a mark that had not moved, at a moment nothing
else on screen was doing anything. The band is a cosine off the view axis and not
a distance, so it is the same angle on a mark that landed in a trough as on one
that landed on a peak.

**One mark is one silhouette.** The dot, the ring leaving it and the two blades
standing over both are four overlapping things drawn with alpha, and alpha over
alpha *compounds*: at half fade, two overlapping halves come out at three
quarters, so a fading spark grows a bruise exactly where its own parts meet. The
fix is that every ground mark is flattened onto **one depth plane** at the near
clip and the group is drawn with `LessDepth` — the first fragment to reach a
pixel claims it, every later one is rejected, and the union is drawn instead of
the sum.

Depth rather than stencil because nothing in the scene draws after these: the
sparks and the flare are the last entries in `RENDER_ORDER`, so the buffer they
leave behind is nobody else's, and a stencil buffer is not guaranteed to have
been asked for at context creation. It costs one line in each vertex shader and
three flags on each material.

**And the outline is that same plane, used twice.** The ask was for a mark that
always stands out, and then — having seen each piece outlined on its own — for
the outline of *the three pieces together*. Which is the same word as before:
what an outline goes round is a silhouette, and this group already knew how to
make four shapes into one.

So both meshes are drawn a second time, each shape grown by `sparkOutline`
pixels, on a plane a hair behind the fill and **after** it. Every pixel the mark
already claimed rejects the ink by the same strictly-less test, the second pass
unions among itself by that test as well, and what survives is the border of the
union — one line round the dot, the ring, and both blades, with nothing drawn
where a blade crosses the dot it stands on. No new shape, no distance field, no
second geometry: two more materials and two more draws off the *same* geometry
and the *same* instance matrices, because an outline that disagreed with its mark
about the taper, the travel or the limb would be a second mark, and the one thing
it has to be is the same one.

Three things fall out of it that are worth stating.

**The ink is arithmetic, not an authored tone.** The outline is `sparkTone`
flipped, then flipped again by the silhouette — so over the body it is the far
end of the ramp from the dot, off the body it is the near end, and it is opposite
the fill in both places. There is deliberately no `sparkOutlineTone`: an outline
that could be authored is an outline that could be authored the same as its own
fill, which is a slider whose whole range but one value is correct.

**Pixels, through the derivative.** Both passes convert `sparkOutline` to shape
units with `fwidth`, never with a scale. That is not tidiness — the flare's taper
stretches a blade's base up to three times wider than its tip, so a fixed step in
uv is a much longer walk on screen down there, and an outline built that way
comes out a wedge. The derivative already knows the local stretch, so the same
number of pixels is the same number of pixels at the foot, at the tip, and on a
dot foreshortened flat into the limb.

**The order costs a hairline, and the other order costs the bruise.** The fill's
antialiased rim writes depth at whatever alpha it has, so the outline starts
about half a pixel outside where the mark stops being opaque and the ground shows
through the join. The alternative — outline first, fill over it — has no hairline
and is much worse: the fill is *faded*, so at half life the ink underneath comes
back through the middle of the mark at a quarter weight, which is the bruise this
whole plane was built to prevent. If the hairline reads at 1× DPR the fix is a
tighter antialias on the fill's outer edge alone, not a change of order.

Two things follow from it and are worth knowing before they surprise anyone.
Overlaps *between* marks resolve the same way — two sparks crossing merge rather
than darken, which is the same answer and probably the wanted one. And the
winner is whichever fragment arrived first, which is instance order and not
depth order, so a faint old mark can claim a pixel from a fresh one. At 6px dots
scattered over a sphere that is rare; if it starts showing, the fix is to fill
the instance buffer nearest-first, which needs the camera in `Sparks`.

**The dot and the ring still carry no silhouette test**, which remains the one
deliberate exception to the rule every other mark obeys. The souls discard their
far half, the harness fades it, the anchors' ghost steps toward mid-ramp — a
spark on the far side simply shows through the world. The reasoning is that a
strike is an event and not an object: it says *the world was hit here*, and
hiding half of them would mean half of all clicks produced no answer at all. The
flare is not covered by that argument, because the event is still reported by the
dot underneath it — dropping the blades loses no click, only an ornament that had
nothing to say at that angle.

What the silhouette *does* now decide is the **ink**. Past it both the dot's tone
and the ring's flip to the far end of the ramp, `6 − tone`, per fragment — so a
ring standing out past the limb is cut at the silhouette rather than switched
whole. That is the rule the harness and the souls already draw by, and it costs no
new parameter: the authored tone is the one over the body, and the other end is
arithmetic.

What it could not decide is *depth*. A spark on the back of the world sits inside
the silhouette, takes the front ink and comes out indistinguishable from one on
the face of it — which made half of every burst read as noise. `sparkBack` is what
the far half keeps, applied per fragment on `vRel.z`, so the near and far sides
of one flash are the same mark at two weights. Alpha and not a step along the
ramp, which is what the harness and the ghost use for the same reading: a mark
that is *behind* is quieter, and the ramp only has seven answers, all of which a
spark may legitimately already be sitting on.

**The halo carries no ink at all**, and this is what retired the exception that
used to sit here. The old argument was that alpha is the only fade meaning the
same thing over the canvas and over a dark body, because at tone 0 a halo is
`--surface` — correct on the canvas and a *bright ring* over the planet. An
inversion has no such problem, because it has no tone of its own to be wrong
about: the ring writes a blend factor and the framebuffer supplies the colour.
`src·(1−dst) + dst·(1−src)` with a grey `src` is exactly `mix(dst, 1−dst, f)`, so
one `CustomBlending` gives a smooth, antialiased, *fading* inversion out of a
single draw. A soul under the ring goes pale; the canvas goes dark; a harness line
becomes whatever it was not. Fading is inverting less.

Two consequences worth stating. The fragment must **not** run
`colorspace_fragment` — what it emits is a factor, not a colour, and encoding it
would bend the inversion. And the blend's alpha channel is pinned to
`Zero`/`One`, because the same factors applied to alpha would drive it to zero
wherever the ring drew: a hole punched through the canvas on any context that has
an alpha channel.

That leaves **one** acknowledged exception in this medium rather than two.

**The curves were chosen by probe, not by eye.** A cubic-out growth against a
squared fade put the halo at 99% of its travel while still a quarter visible —
it stops in mid-air and is then rubbed out. The travel is quadratic-out and the
fade is cubed, so the mark is 5% opaque with 13.5% of its distance still to go
and still moving at a third of its opening speed. The assertion is now the probe's:
*a mark must still be travelling when it becomes invisible.*

**Many live at once, out of one draw apiece.** Two instanced meshes with a
thirty-two slot ring buffer each, a `fade` per instance, and no expiry
bookkeeping — a slot is free because it is old. A component per ring, mounting
and unmounting on every click, is what the original implementation did and is
what a fast clicker cannot afford. Nothing is swept and nothing allocates.

**The widget owns the click.** `PlanetView` gains a real `<button>` over the
canvas, present only when a `pulse` is given — a world that cannot answer a click
should not take one — and the count it keeps is a prop the scene *answers*. That
split is what lets the game drive the same marks from a header button later
without the scene learning what a click bought. It is also why the count lives in
the view and not the scene: the canvas is unmounted whenever the view scrolls out
of the observer's range, and a click is the view's event.

**A pulse parameter is an upgrade axis**, on the harness's argument. `sparks` is
the clearest: a click that incarnates more souls should mark the world in more
places, and the share resolves to whole flashes. `haloWidth` and `sparkWidth` at
0 are the two marks switched off, so neither needed a toggle of its own.

**Parked: the harness rings.** A flash could travel `t` along the loops, riders
surging and settling — the harness answering a click the way the body does. It
has to be a phase offset in the sampling and never a rebuild, since `buildLoops`
is cached precisely because rebuilding is the expensive path. Not built, and it
wants the rider count to have been looked at first.

### The burst is the world's own shape, and the halo is parked

The halo is a *circle* about the world. It says a click landed and says nothing
about which world it landed on — a perfect ring is the same ring on a smooth ball
and on a ridged one. The **burst** is the opposite reading of the same event: the
body's silhouette, terrain and all, thrown out behind it as a thick band while
the world's own outline flashes to the paper end of the ramp.

It is the outline's construction at a much greater width, so it inherits the
whole argument — radially offset, provably non-self-intersecting however lumpy
the body is, and authored in px, which is what holds it to its weight from 40px
to 420px. No new geometry: the same mesh the body and the outline already share,
which is also what guarantees the hull cannot disagree with the silhouette it is
a hull of.

**Three decisions.**

**One burst, restarted rather than queued.** The halo and the sparks each keep
thirty-two slots because there are many of them; there is one world, and
thirty-two silhouettes would be the same shape drawn thirty-two times. A second
click restarts the blink. That is also the honest reading of a fast clicker — the
world is flashing, not accumulating flashes.

**The edge flashes rather than being a second mark.** `burstEdge` is written into
the body outline's own material as a mix toward it, so at the end of `burstLife`
the outline is exactly the tone the world authored and there is nothing to
restore. It is the only place anything writes over `outlineTone`, and it is why
the hull and the flash share one life: an edge still white after the shadow
behind it had gone would read as two marks that missed each other.

**It is the one mark drawn *behind* the body.** Transparent, never writing depth,
and depth-tested with `LessDepth` — the spark group's rule, borrowed for the
opposite purpose. Strictly-less rejects every fragment sitting at the same depth
as the body or as the body's own outline, so what survives is only the band
standing outside both, and the hull cannot creep over the edge it exists to set
off. It is inside the spin, since a silhouette taken from a world that has since
turned is the wrong shape.

**The halo is parked, not removed** — `haloWidth` and `echoWidth` at 0 in
`DEFAULT_PULSE`, the flare's precedent exactly. Everything stands: the inversion,
the `CustomBlending`, the echo's whole-count warp, the ten sliders. The burst is
one sitting old and the ring is a slider away, and the inversion argument written
up below is the most carefully worked thing in the pulse — parking it by value
costs nothing and deleting it would cost all of it.

Neither the hull nor the flash has been seen. The width, the ink and a life of
0.25s are blind defaults, and the one thing worth watching for specifically is
the hull over `--surface` on the detail screen: it is opaque ink at the dark end
of the ramp against a light ground, which is the loudest thing the widget has
ever drawn.

### A spark lands on the face you are looking at

Sparks were placed uniformly over the whole sphere, so about half of every burst
landed on the back and showed through the world at `sparkBack`. That was argued
for — a strike is an event, and hiding half of them means half of all clicks
produce no answer — and the argument survives, because `sparkFace` does not hide
anything. It *places* the mark on the visible cap instead, so every click still
answers.

What it costs is the two things the old reading bought: the world no longer
carries a history of earlier clicks round on its far side, and `sparkBack` only
says anything below 0. Both are reachable — the slider runs from −1, the whole
sphere and today's behaviour, so the two readings can be compared by dragging.

It is a **cosine off the camera**, `FLARE_LIMB`'s units: 0 is the visible half
exactly, and above that it also clears the limb, where the ground is edge-on and
a dot foreshortens into the silhouette. The default 0.45 is 55% of the visible
half by area — the mark nearest the edge sits at 0.89 of the disc radius. It
stops at 0.9 rather than 1, since a tighter cap is one point and a slider that
stops meaning anything before its end is worse than no slider.

**The cutoff is taken in view space and turned back into the body's frame**, and
that is the whole of the work. A cutoff on the body's own axes would pin marks to
a fixed patch of ground and let the spin carry them off the face within a
second. `flash` therefore takes a `Facing` — `PlanetBody`'s three hold angles
plus where the spin has got to — and runs that chain backwards by hand, because
nothing in `pulse.ts` may import three and stay probeable. Probed across three
holds at four cutoffs: 1200 marks, none outside the cap, none off unit length.

The hold is read **untracked** at the click. It is not something the flash effect
answers to, and subscribing would re-run it every frame the world turns.

### A world's size is everything except the world

The body cannot say how big it is. It is drawn to the framing whatever it is, so
a picture of a sphere alone carries no scale at all — and no slider on the body
can change that, because changing the body changes the framing with it.

What carries scale is everything standing *beside* it. So `PlanetVisual.size`
**divides the marks** rather than multiplying the body: a large world wears fine
souls and low poles, a small one wears coarse ones. The number says the thing
being authored — how big this world is — and the marks move the other way, which
is the direction the handoff already argued for when it said *a world with small
poles reads large*.

Three sizes move, all of them authored in body radii: the souls' dots, the
anchors' whole solid, and the sparks. What is authored in **pixels** does not —
the outline, the contour, the ghost's dash, the dots' px floor. Those are the
drawn edges of the widget, and a widget does not get a heavier line for holding a
smaller planet.

That last rule has since been split rather than broken: the pixels that draw the
*widget* still stand where they were, and the pixels that draw a **mark on the
world** — the anchors' edges and the harness's lines — now divide with everything
else beside them. See *A line had no weight to divide*.

**The orbits stay where they were authored too**, which was a deliberate call and
not an omission. `radius` is rim-hugging by design, at 1.3 against a body of 1, so
a soul crosses the silhouette twice an orbit and the ink rule does its work.
Dividing that by a size of 2 puts the band at 0.65 — inside the body, where the
rule never fires and the whole depth cue is gone. Size is about the marks, and the
swarm's shell is about the ink.

The division happens in exactly one place per subject. The anchors get an adjusted
`AnchorVisual` built in `PlanetScene`, because `placeAnchors` is read there and
`buildAnchorSolid` inside `Anchors` — a solid built at one size standing on a
placement computed at another is the single way this could have gone wrong. The
souls and the sparks take a `size` prop instead, since neither rebuilds anything
from it and a derived copy would throw away eight hundred souls on every drag.

### A line had no weight to divide

A soul's ring scales with the world because it is a *fraction of the dot*, and the
dot is divided by size. The anchors' edges and the harness were `LineSegments` —
one device pixel, on every platform that matters — so the solid shrank on a large
world and the ink around it did not. At size 3 an anchor is about six pixels of
form carrying a pixel of outline, which reads as a scribble rather than as a small
pole.

There was nothing to fix at the ink end. A hairline has **no width to divide**, so
the first half of this is giving lines one: `ribbon.ts` widens a segment list into
quads, four vertices and two triangles a span, and `ribbonPlace` in `material.ts`
swings them apart in the vertex shader. Exact under an orthographic camera and
only there — view units are pixels over zoom at any depth, so a perpendicular
offset in view xy is the same weight wherever a segment points and however far
back it is. No viewport uniform, no perspective divide, and one chunk shared by
the harness and by both states of an anchor's edge so the three cannot disagree
about what a given width comes out as.

**The far end swings out backwards**, and this was shipped wrong the first time.
Each vertex finds its own direction from its own `toward`, and at the far end that
direction runs the other way — so the perpendicular is the negative of the near
end's, and a side asked for by the same sign at both ends puts the two corners on
*opposite* sides of the line. That is a crossed quad: a bowtie per span, and a
comb along a 54-segment loop. It came back as three complaints at once — jagged
lines, lines that looked shaded, lines that looked to have alpha — because the
thin wedges a bowtie leaves take partial coverage under MSAA and read as tone.
There is no lighting anywhere near either shader.

Three more details the quads cost, all paid in the same chunk:

- **The ends are squared off**, or every corner of a polyline shows a nick at
  width. The cap pushes an end past its own endpoint, so the shader hands back
  how far as a share of the span and `vAlong` subtracts it — otherwise the
  ghost's dash would compress by a cap at each of the twenty spans a solid is
  drawn from.
- **The ghost is the one stroke left uncapped.** It draws by inverting what it
  crosses, and an inversion applied twice is no inversion: a cap filling a corner
  would punch a hole in the ghost at every one of them. A dashed line has gaps at
  its corners anyway. (Crossing ghost edges already double-invert where they meet
  — that is the rule's own fixed point and it predates this.)
- **The edges pull a depth unit toward the camera** while the facets push one
  back. A stroke with width to it covers a band of a facet that falls away across
  it, and one unit of clearance was only ever enough for a hairline.

The rule itself is the souls': **px ÷ the world's size, with a floor**. The floor
is in pixels and holds — however large the world, an anchor that is drawn at all
is drawn in ink a screen can carry. A width of 0 is off and the floor does not
overrule it; it rescues a stroke the division took away, and does not argue with
an author who asked for none.

**The harness gets a ceiling and the anchors do not**, and the asymmetry is the
whole of what separates the two subjects. An anchor on a small world *is* a large
anchor — the same division that thickens its line is what grew the solid that
carries it, so the two move together and nothing needs to catch them. A harness
spans the **body**, and the body is drawn to the framing at every size: there is
nothing underneath its lines getting bigger, so as a world is authored smaller the
stroke keeps thickening against a cage that stays put, and past a point 192 loops
stop being a cage and become a fill.

The division lands per subject, once, as it did before. The anchors take a bare
`size` prop rather than folding the width into the adjusted `AnchorVisual` that
`PlanetScene` already builds — that copy exists because a solid built at one size
standing on a placement computed at another is the way this breaks, and a uniform
has no such hazard. The harness takes the same prop for the same reason: the
geometry never reads it, and a derived copy would rebuild ten thousand spans on
every drag of the slider.

Probed on the pure side: structure over every solid from three sides to eight, and
the shader's own arithmetic replayed in view space at five angles and two widths —
the band comes out exactly the authored width, centred on the line, the cap sits
exactly half a width past each end, and the arc length it reports lands on the nose
at both ends. Edge-on to the camera it stays finite.

That first probe **passed on the bowtie**, which is the lesson worth keeping. It
replayed the shader for one endpoint at a time, and a crossed quad is a
disagreement *between* two endpoints — invisible to any check that never assembles
both. It also asserted the sides were what the builder wrote rather than what they
had to be, which is a test of the code against itself. What it does now is take the
four corners of every span from the attributes as stored and ask which side of the
centreline each one landed on: 312 crossed quads across the six solids before the
flip, none after.

**`edgeWidth: 1.2`, `width: 1` and `ceiling: 2.5` are still blind.** The weight to
watch is whether these match the hairline they replaced — a hairline is one
*device* pixel, so on a retina screen it was half of what these now ask for.

### The world ends where it is drawn to end, not where it is modelled

The harness cut its ink rule — both halves of it, the two inks and the far-side
hide — at the unit sphere. The body is drawn to the sphere *plus its outline*, and
the outline is authored in pixels, so the gap between the two is a band that widens
as the widget shrinks. Everything in it was wrong: a line behind the world came
back out inside the outline and crossed it, and a line in front took its off-body
ink while still over the black edge, where it read as nothing at all.

One radius fixes both, and it is not the harness's to author — the *body's* outline
decides it. `PlanetScene` works out how far that outline **bleeds** past the surface
in body radii, `outline / zoom`, and hands the figure down, so every crop follows
the outline slider instead of being tuned against it.

Terrain is still ignored, deliberately: a loop stands off the surface, so the mean
radius is the only silhouette it can cross, and at the amplitudes worlds are
authored at that error is now inside the weight being added to it. A world deformed
far enough to be an asteroid would want the real silhouette, and the fragment has no
way to ask for it.

**The souls had the same seam**, and the bleed is what lets them take the same fix
without losing anything. Their `rim` is *authored*, so it could not simply be
replaced by a derived edge; the bleed is **added** to it instead. The slider goes
on saying exactly what it said — where the ink switches on the world, in body radii
— and the widget's own weight stacks on top, which is the one part of the answer a
slider could never know, because a px-authored edge is not a radius until there is
a zoom to make it one.

That one number now cuts three marks at the same place: the harness's two inks, its
far-side hide, and the swarm's discard. The souls' `rim` also sets the sphere the
front/behind test is taken against, so the hemisphere a soul is measured for grew
with it and the ink and the hiding still agree — which was the whole point of the
souls discarding rather than depth-testing.

### A rider's speed is a distance, not an angle

A soul reads its harness loop at the phase it was already at. That was written up
as *joining the harness changes where a soul is and not how fast it goes*, and it
was wrong — it holds the **angular** rate constant, and a loop is not the same
length as the orbit it replaced.

Measured at four anchors on the authored `DEFAULT_HARNESS`: the loops run 1.73 to
2.74 world units and the orbit they were drawn from is 7.68 around. So a rider was
covering between **22% and 36%** of its own speed across the screen. That is not a
subtlety; it is the swarm visibly stalling the moment it reaches a line.

The fix is one ratio. `HarnessLoop` now carries its `length`, measured on the same
polyline samples a rider is read from — the distance a rider actually covers,
chords and all, rather than the length of the ideal curve under them — and the
phase is scaled by `orbitCircumference / loopLength`. What is held constant is the
thing the eye measures. Mean speed now lands within 0.31% of the orbital speed on
every loop.

It is the **phase** that is rescaled and not the clock: scaling the shared clock
would drag every soul on that line into the same lane. And the instantaneous rate
still wanders by about ±10%, because `sampleLoop` walks the polyline by index and
the samples are not evenly spaced in arc length — that is the loop's own bulge and
twist and it was there before this. Arc-length reparameterisation would remove it
and costs a table per loop; nothing has asked yet.

**The A → B seam is untouched and is now measurable.** A rider reaching the far
anchor of an arc reappears at the near one, and the step that wraps covers the
loop's whole chord. The probe skips it explicitly rather than folding it into a
speed, because it is a pop and not a rate.

### The flare is parked, not removed

The author watched the click run and did not want the flare on the flashes. It is
off by the switch the code already had — `sparkRiseFrom` and `sparkRiseTo` at 0 in
`DEFAULT_PULSE`, which draws neither the blades nor their outline. Everything else
stands: the two shaders, the two materials, the four sliders, the near-half rule
and the limb fade. Raising either rise in the pulse lab brings it back, and the
heights it was authored at — 0.6 → 2.4 over a 3.2 → 1.4 base — are recorded beside
the zeroes so what was judged can be judged again.

Off by a value rather than by deletion because the flare is not wrong, it is
unwanted *here*: a mark that stands off the surface is the obvious thing to want
back when a spark has to read at 80px, and nothing about it is cheap to rebuild.

### The world takes the click

`Disc.svelte` is no longer rendered. The detail screen's click target is
`PlanetStage`, which is the whole of the join between the game and the widget: an
active planet id becomes a `PlanetVisual` out of `planet-visuals.ts`, the cohort
rows become `cohorts` as counts, and one press is both a flash and a purchase.

Three things were decided to place it.

**The planet replaces the disc rather than sitting above it.** Two round things
stacked, only one of them clickable, is a worse screen than one — and the widget
was built around answering its own click, so a portrait above a separate button
would leave the part that took eight sessions unused.

**The disc's ring of dots is retired in favour of the swarm.** Both were the same
reading of the same number; the ring capped at 28 and the swarm draws one band per
cohort, which is the split the table already shows. `countSouls` is no longer read
here — `soulsPerCohort` is, off the same rows.

**`PlanetView` gained `clickActionLabel` and `onclickaction`.** The flash was
already the view's own event and stays that way; the callback runs beside it, so
the widget still does not know what a click buys. The aria-label was hardcoded
`Incarnate` and is now that prop's default, so the lab's forty-four views are
unchanged.

The framing is held at the swarm's 3.2 whether or not there are cohorts. A world
that shrank the moment the first cohort arrived would read as the planet moving
away from the player, which is the opposite of what a first purchase should feel
like.

**The canvas is `--surface`, not the page's `--canvas`.** The panels around it are
that colour, and a world on a different ground than the cards beside it reads as a
hole in the column. It is also the ground the true-size strips have always been
judged on, so nothing about the ink is newly untested — and the halo inverts, so
it cannot be wrong against either.

**The canvas takes the column, at 511:380.** `widthPx` is the stage's own measured
width rather than an authored size — `bind:clientWidth`, rounded, and nothing
renders until it is known. `PlanetView` sizes a real buffer and not a CSS box, so
measuring is the only way its canvas can be responsive at all; the outline is
authored in px and holds its weight at whatever the column gives it.

The stage is no longer square. The author sat with it and found the world at
**511 across, 380 down**, which is held as a ratio rather than as the two numbers:
the width is whatever the column gives, and the height follows it. `PlanetView`
gained `heightPx` for this and `px` became `widthPx`, since a prop that means the
width should not be named as though it means both. `heightPx` absent is square, so
the lab's forty-four views are unchanged.

The world is sized by the **shorter** axis — `zoom` is `min(width, height) / frame`
— so on a landscape stage the height is what decides how big the planet is and the
extra width is room around it. That is the coupling to know before touching either
number: widening the column grows the world here, because the ratio carries the
height up with it.

The caption floats over the bottom of the canvas instead of sitting under it, which
buys the world the row it would otherwise have spent, and it is `pointer-events:
none` so the press still reaches the canvas everywhere the words cover.

`Disc.svelte` is left in the tree. It is the only other thing that has ever been
the click target, and the decision to drop the dot ring is one sitting old.

### The world is held, not tilted

`tilt` was one `rotation.x` — one axis of three. It is now three, nested rather
than an Euler triple so each reads the same whatever the other two are:

- **`lean`**, the pole's roll in the screen plane, positive to the right. The
  genuinely new axis; with `tilt` it fixes the pole completely. Outermost, so it
  stays a *screen* lean however far the pole is tipped — which is what makes it
  and `tilt` one puck.
- **`tilt`**, unchanged at ±0.8. Foreshortening, not a move across the screen: the
  pole slides *down* toward the centre as it comes at you.
- **`turn`**, which face is forward. Inside the tilt, outside the spin — a
  starting phase on a world that turns, and the whole choice of what a seed shows
  on one at `spin` 0.

**The light needed no work.** `uKeyDir` is view-space and the shader reads a
view-space normal, so all three turn the world under a key that stays put — which
is what `light.svelte.ts` already said. Everything on or around the body is inside
the hold, so the swarm, harness, anchors and sparks come round with it. The halo
does not: it is about the world, not on it.

`lean` and `turn` are 0 on all nine authored worlds, so nothing moved.
`LEAN_REACH` is 1.6 — just past pole-horizontal; further is upside-down, which
`tilt` at ±0.8 cannot meet.

### The labs' two controls are components

`Puck.svelte` and `Slider.svelte`, both out of `LabPanel`/`PlanetLabPanel`.

The puck is two numbers as one drag, with a reach per axis. **Disc** clamps to the
unit circle — the key light's, where what is left over is the third component.
**Square** clamps each axis alone and draws a dashed square rather than a horizon
ring: the hold's two angles are unrelated, and a circle would claim they were one
direction.

The slider's readout is now an editable field. Typing is held in a draft so a
half-finished number is not read as one, and commits on Enter or blur, clamped to
the param's range — the field is for precision, not for leaving the range. Escape
reverts, double-click on either half resets. Every lab gets it; `LabPanel` styles
both components' rows globally so no panel can drift.

### A still world needs no context

The Overview wants worlds where it has text: a portrait in the detail column and
a picture on every row. A `PlanetView` each is one WebGL context each, and the
worst case is fifteen rows plus the portrait — sixteen, which is the ceiling
exactly. That is what put *a shared renderer* on the board as the thing blocking
the rows, and it is the wrong answer to the question.

**Sharing a renderer buys context count, not draw count.** Every visible slot
still renders every frame, because worlds turn. So the saving only exists if the
worlds are *live*, and the rows' are not: a row's world is a still picture. A
still picture needs a context for one frame and never again.

So the rows are **snapshots**. `snapshot.ts` holds a queue and a cache;
`SnapshotCanvas` mounts itself off-screen on the first request, `SnapshotRenderer`
inside it draws each world once and reads the buffer back, and the canvas
unmounts three seconds after the queue empties. `PlanetStill` is a 2D canvas
holding the bitmap — `PlanetView`'s pair, same props, and the two words carry the
distinction: a **view** turns and holds a context, a **still** does neither.
Steady state is **one** context in the whole Overview, the portrait's, and it
would still be one with a hundred rows.

Five things this turns on:

- **The queue is not reactive, and that is the load-bearing part.** A still asks
  for its picture from inside an `$effect`, and asking means dropping that
  still's previous job — a read of the queue and then a write to it, by the same
  effect. As `$state` that is a loop with no exit, and forty-five stills make it
  a lock rather than a stutter. The renderer is *pushed at* instead: it hands
  over a callback when it mounts. **A queue written to from inside an effect
  cannot also be something an effect watches.**

- **`renderMode="manual"` with a real frame counter.** Invalidating raises a
  flag; three's own animation loop is what renders, some frame later. So the
  renderer waits on `renderer.info.render.frame` changing rather than on a
  guessed number of frames — a capture that grabbed an unrendered buffer would
  come back blank and say nothing about it.
- **Drawn transparent.** `PlanetScene`'s `backgroundToken` now takes `null`.
  This is not economy: a selected row has `--surface-alt` under it and the rest
  have `--surface`, so a ground baked into the picture would show as a square of
  the wrong tone on exactly the row you clicked.
- **A still is not the world as authored** — `toStill`, below.
- **One pending job per asker.** A lab slider drags at sixty asks a second and
  only the last answer is ever drawn.

The `#stills` strip in the lab is where the size reading gets made — the family
at five row sizes with the framing on a slider, forty-five pictures, which only
exists because they cost nothing. `detail` at 26–36 is ~17k triangles, which
would matter for a live view and does not matter at all for something drawn
once, so it is left alone.

**The shared renderer is parked, not abandoned** — see *Parked*. It is what a
screen wanting many *live* worlds would need, and nothing wants that yet.

### A still is the world with two fields taken off it

`toStill` sits beside `PlanetVisual` and overrides exactly two, both because a
picture is small and does not move. It is applied in the renderer, so nothing
that draws a still can forget it, and the cache key is still the *source*
visual — the derivation is total, so it adds nothing to distinguish.

**`outline: 1`.** The ink is authored in pixels and `bleed` is `outline / zoom`,
with `zoom` being `px / frame`. Every world ships 2, which is 0.8% of the body
radius at 400px and around 9% at a 48px row: the same number, seven times the
weight, with nothing edited. A hairline is a list row's ink. This is a still's
number and not the nine records' — the authored 2 is right for the sizes it was
judged at, and the derivation is what keeps one from having to be wrong for the
other. `contour` is the next candidate and has not been changed: 1–1.5px
hairlines against bands 44px across may merge into one grey, and that wants
looking at rather than guessing.

**`spin: 0`, so the face is `turn`.** The spin has to go — a manual frame's
delta is however long since the last one, so a turning world would land
somewhere else every capture. What that leaves is `turn`, which already sits
outside the spin and inside the tilt. Its doc has said from the start that it is
*"a starting phase on a world that turns, the whole choice of what a seed shows
on one that does not"*, and a still is precisely a world that does not turn. So
**the field already existed** and no second one was added: on the live view
`turn` is a phase the spin walks away from inside a second, and on the still it
is everything.

What was missing was not a field but a *view*. Every planet on the lab page
turns, so the one thing the lab could not show was the face that ships. The
`turn` slider now carries two snapshots under it, at 72 and 40px — the same
`under` snippet the pucks use — redrawn as the slider moves. Two sizes rather
than one because the thing that differs between them is the weight of the ink.

### The world keeps its own time

A world drawn on two screens was two worlds. `spinAngle` lived in `PlanetScene`
and the swarm's `elapsed` in `SoulSwarm`, both starting at nought on mount — so
changing tabs, or scrolling a view out of the observer's range and back, put the
planet at the top of its turn again.

`clock.ts` holds them instead, keyed. A view passes `clockKey` and gets the
world's clock rather than a new one; a view that passes none gets a private one,
which is what the labs want — forty-four of them converging on one angle would
be a chorus line. Only `PlanetStage` and the Overview's portrait pass a key, and
they pass the planet id.

**It is one clock now, which it always claimed to be.** `PlanetScene`'s comment
already said the body and the swarm read one rotation; they did not. The swarm
now takes the clock as a prop and *reads* it — never advances it — the way
`Sparks` and `Halo` take `pulses`. It is a plain object on purpose: a value that
moves every frame has no business in the reactive graph.

Two properties fall out of one rule — **step by clamped wall time, not by the
frame's delta**:

- **An unwatched world is paused, not fast-forwarded.** Come back after five
  minutes and it advances a tenth of a second. The clamp is the same tenth
  Threlte puts on its own delta, and it is the whole difference between the
  picture continuing and the picture jumping.
- **Two views of one world cannot run it double.** Whichever reads second in a
  frame finds almost no wall time left to add, so the total is one frame's worth
  however many are watching.

The angle is integrated rather than taken as `spin × elapsed`. The product is
tempting and wrong: dragging the lab's spin slider at ten minutes in would swing
the world through several turns to catch up with its own new rate.

Probed off the model, six groups: keyed clocks are one object and unkeyed ones
are not, a frame turns rate × delta, a second reader in a frame adds nothing, a
long gap clamps to one step, and a wall clock that goes backwards does not unwind
the world.

### A screen that is left is hidden, not destroyed

The clock made a world resume where it was. It could not make it *appear* there:
`App.svelte` was an `{#if}` chain, so changing tabs destroyed the whole screen,
and with it the canvas, the renderer, and every shader compiled against that
context. Coming back was an empty box for as long as the rebuild took — a new
`WebGLRenderer`, a fresh compile of four to seven materials, and two deferred
steps before any of it started: `PlanetStage` waits on a `clientWidth` measure,
then `PlanetView` waits on an `IntersectionObserver` callback.

None of that is worth paying twice, so it is not paid twice. `Screen.svelte`
holds one screen each and takes nothing down. An inactive screen is
`position: absolute; visibility: hidden`, and the two halves of that are both
load-bearing:

- **`visibility`, not `display: none`.** A screen at `display: none` measures
  nought — which puts the stage's width at nought, drops the view out of the
  observer that mounts its canvas, and has Threlte resize that canvas to
  nothing. Every one of them is the teardown this exists to prevent.
- **Out of flow, and at its natural height.** `top/left/right`, never `inset` —
  a hidden screen stretched to the height of the visible one would come back at
  someone else's size.

A screen is built on first ask and never again, so the Overview costs nothing
before it is opened. It cannot be reached while hidden, either: `inert`.

**What is left is a canvas nobody sees still asking for frames.** `watched.ts`
is a context carrying the predicate — `setWatched` above, `useWatched` in
`PlanetView` — and a view that is mounted but unwatched passes `isPaused` to the
scene, which stops both `useTask` bodies. No `invalidate`, no clock step. The
clock stopping is the point rather than a cost: `advanceClock` already reads
clamped wall time, so an unwatched world resumes instead of jumping, and that
was written for exactly this.

Nothing above says otherwise means watched, so the labs are untouched — the
context ceiling is still theirs alone to press. The app now holds two live
contexts once both screens have been visited, and three while the snapshot
canvas is up.

**One thing now outlives a tab switch that did not before**: the Overview's
picked world. It reads as correct, and it is new. The first-harvest screen is
the other: a tab switch can happen underneath it, since it is the Overview's
body it replaces rather than the frame — see §*The harvest screen*.

**`setWatched` composes with whatever is above it**, and has to. The predicates
nest: a band inside an Overview that has itself been taken over is not watched
however active it is on its own, and without the `&&` the inner answer shadows
the outer one — a hidden screen goes on painting worlds nobody can see. That was
latent while nothing nested, and the first-harvest takeover is what put a
`Screen` inside a `Screen`.

### A second surface, on its own clock

The veil is a cloud deck at one tuning and an aurora at another, and it is the
first thing the widget draws that is *on* the world rather than beside it. One
shell, twenty-five fields, and every world ships it at `veil: 0`.

**Its field is in the shader, and that is a departure with a reason.** The body's
is baked on the CPU because `buildGeometry`, `placeAnchors` and `pulses.flash`
must all sample one `SurfaceField` — a marker and the terrain under it can never
disagree. Nothing stands on a cloud, so the constraint does not reach the veil,
and dropping it is what makes the layer nearly free: the shell borrows the body's
*cached* geometry for its topology alone and renormalises it to a true sphere in
the vertex shader, so there is no second mesh, no second cache key, and **not one
`shape: true` field in the group**. Twenty-three sliders that never rebuild
anything — only `veil` and `veilInk` do, and what they rebuild is a material.

**A procedural field has no mip-map, so it is band-limited by hand.** This is the
other half of the price of evaluating in a fragment. `field.ts` bakes its noise
per vertex and the rasteriser interpolates, so the body cannot alias; the veil
reads the field afresh at every pixel, and any octave whose features are finer
than a pixel is pure sparkle — worst at the limb, where the sphere turns away
and one pixel covers a great deal of it, and *crawling* rather than merely
noisy, because the veil turns. So each octave is faded out as its period
approaches two pixels, and so is the warp, which would otherwise put the
aliasing back by moving every sample point under it.

The fade divides by the **unfaded** amplitude sum, so a dropped octave is
genuinely dropped rather than having the coarse ones boosted to stand in for it:
the veil loses detail toward the limb instead of growing a hard ring there. It
is also scale-aware for free — a 48px still drops nearly everything fine, a
400px view keeps it.

The price is one number. A fragment cannot probe its own field, so where
`field.ts` measures its reachable range across 4096 directions, the veil asserts
it once as `VEIL_SPREAD`. The consequence is real and worth knowing at the
slider: **`veilCoverage` re-means itself slightly when `veilOctaves` moves**,
which `land` on the body never does. That is also why there is no
`veilLacunarity` — a second octave-shaping knob with nothing to absorb it would
make the threshold drift for no picture.

**Two composite modes, because the ramp has seven inks and no gradient.** A
translucent layer has to say what "half covered" means in a medium that owns no
tone between two slots. Mode 0 is plain alpha over an authored tone — it names
an ink, and so it is the one that can be wrong about the world under it; it is
also the first thing in the stack whose pixels are not ramp values. Mode 1 spends
the same coverage as *density* instead, and every pixel it draws is still one of
the seven.

**Three modes shipped and one survives, which is the honest record.** The other
two were built, looked at and cut. Mode 1 was the halo's inversion — no tone of
its own, dark over paper and pale over a dark world, fixed point at `--ink-400`.
Mode 2 was a Bayer 4×4 stipple. The inversion was argued for as the thing that
makes an aurora work, and that argument was sound and is now unfunded: **the
aurora reading has no ground-independent mode any more** and has to be mode 0
with an authored pale tone, which can be wrong against a world it did not expect.
If that shows, the inversion is in the history and comes back as a third mode
rather than being reinvented. The stipple's *argument* did not die with it —
coverage as a density rather than an opacity is exactly what the hatch inherited,
with a better mark.

**No depth test, and the reason is not z-fighting.** The shell was built by
throwing the terrain away. Testing it against a buffer the *lumpy* body wrote
would put every lump straight back in — `cool_2` at `amplitude: 0.14` would wear
lace over its peaks and `banded` would not — so the veil's picture would come to
depend on a slider in another group that says nothing about veils. The far half
needs no rule either: the vertex shader emits a true sphere, so the winding is
the sphere's and `FrontSide` culls it exactly. A soul needs a discard for this
because a billboard has no winding; a closed shell does not. What is left is a
limb standing past the drawn silhouette, which is `veilHeight`'s only visible
job — under an orthographic camera a shell buys no parallax, so that field is
honestly a limb reach and wants reading against `outline / zoom`.

**The pole mask is an annulus, not a cap.** A signed knob over `|y|` puts the
maximum on the pole, which is a hat. `veilPole` is the sin-latitude the band is
centred on and `veilPoleEdge` its width, so a ring at sixty degrees is sayable
and "everywhere" falls out of a width past 2 rather than needing a case of its
own.

**The outline is placed by a contour, not by an inset.** `veilOutline` draws a
line at the contour where the fill reaches *full* coverage — the inner edge of
the feather — rather than at the silhouette. That one choice is the whole of its
behaviour: at a hard edge the two contours are a pixel and a half apart and the
line is the silhouette, and opening `veilEdge` sends full coverage retreating up
the field's own slope toward each blob's core, taking the line with it. A
diffuse veil is then a soft mass with its solid heart drawn around, and **no
second slider had to say where the line sits** — the one that made the veil
diffuse already did.

It follows the field rather than any centre, so a long curtain keeps a line down
its spine instead of collapsing to a dot, and a wisp whose peak never reaches
full coverage carries no line at all — right, because it has no solid part to be
the edge of. Width comes from the derivative in pixels, `contourAt`'s trick on
the surface, so it holds its weight at any widget size and needs no zoom.

**The contour is `veilEdge`, not the feather's floored width, and the difference
is a whole class of bug.** The fill's softness is `max(veilEdge, fwidth × 1.5)`
— a *per-pixel* quantity, because the floor is what antialiases the fill. The
line was first anchored to that, which gave every pixel a slightly different
contour to be near: wherever the field ran fast the line came apart into
scattered dots. Anchored to the authored `veilEdge` instead it is one contour
for the whole surface and draws as one line — and at `veilEdge` 0 it now sits
*exactly* on the silhouette rather than a pixel and a half inside it, which is
what the field was asked for in the first place.

Each mode does what it can with it. Mode 0 mixes the outline's tone into the
fill and takes the higher of the two opacities, so a line survives where the
cloud under it has gone to nothing. Mode 1 hatches the fill and does **not**
hatch the line: a broken hairline is a dotted one, and at these widths it would
come apart. The line takes a hard half-cut there, aliased, which is what the mode
is elsewhere too — and it is not keyed either, because in mode 1 the key is a
shading and a cloud does not lose its edge to the dark.

**`veilKey` differs in kind from the body's key, and it means something
different in each mode.** The surface composites its shade as a shift along the
ramp. Mode 0 has no band coordinate to shift along — one ink, one alpha — so the
only thing its key can shade is *how much veil there is*, and the layer thins
toward the far side of the light. Mode 1 does have one, because a hatch can be
sparse and dark at the same time: the veil keeps its full shape and the key walks
`veilHatchShade` slots down the ramp instead. Shape and light stop competing for
the same number, which is the thing a density mode buys that an alpha one cannot.

`veilCover` therefore hands the key back *beside* the fill rather than folded
into it, and mode 0 multiplies them together on the spot. That keeps mode 0
numerically what it was while letting mode 1 read them apart — one field walk,
two answers, no second threshold that could disagree with the first.

Signed either way, and the sign is which side of the light it belongs to: a cloud
burns off — or shades — the dark half, an aurora lives on it. The magnitude is
how hard the reading is pressed, which in mode 1 also bounds the walk: at
`veilKey` 0.4 the veil never reaches past 40% of its shade range.

**A second angle, not a second clock.** `WorldClock` gains `veilAngle` and
`advanceClock` writes both from one wall-time step. Two calls would add `elapsed`
twice and leave `at` at the second read, so the swarm would run double and both
angles half. Both live on the shared keyed record, so two screens on one world
share the veil's phase exactly as they already share the body's, and `toStill`
zeroes `veilSpin` beside `spin` — the snapshot renderer keeps one scene warm
across a whole batch, so a live veil would put a different sky on every world in
a family strip. No `veilTurn` was needed: the veil's group hangs inside `turn`,
so the slider that already chooses a still's face chooses its sky too.

`veilSpin` has since become a *drift over the ground* rather than a rate of its
own — see §*A drift is not a rate*. The three `spin` figures in the readings
below read as drifts now, and every one of them still says what it said: a deck
pulling ahead of its world, an aurora running against it.

Three readings to start from. The first two are still unrendered; the hatched one
has been through several rounds in the lab and is the reason the mode looks the
way it does.

```
cloud    veil 0.55  ink 0  height 0.03  pole 0     edge 0.08  key  0.4  spin  0.05
aurora   veil 0.9   ink 0  height 0.06  pole 0.86  edge 0.02  key -0.8  spin -0.22
hatched  veil 0.8   ink 1  height 0.02  pole 0     edge 0.30  key  1.0  spin  0.02
```

The hatched one is the reference frame's reading and wants `veilKey` at the rail:
that is the slider the ramp walk is bounded by, so at 1 the veil crosses its whole
shade range and the terminator is the hatch. A wide `veilEdge` is deliberate
there — it is the *silhouette's* gradient, the band the marks thin and break
across on their way out of the cloud, so a hard edge would give a solid blob with
a shaded side and no shoulder at all.

### The hatch is a dither with a better mark

Mode 1 is Christoph Steinmeyer's *dotted line* shader, from a Blender EEVEE
tutorial on procedural manga hatching, rebuilt in GLSL on a sphere. His whole
graph is four nodes: a wave texture at one authored angle, a single-octave noise
screened in to break the lines into dashes, a constant colour ramp for a sharp
edge, and the diffuse added underneath before that ramp.

**That last step is why it belongs here rather than being a second kind of
thing.** A pattern, plus a tone, through a hard threshold *is* ordered dithering
— it is what `bayer4At` was doing one line at a time. So the hatch did not
replace the dither's structure, only its screen function, and the mode kept
everything the stipple had: coverage as a density, a discard rather than an
alpha, and every drawn pixel still a ramp slot.

**Strokes are the level sets of the angle to an axis, and the choice of `asin`
over the raw dot product is the load-bearing one.** The gradient of
`asin(dot(d, a))` over a unit sphere has magnitude **exactly 1 for any unit
axis**. One family is therefore evenly spaced across the entire world at once —
which means a surface-locked hatch needs no UV projection, no triplanar blend and
no correction at the limb, the three things his UV approach spends its budget on
and the three things he apologises for in the video.

**The axis is the world's own, and there is no angle slider.** The measure has
exactly one flaw — it degenerates at ±axis — and an authored angle can only
decide where that flaw surfaces. The axis was first placed in the XY plane on the
claim that this parked both poles on the limb, and **that claim was wrong**: the
plane is object space, so tilt, turn and lean carry the poles wherever they like,
and what shows is a whorl sitting in the middle of the disc with nothing in the
picture to explain it. On the world's own axis the ruling runs in latitude and
the degeneracy lands on the poles, which is where a ruling in latitude is
*supposed* to converge — the same flaw, read as a globe. The slider went with it:
of its range only two values were ever wanted, and both named this axis.

His clustered rotation — a voronoi driving the wave's Z angle, the *little marks*
shader — is not built. One family suffices for the reference frame, and a
permutation voronoi is twenty-seven cell evaluations a pixel against the one
`snoise` the breaks cost. A hash-based one is not an option for the reason
`simplex3D` is not hash-based: `fract(sin(…))` differs between Mali, Adreno and
desktop, and the cell layout would *be* what the veil looks like.

**The first build was a hatch and not a dither, and that is the mistake worth
recording.** It scaled *stroke weight* by coverage against a ceiling of about a
pixel, so the marks could never close up: the veil's white mass was gone and what
remained read as a species of line noise laid over the world. The argument had
been made correctly and then not implemented — a dither's screen is compared
against a tone, it does not modulate the mark. The correction is one line in
spirit: `step(screen, tone)`, with the screen running 0 at a stroke's spine to 1
in the paper between two of them. A tone of 1 is then solid ink and the strokes
are what the *gradient* looks like, which is the whole difference between
hatching a picture and hatching a blend.

**Two tones, cut against one family read at two phases.** Coverage cuts the
silhouette, so a full cloud is unbroken ink and a thinning one opens into strokes
on its way to nothing. The key cuts the ramp: `floor` of the walk is the slot
already reached and the remainder is dithered into the next one, which is exactly
the banding the mode exists to break.

They were one screen first, on the argument that layering a single screen at
different thresholds is what a pen does. **That argument is true of a pen and
false of a dither**, and it was visible immediately: sharing a screen *correlates*
the cuts. In a shoulder the only pixels that survive the silhouette are the ones
nearest a spine, and those are precisely the pixels that pass the tone cut too —
so every shoulder collapses onto whichever slot is at its extreme, the grading
appears only where the veil is already solid, and each shoulder gets a tonal
fringe that reads as a rimlight.

**The obvious fix was a second family square to the first, and it failed for a
reason worth keeping.** Cross-hatch is what a pen does for a second tone, and it
decorrelates the cuts exactly. On a sphere it is also a *net*: two regular rulings
over a curved surface, meeting at every crossing, reading as wireframe laid over
the world rather than as ink on it. Two of everything made it worse, not better —
two pole degeneracies instead of one, and a regularity the breaks could not
disguise however hard they were pushed.

**What decorrelates without crossing is phase.** The second ruling is the same
family displaced along its own axis by the break noise, up to half a period. Same
direction, so there are no crossings at all; and a displacement of half a period
is as independent of the first ruling as a right angle was, because it is drawn
from a field the ruling knows nothing about. The strokes weave between each other
and merge where the phases meet, which is what a second tone in one direction
looks like drawn by hand. It costs one `asin` less than the cross did, and the
displacement rides the noise sample the second break was already paying for.

The displacement is the *faded* noise, so the weave dies where the grain can no
longer be resolved rather than aliasing the ruling it displaces — and both cuts
are weighed in the **clean** band's rate, never the displaced one's, for the same
reason the floor is.

**Crossing the rulings cost the breaks their gentleness.** Christoph screens a
smooth noise straight into the ruling, which lifts it a little everywhere and
shortens the strokes into dashes. Nothing is ever fully gone — which is fine for
one family and useless for two, because the pair then meet at *every* crossing
and the veil reads as a net over the world rather than as hatching on it. That
was the shape of the regression.

So `veilHatchBreak` stopped being a tint on the threshold and became a
**removal**: the noise is cut to a near-binary mask, and the slider is the
fraction of the surface where no stroke is drawn at all. Where the mask is up the
ruling lifts to 1, so that patch takes no ink *until its tone reaches solid* —
which is how a hard break still leaves a dense cloud unholed. The mask's own edge
is floored by the noise's rate per pixel, `veilCover`'s move on `uEdge`.

Each family breaks on **its own offset** of the noise, and that second sample is
what the break is worth paying twice for. Two families breaking in the same
places still meet wherever both survive, which is the net again; offset, the
crossings are sparse and the two read as strokes. It also fades to *nothing* at
Nyquist rather than to its mean, unlike a ruling — a mask stuck at its mean would
flip a whole hemisphere on or off as `veilHatchBreak` crossed a half.

**`veilHatchWidth` had to stop being a width.** A pure dither has no width knob;
width *is* the tone. What it has instead is a mark it cannot draw at *each* end
of the range: near 0 a stroke a fiftieth of a period wide, and near 1 a **gap**
of the same. Neither goes away with density — density is spacing, this is width —
so both persist as a hairline that sparkles rather than reads, dark ones through
the faint half of a veil and pale ones through its solid half.

So the field is a floor in pixels, applied at both ends: a stroke under it is
lifted onto it, and a gap under it is opened out to it. Symmetric, because the
two are one statement — **`veilHatchWidth` is the thinnest thing this pen draws**,
and a gap is a mark in the paper. Exact 0 and exact 1 survive it, so bare stays
bare and a solid cloud stays solid. The exchange rate falls out of the ruling's
own derivative — it runs 0 to 1 across a half period, so a mark of *w* pixels is
worth a tone of `w × perStroke / 2` — which is `contourAt`'s trick in its third
use and the reason a mark holds its weight at any widget size. The two lifts are
*composed* rather than combined with a `min`, or the second undoes the first over
the half of the range it was not meant to touch.

**A floor is a discontinuity, and trying to build one without a step produced a
slider that did nothing.** The first attempt at the low end was a remap onto
`[floor, 1]`, which stepped the whole scale up at once: the instant a tone left
zero it arrived a quarter solid, drawing a hard ring at every blob edge and every
ramp-slot boundary. The fix for that was a **geometric mean**, `max(t, √(t·floor))`
— smooth, meets the identity at the floor, returns to zero with no contour of its
own. It is also **not a floor**: `√(t·floor)` goes to zero with `t`, so it only
ever leans toward the value and every width below it still gets through. Dragging
the knob end to end moved a hairline by a tenth of a pixel and read as broken.

What it is now is a plain `clamp(t, floor, 1 − floor)`. The step is kept, because
any honest floor has one — a tone above zero owes at least one whole mark — and
made exactly `veilHatchWidth` wide, so what it draws is a hairline appearing all
at once at each contour where a tone leaves zero or reaches full. A *drawn edge*,
which is the thing the slider is for, and set to 0 there is no floor at all.
Clamped rather than remapped so the range between the two floors is untouched; a
remap buys the same two edges by compressing every mid-tone.

Its range runs to twelve pixels, well past a legibility fix, because past that
point it stops being one: as the floors close the tones between them are squeezed
out and the veil goes from graded to **two-level**, every mark either a minimum
stroke or a minimum gap. They meet at a tone of 0.4 and the picture stops
changing. It is the only slider in the group that speaks in the pen's units
rather than the field's, and that is worth a long rail.

The rate it scales is the **clean ruling's**, not the screened field's. Taking
`fwidth` of the composed screen puts the break noise into the derivative, which
spikes along every grain contour — and a floor multiplied by that draws a bright
edge around each blob in the noise. The one that finally showed on screen.

**The Nyquist fade could not be the field's fade.** An octave fades to *nothing*
when its period falls under two pixels; a screen that did the same would take the
veil's mass with it at the limb. It fades to its own **mean** instead — which is
what a mip of it would be — so the dither degrades to a plain cut at half tone
and a limb keeps its solid heart, losing only the grading across it. The breaks
fade the same way for `veilWarpAt`'s reason: a mask that sparkles puts the
aliasing back however carefully the stripes were band-limited.

**Two knobs cost the seven-ink guarantee, and they are not one knob twice.**
Both were asked for after the pure version had been seen, and both trade the same
thing — a partial alpha inventing a grey between the ink and the ground, exactly
as mode 0 does — but they spend it on different pictures.

`veilHatchSoften` blurs each mark's *edge* over that many pixels and leaves its
middle pure. At 0 the cuts are a raw `step`: pen ink, aliased, every pixel a ramp
slot, which is the discipline the whole density argument exists to keep. Above 0
the marks go misty. Softening in *tone* instead — mixing toward the next slot —
would keep the inks but read as banding, not mist.

**A blur has to be bounded at both ends of the thing it blurs**, and the first
version was bounded at neither. A ruling tops out at exactly 1, so ramping the cut
±reach ran off the end of the screen: at solid tone the midline between two spines
sat half way up the ramp and took half alpha, drawing a **pale line down every gap
of a region that should be unbroken ink**, and another at every slot boundary of
the shading, where the remainder comes back round through 1. The tone is widened
by the reach before it is cut, so tone 1 clears the screen's top and tone 0 its
bottom and softening touches only marks that have an edge to soften. That widening
then spends the reach off the *floor* as well, which would come out as a hairline
of `veilHatchWidth − veilHatchSoften` — nothing at all once the blur is wider than
the hairline. So the floor is the **sum** of the two: the thinnest mark is
`veilHatchWidth` across at half alpha with the falloff outside it, which is what a
soft pen drawing a hairline does. At width 0 the lift and the reach cancel and the
dither is plain, so it needs no guard.

`veilHatchAlpha` thins the whole sheet evenly and leaves every edge as hard as it
was, so **the faceted read survives it**, which is the point: at full weight the
hatch has only its density to say anything with, and density is already carrying
the silhouette. It is the subtlety knob, and the first one to reach for. The
outline is never thinned — a line at part weight is a smudge.

Both are per world, deliberately, so one world can be pen and its neighbour fog.

**Not built: the screen tone.** The video's other half is window-space diamonds,
which is the pixel-art dither under another name, and it spends a section
apologising for the aspect-ratio correction it needs.

### A drift is not a rate

`veilSpin` was the veil's whole rotation. The veil's group is a *sibling* of the
spin group, not a child, so authoring a cloud deck meant holding `spin` in your
head and solving for the difference — and a later edit to `spin` silently
re-meant every veil under it. It is a **drift over the ground** now: the veil
turns at `spin + veilSpin`, so 0 is a deck locked to the surface and travelling
with it, and either direction is how fast it pulls away.

Nothing downstream moved. `clock.veilAngle` is still an absolute angle and the
group is still a sibling; only what feeds `advanceClock` is a sum. The one thing
that had to follow is the idle guard — `isVeiling` tests the *sum*, or a veil at
`veilSpin: -spin` asks for frames it does not use and one at 0 over a turning
world stops asking for the frames it does.

The two veiled worlds were rebased so no picture changed — `first` 0.295 → 0.11,
`second` 0.125 → 0.035. The seven at `veil: 0` went to 0 rather than to
`0.05 − spin`: their 0.05 was never a picture, and 0 is the honest starting value.
`DEFAULT_VISUAL` with it.

The slider's ±0.6 is untouched, and it reaches further than it did: a veil
running *backwards* against its own surface used to need arithmetic to find.

### A grain in the paper

The body's fragment had no noise in it at all. Both of its quantisers are exact
level sets — the texture band and the shade level — so a smooth field crosses one
as a perfect curve, and a world with few `steps` is a stack of clean arcs. Three
fields answer it: `grain` displaces the texture band before its floor,
`shadeGrain` does the same to the shade level, and `grainScale` is the noise
under both.

**Two amounts, one sample.** They are two pictures — the world's own pattern, and
where the light falls on it — and a world can want its terrain broken up without
its terminator going with it. But the noise beneath them is one sample, not two.
The veil decorrelates its two cuts because they are one ruling read twice and
sharing collapsed every shoulder onto a single slot; here the two coordinates are
independent fields already, so a shared displacement is a grain in the *paper*
rather than a correlation — and it is one `snoise` instead of two.

Both amounts are in **slots**, which is what lets one number mean the same thing
in each: an amount of 1 is a wander of one whole band either way.

The Nyquist fade is `veilFbm`'s, constants and all, and is not optional — the
limb compresses the sphere hard and an unfaded grain fizzes there instead of
dissolving. To *nothing* rather than to its mean, unlike a ruling: a grain stuck
at its mean is a constant offset on the band, which is `bias` said badly.

**The contour follows the grained band, and is weighed by the clean rate.** The
band, so the line stays coincident with the tone edge it is the boundary of
instead of ruling a smooth arc beside a ragged one. The rate, because a rate
carrying the displacement spikes wherever the noise runs fast and a width divided
by it thins to nothing there — `ridgeAt`'s bug, one shader over, not repeated.

`simplex3D` moved above the surface shader for this, and `veilOriginOf` became
`originOf`: it is the world's noise origin now, read by the body's grain and the
veil alike, and there is still no second seed for either. Reseeding in the lab
moves all three together.

**The veil's outline follows its grain too.** Same disagreement, one shell up:
the hatch's silhouette is broken by `breakAt`, and its outline was a clean
contour of a field that knew nothing about the break — so a patch straddling the
line took the strokes away and left the ink ruling through the gap. `veilCover`
takes a `lineGrain` used by the outline branch and nothing else; the hatch passes
its own break noise, the alpha veil passes 0 and is unchanged. The wander is a
share of the line's own weight in pixels, so it needs no slider and holds at any
widget size.

**`veilHatchGrain` is `veilHatchGrainScale`.** It was always a scale, and with
`grain` on the body meaning an amount the two would have read as opposites.

### A window and what is behind it

The first harvest screen tells the decision's two facts in DOM alone —
`AlignmentPanel` on the left shoulder, the split in the middle — while the world
the decision is *about* says neither. The core answers the first of them, and the
window is what lets it be seen.

**The window is the fresnel, turned round.** `1 − |N.z|` is already the shade's
`rim`; `|N.z|` is the same reading the other way, so the front opens and the limb
stays whole. That is the whole of why it is this half and not the other: the
silhouette is where a world's shape is read, and it is the one part of the disc
that cannot be spent.

**It is an opacity, and that is a rule broken on purpose.** It was a dithered
cutout first, for the reason a cutout is always tempting here: a hard threshold
and a `discard` keep every surviving pixel a ramp value, so the seven inks hold
and the surface stays opaque. Where an alpha says half a body as a grey between
two slots, a cutout says it as a density of holes — the hatch's argument, one
layer down. It was seen, and it was wrong. A hole is all or nothing, so a
*barely* open window comes out as sparse confetti rather than as thin, and thin
is most of what this window is. The blend is worth an ink rule that was only ever
a rule about drawing, not about seeing through.

So this is the one mark on the world where a pixel is not one of the seven. It
lands between the surface's slot and the core's, and how much of the core
survives is exactly the body's alpha there — the body *thins onto* what it is
holding, which is the reading a hole could not give.

**The window has no grain**, and that went the way the cutout did. It carried a
speckle multiplied around a mean of 1 — the same opening, unevenly spent — and
the two readings were not the same picture at all. The window is a *clearing*:
the surface thinning until it is not there. Noise in it read as the surface being
*damaged*, which is a thing that happened to the world rather than a thing the
world is doing. So `clarityGrain` and `clarityGrainScale` are gone, and the whole
mark is one clean wash with `clarityGamma` deciding how far down the sphere it
reaches.

**The wash is steepened before it is spent.** A bare fresnel has no edge anywhere
on it — every point on the disc is a slightly different alpha from its neighbour
— and a window whose edge is everywhere reads as haze *over* the world rather
than as an opening *in* it. Which is the same complaint the grain answered
wrongly. So the fresnel is put through an S before the clarity is multiplied on:
the shoulders flatten, the middle steepens, and the whole falloff collects into
one band. `clarityGamma` then moves a rim rather than stretching a wash, which is
what a knob named for a falloff should do.

Twice, in the end — once was still a slope on a disc this size. The second pass
flattens what the first left of the shoulders and halves the band again. It is
composed rather than written as one steeper curve on purpose: the knob keeps
meaning what it meant, and there is one shape here applied twice rather than two
shapes to hold in mind.

**And then quantised**, which is where the alpha comes back into the fold. The
opacity was the one quantity on this world with a continuum in it, and the answer
was the one the surface already gives everything else: `claritySteps` fixed
opacities and nothing between. The window stops being a fade and becomes a set of
concentric plates, each a level, the way the terrain is a set of bands — and the
picture is not a compromise on the ink rule so much as the ink rule reaching a
second axis. Seven inks and a handful of veilings, still nothing between.

The lattice is fixed at 0 and 1 rather than laid across whatever `clarity`
reaches. So a level means the same thing on every world and at every setting, and
turning the clarity down drops plates off the open end instead of sliding all of
them — a window half open is *literally* the same plates as a window fully open,
minus the innermost ones.

**The veil opens with the body.** Both veil fragments take the same factor off the
same radial normal — the shell is pushed out along it, so the two fresnels agree —
and the veil's outline goes with it: a cloud that kept its contour over an opened
front drew a clean edge around a hole, which is the one thing that would make the
hole read as a hole rather than as thinning. It is `clarityAt`, shared, and the
uniforms are declared per shader the way `rampRead`'s are.

There is still a `discard`, for a fully open pixel only, and it is the **last
statement in `main`**. Every `fwidth` in that shader is above it, and a discard
makes the control flow non-uniform for everything after. What it buys is that a
window at full alpha leaves no depth write behind for the burst to be cut against.

**The alpha moved the body in the sort.** An opaque surface sorted itself by
being opaque; a transparent one has to be placed. It takes the bottom of
`RENDER_ORDER` at −2, so every opaque draw — the outline hull, the core, a placed
anchor — is on screen before the front blends over it, which is the ordering the
window exists for. Depth is still written at every alpha, so nothing that read the
body as a depth cue behaves differently for the front having gone thin.

The burst went from −1 to sitting *after* the body, which only looks like a
contradiction: it depth-tests on strictly-less against a body that has just
written its own depth, so every fragment the body covers is rejected and what
survives is the ring outside the silhouette — the same picture the opaque body
used to cut for it from the pass in front.

**The core is ruled in view space.** The veil's hatch runs in latitude on the
world's own axis, which is right for weather riding a surface. It is wrong here:
the core is a *reading*, a marked plane inside the world rather than a second
world, and a lean that meant a different angle depending on how the planet was
held would be no reading at all. So the ruling is off `vRel` — the fragment's
offset from the body's centre in camera axes, the depth idiom five shaders were
already using, spent on a direction instead. It does not turn, does not shade and
takes no key.

Negative and positive lean opposite ways. **Even has no ruling at all** — a bare
mid tone, saying that neither side was taken — and the cut is on the lean rather
than on the stroke width, so a world can author its hatch and still show a bare
core. The rate the stroke is weighed in comes off the unwrapped coordinate rather
than off `fract` of it: `fract` is discontinuous and a derivative of it spikes at
every seam, which would draw a heavy stroke down each one. `contourAt`'s argument,
in its simplest form.

**The inks are fixed, and there are three sets of them.** The ramp runs 0
`--surface` to 6 `--ink-900`, and the three readings take its two ends and its
middle: **positive is paper, negative is black, even is a mid-light grey**. That
ordering is the copy's rather than a palette's — service to others is the light
one — and it is the loudest signal on the screen, because it is the one thing a
glance has to get right. The lean of the ruling is the second reading underneath
it, not the first.

Each ruled end hatches **one step in from its own ground** — paper ruled at
`--ink-200`, black ruled at `--ink-700` — rather than both being ruled in the
ramp's darkest ink. A hatch far from its ground is a second mark sitting on the
core; a hatch one step off it is the ground itself, worked.

None of that is authorable, which is the point. Everything else the planet draws
is a world's own character, and this one mark is a reading — a reading each world
stated in its own colours would be one nobody could learn. It is the argument that
already keeps the veil hatch's axis off the sliders, spent on a colour.

The **souls in the core get a pair of their own per reading** rather than
borrowing the hatch's. A dot has to carry at a few pixels where a stroke only has
to be legible, and it is also why the swarm now takes a `lean` at all — a single
fixed soul ink would have disappeared on half the harvests.

Both ruled ends give the dot the core's **own ground** and ring it in the ramp's
far end: an arrived soul is a bubble the colour of the thing it went into, seen
by its rim. That is a stronger mark than a contrasting fill and a truer one — the
soul is not *on* the reading, it is in it — and at 4px the rim is what the eye
picks up anyway, which the outline argument already says everywhere else. Even
keeps the shape and spends its contrast *inside* the ramp rather than across it —
a step lighter than its ground, rimmed two steps darker — so its souls are as
legible as anyone's without either end of the ramp on them, and it is the absence
of the ends that says nothing was taken. It was rimmed in the ground's own tone
first, which is a rim only in the source: on screen it was a bare disc, and even
would have been the one reading whose souls had no edge at all. The ring's usual rule, the far end of the ramp from the fill, still holds
outside the core: out there a dot is over the world, not over a reading.

`strokeAt` moved up beside `rampRead` and `simplex3D` for this, which is
`simplex3D`'s own move for `simplex3D`'s own reason — a `const` is not hoisted.

**One mark, and the mark is the alignment.** Neither half is drawn unless a view
hands the world one, so `PlanetView` without an `alignment` is byte-identical to
what it was: no core mounted, `uClarity` at 0, and souls settling to `settleAt` as
before. The harvest stage is the only view in the game that passes one. That is
what lets `clarity` be authored per world in `planet-visuals.ts` without a list
row or a still ever showing a hollow planet.

**The core's rim is feathered**, on that same fresnel read the other way round
again — it shuts the core's own limb instead of opening the body's front. A disc
with a hard edge reads as a coin lying on the world; a disc that gives its edge
back to the ink reads as something inside it. That made the core transparent,
which is why it now has a `stack.ts` entry of its own at the bottom, under the
body and under the hull both. It writes no depth: nothing needs to know where it
is, and a feathered edge that claimed depth would claim it at full strength right
out to where it had faded to nothing.

**What the window opens onto is the outline's hull.** Wherever the core does not
reach, at least: the outline is an inverted `BackSide` hull, so what it draws is
the world's *far* hemisphere at
`outlineTone` — invisible until now except as the ring standing past the
silhouette. Through the holes it becomes the interior wall, and the core is seen
against ink rather than against the page. Not designed, but kept: a mid-tone core
with a pale ruling reads far better on it than it would on paper. If it ever wants
separating from the edge's own ink it needs a field of its own, and it does not
have one yet.

**Souls in the core take a third ink.** `soulFragment` discards anything inside
the rim and behind the sphere, which is every soul that has arrived — the core is
well inside that radius, so all of them would have vanished. `uCore` is a third
place a soul can be seen, tested on the same silhouette radius the ink already
switches on, and both halves are drawn there. Souls that are merely *behind* the
world are still gone: the ink rule is their depth cue and it does not know the
front has opened. That is a look to check, not a bug.

### Berths, not a separation pass

Souls staying with the world used to settle radially to `settleAt` and stop. They
now cross into the core from `berthEnter` on and take a **berth** apiece.

The straight line between the two would be the chord objection that keeps a rider
off a partly-travelled harness line — except that objection is about two points on
a *sphere*, and both ends of this are already inside the world. There is nothing
for a chord to cut.

**A Fibonacci spiral with a cube-root radius.** The plain spiral spreads points
over a sphere; the cube root turns that into a ball, since volume goes as r³ and
an untreated radius crowds every berth onto the shell. The index is the soul's
rank in the split — the same figure `travelOf` reads from the top of the deal — so
rank 0 lands at the middle and **the core fills from its centre outward** as more
of the swarm is given to it, rather than growing a crust. Berths are packed for
the whole swarm rather than for the merged count, so a drag fills more of them
instead of moving all of them.

**Radius and direction have to come from different sequences**, and the first
version did not do that. The plain spiral takes its latitude from the same
parameter as its radius, so the outermost berth was always at the south pole and
the innermost always at the north — and since the innermost has no radius to speak
of, the packing came out as a ball with a spike hanging off the bottom and nothing
at the top. It read exactly as it was: the souls sat low and never reached the
core's edge.

The radius keeps the rank, since centre-outward filling is the read. The latitude
moved to the **radical inverse** of the rank — van der Corput base 2 — chosen over
a golden-ratio sequence for one property: every *prefix* is well spread, not just
the whole. The core fills in rank order, so what has to look even is the first k
values for every k, and each new radical inverse lands in the largest gap left.

**Nothing is ever tested for a collision.** `berthWobble` spends a share of
`berthRoom` — half the gap to the nearest other berth — divided by the diagonal of
the three axes it is spent on, so at full wobble the *corner* of a soul's box is
that half-gap and two neighbours at their furthest still do not meet. The packing
is what does the avoiding; the wobble only spends what the packing left over.

That is the whole reason it is berths rather than a separation pass. A spatial
hash and a push-apart would want a velocity per soul carried between frames, and
the swarm is a pure function of `elapsed` — every soul's place comes from its seed
and the clock, so two views of one world agree without talking. The wobble rides
the soul's own `wobbleRate` and `phase`, already per-soul and already
decorrelated, so a core of arrivals mills instead of pulsing as one.

### The split has weight

The first version was correct and read as nothing. `travelOf` gave exactly one
soul a fractional travel — whoever sat on the boundary — so dragging the split
switched dots on and off one at a time, at the speed of the mouse. It was an
honest counter and it was not a decision.

Two knobs give it a body, and neither is worth much without the other.

**`crossing` is how many souls are in the air at once**, the width of the
boundary. At 1 it is the old behaviour. Wider and the boundary is a band with a
leading edge, so what the eye sees is a current running into the core rather than
a tally being kept. The share is scaled by `souls + crossing` rather than by
`souls`, so widening the band costs nothing at the ends: at a full share the last
soul still reaches a full 1 instead of stalling `crossing` places short of the
middle.

**`mergeLag` is how long the swarm takes to catch up** to a split that has
already moved — an exponential chase on the frame's own delta, not a fixed ramp,
so a drag is answered *at once* and only the tail of it is slow. That is the
difference between a heavy control and a laggy one, and it is the whole of the
feel: the number under the slider is right immediately, and the world takes a
beat to agree with it.

It is also the one thing in the swarm that is **not** a pure function of
`elapsed`. That rule is why the core is berthed rather than simulated, and this
carries a value between frames in plain violation of it. It is a much smaller
sin, and worth naming rather than hiding: one scalar for the whole swarm and not
one per soul, and it *converges* — two views of a world whose split has stopped
moving still agree on where every soul is. Only the drag itself is a view's own
business, and a drag is a thing a person is doing rather than a thing the world
is.

**Being hidden by the world is a soul's own commitment.** The swarm's far half is
cut at the body's drawn edge, which is right for a swarm that belongs to the
world and wrong the moment half of it is leaving: a soul still in orbit was being
clipped by a silhouette it is not going into, and at the rim that read as the
world eating it. So the travel figure is spent twice — once on where the soul is,
and once as how much of the body's silhouette it is subject to. A leaver is never
behind anything; a soul crossing sinks behind the world over its crossing. It is
spent on the alpha rather than on the discard because a half-committed soul is
halfway hidden, which no cut can say, and it costs one per-instance float.

**Arriving is the one thing the shader asks about the whole dot.** Everything
else in it is per fragment, and deliberately: a dot straddling the silhouette is
cut into two inks rather than switching whole, because switching whole reads as a
bug at 4px. The core test was written the same way and should not have been. A
berthed soul near the core's rim was inside it on some of its pixels and behind
the world on the rest, so it came out as the crescent of itself that overlapped
the core. Arriving is something a *soul* does. The test moved to the instance's
own centre, with the dot's radius added to the core's — a soul touching the rim
is in.

The radius it is tested against is **not the core's**, either. A berth sits
inside the core but the wobble rides on top of it, so souls on the outer shell
crossed a radius-tight boundary and came back as they milled — a flicker in both
the ink and the world's occlusion, on the one mark that has to be steady. The
figure the shader gets is the core plus everything the wobble can spend, which is
the swarm's own `berthRoom` times `berthWobble` and is a bound rather than a
fudge: it is exactly how far the outermost berth can reach. What it costs is that
a soul still crossing takes the core's inks a little before it lands, which is
the cheaper of the two — early is a soul arriving, and flicker is a bug.

### Open

The planet is in the game on the detail screen, and now in the Overview: a live
portrait in the detail column and stills on the Ahead rows. Behind and
Active are one prop away and wait on the size reading. Surface objects do not
exist, only the field they would query.

**A parameter sizes a world against another now** — `PlanetVisual.size`, above.
Every entry in `planet-visuals.ts` carries it at 1, so no authored world moved.

The first three things that came back from seeing the harness run are built:
`twist` runs to 2π, the souls' blend is a rider count, and the many-anchor figure
is the anchors' own edges with a crown on every one of them. The harness was then
tuned on the lab and pasted back — `DEFAULT_HARNESS` is a hand-authored record
now, `span` at 1 and `twist` at 0 among them — so the lines have been judged.
`riders` is still 0 there, and nothing yet says the rider count has been looked at.

Three more came back from that sitting and are built: the lines are tied to the
poles' tips, the swarm's per-band slider reaches a hundred, and `backHide` drops
the far side of the harness. Typechecked, built and probed; not yet seen.

The click is built too — a halo and its sparks, above — and it is the first thing
here that is not an authoring surface. It went out with two acknowledged
exceptions to the medium's rules and **came back with one**: the author saw it run
and the first round of notes off that sitting replaced the alpha fade with a true
inversion, which needs no exception because it owns no tone. What is left is the
spark's missing silhouette test, and that one is deliberate rather than
provisional.

The same sitting is where the halo's crop, the terrain-lying sparks, the flare,
the echo and the ink inversion came from.

A second round of notes then came back off the *sparks specifically*, and every
one of them named something real: a fragment shader was reading a uniform its
material never supplied, so `q` was 0 everywhere and every dot drew as a solid
quad — which is also what made the overlaps loud enough to report. That is fixed,
and with it the group is now one silhouette on one depth plane, the flare travels
between two heights and two tapers, the far half of a burst is quieter, and the
echo turns and scatters per flash. None of *that* has been seen running either.

## Aim

Karma is declared unrouted. `BuildingData.yields` is keyed by `YieldType`, which
is `ResourceType` plus the two **family** names (`karma`, `red`) — what data may
*declare*, as against what the ledger *stores*. `karma` is not a `ResourceType`
precisely so that `add('karma', n)` cannot typecheck against a pile that does not
exist. `aim.resolve()` turns a family into two credits at emission.

A cohort answers the global detent through `resistance`: 0 does as it is told, 1
is unaimable and sits fully on its own `polarity_bias`, pulled by the wave. What
was a continuous noise-driven drift is now `balance.aim.wavePull`, signed by
`Planet.isDense` — dense pulls negative, light pulls positive — so a resisted
cohort's lean is fixed for the whole phase and steps once, with the flip. Nothing
about it needs a clock of its own any more: `aim.resolve()` reads `PlanetManager`
directly, on the same tick the payout does, so the dial and the payout never
disagree without a `tick()` to keep them in sync.

**The re-aim penalty is not a `Modifier`.** Two reasons: it decays continuously
rather than expiring, which the bucket list has no shape for; and it is priced in
*phases*, so it is read off `Planet.progress` rather than a wall clock. That
matters — phases advance on accumulated experience, so a penalty that slowed
experience would extend its own duration. It therefore touches karma only.

### What the row shows

The row used to print `perSecond('karma')` — production over duration and nothing
else — while the payout multiplied that by `karmaYieldFactor` and by the planet's
bias. So the cohort with `polarity_multiplier: 7` displayed the same figure at
Even as at Hard negative while really paying several times more, and extremity —
the entire reward for committing — was invisible.

That figure is gone from the row now, along with every other rate: `CohortRow`
carries identity and the lean dial and nothing else, Cookie Clicker's own
arrangement — you hover the name to decide, and the row otherwise stays quiet.
`CohortTooltip` is where the full chain lives: one base line per yield, then —
for karma, once beat 6 has split the pile — the aim, the extremity payoff, the
wave, and the re-aim penalty while it is owed, each named, ending in the two paid
figures. It can afford to show the *paid* number rather than a settled stand-in,
because there is no drift term left to churn it: the wave pull is fixed for a
whole phase, so the figure a hover shows is the figure being paid until the next
flip.

**One definition of income.** `countKarmaPerSecond()` sums the same split the
tooltip displays, so the excess wall and the screen cannot disagree. The wall
still moves with aim and with the phase — see Excess below.

Note that nothing here *breathes*. `Planet.bias()` is a square wave, `1.5` or
`0.5` on `isDense`, so a rate sits flat for a whole phase and then jumps by a
factor of 3. Making bias continuous over `position` is a real option, but
it changes the average bias across a phase and the wall reads income, so it is a
balance change and not a display one.

### Lean is a dial

The meter was a flat track: 12px tall, a hairline at zero, a hatched span each
side, the word beneath. It cost the row **130px** — wide because a linear scale
has to be, and made wider by `unpredictable` being thirteen characters. Bent into
a half-circle it says the same thing in 44px. **12 o'clock is even and a quadrant
either way is a hard detent**, so full negative lays the needle flat to the left.

Nothing about the reading changed; only its coordinates. The two spans are still
two wedges, anchored at 12 o'clock rather than at a centre line, still dark-hatch
left and light-hatch right. What the arc buys is that **zero needs no mark**: the
wedges meet at it, and the only state with no wedge at all — even, with no
resistance — is the one where the needle already points straight up. The flat
track had to spend an element saying where zero was.

The needle is the one thing the track could not draw. It reads `realizedAim`,
**wave and all** — the wave pull that replaced drift (see *Aim*, above) still
belongs on the needle rather than in a figure, because it is a position: the
band a resisted cohort visits across one cycle, not a number that would have to
churn. It no longer creeps, though — it **steps once**, on the phase flip, and
holds. `#waveSign` returns 0 at `resistance: 0`, so the reading still falls out
of the geometry for free: a cohort you can aim has a needle that does not move at
all, sitting exactly on its wedge's outer edge, and one you cannot has a needle
that sits on one edge for a whole phase and then the other. That is what `tidal`
and `turns` name now — a schedule, not a temperament, because the wave strip
tells you which one it is doing next.

`unaimable` is the one state the geometry cannot separate, since `resistance: 0.9`
draws nearly the same band as `1`. The needle greys to `--ink-300` to say the line
is not yours to set. The word itself is now its own hint tooltip — `Tooltip`'s
`hint` variant, one line and no chrome — rather than the container's native
`title`; see `CohortTooltip` and the row redesign that cashed in `handoff.md`
§*Parked*'s hint-tooltip item.

A sector at an arbitrary angle has no primitive in this codebase. `Badge`'s `both`
cuts a hatched circle with `clip-path: polygon`, but a polygon is fixed and this
angle moves, so the wedge is a **conic-gradient mask** over a circle hung below an
`overflow: hidden` fold. First mask in the tree; the hatch stays a plain CSS
background, which is what keeps all three hatch scales one mark.

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

## The economy curve

Balance rationale for the cohort ladder — why a purchase decision exists at all,
and which authored numbers decide it. Nothing here is built yet; it is the frame
the balance pass is missing.

### One number, and it is a duration

**`payback = cost / marginal per-second`** — seconds of a purchase's own income to
repay it. Every buy decision in the genre reduces to *take the smallest one on the
shelf*, which is what `POLICIES.payback` already does. `paybackOf` is the whole of
it and `LadderRow` already carries the column.

### A crossing is structural, not tuned

Two things can be bought and they slope in opposite directions:

- **A copy.** Price of the k-th is `C·r^k`; the yield it adds is a constant `P`.
  Payback is `(C/P)·r^k` — rising exponentially in the count. Copies rot.
- **Something that multiplies the stack.** Fixed cost, marginal `k·P·(m−1)`.
  Payback falls as `1/k`. It ripens.

One rises and one falls, so they cross exactly once, and the design question is
never *whether* but *where*. Cookie Clicker places it by refusing to sell the
upgrade until 1 / 5 / 25 / 50 are owned — the ownership gate **is** the placement.

Two cohorts do the same thing with the falling line held flat: a cohort you own
none of has a fixed opening payback while the one you are buying climbs past it.
They meet at

```
k* = ln ρ / ln r        ρ = ratio of opening paybacks, r = cost_multiplier
```

Cookie Clicker runs `r = 1.15` with each tier opening about twice as dear per unit
of yield, so `ln2/ln1.15 ≈ 5`: five purchases, then a hop. **At `ρ = 1` there is no
decision** — a new tier is better the instant it is affordable and nothing is ever
revisited. At `ρ ≈ 10` it is `k* ≈ 16`, and the new tier is a wall rather than a
choice. Five is the figure to aim near, because it recurs often enough to be felt
as a rhythm.

### Ours is a sawtooth, because the multiplier is free

There are no purchased upgrades here. `upgrade_threshold` fires a level on the
count, and `(1 + yield_multipliers)^(L−1)` with `(1 − duration_reduction)^(L−1)`
multiplies the whole stack at once — so the two curves above are braided into one
rather than drawn side by side. Payback climbs `r^k` between thresholds and falls
off a cliff at each one.

```
seconds
  │                              ╱│
  │                        ╱│   ╱ │
  │              ╱│      ╱  │  ╱  │
  │      ╱│    ╱  │    ╱    │╱    │
  │  ╱│ ╱ │  ╱    │  ╱      │
  │╱  │╱  │╱      │╱
  └───┴───┴───────┴──────────────── count
      5  15      25             50
```

### The tooth ratio is the number that should be authored

Whether a cohort decays, holds or runs away is the height of a climb against the
depth of its drop:

```
tooth = r^gap / M        M = (1 + yield_multiplier) · 1/(1 − duration_reduction)
```

Above 1 the cohort is dying; below 1 it is getting stronger with every level; at 1
it holds station. Today it is implicit in three unrelated fields and nobody has
compared them. Measured on `buildings.ts` as authored, in each cohort's own cost
resource:

| cohort | M | gap 5 | gap 10 | gap 25 |
|---|---|---|---|---|
| `basic` | 2.38 | 0.85 | 1.70 | 13.8 |
| `steady` | 2.50 | 12.8 | 410 | — |
| `chaos` | 9.52 | 0.32 | **0.98** | 27.8 |
| `red_basic` | 3.75 | 0.54 | 1.08 | 8.8 |

Three readings fall straight out. **`steady` is a five-purchase cohort by
construction** — `cost_multiplier: 2` doubles its payback on every single copy, so
it opens at 0.4s, is behind `basic` by the sixth, and is unbuyable by the
fifteenth. **`chaos` never decays**: 0.98 across the gap-10 thresholds is dead
flat, so it holds sub-second payback from 0 to 50 and no other cohort can be the
right buy while it is on the shelf. **`basic` is the only one shaped like a
curve**, improving to 15, decaying gently to 25, then falling off at the 25-wide
gaps.

**`zealot` has `ρ = ∞`.** It is priced in experience and yields none, so its
payback in its own cost resource is undefined and `POLICIES.payback` can never
choose it. Either that is a deliberate karma-only luxury bought against a
different reading, or it is a slip; it is outside this system either way.

### The ladder cannot see the cliff

`marginalPerSecond` reads `#production` and `#duration`, which derive from the
level the *current* count has earned — so it prices one more unit at today's
multiplier and never at the one the purchase would trigger. The teeth are in
`buildLadder`; the drops are not.

That is not a rounding error. The buy that crosses a threshold is reliably the
best on the board by an order of magnitude, and it reads as the worst:

| | ladder says | actually |
|---|---|---|
| 5th `basic` | 26.2s | **3.3s** |
| 15th `basic` | 44.6s | **2.1s** |
| 25th `chaos` | 1.9s | **~0s** |

So both policies systematically refuse the one purchase a player reaches for, and
a run's shape is not the shape of a played game. The fix is a second column —
marginal measured as stack-rate at `k+1` minus stack-rate at `k`, which crosses the
level — not a change to either policy.

The UI is already ahead of the sim here: **`NEXT` on the cost head is exactly this
purchase**, the run to the threshold where the stack multiplier lands. That is the
genre's upgrade decision, spelled as a quantity mode.

### Levels become purchases

Built. The tooth-ratio table above diagnoses the system it replaced; it is not the
target.

`upgrade_threshold` does two jobs at once — it marks a milestone *and* hands over
the multiplier, free and automatic. That single conflation is why there is no
decision at a threshold (only one of the two curves is purchasable), why the
multiplier cannot ratchet across a merge (a reading of the count has to fall with
it), and why the ladder is blind to the cliff. Splitting the two jobs is the whole
change:

> **A count unlocks an upgrade. Buying the upgrade grants the multiplier.**

Four decisions on top of it.

**The level-replacements are priced in experience**, because the cohorts are. The
trade *upgrade or another copy* only exists when both come out of the same pocket;
in two currencies it stops being a trade and becomes two shopping lists. Higher
tiers may be priced in karma or in tokens, and are then rewards rather than
decisions — which is a fine job for them as long as it is the intended one.

**They gate on the current count, not the lifetime total.** `count_total` never
falls, so gating there would leave every upgrade a merge just burned sitting
unlocked and unowned — and the play that follows is to ignore souls and grind
experience for the shopping list, which is the opposite of a rebuild. Gated on
`count`, they re-lock on the merge and re-unlock one at a time as the ladder comes
back. `UnlockType` gained `'count'` beside `'count_total'`; the latter stays for
anything meant to stay earned. `isLocked` also read `<=` on the count branch
against `<` on the resource branch, so `count_total: 25` unlocked at 26; fixed
with it, along with a missing building reading as *unlocked* rather than locked.

**A merge takes them — but only the ones it drops you below.** That falls out of
the gate rather than being a second rule, and it is the whole of what makes the
slider weigh:

> **A `count`-gated upgrade is held only while its count is held.**

`UpgradeManager.releaseUnheld()` is that sentence, called from
`completeFirstHarvest` after `mergeSouls`, and it is the first thing in the game
that takes an upgrade away — `Building.removeModifier` finally has a caller. A
shallow merge costs a level or two; merging everything costs the ladder. Nothing
gated on a resource total or on `count_total` is touched, so the ratchet stays
where it was put: harvest income, refinery grades, tokens.

An earlier draft of this section had the merge burn *every* cohort level. That is
a worse rule for a plain reason — it makes the merge fraction and the upgrade loss
independent, so the slider stops carrying the cost and the decision flattens back
into the thing it was meant to replace.

**The price is one product, and it is the pacing knob:**

> **how many you own at the gate** × **how much better it makes each one** ×
> **what one more copy costs there**

That lands the upgrade at exactly the count where it overtakes another copy, so it
is worth buying the moment it unlocks. Under that price it is a treat; over it, a
goal to grow into. One authored number per upgrade, replacing a pace that
currently falls out of three unrelated fields in two files.

### Generated, not retyped

A level is one multiplier applied five times, so authoring five near-identical
entries by hand is how the fifth drifts from the first.
[`cohort-levels.ts`](../src/data/cohort-levels.ts) generates them from the
cohort's own figures, and `buildings.ts` keeps `upgrade_threshold`,
`yield_multipliers` and `duration_reduction` as **the authoring for that
generator**. `Building` reads none of the three now. The sim's balance params
still sweep them and still mean what they meant.

Per cohort it authors three placeholders — `through`, `priceFactor`, and
`pricedOn` where a cohort yields none of its own cost currency. `through` is the
last gate worth writing: at `cost_multiplier: 1.15` `basic`'s 200th copy costs 6.9
*trillion*, so the tail of every threshold list was decoration, and the lists now
stop where the cohort dies and let a later one carry the game — which is what the
tooth ratios already said.

`zealot` is the `pricedOn` case: bought with experience, yields only karma, so its
improvement is measured on karma while its price stays in experience. The units
work out because *how many copies is this worth* is a ratio — but it is also the
same `ρ = ∞` hole as before, wearing a price tag.

| | levels | gates | prices |
|---|---|---|---|
| `basic` | 5 | 5 → 75 | 69 → 18M experience |
| `steady` | 2 | 5 → 15 | 4_800 → 15M experience |
| `chaos` | 4 | 5 → 50 | 2_600 → 600M experience |
| `zealot` | 2 | 5 → 15 | 1.5M → 260M experience |
| `red_basic` | 3 | 5 → 25 | 1_400 → 110k red |

**Every one of those prices is the rule applied honestly to placeholder cohort
data, so the odd ones are diagnoses rather than mistakes.** `steady`'s first level
costs eight times its own ladder underneath it, because `cost_multiplier: 2` makes
the fifth copy cost thirty-two times the first. `zealot` opens at 1.5M. Both were
already true; the price tags are the first thing in the game that says so out loud.

`basic/str_1` moved from `count_total: 25` to 60, off `level_3`'s gate — a
karma-priced reward should not land on the same count as an experience-priced
level.

The texts are generated too, and are placeholders that read their own effect list
so a description cannot claim a figure it does not carry. They want real copy.

### What burning the upgrades costs

An upgrade multiplies everything owned at once, so at 50 copies a ×2.38 upgrade is
worth **69 more copies** and costs about what 69 copies cost. That makes upgrades
the largest purchases on the board by a wide margin. For `basic`: all 50 copies
from scratch is ~36k experience, and the four levels through that count come to
~376k.

The proportional burn is what keeps that from being a wall. A merge that drops you
from 50 to 40 releases nothing — no gate is crossed. One that drops you to 20
releases two levels and asks ~6k to rebuild them; one that takes everything asks
the ~376k. **The slider now prices its own consequence**, which is what it was
missing.

What is still open is the other side of it: the harvest payout is anchored at
roughly 30% of income at departure (see *What a finished world pays*), and whether
that repays a deep merge has never been measured. It cannot be settled by
argument — it wants a sim run, which this unblocks.

### The reading a row gives

`Building`'s level state is gone: `#level`, `#levelProgress`, `#levelFor`,
`#syncLevel`, `#calcLevelProgress` and the `level` listener bucket with them, and
`#production` is now base-and-modifiers with nothing reading the count. The merge
bug those were written to fix — a level that climbed but never fell — stops having
anything to be wrong about.

What replaces them is two readings, and the first draft collapsed them into one.
`tier` was written as *gates the count has passed* — what is unlocked — which is
the wrong half to print. Buying **Tier IV** and watching the row already say
tier 4 makes the purchase look like it did nothing; the number has to be the one
the purchase moves.

So they are split:

- **`#gatesPassed`** — gates the count is above. Private, and printed nowhere.
  `isMaxLevel`, `currentThreshold` and `nextUntilThreshold` read off it, so `NEXT`
  on the cost head still buys the run to the gate.
- **`tier`** — levels *owned*, counted off the modifier ids the level upgrades
  add (`level_N:index`, distinct `level_N`). Not asked of `UpgradeManager`, which
  imports `BuildingManager` and would close a cycle. A release takes its
  modifiers with it, so a merge takes the tier down for free.

The row prints both and may not call either one `next` alone: `tier III · next
unlock in 10`. Roman, because it names `Tier III`, and an upgrade title numbers
itself the way `Shorter Lives I` does.

`levelProgress` had no consumer and is not replaced. The word `tier` is still a
placeholder; `level` was retired because nothing levels any more.

### A rail wants one chip, not a catalogue

The rail was revealed at ten souls and the click's seven upgrades all unlock
between 40 and 900 experience — so it arrived holding five click chips, `3 more`,
and the first cohort tier sorted in behind them. Two changes, and the second is
the one that matters:

- The beat moved to **five souls**, which is the first cohort gate. A rail that
  appears a beat after the thing worth buying is a rail that teaches nothing.
- `building:main`'s ladder is now **paced, not priced**. Two land early — one per
  axis, which is the whole tutorial — and the other five are spaced to interleave
  with the cohort ladder and the two `global` upgrades. Their gates are the
  authored figure; their ids are not the order they arrive in.

> The pacing rule survives; the *two axes* do not. The three `speed_*` chips are
> gone and `str_1` is the whole tutorial — see *The press is instant* below.

The general rule this is the first instance of: **an upgrade bucket whose
`unlocks_at` are all cleared before the rail exists is not a ladder, it is a
backlog.** Nothing enforces it — a sim run that priced upgrades would catch it,
which is the *ladder prices no upgrade* gap below.

### The rail belongs to the screen under it

The rail showed every bucket at once, which made it a second catalogue with a
five-chip window rather than a place to act. It now shows **the active screen's
upgrades and the `global` ones**, filed by scope with no new authoring:
`building` / `cohort` / `cohorts` / `harness` → Details, `planet` → Overview,
`refinery` → Refinery. `global` owns no entity and so is filed under nothing,
which is exactly what makes it show everywhere.

The argument is `spotlight`'s, read forwards. A rail chip lights its target on
the screen below it; a chip whose target lives two tabs away could only ever
light nothing. Scoping the rail to the screen makes every chip in it point at
something you can see.

What the rail stops showing, the header has to say — so each tab carries a
**count of what is buyable behind it right now**. Affordable and not merely
available: an upgrade you have unlocked and cannot yet pay for is a standing
fact, and a tab marked at all times is not a mark. It lights when your wallet
reaches something on a screen you are not on and clears when you spend, needing
no seen-set in the save.

Two deliberate omissions. `global` is counted under no tab, being in the rail on
every screen already. And the count is drawn on the **active** tab too — a
section is a live reading and one that blanked on arrival would read as the
count having changed rather than as you having gone there.

The catalogue window is untouched: it is the complete list, which is its job.

**Globals are pinned in the rail.** Scoping created one hole: `global` is the
only bucket filed under no tab, so it is the one thing no pip counts — and sorted
on distance alone a cheap global could be pushed out of the five slots by a
screen upgrade you happen to be further past, disappearing with nothing in the
header to say so. The rail's order is now *affordable first, then global, then
nearest*. Affordability outranks the pin because the top slot is the one worth
acting on, and a global still half a fortune away has no claim on it; inside each
group the catalogue's own "nearest to affordable first" is untouched.

**The order is a placement, not a ranking.** Sorting on `cost − held` meant the
rail re-ranked on every tick that moved a resource, and worst while spending: an
upgrade you are close to crosses the affordable line and recrosses it repeatedly
as income lifts you and a purchase drops you back, so the chips reshuffled under
the cursor at the one moment you were reading them. This predated the pin — the
affordability key only made it visible, since crossing the line is a jump to the
front and spending it is a fall back.

The rail now settles its order on the **set** of available upgrades and holds it
until that set changes — an upgrade bought, or one newly unlocked. Between those
nothing moves. The rows stay live; it is where they sit that is held still.

Nothing is lost, because position was saying what the chip already says:
affordability is `ChipStatus`, drawn in the chip's own ink. A reading carried in
the border does not need the running order to carry it a second time. The general
rule: **a continuous quantity may colour a thing in place, but it may not decide
where the thing sits.**

Considered and rejected: a global pip on the score cell. A pip means *there is
something buyable you cannot see from here*, and a global upgrade is in the rail
on every screen — the mark would light while the chip it names sat inches below
it. The score cell is also not a tab, so it has nothing to act on, and it reads
experience while both globals are priced in positive karma. Worth revisiting only
if `global` grows past its two entries into a bucket with a ladder of its own.

### An army is a ramp, not a yield

How many of a thing you end up owning is set by `cost_multiplier` and almost
nothing else. The price of the next copy curves upward geometrically while income
climbs roughly straight; where they meet is the count, and that meeting point
moves with the *ramp*. Yield sits inside a logarithm.

The figure worth remembering: **for `basic` at 1.15, doubling every soul's output
buys about five more souls.** Not twice as many — five. For `steady` at 2.0 it
buys *one*. Which is why "make them weaker so there can be more of them" has the
causation backwards: potency is not what is holding the count down.

**To multiply the army by k, take the k-th root of the ramp.** That is the whole
rule. Equivalently, to author it forwards: pick the count a cohort should top out
at and what its last copy should cost, and the ramp is `(budget ÷ base cost)`
raised to `1 ÷ count`.

#### The retune

Every cohort now tops out around 200, holding each one's *final copy price*
within a few percent of where it already was — so the ceiling moved and the
budget did not.

| cohort | ramp was | now | capped near | now caps at | 200th copy |
|---|---|---|---|---|---|
| basic | 1.15 | 1.054 | 75 | 200 | 185k xp |
| steady | 2.0 | 1.053 | 15 | 200 | 612k xp |
| chaos | 1.25 | 1.057 | 50 | 200 | 1.31M xp |
| zealot | 1.5 | 1.031 | 15 | 200 | 4.48M xp |
| red_basic | 1.15 | 1.018 | 25 | 200 | 1,772 red |

Yields were deliberately **not** touched — the game stalls, so the extra income
from a bigger army is the point rather than a side effect to cancel.

Three consequences, and the third is the one that set the shape:

- **The gate list stops being fiction.** `[5, 15, 25, 50, 75, 100, 125, 150, 175,
  200]` ran to 200 for four cohorts that never passed 50. Now every cohort
  reaches the top of the same list, so `through` in `cohort-levels.ts` is one
  figure for all five instead of five guesses.
- **The teeth get shallower.** Tooth ratio is `ramp^gap ÷ level multiplier`, and
  the gaps widened by roughly what the ramp flattened by. `basic`'s worst tooth
  falls from **13.8 to 4.5** — the ladder decays noticeably less between gates,
  which is a real improvement and not something that was aimed for.
- **Six rungs, not ten.** `duration_reduction` compounds per tier, and ten of
  them take `basic` from 3s to 47ms and `chaos` to 20ms — fifty emissions a
  second, each one a reactive write, with no floor anywhere in `ResourceEmitter`
  to stop it. Six leaves `basic` at 248ms and `chaos` at 125ms. **The count was
  never the constraint on the gate list; the clock was.**

#### The gate ladder

`[5, 35, 70, 110, 155, 200]`. Gaps of 30/35/40/45/45, and the widening is the
whole point.

Two things pull against each other. **Even gaps pace evenly** — because the cost
curve is exponential, evenly spaced gates make each leg cost a constant multiple
more than the last, which is the incremental-game standard. But **even gaps give
a flat tooth**, and the last one then dips: the final rung comes out *easier*
than the four before it, which is the wrong direction to end on.

Widening gaps buy a monotonic tooth at the cost of some pacing evenness. Three
ladders, measured on `basic`:

| ladder | gaps | teeth | last leg | monotonic |
|---|---|---|---|---|
| `5, 25, 60, 100, 150, 200` | 20/35/40/50/50 | 1.20 → 2.65 → 3.45 → 5.83 → 5.83 | 92.8% | yes |
| **`5, 35, 70, 110, 155, 200`** | 30/35/40/45/45 | 2.04 → 2.65 → 3.45 → 4.48 → 4.48 | 90.6% | **yes** |
| `5, 45, 85, 125, 165, 200` | 40/40/40/40/35 | 3.45 ×4 → 2.65 | 84.1% | no |

The middle row sits between the other two on every column and is the only one
that is both monotonic and unpeaked — its worst tooth is 4.48 against 5.83 and
its legs run 6.7×/8.6×/11.0×/10.7× against a perfectly flat 8.2×.

**The figure that reframes all of this:** reaching gate 70 costs about 3,600
experience; reaching 200 costs 3.4 million. **The final leg is ~90% of the entire
climb** whichever ladder you pick, and every gate below 110 happens inside the
first 1% of it. So the early gates are nearly free to move and are really about
teaching the mechanic; the only positions that touch pacing in any felt way are
the last two. That is worth knowing before anyone spends time tuning gate three.

#### What had to move with it

Anything denominated in raw souls goes slack when the army grows and has to take
the same ×5:

- `mergeMinimum` — 10/70/200 → 50/350/1000. Left alone the merge floor would sit
  near 1% and the toll would stop being one. **This rescale was the wrong fix and
  it broke the run in the other direction** — the ladder cut population rather
  than growing it, so 1,000 souls became unreachable. It is a share now; see
  *Denominate everything relatively*.
- `riders` — 40/400 → 200/2000, and `carry_1` down from 1% to 0.2% a soul so it
  lands on the same +40%/+400% it was designed for.
- The cost-ramp slider in `params.ts`, which had a 0.01 step. At these values one
  notch is a doubling of the army.

#### The one to watch

**`steady`.** Its 2.0 ramp was the only thing holding 250 experience and 500
karma a soul in check, and flattening it to 1.053 takes that brake off entirely —
a 13× bigger army on the game's richest per-soul figures. It is the cohort most
likely to need a yield cut despite the standing "don't touch the yield", and the
first thing a sim run should be pointed at.

### An upgrade for all of them needs a poll, not a callback

The `cohorts` bucket was authored and inert: `#processEffect` handled `refinery`
and `harness` — the scopes with one singleton behind them — and then bailed on
anything else naming no entity, so `All cohorts · −6% return time` bought you a
line in the log and nothing else. It was parked behind a billion karma to keep it
out of reach while that was true.

Routing it is four lines. The interesting part is the bug every fan-out has:
**it lands on the members that exist when you buy it.** Unlock `zealot`
afterwards and it never gets the modifier — and the natural fix, having
`BuildingManager.unlock` tell `UpgradeManager` about the new building, closes an
import cycle, because `UpgradeManager` already reaches the other way.

So it is reconciled rather than notified. `ModifierSet.add` drops a repeat id, so
re-applying every held fan-out is free, and `syncFanOut` does exactly that beside
`acquireUnpriced` on the loop. **A poll where a callback would need a cycle** —
the same trade `acquireUnpriced` already made, for the same reason.

Two smaller things worth keeping:

- **Who counts as a cohort is answered by class, not by exclusion.**
  `BuildingManager.cohorts` filters on `instanceof Cohort`, so the click is out
  of `All cohorts` without anyone writing a rule that says so.
- **`boost`, not `mult`.** The two entries sum to −18% rather than compounding to
  −17%. A global shortening of every life should add up the way a player reading
  two percentages expects it to; `ModifierSet` gives that for free by summing the
  `boost` bucket.

`hard_season` had twice `shorter_lives_1`'s effect at under a hundredth of its
price. That inversion was invisible while both sat behind an unreachable gate,
which is the argument against parking an entry instead of finishing it.

### The hand rides with the crowd

The press is the one producer that cannot be bought more of, so it is the one
that falls behind by default: every other line scales with a count and the hand
scales with nothing. `carry` is the first upgrade axis that fixes that, and it
borrows the population rather than inventing a number — **the click gains a
share for every soul riding the harness**.

**It belongs to `building:main`, not to `harness`** — the first draft put it in
the harness bucket because that is where the count comes from, which is the wrong
question. A bucket answers *what does this change*, and the answer is you: the
harness is unaffected by it, and the scope column would have said `HARNESS` for a
row that moves the press. It reads the harness; it is not one of its axes.

So the modifier is held by `Click`, and `Building.modify()` is what lets a
subclass ask its own set about a stat the base has no opinion on — `#modifiers`
stays private. Three figures, and each one is somebody's job:

- **`riders`** — the harness's cap, bought. Already existed.
- **`riding`** — `min(riders, incarnating)`, and 0 until an anchor is down. Souls
  held on the split are out: a soul *placing* the harness is not riding it. The
  harness owns this because it is a fact about the harness, and it is a count and
  nothing else.
- **`carry`** — what one of them is worth to you. Held by the hand. The new axis.

The shape is deliberately linear and deliberately capped. On one entity that is
a straight line in riders; the same modifier on a cohort would be quadratic in
souls, because a cohort's yield is already multiplied by its count — that is the
reason this lives on the click and should stay there. The ceiling is then a
purchase (`riders_1`, `riders_2`) rather than an accident, which is the coupling
worth having: buying riders now pays twice.

Two things fell out of building it.

- **A payout is not a production.** `production` stops short of `yieldScale`, and
  the Details button was printing it — so the press would have said `+5` and paid
  `+25`. `Building.payout()` is the same expression `#generateResources` spends,
  for the reason the `yieldScale` comment already gives: a readout that
  recomputes is a readout that drifts.
- **A `flat` is not always a count.** `carry`'s value is a share per soul, so
  `+0.01` was the wrong reading of a true figure. `RATE_STATS` in `labels.ts`
  names the stats whose `flat` prints as a percent. It is a list of one, and the
  next rate-valued stat joins it rather than special-casing itself.

### An alignment is read before the merge, not after

`PlanetManager.completeFirstHarvest` read `getFirstHarvestAlignment()` on the
line that hands it to the planet — after `mergeSouls` and after `releaseUnheld`.
Excess is unpaired karma over a wall, and **the wall is karma income**, so both
of those lines shrink the denominator: the souls go, then the levels the merge
dropped you below go. A screen reading Even locked as a side, every time, with a
numerator that never moved.

The fix is to read it first and pass it down. The general shape is worth keeping:
*a reading taken at an event must be taken before the event's own destruction,
not somewhere inside it* — and the tell is that the screen and the outcome
disagreed while both called the same function.

This also means the `evenBand`-vs-`excessGate` mismatch (2% band inside a 12%
doorway on `first`, inside 5% on `third`) is a **separate, still-open** balance
question, and not what was causing the karma. Parked, not fixed.

## Known gaps

Things that are simply unbuilt, and what they cost today.

- ~~**The soul split has a control, on one screen of two.**~~ Closed — Details
  carries the same `SplitControl`, on `job="anchoring"`. It is drawn **only while
  `harness.isPlacing`**, not from the beat on: off-phase there is no anchoring job
  to feed and the Refinery keeps its own lever, so a split left on Details would
  be one you can drag and cannot spend.
- ~~**The recurring harvest has structure, no numbers.**~~ Closed — all three
  worlds declare a `harvest`, and both banked fields are consumed: `alignment`
  picks what it pays, `merged` picks how fast. See *What a finished world pays*.
  The figures themselves are placeholders and `third`'s experience curve puts it
  out of reach; both are balance, not structure.
- ~~**The `harness` bucket in `data/upgrades.ts` is empty.**~~ Closed — seven
  entries across its three axes: `slots`, `riders` and `step`. All placeholder
  figures. `carry` reads the harness but is not one of them; it is a
  `building:main` upgrade, and *The hand rides with the crowd* says why.
- ~~**The refinery runs behind six stubs.**~~ Closed — the screen is drawn. See
  *The refinery screen* below. What is left on it is balance, not structure.
- ~~**Red has no sink.**~~ Closed — the three purchases exist and the grade table
  is their buyer. What is still missing is a sink for **yellow and blue**: they
  are a ladder with nothing at the top, and inventing a spender is its own
  decision.
- ~~**Nothing travels.**~~ Closed — `PlanetManager.reach` is the verb and the
  Ahead band is where it is taken. See Overview below.
- **The header reads amounts, never rates.** Every `Value` in `Frame.svelte` is a
  pile, so nothing on screen says how fast a pile is filling — the one place the
  question is always live. `detail.status` is still a `RevealStub` noted as *the
  per-second rate line*, and the Overview's Behind band already draws `/s` from
  `sumHarvestRates`, so the register exists and the header does not use it.
- ~~**Levels are still free and automatic.**~~ Closed — see *Levels become
  purchases*. What is left on it is balance: `through`, `priceFactor` and the
  harvest payout that has to repay a deep merge, none of which is measured.
- ~~**Nothing expires anything yet.**~~ Half closed — `releaseUnheld` is
  `removeModifier`'s first caller. The re-aim penalty is still deliberately not a
  modifier; see Aim.
- **The ladder prices no upgrade.** The level cliff is gone from
  `marginalPerSecond` — with the multiplier bought rather than earned, a copy's
  marginal is genuinely flat between upgrades and the column is now honest. What
  replaced the gap is that the upgrade *itself* is a purchase neither `buildLadder`
  nor either policy prices: `run.ts` takes every affordable upgrade the moment it
  can, so a swept run never weighs *upgrade or copy* — the one decision this
  whole rework exists to create.
- **No 'next phase in mm:ss'.** Now trivial and worth doing: a phase closes at a
  fixed duration, so the countdown is `phaseDuration × (1 − throughPhase)` with
  nothing to estimate. `formatClock` is the format and `PlanetSection` is the
  place. This was a real research problem against the old experience ramp and
  stopped being one the moment the wave became a clock.

The first of those wants one thing that does not exist: **a summed per-second
reading**. `Building.perSecond(type)` is per cohort and no manager totals it, so
a header rate would sum the cohorts itself. Build the total once, on
`BuildingManager`, before it.

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
| 1–12 | — | — |

Beat 11's asterisk is gone: the Refinery's Split module sets `reserve`, so its
trigger is satisfiable by playing. Beat 12 joined the column when reaching landed
— it is the only beat that reveals nothing.

Stubs: **3 of 35**, all on Detail. Detail 5/8 · Overview 5/5 · Harvest 4/4 ·
Refinery 7/7. `reading.excess` and `reading.tokens` are both real. The refinery
engine landed without moving this line — a running system and a drawn panel are
counted separately here for exactly that reason — and step 9 moved it twice.

### The course

Ordered by what each step unblocks, not by beat number. Every step is a pickup
point: it lands on its own and moves at least one number in the gauge.

| # | Step | Moves | Blocked by |
|---|---|---|---|
| ~~3~~ | ~~`excess` in `context.ts`~~ | ~~beat 7, half of beat 9~~ | **done** — see Excess below |
| ~~4~~ | ~~A caller for the first harvest~~ | ~~beats 9, 10~~ | **done** |
| ~~2~~ | ~~A path from data to `PlanetManager.unlock`~~ | ~~beat 8~~ | **done** — see Scopes below |
| ~~6a~~ | ~~The soul split~~ | ~~`reserve`, beat 11~~ | **done** — see Souls above |
| ~~6b~~ | ~~The refinery engine~~ | ~~nothing visible~~ | **done** — see Refinery below |
| ~~1~~ | ~~Author the `global` bucket~~ | ~~beats 5, 6 onto real triggers~~ | **done** — see Scopes below |
| ~~8~~ | ~~Travel~~ | ~~beat 12~~ | **done** — see Overview below |
| ~~5~~ | ~~`PlanetData.harvest`~~ | ~~merged planets actually pay~~ | **done** — see *What a finished world pays* |
| ~~9~~ | ~~The token purchases — Ochre, Indigo, opposite Crimson~~ | ~~red gets a sink~~ | **done** — see *The grades are bought above the refinery* |
| 7a | ~~Refinery layout~~ | ~~6 stubs~~ | **done** — see *The refinery screen* |
| ~~7b~~ | ~~Harvest layout~~ | ~~2 stubs~~ | **done** — see *The harvest screen* |

**Step 2 was supposed to be the keystone. It was half of one.** Discovery landed
beat 8 on its own trigger, but beat 12 asks for `planetsFinished >= 2` and a
discovered planet is not a reached one — nothing calls `PlanetManager.select`
after mount.

Step 8 was where it got interesting, because the ladder as authored was
**circular**. `overview.setOut` was *"depart for the next planet"* and beat 12
revealed it — but beat 12 fires on two finished planets, which leaving is how you
get. Reaching could not live behind `setOut` without making the last beat
unreachable by construction. It is resolved, and `setOut` is gone; see Overview.

Step 1 was billed as buying the least, and it retired no stubs — but it emptied
the floor-only column. With step 8 done, every beat now fires for its own reason
and the gauge's third column is empty too.

Step 6 split in two and both halves are done, which is why step 9 is new: the
refinery makes red on a clock now, and nothing spends it. `reserve` is the
non-incarnating side of the soul split, not the kept side of the merge split — an
earlier reading of this doc had that wrong.

**Step 6b moved no number in the gauge, on purpose.** It retired no stubs and
lit no beat; it put a system under a beat that was already reaching. That is the
shape the gauge cannot see, and the reason to read it next to the course rather
than instead of it.

### The design lives in `design.md` now

**Done.** [`design.md`](./design.md) is the current statement of the design and
**supersedes CONTEXT v3**, which is retired — the two places it had been overridden
without amendment (§3.5 by Refinery, §3.2 by Excess) are stated correctly there
along with everything else.

The division from here: `design.md` says **what the game is**, `progression.md`
says **how it got there and how it is built**. Nothing in this file is deleted —
the arguments are the record, and `design.md` carries only their conclusions. When
a design decision changes, amend `design.md` first; a section here becomes the
account of why it moved.

Writing it turned up four figures this file argues from that `balance.ts` and
`planets.ts` have since moved past — `evenExperienceBonus`, `clickMs`, `perWorker`
and the third world's anchor durations. They are tabled in `design.md` §18 and the
`perWorker` one is not cosmetic: the anchoring phase currently runs about ten times
faster than the argument in *Progress is a time* was written against.

### The comments want the same pass

A sweep over source comments, aggressively cutting. A comment earns its place by
saying what the code cannot: why a number is that number, what a shader's maths
is doing, which visual reading a branch is protecting. A comment that restates the
line under it, or re-tells an argument this file already owns, is deleted rather
than shortened.

The shaders and the visual logic are where the exceptions live and are expected to
stay dense — a GLSL block genuinely does not say what it is for. Everything else
runs lean.

### Refinery — engine built, screen not

**Matching happens inside the refinery, and it is the only thing that does.** One
draw serves both lanes and the **shorter pile caps it**, so a matched pair of
karma becomes a matched pair of Crimson. Polarity still survives the step; what no
longer survives it is the *imbalance*. Ochre is still bought above, with equal
parts Crimson, and the opposite Crimson is still bought at a steeply scaling
price. CONTEXT v3 §3.5 was right that pairing belongs in the refinery and wrong
about what pairing emits — polarized Crimson, not Ochre. Amend or annotate §3.5;
do not re-derive the question here.

This replaced two independent lanes, each drawing from its own pile as fast as it
could. The old shape was neutral on excess by construction — take the same amount
off both piles and their difference is untouched — and then *worse* than neutral,
because once the shorter pile emptied the surviving lane ground the surplus away
on its own. **The refinery was quietly cleaning up after the player**, which is
the whole reason excess never read as dangerous. Sharing one draw traps the
unpaired remainder in karma, where the aim dial is the only thing that can reach
it, and stalls the machine outright when a pile hits zero. The stall compounds:
a stalled refinery moves no karma, so it earns no levels either. That is
deliberate, and `invert` is the paid way out.

What that makes the refinery is a **mix** problem sitting on a throughput one.
Three axes still buy the ceiling — X karma every Y seconds — but the ceiling is
now reachable only as far as the weaker karma stream allows, which is why
`RateCeiling` draws bought-but-idle capacity as its own span rather than folding
it into the backlog. The two are different problems: the ceiling answers to
slots and levels, the mix answers to nothing but the dial.

The `refinery` bucket holds one upgrade for each axis:

| axis | moves | how |
|---|---|---|
| staffing | reserved souls working it | `min(reserve, slots)`, linear on the batch |
| efficiency | the X — karma per batch | `yield` modifiers |
| speed | the Y — seconds per batch | `duration` modifiers |

**The staffing knob is closed.** Staffing is a linear multiplier on the batch,
and bought *slots* cap how many souls can work. It appears in X and never in Y —
in both, throughput would go quadratic in souls and the other two axes would be
decorative. Slots pay off exactly when there are souls to fill them, which
couples the split to the upgrades instead of stacking with them.

That leaves efficiency and staffing both scaling X, which is only worth keeping
apart because they are *paid* differently — staffing costs incarnations every
second it is held, efficiency is bought once. Batch and interval stay genuinely
distinct for a separate reason: at equal throughput, big slow batches leave karma
sitting unrefined longer, and unrefined karma is exactly what excess measures.

**The level is not a fourth axis.** All three axes above only move when something
is bought, so throughput is a step function of the upgrade table and flatlines
when that table runs out. The level is growth the refinery *earns by running*,
and it earns it the way `Building` does: by scaling the **base** of an existing
axis, `batchPerWorker × (1 + yieldPerLevel)^(level - 1)`, inside the derived and
before `ModifierSet.apply` ever sees it. Level is not a modifier, for the same
reason a cohort's is not.

It scales the batch and **never the interval**. Moving both would make throughput
quadratic in level — the identical failure the staffing knob was closed over —
and the interval also floors at `MIN_INTERVAL`, so that axis would die at a
knowable level anyway.

**Experience is karma actually moved**, summed from what the piles gave up, not a
flat tick per pulse. That is what makes it scale late: the refinery levels at the
rate the world feeds it, a starved pile halves the rate, and an unstaffed one
earns nothing while its clock keeps pulsing. The compounding is real but
self-damping — the batch grows `(1 + yieldPerLevel)^(L-1)` while the rung grows
`expGrowth^(L-1)`, so `expGrowth` must stay above `1 + yieldPerLevel` or the
ladder outruns its own thresholds. At `1.35` against `1.08` each level takes
about a quarter longer than the last.

The cost is named rather than hidden: `#exp` is the **first accumulated,
non-rederivable number in the game**. Everything else is a pure function of
`owned`, `level` and which upgrades are held, so a save could store ids and
rebuild the rest. Nothing breaks today — there is no save, and a fresh module
graph is the reset — but a save must store this counter raw.

`$lib/refinery.svelte.ts` is the singleton, next to `reserve`. It **composes**
`ResourceEmitter` like every other producer, so its clock, its autonomy and its
`action` event are the ones the rest of the app already speaks. Its clock starts
from `wiring.svelte.ts` when the `refining` system runs, not when the tab opens —
the system simulates before its panel appears, per the rule in `keys.ts`.

Both piles are drawn at the **same** rate and each is capped by what it holds, so
an empty pile does not stall the other and the difference between them — the
excess — passes through untouched. Conversion is **1:1**; efficiency scales the
karma consumed, which is what the axis table means by X, and no separate
karma-to-red ratio exists. That ratio is the obvious next balance knob if the
refinery turns out to pay too well, and it is deliberately not there yet.

`slots` is a third `ModifierStat` beside `yield` and `duration`. Only yields are
keyed by resource, so `ModifierSet.#isApplicable` now asks that question for
yields alone rather than excluding `duration` by name.

`refinery` is also the first upgrade bucket whose scope names **no entity and is
not global**: there is exactly one refinery, so `parseScope` returns a `refinery`
kind and `UpgradeManager` routes its modifiers to the singleton. Verbs (`unlock`,
`acquire`, `discover`) still act on entities only, so a refinery upgrade is
always a modifier.

Parked: **soul types feeding the refinery differently**, and any partial-staffing
curve where empty slots slow the batch rather than shrink it. Both were
considered and set aside as too complex for a first pass.

Still open, and none of it mechanical: every figure in the bucket and in
`refinery.svelte.ts` is a placeholder.

**Everything above predates coverage and is now doubly superseded — see
`docs/design.md` §9 v6, not this section.** Two changes worth the rationale
living somewhere:

**Why the interval stopped being a lever.** Once capacity read as a share of
income (`coverage × shortPileIncome`) rather than a fixed batch, `capacity ×
interval` cancelled the interval clean out of throughput — a duration modifier
on the refinery would move nothing. `speed_*` upgrades had been authored
against the old batch model and kept their name into the coverage model
without anyone re-deriving what they now did; they were multiplying coverage,
the same channel `efficiency_*` moved, under a name that implied a different
mechanic. v6 renamed them `reach_*` to match what they had already become.

**Why the level left `reach` for its own axis.** Coverage let upgrades push an
unbounded product straight past the 1.0 milestone (§9's old "coverage crossing
1.0 is the payoff") — the shipped ladder overshot to 2.88 against a stated
target of 1.2, and past 1.0 the backlog drains to nothing and the refinery
starves on arrivals forever, ending the tension it was supposed to create.
Capping the product with `maxLevelFactor` only traded one ceiling for another
that needed hand-tuning against every future upgrade. `coverage = reach / (1 +
reach)` removes the need for any cap — reach is free to grow forever and
coverage still can't cross 1.0. That freed the level to stop being a fourth
name on the same efficiency/speed multiplier and become a real second axis:
crimson paid per karma drawn, starting below 1 so the refinery is lossy at
first and ratio crossing 1.0 becomes the new milestone — one that does not end
anything when passed.

### The grades are bought above the refinery

`$lib/tokens.svelte.ts` is the layer the refinery feeds, and the one place
matching happens. Three purchases: yellow by pairing the two reds off, blue with
yellow, and either red with its **opposite** red.

**It composes no `ResourceEmitter`.** Every other producer does, and that is the
distinction being drawn — nothing here runs on a clock. A purchase is a click,
which is the whole reason the layer needed a buyer before it could exist at all.
No `start()` either, for the same reason: the refinery has one because its clock
must run from the beat whether or not the tab is open, and this has no clock.

**The two grade prices are flat, forever.** A scaling yellow would make refining
throughput pay *less* the longer you play, which fights all three refinery axes
at once — you would buy speed and efficiency to stand still. The grades are a
ladder, not a shop, and 12-from-each-pile is a ratio rather than a price curve.

Yellow's figure is **per side, not the total**: pairing is the point, so what the
button reads is what each pile loses. A total would have the watched pile drop by
half what was clicked.

**The inversion is the one price that climbs, and it counts inversions ever
made.** `#inversions` never resets — not on harvest, not on reaching. The
alternatives both fail the same way: a per-transaction curve is dodged by
dribbling, and a per-world budget makes inverting a renewable resource. This is
the only purchase that must never become the cheap way to run a single polarity,
because the wave, the aim and the whole excess reading assume you are living with
the polarity you earned. Each inversion is a confession and makes the next
dearer for the rest of the run.

The verb is **`invert`** and the noun is **`inversion`**. Not *reverse*: reversing
implies undoing a step, and this undoes nothing — it buys the opposite side at a
loss, which is a different admission.

`inversionCost` repeats the shape of `Building.#cumulativePrice` rather than
sharing it. That curve prices a building and this one prices a confession; they
are allowed to diverge and a shared helper would quietly couple them.

**Blue opens on holding any yellow.** No authored figure, because the ladder
already teaches itself: the rung above appears once the one below exists. An
authored threshold would be a third placeholder with nothing behind it.

#### What the table draws

`TokenTable` / `TokenRow` in `features/refinery`, on `CohortTable`'s grid. Four
rows, and they are deliberately **not** four of a kind, which is why the row
takes a plain descriptor instead of a class the way `CohortRow` takes a
`Building`.

**The inversion has no row.** It is the button on a red row, priced in the
opposite red — so the row you want is the row you press, and the cost badge is
the thing you give up. Beside it, greyed and not a control, the **passive
route**: what the refinery clears each batch without being asked. Two ways to the
same pile, one of which you are already getting for free.

That greyed figure landed the ratio it was reserved for — `refinery.lastProduced`,
not `lastPaired`, so the passive route now reads crimson paid rather than karma
drawn. Below refinery level 28 it reads *smaller* than the karma the batch drew;
past it, larger. The two numbers on a red row are no longer the same kind of
thing wearing two names — see `docs/design.md` §9 v6.

`PER BATCH` is the refinery's batch, so only red has one; yellow and blue draw a
dash. The column was briefly read as an emission on the yellow row — it is not.
Nothing auto-pairs, and *the refinery never pairs anything off* stands unamended.

Red is the one token that still holds a side, so it takes karma's three hatch
treatments at `--res-red`: `red-pos`, `red-neg`, `red-both`. `--res-red` is the
shared stripe in both, so the field carries the polarity and the hue still says
which resource it is. `badgeFor` now branches red the way it already branched
karma, which also fixes the rail chips and `CohortRow` — `cohort:red_basic` and
three `refinery` upgrades are priced in `red_positive` and had been drawing an
unpolarised badge.

**In the header, red is one badge between two figures** — negative left, the
order the detail section and the table both take — and empty rungs draw greyed
rather than being withheld, so the ladder shows its full height from the beat
that reveals it. `Figure` grew a `muted` prop for that; it greys the figure only,
and the badge keeps its hue.

**The excess reading dropped a size** once four readings shared a 3.5fr column.
That is provisional: the design has excess on its own labelled row under a meter,
with a backlog tag, and the meter is still the one this doc calls *still ahead*.
Backlog now has a definition — see *The refinery screen*.

All four figures — `YELLOW_PRICE`, `BLUE_PRICE`, `INVERSION_BASE`,
`INVERSION_GROWTH` — are placeholders, and they are not tuned against the
refinery's placeholders either.

### The refinery screen

Step 7's Refinery half. Five modules, and none of them changed the engine — this
was a layout pass and the mechanics it draws are the ones argued above.

**Backlog is a pressure, not a quantity.** The rate-ceiling bar was the last
module with no agreed meaning, and what it draws is *arriving against cleared*:
`countKarmaPerSecond()` on one side, the refinery's `clearedPerSecond` on the
other, with the overflow in `--res-red`. A held figure was the obvious reading and
is the wrong one — it says how much karma you have, which the header already says,
and it goes up when you are doing well. A rate against a ceiling says the thing
worth knowing: whether the piles are growing, and by how much per second. It is
also the only place the three upgrade axes are legible as one number, because all
three move the ceiling and nothing else does.

**The intake bar draws matched and unmatched without the engine pairing
anything.** The design module reads *"matched pairs only — the leftover is not
fuel"* — that is the superseded §3.5 flow, and the caption is not used. What the
bar shows is a **reading**: `min(pos, neg)` hatched from both ends, the remainder
as a tail on whichever pole holds it. The leftover is refined like everything
else and carries its polarity through. Do not take this bar as evidence the
matching question reopened; the sign comes from `getUnpairedKarma()`, which is
excess's own, so the tail and the excess reading can never disagree.

**The batch line is written as a conversion at 1:1.** `800 karma → 800 Crimson`
reads as a redundancy today and is deliberate: it is the slot a karma-to-red ratio
would occupy, drawn before the knob exists so adding one moves a number rather
than a layout.

**The split is a control here.** The design module is headed *set on Close-up* and
is read-only; it is draggable on this screen instead, because the refinery is
where the cost of reserving is felt. `detail.split` is still a stub and gets the
same lever. This is the first thing outside `DevPanel` to write `reserve`.

`SliderBar` and `SweepBar` came out of this pass into `$ui`. `SweepBar` is
`CycleBar` with the `BuildingManager` lookup lifted out into a `subscribe`
closure, which is what let the refinery's clock drive the same bar — the component
never knew what a cohort was, it only knew where to find one.

One deviation from the design, chosen not inherited: Split sat **above** the
grade table rather than below it, so the right column ran reading, reading,
lever, table. Reversed in the overflow pass below — the lever now anchors the
bottom of the column, matching the cohort screen's table-then-control order.

**Diagnostics moved left, the lever stayed pinned right.** The right column
was carrying all four modules and running taller than the viewport with no
scroll to hide it in — `.view-layout` is a plain grid, nothing clips. Intake
and the rate ceiling are readings, the same kind as the status card already
on the left, so they joined it there. The grade table and its Split lever are
the one actionable pair, and they stayed right with Split last — the same
shape as the cohort screen's table-then-lever column.

**Seven reveal keys became one.** `refinery.status`, `.backlog`, `.side`,
`.intake`, `.rate`, `.grades`, and `.split` were all revealed `live` in the
same beat, in the same object literal, with no state where one was true and
another false — the same situation `harvest.screen` (below) was named for.
`refinery.screen` replaces them; the screen has no internal guard.

### The harvest screen

Step 7's other half, and the last row of the course table. The layout was parked
pending a design pass — *where Harvest's verb sits relative to its disc is an
open question, don't improvise it* — and the pass, when it came, answered
something larger than where the verb sits.

**A horizon was built first, and it was wrong.** The reference reads as one: the
limb crossing the whole card with its apex a third of the way up, so that you
are standing on the world rather than looking at it. It is two numbers — the
body is drawn at radius 1 whatever a world says its `size` is, so a big limb is
only a tight `frame` with the camera lifted above the body's centre, and
`PlanetScene`'s hardwired `position={[0, 0, 5]}` was the only thing in the way.

What it cost was **the world**. At that magnification a planet has no
silhouette, no strata and no weather — the picture the whole visual system is
for is off the top of the frame, and what is left is a wall of surface. So the
takeover holds **one whole disc** instead, and the argument the horizon was
making is made by size and position rather than by cropping: the world is bigger
here than anywhere else in the game, and the decision is laid out over it.

The pan went with it — and came back one layout later on the other axis, which
is the finding that was worth keeping: a camera move here is **free**. Under an
orthographic camera a pure translation is invisible to every ink rule in the
widget, since the soul and harness shaders read `vRel` as `viewPos − centre`,
both view-space, and the body's key is ambient. Whatever brings the camera back
is a layout change, not a shader one.

**The world is a size, not a framing.** `frame` is world units across the short
axis, so one number means a different planet in every box — and this box is
whatever the window is. The stage divides instead:
`frame = min(widthPx, heightPx) / HARVEST_RADIUS`, with `HARVEST_RADIUS` at
120px against the detail stage's 111. Barely a push-in, and on purpose: the
takeover is already the whole window, and a disc blown up to match would say the
same thing twice while costing the swarm the room it wants. It is the same world
seen again, standing somewhere else. Drag the window and the world does not
move; only the sky around it does. The short side, whichever it is: the card is
wide at a window and tall at a phone, and the same number has to mean the same
world in both.

**And a place, which is the camera coming back.** `HARVEST_ANCHOR` is where
**down** that box the disc's centre stands — 0.5 would be the middle, 0.34 holds
it above one. It is a **ratio, not a pixel count**, because the thing it answers
to is one: the split and the verb sit at the foot of the block, and a px offset
would hold still while they moved with the window.
`offsetY = (anchor − 0.5) × heightPx / radius`, body radii because `zoom` *is*
the radius in px, and negative because screen Y runs down while world Y runs up
— the camera drops so the world rises. The sign is the only thing that changed
when the anchor turned ninety degrees from the layout before it.

What that buys is the swarm's room. Everything above the controls is sky, so a
full return crowds out sideways behind the two panels rather than into a margin,
and the edge it comes near is the split's top rather than the card's: 240px of
stray under a centre held at 34% of a 680px block, which clears it by a hair.
`strayTo`'s ceiling is that box: a swarm strayed past the frame's edge has left
before the decision was taken, and the outermost band strays to two world units.

**The slider moves the swarm.** This is the part that is not layout. Dragging
the split pulls the souls staying with the world in against its surface and
pushes the ones coming with you out past their orbits, so the cost is seen
before it is read. First pass is **by position only**: one radial multiplier per soul, no
rate change, no ink change, no fade.

Three decisions inside it:

- **A split shows both of its sides.** A share of 0 is not a swarm at rest, it
  is a swarm gathered to leave — everything not staying is already on its way
  out. A caller with nothing to split passes no share at all and no soul moves,
  which is every screen but this one.
- **The travel is radial**, so a soul never leaves the plane of its own orbit.
  The argument that keeps a rider off a partly-travelled harness line — the
  straight line between two points on a sphere is a chord through the world —
  does not reach this, because there is no chord.
- **The split reads the dealing order from the top, `riders` reads it from the
  bottom.** Both index `soul.place`, and if both read the same end a drag would
  strip the harness before it touched anything else. From opposite ends the two
  are disjoint until the split eats the whole swarm, and the picture is right:
  the souls you have put on your lines are the last ones the world takes.

Both ends of that travel are authored under `rim`'s neighbourhood rather than
picked freely, and the framing is what decides them. `settleAt` at 0.8 puts a
staying soul against the surface on the near side, where the ink rule has not
swallowed it — deep enough to read as taken in, not so deep that the whole
arrival happens behind the world. `strayTo` at 1.35 is the other end, capped by
the box as above. Both are lab knobs, and the lab's harvest cell carries **World
px**, **Room px** and **Anchor %** so they can be found against a real box
rather than guessed — the cell works its framing out the same way the stage
does, since one that took an easier route would flatter what the card will do.

**Four reveal keys became one.** `harvest.disc`, `harvest.verb`, `harvest.split`
and `harvest.outcomes` were all revealed `live` in the same beat, in the same
object literal, with no beat at which one was drawn without the others. Four
`{#if}`s that can only be all true or all false are not progression; they are
three keys pretending to be a sequence. `harvest.screen` replaces them and the
screen has no internal guard. The gate that does have two states is untouched:
`overview.firstHarvest` is `inert` at beat 8 and `live` at the harvest beat, and
it is the only door in.

**There is no blockers list on this screen.** The beat fires on
`isActivePlanetHarvestable` and the Overview's verb is dead until
`isFirstHarvestReady`, so nothing unmet could ever be read here — the old
`Needs …` string was unreachable. One line survives it, and only because
`excessGate` reads a *live* figure: readiness can lapse under you while the
screen is open. Reached by drifting, never by arriving.

**A boon is a reward, so it is not a `PlanetFirstHarvest` field.** That
interface is what the world *demands* before it lets you go. `PlanetData.boons`
is what it leaves you holding afterwards, shaped like an upgrade's effect and
routed through `Building.addModifier` exactly as `UpgradeManager` routes a
building-scoped one — keyed by world, so two planets granting the same change
both land. Unauthored as of this pass; the row reads `—`.

**The takeover takes the Overview, not the frame.** It went the other way first,
and the argument for that was sound on paper: none of what the header carries
bears on this decision — the score, the tabs' readings and the rail are all
about a world you are in the middle of leaving, and the room they cost is the
room the world wants. So it moved up to `App` and hid the frame entire.

Seen running, what that costs is the way out. A screen reached by one verb and
left by one word, with nothing lit above it, is a room with no walls. The
obvious fix — make it a fourth tab — is worse in a different way: it is one
world's decision and not a place you live, and it would sit in the strip beside
three screens that are. Which leaves the header up and the Overview's tab lit,
with the **Overview's body** as the thing replaced. That is where it started,
and it goes back.

The state stays on `nav` all the same — `isHarvesting`, opened by the Overview's
verb — because **which screen hosts it is not settled**. Overview holds it
today; Details is the live alternative, since the world being left is the world
Details is about. A flag on `nav` is the one place either can read. It is
**derived rather than stored**: `asked` is the flag, but the screen is only open
while the active world is still one you could leave, so completing the harvest
closes it without anything calling back.

The hidden body is hidden by the same `Screen` the tabs use rather than removed,
so opening the harvest does not cost a WebGL context per band to enter and the
same to come back to — which is what made `setWatched` need to compose, since
this is a `Screen` inside a `Screen`. **`Not yet` stays** even with the tabs
back: it is redundant with them, and it is the only thing on the screen that
says leaving is free.

**A push-in is not a bigger widget, and the ink has to know which it is.** Every
px-authored mark on a `PlanetVisual` holds its weight at any widget size — that
is the whole point of authoring it in px, and it is what leaves a 24px row with
a legible outline. But this screen is not a bigger widget showing the same
drawing; it is the drawing itself getting bigger, and a fixed 2px line across a
world three times its authored size is a scratch rather than a silhouette.

Anything measured in **body radii** already gets this right for free — souls are
sized in radii, so `zoom` carries them and their rings with them, which is why
the swarm looked correct at the horizon framing while the body did not.
`scaleInk(visual, radiusPx)` does the same for the three px marks that are
**lines**: `outline`, `contour`, `veilOutline`, each multiplied by the drawn
radius over `STAGE_RADIUS`, the detail stage's 111px.

What it deliberately does not touch is the **floors** — `dotFloor`,
`veilHatchWidth`. A floor is not a mark but a rule about the smallest thing a
screen can draw, and a push-in is precisely the case where it should stop
biting. `STILL_OUTLINE` is the same argument from the other end: shrink the
widget and the line is held, push in and it comes along.

**A shoulder each side, the controls down the middle, the world above them.**
The house division was tried in between — `view-layout`'s `4fr / 7fr`, verb
alone on the left, panels and split on the right — on the argument that the
takeover should sit with the other screens. It reads as two unrelated stacks
with a planet behind one of them. This is one verb about one world, and a
left/right split is a shape for a screen with two subjects.

So: a panel at each outer edge, and the middle column running **world, split,
verb** top to bottom — the order the decision is made in. Three even columns
rather than the house two, so the middle is centred on the card whatever the
panels come to.

The world is **not one of the columns**. The stage stays the block's whole
ground and the three parts are laid over it with no ground of their own; the
panels are the only opaque things on the screen. That is what lets the souls
stray out **behind what you are reading** rather than into a margin — putting
the disc in a column would crop a swarm that reaches two body radii, and boxing
the canvas would clip it at the edges.

Its height is a **pixel count and not a share of the window**: a full return is
`2 × strayTo × HARVEST_RADIUS` ≈ 480px and the controls take ≈ 200px under it,
so the block is 680px. Subtracting a guess at the header and the rail from
`100svh` reaches the same number and goes stale the moment either moves.

Two readings deviate from the reference, both chosen and both cheap to reverse:

- **The alignment track is hatched in three zones, not one.** The reference has
  one uniform hatch across the whole bar. Negative hatch, the `evenBand` at its
  true width as plain ground, positive hatch says the same thing and also says
  which way is which — and the word EVEN under the gap then names the gap rather
  than a point.
- **Even pays 1.5×, not 2×.** `balance.harvest.evenExperienceBonus` is 0.5, and
  the three multipliers are read off `resolveHarvestYields` rather than
  transcribed, so the panel cannot drift from what taking the harvest does. If
  2× is the intent that is a `balance.ts` edit.

`SliderBar` grew a `floor`, which clamps inside `set()` — the old screen clamped
after the fact with `Math.max`, so the handle could be dragged somewhere it then
sprang back from. `Button` grew a `spread` layout, for a button wide enough that
a caption centred under the verb is not what the second line wants to be.

## Anchoring — primitives built, design provisional

Beat 10 declared `runs: ['anchoring']` and revealed `detail.field` two rebuilds
before anything implemented it. The visual half was finished and unwired —
`anchor.ts` / `harness.ts` take a count and an `anchored: boolean[]` and never
learn what placing one costs, which is why this was a state-and-wiring pass and
not a rendering one. The game design is deliberately unsettled; what follows is
the shape the primitives take, so that retuning is a data edit and not a
restructure.

### The phase

Arriving at a world past the first puts you in a **forced** anchoring phase.
`PlanetData.anchoring` is what declares it — a world without the field never
anchors, which is why `first` has none and beat 10 fires *after* it is finished.
The roster stands aside for `AnchorPanel` while `planet.isAnchoring`; the split
is the only lever, and the press is the only other input. `SplitControl` renders
under both, so the lever never moves on screen when the panel does.

Souls still incarnate throughout. The cost of anchoring is the held souls not
earning, not a stopped world — the mockup's **CAN INCARNATE 96 of 564** is the
split's own readout and is why the phase is a tax and not a gate.

The **hand** is the exception: while `harness.isPlacing`, the press buys job-time
*instead* of experience, not as well as it. One verb with one payoff at a time,
so the trade the phase imposes is legible. It is a `Click extends Building`
overriding `yieldScale` to 0 rather than a branch at the call site, so the spark,
the sweep and the cooldown are the same press they always were — only the number
is gone, and `PlanetView` withholds a `+0` popup on a payout of nothing.
`BuildingManager.unlock` picks the class off a `KINDS` map now: roles are named
in, so a role nobody has written a class for is a plain building rather than the
last branch's leftovers.

### Progress is a time

The thing that moves is **milliseconds of the job**, never an abstract work unit.
An anchor is `anchoring.duration` ms of job; `Planet.place(ms)` adds to it; one
accumulator serves every anchor because they fill in order, which is exactly what
*next anchor in* means.

Souls do not add work — they set how fast job-time runs. `harness.speed` is
job-ms per real ms, so **next anchor in** is `anchorRemaining / speed`. This is
`resolveHarvestDuration`'s idea with the division moved to the *reading* rather
than the base: a split dragged mid-anchor moves the countdown at once and never
moves the fill, because work done is work done.

The press is the reason for the denomination. `balance.harness.clickMs` comes
off the job directly, so a world can be clicked open at zero staffing — and the
same press is a much smaller dent in the *countdown* once souls are on it.
Clicking matters at the start of a world and stops mattering as souls arrive,
which is the shape the lever wants, and it is why the popup reads `−0.01s` in
job-time rather than in the countdown.

`clickMs: 10` is a deliberate trickle, but it is *not* negligible against the
retuned durations: four presses a second is 40 job-ms a second, against 120 for
six staffed slots. The hand is a third of a full crew at the start of a world and
a rounding error by the end of one, which is the shape wanted. If a world cannot
be clicked open in a tolerable time unstaffed, that constant is the one to turn —
not the model.

The popup lands **at the anchor going down**, not under the cursor: the press
buys progress on a particular pole and the number belongs where it lands. That
costs a projection — `PlanetScene` reports the first ghost's peak through
`onplacing` every frame, because the world turns under it and a caller outside
the canvas has no way to ask. `PlanetView` keeps it in a plain variable and not a
rune; only a press reads it, and putting a per-frame number through the reactive
graph would re-render the view sixty times a second for something nothing draws.
The pointer stays as the fallback for a keyboard press and for a world with no
ghost left.

The first durations were authored in an abstract register and read as absurd once
the rate was real — `second` asked 3 × 600_000 job-ms, which at six slots is over
four hours. They are now **2 × 36_000** and **5 × 360_000**: about ten minutes of
real time for the second world at six slots, and about fifty for the third at the
thirty `slots_2` buys. A job-ms figure is only meaningful beside the `perWorker`
rate and the slot count that will be in hand, so retune the three together.

### Two capacities, and a covered share

Work slots cap how many reserved souls place at once, so the split has an optimum
rather than *always max*. Rider slots cap how many souls the finished harness
pays. Both are `ModifierSet` stats bought exactly as `refinery.slots` is.

"Only riders get the bonus" resolves into one scalar rather than two soul
populations:

```
multiplierFor(souls) = 1 + bonusPerAnchor × placed × min(riders, souls) / souls
```

The covered share scales it, which keeps a cohort's payout a single multiply and
keeps the cap honest at every count. It reaches the payout through a generic
`Building.yieldScale` hook returning 1 — the same doc-comment argument as
`activeAt`: the base states the general case, a subclass that answers to
something outside itself narrows it. `Cohort` overrides it; `Building` never
learns what a harness is. Read in `#generateResources` *and* in `perSecond`, so
the readout cannot drift from the ledger.

### One soul, one job

The refinery and the harness both staffed themselves `min(countReserved(), slots)`
off the same pool, so a held soul refined *and* anchored — one soul doing two
jobs, and a `SplitControl` aside that named only one of them. The pool is
exclusive now, and **anchoring draws first**: a world still going down is what
stands in the way, so the harness takes its slots' worth and `refinery.#free` is
the remainder. `harness.#workers` is gated on `isPlacing`, so a finished world
hands every soul back rather than holding a crew for a job that is done.

That makes the surplus visible and therefore the allocation decidable: the aside
reads `96 out · 6 anchoring · 12 idle`, and those twelve are what the split is
overspending. Before this, a bar dragged past the slot count did nothing and said
nothing.

`isPlacing` — running, and with a world that still wants anchors — is now the
single condition everything asking *is the phase on* reads: the press pays under
it, the hand's yields are suspended under it, the souls are held by it, and the
`SplitControl` aside names its job by it.

### The split became a decision

`reserve` was continuous, which is why getting the allocation right cost nothing.
`balance.harness.splitSteps` is a ladder — `0.5 / 0.25 / 0.1 / 0.05` — indexed by
a `step` modifier counting rungs bought. `SliderBar` gained `step?: number`,
defaulting to 0 = continuous, so no other caller changed; the arrow keys reuse
the same snap in place of the old hardcoded `STEP`.

`step` is an **index, not a fraction**, which is why it is a `flat` op of value 1
and why the ladder stays authorable data.

### What was deferred, and why

- **Per-world anchor and harness visuals.** `harness-visuals.ts` is one record
  seeded from the widget defaults. `harness-lab.svelte.ts` already notes a pair's
  family comes from the pair alone; the lab's copy button prints a literal when
  a second is worth authoring.
- **Anchor-slot upgrades** toward `ANCHOR_MAX = 8`. Work slots and rider slots
  are the two capacities chosen; a third is speculative.

### A rider is a count, not a share

`SwarmVisual.riders` is a share of the swarm, and it had to be: the lab drags a
swarm whose size moves under it, so a fraction is the only thing a slider there
can mean. The game knows the actual figure — `harness.riders`, bought a soul at a
time — and turning it back into a fraction of a number no caller can see was the
wiring nobody wrote, which is why nothing rode a finished harness however many
riders were bought.

`ridersOf(visual, souls, riders?)` settles it in one place: a caller's count when
it has one, the authored share otherwise. `SoulSwarm` takes `riders` as a **prop
and not a visual field**, the separation `counts` and `merge` already keep — game
state is passed in, look is authored. The lab is untouched.

Riders appear as the lines do, not when the last anchor lands: `loops` is built
from the *placed* nodes alone, so the swarm populates a growing harness. Nothing
rides until `riders_1` is bought, since `balance.harness.riders` is 0 — that is
the upgrade's whole content, and it is worth checking it reads as a purchase
rather than as a bug.

### A spark is where a soul landed

The press keeps its mark on the ground, its halo and now its **bolt** while a
world is being anchored — the click happened, and the world should answer it —
but not its **spark**: a spark is a soul arriving, and during the phase nobody
arrives. So `DetailScreen` stops advancing `yields` under `isAnchoring` rather
than gating anything in the scene. `yields` is already the *payout* count and
not the press count, which is what makes suppressing it exact. The bolt struck
during the phase aims at the anchor going down instead — see *The bolt leaves
at the press* below for why it no longer waits for a spark to exist at all.

### The poles take the share they carry

A yield lands as a spark on open ground, wherever the visible cap put it. Once a
harness is up that is no longer the whole truth: some of the souls being paid for
are on the lines, and their arrival should be seen to land where they are.

So a spark rolls, per spark, against `min(riders, souls) / souls` — the same
covered share `harness.multiplierFor` already prices the bonus by, read through
`ridersOf` so it is the count `SoulSwarm` actually draws riding and not a second
opinion. Win, and the flash is planted on a placed anchor's tip rather than on
the ground; the bolt leads it there, not the other way — a strike is aimed at
the spot the flash will land on the moment it is struck, which is now the
press, well before the spark that lands there exists.

**The share is the chance, and it is not authored.** There is no slider for it,
because there is nothing to tune: a world carrying a tenth of its swarm on the
lines should be hit there a tenth of the time, and a number in between would be
saying something the game does not mean. It also arrives on its own — `riders_1`
buys the first rider and the poles start taking strikes in the same purchase.

**A won roll may take any placed anchor, front or back**, and `sparkFace` does
not reach it. That cutoff governs where a *random* mark may land, and its
argument is about the ground: at the limb the surface turns edge-on, so a flat
dot lying in it foreshortens into the outline. A pole is not somewhere the roll
found — it is a named thing on the world, and one behind it is still that thing.
`sparkBack` already says how loud the far side is, and a bolt crossing the body
to reach it reads as the world being wrapped rather than as a mark misplaced.

The two rules are not in tension because they answer different questions: a lost
roll falls back to open ground and takes `sparkFace` with it, exactly as before.

`pulse.ts` learns none of this. `aim()` — the roll, now taken at the press — gained
the `findSpot` callback, and the scene owns both it and the anchors; `spark()`
only ever turns an already-chosen spot into a ring-buffer mark. The module still
does not know there is anything standing on the ground, which is the separation
`orbit.ts` and `anchor.ts` keep for their own reasons.

### The bolt leaves at the press

A queued click used to answer with nothing until its payout landed, and then
the whole strike appeared at once — the one mark with a direction, arriving
with no flight. At `main`'s starting 1000 ms that read as the press doing
nothing for a second and then a bolt out of nowhere.

The fix moves the strike to the press it belongs to and lets the wait *be* the
flight. `Bolt.to` is a frozen `Spot` rather than a live `Spark`: the target is
chosen — `pulses.aim()` — the moment the bolt leaves, before the spark it is
aimed at exists, and stashed for the matching payout to `spark()` onto the
ground. `PlanetScene`'s `flashes` effect does the aiming and the striking now;
its `yields` effect only shifts a stashed batch off and plants it. A `Spot` is
frozen rather than resolved for the same reason the mark's own doc always
argued for the opposite of freezing its *position*: a `Spark` is a ring-buffer
slot, and a bolt still in flight when its target's slot is reused would
silently follow whatever click landed there next.

The bolt's life is `max(boltLife, clickMs / 1000)` — the authored floor, or the
click's own duration whenever that is longer, worked out in the scene since
only it knows the click. A lab has no `clickMs` and keeps the authored 0.15 s;
`speed_3`'s zeroed duration falls back to it too, so an instant click still
gets its tracer in one frame rather than losing the mark. Nothing here is a
second FX authored for the pre-`speed_3` stretch — the wait was always going
to need *something*, and now the something it needs is the mark that already
existed, doing the one job it was missing.

A strike that can now live a full second cannot fade the way the others do:
`fadeOf` is cubic, and a bolt on that curve is a ghost by its own halfway
point. `holdOf` is its own alpha — full weight for the whole flight — and
`boltTrail` is what keeps a long strike reading as travel instead of a rod
snapping into place: the fragment shader lights only the share of the drawn
length nearest the head and fades the rest behind it. A floor under that
fade was tried and dropped — it read worse, not better, so the spent trail
still fades to nothing.

**The near end stands still unless the click is instant.** `Bolt` used to read
`getCursor` every frame regardless, so a strike already a second into its
flight would slide to wherever the pointer had since wandered — unmoored from
the press that threw it. `isInstant` (`(clickMs ?? 0) <= 0`, worked out in the
scene) gates that read: a click with a wait of its own keeps its strike
planted at the cursor's position when it struck, and only `speed_3`'s zeroed
duration — or a lab with no building — gets the live tracking back, which is
also the one case short enough that a moving cursor was never the problem.

> This whole section predates the instant press. The code is unchanged and the
> reasoning still stands — but `speed_3` is gone and the game side now sits
> permanently at the instant end of every ramp described here. The lab
> (`clickMs === undefined`) is what still drives the other end. See *The press
> is instant* below.

**The trail itself eases out rather than switching off.** A head with a lit
trail earns its keep on a real flight, but on an instant click it did the
opposite of what it was for: with nothing to travel, a comet with a dark tail
only made the zero duration more visible, not less. `PlanetScene` scales
`boltTrail` toward a full line — `mix(authored, 1, floor / life)` — as the
bolt's actual life sits closer to its own authored floor, so a click ramping
down through `speed_1`/`speed_2` eases into the comet rather than snapping
into it, and one at exactly 0 flashes its whole length the way the strike
always used to. `clickMs === undefined` (a lab with no click at all, not the
same as an instant one) is the one case exempted — it plays `boltTrail`
exactly as authored, or the slider would have nothing left to preview.

The alpha needed the same easing, not just the trail. `holdOf` — a constant
1 — was right for a real flight, where the old cubic `fadeOf` would have
ghosted the strike out by the halfway point, but held flat across an instant
click's whole life it read as too bright against the fade that mark always
had. `PlanetScene` derives one `nearFloor` (1 at the floor or in the lab,
easing to 0 as the wait grows real) and drives both scalings from it —
`boltTrail` toward a full line, and a new `boltHold` toward 0, blending
`Bolt`'s alpha from `fadeOf(t)` (`hold: 0`, the old decay) to `holdOf(t)`
(`hold: 1`) rather than switching between the two. An instant click ends up
back at its original fading flash; a real flight keeps its full-weight hold.

### The arrival is struck, not drawn

`swellOf` was `sin(πt)`: up and down at the same rate, widest at the middle. That
curve caps how long a spawn can last — given more seconds it reads as a star
being *drawn on screen*, and the flare's whole job is to say a soul appeared.

It is now lopsided, on one authored crest (`spawnRise`, default 0.12): a fast
quadratic to full, then a smoothstep the long way back. Both halves flatten where
they meet, so there is no corner at the peak. That is what pays for the longer
life — `spawnLife` went 0.1 → 0.45, and the added time is spent entirely on the
dissolve, which is the part worth watching.

`hatchOf` is keyed to the same crest instead of to its old fixed 0.35–0.8 window,
so the dot comes up over the flare's descent whatever the crest is set to. One
event, two curves, one number: the star is struck, and the soul is what it leaves
behind.

### Between worlds, souls earn nothing

`completeFirstHarvest` clears `#selected`, so from the last harvest until the
next world is reached there is no active planet — and cohorts went on paying
karma and experience into the pools the whole time. A soul incarnates
*somewhere*; with nowhere to be born the roster should keep its count and stop
earning.

Fixed at `Cohort.yieldScale` — 0 with no active world — rather than in the
header, because `yieldScale` is read by `#generateResources` and `perSecond`
both. One edit stops the ledger and the readout together, and the header's `/s`
figures fall back to `sumHarvestRates` over the worlds behind you with no change
in `Frame.svelte` at all. Zero rather than a stopped emitter: the cohorts are
still there, still bought, still the thing the next world will run on.

## The wave is a clock

**A phase is a fixed span of time spent on the world.** `phase_duration` per
planet, `Planet.advance(ms)` fed by `PlanetManager.tick()` off `clock`, and
`phasesElapsed = floor(lived / phaseDuration)`. `phase_multiplier` and
`initial_phase_amount` are gone, and so is the planet's private experience
ledger — nothing read it once the phases stopped.

It used to be priced in experience on a geometric ramp, which put phases at
`log_r(experience)`. That is worth writing down because the failure was not a bad
number, it was the shape:

- **Income and time entered identically**, as multipliers on one stock. A tenfold
  income bought `log_r(10)` phases outright — 2.5 at `r = 2.5`. Since income in an
  incremental multiplies while time only adds, **buying always beat waiting** at
  advancing the wave, so the wave was an income readout wearing a clock's face.
  You could buy past an unfavourable phase, which quietly deleted it as a
  decision.
- **The ramp was a race between two exponentials with nothing tying them
  together.** The old comment claimed phases "stay about as long as each other
  however fast experience comes in", which only holds if income also multiplies
  by exactly `r` per phase. Early it beat that and phases flew; once the cost
  ladders bit it fell under and they crawled. Any fixed `r` is right at one
  moment of the run.
- **The crawl and income-resistance were the same knob pulled opposite ways.**
  `1/ln(r)` is how much wave a tenfold income buys, so raising `r` to blunt
  income also made the gate unreachable. `third` at `r = 2.5` wanted 10^41
  experience for its `agesLived: 4`.
- **World length depended on the run before it.** A strong player reached `third`
  faster than `second`, so the pacing curve inverted under exactly the players it
  should have stretched.

There is no middle. A self-normalising output clock — phase *n* costs a multiple
of what phase *n−1* delivered — makes a tenfold income buy tenfold wave speed
*permanently*, worse than the log. The only pricing that holds a phase steady is
`income × seconds`, which is a seconds clock in a costume. Either income buys
wave speed or it does not; this is the version where it does not.

What that buys, beyond the fix:

- **`agesLived` is a promise you can read.** 4 / 8 / 16 / 32 / 64 minutes across
  the five worlds, authored in `planets.ts` and printable in the UI.
- **`reaimPhases: 2` means something fixed.** The re-aim penalty is priced in
  `progress`, so on the old third world it was a permanent debuff with no figure
  in `balance.ts` that could have changed that. Anything else phase-priced is
  fixed with it.
- **The sim gets it free.** `tick()` reads `clock` deltas like the harness, so a
  simulated run fast-forwards the wave with everything else.

Two rules the clock needs, both matching the harness:

- **Only the world you are standing on ages**, and a harvested one stops — its
  wave froze where you left it, which is what the Overview should read.
  `#lastAt` is dropped when there is no active world, so the gap between worlds
  is free and the next world's first phase starts when you arrive.
- **Unclamped.** A backgrounded tab still spent the time. The wave is the one
  clock nothing can be bought to hurry, so it should not be the one clock that
  quietly stops when you look away.

The cost, taken knowingly: the wave is no longer connected to the thing the game
is about. Amaral liked "experience as time" as a concept and let it go on the
pacing argument — if it comes back, it comes back as an explicit, priced upgrade
axis on phase speed, not as the pricing of the clock itself.

## Excess — there is no wall

**Excess is the share of the karma you are holding that has nothing to pair
with.** Unpaired over held, `(P − N) / (P + N)`, signed: negative is Burden,
positive is Comfort. There is no denominator to author, no window, and no
`wallSeconds` — the reading is a proportion of the piles themselves.

§3.2 gives the numerator without argument and never says what it is read
against, which is why this sat provisional for so long. The version that shipped
first was **income rate** — karma per second times a 600s window — and it was
wrong for a reason worth keeping written down, because it is not obvious.

**The income wall could not spiral, arithmetically.** Unpaired karma is roughly
tilt × the integral of income; the wall is income × 600. Income appears on both
sides and cancels, leaving *tilt × minutes ÷ 10*. So the reading never depended
on how big your economy was, only on how long you had been tilted — and every
new cohort widened the wall the instant it was bought, so **growth cleaned you**.
The thing that was supposed to be a debt was being paid off by playing well.

It was also the source of the slipperiness. `countKarmaPerSecond()` carries
`karmaYieldFactor` and `Planet.bias()`, so the phase flip swung the denominator
by up to 2.3× and the meter jumped with it while the piles had not moved at all.
A stock read against a rate that oscillates is a reading you cannot act on.

The share fixes both by having nothing in it but stocks. It also disposes of the
other two candidates on the old list: a **lifetime total** decays to zero because
it only grows, and an **authored per-planet figure** contradicts §3.2's "excess
is global, only the gate is per-planet" and would make the reading jump on
arrival somewhere new.

**The objection that killed this candidate originally is now the feature.** It
was rejected because matched-pair refining takes equal amounts from both piles —
numerator holds, denominator shrinks — so refining would *raise* your excess,
against §3.2's "the refinery is the main way excess leaves you". Both halves
moved. The refinery pairs now (see *Refinery*), so it cannot reach the unpaired
remainder at all; §3.2's premise is simply false in the code. And a reading that
climbs as the refinery eats your matched stock is exactly right: what is left
when the pairs are gone *is* your imbalance, undisguised.

Which gives the reading a hard, legible ceiling. **±1 means a pile is at zero,
which is the same event as the refinery stalling.** The meter's end and the
machine stopping are one thing, so full scale means something specific rather
than "very bad". `ExcessMeter` already drew on `SPAN = 1` and clamped to it;
that clamp is now the real range. And it is the same number `IntakeBar` draws —
the tail's share of the bar — so the meter and the intake agree by construction
instead of by maintenance.

Consequences worth naming:

- **The gates are now honest percentages.** `excessGate` at 0.12 / 0.08 / 0.05
  reads as *at most 12% of what you hold is unpaired*, tightening per world. On
  the old scale those figures had no stable meaning; the `evenBand` mismatch
  flagged earlier resolves itself, since 0.02 is strictly tighter than the
  tightest gate, so locking Even is harder than passing any door.
- **`undefined` until both piles have ever existed.** Not until income exists —
  the guard moved. Before the choice that creates negative karma there is one
  pole and no imbalance to read, and without the guard `deep_excess` would fire
  in the opening on a reading pinned at 1.0. Beats are strictly sequential so
  beat 7 was safe either way; milestones are not.
- **Spending karma is a third way down, and it is one-sided.** Roughly fifteen
  upgrades cost `karma_positive`; **nothing costs `karma_negative`**. So a
  Comfort tilt is partly self-correcting — your own purchases eat the surplus —
  while a Burden tilt has no sink but the dial. That asymmetry mirrors the one
  already in the red layer, where upgrades and `red_basic` cost red positive and
  nothing costs red negative. It was not designed; it may be the right shape,
  since Burden is the side you chose deliberately and should be the harder one
  to carry. Worth a decision rather than an inheritance.
- **Reserving souls raises the reading**, because refining shrinks held karma
  while leaving the unpaired part alone. That is correct and it is the pressure:
  staffing the refinery does not clean you, it strips the pairs away and leaves
  the tilt showing. The only thing that lowers excess is aiming into the pile
  you are short of.
- **Merging souls no longer moves the reading**, so the read-order hazard in
  `completeFirstHarvest` is gone. It is still read first, because §3.9 says the
  lock is the reading the screen showed.
- **It is flat while you pay a deep tilt off.** With one pile pinned near zero by
  a refinery that eats it on arrival, the ratio sits near ±1 until the big pile
  actually drains. The debt is the meter; the *rate* you are paying it at is
  `RateCeiling`. Worth watching in play — if it reads as dead rather than as
  ominous, the answer is a second readout, not a different denominator.

The per-planet part is where §3.2 puts it: `PlanetData.firstHarvest` carries the
conditions the planet imposes, and `Planet` checks them. Beat 9 asks the planet
whether they hold rather than spelling any figure out itself.

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

Every cohort bucket opens with `first` — `['unlock', 'acquire']`, which builds
the cohort and hands you one of it. It was `core_0`, a word that named a position
rather than a thing, on an index no bucket ever reached `_1` of honestly. The
`autonomy` verb never appears beside it: `BuildingManager.acquire` switches
autonomy on at the first non-click acquire, so authoring it is redundant, and its
case in `#processEffect` stays commented out.

### A cohort gates in karma and pays in experience

Every `first` **gates in karma and pays in experience**, and those are not one
job. `unlocks_at` reads a lifetime total that can never be spent, so it is a
clock: *when does this kind of soul become available*. `costs` reads the
spendable pile, so it is the trade. `chaos`, `steady` and `zealot` used to gate
and charge in karma at the identical figure — one currency doing both, and
neither reading.

The price is experience because **the cohorts already are**: copies and level
upgrades alike, `cost_type: 'experience'` throughout `buildings.ts`. It is *The
level-replacements are priced in experience* applied one level up — the trade
only exists when both sides come out of the same pocket. Priced in karma, the
opening ran two clocks side by side: the click's ladder spent experience while
the first cohort accrued on an unspendable karma total, and an unspent pile
always wins that race. Priced in experience, a cohort costs you a rung of the
click's ladder and the two order themselves.

The gate stays karma for a reason that is specific to the click: it pays a flat 1
karma untouched by `str_*`, so **a karma gate is a press count**. 30 karma is 30
presses whether that takes thirty seconds or eighteen — which made `speed_1`
visibly pull the next cohort forward in wall-clock time, a speed chip buying
access rather than only throughput. An experience gate would be pulled forward by
`str_*` instead, and there are already four of those.

> The press-count half still holds; the `speed_1` half does not. **The `speed_*`
> ladder is gone and the press is instant** — see *The press is instant* below.
> A karma gate is now a press count paced by the player's hand alone.

`cohort:basic/first` stays unpriced, and the reason is no longer that it has no
buyer — beat 3 now opens the rail, ahead of the cohort table at beat 4. It stays
unpriced because it is the `first_soul` beat: the first soul is something that
happens to you, not a chip you find. `acquireUnpriced()` grants it the moment
`unlocks_at` holds. It was `['unlock', 'autonomy']`, which builds the cohort at
count 0 and grants nothing, so those two beats could only ever reach on their
floors.

Its gate moved 15 → 30. At 1 karma a press it used to land at press 15, ahead of
both opening click chips — the first cohort arrived before the click had a ladder
to be enjoyed. 30 puts it behind them. It is the knob to turn if the opening
still reads as crowded; nothing else depends on the figure.

`cohort:steady/speed_1` was `core_1`, the one second entry upgrade, and its
`autonomy` effect bought nothing. It keeps its price and its title and now moves
what steady conspicuously lacks: `duration_reduction: 0` makes it the one cohort
that never speeds up with count. Placeholder figure.

`global` holds two priced triggers and nothing else, so `effect` is now optional
on `UpgradeData` — an upgrade whose whole content is the purchase. That is what
made `wider_wave` the wrong word: the scope cannot widen anything, and beat 6
calls the wave *a clock you read, not a lever*. It is `read_the_wave`. Both are
priced rather than granted, because beat 7 is *how dirty do you want to run* and
a choice you are handed is not one.

Beat 7 lost its `total('karma_negative') > 0` fallback in the same edit. `aim`
returns `positiveShare: 1` until beat 7 runs `negKarma`, so that pile could not
exist before the beat that tested for it — a second route on paper only.

Figures on `planet:second` and `planet:third` are placeholders. They put
discovery near beat 9 and nothing more; nothing is balanced against them.

## The press is instant

Settled by playtest. The press opened on a 1,000 ms cooldown and ramped down
through `building:main/speed_1`, `speed_2`, `speed_3` — ×0.6, ×0.5, ×0 — the last
titled *It clicked for you*. **The pun was the reason the wait survived this
long, and the wait is annoying.** All three chips are gone and `main.duration` is
authored 0.

The argument for keeping it was never throughput. It was that a cooldown makes
the press a *timing* decision against the wave, the same reading §6 wants. But
the game already has that verb, in a better place: **a cohort without its clerk
is click-and-wait**, and there the wait is a batch you can hold through a dense
phase and release into a light one. On the press the same wait bought nothing to
decide — one press, one life, no batch to hold — so it was a throttle wearing a
mechanic's clothes. One mechanic, one home: the hand is instant, the unclerked
row is the clock.

**`speed_3` was the tell.** A ladder whose top rung deletes the mechanic is a
ladder apologising for it. Three purchases to reach the state the verb should
have shipped in is three purchases spent undoing a decision.

### What fell out

`duration: 0` is not a special case — `ResourceEmitter.queue()` already treats a
zero interval as the synchronous path, and `speed_3` used to land on exactly that
path. So nothing in the emitter, the bias averaging (`biasBetween` returns the
instant when the span is 0) or the payout changed at all.

What became dead was the cooldown's own surface, and it is pruned:

- `PlanetStage`'s `duration` / `isInProgress` / `subscribe` props, its `SweepBar`
  and the `.cooldown` caption row. It passes `clickMs={0}` down to `PlanetView`.
- `DetailsScreen`'s `sweepOf(CLICK)` closure and the `isInProgress` re-entrancy
  guard on `onclickaction` — with no interval there is no window to re-enter.

`PlanetScene`'s `clickMs` ramp is **kept**, not pruned. `boltLife`, `nearFloor`,
`boltTrail` and `boltHold` interpolate the strike between an instant press and a
long flight, and the planet lab drives them with `clickMs === undefined`. That is
visual-lab surface with an author behind it, not dead game code — the game side
simply pins it at the instant end now.

### The hazard this leaves

Every early gate was paced against a press that started at one a second. It now
runs at whatever rate the player clicks, from the first press. Two things move:

- **Beats 1–4.** The rail's `FIRST_CHIP = 40` xp, `first_soul` at 30 karma
  (30 presses), `rows` at five souls — all arrive sooner in wall-clock.
- **Unstaffed anchoring.** `harness.clickMs` pays 250 job-ms per press, and
  design.md §12 sizes the second world at ~288 unstaffed presses. That figure was
  a number of *seconds* early on; it is now a number of *clicks*.

`sim/run.ts` already models a fast hand (`clicksPerSecond: 4`), so the bench is
the instrument for this — nothing has been retuned against it yet.

## Denominate everything relatively

The cohort ladder shipped alone and moved where power comes from: out of
*headcount*, into *index*. Equivalent power now costs a few hundred souls where
it cost thousands. Every figure still written in raw souls was therefore
mis-scaled by about an order of magnitude, invisibly for two worlds — 50 and 350
both clear a ~450-soul peak — and then the third asked 1,000 and the run stopped.

The through-line of the fix is one rule, and it is worth more than any of the
numbers it produced:

> **Stop authoring absolutes.** A figure denominated in a quantity the ladder can
> move is wrong the next time the ladder moves. Denominate it in a *share* of that
> quantity and it is right at every scale.

Toll and halving became shares of the army; the harvest became a multiple of your
income; the world floor became wall-clock. Worlds 4 and 5 then cost almost
nothing to author, which is the test of whether the rule took.

### The one measured run

The only calibration data the upper economy has ever had, off a live run at the
third world. Recorded because the figures behind the rebalance came from here and
nowhere else:

```
+150,331 xp/s
+135,298 karma−/s      (hard negative, dense phase)
~700 xp/click
```

The karma reading reproduces exactly: `150,331 × 0.2 × 3 (extremity) × 1.5 (bias
with)`. **That is a dense-phase snapshot** — on the flip it is ~45,100, so true
phase-averaged income is ~90,200/s. This is why §15's departure snapshot divides
the bias back out: sizing a permanent reward against the reading would pay ×3 for
the accident of when you left.

The refinery at level 29 cleared 138,034 karma/s across both lanes, against
15,033/s per pile that an Even economy could feed it — **4.6× ahead of anything
the game produces**, which is why idling it is the only sane setting. Nothing
stops batch capacity outrunning the economy: level is earned by karma moved, and
the batch it buys is per-pile capacity, so it self-limits only by starving.

Karma moved over that run, `5,000 × (1.35^28 − 1) / 0.35`, is **~64,000,000**.
That is the refinery's own level experience and therefore the wisdom base — the
first number `W` can be authored against. `W = 10^6` gives ~8 wisdom for a run,
which is a sane opening figure; `W = 1` gives 8,000, which is absurd.

### Three implementation notes

**The departure reading is one object, taken once.** `Planet.completeFirstHarvest`
takes a `Departure` — merged count, merged share, alignment, income — because all
four have to be read *before* `mergeSouls` runs. Merging destroys both the count
and the income the world is being paid for; splitting the read across four
arguments is how that ordering gets quietly broken later.

**The count and the share are both stored.** The clock runs on the share; the
Overview says "N merged". Deriving one from the other after the fact would need
the population at departure, which is exactly the thing that just went away.

**`findMergeFloor` was kept, not replaced.** Rounding is per cohort, so the
fraction that *predicts* a count is not the one that *reaches* it — the bisection
still has to happen against counts. `findMergeFloorForShare` only converts, with a
`ceil`, so the split that reaches the toll is never a soul short.

## Reveals were outrunning depth

Reported from play: rows unlock before the row below them has had its upgrades
bought, and the first clerk anyone pays for is cohort 2's at 37,500 against a
cohort 1 clerk of 3,750 that is never charged, so it reads as a free extra zero.

**The clerk was not the fault.** Held against a row's own ladder, in units of
`10^(n−1)`: 10 copies plus the tier I rung is 507, 25 copies plus tier II is
2,949, the clerk is 3,750. So `250 × cost(n)` lands just past that row's own
tier II, which is exactly where selling your timing should cost. Cheapening it
would put automation *before* tier II and take the manual-batching lever out of
the early game entirely — the same lever the press gave up its cooldown to
protect, above.

**The reveal was.** `5 × cost(n)` put the next row at 750 in those units — past
tier I, four times short of tier II, and one fiftieth of the current row's
clerk. Since income compounds and each reveal is only 10× the last, you cleared
the *next* reveal long before the current clerk. Width was permanently the
cheaper buy: at the moment cohort 2 appeared, one copy at 150 paid a third of
everything you had, against 300 for a tier rung. Nothing was mistuned; the two
multiples were sited against different things.

**Fixed by making them one knob.** `REVEAL_FACTOR = 25`, `CLERK_FACTOR = 10 ×
REVEAL_FACTOR`, both in `data/buildings.ts` beside `COHORT_RAMP`. A cohort costs
ten times the one below it, so that identity makes `reveal(n+1)` and `clerk(n)`
the same figure: **a row appears at the moment the row below it can be
automated.** Derived rather than written twice so the pair cannot drift.

**Cohort 1 keeps its free clerk, and design.md was wrong, not the code.** §5 had
argued at length that cohort 1 is not exempt, on the grounds that a row which can
never be automated is a row the *many hands, then fewer, then none* arc cannot
reach. Answered rather than accepted: cohort 1 is the row the hand has already
finished with, and a clerk chip on it prices busywork you would buy on sight. The
one chip unlocks the row, grants the copy and clerks it. §5 and the `first_clerk`
milestone were rewritten to match; the milestone must not fire on cohort 1.

Also settled the same way: §5's *free at 30 lifetime karma+* for the first copy
was stale prose, and the shipped 50 xp reveal / 100 xp price is the rule. §4's
press-count argument survives in experience, since the press pays 1 xp flat
before `str_1`.

**What is not measured is the wall clock.** The second row moves from roughly two
or three minutes to five or eight, and the delay falls entirely in the stretch
where income is flattest — one row and a button. `sim/run.ts` is the instrument;
nobody has run it against this.

## Aiming is drafted, and the wave shows the bill

The dial committed on touch, so a drag across the track paid the re-aim penalty
once per detent it crossed and the price of a decision depended on the gesture
that made it. Pointing is free now; the Aim panel's aside carries the one verb
that buys, and the draft is deliberately absent from the save.

The settle line follows from *the wave is a clock*. The penalty is priced in
phases precisely so nothing can buy it off, and the strip is the only place that
clock is drawn — so where it ends is a mark on the wave, not a sentence about it.
The draft's preview line is the same mark asked as a question, which is what makes
*wait for the phase, then aim* visible instead of counted.

Both lines are solid and separated by weight. The playhead owns the dash, so a
second dashed line would have read as another now.

## Naming

`detail` (the design docs' "close-up") shows the planet's proper noun, so code
and label can never match there. `reading.*` rather than `header.*`, because
those figures predate the header: beat 5 relocates them into the frame instead of
revealing them again. None of this is drift; don't "fix" it.

Retired with CONTEXT v3: *clearing* (→ refining, and the screen is labelled
Refinery in both vocabularies now), *probe* (→ soul), *stage* (→ phase). Token
code names stay `red`/`yellow`/`blue` against the UI's Crimson/Ochre/Indigo.

**`seats` → `slots`** across the staffing axis — the `ModifierStat`, the two
upgrade ids, and the copy. A seat is furniture and implies a room; a slot is a
capacity, which is all the number ever was.

Buying a red with its opposite is an **inversion**, and the verb is `invert`.
*Reversal* was the first word and is wrong: nothing is undone, a side is bought
at a loss. *Inversal* is not a word at all.

The wave has its own three words. A **phase** is a half-wave, light or dense; two
make a **cycle**; `cycles_per_age` of those make an **age**. `ages` counts up
without limit — a planet is finished by harvesting, not by running out.
