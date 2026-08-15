import type { RevealKey, RevealState, SystemKey } from './keys';
import type { TriggerContext } from './context';

export interface Beat {
  id: string;
  when: (ctx: TriggerContext) => boolean;
  /**
   * Experience fallback, so a beat can never stall. Figures are the ramp in
   * CONTEXT §3. Omitted where the beat needs an event with no numeric stand-in.
   */
  floor?: number;
  /** Needs a real event; no experience figure would stand in for it. */
  eventOnly?: true;
  runs?: SystemKey[];
  reveals?: Partial<Record<RevealKey, RevealState>>;
}

/** Both upgrades named below are priced triggers with no effect of their own. */
const GLOBAL = 'global';

export const beats: Beat[] = [
  // One button, one number. The log carries the reward.
  {
    id: 'click',
    when: () => true,
    // The wave runs from the start so beat 5 explains noise already felt.
    runs: ['incarnation', 'wave'],
    reveals: {
      'detail.disc': 'live',
      'shared.log': 'live',
      'reading.experience': 'live',
    },
  },

  // Incarnating leaves residue. Positive only — no polarity, no reading.
  {
    id: 'karma',
    when: (ctx) => ctx.total('karma_positive') > 0,
    floor: 340,
    runs: ['posKarma'],
    reveals: { 'reading.posKarma': 'live' },
  },

  // Automatic from the first one — the wheel starting to turn.
  {
    id: 'first_soul',
    when: (ctx) => ctx.totalSouls >= 1,
    floor: 1_100,
    runs: ['cohort'],
    reveals: { 'detail.cohortTable': 'live' },
  },

  // The figures fly up into the header; the disc stays where it was.
  {
    id: 'rows_and_rail',
    when: (ctx) => ctx.totalSouls >= 10,
    floor: 8_400,
    reveals: {
      'frame.header': 'live',
      'frame.rail': 'live',
      'detail.status': 'live',
      'nav.detail': 'live',
      // Drawn, but there is no second screen to open until beat 8.
      'nav.overview': 'inert',
    },
  },

  // The noise you had noticed has a shape. A clock you read, not a lever.
  {
    id: 'wave',
    when: (ctx) => ctx.hasUpgrade(GLOBAL, 'read_the_wave'),
    floor: 26_900,
    reveals: { 'detail.wave': 'live' },
  },

  // A choice and nothing else: how dirty do you want to run.
  // No `karma_negative` fallback — this beat is what lets that pile exist.
  {
    id: 'negative_karma',
    when: (ctx) => ctx.hasUpgrade(GLOBAL, 'the_other_way'),
    floor: 74_200,
    runs: ['negKarma', 'aim'],
    reveals: {
      'reading.negKarma': 'live',
      'detail.aimGlobal': 'live',
      // The row's lean meter: what each cohort is doing, with no way to steer it.
      'detail.aimPerRow': 'inert',
    },
  },

  // The consequence arrives after the choice that caused it. The tool does not.
  {
    id: 'excess',
    // Magnitude, not sign — Burden and Comfort both bite, in opposite ways.
    when: (ctx) => ctx.excess !== undefined && Math.abs(ctx.excess) >= 0.3,
    floor: 186_000,
    runs: ['excess'],
    reveals: {
      'reading.excess': 'live',
      // A reading with no screen behind it. Becomes a tab at beat 11.
      'nav.refinery': 'inert',
    },
  },

  // Somewhere else exists, and it is gated — before this planet is finished.
  {
    id: 'discovery',
    when: (ctx) => ctx.planetsUnlocked >= 2,
    floor: 430_000,
    reveals: {
      'nav.overview': 'live',
      'overview.active': 'live',
      'overview.ahead': 'live',
      'overview.harvest': 'live',
      // States both conditions rather than greying out silently.
      'overview.firstHarvest': 'inert',
    },
  },

  // Choose how many to leave. The count drops as you drag — cost felt, not explained.
  {
    id: 'harvest',
    eventOnly: true,
    // The planet authors its own conditions; the beat only asks whether they hold.
    when: (ctx) => ctx.isActivePlanetHarvestable,
    runs: ['harvest'],
    reveals: {
      'overview.firstHarvest': 'live',
      'harvest.disc': 'live',
      'harvest.verb': 'live',
      'harvest.split': 'live',
      'harvest.outcomes': 'live',
    },
  },

  // The last decision, felt in the first minute — not read about.
  {
    id: 'anchor',
    eventOnly: true,
    when: (ctx) => ctx.planetsFinished >= 1,
    runs: ['anchoring', 'finishedPlanets'],
    reveals: {
      'detail.field': 'live',
      'detail.split': 'live',
      'overview.behind': 'live',
    },
  },

  // The reading you could not act on becomes the tab you act on.
  {
    id: 'refining',
    eventOnly: true,
    when: (ctx) =>
      ctx.reserve > 0 && ctx.total('karma_positive') > 0 && ctx.total('karma_negative') > 0,
    runs: ['refining'],
    reveals: {
      'nav.refinery': 'live',
      'reading.tokens': 'live',
      'refinery.status': 'live',
      'refinery.backlog': 'live',
      'refinery.side': 'live',
      'refinery.intake': 'live',
      'refinery.rate': 'live',
      'refinery.grades': 'live',
      'refinery.split': 'live',
    },
  },

  // Two producers, out of phase, and nowhere to be. Reveals nothing — the log
  // carries it, and everything it could have shown is already reachable.
  {
    id: 'second_harvest',
    eventOnly: true,
    when: (ctx) => ctx.planetsFinished >= 2,
  },
];
