# Handoff — 2026-08-15b (Anchors: the harness poles)

Sessions 1–5 are committed as **`rebuild checkpoint 6`**. This session — session
6 — is uncommitted on top of it. It built **the anchors**: solids standing on the
planet's surface in two states, placed and a dashed ghost, at the count's own
symmetric figure. It also took two things *out* of `PlanetVisual` on the way,
which is the part to read carefully if you are picking this up cold.

The Overview work (Part 4) is untouched by every visuals session and **has still
never been played.**

`npm run check` reports the same 12 pre-existing errors throughout, none in any
file any session touched — itemised under Housekeeping. Last run at the end of
this session: `COMPLETED 1328 FILES 12 ERRORS 2 WARNINGS 5 FILES_WITH_PROBLEMS`.
A production `vite build` also ran clean mid-session.

## State of the tree

Uncommitted on top of `7690496 rebuild checkpoint 6`:

```
 M docs/handoff.md                    M src/widgets/planet-lab.svelte.ts
 M docs/progression.md                M src/widgets/planet/PlanetBody.svelte
 M src/data/planet-visuals.ts         M src/widgets/planet/PlanetScene.svelte
 M src/widgets/LabPanel.svelte        M src/widgets/planet/PlanetView.svelte
 M src/widgets/PlanetLabPanel.svelte  M src/widgets/planet/SoulSwarm.svelte
 M src/widgets/SwarmLabPanel.svelte   M src/widgets/planet/geometry.ts
 M src/widgets/Widgets.svelte         M src/widgets/planet/index.ts
                                      M src/widgets/planet/material.ts
                                      M src/widgets/planet/visual.ts
?? src/widgets/AnchorLabPanel.svelte
?? src/widgets/LabRail.svelte
?? src/widgets/anchor-lab.svelte.ts
?? src/widgets/planet/Anchors.svelte
?? src/widgets/planet/anchor.ts
?? src/widgets/planet/light.svelte.ts
```

---

# Part 1 — How this session was verified

Uneven, and worth being exact about, because the previous two handoffs each got
this wrong in a different direction.

- **The assistant did see rendered frames this session, for the first time.**
  The previous handoff recorded headless screenshots of `http://` URLs as
  unsolved. They are solved — the recipe is under Housekeeping. What was seen was
  the anchors **at their first defaults, before any of the five edits below**:
  the tetrahedron at 2 of 4, one solid pole on the right rim, one dashed ghost on
  the left, the 2–8 figure strip drawing, and both left-hand labs stacked in the
  new rail.
- **Nothing after the five edits has been seen by the assistant.** The author
  asked it to stop screenshotting — *"I have the dev server up and I'm watching
  all the time"* — so the size slider, the key-lit facets, the inverted
  unoccluded ghost, the removal of faceting and the global light are code that
  typechecks and builds, and nothing more from this side.
- **What the author said, precisely.** "Good" after the first build, then five
  edits; "Great" after they landed. The author had the dev server open
  throughout. That is a real signal and it is not a frame-by-frame sign-off:
  **nobody has described in words** how the ghost's back-half fade reads, whether
  one ramp slot is the right amount of shadow on a facet, or what the shared
  light did to the four stale worlds.
- **One observation the assistant did make, at the old defaults:** anchors read
  mostly *at the rim*. A radial spike pointing at the camera under an orthographic
  projection is a small flat polygon lying on the terrain and nearly vanishes.
  That is inherent to the projection, and is presumably why the 2D drawing put
  poles on the border. It is now tunable rather than fixed — `size`, `faceShade`
  and `chamfer` all bear on it — but it is the first thing to judge.

---

# Part 2 — The anchors

## What an anchor is

`anchor.ts` — the whole model, no three.js in it, the same shape `orbit.ts` has.

**Placement is the count and nothing else.** Anchors stand at the optimal
spherical codes for n ≤ 8, every one a named symmetric figure: single, antipodal,
triangle, tetrahedron, triangular bipyramid, octahedron, pentagonal bipyramid,
square antiprism. The antiprism's latitude is solved rather than guessed —
`y² = √2/(4+√2)`, the value that equalises its two edge lengths, which is what
makes it *the* eight and not just an antiprism; the 74.86° separation falls out.
`phase` turns the whole figure about the body's axis, which is the only way to
aim a vertex at the viewer without turning the world.

This supersedes the design handoff's equator ring (§2), by the author's call.
The reasoning is written up in `progression.md`. Two and three come out as a ring
either way, so nothing the 2D work judged is lost.

