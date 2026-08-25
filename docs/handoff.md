# Handoff — 2026-08-20

**Orientation only, and a board rather than an essay.** Three rules keep it that
way:

- **One line per item.** If it needs a paragraph it is not orientation.
- **`§` names the `progression.md` section that carries the argument.** Nothing
  here restates one. If you want *why*, that is where it is, on purpose.
- **No file table.** `git status` and `git log` are authoritative and never go
  stale; a hand-maintained copy of them did, twice.

---

## Tree

Branch `dev-next`, last commit `9e3069d details tab includes its label`. Behind
it, `e33eaa5 rebuild checkpoint 18` and `73a587e simplify aim controls`;
checkpoint 17 carried the cohort table rebuilt around *the head is the sum of
its rows* and `f` re-rounded game-wide. Uncommitted: **step 7b**, the harvest
screen — see §*The harvest screen*. `git status` and `git log` for the list.

`planet-visuals.ts` carries a **UTF-8 BOM**, and a new required field on
`PlanetVisual` means editing all nine records.

## Verified, and how

- `npm run check` → **904 FILES 2 ERRORS 2 WARNINGS** — table at the end. Both
  are committed defects; #3 (`TokenRow`) has since been fixed and is gone.
- `npx vite build` clean.
- **The probe** — `esbuild` the model modules into the scratchpad, run under
  node. Works only because `pulse` / `harness` / `anchor` / `orbit` / `visual` /
  `field` **never import three**. Keep it that way. Nine groups passing, plus
  the split: `travelOf` monotone, at most one soul mid-travel at any share, and
  the first soul taken is never a rider.
- `node scripts/uniform-join.mjs src/widgets/planet/material.ts` → **15
  materials, 28 shaders, 0 broken joins**. Not wired into `check`. Only the
  **0** is the assertion; the two counts move whenever a shader is added.
- **No assistant has seen a rendered frame.** The author watches the dev server.

---

## Unseen — in the order they want an eye

1. **A spark that is actually a dot.** Never seen; every proportion in the spark
   group is unjudged for that reason.
2. **`sparkFace` 0.45 against the old whole-sphere reading.** The slider runs
   from −1, so the two are a drag apart.
3. **The single silhouette.** `LessDepth`, one shared depth plane. Watch for a
   *missing* piece, not a bruise — instance order wins, not depth.
4. **Rapid clicking.** 32 slots each, oldest overwritten; where the instance
   order shows.
5. **Blind defaults.** Echo set (1.24 / 0.07 / 5 / 0.35 / 0.55), `sparkBack`
   0.25, `FLARE_LIMB` 0.18, `sparkOutline` 1.5px, `ghostBack` 0.45.
6. **The mark's outline hairline** at 1× DPR. Fix if it reads is a tighter
   antialias on the fill's outer edge — **not** swapping the order.
7. **The ghost over mid-grey.** An inversion has a fixed point at `--ink-400`.
8. **Riders at a real speed.** `DEFAULT_HARNESS` still has `riders: 0`.
9. **`AnchorVisual.size` lifting the harness.** Intended coupling, never watched.
10. **The detail screen at any other window width.** The 511:380 proportion was
    judged by sitting with it; nothing else about the placement was.
11. **A world crossing between screens.** The spin and the swarm now share one
    keyed clock, so Detail → Overview → Detail should continue rather than
    restart. Watch the *handover*, not the turn: a jump means the clamp is wrong.
12. **A still's hairline, and the face it freezes on.** `toStill` drops `outline`
    to 1 and `spin` to 0, so what ships is `turn` — authored on its own slider,
    with two snapshots under it in the panel. `contour` is untouched and is the
    next candidate. §*A still is the world with two fields taken off it*.
13. **The body's grain, at any setting.** `grain` / `shadeGrain` / `grainScale`
    all ship at off, so nothing has drawn one. Watch the **limb** first — the
    Nyquist fade is what stops it fizzing there — then whether a contour riding
    the grained band reads as ink or as noise.
14. **The veil outline's wander.** A quarter of the line's width, chosen blind
    against a grain scale of 24–60. Too far and the hairline comes apart; the
    number is `wander` in `veilCover` and nothing else touches it.
15. **Overview steps 1–4 have never been played.** DevPanel *unlock all planets*
    makes the axis walkable. Watch: Behind invisible at beat 10, beat 12 firing
    at all, and the right column's band label — authored in two files with
    nothing enforcing the match.
