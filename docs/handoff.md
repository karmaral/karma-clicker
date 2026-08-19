# Handoff — 2026-08-17

**Orientation only, and a board rather than an essay.** Three rules keep it that
way:

- **One line per item.** If it needs a paragraph it is not orientation.
- **`§` names the `progression.md` section that carries the argument.** Nothing
  here restates one. If you want *why*, that is where it is, on purpose.
- **No file table.** `git status` and `git log` are authoritative and never go
  stale; a hand-maintained copy of them did, twice.

---

## Tree

Branch `dev-next`. Last commit `194f917 rebuild checkpoint 9` — sessions 12–14.
**Sessions 15–16 are uncommitted**; `git status` for the list.

`planet-visuals.ts` carries a **UTF-8 BOM**, and a new required field on
`PlanetVisual` means editing all nine records.

## Uncommitted, by idea

| what | § |
|---|---|
| The burst — the body's silhouette thrown out behind it; the halo parked at width 0 | *The burst is the world's own shape, and the halo is parked* |
| `sparkFace` — marks land on the visible cap, not the whole sphere | *A spark lands on the face you are looking at* |
| `ribbon.ts` — lines widened into quads, so a stroke divides by world size | *A line had no weight to divide* |
| Outline bleed — the ink cuts follow the drawn edge, not the unit sphere | *The world ends where it is drawn to end* |
| `lean`/`turn` beside `tilt`, on a square puck | *The world is held, not tilted* |
| `Puck.svelte`, `Slider.svelte` — the labs' rows as components | *The labs' two controls are components* |
| `veilSpin` is a drift over the ground, not a rate | *A drift is not a rate* |
| `grain` / `shadeGrain` / `grainScale` — noise under the body's two quantisers | *A grain in the paper* |

## Verified, and how

- `npm run check` → **855 FILES 12 ERRORS 2 WARNINGS** — the standing baseline,
  table at the end. The error count is memorised; a thirteenth would hide in it.
  The file count drifts with the tree and is not the thing being watched.
- `npx vite build` clean.
- **The probe** — `esbuild` the model modules into the scratchpad, run under
  node. Works only because `pulse` / `harness` / `anchor` / `orbit` / `visual` /
  `field` **never import three**. Keep it that way. Nine groups passing.
- `node scripts/uniform-join.mjs src/widgets/planet/material.ts` → **15
  materials, 28 shaders, 0 broken joins**. Not wired into `check`. Only the
  **0** is the assertion; the two counts move whenever a shader is added.
- **No assistant has seen a rendered frame.** The author watches the dev server.

---

## Unseen — in the order they want an eye

1. **The burst hull over `--surface`.** Opaque ink at the dark end of the ramp on
   a light ground — the loudest thing the widget has drawn. Width, ink and a
   0.25s life are blind.
2. **Line weights against the hairlines they replaced.** `edgeWidth: 1.2`,
   `width: 1`, `ceiling: 2.5`; a hairline was one *device* pixel, so on retina it
   was half of what these ask for.
3. **A spark that is actually a dot.** Never seen; every proportion in the spark
   group is unjudged for that reason.
4. **`sparkFace` 0.45 against the old whole-sphere reading.** The slider runs
   from −1, so the two are a drag apart.
5. **The single silhouette.** `LessDepth`, one shared depth plane. Watch for a
   *missing* piece, not a bruise — instance order wins, not depth.
6. **Rapid clicking.** 32 slots each, oldest overwritten; where the instance
   order shows.
7. **Blind defaults.** Echo set (1.24 / 0.07 / 5 / 0.35 / 0.55), `sparkBack`
   0.25, `FLARE_LIMB` 0.18, `sparkOutline` 1.5px, `ghostBack` 0.45.
8. **The mark's outline hairline** at 1× DPR. Fix if it reads is a tighter
   antialias on the fill's outer edge — **not** swapping the order.
9. **The ghost over mid-grey.** An inversion has a fixed point at `--ink-400`.
10. **Riders at a real speed.** `DEFAULT_HARNESS` still has `riders: 0`.
11. **`AnchorVisual.size` lifting the harness.** Intended coupling, never watched.
12. **The detail screen at any other window width.** The 511:380 proportion was
    judged by sitting with it; nothing else about the placement was.
13. **A world crossing between screens.** The spin and the swarm now share one
    keyed clock, so Detail → Overview → Detail should continue rather than
    restart. Watch the *handover*, not the turn: a jump means the clamp is wrong.
14. **A still's hairline, and the face it freezes on.** `toStill` drops `outline`
    to 1 and `spin` to 0, so what ships is `turn` — authored on its own slider,
    with two snapshots under it in the panel. `contour` is untouched and is the
    next candidate. §*A still is the world with two fields taken off it*.
15. **The body's grain, at any setting.** `grain` / `shadeGrain` / `grainScale`
    all ship at off, so nothing has drawn one. Watch the **limb** first — the
    Nyquist fade is what stops it fizzing there — then whether a contour riding
    the grained band reads as ink or as noise.
