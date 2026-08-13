# Handoff — 2026-08-13

Six changes sit uncommitted on `dev-next`. All compile. **Changes 1–4 have been
played through once by hand** — see What was watched; 5 and 6 have not. The design
rationale lives in `docs/progression.md`; this file is only what a cold start needs
to know that the doc does not say.

## State of the tree

```
 M docs/progression.md
 M src/data/upgrades.ts
 M src/data/upgrades-texts.ts
 M src/features/detail/CohortRow.svelte
 M src/features/detail/CohortTable.svelte
 M src/features/dev/DevPanel.svelte
 M src/lib/aim/aim.svelte.ts
 M src/lib/buildings/base.svelte.ts
 M src/lib/managers/building-manager.svelte.ts
 M src/lib/managers/upgrade-manager.svelte.ts
 M src/lib/modifiers/modifier-set.svelte.ts
 M src/lib/progression/context.ts
 M src/lib/types.d.ts
 M src/lib/wiring.svelte.ts
?? src/lib/buildings/cohort.svelte.ts
?? src/lib/refinery.svelte.ts

                                  ── change 5, the log ──
 M src/features/Log.svelte
 M src/lib/log.svelte.ts
 M src/lib/progression/beats.ts       ← four id renames only
 M src/lib/progression/index.ts
 M src/lib/wiring.svelte.ts           ← also above
?? src/data/log-texts.ts
?? src/lib/progression/milestones.ts

                                  ── the `f` rename, nothing else ──
 M src/App.svelte
 M src/features/detail/DetailScreen.svelte
 M src/features/frame/Frame.svelte
 M src/features/frame/UpgradeRail.svelte
 M src/features/harvest/FirstHarvestScreen.svelte
 M src/features/overview/OverviewScreen.svelte
 M src/lib/utils.ts
 M src/ui/Chip.svelte
 M src/features/detail/CohortRow.svelte   ← also above
 M src/features/dev/DevPanel.svelte       ← also above

 M src/data/planets-texts.ts      ← not from this work
 M src/ui/PurchaseButton.svelte   ← not from this work
```

The third block is the one to know before reading a diff: those eight files contain
**only** `formatNumber` → `f` — except `utils.ts`, which also loses
`getUpgradeTypeLabel` in change 6. `beats.ts` carries four id renames plus change 6.

`npm run check` reports 12 errors, all of them pre-existing and none in the files
above: `Chip.svelte`, `notification-manager.ts`, `UpgradeRail.svelte`,
`Preview.svelte`, and the tooltip `delay` tuple in `CohortRow.svelte` that
predates this work. `npm run build` passes.

`planets-texts.ts` currently carries `Planet 1 / Simple`, `Planet 2 / Harder`,
`Planet 3 / Haderer` over the written copy. Placeholder, and possibly not meant
to be kept.

## 1. The soul split — settled

`reserve` is real state and beat 11's trigger is live. New `$lib/reserve.svelte`
singleton holds one fraction; `Cohort extends Building` overrides a new generic
`active` getter to subtract the held souls. `role` is read exactly once, in
`BuildingManager.unlock`, to pick the class — everything downstream asks
`instanceof Cohort`.

Written up under **Souls** in `progression.md`, including why this subclass does
not contradict the anti-inheritance argument two sections above it.

**Not playable.** `detail.split` is still a `RevealStub`, so only `DevPanel` can
set the fraction (0 / 25% / 50% buttons). Deferred on purpose — the split UI is a
design job the owner wants to do themselves.

`active` reaches further than the karma it was built for. `#generateResources`
credits the planet's own experience through the same `this.active` multiplier, so
reserved souls stop aging the planet as well as stop earning: staffing the
refinery slows phases, which pushes back beat 9's `agesLived` gate and stretches
any live re-aim penalty in wall-clock time. Neither doc names this. It compounds
with the excess effect under **Excess** rather than offsetting it.

## 2. The cohort row's rates — built, not endorsed

The owner's words: *"I'm not sold on the rates and everything, but it's a
rabbithole for another day."* Treat everything in this section as provisional.
Do not build on it, and do not tidy it into permanence.

What changed: karma now displays as two figures per row (positive and negative)
instead of one unrouted total, each with a small ▲/▼ comparing it against the
same rate at Even aim.

The part that was **not** a preference: `perSecond('karma')` returned production
over duration and stopped, while the payout multiplied by `karmaYieldFactor` and
the planet's bias. The `polarity_multiplier: 7` cohort displayed an identical
rate at Even and at Hard negative while really paying several times more. Any
future revert should keep that fixed, whatever happens to the two-figure layout.

