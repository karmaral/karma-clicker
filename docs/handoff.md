# Handoff — 2026-08-15 (Souls: orbits around the planet)

Five sessions of work are now uncommitted on top of `rebuild checkpoint 5`.
Sessions 1–4 were carried in the previous handoffs; this session built **the soul
swarm**, in the planet's own medium — orthographic, ink-only, sized in body
radii — and stood up a second lab to author it.

The Overview work (Part 3) is untouched by every visuals session and **has still
never been played.**

`npm run check` reports the same 12 pre-existing errors throughout, none in any
file any session touched — itemised under Housekeeping. Last run at the end of
this session: `COMPLETED 1322 FILES 12 ERRORS 2 WARNINGS 5 FILES_WITH_PROBLEMS`.

## State of the tree

```
 M docs/handoff.md            M src/lib/labels.ts
 M docs/progression.md        M src/lib/managers/planet-manager.svelte.ts
 M src/features/dev/DevPanel.svelte
 M src/features/overview/OverviewScreen.svelte
 M src/lib/planets/base.svelte.ts
 M src/lib/progression/beats.ts
 M src/lib/progression/keys.ts
 M src/widgets/Widgets.svelte
 M tsconfig.json
?? src/data/planet-visuals.ts
?? src/features/overview/HarvestLedger.svelte
?? src/features/overview/PlanetDetail.svelte
?? src/features/overview/PlanetList.svelte
?? src/widgets/LabPanel.svelte          new this session
?? src/widgets/PlanetLabPanel.svelte
?? src/widgets/SwarmLabPanel.svelte     new this session
?? src/widgets/planet-lab.svelte.ts
?? src/widgets/planet/                  + orbit.ts, SoulSwarm.svelte
?? src/widgets/swarm-lab.svelte.ts      new this session
```

---

# Part 1 — Souls: orbits (this session)

## How this session was verified

Precisely, because it is uneven, and because a previous handoff got this wrong in
the other direction:

- **The assistant has not seen a single frame of any of it.** Headless Chrome
  would not produce a file for `http://` URLs in this environment (a
  `data:text/html` probe with a fresh `--user-data-dir` did work, so the
  mechanism is fine and the http case is the unsolved part). Everything below is
  code that typechecks.
- **The author drove the swarm lab.** `DEFAULT_SWARM` in `orbit.ts` now holds
  values that came out of the lab's `copy` button — `printSwarm`'s four-decimal
  form, and not numbers the assistant authored. The file's mtime (20:00:26) is
  after the last assistant edit to `material.ts` (19:54:44) and `Widgets.svelte`
  (19:55:15), and the dev server logged an HMR of `orbit.ts`'s importers at that
  same second. So the swarm was on screen, with the ring and with the far half
  already removed, and was tuned there.
- **What that does not establish:** whether the ring and the back-half removal
  were *judged* — a paste preserves whatever the sliders were at, and `ring`
  came back at exactly its authored 0.3. Nobody said in words that either looks
  right. Treat both as seen but unsigned.
- **Motion has not been reported on by anyone.** `speed`, `speedScatter`, the
  alternating direction and `wobble` all only exist in a running frame.

## What a swarm is

`orbit.ts` — the whole model, ~200 lines, no three.js in it.

**A cohort is a band of orbits, not a ring.** Every soul runs its own trajectory,
drawn from its band's by three scatters: `radiusScatter` and `tiltScatter`
thicken the band, `nodeScatter` opens its plane out into a shell. All three at
zero collapses a cohort to one wire, which is the failure mode to recognise.

A band comes from its **index alone** — `bandAt(index, visual)` — so cohort 3
looks like cohort 3 on every world and nothing is authored per planet. Radius
steps by `spacing`; inclination alternates sign by `tiltStep`; **direction
alternates with inclination.** That pairing is deliberate: counter-rotation is
only jarring between bands sharing a plane, so separating the planes first is
what makes opposed directions read as two orbits rather than as a mistake against
the body's spin. Nodes step by the golden angle so no two planes line up by
arithmetic.

A soul is stored as an **orthonormal basis for its own plane**, so the hot loop
is two cosines and six multiplies with no matrices and no allocation. `SOUL_CAPACITY`
is 256; past that a band wants a stream, not more instances.

**Nothing in the swarm is game state.** It is handed `counts: number[]` and never
learns what a cohort is — the same separation `Planet` and `PlanetVisual` keep.

## Structure vs. content — the call the sizing rests on

The planet's outline is authored **in pixels**; souls are authored **in body
radii**. That is not an inconsistency, it is the distinction:

- The outline is *structure* — the drawn edge of the widget, which must hold its
  weight at 40px and at 420px alike.
- Souls are *content*. A px-authored dot at 40px is nearly as wide as the world
  it orbits, and the swarm reads as noise. Scaling with the body is also the only
  thing that makes a cinematic push-in work, since `zoom` then carries them.