**The solid is three rings.** A sharp pyramid's profile has two corners — base
rim and apex — and one `chamfer` cuts back both. 0 is a plain n-gonal pyramid,
0.5 is two frusta base to base, and between them the silhouette is the
cut-cornered polygon of the 2D mark. `sides` runs 3–8, so the handoff's 3-sided
cone is one setting of it.

**The base reads `field.sampleRadius`**, so a pole stands on the terrain rather
than on the sphere the terrain was displaced from. The reference parks anchors at
a flat `0.99 × node`; on `first`, whose amplitude is a signed −0.075, that would
float a pole over its own pit.

**`size` is the only magnitude on the panel.** `radius: 0.105` and `height: 0.17`
stay in the record as the authored proportion; `size` multiplies both, and `sink`
with them. It is deliberately the hook for the parked world-scale parameter.

## The two states

**Placed** is the fill plus its edges. The fill is lit by the system's key —
`0.5 − 0.5·dot(N, keyDir)` — with `faceShade` at 1, so a facet is `--surface` or
exactly the next slot down and nothing between. Edges are tone 6. The facet
normal comes from screen derivatives with `facet.z` sign-forced, which is exact
for front faces of a convex solid under an orthographic camera and needs no
normal attribute.

**Unplaced** is the same edges, dashed, hollow, and **never occluded** —
`depthTest: false`. An anchor's place does not stop existing when the world turns
away from it. It says it is far by fading `ghostFade` slots toward the *middle*
of the ramp, which is away from whichever end its ink was chosen to contrast
with, so both halves of the rule pale by one gesture.

Its ink is chosen **by place, not by state**: `ghostTone` (paper) over the body,
`ghostOutTone` (ink) over the canvas, switched per fragment on the mean sphere.
So it inverts against whatever it crosses instead of picking one grey and losing
half of it. That is the harness's own ink rule, one cell short.

**The front/back reading is per anchor, not per fragment** — taken from the
object's origin in the vertex shader. This is the *opposite* of the souls' rule
and deliberately so: a dot straddling the silhouette should be cut in half, but
an anchor is a place and a place is on one side or the other. Per fragment also
called a sunk base far-side while its own tip was near, which would have
flickered on every rim anchor.

The dash is measured in pixels off an `along` arc-length attribute baked into the
geometry, and runs continuously across corners rather than restarting at each
vertex. Structure is authored in px here as everywhere.

## The render stack

Now stated in one place, in `Anchors.svelte`:

```
0  body
1  placed anchors (fill + edges, depth-tested, polygonOffset on the fill)
2  unplaced ghosts (no depth test)
3  souls
```

The handoff draws anchors *last*, at 3/4. That is reversed here: its souls had no
depth cue of their own, ours discard everything behind the world already, so a
soul that is drawn at all is in front of the surface an anchor stands on and
should pass over it. `SoulSwarm`'s renderOrder went 2 → 3 for this.

**Known consequence, unjudged:** a ghost overlapping a placed anchor on screen
will show its dashes straight through the solid. With eight nodes pushed
maximally apart that should not arise; nobody has watched for it.

## Where it renders

`Widgets.svelte` gained an **Anchors — the harness poles** section: the subject
at 420px, one beside it carrying souls as well, all seven figures at 160px, then
the true-size strip.

```
src/widgets/planet/anchor.ts       figures, solid, params — no three.js   new
src/widgets/planet/Anchors.svelte  the groups, three materials            new
src/widgets/planet/light.svelte.ts the system's one key aim               new
src/widgets/planet/material.ts     + anchor face / edge / ghost shaders
src/widgets/planet/PlanetBody      + a `standing` slot, inside the spin
src/widgets/planet/PlanetScene     + the field, built only when anchored
src/widgets/anchor-lab.svelte.ts   draft + workbench count/placed         new
src/widgets/AnchorLabPanel.svelte  the panel, naming the figure           new
src/widgets/LabRail.svelte         a side, so two panels can share one    new
```

`PlanetBody` now has two slots and they mean different things: `children` is
outside the spin (orbits), `standing` is inside it (anything on the surface).

`LabPanel` lost its `side` prop — a panel no longer owns a position, a `LabRail`
does, which is what let a third lab exist without the second moving. Swarm and
anchor labs stack left, planet lab keeps the right.

`PlanetScene` builds a second `SurfaceField` for the anchors, but only when a
world is anchored. Reactivity does the right thing by itself: the construction
reads the shape fields, and `clip`/`amplitude` are read inside the returned
closures, so dragging a tone slider rebuilds nothing.

---

# Part 3 — Two things left `PlanetVisual`

Both are the author's calls, taken this session. Neither is reversible by a flag.

## `keyX` / `keyY` → one system light