The owner has already reworked the presentation by hand — `.output` is back to
`flex-direction: row` and the mark is absolutely positioned above or below the
number rather than beside it. So the column-width concern that motivated the
original stack is unresolved; watch the `experience` + `karma` cohort, which
needs three figures in 170px.

### The one line to revert first

```ts
// building-manager.svelte.ts
countKarmaPerSecond()   // now sums the split, not perSecond('karma')
```

This puts `karmaYieldFactor` and `Planet.bias()` inside the excess wall. It was
taken deliberately, to avoid two disagreeing definitions of karma per second, and
it is a genuine balance change: aiming into a high-`polarity_multiplier` cohort
widens the wall several-fold, and a phase flip swings it up to 2.3× on its own.
If excess starts reading strangely, this is the cause. Reverting it costs only
the guarantee that the wall and the screen agree.

### Refused on purpose

- **A phase-flip arrow on the row.** Phase is global, so every row would print
  the same bit. It belongs on the wave display, once — still unbuilt.
- **Drift in the displayed figure.** `aim.resolveSettled()` exists to drop it.
  Every cohort with `polarity_multiplier > 1` also has `resistance > 0`, so a
  live figure would churn by roughly 20% forever. The `LeanMeter` carries the
  wander as a band; drift is a span here, never a number.
- **The re-aim penalty in the rows.** `AimSection` already reports it once.

### Adjacent, not done

`Planet.bias()` is a square wave — `1.4` or `0.6` on `isDense` — so nothing
breathes; a rate sits flat for a phase and then jumps. Making it continuous over
`position` is a real option and was the owner's original interest, but it moves
the average bias across a phase and the wall reads income, so it is a balance
change rather than a display one. Take it on its own.

## 3. The refinery engine — built, invisible

Recorded under **Refinery — engine built, screen not** in `progression.md`. The
staffing knob that section left open is now **closed and built**: staffing is
linear on the batch, seats cap it, and staffing never touches the interval.

`$lib/refinery.svelte.ts` is the singleton, next to `reserve`. It composes
`ResourceEmitter` like every other producer. Both karma piles are drawn at the
same rate, each capped by what it holds, and conversion is 1:1 — so excess
passes through the step untouched, which is the whole point of §3.5 being
superseded.

Three things went wider than the refinery, and each is the kind of change worth
knowing about before reading a diff:

- **`ModifierStat` gained `seats`.** `ModifierSet.#isApplicable` (renamed from
  `#applies`) now asks the resource-target question for `yield` only, instead of
  naming `duration` as the exception. Behaviour for existing modifiers is
  identical; the rule is just stated the right way round.
- **`parseScope` gained a `refinery` kind.** It is the first bucket that names no
  entity and is not global. `UpgradeManager` routes its modifiers to the
  singleton; verbs still act on entities only.
- **`UpgradeManager.#toModifier`** was extracted because two call sites now build
  the same modifier. It is also where the `effect_target` override rule finally
  gets written down.

### The import cycle

`upgrade-manager` → `refinery.svelte` → `$lib/managers` → `upgrade-manager`.
This is the same shape `building-manager` already has (it imports the barrel that
imports it), nothing is touched at module init, and `build` resolves it. Worth
knowing it is there before adding a top-level manager call to the refinery.

### Deliberately not built

- **The token purchases.** Ochre from equal-parts Crimson, Indigo from Ochre, and
  the opposite Crimson at a steep price. All three are decided and none has a
  price curve, so red currently only accumulates. New step 9 in the course table.
- **A karma-to-red ratio.** Conversion is 1:1 and efficiency scales the karma
  consumed. A ratio is the obvious first knob if the refinery pays too well; it
  was left out rather than guessed at.
- **The seven stubs.** Untouched, as asked. The engine exposes `seats`,
  `workers`, `batch`, `interval` and `perSecond` for whatever draws them.

## 4. The opening — beats 3 and 4 could not fire

`cohort:basic/core_0` was `['unlock', 'autonomy']` and priced. `unlock` builds
the cohort at count 0 and grants nothing, so `totalSouls` could never leave 0 by
any route: the rail that sells `core_0` is beat 4, the cohort table that sells
souls is beat 3, and beat 3 wants a soul. Both beats reached on their floors
only, and the first cohort was unbuyable until after the beat it was supposed to
cause.

It is now `['unlock', 'acquire']`, unpriced, at 15 lifetime positive karma — the
"trigger wearing the upgrade shape" already described under **Scopes**, where the
rationale is now recorded. `acquire` carries autonomy on its own, so the verb was
redundant as well as inert (its case in `#processEffect` is commented out).

