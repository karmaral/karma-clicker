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

`strict` is **false** in the inherited `@tsconfig/svelte`, so a switch that misses
a union member returns `undefined` and typechecks clean. Nothing that fans out over
a union can rely on the compiler unless it is made to: use an exhaustive `Record`
for the list and a `const unhandled: never` default for the branches. Both fail
without `strictNullChecks`; the missing return does not. `FIRST_HARVEST_CONDITIONS`
in `labels.ts` is the worked example.

`DevPanel` (DEV only) exposes beat −/+/reset, resource grants, and
`window.karma`. Yields are low and the later beats trigger at high figures, so
this is the only practical way to reach them by hand.

## Parked

Design decisions deferred on purpose. None of these are oversights.

- **The token layer above the refinery.** Yellow is *bought* by pairing the two
  reds off, blue with yellow, and either red converts to its opposite at a steep
  scaling price. Matching therefore happens above the refinery, not inside it.
  The refinery itself is built — see Refinery below; these three purchases are
  not, and none of them has a price curve yet.
- **The Harvest layout** is stubbed pending a design pass: where Harvest's verb
  sits relative to its disc is an open question — don't improvise it. Overview
  is no longer one of these; see Overview below.
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

## Souls

The soul split is a **fraction**, not a count: the share of every cohort held
back from incarnating, taken proportionally, never chosen by flavour — the rule
`countMergeable` already follows for merging (§3.3). Reserved souls are still
yours, unlike merged ones. They only stop earning, and that is the whole of what
reserving costs. Rounding is per cohort, so `countReserved()` sums what each
cohort actually holds rather than recomputing from the fraction.

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

`Building.active` is the seam: how many of the count are producing. The base
returns all of them, `Cohort` subtracts the reserve, and both `#generateResources`
and `perSecond` read it — so income and the excess wall can never disagree about
who is working.

## Overview

One axis, three bands, each its own `Section` and its own reveal key: **Active**
(beat 8), **Behind** (beat 10), **Ahead** (beat 8). Active is pinned first — the
world you are on is the one you act on — and the other two follow in axis order.

**Behind is hidden entirely while it is empty**, rather than drawing an empty
line. It reveals at beat 10, when the first world is harvested, but you are still
standing on that world; it has nothing to list until you reach somewhere else.
Active and Ahead always draw, and Ahead carries the empty line.

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
`isFirstHarvestReady`, `PlanetData.firstHarvest` against `PlanetData.yields`. The
string `overview.harvest` now names a different panel than it did before; it is
worth knowing when reading an old diff.

### Reaching

`PlanetManager.reach(id)` is the verb, and **a world must be harvested before it
can be left**. That is the whole gate: a world is left for good, so leaving an
unharvested one would strand it — `finished` would never count it and beat 12
would go back to being unreachable, which is the circularity this was resolving.
It is one predicate, `canReach`, if that turns out to be the wrong call.

`behind` and `ahead` are derived on the manager, not on the screen, and they
partition by `harvested` around whatever is selected. The active world stays in
**where you are** after its first harvest — you are still on it until you reach
somewhere else — so it can read `merged` while sitting in the band it started in.

### The ledger reads nothing yet

`overview.harvest` is revealed **live at beat 8**, when nothing is behind you and
nothing pays. It draws its empty state until beat 10 and its rows after. It is
deliberately absent from `SYSTEM_SURFACES`: it precedes `finishedPlanets` by two
beats, which `validate()` would otherwise flag, and correctly.

Its rows are computed from `PlanetData.yields` over `duration`, so it fills the
moment step 5 authors them. Until then every finished world reads *nothing yet* —
which is honest, not a stub.

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
can be and would still be wrong for one of them.

### Open

Nothing in the game draws a planet yet — the medium, the swarm and two labs
exist; the placement does not. Surface objects do not exist, only the field they
would query. No parameter sizes a world against another, so the swarm has nothing
to scale with. And each view is its own WebGL context, which the workbench can
afford and an Overview list of one canvas per row cannot.

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

### What the row shows

The row used to print `perSecond('karma')` — production over duration and nothing
else — while the payout multiplied that by `karmaYieldFactor` and by the planet's
bias. So the cohort with `polarity_multiplier: 7` displayed the same figure at
Even as at Hard negative while really paying several times more, and extremity —
the entire reward for committing — was invisible. The row now shows **both piles
separately**, which is the only presentation that can carry the mix, the payoff
and the bias at once, and `badge.ts` already had `pos`/`neg` waiting for it.

Three rules hold it together:

