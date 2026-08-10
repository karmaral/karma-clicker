import type { UpgradeData } from '$types';

const data: Record<string, UpgradeData[]> = {
  'global': [],
  'refinery': [],
  'harness': [],
  'main_action': [
    {
      id: 'str_1',
      effect: { op: 'mult', value: 1.5 },
      effect_target: 'experience',
      unlock_type: 'experience',
      unlocks_at: 30, 
    },
    {
      id: 'str_2',
      effect: { op: 'mult', value: 2 },
      effect_target: 'experience',
      unlock_type: 'experience',
      unlocks_at: 200, 
      cost: { experience: 200 }
    },
    {
      id: 'str_3',
      effect: { op: 'mult', value: 3 },
      effect_target: 'experience',
      unlocks_at: 10,
      unlock_type: 'karma_positive',
      cost: 15,
      cost_type: 'karma_positive'
    },
    {
      id: 'str_4',
      // Squares the ladder above it once: 1 × 1.5 × 2 × 3 × 9 = 81. Retune with str_1–3.
      effect: { op: 'mult', value: 9 },
      effect_target: 'experience',
      unlocks_at: 25, 
      unlock_type: 'karma_positive',
      cost: 25,
      cost_type: 'karma_positive'
    },
  ],
  'basic': [
    {
      id: 'core_0',
      effect: ['unlock', 'autonomy'],
      unlocks_at: 10,
      unlock_type: 'karma_positive',
      cost: 60,
      cost_type: 'experience',
    },
    {
      id: 'str_1',
      // The two yields ride different level curves, so they take different factors.
      effect: [
        { op: 'mult', value: 1.6, target: 'experience' },
        { op: 'mult', value: 6.6, target: 'karma' },
      ],
      unlocks_at: 10000,
      unlock_type: 'karma_positive',
      cost: 10000,
      cost_type: 'karma_positive',
    },
  ],
  'steady': [
    {
      id: 'core_0',
      effect: ['unlock', 'acquire'],
      unlocks_at: 3,
      unlock_type: 'karma_positive',
      cost: 3,
      cost_type: 'karma_positive',
    },
    {
      id: 'core_1',
      effect: 'autonomy',
      unlocks_at: 20,
      unlock_type: 'karma_positive',
      cost: 200,
      cost_type: 'experience',
    }
  ],
  'chaos': [
    {
      id: 'core_0',
      effect: ['unlock', 'acquire', 'autonomy'],
      unlocks_at: 50,
      unlock_type: 'karma_positive',
      cost: 50,
      cost_type: 'karma_positive',
    },
  ],
  'zealot': [
    {
      id: 'core_0',
      effect: ['unlock', 'acquire'],
      unlocks_at: 10000,
      unlock_type: 'karma_positive',
      cost: 10000,
      cost_type: 'karma_positive',
    },
  ],
  'red_basic': [
    {
      id: 'core_0',
      effect: ['unlock', 'acquire', 'autonomy'],
      unlocks_at: 5000,
      unlock_type: 'red_positive',
      cost: 5000,
      cost_type: 'red_positive',
    },
  ]
};
export default data;
