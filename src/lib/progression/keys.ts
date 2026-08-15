/**
 * Surfaces the progression reveals, and systems it starts running.
 * Kept separate: a system simulates before its panel appears (CONTEXT v3 §3).
 */

/** `inert` = drawn, 1px rule, unclickable — a promise. Distinct from availability. */
export type RevealState = 'absent' | 'inert' | 'live';

export type RevealKey =
  | 'frame.header'
  | 'frame.rail'

  // Exactly three, permanently — the header is the navigation.
  | 'nav.overview'
  | 'nav.detail'
  | 'nav.refinery'

  // `reading.*`, not `header.*` — these predate the header and the frame
  // relocates them at beat 4 rather than re-revealing them.
  | 'reading.experience'
  | 'reading.posKarma'
  | 'reading.negKarma'
  | 'reading.excess'
  | 'reading.tokens'

  // Rendered on more than one screen. See LAYOUT.
  | 'shared.log'

  // "Close-up" in the design docs.
  | 'detail.disc'
  | 'detail.status'
  | 'detail.wave'
  | 'detail.cohortTable'
  | 'detail.aimGlobal'
  | 'detail.aimPerRow'
  | 'detail.split'
  | 'detail.field'

  // One axis: behind you, active, ahead of you. Reaching is an action on
  // `ahead`, not a reveal of its own — the last beat would be unreachable otherwise.
  | 'overview.active'
  | 'overview.behind'
  | 'overview.ahead'
  // The gated one-off, then the recurring take from everything behind you.
  | 'overview.firstHarvest'
  | 'overview.harvest'

  // A takeover, not a fourth tab.
  | 'harvest.disc'
  | 'harvest.verb'
  | 'harvest.split'
  | 'harvest.outcomes'

  | 'refinery.status'
  | 'refinery.backlog'
  | 'refinery.side'
  | 'refinery.intake'
  | 'refinery.rate'
  | 'refinery.grades'
  | 'refinery.split';

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
  incarnation: ['detail.disc'],
  posKarma: ['reading.posKarma'],
  negKarma: ['reading.negKarma'],
  cohort: ['detail.cohortTable'],
  wave: ['detail.wave'],
  aim: ['detail.aimGlobal'],
  excess: ['reading.excess'],
  harvest: ['harvest.disc', 'harvest.split'],
  anchoring: ['detail.field'],
  refining: [
    'refinery.status',
    'refinery.rate',
    'refinery.grades',
    'refinery.backlog',
    'reading.tokens',
  ],
  // `overview.harvest` is deliberately absent: the ledger is drawn empty from
  // beat 8 and only fills at beat 10, so it precedes the system it reports on.
  finishedPlanets: ['overview.behind'],
};

const ORDER: Record<RevealState, number> = { absent: 0, inert: 1, live: 2 };

export function rank(state: RevealState) {
  return ORDER[state];
}