The key's **aim** now lives in `light.svelte.ts` and is read ambiently, exactly
the way `readInkRamp` already reads the ramp — no prop drilling, and the surface
and anchor materials cannot disagree. `key`, the **weight**, stays per world:
how much of the light a world takes is a property of the world; where it comes
from is not.

The shared value is `(0.619, 0.622)`, which is `first`'s. The four current
worlds all sat in that same quadrant — `second` at (0.619, 0.654), `third` at
(0.635, 0.638), `cool_1` at (0.603, 0.416) — so none of them moves far. Only
`ridged` and `banded` were elsewhere, at the untouched default of (−0.45, 0.45),
and they are specimens wanting a lab pass regardless.

The puck is still in the planet lab, under Key, relabelled **Direction (shared)**.
It no longer dims at Key 0 — it is not inert any more, because the anchors always
use it. `planetLab.aim` is gone; the puck calls `keyLight.point`.

## `faceting` is deleted

Removed from the type, the params, the defaults, the shader (`uFaceting`, the
flat-normal derivation, and the now-unused `vViewPos` varying), and all six
worlds. The shade is unconditionally the field's own surface normal.

Two stale comments were selling it and are fixed: `geometry.ts`'s header claimed
smooth and faceted shading were "one slider apart", and the true-size strip in
`Widgets.svelte` said it existed to judge facets.

**Watch for:** `detail`'s doc comment used to end by saying coarse meshes had a
use. They no longer do — `detail` is a pure quality knob and worlds should push
it as high as they can afford.

---

# Part 4 — What does not exist

- **The loops are the next thing and are unbuilt.** The construction is specified
  in `_Context/design_handoff_planet_disc/README.md` §2: every *pair* of anchors
  carries a family, each loop a true slerp between them bulged outward by a sine
  and rotated about the A–B chord. **The twist is not optional** — a planar loop
  collapses to a hard straight needle every time it turns edge-on. `tw = ±0.26`,
  sign alternating per amplitude level. Rotations: 4 over 0…2π for an antipodal
  pair, 3 over ±0.62 rad otherwise, because a full sweep on a non-antipodal pair
  drives loops through the body. Loop count rises with anchor count; at eight
  that is 28 pairs, which is the first thing that will need a budget.
  `nodesFor` is exported for exactly this.
- **No screen draws a planet, a swarm or an anchor.** `PlanetView` is referenced
  only by `Widgets.svelte`.
- **The old swarm stack is still there and is meant to go.** The author has said
  `ParticleSwarm.svelte`, `PlanetWidget.svelte`, `Scene.svelte`,
  `RingParticle.svelte`, `dots.svelte.ts`, `dot-types.ts` and
  `planet-widget-controller.svelte.ts` "can go away entirely". Nothing was
  deleted and the **Swarm — existing** section still renders them. Still the
  cheapest open task in the tree.
- **Nothing reads `$data/planet-visuals` except the lab**, so no id mismatch is
  caught — `cool_1`, `ridged` and `banded` are not planets.
- **A `scale` parameter does not exist**, and now three things want it: the body,
  the swarm and the anchors. `AnchorVisual.size` is the anchors' half of it.
  Deformation is meant to read as a small body and roundness as a large one,
  which is why `amplitude`'s range runs far past anything authored.
- **Surface objects do not exist.** Only the field they would query, and now one
  thing that reads it.
- **The cap-sum field is still the strongest unbuilt idea.** Terrain authored as
  feature size in radians — three continents at 0.42 rad, six regions at 0.20,
  seven craters at 0.09 — which drops into `field.ts` as another `rawHeight` and
  inherits normalisation for free. With it comes a type→parameter table
  (asteroid, frozen, ocean, gas giant…), which is the answer to the id-mismatch
  problem: derive a picture from type + seed and let `planet-visuals.ts` become
  overrides rather than the only source. Both are specified in the design
  handoff §4.

## Still true from earlier sessions

The four calls the medium rests on — orthographic camera, Threlte sizing an ortho
frustum in pixels so `zoom` is px per world unit, a radially-offset inverted
hull, and ink-only enforced through the ramp — are unchanged and still the
load-bearing part. `readRamp` is now shared verbatim by four shaders, because
GLSL ES 1.00 forbids dynamic indexing into a uniform array and the workaround
must not be written twice.

`field.ts` is still the seam: one TS implementation of the noise, never
duplicated into GLSL, so a marker and the terrain under it cannot disagree. The
anchors are the first thing to actually take it up on that.

