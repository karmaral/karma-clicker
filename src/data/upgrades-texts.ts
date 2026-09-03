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
    'slots_1': {
      title: 'Room to work',
      description: 'Four slots. Reserved souls fill them; an empty slot refines nothing.',
    },
    'efficiency_1': {
      title: 'A steadier hand',
      description: 'Karma per batch x1.5',
    },
    'speed_1': {
      title: 'Shorter shifts',
      description: 'Seconds per batch x0.75',
    },
    'slots_2': {
      title: 'The floor below',
      description: 'Twelve more slots.',
    },
    'efficiency_2': {
      title: 'Steadier still',
      description: 'Karma per batch x2',
    },
    'speed_2': {
      title: 'Shorter still',
      description: 'Seconds per batch x0.5',
    },
  },
  'harness': {
    'slots_1': {
      title: 'Hands on the lines',
      description: 'Six slots. Reserved souls fill them; the rest wait their turn.',
    },
    'split_1': {
      title: 'A finer hand',
      description: 'Set the allocation in quarters instead of halves.',
    },
    'riders_1': {
      title: 'Something to hold',
      description: 'Two hundred souls can ride the finished harness and take what it pays.',
    },
    'slots_2': {
      title: 'The whole crew',
      description: 'Twenty-four more slots.',
    },
    'split_2': {
      title: 'Finer still',
      description: 'Set the allocation in tenths.',
    },
    'riders_2': {
      title: 'Room for the rest',
      description: 'Two thousand souls ride instead of two hundred.',
    },
    'split_3': {
      title: 'To the soul',
      description: 'Set the allocation in twentieths.',
    },
  },
  'planet:second': {
    'discover': {
      title: 'Somewhere else',
      description: 'A second world, and a way to reach it.',
    },
  },
  'planet:third': {
    'discover': {
      title: 'It finds you',
      description: 'A third world makes itself known. Nothing was asked of you.',
    },
  },
  'building:main': {
    'speed_1': {
      title: 'First stirrings',
      description: 'Incarnating takes a little less out of you.',
    },
    'speed_2': {
      title: 'Getting faster',
      description: 'The wait between lives keeps shrinking.',
    },
    'speed_3': {
      title: 'It clicked for you',
      description: 'You figure out a way to incarnate instantly.'
    },
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
        'clerk': {
          title: 'Clerk',
          description: 'Placeholder. Sends this cohort’s souls without being asked.',
        },
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
