# Handoff — 2026-08-16

**Orientation only.** Every rationale, argument and measurement lives in
`progression.md`; this file says where the tree is, what has not been seen, and
what will bite you. If you want to know *why* something is the way it is, it is
not here on purpose.

---

## Where the tree is

Branch `dev-next`. **Sessions 7–11 are committed** as `f805a99 rebuild
checkpoint 8`. **Sessions 12–14 are uncommitted** — seventeen files touched, two
created:

```
src/features/PlanetStage.svelte        s14, new: the game's planet, the whole join
src/features/detail/DetailScreen.svelte  s14: PlanetStage replaces Disc
src/widgets/planet/PlanetView.svelte   s14: + clickActionLabel, onclickaction
src/widgets/planet/pulse.ts            PulseVisual reshaped; Halo mark; haloTone gone
                                       s14: the flare parked at rise 0/0
src/widgets/planet/material.ts         halo, spark, flare shaders; + createFlareMaterial
                                       s13: near-half flare, mark outline, echo
                                       seam, the ghost inverts
src/widgets/planet/anchor.ts           s13 only: − ghostTone/ghostOutTone, ghostFade
                                       → ghostBack
scripts/uniform-join.mjs               s13, new and untracked: the shader/material check
src/widgets/planet/Halo.svelte         radius per instance; turn + scatter attributes
src/widgets/planet/Sparks.svelte       two meshes, terrain-oriented, one depth plane
src/widgets/planet/harness.ts          HarnessLoop.length
src/widgets/planet/SoulSwarm.svelte    the rider rate, the world's size
src/widgets/planet/PlanetScene.svelte  worldSize, the adjusted anchors
src/widgets/planet/visual.ts           PlanetVisual.size
src/widgets/planet/stack.ts            + flare 7
src/widgets/LabPanel.svelte            open panels fill the rail
src/widgets/LabRail.svelte             the rail carries the width
src/widgets/Widgets.svelte             the jump bar, section ids, the notes
src/data/planet-visuals.ts             + `size: 1` on all nine worlds
docs/progression.md                    the rationale
docs/handoff.md                        this
```

`planet-visuals.ts` was edited, which no visuals session had done before — `size`
is required on `PlanetVisual` and nine records would not typecheck without it.
All at **1**, so no authored world moved. It carries a **UTF-8 BOM**.

**Session 14 was two asks: park the flare, and put the planet on the detail
screen.** Both are in `progression.md` under **The flare is parked, not removed**
and **The world takes the click**. The placement decision the last handoff said
was missing has been made — the planet *replaces* the disc, and the disc's dot
ring is retired in favour of the swarm.

**Session 12 was two rounds of notes off the author watching the click run.**
Round one: ten items (the halo's crop and inversion, the planet clip, the echo,
terrain-lying sparks, the flare, `PlanetVisual.size`, the rider speed, the lab
rail, the jump bar). Round two: six more on the spark group, including a defect
from round one that drew every spark as a solid opaque quad. Both rounds are
written up in `progression.md` under **The click leaves marks**.

## Verified, and how

`npm run check` → **`COMPLETED 846 FILES 12 ERRORS 2 WARNINGS 5
FILES_WITH_PROBLEMS`** — the standing baseline, table at the end of this file.
The file count went 845 → 846 with `PlanetStage.svelte`; the error count is what
is memorised.
`npx vite build` clean. The probe passes.

**The probe** is the substitute for looking: `esbuild --bundle --platform=node
--format=cjs` the model modules into the scratchpad and run them under node.
`pulse.ts`, `harness.ts`, `anchor.ts`, `orbit.ts`, `visual.ts` and `field.ts`
**never import three.js**, which is what makes this possible and is worth more
than any single check it has caught. Nine groups, all passing.

**What the probe cannot reach is where round two's defect lived.** It never sees
a shader string or a `uniforms` block. A fragment reading a uniform its material
never supplied typechecks, builds, probes clean, and draws a solid quad.

That gap is now closed. `node scripts/uniform-join.mjs
src/widgets/planet/material.ts` reads the file as *text*, pulls every `uniform`
out of each `/* glsl */` block and every key out of each material's `uniforms`,
and reports both directions — a uniform with no entry, and an entry no shader
reads. **12 materials, 21 shaders, 0 broken joins.** It also follows the two
wrapper materials that override a parent's uniforms by name. It is a session-13
addition nobody asked for, it is not wired into `npm run check`, and deleting it
costs nothing but the check.

**No rendered frame has been seen by any assistant** and no screenshot was taken
— the standing instruction is that the author watches the dev server live.

---

## What has not been seen

