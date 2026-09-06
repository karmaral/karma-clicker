import { f } from '$lib/utils';

/**
 * Every line the log can write. `beats` is keyed by the ids in progression/beats.ts,
 * `moments` by the ones in progression/milestones.ts. `ambient` lines take a figure
 * or a name, so those are functions.
 */
const data = {
  beats: {
    'click': 'Something has to turn the wheel. For now that is you.',
    'karma': 'The lives leave a residue behind them. It has a name.',
    'rail': 'You have done this enough to do it better. What you learn stays learned.',
    'first_soul': 'One of them stayed. It turns the wheel without being asked.',
    'rows': 'There are enough of them to count now. The figures rise into view.',
    'wave': 'The unevenness has a shape. It was always there.',
    'negative_karma': 'There is another way to earn. The lives can be turned to serve themselves.',
    'excess': 'The books do not balance. What you took has started taking back.',
    'discovery': 'A second world makes itself known. Nothing was asked of you.',
    'harvest': 'This world is ready to end. How much of it you keep is yours.',
    'anchor': 'The first world is behind you. What you left in it still turns.',
    'refining': 'The two piles can be made into something. The reserved souls do the making.',
    'second_harvest': 'Two worlds turn without you, out of phase. There is nowhere you need to be.',
    'terminus': 'The whole of it can be ended, the way a world can. Only what you understood would cross.',
  } as Record<string, string>,

  moments: {
    'first_negative_karma': 'The first life in service to itself. What it gained, it took from the others.',
    'first_reserve': 'Some of them will not incarnate again. You decided that.',
    'first_token': 'The first of it comes out solid, holding the side it came in on.',
    'deep_excess': 'The imbalance is no longer small.',
    'ratio_even': 'The refinery pays back what it takes, and then some.',
  } as Record<string, string>,

  /**
   * Written by the boot rather than by `wiring`, because it fires exactly once
   * per module graph and there is no event left over from the run that earned it.
   */
  prestige: {
    legacy: (wisdom: number) =>
      `It has all turned over again. You arrive holding ${f(wisdom)} wisdom and nothing else.`,
  },

  ambient: {
    incarnation: (n: number) => (n === 1 ? 'A life ended.' : `${f(n)} lives ended.`),
    dense: (name: string) => `${name} turned dense. Lives are going worse than they were.`,
    light: (name: string) => `${name} turned light. Lives are going better than they were.`,
  },
};

export default data;