16. **The veil outline's wander.** A quarter of the line's width, chosen blind
    against a grain scale of 24–60. Too far and the hairline comes apart; the
    number is `wander` in `veilCover` and nothing else touches it.
17. **Overview steps 1–4 have never been played.** DevPanel *unlock all planets*
    makes the axis walkable. Watch: Behind invisible at beat 10, beat 12 firing
    at all, and the right column's band label — authored in two files with
    nothing enforcing the match.

## Parked — named, argued, not done

- The harness rings — a flash travelling `t`. Wants the rider count first.
- Arc-length reparameterising the loops — instantaneous rate wanders ±10%.
- The A → B seam, open since session 8 — a rider pops from far anchor to near.
- The halo, the echo and the flare — all off **by value**, everything standing.
- `span` is a ratio wearing a length word. A rename in four files.
- The planet lab's id row scrolls at nine worlds.
- The token layer, the Harvest layout, per-cohort aiming — `progression.md` §*Parked*.

## Does not exist

- **No screen draws an anchor or a harness.** `Disc.svelte` is unrendered but
  left in the tree.
- **A shared renderer** — parked, and no longer blocking anything. The Overview's
  rows are stills: §*A still world needs no context*, price in §*Parked*.
- **The type→parameter table** (design handoff §4), so `planet-visuals.ts` is the
  only source rather than an override layer.
- **Surface objects** — only the field they would query.
- **Any reader of `$data/planet-visuals` but the lab**, so no id mismatch is
  caught. `ridged` and `banded` are stale specimens.
- **A shared frame for families** — each link is laid out about its own chord.
- `@threlte/extras` is unused, kept for pointer picking.

## Next

From the course table: **step 5** `PlanetData.harvest`, **step 9** the token
purchases, **step 7** the Harvest / Refinery layouts. Outside it: `log-texts.ts`
(sixteen placeholders), re-authoring `ridged` and `banded`, the type→parameter
table.

Owed, and compounding: the **doc pass** (§*The context files are themselves an
open task* — CONTEXT v3 §3.2 and §3.5 are superseded and unamended at source)
and the **comment sweep** (§*The comments want the same pass*).

---

## Hazards

- **Never `git checkout --` a file this session did not create.** The author
  edits in the lab while the assistant edits in the tree. `git status` first.
- **Never edit source with `Get-Content` / `Set-Content`.** PS 5.1 reads ANSI and
  every em dash comes back mojibake. Use Edit, or `[System.IO.File]`.
- **Never put a backtick inside the GLSL literals** in `material.ts` — it closes
  the string. Bit twice, both times inside a `//` comment in the shader.
- **A `uniform` with no entry in `uniforms` is silently 0.** Edit both ends
  together; `uniform-join.mjs` is the only thing that catches it.
- **Adding a uniform breaks HMR until a reload; a changed blending mode or depth
  flag is never reapplied at all.** First load after pulling any of that must be
  a **hard reload**. Nothing catches a stale material but reloading.
- **Don't screenshot to confirm an edit landed** — *"I have the dev server up and
  I'm watching all the time."* The CDP recipe, for a genuine doubt, is
  §*Screenshots*.
- **The WebGL context ceiling is real.** 44 `PlanetView`s, each its own context;
  only the IntersectionObserver makes that affordable, and the jump bar means
  more of them mount cold. A world that does not move wants `PlanetStill`, which
  costs none.
- **`alpha` and `preserveDrawingBuffer` are construction flags** on
  `SnapshotCanvas`'s renderer, so HMR never reapplies them — same rule as a
  blending mode.
- **A store written to from inside an `$effect` must not be a rune.** Asking
  `snapshots` for a picture reads its queue and then writes it, from a
  `PlanetStill`'s own effect — as `$state` that is a loop with no exit. Push at
  the consumer with a callback instead. §*A still world needs no context*.
- **A probe can pass on a defect it never assembles.** The ribbon check replayed
  one endpoint at a time and passed on 312 crossed quads. Assert what the shape
  has to be, not what the builder wrote.
- **`printVisual` and friends** emit every field at four decimals; paste
  indentation has drifted once.

## The 12 `check` errors

Unowned for ten sessions. None is in a file a visuals session has touched.

| # | Where | What |
|---|---|---|
| 7 | `Preview.svelte` | `costs` literals typed against the full `Record` instead of `Partial`. One widening fixes all seven. |
| 2 | `Chip.svelte` | tippy props — `placement` absent, and two `Partial<Props>` with nothing in common. |
| 1 | `CohortRow.svelte` | tooltip `delay` given `number[]` where a tuple is required. |
| 1 | `notification-manager.ts` | Svelte 5 `Component<Props>` in a legacy `SvelteComponent` slot. |
| 1 | `UpgradeRail.svelte` | reads `.effect` off `Upgrade`. **The only live defect** — that caption has rendered empty since it was written, and the fallback is what hides it. Decide whether it wants `UpgradeData.effect` or goes. |

The rest of that sweep is closed: the `is*` renames are done, and the
`completeFirstHarvest` hang is fixed at both ends — see §*A payout with no clock*.
`PlanetData.yields`/`duration` are now one `harvest` object, which is the shape
step 5 authors into.
