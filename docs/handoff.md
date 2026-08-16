# Handoff — 2026-08-16 (The click leaves marks)

Session 6 is committed as **`bba95a2 rebuild checkpoint 7`**. Sessions 7 through
11 are all uncommitted on top of it. Session 7 built **the harness**; session 8
the three changes that came back from first sight of it; session 9 the three that
came back from the sitting after that; session 10 deleted the old swarm stack and
built the cap field and the water. Session 11 — this one — built **the click**,
which is Part 1 here.

**The click is the first thing in the widget that answers the player** rather
than an author's slider, and the first with two acknowledged exceptions to the
medium's own rules written into it. Both are named in Part 1 and both are one
uniform to reverse.

**The harness has been judged in between.** `DEFAULT_HARNESS` is hand-authored —
pasted back off the lab with `span` at 1, `twist` at 0, `backFade` 3, `backHide`
1 — so sessions 8's and 9's lines were looked at. `riders` is still 0 there, and
**nothing says the rider count has been seen.**

The Overview work (Part 5) is untouched by every visuals session and **has still
never been played.**

Session 11 ends on `COMPLETED 845 FILES 12 ERRORS 2 WARNINGS 5
FILES_WITH_PROBLEMS` — the same 12 errors in the same five files, itemised under
Housekeeping, none of them in any file any session has touched. `FILES` rose by
five, which is exactly the five new files below. A production `vite build` also
ran clean.

## State of the tree

Uncommitted on top of `bba95a2 rebuild checkpoint 7`:

```
 M docs/handoff.md                       ?? src/widgets/HarnessLabPanel.svelte
 M docs/progression.md                   ?? src/widgets/harness-lab.svelte.ts
 M src/data/planet-visuals.ts            ?? src/widgets/planet/Harness.svelte
 M src/widgets/SwarmLabPanel.svelte      ?? src/widgets/planet/caps.ts
 M src/widgets/Widgets.svelte            ?? src/widgets/planet/harness.ts
 M src/widgets/planet/Anchors.svelte     ?? src/widgets/planet/stack.ts
 M src/widgets/planet/PlanetBody.svelte
 M src/widgets/planet/PlanetScene.svelte  session 11, all new:
 M src/widgets/planet/PlanetView.svelte  ?? src/widgets/planet/pulse.ts
 M src/widgets/planet/SoulSwarm.svelte   ?? src/widgets/planet/Halo.svelte
 M src/widgets/planet/anchor.ts          ?? src/widgets/planet/Sparks.svelte
 M src/widgets/planet/field.ts           ?? src/widgets/PulseLabPanel.svelte
 M src/widgets/planet/index.ts           ?? src/widgets/pulse-lab.svelte.ts
 M src/widgets/planet/material.ts
 M src/widgets/planet/orbit.ts
 M src/widgets/planet/visual.ts
 M src/widgets/swarm-lab.svelte.ts
 D src/widgets/ParticleSwarm.svelte       (and the seven other deletions,
 D src/widgets/PlanetWidget.svelte         session 10 — see Part 3)
```

`src/features/detail/CohortRow.svelte` is also modified and **is not any visuals
session's** — none of them has touched it.

---

# Part 1 — The click, as built

Asked for in one message, after the menu of options in the session's first
answer: bring back the ring animation that was deleted with the old widget, put
it over the planet as a camera-facing halo that grows and fades, instantiate it
per click so many can live at once, and add a white dot flash with a smaller ring
placed randomly on the surface and **visible from the back too**. Idea 1 from
that menu — a whole-world tonal flinch — was declined outright, on the grounds
that it may not work on really bright worlds. The harness-rings idea was kept and
parked; it is written down in `progression.md` under **The click leaves marks**,
which is where the whole rationale for this part lives.

## What was recovered, and what replaced it

The deleted component was **`src/widgets/RingParticle.svelte`**, still readable
at `git show HEAD:src/widgets/RingParticle.svelte`. It was a `RingGeometry` on a
`MeshBasicMaterial`, one component per ring, tweened by `svelte/motion` and
unmounting itself through an `onkill` callback; `PlanetWidget` kept an array of
them keyed by an incrementing id. The idea is back and none of the machinery is:

- **`RingGeometry` → a quad and a shader.** The stroke is then authored in px and
  stays that weight at any radius, by the same `fwidth` measure `contourAt`
  already draws a band boundary with. A `RingGeometry` fixed at `[1.95, 2]` and
  scaled thins as it grows, which is the opposite of what an outline does here.