**The texture/shade split** stands: texture is `land · height + bias` quantised
alone; shade is `rim + key` quantised on its own and applied as a shift of
`shadeDepth` whole slots along the ramp. `readRamp` clamps, so deep shadow
crushes to solid ink rather than wrapping.

## `planet-visuals.ts`

**Four of the six are now current.** `first` and `second` were re-authored in
session 5; **`third` and `cool_1` were re-authored by the author during this
session, at 21:49** — both went to `contour: 1.5`, `shadeSteps: 4` and a non-zero
`shadeDepth`, and `third` picked up `ridge: 0.35` with a new seed. Only `ridged`
and `banded` are still stale, and they are specimens rather than worlds.

All six lost `faceting`, `keyX` and `keyY`. The file header says which four are
current and why the aim left.

**That authoring was destroyed and restored — read this before trusting a
`git checkout`.** Mid-session the assistant edited this file with PowerShell's
`Get-Content`/`Set-Content`, which on PS 5.1 reads as ANSI and turned every em
dash in the header into mojibake. It "fixed" that with
`git checkout -- src/data/planet-visuals.ts`, which silently discarded the
author's 21:49 pass, because the assistant had never run `git status` between
session start and that moment and assumed the file was untouched. The author
noticed. The values were recovered in full from VSCodium's local history
(`%APPDATA%\VSCodium\User\History\106d1ff7\waXj.ts`) and verified field by field
against the snapshot; the file also had its UTF-8 BOM put back, which the first
bad write had stripped.

Two rules out of it: **never `git checkout --` a file this session did not
create**, and check `git status` before assuming a file is unmodified — the
author is in the lab at the same time, and `planet-visuals.ts` is exactly the
file they are editing.

---

# Part 5 — Overview (unchanged, still unplayed)

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

# Housekeeping

## Screenshots of `http://` now work — but the author does not want them

The previous handoff recorded this as unsolved. `chrome --headless --screenshot`
still silently produces no file for an `http://` URL in this environment. Driving
Chrome over **CDP** does work:

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
must `scrollIntoView` first; and eleven `PlanetView`s exceed the WebGL context
cap, so the console fills with "Too many active WebGL contexts" and the oldest
canvases go blank.

**The author asked for this to be used sparingly** — *"You get really wound up
trying to corroborate with screenshots. It's not that necessary. I have the dev
server up and I'm watching all the time."* Keep it for a genuine doubt, not for
confirming an edit landed.

## Everything else

- **The 12 `check` errors have gone unowned for seven sessions.** They are the
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

- **Never edit source with PowerShell's `Get-Content` / `Set-Content`.** PS 5.1
  reads as ANSI by default, so every em dash in `planet-visuals.ts` came back as
  mojibake and was written straight back out. Use the Edit tool, or
  `[System.IO.File]::ReadAllText/WriteAllText` — and note that this file carries
  a **UTF-8 BOM**, which a naive rewrite drops. The attempt to undo this is what
  cost the author their 21:49 authoring; see Part 4.
- **Never `git checkout --` a file this session did not create**, and run
  `git status` before assuming a file is unmodified. The author works in the lab
  while the assistant works in the tree.
- **Removing a uniform breaks HMR until a reload.** Cutting `uBackTone` last
  session made the sync effect throw `Cannot set properties of undefined`,
  because it ran against a material built before the module reloaded. This
  session removed `uFaceting` and split the ghost material out, so it may well
  have happened again in the author's browser. Harmless, cleared by F5, and it
  looks like a real crash in the overlay.
- **Never put a backtick inside the GLSL template literals** in `material.ts` — it
  closes the string and TypeScript starts parsing shader source as TS.
- Each `PlanetView` is its own WebGL context; the workbench now stands up
  twenty-two. Fine there, but the Overview list cannot take one canvas per row.
- `progression.md`'s opening line still claims the doc covers `$lib/progression`.
  It has carried Excess, Scopes, Naming, Refinery, planet rendering, the orbiting
  souls and now the anchors for a while.
- `printVisual` / `printSwarm` / `printAnchor` all emit every field at four
  decimals. Paste indentation has drifted once already.

---

## Untouched roadmap

In `progression.md`'s course table: `PlanetData.yields` for the recurring harvest
(step 5), the token purchases (step 9), and the Harvest / Refinery layouts (step
7) — two screens now, both parked on the same question Overview answered: where
the verb sits.

Still outside that table: **authoring `log-texts.ts`**, sixteen placeholder lines.

Not in the table at all: **the harness loops**, **placing the planet widget in
the game**, **re-authoring `ridged` and `banded`**, **deleting the old swarm
stack**, and **the cap-sum field with its type→parameter table**, which is the
piece that would give every planet a picture without hand-authoring one.
