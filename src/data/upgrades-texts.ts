import type { ItemTextData } from '$types';

const data: Record<string, Record<string, ItemTextData>> = {
  'global': {
    'read_the_wave': {
      title: 'The shape of it',
      description: 'The unevenness you have been feeling can be read.',
    },
    'the_other_way': {
      title: 'The other way',
      description: 'Aim the lives to serve themselves. What they gain, they take.',
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
    },
  },
  'cohort:basic': {
    'first': {
      title: 'Self Discovery',
      description: 'Unlock souls that can generate karma.',
    },
    'str_1': {
      title: 'A singular purpose',
      description: 'The collective of souls unifies under a single purpose.\n Current yield squared.',
    },
  },
  'cohort:steady': {
    'first': {
      title: 'Steady',
      description: 'Unlock slow souls but very yielding.',
    },
    'speed_1': {
      title: 'An easier way',
      description: 'Seconds per incarnation x0.75',
    }
  },
  'cohort:chaos': {
    'first': {
      title: 'Free Wilderness',
      description: 'A soul that explores the full polarity spectrum at random.',
    },
  },
  'cohort:zealot': {
    'first': {
      title: 'MAX_VALUE',
      description: 'A zealot soul willing to go all in.\n Zealotry can backfire!',
    },
  },
  'cohort:red_basic': {
    'first': {
      title: 'Auto Refinery',
      description: 'A refiner soul that can produce tokens without consuming karma. Just like magic.',
    },
  },
};
export default data;