16. **The whole Refinery screen.** Five modules, none rendered. Watch, in order:
    the sweep restarting each batch and the countdown; the intake bar with one
    pile empty, which is all tail and no matched span; the ceiling bar with
    `arriving` under and then over `cleared`; the split drag moving `workers` and
    the batch figure together. §*The refinery screen*.
17. **`SliderBar`'s handle at a real width.** 8px astride the fill edge, `--sp`
    nothing — the first number picked without seeing the reference at size. Now
    doubly live: `SplitControl` carries the same handle onto Detail too.
18. **The cost head as a switcher.** `COST × 1 10 NEXT MAX` on one rail in a
    184px cell, the whole cell a button that cycles. Never seen at real text
    width — the number is a guess and the identity column paid 88px for it, 86 of
    which the lean dial has since handed back.
19. **The cohort table's head rail.** Detail's `/s` totals moved off the left
    column into `Section`'s aside, split by polarity, xp first. Check it sums to
    the rows. §*The cohort table*.
20. **The header's per-resource `/s` rates.** xp under the score block, karma +/−
    under Detail — never watched ticking live against actual purchases, and now
    sum in whatever's left behind on harvested planets too.
21. **The whole 3a header.** Score block, twin bars, excess meter, the three tab
    rules — nothing rendered. Walk beats 4 / 7 / 8 / 12 in that order; 8 is the
    one to watch, Overview *inserts* between two live cells. §*Header*.
22. **The bars at a real ratio.** Widths divide by the larger pile, so an
    almost-even split is two near-identical lengths — check the matched hairline
    still reads when it sits near the end.
23. **The gate posts over the slug.** Two 2px posts with risers, drawn over a
    hatched slug crossing them. Never seen against a real `excessGate`.
24. **Detail dashing out.** `nav.isAvailable('detail')` now excludes a harvested
    world, so the first harvest closes the tab and drops you on Overview. Watch
    the handover, not the rule.
25. **The 1fr Refinery column below 1440.** The flexible cell moved; nothing has
    been looked at narrow.
26. **Rates that only appear on hover.** Every row's figures are
    `visibility: hidden` at rest. Watch the empty RATE column read as *missing*
    rather than as *quiet* — if it does, the column head is the thing to change.
27. **The purchase preview.** Hover a buy: the row's figures re-read and the head
    rail re-reads with them, green `+N` over each. Never rendered. Watch the green
    landing on the aim arrow, and `Max` at a count where the delta is huge.
28. **Every figure in the game, re-rounded.** `f` now prints decimals only under
    ten, so `424.36` is `424` and `1.24k` is unchanged. Nothing was audited past
    the cohort table — watch the header's piles, Refinery's bars and the planet
    lab's readouts for a figure that wanted its tail. §*Figures*.
29. **Costs round up.** `formatCost` never reads below what you are charged, which
    means a 42,360 price shows `43k`. Watch a button that looks unaffordable next
    to a pile that looks big enough — the lit state is the truth, the digits are
    coarse on purpose.
30. **The preview against a reserve.** Drag Soul allocation to ~30% and re-hover —
    the preview should add about 0.7 of what you buy. `activeAt` is what makes
    that true and nothing tests it.
31. **The takeover taking the Overview.** Header and rail stay and the Overview's
    tab stays lit; what `nav.isHarvesting` hides is that screen's *body*, with
    the same `Screen` the tabs use. Three things to watch. That the bands behind
    it **stop painting** — their contexts are kept, which is the point, but
    `setWatched` composes so nothing hidden is still asking for frames. That
    `Not yet` lands you on the Overview *as you left it*, picked world and all,
    rather than on a rebuilt one. And that switching to Details and back leaves
    the harvest still open underneath, since the flag is on `nav` and not on the
    Overview. **Whether it belongs to the Overview at all is unsettled** —
    Details is the live alternative, and that is why the flag lives where it
    does.
32. **A shoulder each side, controls down the middle.** Three even columns, not
    the house `view-layout` two, and the world is **not** one of them: the stage
    is the whole block and the three parts stand on it with no ground of their
    own — a panel at each outer edge, and split over verb down the middle, with
    the world showing through above them. Panels are the only opaque things
    drawn. Watch that souls stray **behind** the panels rather than stopping at
    them. Nothing else in the game lays a control straight onto a canvas.
33. **The harvest world's size and place.** `HARVEST_RADIUS` 120px against the
    detail stage's 111 — near enough that it reads as the same world seen again;
    the screen does its work by taking the Overview whole, not by the disc being
    big. Drawn to a *pixel radius* rather than to a `frame`
    (`frame = min(width, height) / 120`), so it holds still while the card
    moves. `HARVEST_ANCHOR` 0.34 holds it **above** the controls as a share of
    the *height*, so the room under the swarm survives the block changing size.
    The block itself is 680px, a pixel count and not `100svh` minus a guess at
    the header. The lab's harvest cell carries **World px**, **Room px** and
    **Anchor %**; whatever they land on is typed back into `visual.ts` by hand.
