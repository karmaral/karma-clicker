import type { PlanetData } from '$lib/types';

const data: Record<string, PlanetData> = {
  'first': {
    // 8 phases at 30s — four minutes to an age. The floor, not the target: the
    // merge toll and the excess gate are what you actually wait on here.
    ages: 1,
    cycles_per_age: 4,
    phase_duration: 30_000,
    densities: 3,
    max_initial_density: 1,
    // The three tolls below are raw soul counts, so they scale with the army —
    // roughly ×5, the same factor the flattened ramps put on the population.
    // Left alone they stop being a toll: the merge floor would sit near 1%.
    firstHarvest: {
      excessGate: 0.12,
      agesLived: 1,
      mergeMinimum: 50
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
    // 32 phases at 45s — twenty-four minutes to the two ages it asks for.
    ages: 2,
    cycles_per_age: 8,
    phase_duration: 45_000,
    densities: 3,
    max_initial_density: 1,
    firstHarvest: { 
      excessGate: 0.08,
      agesLived: 2,
      mergeMinimum: 350
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
    // 96 phases at 60s — an hour and a half, and the phase itself is longer, so
    // the wave reads slower on a bigger world without the world being unreachable.
    ages: 4,
    cycles_per_age: 12,
    phase_duration: 60_000,
    densities: 6,
    max_initial_density: 1,
    firstHarvest: { 
      excessGate: 0.05,
      agesLived: 4,
      mergeMinimum: 1000
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
