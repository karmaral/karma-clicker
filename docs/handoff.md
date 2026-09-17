# Handoff — 2026-09-16

**Orientation only, and a board rather than an essay.** Three rules keep it that
way:

- **One line per item.** If it needs a paragraph it is not orientation.
- **`§` names the `progression.md` section that carries the argument** — except
  where a line writes `design.md §n` explicitly, which points at that file
  instead. The two docs both number their sections and the collision is silent
  otherwise, so the explicit form is the one to use going forward.
- **No file table.** `git status` and `git log` are authoritative and never go
  stale; a hand-maintained copy of them did, twice.

---

## Ahead of the build

`design.md` states more than the build ships. One line each; the section is the
argument, this is only the flag.

- ~~**`design.md` §13** — world totals still the old cubic figures.~~ **Landed.**
  `planets.ts` decomposes to `240s × 2^(p−1)` on every world; phase doubles once,
  between 2 and 3. Load-bearing now that a life is a length in phases.
- **`design.md` §18** — the minimum landed: wisdom is the run's residue, beat 14
  opens the Overview's *End the run*, and the reset is a reload. Knowledge,
  commerce and the structure shelf are still argument only.
- **`design.md` §12's `perWorker` defect** — the anchoring job runs ~10× faster
  than the doc's own intent; not yet retuned, and `work_1`/`work_2` now buy on
  top of it.
- **`design.md` §12's new figures** — the anchor, line, work and press prices are
  all placeholders written this session and none has been simmed.
- **`design.md` §16's nine beat floors** — fitted to the pre-rewrite cohort
  ladder, all wrong now that §5 is generated.

## Tree

Branch `dev-next`, last commit `23b37ac rebuild checkpoint 32`. Uncommitted:
**a cohort's life is a length in phases** — `design.md` §5, §6, §9, §13, §15, §19
spliced, rationale in *The wave became the cohort clock*. `git status` and
`git log` for the list.

The shape, in five lines:

- `life(n) = 1/16 × 2^(n−1)` **phases**, replacing `duration(n) = 2s × 2^(n−1)`.
  `Building.#clampDuration` is the only seam — it converts against
  `Planet.phaseDuration` before folding, so `cohort.duration` stays ms and every
  consumer below it is untouched.
- **`1/16` holds the economy** (rates ×1.07 against the 2 s base) and lands the
  eight rows on the wave's landmarks: cohort 5 = 1 phase, 6 = 1 cycle, 8 = 1 age.
- **§6's line is now exact.** One phase or less can be timed; one cycle or more
  is ×1.0 always. Lives are powers of two so nothing sits between.
- **Yield per life is fixed, so income halves on arrival at world 3** — the
  phase doubles exactly once. Refinery capacity, wisdom and the harvest snapshot
  all step with it. Unmeasured.
- **Emitters now halt at a harvest** and start fresh on arrival. A defect that
  predates this: they cycled through the whole between-worlds gap against a
  `yieldScale` of 0, landing on nothing and requeueing.

Also: `BASE_LIFE` / `REFERENCE_PHASE` are generator constants in `buildings.ts`,
not `balance.ts` — the lab cannot reach a constant the module read at load, so it
sweeps a generated row's `life` instead. `BuildingData.duration` → `life`, and
the rename is the guard: the units changed under the name.

⚠ `FirstHarvestScreen.svelte` is dirty from the author's own lab (a CSS height),
not from this work.

## Verified, and how

- `npm run check` → **964 FILES 0 ERRORS 9 WARNINGS**, re-run this session. The
  9 warnings are unused-CSS selectors in `ExcessMeter.svelte`, `JobStats.svelte`
  and `Preview.svelte`, all pre-existing.
- `npm run build` clean.
- **`formatLife` checked against the whole ladder**, both phase lengths, under
  node in the scratchpad: every row and its first two halvings name a landmark,
  a `boost`-shortened life falls back to seconds rather than naming one it does
  not sit on, and a floored life never reaches it (the row draws *stream*).
