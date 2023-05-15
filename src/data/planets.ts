import type { PlanetData } from '$lib/types';

const data: Record<string, PlanetData> = {
  'first': {
    ages: 1,
    cycles_per_age: 2,
    cycle_stage_multiplier: 1.3,
    cycle_initial_stage_amount: 100,
    densities: 3,
    max_initial_density: 1,
  },
  'second': {
    ages: 2,
    cycles_per_age: 2,
    cycle_stage_multiplier: 1.3,
    cycle_initial_stage_amount: 100,
    densities: 3,
    max_initial_density: 1,
  },
  'third': {
    ages: 4,
    cycles_per_age: 4,
    cycle_stage_multiplier: 3,
    cycle_initial_stage_amount: 1000,
    densities: 6,
    max_initial_density: 1,
  }
}
export default data;