**The planet on the detail screen has never been watched.** It is the first thing
in the game to draw one, and everything below it is drawn there too now — the
list was written for the lab, and the lab is not where these will be judged. Two
things are specific to the placement: the stage is the **width of the column at a
511:380 ratio** on `--surface` with the swarm's **3.2** framing — bigger than any
sitting so far, and the size moves with the window, since the world is sized by
the shorter axis and the height follows the width — and the caption floats over
the bottom of the canvas rather than sitting under it. The 511:380 was found by
the author sitting with it, so the *proportion* is judged; how it behaves at other
window widths is not.

**Nothing built after round two's fix has been watched.** Round one's sparks were
seen — badly, as solid quads — which is what produced round two. In rough order
of how much they need an eye:

1. **The inverting halo.** The largest change and the one with no fallback:
   `haloTone` is deleted, so if the inversion reads badly the ink has to come
   back rather than be switched on. Watch it over a dark body, over the souls,
   and on the `--surface` row where the ground is not the canvas.
2. **A spark that is actually a dot.** Nobody has yet seen the mark the code has
   been describing all along — a dot, a ring leaving its own edge, a cross
   standing on it. Every proportion in the spark group is unjudged for that
   reason.
3. **The single silhouette.** `LessDepth` on one shared depth plane. Watch for a
   *missing* piece rather than a bruise: where two marks cross, one wins whole,
   and the winner is instance order, not depth.
4. **Blind defaults.** `echoScale` 1.24, `echoWarp` 0.07, `echoBands` 5,
   `echoScatter` 0.35, `echoDepth` 0.55; flare rise 0.6 → 2.4 and base 3.2 → 1.4;
   `sparkBack` 0.25; `FLARE_LIMB` 0.18; `sparkOutline` 1.5px; `ghostBack` 0.45.
   All chosen with no picture in front of them.
5. **~~The flare's bad angle.~~** Moot: the flare is off. `FLARE_LIMB` 0.18 and
   the near-half rule are unjudged and will stay so until someone raises a rise.
6. **Rapid clicking.** 32 slots each, oldest overwritten, thirty-two overlapping
   inversions — and the place the instance-order caveat on the depth plane is
   most likely to show.
7. **The mark's outline, and its hairline.** The union comes out of the depth
   plane, but the fill's antialiased rim writes depth, so the outline starts
   about half a pixel out and the ground shows through the join. Predicted, not
   seen. At 2× DPR it should be invisible; at 1× it may not be. The fix if it
   reads is a tighter antialias on the fill's outer edge — **not** swapping the
   order, which brings the bruise back through the middle of a fading mark.
8. **The ghost over mid-grey.** An inversion has a fixed point at `--ink-400`,
   so the ghost that used to vanish on white worlds can now vanish on grey ones.
   Narrower, and the same on every world, but real. Watch a world banded around
   the middle of the ramp.
9. **The echo, softer than it was.** Removing the seam took a notch of 1.91 out
   of a warp normalised to ±1, and the blend costs another ~30% of amplitude at
   1.5 lobes, which is where `echoBands` 1 with full scatter sits. `echoWarp`
   0.26 was authored against the old shape.
10. **Riders at a real speed.** The rider count has never been looked at, and
    until session 12 fixed the loop rate, looking at it would have been
    misleading. `DEFAULT_HARNESS` is hand-authored with `riders` still at 0.
11. **`AnchorVisual.size` lifting the harness.** `peak` derives from it, so
    dragging `Size` in the anchor lab lifts every line's ends. Intended coupling,
    never watched.

**Overview (steps 1–4) has never been played at all.** The DevPanel row *unlock
all planets* makes the axis walkable; reaching still needs a real harvest, which
needs `1 age lived` and `excess under 12%` on the first world. What to check is
listed under **Overview** in `progression.md`; the short version is that Behind
should stay invisible at beat 10, beat 12 should fire at all, and the right
column's band label is authored in two files with nothing enforcing the match.

## What does not exist

- **Only the detail screen draws a planet.** It draws the body, the spin and the
  swarm, and its click both flashes the world and buys the incarnation. Nothing
  else does — the Overview's rows are still text, and no screen draws an anchor
  or a harness. `Disc.svelte` is unrendered but left in the tree.
- **Surface objects.** Only the field they would query, and the anchors that
  read it.
- **The type→parameter table.** The half of the idea that would let
  `planet-visuals.ts` become overrides rather than the only source. Design
  handoff §4 specifies it. The cap field it would drive now exists, and
  `PlanetVisual.size` is one more thing a type could set.
- **Nothing reads `$data/planet-visuals` except the lab**, so no id mismatch is
  caught — `cool_1`, `ridged`, `banded` and `capped` are not planets. Nine worlds
  now; `cool_3` is the author's. `ridged` and `banded` are stale specimens,
  unchanged since before the light and faceting work.
- **Families do not share a frame** — each link's rotations are laid out about
  its own chord at unrelated angles.
