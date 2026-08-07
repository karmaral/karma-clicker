# Progression

Rationale and open decisions for `$lib/progression`. The ladder itself lives in
[`beats.ts`](../src/lib/progression/beats.ts) and the vocabulary in
[`keys.ts`](../src/lib/progression/keys.ts) — this file does not restate either,
nor CONTEXT v2.

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

`DevPanel` (DEV only) exposes beat −/+/reset, resource grants, and
`window.karma`. Yields are low and the later beats trigger at high figures, so
this is the only practical way to reach them by hand.

## Parked

Design decisions deferred on purpose. None of these are oversights.

- **Matched-pairs karma** is load-bearing under beats 7, 9 and 11. Left as-is
  until the surrounding systems exist and it can be judged in play.
- **The refinery** should auto-emit the lowest grade. The higher two lose
  polarity and stop being buyable with karma directly — everything routes
  through the refinery. Not implemented.
- **Overview and Harvest layouts** are stubbed pending a design pass. The two
  lists on Overview, and where Harvest's verb sits relative to its disc, are
  open questions — don't improvise them.

## Known gaps

Things that are simply unbuilt, and what they cost today.

- **Four context values are `0` stubs** — `excess`, `reserve`, `cyclesLived`,
  `planetsFinished`. Their beats carry no floor precisely so they cannot fire on
  a stub, which means **beats 9–12 are currently unreachable**. Expected.
- **No `global` bucket in `data/upgrades.ts`.** That file is keyed by building
  target, so planet-wide upgrades have nowhere to live and beats 5 and 6 reach
  only via their floors.
- **Karma is an `experience / 3` hack** in `wiring.svelte.ts`, carried over from
  the deleted `MainAction`. It is what makes beat 2 fire.
- **`reading.tokens`** is declared in `RevealKey` but no beat reveals it.
- **`EffectManager`** is the last file importing `svelte/store`; everything else
  is on runes.

## Naming

Code vocabulary and UI labels differ on purpose — `refinery` is labelled
"Clearing", and `detail` (the design docs' "close-up") shows the planet's proper
noun. `reading.*` rather than `header.*`, because those figures predate the
header: beat 4 relocates them into the frame instead of revealing them again.
None of this is drift; don't "fix" it.
