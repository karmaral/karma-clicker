export default {
  'main_action': {
    yield_type: 'experience',
    yield_unit: 1,
    duration: 0,
    quantity: 1,
  },
  'basic': {
    upgrade_threshold: [5, 15, 25, 50, 75, 100, 125],
    cost_multiplier: 0.12,
    yield_multiplier: 0.88,
    cost: 5,
    cost_type: 'karma',
    yield_unit: 1,
    yield_type: 'karma',
    duration: 3000,
    duration_reduction: 0.39,
  },
  'steady': {
    upgrade_threshold: [5, 15, 25, 50, 75, 100, 125],
    cost: 20,
    cost_multiplier: 1,
    yield_multiplier: 3.3,
    cost_type: 'karma',
    yield_unit: 100,
    yield_type: 'karma',
    duration: 5000,
    duration_reduction: 0,
  },
    duration: 1000,
    duration_reduction: 0.69,
  }
}