Two consequences: `core_0` no longer appears in the rail, since the rail filters
unpriced entries; and its notification copy in `upgrades-texts.ts` still reads
*"Unlock souls that can generate karma"*, written for something you buy and now
fired unprompted. Left alone — it is the owner's voice.

The gauge in `progression.md` listed beats 1–4 under "own trigger". That was
aspirational until now, and is accurate as of this change.

### Beat 6's second clause is dead, and not for want of data

`when: hasUpgrade(global, 'the_other_way') || total('karma_negative') > 0`.
`aim.#resolve` returns `positiveShare: 1` while `progression.runs('negKarma')` is
false, and `negKarma` is what beat 6 turns on — so negative karma cannot exist
until beat 6 has already fired. The clause is unreachable by construction, not
merely unauthored, and beat 6 reaches on its floor no matter what.

Authoring `the_other_way` (course step 1) is the whole fix, so nothing new is
needed — but the fallback beside it is dead weight rather than a second route,
and step 1 is worth more than the course table's "buys the least" implies.

## 5. The log — a narrative window

Recorded nowhere in `progression.md`, which does not mention the log at all. Its
only prior design statement was the comment above beat 1 in `beats.ts` — *"One
button, one number. The log carries the reward."*

`log.svelte.ts` went from one writer to three:

- `add(text)` — a line, as before.
- `once(key, text)` — at most ever, latched against a module-level `written` set.
- `accumulate(key, format)` — holds repeats in a pending bucket and flushes every
  `COALESCE_MS` (2s) onto **one** row that counts up.

Only the head row absorbs. A run of incarnations occupies a single row; the moment
anything else lands, that row freezes at its final figure and the new line prepends
above it. `add` flushes pending repeats first, so the order stays honest rather than
printing a phase flip before the lives that preceded it.

The timestamp is gone, and with it `elapsed()` and the entry's `at` field. Entries
now carry `key` and `count`, which the UI does not draw — they are what lets a row
keep absorbing.

### Where the lines come from

`wiring.svelte.ts` is still the only module that writes to the log. Keep it that
way; two watchers were added there rather than anywhere else.

- **`watchBeats`** reads `progression.beat` in an `$effect` with a `previous` mark.
  It deliberately does **not** use `evaluate()`'s return value, which stays
  discarded in `loop.ts` — the counter carries the same information without
  changing the progression API. `once` keying by beat id is what makes `DevPanel`
  scrubbing idempotent.
- **`watchMoments`** walks the new `progression/milestones.ts`: four firsts no beat
  covers. First negative karma is there because beat 6 reaches on its floor, so the
  frame can arrive before any harm is done; first reserve because beat 11 wants
  more than reserve alone; first token because beat 11 is the refinery *starting*,
  not its first output; and excess at 0.6, twice beat 7's threshold.

`milestones.ts` mirrors `beats.ts` in shape and shares its `TriggerContext`, but has
no `reveals` and no `runs` — a beat changes the frame, a milestone only says
something happened. Anything a beat already fires on belongs there, not here.

### The copy is a draft, not authored

`src/data/log-texts.ts` is a fourth `*-texts.ts`. The twelve beat lines are drawn
from the beat comments in `beats.ts`, which were the best-written narrative in the
repo and invisible to the player. **The shape is settled; the words are not** —
treat every line in that file as placeholder awaiting the owner's voice.

Two copy calls taken without being asked: the `+N experience` figure came off the
incarnation line, on the grounds that it is the ledger half and `reading.experience`
is live from beat 1; and the wave lines kept their existing wording verbatim.

### Two renames rode along

- **`formatNumber` → `f`**, 35 occurrences across 11 files. `UpgradeRail`'s
  `formatNumber as fmt` alias was dropped rather than becoming `f as fmt`.
  `formatRounded` and `numberFormat` in the same file were left alone.
- **Beat ids to snake_case** — `first_soul`, `rows_and_rail`, `negative_karma`,
  `second_harvest`. Safe because nothing matched them by literal: they are only
  read generically, in `validate()`'s messages and `DevPanel`'s `current?.id`.

### Deliberately not built

- **`ItemTextData.flavour`** is still declared and still unused. It was the obvious
  slot for per-entity narrative and was passed over — the log's sources are beats
  and firsts, not entities.
- **Upgrade acquisitions** stay on the toast channel only. `UpgradeManager.acquire`
  has authored prose in hand and sends it somewhere that vanishes; routing it to the
  log was considered and dropped as too high-volume.
- **`shared.log`** is still drawn on one screen despite its `shared.*` key.

## What was watched

Changes 1–4. One manual pass through the ladder. There are no tests and no headless
driver, so this is one person clicking, not coverage — but nothing on the list
misbehaved.

