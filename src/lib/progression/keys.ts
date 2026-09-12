/**
 * Surfaces the progression reveals, and systems it starts running.
 * Kept separate: a system simulates before its panel appears (CONTEXT v3 §3).
 */

/** `inert` = drawn, 1px rule, unclickable — a promise. Distinct from availability. */
export type RevealState = 'absent' | 'inert' | 'live';

export type RevealKey =
  | 'frame.header'
  | 'frame.rail'

  // A tab is a place you *configure* a system you own; a takeover is a decision
  // that ends something. That is the whole test, and it is what the "exactly
  // three, permanently" note here used to assert instead. The harness is a
  // system with capacities to buy and a rig to look at, so it is a tab; the
  // first harvest and the end of a run are doors, so they are takeovers.
  | 'nav.overview'
  | 'nav.details'
  | 'nav.harness'
  | 'nav.refinery'

  // `reading.*`, not `header.*` — these predate the header and the frame
  // relocates them at beat 5 rather than re-revealing them.
  | 'reading.experience'
  | 'reading.posKarma'
  | 'reading.negKarma'
  | 'reading.excess'
  // The same reading twice over, and the second is not a second surface of it:
  // `reading.excess` is the figure, this is the scale it stands on and the door
  // drawn on it. Split because the door is not on the table until a second world
  // is, and a gate you cannot walk through is a mark with nothing to measure.
  | 'reading.excessScale'
  | 'reading.tokens'

  // Rendered on more than one screen. See LAYOUT.
  | 'shared.log'

  // "Close-up" in the design docs.
  | 'details.disc'
  | 'details.status'
  | 'details.wave'
  | 'details.cohortTable'
  | 'details.aimGlobal'
  | 'details.split'
  | 'details.field'

  // One axis: behind you, active, ahead of you. Reaching is an action on
  // `ahead`, not a reveal of its own — the last beat would be unreachable otherwise.
  | 'overview.active'
  | 'overview.behind'
  | 'overview.ahead'
  // The gated one-off, then the recurring take from everything behind you.
  | 'overview.firstHarvest'
  | 'overview.harvest'

  // A takeover and not a tab: leaving a world for good is a decision, not a
  // panel you keep coming back to. One key, because it arrives whole — four
  // keys revealed in one beat, all `live`, were three of them pretending to be
  // a sequence. `overview.firstHarvest` is the gate that does have two states.
  | 'harvest.screen'

  // Not a fifth `{#if}`: five reveal keys were revealed `live` in the same beat,
  // in the same object literal, with no state where one was true and another
  // false — see `harvest.screen` above. One key, and the screen has no internal
  // guard. The *tab* it lives under is `nav.refinery`.
  | 'refinery.screen'

  // A takeover, and by the test above: ending a run is a door, not somewhere
  // you configure anything. Nothing simulates behind it, so it has no
  // `SystemKey`.
  | 'prestige.screen';

export type SystemKey =
  | 'incarnation'
  | 'posKarma'
  | 'negKarma'
  | 'cohort'
  | 'wave'
  | 'aim'
  | 'excess'
  | 'harvest'
  | 'anchoring'
  | 'refining'
  | 'finishedPlanets';

/** Lets validate() enforce that a system runs before its panel is drawn. */
export const SYSTEM_SURFACES: Record<SystemKey, RevealKey[]> = {
  incarnation: ['details.disc'],
  posKarma: ['reading.posKarma'],
  negKarma: ['reading.negKarma'],
  cohort: ['details.cohortTable'],
  wave: ['details.wave'],
  aim: ['details.aimGlobal'],
  excess: ['reading.excess', 'reading.excessScale'],
  harvest: ['harvest.screen'],
  anchoring: ['details.field', 'nav.harness'],
  refining: ['refinery.screen', 'reading.tokens'],
  // `overview.harvest` is deliberately absent: the ledger is drawn empty from
  // beat 8 and only fills at beat 10, so it precedes the system it reports on.
  finishedPlanets: ['overview.behind'],
};

const ORDER: Record<RevealState, number> = { absent: 0, inert: 1, live: 2 };

export function rank(state: RevealState) {
  return ORDER[state];
}
