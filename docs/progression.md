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
world would pay once and never again, which is harder to notice than a freeze and
lands nine times over at step 5. No record changed — nothing declares a harvest
yet, which is exactly why the shape was cheap to fix now.

A `duration` of 0 stays legal and means *pays once*. `HarvestLedger` reads it that
way and shows no rate, rather than dividing by zero.

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

**Ahead's rows carry pictures**, snapshots rather than live views — see *A still
world needs no context*. Behind and Active are one prop away and wait on whether a
silhouette reads at forty pixels.

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

### The ledger reads nothing yet

`overview.harvest` is revealed **live at beat 8**, when nothing is behind you and
nothing pays. It draws its empty state until beat 10 and its rows after. It is
deliberately absent from `SYSTEM_SURFACES`: it precedes `finishedPlanets` by two
beats, which `validate()` would otherwise flag, and correctly.

Its rows are computed from `PlanetData.harvest`, yields over duration, so it fills the
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
can be and would still be wrong for one of them.

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
- **Spin zeroed for the capture.** A manual frame's delta is however long since
  the last one, so a turning world would land on a different face every time.
- **One pending job per asker.** A lab slider drags at sixty asks a second and
  only the last answer is ever drawn.

Two numbers stop being px-constant at row scale, and they are the whole of the
open question — whether these silhouettes read at forty pixels. `bleed` is
`outline / zoom`, and every world ships `outline: 2`: at 400px that is 0.8% of
the body radius, at 48px it is around 9%. `contour` is 1–1.5px against bands
44px across. Chunky ink may be exactly right for a list row, the way an icon is
chunky, but it is a choice. The `#stills` strip in the lab is where it gets
looked at — the family at five row sizes with the framing on a slider, forty-five
pictures, which only exists because they cost nothing.

If it reads badly the answer is a derivation for stills, not an edit to the nine
records. `detail` at 26–36 is ~17k triangles, which would matter for a live view
and does not matter at all for something drawn once.

**The shared renderer is parked, not abandoned** — see *Parked*. It is what a
screen wanting many *live* worlds would need, and nothing wants that yet.

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
  flips `isHarvested`, banks the merged count and the polarity, and builds an emitter
  over `PlanetData.harvest` — but no planet in `data/planets.ts` declares one, so a
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
| 5 | `PlanetData.harvest` | merged planets actually pay | balance |
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

### The context files are themselves an open task

Not a step in the table, because it moves no number in the gauge — but it is work
that is owed. CONTEXT v3 has been superseded in at least two places by decisions
recorded here (§3.5 by Refinery, §3.2 by Excess) and neither has been amended at
the source, so the design docs and this file now disagree and only this file knows
it. `handoff.md` and `progression.md` have also grown by accretion across fifteen
sessions: the widget rationale is most of the length and sits under a heading about
progression, and the same facts are stated in both files at different lengths.

What is wanted is a pass over the whole set — which document owns what, what gets
amended at the source rather than overridden downstream, and what the per-session
workflow between them is. Cheap to defer and it compounds: every session that ends
without it writes into a shape nobody has decided.

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
