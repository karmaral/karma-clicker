import type { TriggerContext } from './context';

/**
 * Firsts the log narrates that no beat covers. A beat changes the frame; a
 * milestone only says something happened, so there are no reveals and no runs.
 * Anything a beat already fires on belongs there, not here — ten souls, first
 * excess and the harvests are all beats.
 */
export interface Milestone {
  id: string;
  when: (ctx: TriggerContext) => boolean;
}

export const milestones: Milestone[] = [
  // Beat 7 reaches on its floor, so the frame can arrive before any harm does.
  {
    id: 'first_negative_karma',
    when: (ctx) => ctx.total('karma_negative') > 0,
  },

  // Beat 11 wants this and two karma piles; held souls can come well before it.
  {
    id: 'first_reserve',
    when: (ctx) => ctx.reserve > 0,
  },

  // The refinery starting is beat 11. This is the first thing it hands back.
  {
    id: 'first_token',
    when: (ctx) => ctx.total('red_positive') > 0 || ctx.total('red_negative') > 0,
  },

  // Twice beat 7's threshold, in either direction.
  {
    id: 'deep_excess',
    when: (ctx) => ctx.excess !== undefined && Math.abs(ctx.excess) >= 0.6,
  },

  // The refinery starts lossy — see `refinery.svelte.ts`. This is where it stops.
  {
    id: 'ratio_even',
    when: (ctx) => ctx.refineryRatio >= 1,
  },
];
