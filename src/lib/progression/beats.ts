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

/**
 * `building:main/str_1`'s own gate. The rail opens on the figure that puts the
 * first chip in it, so it is never revealed empty — keep the two together.
 */
const FIRST_CHIP = 40;

export const beats: Beat[] = [
  // One button, one number. The log carries the reward.
  {
    id: 'click',
    when: () => true,
    // The wave runs from the start so beat 6 explains noise already felt.
    runs: ['incarnation', 'wave'],
    reveals: {
      'details.disc': 'live',
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

  // Somewhere to spend. Gated on experience and not on souls: what the rail
  // holds here is the click's own ladder, which souls have nothing to do with —
  // and on a soul count the two chips unlocked before it arrived together as a
  // wall. `when` is the floor, because this beat *is* a threshold.
  {
    id: 'rail',
    when: (ctx) => ctx.total('experience') >= FIRST_CHIP,
    floor: FIRST_CHIP,
    reveals: { 'frame.rail': 'live' },
  },

  // Automatic from the first one — the wheel starting to turn.
  {
    id: 'first_soul',
    when: (ctx) => ctx.totalSouls >= 1,
    floor: 1_100,
    runs: ['cohort'],
    reveals: { 'details.cohortTable': 'live' },
  },

  // The figures fly up into the header; the disc stays where it was. Five, not
  // ten: five is the first cohort gate, so the rows land on the beat that gives
  // them something to count. The rail is no longer here — it opens at beat 3 on
  // the click's own ladder, which is what it holds until this beat.
  {
    id: 'rows',
    when: (ctx) => ctx.totalSouls >= 5,
    floor: 4_200,
    reveals: {
      'frame.header': 'live',
      'details.status': 'live',
      'nav.details': 'live',
    },
  },

  // The noise you had noticed has a shape. A clock you read, not a lever.
  {
    id: 'wave',
    when: (ctx) => ctx.hasUpgrade(GLOBAL, 'read_the_wave'),
    floor: 26_900,
    reveals: { 'details.wave': 'live' },
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
      'details.aimGlobal': 'live',
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
      'harvest.screen': 'live',
    },
  },

  // The last decision, felt in the first minute — not read about.
  {
    id: 'anchor',
    eventOnly: true,
    when: (ctx) => ctx.planetsFinished >= 1,
    runs: ['anchoring', 'finishedPlanets'],
    reveals: {
      'details.field': 'live',
      'details.split': 'live',
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
      'refinery.screen': 'live',
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
