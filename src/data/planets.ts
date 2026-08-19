import type { PlanetData } from '$lib/types';

const data: Record<string, PlanetData> = {
  'first': {
    ages: 1,
    cycles_per_age: 4,
    phase_multiplier: 1.3,
    initial_phase_amount: 100,
    densities: 3,
    max_initial_density: 1,
    firstHarvest: { excessGate: 0.12, agesLived: 1, mergeMinimum: 10 },
    harvest: {
      yields: { experience: 90, karma: 150 },
      duration: 60_000,
      mergeHalving: 50,
      maxMergeSpeed: 8,
    },
  },
  'second': {
    ages: 2,
    cycles_per_age: 8,
    phase_multiplier: 1.3,
    initial_phase_amount: 100,
    densities: 3,
    max_initial_density: 1,
    firstHarvest: { excessGate: 0.08, agesLived: 2, mergeMinimum: 120 },
    harvest: {
      yields: { experience: 1200, karma: 4500 },
      duration: 60_000,
      mergeHalving: 200,
      maxMergeSpeed: 6,
    },
  },
  'third': {
    ages: 4,
    cycles_per_age: 16,
    phase_multiplier: 3,
    initial_phase_amount: 1000,
    densities: 6,
    max_initial_density: 1,
    firstHarvest: { excessGate: 0.05, agesLived: 4, mergeMinimum: 600 },
    harvest: {
      yields: { experience: 30_000, karma: 120_000 },
      duration: 60_000,
      mergeHalving: 800,
      maxMergeSpeed: 4,
    },
  }
}
export default data;