`dotFloor` is the one px-authored number in the swarm — the size a dot never
falls below, so a small widget has dots rather than dust. It enters at draw time
only, as `visual.dotFloor / zoom`.

## Two inks, and nothing behind

Souls carry `outTone` (off the body) and `frontTone` (in front of it), chosen
**per fragment** via an analytic sphere test in view space. Per fragment matters:
a dot straddling the silhouette is cut into two halves rather than switching
colour when its centre crosses, which at 4px reads as a bug.

**The far half is discarded.** A pale third ink was built for it and then cut at
the author's call — motion already says the path closes, and a dot that is
neither in front nor gone only asks to be read as a nearer dot.

The discard is analytic rather than `depthTest: true`. Both hide the far half;
only this one hides it at exactly `rim`, which is where the ink already switches.
Depth testing would cut along the displaced terrain while the ink cut along the
sphere, and the two would disagree by more as `amplitude` grows. `depthTest` is
therefore still `false`, and the comment on it says why.

This is the answer to the **per-fragment depth ink** that the previous handoff
banked as "the problem the game will hit when the swarm is joined to the planet,
and it is unsolved". It is solved, and the solved version is smaller than the
banked one because one of the three cases turned out not to be wanted.

## The ring

Each dot carries a contrasting ring, `ring` as a fraction of its radius. The
argument is the planet's own outline argument: place can only know what a soul is
*near*, not what is *under* it, and the body owns the whole ramp — so a dot in
one ink will eventually sit on that ink. A ring carries both ends of the ramp on
every dot.

Two decisions inside it:

- **The quad grows to hold it** (`span *= 1 + uRing`), so the fill stays the size
  `dot` says and the ring is added around a dot rather than eaten out of one.
- **Its ink is derived, not authored** — the far end of the ramp from whatever
  the fill landed on. A fourth authored tone would need setting once per place a
  soul can be, and would still be wrong for one of them.

**Known limitation, unfixed:** at widget sizes (40–80px) dots sit on the
`dotFloor`, so a `ring: 0.3` is a fifth of a pixel and contributes nothing there.
Making it work small needs a px floor for the ring too, which means the shader
learning `zoom` and per-instance size. Deliberately not built — see whether it is
wanted at true size first.

## The second lab

`PlanetLabPanel` was split: everything generic moved into **`LabPanel.svelte`**
(grouped sliders, double-click reset, a `header` snippet, an `under` snippet per
row), and both panels are now thin. The planet lab sits right, the swarm lab
left, and the page's padding was widened to keep clear of both.

`LabPanel` takes a `value: (key: string) => number` **accessor** rather than a
record, because a TS `interface` gets no implicit index signature and
`PlanetVisual`/`SwarmVisual` are interfaces. It styles snippet-provided rows
through `:global()`, so a consumer's own `input[type=range]` matches the built-in
ones from one place.

**Cohort counts live in the lab, not in `SwarmVisual`.** `swarm-lab.svelte.ts`
holds a separate `size = { bands, per }` and derives `counts` from it, so the
sliders exist without `printSwarm`'s pasteable literal ever learning about game
state.

## Where it renders

`Widgets.svelte` gained a **Souls — orbits** section: the subject at 420px, one
cohort and two beside it, then the whole swarm across the true-size strip on
`--surface`. `swarmFrame` is 3.2 rather than the body's 2.5, because rim-hugging
orbits need more room than a bare body.

```
src/widgets/planet/
  orbit.ts      bands, scatter, basis, placement — no three.js         new
  SoulSwarm     one InstancedMesh, billboarded and sized in the shader new
  material.ts   + soulVertex / soulFragment / createSoulMaterial
src/widgets/swarm-lab.svelte.ts    draft + workbench counts            new
src/widgets/SwarmLabPanel.svelte   the panel                           new
src/widgets/LabPanel.svelte        extracted from PlanetLabPanel       new
```

## Decisions worth re-deciding

- **Billboarding happens in the vertex shader, in view space** — not by composing
  a camera quaternion with the body's tilt group on the CPU. Cheaper and it
  cannot drift out of sync, but it does mean the quad has no world orientation
  anything else can read.
- **The body is treated as a sphere in the soul shader**, terrain ignored. At the
  amplitudes worlds are authored at, the error is inside the outline's own
  weight. A world at the far end of `amplitude`'s range will show it.
- **One swarm record for all worlds.** Every planet's souls orbit the same way; a
  per-planet swarm is a decision nothing has asked for. Trivial to split later —
  `swarmLab` would just gain the planet lab's `drafts` shape.
- **`ring`'s ink is derived from the fill.** If a ring ever wants to be paper on
  both inks, that is an authored tone and this goes.

# Part 2 — What does not exist