- Reserving souls in `DevPanel` cuts income and moves `countReserved()`. The
  `$derived` inside a subclass field (`Cohort.#reserved`) reads correctly.
- The two karma figures hold still between ticks — no drift leaking in.
- Excess does not lurch when the aim slider moves.
- The refinery pays once beat 11 and `seats_1` are in. The `DevPanel` row reads
  `seats worked/total`, throughput and both red piles.
- `refinery.svelte.ts` uses the same unobserved-`$derived`-in-a-class pattern as
  `Cohort`, and `#refine()` reads `#batch` from inside a `setTimeout`. Throughput
  did follow seats and reserved souls; that is still where to look if it stops.

Two things that were not on the list and are worth knowing:

- **The log floods.** *Fixed by change 5 — `watchExperience` now coalesces instead
  of printing per credit.* It read: `watchExperience` prints "A life ended" on every
  experience credit, souls included, into a 40-entry buffer; at ten `basic` souls on
  a 3s clock the wave's phase-flip lines are evicted within seconds.
- **Beats 7 and 9 pull opposite ways.** 7 wants excess ≥ 30%, 9 wants it under
  12%, and on planet one the only way down is spending karma — the refinery is
  beat 11. That is the incidental third route named under **Excess**, and it is
  now the shape of the mid-game rather than a footnote.

`CohortTable.svelte` also had `170px 96x` in the non-aim branch of its grid
template — a voided declaration, so the table fell back to auto columns for beats
1–3. Fixed.

## 6. Step 1, and the `core_0` rename — built, not played

The `global` bucket is authored, so beats 5 and 6 fire for their own reason and
the floor-only column of the gauge is empty. Both entries are priced triggers
with no effect — `effect` is now optional on `UpgradeData`. `wider_wave` became
**`read_the_wave`**: a global upgrade reaches `if (!entity) return;` in
`#processEffect`, so it could never have widened anything, and beat 5 calls the
wave *a clock you read, not a lever*. Beat 6 lost its `karma_negative > 0`
fallback, which the previous session had already shown unreachable.

Prices are placeholders under each beat's floor: `read_the_wave` at 9k
experience for 750 positive karma, `the_other_way` at 30k for 4,000.

**`core_0` → `first`** in all five cohort buckets, plus texts. `core` named a
position, not a thing, and no bucket had an honest `_1`. Nothing matched the id
by literal except `getUpgradeTypeLabel` in `utils.ts` — dead code with no
callers, mapping `core_0`→"Blueprint", now deleted. That function was the only
record of what `core` was reaching for; it is written down in `progression.md`
under **Scopes** before being removed.

`cohort:steady/core_1` → **`speed_1`**. Its `autonomy` effect bought nothing:
the verb's case is commented out and `acquire` grants autonomy anyway, so it was
a 200-experience purchase that did literally nothing. Kept as a purchase rather
than deleted, per the owner. It now carries `{ op: 'mult', value: 0.75, stat:
'duration' }` — steady is the one cohort with `duration_reduction: 0`, so it
never speeds up with count, and "An easier way" still reads true. **This is a
balance change and a placeholder figure.** The redundant `autonomy` verb also
came off `chaos` and `red_basic`.

**Not played.** `check` reports the same 12 pre-existing errors and `build`
passes, but nothing here has been clicked through. What to watch: `read_the_wave`
and `the_other_way` appearing as rail chips with scope `global` (the rail draws
every bucket, and neither has ever been rendered), and steady's `speed_1`
actually shortening the incarnation.

### One copy correction

`log-texts.ts` said *"The first harm done on purpose. It pays better."* It does
not. `extremityPayoff` reads `Math.abs(realizedAim)`, so Hard negative and Hard
positive pay identically — extremity pays, direction does not. The only
asymmetry is `Planet.bias()`, which flips every phase and averages out. The line
is now service-to-self framed and makes no claim about the rate.

All three places negative karma is described now share that register: the
`first_negative_karma` moment, beat 6's own log line, and `the_other_way`'s
description. Nothing else in `log-texts.ts` made a polarity claim. The remaining
fourteen lines there are still placeholder.

## Untouched roadmap

In `progression.md`'s course table, unchanged by this session:
`PlanetData.yields` for the recurring harvest (step 5), travel and beat 12
(step 8), the token purchases (step 9), and the Overview / Harvest / Refinery
layouts (step 7). Step 1 is done — see above.

Change 5 adds one job that is not in that table: **authoring `log-texts.ts`**. It
is writing, not code — sixteen lines, all of them placeholder, and the only new
surface where the game speaks in prose.

Everything mechanical that could land without a design pass has landed. Steps 7,
8 and 9 all bottom out in the parked layouts, so the next move is a design
decision rather than a code one.
