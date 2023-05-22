import type { BuildingData } from '$lib/types';

const data: Record<string, BuildingData> = {
  'main_action': {
    base_yields: { 
      'experience': 1,
      'karma_positive': 0.33,
    },
    duration: 0,
    owned: 1,
    polarity_bias: 0.5,
    polarity_multiplier: 1,
  },
  'basic': {
    upgrade_threshold: [5, 15, 25, 50, 75, 100, 125],
    base_costs: { 
      'karma_positive': 5,
    },
    cost_multipliers: { 'all': 1.15 },
    base_yields: { 
      'experience': 2,
      'karma_positive': 1,
    },
    yield_multipliers: { 'all': 0.88 },
    duration: 3000,
    duration_reduction: 0.39,
    polarity_bias: 1,
    polarity_multiplier: 1,
  },
  'steady': {
    upgrade_threshold: [5, 15, 25, 50, 75, 100, 125],
    base_costs: { 
      'karma_positive': 20,
    },
    cost_multipliers: { 'all': 2 },
    base_yields: {
      'karma_positive': 100,
    },
    yield_multipliers: { 'all': 3.3 },
    duration: 5000,
    duration_reduction: 0,
    polarity_bias: 1,
    polarity_multiplier: 1,
  },
  'chaos': {
    upgrade_threshold: [5, 15, 25, 50, 75, 100, 125],
    base_costs: { 
      'karma_positive': 20,
    },
    cost_multipliers: { 'all': 1.5 },
    base_yields: { 
      'karma_positive': 20,
    },
    yield_multipliers: { 'all': 1.5 },
    duration: 2000,
    duration_reduction: 0,
    polarity_bias: 0,
    polarity_multiplier: 3,
  },
  'zealot': {
    upgrade_threshold: [5, 15, 25, 50, 75, 100, 125],
    base_costs: { 
      'karma_positive': 10000 
    },
    cost_multipliers: { 'all': 1.5 },
    base_yields: { 
      'karma_positive': 2000 
    },
    yield_multipliers: { 'all': 3 },
    duration: 5000,
    duration_reduction: 0.2,
    polarity_bias: 2,
    polarity_multiplier: 7,
  },
  'red_basic': {
    type: 'refiner',
    upgrade_threshold: [5, 15, 25, 50, 75, 100, 125],
    base_costs: { 
      'red_positive': 50,
    },
    cost_multipliers: { 'all': 1.15 },
    base_yields: { 
      'red_positive': 1,
    },
    yield_multipliers: { 'all': 2 },
    duration: 2000,
    duration_reduction: 0.2,
    polarity_bias: 1,
    polarity_multiplier: 1,
  },
  'yellow_any': {
    type: 'refiner',
    upgrade_threshold: [5, 15, 25, 50, 75, 100, 125],
    base_costs: { 
      'yellow_positive': 50,
      'yellow_negative': 50,
    },
    cost_multipliers: { 'all': 1.15 },
    base_yields: { 
      'yellow_positive': 1,
    },
    yield_multipliers: { 'all': 2 },
    duration: 2000,
    duration_reduction: 0.2,
    polarity_bias: 0,
    polarity_multiplier: 1,
  },
}
export default data;