- **Nothing about the phase change has been played.** No world 3 arrival, no
  harvest, no bench run.
- **Every new module transforms** under a throwaway dev server, `rig`'s
  module-level deriveds included — the `planet-manager ↔ harness` cycle this
  session introduces resolves lazily, but **nothing has been booted**.
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
8. **Riders at a real speed.** `DEFAULT_HARNESS` still has `riders: 0` — and the
   game no longer reads it: `rig` derives the visual off what is bought.
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
    the batch figure together. §*The refinery screen*. Now two stacked bars in
    `RefiningStatus` — the level meter under the sweep, thinner and pulled up by
    `-sp-2`. If it reads crowded, keep `LEVEL n` in the aside and drop the meter.
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
41. ~~**The lean dial, in four states.**~~ Retired, not fixed — `design.md` §6
    cut `resistance`/`polarity_bias`/`polarity_multiplier` and with them the
    per-row needle this entry was about to watch. `LeanMeter.svelte` is kept in
    the tree, unwired, against per-cohort aim coming back; nothing renders it.

42. **The whole anchoring job.** Nothing here has been rendered, and it is a
    **choice** now — so 42–46 below describe the job once begun, and the first
    thing to watch is the step before them: the outlined **Anchor ⟨world⟩** verb
    under `Harvest`, what its sub reads, and whether anything about it says *this
    is worth doing*. Then **Cancel anchoring** — two presses, the second reading
    `Confirm cancel` — and that the bars empty, the roster returns and the press
    pays experience again. The old text follows unchanged from the press onward.
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
43. **The split in detents.** `SliderBar` snaps at the job's own step — 25% to
    start. The two levers now have **separate ladders**, so watch that buying
    `split_1` leaves the Refinery's bar exactly where it was. Then whether a
    four-detent bar reads as broken rather than as coarse.
44. **The idle count in the split's aside.** It reads
    `96 out · 6 anchoring · 12 idle` now that a held soul does one job and
    anchoring draws before the refinery. The surplus is the point — but check
    that a bar which cannot help reading *idle* at every position past the first
    detent does not read as a mistake. §*One soul, one job*.
45. **Whether ten minutes is the right second world.** `second` is now
    `2 × 36_000` job-ms — roughly ten real minutes at the six slots `slots_1`
    buys, less if you press. `third` is `5 × 360_000`, roughly fifty at the
    thirty `slots_2` buys. Neither has been played.
46. **Souls on the finished harness.** `harness.riders` reaches the swarm as a
    count, so with anchors down watch dots leave their orbits for the lines,
    spread across the whole harness rather than crowded onto the first pair. They
    appear **as the lines do**, one placed anchor at a time — check a half-strung
    harness with riders on it reads as progress and not as a glitch. The base is
    **200**, not 0; what gates riding now is the cohort line.
    §*A rider is a count, not a share*.

51. **The Harness tab, whole.** Four new modules, none rendered. Walk it: the rig
    on its flat nameless body with every anchor placed; `JobStats`' two blocks and
    that the second one disappears on a world with no slots; `LineTable` locked
    until the `lines` upgrade, then the buy in its head and rows lighting one at a
    time. The left column is **one panel** — stage and figures under one heading,
    at the Overview ahead-panel's density — so the thing to check is that it fits
    the viewport without scrolling. Watch the **tab strip at four** — the width is
    unchanged by design, so judge whether the run verb still has room on Overview.
52. **Every axis moving the picture.** The whole point of the coupling, and now
    answerable without playing: `?widgets` → **Rig ladder** draws every rung of
    the `harness` bucket at once, plus a line strip. **A rung that looks like the
    one before it is the bug**; the maps are in `lib/rig.ts` and are all guesses.
    Then confirm in-game that buying the row moves the tab the same way.