34. **The split moving the swarm.** Souls staying settle to `settleAt` 0.8,
    against the surface, and the rest stray to `strayTo` 1.35×. Drag slowly:
    exactly one soul is mid-travel at a time, so it should read as dots walking
    in one at a time. A whole band snapping means `travelOf` is being read at
    the wrong end. Then drag to both ends — 0% is the whole swarm gathered to
    leave, which is a state nothing else in the game shows.
35. **The world's ink at a push-in.** `scaleInk` multiplies `outline`, `contour`
    and `veilOutline` by the drawn radius over `STAGE_RADIUS` 111, so at 120 the
    2px silhouette is 2.2px — the shipped push-in barely exercises this. Drag
    **World px** to its ceiling to actually test it: the line should
    stay a line rather than thinning to a scratch — and the *floors*
    (`dotFloor`, `veilHatchWidth`) are left out on purpose, so a pushed-in world
    should also stop showing the dot floor's dust. Worlds carrying a `contour`
    or a `veilOutline` are the untested half; nothing ships either yet.
36. **`strayTo` against the box.** The outermost band strays to 2.00 world units
    — 240px at a 120px world — so a full return should reach well out over the
    block without leaving through it. The edge it meets first is now the **split's
    top**, not the card's: a centre at 34% of 680px is 231px down, plus 240px of
    stray is 471px, against controls that start around 480. It clears by a hair,
    and whether that hair reads as room or as a near miss is the thing to judge.
    **Room px** buys margin, **World px** spends it, **Anchor %** decides how
    much goes over the swarm and how much under it. The three are one decision.
    §*The harvest screen*.
37. **The alignment track's three zones.** Negative hatch, `evenBand` as plain
    ground at its true width, positive hatch — a deviation from the reference's
    one uniform hatch, chosen. At `evenBand: 0.02` the plain gap is 2% of the
    track, which may read as a seam rather than as a band.
38. **The spread button at real text width.** `Harvest ⟨name⟩` left,
    `IN THE POSITIVE` right, one rail, capped at 545px so it reads narrower than
    the split above it. The longest world name against the longest alignment
    word is the case; nothing has drawn either. The warning line under it shares
    a row with `Not yet`.
39. **The boons row reading `—`.** `PlanetData.boons` is wired end to end —
    typed, granted at the harvest, labelled — and **unauthored**, so the row is
    an em dash until `planets.ts` says otherwise.
40. **The cycle legend.** `LONGEST LONG EVEN SHORT SHORTEST`, read off
    `resolveHarvestDuration` at both ends so it cannot disagree with the panel's
    figure. Two things to watch: whether it steps at all across the drag's real
    range, and that **EVEN** here means a mid-length cycle while EVEN eight
    inches to the left means an alignment. The reference's word, kept.
41. **The lean dial, in four states.** 36×18, and nothing has drawn one. Walk them
    in this order: **even** (needle up, no wedge — if it reads *empty* rather than
    *centred*, the plate is too faint at `--line-200`); **a plain aim** at
    `resistance: 0` (one wedge, needle still and on its outer edge; hard negative
    lays it flat left); **risky** (a wedge each side, needle creeping — the lattice
    is 9s, so it must creep and not jitter); **unpredictable** (wide band, grey
    needle). Then check the light wedge against a hovered row — its `.edge`
    hairline is the only thing terminating it. §*Lean is a dial*.

42. **The whole anchoring phase.** Nothing here has been rendered.
    §*Anchoring — primitives built, design provisional*. Walk it in this order:
    beat 10 with a second world reached — roster gone, `AnchorPanel` in its
    place, **two** ghost anchors on the world, split still under it. Then press
    with no slots bought: the countdown reads `—` **and the meter still fills**,
    each press popping `−<clickMs>s` **at the ghost anchor going down** while the
    button's own sub reads the same, and no `+experience`, **and no spark on the
    ground** — the halo and the mark still answer the press, but nobody landed.
    Then buy `harness slots_1` and drag the split mid-anchor: the countdown
    must move at once and the fill must **not** jump. Then watch one land —
    ghost fills, a line strings to it, the popup moves to the next ghost; on the
    last the roster returns, the press pays experience again, and every cohort's
    `/s` is up by `bonusPerAnchor × anchors`, capped by riders.