- **A component per ring → one `InstancedMesh` with a 32-slot ring buffer.** A
  `fade` per instance, and no expiry bookkeeping at all: a slot is free because
  it is old. Nothing mounts, nothing unmounts, nothing allocates per click.
- **`svelte/motion` tweens → two curves in `pulse.ts`.** The marks are read in a
  `useTask`, not through the reactive graph.
- **`MeshBasicMaterial` with a hard-coded `--ink-900` → `readRamp`**, so the
  click cannot invent a grey the design system does not own.

## 1. `pulse.ts` — one flash, two kinds of mark

**One click is one `flash`.** It leaves one **halo** and `sparks` many
**sparks** — a count, and an upgrade axis, since a click that incarnates more
souls should mark the world in more places. `PulseVisual` is twelve fields in two
groups, shaped exactly like `SwarmVisual` so wiring the panel onto it was
mechanical.

`createPulses()` owns both ring buffers **and the clock they are timed by**, on
the argument the world's spin already makes: two components draw these marks, and
a clock either of them owned would be a second one. `advance` clamps the delta to
0.1s, because the widget renders on demand and a hidden tab can come back with a
delta longer than a flash's whole life.

## 2. The halo — around the world, not on it

Outside `PlanetBody` altogether, so **neither the tilt nor the spin reaches it**.
Built from the body's origin in view space, so it faces the camera without a
quaternion. Born at `haloFrom` 1.05 — outside the silhouette, because a ring that
starts on the body reads as a band painted there and wiped — and growing to
`haloTo` 2.2, which is past the framing on purpose.

## 3. The sparks — on the ground they hit

Billboarded the way a soul is, at a random direction, sitting at
`field.sampleRadius` so a flash is on the terrain and not on the sphere it was
displaced from, and **inside the spin** so it travels with the surface. The
radius is sampled once at the flash, so a spark never outlives a slider. The
direction is `Math.random` and not the seeded stream — a flash is an event, so
two clicks landing in the same place is the failure, not the unreproducibility.

**No silhouette test at all**, which is what "visible from the back too" asks for
and is the first mark in this medium that does not obey the ink rule. Everything
else discards, fades or steps toward mid-ramp behind the body; a spark shows
through it.

## 4. The two exceptions, stated plainly

1. **Alpha as a fade.** Every other tone here is a whole ramp slot. The in-medium
   fades — walking the tone toward paper, thinning the stroke — both break when
   the background changes: at tone 0 a halo is `--surface`, correct on the canvas
   and a *bright ring* over a dark body. Alpha is the only fade that means the
   same thing wherever the mark is. One uniform to reverse.
2. **No silhouette test on a spark**, above.

Neither has been seen running. If either reads badly, `progression.md` names the
alternative for both.

## 5. The click target

`PlanetView` gains a real `<button>` absolutely positioned over the canvas,
**present only when a `pulse` is given** — a world that cannot answer a click
should not take one. `onclick` and not `onpointerdown`, so Enter and Space work.
The count it keeps is a `flashes` prop the scene *answers*; the scene never
learns what a click bought. It is kept in the view and not the scene because
`PlanetView` unmounts its canvas whenever it scrolls out of the
IntersectionObserver's range, and `answered` starts `undefined` so that remount
replays nothing.

## Files

```
src/widgets/planet/pulse.ts            new — the model, the curves, the buffers
src/widgets/planet/Halo.svelte         new — one instanced draw
src/widgets/planet/Sparks.svelte       new — one instanced draw
src/widgets/PulseLabPanel.svelte       new
src/widgets/pulse-lab.svelte.ts        new
src/widgets/planet/material.ts         + halo and spark shaders, 2 create, 2 sync
src/widgets/planet/stack.ts            + halo 5, spark 6
src/widgets/planet/PlanetScene.svelte  + pulse, flashes, the buffer, the task
src/widgets/planet/PlanetView.svelte   + pulse, the button, the count
src/widgets/planet/index.ts            + the components and the pulse exports
src/widgets/Widgets.svelte             + the Pulse section, + the fifth panel
```

## What earlier uncommitted sessions did, in short

Full write-ups are in `progression.md`; this is here because the next session
reads this file first.

- **Session 8.** `twist` runs to 2π. `SwarmVisual.harness` → `riders`, a share
  that resolves to whole souls, with `Soul.place` deciding who rides — a soul
  either rides or orbits, never partway. `span` filters pairs to the figure's own
  **edges** and every anchor carries a **crown**.