- **No screen draws a planet or a swarm.** `PlanetView` is referenced only by
  `Widgets.svelte`. `OverviewScreen`, `PlanetList` and `PlanetDetail` are
  untouched by any visuals session.
- **The old swarm stack is still there and is meant to go.** The author has said
  `ParticleSwarm.svelte`, `PlanetWidget.svelte`, `Scene.svelte`,
  `RingParticle.svelte`, `dots.svelte.ts`, `dot-types.ts` and
  `planet-widget-controller.svelte.ts` "can go away entirely". Nothing was
  deleted, and the **Swarm — existing** section is still at the bottom of
  `Widgets.svelte` rendering them. Deleting it is the cheapest open task in the
  tree; it was left because the new swarm has not been signed off.
- **Nothing reads `$data/planet-visuals` except the lab.** `Planet` does not know
  it exists, which is deliberate, but it also means no id mismatch is caught —
  `cool_1`, `ridged` and `banded` are not planets.
- **A `scale` parameter does not exist**, and now there is a swarm for it to
  size. Planned: size the body and its souls together, so apparent size is
  carried by something other than the disc. This is why `amplitude`'s range runs
  far past anything authored — deformation is meant to read as a small body,
  roundness as a large one.
- **Surface objects do not exist.** Only the field they would query.
- **A band-budget readout was considered and not built.** It would show, live,
  what share of the ramp `land` and the shade each own — the thing that had to be
  measured offline to find a bug two sessions ago.
- **The cap-sum field is still the strongest unbuilt idea.** Land as three
  continents at 0.42 rad, six regions at 0.20, seven craters at 0.09 — terrain
  authored as *feature size in radians*, which drops into `field.ts` as another
  `rawHeight` and inherits normalisation for free. With it comes a type→parameter
  table (asteroid, frozen, ocean, gas giant…), which is the answer to the
  id-mismatch problem: derive a picture from type + seed and let
  `planet-visuals.ts` become overrides rather than the only source.

## Still true from earlier sessions

The four calls the medium rests on — orthographic camera, Threlte sizing an ortho
frustum in pixels so `zoom` is px per world unit, a radially-offset inverted
hull, and ink-only enforced through the ramp — are unchanged and still the
load-bearing part. The swarm was built on all four; `readRamp` is shared verbatim
between the surface and soul shaders, because GLSL ES 1.00 forbids dynamic
indexing into a uniform array and the workaround must not be written twice.

`field.ts` is still the seam: one TS implementation of the noise, never
duplicated into GLSL, so a marker and the terrain under it cannot disagree.

**The texture/shade split** from last session stands: texture is `land · height +
bias` quantised alone; shade is `rim + key` quantised on its own and applied as a
shift of `shadeDepth` whole slots along the ramp. `readRamp` clamps, so deep
shadow crushes to solid ink rather than wrapping — an engraving's behaviour, and
intended.

Written up under **Planet visuals** in `progression.md`, which gained a **Souls in
orbit** subsection this session for the four decisions above — bands over rings,
index-derived bands with direction paired to inclination, structure-in-px against
content-in-radii, and ink by place with nothing behind.

## `planet-visuals.ts` — partly un-stale now

The previous handoff said all six entries were stale after the texture/shade
split. **That is now wrong for two of them.** `first` and `second` were
re-authored this session (mtime 20:09:51, after all the swarm work) and carry
non-zero `shadeDepth`, `relief`, `clip` and `contour` — `first` also went to a
signed `amplitude` of −0.075, which is the engraved direction.

`third`, `cool_1`, `ridged` and `banded` still sit at `shadeDepth: 0, relief: 0,
clip: 0, contour: 0` — untouched since before the split, and `third` and `cool_1`
are the two whose terrain was measured at under one band step, so they are very
nearly blank without the shade. The file header now says which two are current
rather than condemning all six.

## Housekeeping

- **The 12 `check` errors have gone unowned for six sessions.** They are the
  baseline every session is measured against, which only works while the count is
  memorised — a thirteenth would hide in it. Four unrelated faults, more than half
  one fix:

  | Count | Where | What |
  |---|---|---|
  | 7 | `Preview.svelte` | `costs` literals typed against the full `Record<ResourceType, number>` instead of `Partial`. One widening fixes all seven. |
  | 2 | `Chip.svelte` | tippy props — `placement` absent from `Partial<Props>`, and two `Partial<Props>` with nothing in common. |
  | 1 | `CohortRow.svelte` | tooltip `delay` given `number[]` where a `[number, number]` tuple is required. |
  | 1 | `notification-manager.ts` | Svelte 5 `Component<Props>` assigned to a legacy `SvelteComponent` slot. |
  | 1 | `UpgradeRail.svelte` | reads `.effect` off `Upgrade`, which has no such property. |

  Only the last is a live defect rather than a typing lapse. It is
  `{upgrade.effect || ''}` in the caption snippet, so the `.effect` span has been
  rendering empty on every chip since it was written — the `|| ''` is what hides
  it. Decide whether that caption wants `UpgradeData.effect`, or whether it goes.