53. **The anchor bonus on a harvest.** Anchor a world fully, harvest it, and read
    its Behind row: it should pay `1 + bonusPerAnchor × placed` more than an
    unanchored one. Then do the same with the job cancelled and confirm it pays
    the plain figure. This is the reason to anchor at all and nothing tests it.
54. **A v3 save, migrated.** `save/migrate.ts` is new and has never run on a real
    save. Load one: the panel should list it rather than skip it, and a world that
    was mid-anchor should come back with its job **active** and its progress
    intact. §*Saves migrate now*.
55. **Two-pile prices in the rail and the catalogue.** Harness upgrades cost both
    crimsons, so both chips draw two figures and two badges. Watch a row whose
    piles are lopsided — it must read unaffordable until **both** are met, and
    it should not climb the rail on the near half alone.
56. **The rig's own body, in the planet lab.** `planet-visuals` gained a
    `harness` record — not a world, the ground the tab stands the rig on. It
    ships as `DEFAULT_VISUAL` flattened, so it is unchanged until authored, but it
    is now the tenth entry in the family strip and the stills grid. Author it.
47. **The header between worlds.** Finish a first harvest and stop before
    reaching the next: every cohort `/s` is now 0 and the header shows only the
    worlds behind you. Check that this reads as *the souls have nowhere to go*
    and not as the game having stopped — there may want to be a word for it in
    the Overview's empty state. §*Between worlds, souls earn nothing*.
48. **The generated cohort ladder, run for the first time.** `design.md` §5
    landed this session — no assistant has watched it in the sim bench. Run
    6 hours × `cheapest`/`payback` and read `arrivals.csv` before touching a
    single figure: whether cohorts 1–5 land at minutes a person would sit
    through is the question the whole retune is waiting on.
49. **`ArrivalTable`, in the sim bench.** New this session, beside
    `BeatTimeline`. Nothing has confirmed it reads correctly against a real run
    — watch that a cohort revealed but never bought shows `—` for its first
    copy rather than a stale row.
50. **The manual send verb on a cohort row.** `CohortRow`'s `Send` link, live
    only while `!cohort.isAutonomous`. Never watched — check it disappears the
    instant the clerk lands and that rapid clicking cannot double-queue a life.
51. **Lives read as phases, on the row and in the tooltip.** `1/16 phase` …
    `1 age`, and a level preview reading `1 cycle → 1 phase`. Verified as
    arithmetic, never seen. Watch the column width — the strings are wider than
    `256 s` was — and that cohort 5's sweep really does match one phase of the
    strip above it.
52. **The world 2 → 3 arrival.** Income halves there, once, and never recovers.
    This is the whole open question of the change: progression cost, or the
    climb restarting. Bench first, then play it.
53. **A harvest taken mid-life.** Emitters now halt at departure. Watch the bar
    stop dead rather than keep sweeping, nothing pay out during the gap, and a
    full-length life start on arrival — at the *new* world's length, which on
    world 3 is twice what the bar just showed.
54. **An age-long cohort.** 240 s on world 1–2 and 480 s on 3–5, one payout at a
    time. Nothing has watched a bar hold a player's attention for eight minutes,
    and the answer may be that the row needs a different readout.

## Parked — named, argued, not done

- The harness rings — a flash travelling `t`. Wants the rider count first.
- Arc-length reparameterising the loops — instantaneous rate wanders ±10%.
- The A → B seam, open since session 8 — a rider pops from far anchor to near.
- The halo, the echo and the flare — all off **by value**, everything standing.
- `span` is a ratio wearing a length word. A rename in four files.
- The planet lab's id row scrolls at nine worlds.
- ~~A hint tooltip, so nothing rides the native `title`.~~ Done, alongside the
  cohort row's own tooltip: `Tooltip` takes a `hint` variant now — one line, no
  chrome, short delay — and the lean dial uses it. `TokenRow`'s price note is the
  one call site left on native `title`.
- The token layer, the Harvest layout, per-cohort aiming — `progression.md` §*Parked*.

## Does not exist