- **Session 9.** `AnchorPlacement.peak` and `HarnessNode`, so a line is tied to
  the **tip** of its pole; only the ends lift, via `radiusAlong`. `SOUL_CAPACITY`
  256 → 800 and `Souls each` to 100. `backHide`, the far side of the harness cut
  per fragment at the same silhouette the ink switches at.
- **Session 10.** The old swarm stack deleted (eight files). `caps.ts` — three
  tiers of round features blended into the noise — plus `capSkirt` and
  `capSwell`, the drawn water.

Two things left open in session 8 and still open:

- **The A → B seam.** A rider reaching the far anchor reappears at the near one.
  Either the harness's traffic or a pop; ping-pong `t` is the alternative and
  costs the direction. Crowns do not have it, and most loops are crowns now.
- **`span` is a ratio wearing a length word.** A rename in four files if a better
  one turns up.

---

# Part 2 — How this session was verified

**No rendered frame from this session was seen by the assistant**, and no
screenshot was taken — the standing instruction is that the author watches the
dev server live. Everything above is code that typechecks, builds, and passes a
numerical probe of its geometry.

The probe was `esbuild`-bundled from `harness.ts`, `anchor.ts` and `orbit.ts` and
run under node, over anchor counts 1 to 8, at the author's current
`DEFAULT_HARNESS` and with every node tied at the grip `DEFAULT_ANCHOR` comes to
on a mean-radius surface — **1.150** = 1 + (0.17 − 0.02):

- **No non-finite value anywhere**, which is still the real risk — two figures put
  an anchor at each pole, so a pair is both antipodal and parallel to the axis a
  naive fallback would pick. `sideOf` is what stops that being a NaN.
- **Every loop starts and ends exactly on a tip**, at radius 1.150, to float32
  precision. For a crown that is the same tip twice, which is the check that a
  crown closes on its own anchor rather than near it.
- **Lowest radius anywhere is 1.150 and the peak is 1.265** = 1 + `inner`, at
  every count — the ends lifted, the peak where it was, and nothing dipping toward
  the body. With `twist` back above 0 the peak rises again; the framing at
  `frame = 3.2` has 1.6 to spend.
- **A node with no `peak` still starts on the surface**, so nothing that holds
  bare figure nodes changed.
- **`countLoops` and `countLinks` agree with `buildLoops`** at every count, since
  the lab's readout comes from the counters and the picture from the builder.
- **800 souls** — eight bands of a hundred — build, their places are a permutation,
  and walking the share 0 → 1 in tenths only ever *adds* to the riding set, ending
  at 800 riders.
- **The closest a rider comes to the centre is 1.150** at eight anchors, sampling
  every loop at 65 points. It was 0.997 before the tips.

At `span` 1 the link counts are 0, 1, 3, 6, 6, 12, 5, 16 for one to eight anchors,
which is why 7 draws fewer lines than 6: the pentagonal bipyramid's closest pair
is the ring's, and the two poles' links are longer than it. That is `span` doing
what it says, not a fault — dragging it to 1.6 gives 20 at eight, and 2.6 gives
all 28.

---

# Part 3 — What does not exist

- **No screen draws a planet, a swarm, an anchor or a harness.** `PlanetView` is
  referenced only by `Widgets.svelte`.
- ~~The old swarm stack~~ — **deleted in session 10.** The seven files the author
  named, plus `DotTypePreview.svelte`, which existed only to drive `dot-types`
  and `dots.svelte` and would have been the last thing standing on them. The
  **Swarm — existing** section went with them, along with the `Canvas` import
  and the `.viewport` / `.overlay` rules that were its alone. Nothing outside
  `src/widgets/` ever referenced any of it. `@threlte/extras` is now an unused
  dependency — `PlanetWidget`'s `interactivity` was its only importer — and was
  **left in `package.json` on purpose**, since placing the widget in the game is
  the task most likely to want pointer picking back.
- **Nothing reads `$data/planet-visuals` except the lab**, so no id mismatch is
  caught — `cool_1`, `ridged` and `banded` are not planets.
- **A `scale` parameter does not exist**, and now three things want it: the body,
  the swarm and the anchors. `AnchorVisual.size` is the anchors' half of it — and
  it now moves the harness too, since `peak` is derived from it. Dragging `Size`
  in the anchor lab lifts the ends of every line with the poles, which is the
  intended coupling but has not been watched.
  Deformation is meant to read as a small body and roundness as a large one,
  which is why `amplitude`'s range runs far past anything authored.