- **Removing a uniform breaks HMR until a reload.** Cutting `uBackTone` made
  `syncSoulUniforms` throw `Cannot set properties of undefined (setting 'value')`
  in the author's browser, because the effect ran against a material built before
  the module reloaded. Harmless and cleared by F5, but it will happen again on
  the next uniform removal, and it looks like a real crash in the overlay.
- **Never put a backtick inside the GLSL template literals** in `material.ts` — it
  closes the string and TypeScript starts parsing shader source as TS.
- Each `PlanetView` is its own WebGL context; the workbench now stands up eleven
  with swarms in nine of them. Fine there, but the Overview list cannot take one
  canvas per row.
- `progression.md`'s opening line still claims the doc covers `$lib/progression`.
  It has carried Excess, Scopes, Naming, Refinery, planet rendering and now the
  orbiting souls for a while.
- `printVisual`/`printSwarm` emit every field at four decimals. Paste indentation
  has drifted once already.

---

# Part 3 — Overview (unchanged, still unplayed)

## What was decided, and by whom

Four calls were the owner's, taken before any code:

1. **Three separate sections**, not one segmented roster — each band its own
   `Section`. Labelled **Active**, **Behind**, **Ahead**, stacked in that order.
   Behind is hidden outright while empty.
2. **The verb travels with the selection.** Picking a world in any band feeds the
   right column; Harvest and Reach are buttons in that column.
3. **`overview.setOut` deleted**, beat 12 reveals nothing. It is now the only
   beat that reveals nothing, and the log already carries its line.
4. **`cameHome` → `harvest`, `harvest` → `firstHarvest`.**

The rationale is written up under **Overview** in `progression.md`.

## First-harvest conditions are single-sourced

`Planet.#unmet` and the Ahead row had independently authored orders. Both now
walk `FIRST_HARVEST_CONDITIONS` in `labels.ts`, with the predicates in
`Planet.#isConditionMet`.

**`strict` is false in `@tsconfig/svelte`**, so an un-handled switch case returns
`undefined` and typechecks clean. Completeness is carried by a
`Record<FirstHarvestCondition, number>` and two `const unhandled: never` guards,
both of which do fail without `strictNullChecks`. Verified by adding a third
condition — `check` went 12 → 15, naming exactly three sites — then reverted.

## The one call that was the assistant's

**Reaching requires the current world to be harvested** — `PlanetManager.canReach`.
The owner's answer replaced the question about placement and did not settle the
gate; this reading keeps beat 12 reachable, because a world is left for good and
leaving an unharvested one strands it. Reverting is one line, but decide what
happens to a stranded world first.

## What to watch when it is played

Nothing on this list has been clicked. The DevPanel row **unlock all planets**
makes the axis walkable; reaching still needs a real harvest, which needs
`1 age lived` and `excess under 12%` on the first world.

- Active and Ahead at beat 8. **Behind stays invisible at beat 10** — it reveals
  there, but you are still standing on the world you just harvested. It should
  appear only after the first Reach.
- An Ahead world giving **Reach**, disabled, reading *Harvest Planet 1 first*.
- The active world staying in **Active** after its harvest, reading `merged`.
- The right column's band label agreeing with the list the selection came from —
  authored in two files, nothing enforces the match.
- Beat 12 firing at all. It never could before.
- `HarvestLedger` empty until step 5. Intended, not a bug.

## Housekeeping

- **`Planet.harvested` should be `isHarvested`.** Same rule catches
  `ResourceEmitter.autonomous` and `.inProgress`, and `Building` re-exposes both.
- **`completeFirstHarvest` can hang.** A planet declaring `yields` without
  `duration` gives `ResourceEmitter` a `0` and `queue()` re-queues forever.
  Latent until step 5 — which is exactly the step that would trip it.
- **Band labels authored twice**, in `OverviewScreen` and `PlanetDetail.getBandLabel`.
- **`planets-texts.ts`** still carries `Planet 1 / Simple` placeholders, now drawn
  on screen by `PlanetDetail`.

---

## Untouched roadmap

In `progression.md`'s course table: `PlanetData.yields` for the recurring harvest
(step 5), the token purchases (step 9), and the Harvest / Refinery layouts (step
7) — two screens now, both parked on the same question Overview answered: where
the verb sits.

Still outside that table: **authoring `log-texts.ts`**, sixteen placeholder lines.

Not in the table at all: **placing the planet widget in the game**, **re-authoring
the four remaining stale visuals**, **deleting the old swarm stack**, and **the
cap-sum field with its type→parameter table**, which is the piece that would give
every planet a picture without hand-authoring one.
