import type { ItemTextData } from '$types';

const data: Record<string, Record<string, ItemTextData>> = {
  'main_action': {
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
  'basic': {
    'core_0': {
      title: 'Self Discovery',
      description: 'Unlock probes that can generate karma.',
    },
    'str_1': {
      title: 'A singular purpose',
      description: 'The collective of probes unifies under a single purpose.\n Current yield squared.',
    },
  },
  'steady': {
    'core_0': {
      title: 'Steady',
      description: 'Unlock slow probes but very yielding.',
    },
    'core_1': {
      title: 'An easier way',
      description: 'Give probes incarnational autonomy.',
    }
  },
  'chaos': {
    'core_0': {
      title: 'Free Wilderness',
      description: 'A probe that explores the full polarity spectrum at random.',
    },
  },
  'zealot': {
    'core_0': {
      title: 'MAX_VALUE',
      description: 'A zealot probe willing to go all in.\n Zealotry can backfire!',
    },
  },
  'red_basic': {
    'core_0': {
      title: 'Auto Refinery',
      description: 'A refiner probe that can produce tokens without consuming karma. Just like magic.',
    },
  },
};
export default data;
