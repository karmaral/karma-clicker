import type { UpgradeData } from '$types';

const data: Record<string, UpgradeData[]> = {
  'main_action': [
    {
      id: 'str_1',
      title: 'Unlock',
      description: 'Incarnation XP yield x1.5',
      effect: 'unitYield * 1.5',
      unlocks_at: 30, 
      unlock_type: 'experience'
    },
    {
      id: 'str_2',
      title: 'Upgrade',
      description: 'Incarnation XP yield x2',
      effect: 'unitYield * 2',
      unlocks_at: 200, 
      unlock_type: 'experience',
      cost: 200,
      cost_type: 'experience'
    },
    {
      id: 'str_3',
      title: 'More cause means more effect',
      description: 'Incarnation XP x3',
      effect: 'unitYield * 3',
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
      unlocks_at: 25, 
      unlock_type: 'karma',
      cost: 25,
      cost_type: 'karma'
    },
  ],
  'basic': [
    {
      id: 'core_1',
      title: 'Self Discovery',
      description: 'Give probes incarnational autonomy.',
      effect: 'unlock:1',
      unlocks_at: 10,
      unlock_type: 'karma',
      cost: 200,
      cost_type: 'experience',
    }
  ]
};
export default data;
