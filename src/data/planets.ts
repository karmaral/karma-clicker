import type { PlanetData } from '$lib/types';

const data: Record<string, PlanetData> = {
  'first': {
    ages: 1,
    cycles_per_age: 4,
    phase_multiplier: 1.3,
    initial_phase_amount: 100,
    densities: 3,
    max_initial_density: 1,
  },
  'second': {
    ages: 2,
    cycles_per_age: 8,
    phase_multiplier: 1.3,
    initial_phase_amount: 100,
    densities: 3,
    max_initial_density: 1,
  },
  'third': {
    ages: 4,
    cycles_per_age: 16,
    phase_multiplier: 3,
    initial_phase_amount: 1000,
    densities: 6,
    max_initial_density: 1,
  }
}
export default data;