- **Surface objects do not exist.** Only the field they would query, and the
  anchors that read it.
- **Families do not share a frame.** Each link's rotations are laid out about its
  own chord at unrelated angles to its neighbours'. This is the smaller question
  left under "a figure, not a graph" and it is untouched.
- ~~The cap-sum field~~ — **built in session 10**, as `src/widgets/planet/caps.ts`
  and a **Caps** group in the planet lab. Three tiers, each a count and a size in
  radians with a signed lift; summed; blended into the noise rather than added to
  it, so the fbm is spent on the coastline; read at the warped direction, so a
  continent is not a circle. Reasoning is in `progression.md` under **Terrain as
  features, not as octaves**, including the one thing that wants an author's
  decision — a reseed can invert a cap world's tone, and the fix costs the
  overlap behaviour.
  **The water came in the same session**, off the question of what the sea does
  at a high blend. Two parameters, both in **Terrain as features** →
  **The water is drawn, not noised**: `capSkirt`, a signed ring outside each cap
  running against its lift, which is the coast; and `capSwell` with
  `capSwellBands`, warped latitude bands across the open sea the skirt cannot
  reach. Neither is fbm, deliberately — noise in water reads as submerged land.
  With `clip` at 1 neither deforms the sea, so both are tone and line on a
  perfectly smooth surface.
  The mask on the swell is the caps' **coverage**, not their sum. The sum is zero
  both far out at sea and exactly on a coast, so the first mask was wide open at
  every shoreline — 1.0000 there against 0.4293 for the coverage mask, measured on
  a single cap. That was caught by probe and fixed, not by eye.
  All three are 0 on every authored world including `cool_2`, so nothing already
  in the file moved; only `capped` carries them — skirt 0.5, swell 0.14.
  **The type→parameter table is not built.** That is the half of the idea that
  answers the id-mismatch problem — derive a picture from type + seed and let
  `planet-visuals.ts` become overrides rather than the only source — and it is
  still open. Design handoff §4 specifies it.
- **`caps` is off on every world that predates it.** All six carry the tiers at
  `caps: 0`, so their pictures are unchanged to the last float — verified by
  walking 20,000 directions with the tiers at their defaults and again with every
  one of them maxed, and finding a maximum height difference of exactly 0. Two
  entries have the blend up: **`capped`**, the specimen added alongside `ridged`
  and `banded` and **authored blind**, and **`cool_2`**, which the author
  authored in the lab in the same session at `caps: 0.32` with the coarse tier
  widened to 8 at 0.88 — so the cap field has been through a lab pass, and
  `cool_2` is the only evidence of what it looks like. `planet-visuals.ts` is
  eight worlds now, so the family strip and the workbench's `PlanetView` count
  are 39 → 41.
- **The planet lab's id row scrolls.** Eight ids no longer fit the panel's 20rem.
  It overflows sideways rather than wrapping, because the panel is already the
  full height of its rail and a wrapping row would push the sliders down every
  few worlds.
- **`ridged` and `banded` are still stale specimens**, unchanged since before the
  light and faceting work. The other four worlds are current.

## Still true from earlier sessions

The four calls the medium rests on — orthographic camera, Threlte sizing an ortho
frustum in pixels so `zoom` is px per world unit, a radially-offset inverted
hull, and ink-only enforced through the ramp — are unchanged and still the
load-bearing part. `readRamp` is shared verbatim by **five** shaders, because
GLSL ES 1.00 forbids dynamic indexing into a uniform array and the workaround
must not be written twice.

`field.ts` is still the seam: one TS implementation of the noise, never
duplicated into GLSL. The anchors read it, and **as of this session the harness
reads it too — but only at its ends.** A loop is still built on the mean sphere;
what the field decides is the radius its ends are tied at, by way of the
placement's `peak`. So the curve between two anchors ignores the terrain and the
grip on each anchor does not, which is the join the anchor solid used to have to
cover. The shader's silhouette test is still the unit sphere, the same argument
the souls' `rim` makes.

**The texture/shade split** stands: texture is `land · height + bias` quantised
alone; shade is `rim + key` quantised on its own and applied as a shift of
`shadeDepth` whole slots along the ramp. `readRamp` clamps, so deep shadow
crushes to solid ink rather than wrapping.

