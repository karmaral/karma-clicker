import type { PlanetData } from '$lib/types';

const data: Record<string, PlanetData> = {
  'first': {
    ages: 1,
    cycles_per_age: 4,
    phase_multiplier: 1.3,
    initial_phase_amount: 100,
    densities: 3,
    max_initial_density: 1,
    firstHarvest: { 
      excessGate: 0.12,
      agesLived: 1,
      mergeMinimum: 10 
    },
    harvest: {
      yields: { 
        experience: 50_000,
        karma: 150_000,
      },
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
    firstHarvest: { 
      excessGate: 0.08,
      agesLived: 2,
      mergeMinimum: 70 
    },
    anchoring: { anchors: 2, duration: 36_000, bonusPerAnchor: 0.25 },
    harvest: {
      yields: { experience: 120_000, karma: 450_000 },
      duration: 60_000,
      mergeHalving: 200,
      maxMergeSpeed: 5,
    },
  },
  'third': {
    ages: 4,
    cycles_per_age: 12,
    phase_multiplier: 2.5,
    initial_phase_amount: 1000,
    densities: 6,
    max_initial_density: 1,
    firstHarvest: { 
      excessGate: 0.05,
      agesLived: 4,
      mergeMinimum: 200 
    },
    anchoring: { 
      anchors: 3, 
      duration: 180_000,
      bonusPerAnchor: 0.45,
    },
    harvest: {
      yields: { experience: 300_000, karma: 1_200_000 },
      duration: 90_000,
      mergeHalving: 800,
      maxMergeSpeed: 4,
    },
  }
}
export default data;