- **Settled, not realized.** `aim.resolveSettled()` drops the drift term. Drift is
  redrawn every tick, and it lands hardest on exactly the cohorts where extremity
  pays — every one with `polarity_multiplier > 1` also has `resistance > 0` — so a
  live figure would churn by ~20% forever. The `LeanMeter` beside it already
  carries the wander, as a band. Drift is a span here, never a number.
- **The re-aim penalty stays out of the rows.** `AimSection` reports it once, as
  "karma down 65%". It is global and decaying; inside every row it would read as a
  per-cohort property and make the whole panel sag together.
- **One definition of income.** `countKarmaPerSecond()` sums the same split the
  rows display, so the excess wall and the screen cannot disagree. The cost is
  that the wall now moves with aim and with the phase — see Excess below.

**The arrow is the aim, not the wave.** It compares each rate against the same
rate at Even, so it says what *your* slider is doing to *this* cohort. That is
information only a row has: an unaimable cohort (`resistance: 1`) shows no marks
at all, which reads correctly as "your slider does nothing here". The tempting
alternative — an arrow for the coming phase flip — was refused as a row element
because phase is global, so every row would print the same bit. That belongs on
the wave display, once.

Note that nothing here *breathes*. `Planet.bias()` is a square wave, `1.4` or
`0.6` on `isDense`, so a rate sits flat for a whole phase and then jumps by a
factor of about 2.3. Making bias continuous over `position` is a real option, but
it changes the average bias across a phase and the wall reads income, so it is a
balance change and not a display one.

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

- **The soul split has no control.** `reserve` is real — see Souls below — but
  `detail.split` is still a `RevealStub`, so nothing but `DevPanel` can set the
  fraction. Beat 11 is reachable, not playable.
- **The recurring harvest has structure, no numbers.** `Planet.completeFirstHarvest()`
  flips `harvested`, banks the merged count and the polarity, and builds an emitter
  over `PlanetData.yields` — but no planet in `data/planets.ts` sets `yields`, so a
  harvested planet emits nothing. Deliberate: the payout is balance, and it is the
  one thing §3.9 says to ship flat first.
- **The merged count and polarity are recorded and unread.** `Planet.merged` and
  `Planet.polarity` are set at the first harvest and locked, but nothing consumes
  them. §3.9's tier 1 is a flat bonus, so this is the intended half-step.
- **The `harness` bucket in `data/upgrades.ts` is empty.** `global` and
  `refinery` are now authored; `harness` exists so there is somewhere for its
  upgrades to live, and nothing names one yet.
- **The refinery runs behind seven stubs.** The engine is live — see Refinery
  below — so souls in seats turn karma into red on a clock, and the rail sells
  the upgrades that move it. Nothing on the Refinery screen draws any of it.
- **Red has no sink.** Ochre is *bought* with equal parts Crimson and the
  opposite Crimson at a steep scaling price, both decided and neither built, so
  red only accumulates. The two purchases need a buyer, which is a screen.
- ~~**Nothing travels.**~~ Closed — `PlanetManager.reach` is the verb and the
  Ahead band is where it is taken. See Overview below.
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
| 1–12 | — | — |

Beat 11 counts, but read it with the asterisk in Known gaps: its trigger is live
and only `DevPanel` can satisfy it, because the split has no control yet. Beat 12
joined the column when reaching landed — it is the only beat that reveals nothing.

Stubs: **11 of 35**. Detail 5/8 · Overview 5/5 · Harvest 3/4 · Refinery 0/7.
`reading.excess` is real; `reading.tokens` still renders a literal `—`. The
refinery engine landed without moving this line — a running system and a drawn
panel are counted separately here for exactly that reason.

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
| 5 | `PlanetData.yields` | merged planets actually pay | balance |
| 9 | The token purchases — Ochre, Indigo, opposite Crimson | red gets a sink | price curves, and a buyer |
| 7 | Harvest and Refinery layouts | 8 stubs | design pass — see Parked |

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

### Refinery — engine built, screen not

**Matching does not happen inside the refinery.** Polarized karma always becomes
polarized Crimson; the refinery never pairs anything off. Ochre is *bought* with
equal parts Crimson, and the opposite Crimson is bought at a steeply scaling
price. CONTEXT v3 §3.5, which puts matched pairs inside the refinery emitting
Ochre, is **superseded** — amend §3.5 or annotate it, but do not re-derive the
question here.

What that makes the refinery is a **throughput** problem rather than a mix
problem: X karma every Y seconds, whatever the labels read as. Three axes, all
upgradable, and the `refinery` bucket now holds one upgrade for each:

| axis | moves | how |
|---|---|---|
| staffing | reserved souls working it | `min(reserve, seats)`, linear on the batch |
| efficiency | the X — karma per batch | `yield` modifiers |
| speed | the Y — seconds per batch | `duration` modifiers |