**The render stack** is `stack.ts` and is stated once: body 0, harness 1, placed
anchor 2, ghost anchor 3, souls 4. The harness takes 1 so a placed anchor's solid
draws over the ends of the lines it holds.

**The world's spin is the scene's**, not the body's. `PlanetScene` owns one
`spinAngle` and hands it to the body to turn by and to the swarm to put a loop
back where the world has since carried it — the harness is inside the spin
because a line ends at an anchor, and the swarm is outside it because souls orbit
the world rather than ride its surface.

---

# Part 4 — `planet-visuals.ts`

Untouched by sessions 7 and 8. Four of the six are current — `first` and `second`
from session 5, `third` and `cool_1` re-authored by the author during session 6.
Only `ridged` and `banded` are stale, and they are specimens rather than worlds.

**Two rules from session 6 still stand and are why neither session touched the
file:** never `git checkout --` a file this session did not create, and run
`git status` before assuming a file is unmodified. The author is in the lab while
the assistant is in the tree, and this is exactly the file they are editing.

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

## Screenshots of `http://` work, and the author does not want them

`chrome --headless --screenshot` still silently produces no file for an `http://`
URL in this environment. Driving Chrome over **CDP** does work:

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

**Use it sparingly** — *"You get really wound up trying to corroborate with
screenshots. It's not that necessary. I have the dev server up and I'm watching
all the time."* Keep it for a genuine doubt, not for confirming an edit landed.

## The probe is the substitute, and it is cheap

Bundling the model modules with `esbuild --bundle --platform=node --format=cjs`
into the scratchpad and running them under node takes seconds and needs no
browser. None of `harness.ts`, `anchor.ts`, `orbit.ts` or `field.ts` imports
three.js, which is what makes it possible — keeping it that way is worth more
than any one check it has caught.

## Everything else

- **The workbench's `PlanetView` count went 47 → 39 in session 10.** Each is its
  own WebGL context, and `PlanetView`'s IntersectionObserver is the only reason
  that is affordable — it mounts what is on screen and nothing else. Two things
  bought the eight back: the old swarm stack's canvas is gone, and `trueSizes`
  dropped **40 and 56**, which read the same as each other and are drawn by four
  separate rows, so each entry in that list costs four contexts. The ceiling is
  still real; another section wants a shared renderer.
- **The 12 `check` errors have gone unowned for nine sessions.** They are the
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
  reads as ANSI by default, so every em dash comes back as mojibake and is
  written straight back out. Use the Edit tool, or
  `[System.IO.File]::ReadAllText/WriteAllText` — and note that
  `planet-visuals.ts` carries a **UTF-8 BOM**, which a naive rewrite drops.
- **Never `git checkout --` a file this session did not create**, and run
  `git status` before assuming a file is unmodified.
- **Adding or removing a uniform breaks HMR until a reload.** A sync effect runs
  against a material built before the module reloaded and throws
  `Cannot set properties of undefined`. Harmless, cleared by F5, and it looks like
  a real crash in the overlay. **This session added one** (`uBackHide`) **and a
  `HarnessVisual` field** (`backHide`), so both halves apply at once: an
  HMR-preserved lab draft has no `backHide` key and the new slider reads blank
  until reload. F5 clears both.
- **Never put a backtick inside the GLSL template literals** in `material.ts` — it
  closes the string and TypeScript starts parsing shader source as TS.
- **Three lab panels share the left rail** and all three open at once overflows
  it. Collapsing is manual and per panel. This did not get worse this session and
  did not get better.
- `progression.md`'s opening line still claims the doc covers `$lib/progression`.
  It has carried Excess, Scopes, Naming, Refinery, planet rendering, the orbiting
  souls, the anchors and the harness for a while.
- `printVisual` / `printSwarm` / `printAnchor` / `printHarness` all emit every
  field at four decimals. Paste indentation has drifted once already.

---

## Untouched roadmap

In `progression.md`'s course table: `PlanetData.yields` for the recurring harvest
(step 5), the token purchases (step 9), and the Harvest / Refinery layouts (step
7) — two screens now, both parked on the same question Overview answered: where
the verb sits.

Still outside that table: **authoring `log-texts.ts`**, sixteen placeholder lines.

Not in the table at all: **placing the planet widget in the game**, **re-authoring
`ridged` and `banded`**, and **the type→parameter table** (asteroid, frozen,
ocean, gas giant…), which is the piece that would give every planet a picture
without hand-authoring one — the cap field it would drive now exists. Deleting
the old swarm stack and building the cap field both came off this list in session
10.
