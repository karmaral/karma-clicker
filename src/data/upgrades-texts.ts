import type { ItemTextData } from '$types';
import { levelTexts } from './cohort-levels';
import { COHORT_COUNT, cohortId } from './buildings';

const data: Record<string, Record<string, ItemTextData>> = {
  'global': {
    'read_the_wave': {
      title: 'The shape of it',
      description: 'The unevenness you have been feeling can be read.',
      effect: 'the wave, drawn',
    },
    'the_other_way': {
      title: 'The other way',
      description: 'Aim the lives to serve themselves. What they gain, they take.',
      effect: 'the other polarity, aimable',
    },
  },
  'refinery': {
    'efficiency_1': {
      title: 'A steadier hand',
      description: 'Twice the reach — the gap narrows.',
    },
    'reach_1': {
      title: 'Longer reach',
      description: 'Twice the reach — the gap narrows.',
    },
    'slots_1': {
      title: 'The floor below',
      description: 'Twelve more slots.',
    },
    'efficiency_2': {
      title: 'Steadier still',
      description: 'Twice the reach — the gap narrows.',
    },
    'reach_2': {
      title: 'Further still',
      description: 'Twice the reach — the gap narrows.',
    },
    'reach_3': {
      title: 'Across the floor',
      description: 'Twice the reach — the gap narrows.',
    },
    'reach_4': {
      title: 'Nothing out of reach',
      description: 'Twice the reach — the gap narrows.',
    },
  },
  'harness': {
    'split_1': {
      title: 'A finer hand',
      description: 'Set the allocation in quarters instead of halves.',
    },
    'anchors_1': {
      title: 'A second pole',
      description: 'One more of a world\'s slots is yours to fill.',
    },
    'lines': {
      title: 'Something to string',
      description: 'The harness will take a line. Buy one per cohort you want carried.',
      effect: 'cohort lines opened',
    },
    'slots_1': {
      title: 'The whole crew',
      description: 'Twenty-four more slots.',
    },
    'work_1': {
      title: 'They have done it before',
      description: 'Every soul on the lines places half again as fast.',
    },
    'split_2': {
      title: 'Finer still',
      description: 'Set the allocation in tenths.',
    },
    'press_1': {
      title: 'Your own weight on it',
      description: 'A press drives three quarters of a second into the job instead of a quarter.',
    },
    'anchors_2': {
      title: 'Around the waist',
      description: 'Two more slots, and a world starts to be worth anchoring whole.',
    },
    'riders_1': {
      title: 'Room for the rest',
      description: 'Two thousand souls ride instead of two hundred.',
    },
    'work_2': {
      title: 'Nothing wasted',
      description: 'Twice again what a soul places. The long worlds stop being long.',
    },
    'split_3': {
      title: 'To the soul',
      description: 'Set the allocation in twentieths.',
    },
    'anchors_3': {
      title: 'The full cage',
      description: 'Four more slots — enough for the last worlds, if they will give them.',
    },
  },
  'planet:second': {
    'discover': {
      title: 'It finds you',
      description: 'A second world makes itself known. Nothing was asked of you.',
    },
  },
  'planet:third': {
    'discover': {
      title: 'It finds you',
      description: 'A third world makes itself known. Nothing was asked of you.',
    },
  },
  'planet:fourth': {
    'discover': {
      title: 'Further out',
      description: 'A fourth world, twice as long as the one before it.',
    },
  },
  'planet:fifth': {
    'discover': {
      title: 'The far one',
      description: 'The last world of this system. It asks half of everyone you have.',
    },
  },
  'building:main': {
    'str_1': {
        title: 'Getting the hang of it',
        description: 'Incarnation XP yield x1.5',
      },
    'str_2': {
      title: 'Upgrade',
      description: 'Incarnation XP yield x2',
    },
    'str_3': {
      title: 'More cause means more effect',
      description: 'Incarnation XP x3',
    },
    'str_4': {
      title: 'Upgrade',
      description: 'Incarnation XP yield squared',
      effect: 'incarnation yield squared',
    },
    'carry_1': {
      title: 'What the lines carry back',
      description: 'Placeholder. Every soul riding the harness lends you a little of what it is doing up there. Incarnating by hand gains 0.2% for each of them.',
      effect: '+0.2% a soul riding',
    },
  },
  /**
   * Generated, like the buckets in `upgrades.ts` they describe. `first` and
   * `clerk` are placeholders until the cohorts themselves are named — see
   * `buildings-texts.ts`. `clerk`'s own name is unsettled; see
   * `docs/design.md` §19.
   */
  ...Object.fromEntries(
    Array.from({ length: COHORT_COUNT }, (_, i) => {
      const n = i + 1;
      const id = cohortId(n);

      return [`cohort:${id}`, {
        ...levelTexts(id),
        'first': n === 1
          ? { title: 'First soul', description: 'Placeholder. The wheel finds a second hand.' }
          : { title: 'Placeholder', description: `Placeholder. Cohort ${n} becomes reachable.` },
        // Cohort 1 has no `clerk` row — its autonomy rides the free `first` grant instead.
        ...(n === 1 ? {} : {
          'clerk': {
            title: 'Clerk',
            description: 'Placeholder. Sends this cohort’s souls without being asked.',
          },
        }),
      }];
    }),
  ),
  'cohorts': {
    'shorter_lives_1': {
      title: 'Shorter Lives I',
      description: 'Placeholder. Every cohort turns over a little faster.',
    },
    'hard_season': {
      title: 'Hard Season',
      description: 'Placeholder. A harder push, felt across every cohort at once.',
    },
  },
};
export default data;