43. **The split in detents.** `SliderBar` now snaps at `harness.step`, which
    starts at 50% — so the Refinery's copy of the lever changed too, before any
    anchoring exists. Watch whether a two-detent bar reads as broken rather than
    as coarse; `split_1` buys quarters.
44. **The idle count in the split's aside.** It reads
    `96 out · 6 anchoring · 12 idle` now that a held soul does one job and
    anchoring draws before the refinery. The surplus is the point — but check
    that a bar which cannot help reading *idle* at every position past the first
    detent does not read as a mistake. §*One soul, one job*.
45. **Whether ten minutes is the right second world.** `second` is now
    `2 × 36_000` job-ms — roughly ten real minutes at the six slots `slots_1`
    buys, less if you press. `third` is `5 × 360_000`, roughly fifty at the
    thirty `slots_2` buys. Neither has been played.
46. **Souls on the finished harness.** `harness.riders` now reaches the swarm as
    a count, so buy `riders_1` (40) with anchors down and watch: 40 dots leave
    their orbits for the lines, spread across the whole harness rather than
    crowded onto the first pair. They appear **as the lines do**, one placed
    anchor at a time — check that a half-strung harness with riders on it reads
    as progress and not as a glitch. Nothing rides before `riders_1`, since
    `balance.harness.riders` is 0; that is the upgrade's whole content.
    §*A rider is a count, not a share*.
47. **The header between worlds.** Finish a first harvest and stop before
    reaching the next: every cohort `/s` is now 0 and the header shows only the
    worlds behind you. Check that this reads as *the souls have nowhere to go*
    and not as the game having stopped — there may want to be a word for it in
    the Overview's empty state. §*Between worlds, souls earn nothing*.

## Parked — named, argued, not done

- The harness rings — a flash travelling `t`. Wants the rider count first.
- Arc-length reparameterising the loops — instantaneous rate wanders ±10%.
- The A → B seam, open since session 8 — a rider pops from far anchor to near.
- The halo, the echo and the flare — all off **by value**, everything standing.
- `span` is a ratio wearing a length word. A rename in four files.
- The planet lab's id row scrolls at nine worlds.
- **A hint tooltip, so nothing rides the native `title`.** Two call sites do now —
  the lean dial's word and `TokenRow`'s price note — and native means ~1s, unstyled,
  unplaceable, invisible on touch. `Tooltip` exists but is a *panel*: bordered card,
  title and description, 650ms, 320px. This wants its small sibling — one line, no
  chrome, short delay. Do it **with** the cohort row's tooltip, whose body is still
  the placeholder `name, lore, rates, +each and all that`; one pass should settle
  what a tooltip is here before three call sites each answer it.
- The token layer, the Harvest layout, per-cohort aiming — `progression.md` §*Parked*.

## Does not exist

- ~~No screen draws an anchor or a harness.~~ Detail does, from `detail.field`
  on. `Disc.svelte` is still unrendered, left in the tree.
- **A shared renderer** — parked, and no longer blocking anything. The Overview's
  rows are stills: §*A still world needs no context*, price in §*Parked*.
- **The type→parameter table** (design handoff §4), so `planet-visuals.ts` is the
  only source rather than an override layer.
- **Surface objects** — only the field they would query.
- **Any reader of `$data/planet-visuals` but the lab**, so no id mismatch is
  caught. `ridged` is the last stale specimen; `banded` has been re-authored.
- **A shared frame for families** — each link is laid out about its own chord.
- `@threlte/extras` is unused, kept for pointer picking.

## Next

**The course table is closed.** 7b is done — §*The harvest screen* — and with it
the last row. What is left is outside it: `log-texts.ts` (sixteen placeholders),
re-authoring `ridged`, the type→parameter table, and authoring
`PlanetData.boons` for the three worlds that now have somewhere to put them.

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

## The 3 `check` errors

| # | Where | What |
|---|---|---|
| 1 | `notification-manager.ts` | Svelte 5 `Component<Props>` in a legacy `SvelteComponent` slot. |
| 2 | `UpgradeRail.svelte` | reads `.effect` off `Upgrade`. **The only live defect** — that caption has rendered empty since it was written, and the fallback is what hides it. Decide whether it wants `UpgradeData.effect` or goes. |
| 3 | `TokenRow.svelte` | missing `quantity` on `PurchaseButton`. **Live** — the prop landed in checkpoint 17 as required, and Refinery buys one grade at a time so it has none to pass. The template already guards `{#if quantity}`; `quantity?: number` is the fix, unless a grade is meant to carry a count. |
