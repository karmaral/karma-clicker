import type { ItemTextData } from '$types';

const data: Record<string, Record<string, ItemTextData>> = {
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
    },
  },
  'cohort:basic': {
    'core_0': {
      title: 'Self Discovery',
      description: 'Unlock souls that can generate karma.',
    },
    'str_1': {
      title: 'A singular purpose',
      description: 'The collective of souls unifies under a single purpose.\n Current yield squared.',
    },
  },
  'cohort:steady': {
    'core_0': {
      title: 'Steady',
      description: 'Unlock slow souls but very yielding.',
    },
    'core_1': {
      title: 'An easier way',
      description: 'Give souls incarnational autonomy.',
    }
  },
  'cohort:chaos': {
    'core_0': {
      title: 'Free Wilderness',
      description: 'A soul that explores the full polarity spectrum at random.',
    },
  },
  'cohort:zealot': {
    'core_0': {
      title: 'MAX_VALUE',
      description: 'A zealot soul willing to go all in.\n Zealotry can backfire!',
    },
  },
  'cohort:red_basic': {
    'core_0': {
      title: 'Auto Refinery',
      description: 'A refiner soul that can produce tokens without consuming karma. Just like magic.',
    },
  },
};
export default data;
