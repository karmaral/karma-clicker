# Handoff — 2026-09-23

**Orientation only, and a board rather than an essay.**

- **One line per item.** If it needs a paragraph it is not orientation.
- **Write `design.md §n` or `progression.md §n` explicitly.** Both files number
  their sections, and a bare `§` collides silently.
- **No file table.** `git status` and `git log` are authoritative.
- **State only what a session verified, and who verified it.** The author plays
  and watches the dev server between sessions; a missing note is not evidence
  that something went unseen.

---

## Tree

Branch `dev-next`, last commit `c89c342 rebuild checkpoint 33` (2026-09-17).
Uncommitted, and **the author's own work**, not this session's:

- **Wisdom reads two axes** — `√(crimson/W + xp/X)`, `W = 10¹²`, `X = 4 × 10¹³`;
  the press takes it at half strength. `balance.ts`, `prestige.svelte.ts`.
- **Lines go round the ladder** — line `k` strings cohort `k mod 8`, repeats
  stack the bonus, and a world's anchor figure caps the lines. `harness.svelte.ts`.
- **The rig drops `work`, `press` and `lines` from its drawing** — a line now
  lights its family instead. `rig.ts`.
- **New visuals:** `SoulVolume`, `LineVolume`, `PlanetRings`, `storms.ts`.
- `Notification.svelte` deleted; wide edits across `features/`, `ui/`, `widgets/`.

This session touched **docs only**: `design.md` → v6.4, this file, the
addendum's splice note, and `docs/questionnaire.md`.

## Docs state

- **`design.md` v6.4** — a sync pass, no design moved. Drift fixed against
  `balance.ts`, `upgrades.ts`, `planets.ts`, `beats.ts`, `milestones.ts`,
  `prestige.svelte.ts`, `harness.svelte.ts`.
- **The v6.2 addendum is spliced** — correction cost → §8, *karma expires* →
  §19, held proposals → new §21. The file stays for its argument.
- **"Unplayed" is retired.** `design.md §19` *Findings from play* holds the
  author's play-through, from the questionnaire.
- The old 55-item *Unseen* board is retired; it is at `c89c342` if an item is
  still wanted.

## Verified, and how

- Every figure edited in `design.md` was read from its source file this session.
- `npm run check` / `build` **not re-run** — docs-only session.

## Ahead of the build

- **`design.md §18`** — knowledge, commerce and the structure shelf are argument
  only. Wisdom and the reset ship.
- **`design.md §12` `perWorker`** — 0.2 against a designed 0.02; anchoring ~10×
  faster than intended, unless play says otherwise.
- **`design.md §16` beat floors** — fitted to the pre-generated ladder.
- **`design.md §21`** — skim, phase-shape debuffs, `lightShare`, dump verb, tree.
  All held behind §19's *karma expires*.

## Next

1. **Questionnaire answered and spliced** into `design.md §19`, *Findings from
   play*. Four questions left open in `docs/questionnaire.md`.
2. **Karma's job** — `design.md §21`, *Karma as weight*, proposed. Blocked on
   the aim dial's new job and the harvest/demand rebuild it forces.
3. **`perWorker`, `clickMs`, anchor durations and slots** — retune together.

---

## Parked

- The harness rings — a flash travelling `t`.
- Arc-length reparameterising the loops — instantaneous rate wanders ±10%.
- The A → B seam — a rider pops from far anchor to near.
- The halo, the echo and the flare — all off **by value**.
- `span` is a ratio wearing a length word.
- `TokenRow`'s price note is the last call site on native `title`.
- The token layer, the Harvest layout, per-cohort aiming — `progression.md` §*Parked*.

## Does not exist

- **`LeanMeter.svelte` and `Disc.svelte`** — in the tree, unrendered.
- **A shared renderer** — parked; Overview rows are stills.
- **The type→parameter table**, so `planet-visuals.ts` is the only source.
- **Surface objects** — only the field they would query.
- **`PlanetData.boons`** content — wired end to end, authored on no world.
- **World and cohort names** — `Planet 1…5`, `Cohort n`.

## Hazards

- **Never `git checkout --` a file this session did not create.** `git status`
  first.
- **Never edit source with `Get-Content` / `Set-Content`.** PS 5.1 mangles em
  dashes. Use Edit, or `[System.IO.File]`.
- **Never put a backtick inside the GLSL literals** in `material.ts`.
- **A `uniform` with no entry in `uniforms` is silently 0.**
  `node scripts/uniform-join.mjs src/widgets/planet/material.ts` catches it.
- **New uniforms, blending modes and depth flags need a hard reload.**
- **The WebGL context ceiling is real.** A world that does not move wants
  `PlanetStill`.
- **A store written from inside an `$effect` must not be a rune.**
- **A probe can pass on a defect it never assembles.** Assert the shape.
- **A cohort's `life` is phases; its `duration` is milliseconds.**
- **Nothing may buy wave speed** — a phase-shortening upgrade multiplies income.
- **The lab cannot sweep a `buildings.ts` constant** — sweep a generated row's
  field instead.
- **The model modules never import three** — the node probe depends on it.
