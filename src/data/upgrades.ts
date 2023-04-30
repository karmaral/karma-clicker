import type { UpgradeData } from '$types';

const data: Record<string, UpgradeData[]> = {
  'main_action': [
    {
      id: 'str_1',
      title: 'Getting the hang of it',
      description: 'Incarnation XP yield x1.5',
      effect: 'unitYield * 1.5',
      effect_target: 'experience',
      unlock_type: 'experience',
      unlocks_at: 30, 
    },
    {
      id: 'str_2',
      title: 'Upgrade',
      description: 'Incarnation XP yield x2',
      effect: 'unitYield * 2',
      effect_target: 'experience',
      unlock_type: 'experience',
      unlocks_at: 200, 
      cost: 200,
      cost_type: 'experience'
    },
    {
      id: 'str_3',
      title: 'More cause means more effect',
      description: 'Incarnation XP x3',
      effect: 'unitYield * 3',
      effect_target: 'experience',
      unlocks_at: 10,
      unlock_type: 'karma',
      cost: 15,
      cost_type: 'karma'
    },
    {
      id: 'str_4',
      title: 'Upgrade',
      description: 'Incarnation XP yield squared',
      effect: 'unitYield ** 2',
      effect_target: 'experience',
      unlocks_at: 25, 
      unlock_type: 'karma',
      cost: 25,
      cost_type: 'karma'
    },
  ],
  'basic': [
    {
      id: 'core_0',
      title: 'Self Discovery',
      description: 'Unlock probes that can generate karma.',
      effect: 'unlock',
      unlocks_at: 10,
      unlock_type: 'karma',
      cost: 60,
      cost_type: 'experience',
    },
    {
      id: 'core_1',
      title: 'An easier way',
      description: 'Give probes incarnational autonomy.',
      effect: 'autonomy',
      unlocks_at: 20,
      unlock_type: 'karma',
      cost: 200,
      cost_type: 'experience',
    }
  ]
};
export default data;