- ~~No screen draws an anchor or a harness.~~ Detail does, from `detail.field`
  on. `Disc.svelte` is still unrendered, left in the tree.
- **`LeanMeter.svelte` draws nothing either.** `design.md` §6 cut the per-cohort
  aim figures it read; kept in the tree, unwired, against per-cohort aim coming
  back. See *Unseen* #41.
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
the last row. What is left is outside it: re-authoring `ridged`, the
type→parameter table, and authoring `PlanetData.boons` for the three worlds that
now have somewhere to put them.

`log-texts.ts` is **written**, not sixteen placeholders — every beat, milestone
and ambient line is authored, and it is the strongest statement of tone the
project has. What is unwritten is `planets-texts.ts`: three worlds called
*Planet 1 / Simple*. §*Premise and fiction* in `design.md`.

The **doc pass** is done: [`design.md`](./design.md) is the design's source of
truth and retires CONTEXT v3; `progression.md` keeps the arguments and the build.
It surfaced four live-vs-argued figures — `design.md` §18 — and the `perWorker`
one is a real defect: the anchoring phase runs ~10× faster than designed.

Still owed: the **comment sweep** (§*The comments want the same pass*).

**`design.md` §5 and §6 are landed** — the generated cohort ladder
(`cohort_1`…`cohort_8`, six shared level rungs plus six all-cohort ones, one
clerk per cohort including the first), and the global-only aim dial with the
span-averaged phase bias that replaces the cut per-cohort figures. §18 is still
argument only; see *Ahead of the build*.

**The life is now a length in phases**, and it is the thing waiting on an eye.
In order:

1. **Play worlds 1–2** and check the short and long rows now read as different
   kinds of thing, not just different speeds. The rows say `1/16 phase` … `1 age`
   and should line up against the strip above them.
2. **Bench the world 2 → 3 arrival.** Income should halve, and the refinery and
   wisdom with it. Whether that reads as progression or as the climb restarting
   is the whole question, and desk arithmetic cannot settle it.
3. **Only then** the harvest ratios (§15) and `firstWisdomAt`. Both were already
   owed a recalibration and both now have a second reason; retuning either before
   the arrival is measured is guessing twice.
4. **Decide the clerk on cycle-long rows** (§19). Their clerk sells throughput
   and no timing, which breaks §5's *automation is a trade* at that end. Both
   fixes break `clerk(n) = reveal(n+1)`, so it wants play before a choice.

⚠ **An age-long life on world 5 is eight minutes between payouts.** The row's bar
has to carry that wait alone, and nobody has watched it try.

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
- **A cohort's `life` is phases; its `duration` is milliseconds.** One is
  authored, the other is what `#clampDuration` makes of it against the world you
  are standing on. Reading a `life` as a clock is wrong by a factor of the phase.
- **Nothing may buy wave speed** — §7, and it now costs double. A
  phase-shortening upgrade would not be a feel change; it would multiply income
  directly.
- **The lab cannot sweep a `buildings.ts` constant.** `overrides.ts` writes into
  the data objects, but the module already generated itself from `BASE_LIFE` at
  load. Sweep a generated row's field, or move the figure into `balance.ts` —
  and it only belongs there if it differs per world.
- **`printVisual` and friends** emit every field at four decimals; paste
  indentation has drifted once.

## The 0 `check` errors

`check` is clean. The last one was **not** in `notification-manager.ts` — that
file went headless and the error moved with the toast call to `App.svelte`, where
the table never followed it. Svelte 5's function component against
svelte-toast 0.9's `ComponentType`, whose `<svelte:component>` takes either, so
only the type was behind: cast at the one call site, with the reason above it.

Earlier entries — `UpgradeRail.svelte` reading `.effect` off `Upgrade`, and
`TokenRow.svelte` missing `quantity` on `PurchaseButton` — were both fixed before
they were ever confirmed here. **The table went stale three times out of three.**
Re-run `npm run check` rather than trusting any list of errors in this file.