- **`@threlte/extras` is unused** and left in `package.json` on purpose: placing
  the widget in the game is the task most likely to want pointer picking back.

---

## Hazards

- **Never `git checkout --` a file this session did not create**, and run
  `git status` before assuming a file is unmodified. The author edits in the lab
  while the assistant edits in the tree.
- **Never edit source with PowerShell's `Get-Content` / `Set-Content`.** PS 5.1
  reads as ANSI, so every em dash comes back as mojibake. Use the Edit tool or
  `[System.IO.File]::ReadAllText/WriteAllText`. `planet-visuals.ts` has a BOM.
- **Never put a backtick inside the GLSL template literals** in `material.ts` —
  it closes the string and TypeScript starts parsing shader source as TS. This
  bit twice in session 12, both times inside a `//` comment in the shader body.
- **A `uniform` with no entry in the material's `uniforms` is silently 0.**
  Nothing typechecks the join. Edit both ends in the same change; if the number
  is an inlined literal on one side, make it a literal on both.
- **Adding or removing a uniform breaks HMR until a reload**, and a changed
  blending mode or depth flag is never reapplied at all. Sessions 12 and 13 both
  did all three — 13 put the ghost on `CustomBlending` and added two materials
  and two draws — so the first load after pulling either must be a **hard
  reload**. `scripts/uniform-join.mjs` catches the silent-zero case; nothing
  catches the stale-material case but reloading.
- **Don't take screenshots to confirm an edit landed.** *"You get really wound up
  trying to corroborate with screenshots. It's not that necessary. I have the dev
  server up and I'm watching all the time."* The CDP recipe that does work, for a
  genuine doubt, is under **Screenshots** in `progression.md`.
- **The WebGL context ceiling is real.** The workbench draws **44** `PlanetView`s
  and each is its own context; `PlanetView`'s IntersectionObserver mounting only
  what is on screen is the only reason that is affordable. The jump bar makes it
  easier to land on a section directly, which means more of them mount cold.
  Another section wants a shared renderer.
- **`printVisual` / `printSwarm` / `printAnchor` / `printHarness` / `printPulse`**
  all emit every field at four decimals; paste indentation has drifted once.

## Next

From `progression.md`'s course table: `PlanetData.yields` for the recurring
harvest (step 5), the token purchases (step 9), the Harvest / Refinery layouts
(step 7). Outside it: authoring `log-texts.ts` (sixteen placeholder lines),
re-authoring `ridged` and `banded`, and the type→parameter table.

**Placing the widget is done for the detail screen and open everywhere else.**
The Overview's rows are the next place a world would go, and they are the case
the WebGL ceiling actually bites — one canvas per row wants a shared renderer,
not another `PlanetView`.

Parked, named, not done — all written up in `progression.md`:

- **The harness rings**, a flash travelling `t` along the loops with the riders
  surging. Wants the rider count looked at first.
- **Arc-length reparameterising the loops.** Mean rider speed is right; the
  instantaneous rate still wanders ±10% because `sampleLoop` walks by index.
- **The A → B seam**, open since session 8. A rider reaching the far anchor
  reappears at the near one.
- **`span` is a ratio wearing a length word.** A rename in four files.
- **The planet lab's id row scrolls** at nine worlds. Session 12 made open panels
  full height, so the argument against wrapping — the height it would cost — is
  worth re-judging.

---

## The 12 `check` errors

Unowned for nine sessions. They are the baseline every session is measured
against, which only works while the count is memorised — a thirteenth would hide
in it. None is in any file a visuals session has touched.

| Count | Where | What |
|---|---|---|
| 7 | `Preview.svelte` | `costs` literals typed against the full `Record<ResourceType, number>` instead of `Partial`. One widening fixes all seven. |
| 2 | `Chip.svelte` | tippy props — `placement` absent from `Partial<Props>`, and two `Partial<Props>` with nothing in common. |
| 1 | `CohortRow.svelte` | tooltip `delay` given `number[]` where a `[number, number]` tuple is required. |
| 1 | `notification-manager.ts` | Svelte 5 `Component<Props>` assigned to a legacy `SvelteComponent` slot. |
| 1 | `UpgradeRail.svelte` | reads `.effect` off `Upgrade`, which has no such property. |

Only the last is a live defect: the caption snippet falls back to an empty string
when `.effect` is missing, so that span has rendered empty on every chip since it
was written and the fallback is what hides it. Decide whether that caption wants `UpgradeData.effect` or goes.

Also open, from the same sweep: **`Planet.harvested` should be `isHarvested`**
(same for `ResourceEmitter.autonomous` and `.inProgress`), and
**`completeFirstHarvest` can hang** — a planet declaring `yields` without
`duration` gives `ResourceEmitter` a 0 and `queue()` re-queues forever, latent
until step 5, which is exactly the step that would trip it.