**The staffing knob is closed.** Staffing is a linear multiplier on the batch,
and bought *seats* cap how many souls can work. It appears in X and never in Y —
in both, throughput would go quadratic in souls and the other two axes would be
decorative. Seats pay off exactly when there are souls to fill them, which
couples the split to the upgrades instead of stacking with them.

That leaves efficiency and staffing both scaling X, which is only worth keeping
apart because they are *paid* differently — staffing costs incarnations every
second it is held, efficiency is bought once. Batch and interval stay genuinely
distinct for a separate reason: at equal throughput, big slow batches leave karma
sitting unrefined longer, and unrefined karma is exactly what excess measures.

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

`seats` is a third `ModifierStat` beside `yield` and `duration`. Only yields are
keyed by resource, so `ModifierSet.#isApplicable` now asks that question for
yields alone rather than excluding `duration` by name.

`refinery` is also the first upgrade bucket whose scope names **no entity and is
not global**: there is exactly one refinery, so `parseScope` returns a `refinery`
kind and `UpgradeManager` routes its modifiers to the singleton. Verbs (`unlock`,
`acquire`, `discover`) still act on entities only, so a refinery upgrade is
always a modifier.

Parked: **soul types feeding the refinery differently**, and any partial-staffing
curve where empty seats slow the batch rather than shrink it. Both were
considered and set aside as too complex for a first pass.

Still open, and none of it mechanical: every figure in the bucket and in
`refinery.svelte.ts` is a placeholder, the seven stubs are untouched, and red has
nowhere to go until the token purchases exist.

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

Consequences worth naming before anyone balances against this:

- **Spending karma lowers excess**, because excess is a stock of unspent karma.
  §3.2's "exactly two ways down" is about deliberate tools; this is an incidental
  third. It has not been closed.
- **The wall is zero until something earns karma automatically**, so `getExcess()`
  returns `undefined` rather than `0` — a zero would read as clean enough and
  open beat 9 on nothing.
- **Reserving souls raises excess before the refinery lowers it.** Reserved souls
  do not earn, so staffing the refinery shrinks the denominator and the karma you
  are holding reads as a larger share of a smaller window. This follows from the
  wall being income-shaped and was not designed; it may be the right tension — you
  pay to clean up — or it may be a spiral. Untested either way, and it is one more
  thing that moves if the wall does.
- **Aim and the phase now move the wall.** `countKarmaPerSecond()` reads the same
  split the rows show — see "What the row shows" under Aim — so it carries
  `karmaYieldFactor` and `Planet.bias()`. Aiming into a high-`polarity_multiplier`
  cohort widens the wall several-fold and the excess reading falls; the phase flip
  swings it by up to 2.3× on its own. This was taken deliberately, to avoid two
  disagreeing definitions of karma per second, and it is the change most worth
  reverting first if excess starts reading strangely.

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

Every cohort bucket opens with `first` — `['unlock', 'acquire']`, which builds
the cohort and hands you one of it. It was `core_0`, a word that named a position
rather than a thing, on an index no bucket ever reached `_1` of honestly. The
`autonomy` verb never appears beside it: `BuildingManager.acquire` switches
autonomy on at the first non-click acquire, so authoring it is redundant, and its
case in `#processEffect` stays commented out.

`cohort:basic/first` is unpriced for a reason that is not balance: the rail
arrives at beat 4 and the cohort table at beat 3, so a *priced* first cohort has
no buyer until after the beat it is supposed to cause. It was `['unlock',
'autonomy']`, which builds the cohort at count 0 and grants nothing, so beats 3
and 4 could only ever reach on their floors. Don't re-price it without giving the
opening another buyer first.

`cohort:steady/speed_1` was `core_1`, the one second entry upgrade, and its
`autonomy` effect bought nothing. It keeps its price and its title and now moves
what steady conspicuously lacks: `duration_reduction: 0` makes it the one cohort
that never speeds up with count. Placeholder figure.

`global` holds two priced triggers and nothing else, so `effect` is now optional
on `UpgradeData` — an upgrade whose whole content is the purchase. That is what
made `wider_wave` the wrong word: the scope cannot widen anything, and beat 5
calls the wave *a clock you read, not a lever*. It is `read_the_wave`. Both are
priced rather than granted, because beat 6 is *how dirty do you want to run* and
a choice you are handed is not one.

Beat 6 lost its `total('karma_negative') > 0` fallback in the same edit. `aim`
returns `positiveShare: 1` until beat 6 runs `negKarma`, so that pile could not
exist before the beat that tested for it — a second route on paper only.

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
