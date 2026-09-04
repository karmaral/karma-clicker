import type { PlanetData } from '$lib/types';

/**
 * Five worlds, and **nothing here is an absolute**. The toll and the halving are
 * shares of your army; the yields are seconds of your income at departure; the
 * length is wall-clock. So the next change to the cohort ladder cannot invalidate
 * this file the way the last one did — see `docs/design.md` §13 and §15.
 *
 * The three time fields are free within one constraint:
 * `ages × cycles_per_age × 2 × phase_duration = 240 s × 2^(p−1)`.
 * `cycles_per_age` holds at 4 everywhere so the wave reads the same on every
 * world; `phase_duration` doubles once, and `ages` carries the rest.
 */
const data: Record<string, PlanetData> = {
  'first': {
    // 8 phases at 30s — four minutes, one age. A formality: nobody leaves the
    // first world on its floor, and it was never going to contain beats 1–10.
    ages: 1,
    cycles_per_age: 4,
    phase_duration: 30_000,
    densities: 3,
    max_initial_density: 1,
    firstHarvest: {
      excessGate: 0.12,
      agesLived: 1,
      mergeMinimum: 0.15,
    },
    harvest: {
      // Seconds of income, not amounts. At the toll (×2 speed) this pays back
      // 0.5× your experience and 1.5× your averaged karma, every second, forever.
      yields: {
        experience: 15,
        karma: 45,
      },
      duration: 60_000,
      mergeHalving: 0.15,
      maxMergeSpeed: 8,
    },
  },
  'second': {
    // 16 phases at 30s — eight minutes, two ages.
    ages: 2,
    cycles_per_age: 4,
    phase_duration: 30_000,
    densities: 3,
    max_initial_density: 1,
    firstHarvest: {
      excessGate: 0.08,
      agesLived: 2,
      mergeMinimum: 0.25,
    },
    anchoring: { anchors: 2, duration: 36_000, bonusPerAnchor: 0.25 },
    harvest: {
      yields: { experience: 30, karma: 90 },
      duration: 60_000,
      mergeHalving: 0.25,
      maxMergeSpeed: 5,
    },
  },
  'third': {
    // 16 phases at 60s — sixteen minutes. The phase itself doubles here, so the
    // wave reads slower on a bigger world without the world being unreachable.
    ages: 2,
    cycles_per_age: 4,
    phase_duration: 60_000,
    densities: 6,
    max_initial_density: 1,
    firstHarvest: {
      excessGate: 0.05,
      agesLived: 2,
      mergeMinimum: 0.35,
    },
    anchoring: {
      anchors: 3,
      duration: 180_000,
      bonusPerAnchor: 0.45,
    },
    harvest: {
      yields: { experience: 45, karma: 135 },
      duration: 60_000,
      mergeHalving: 0.35,
      maxMergeSpeed: 4,
    },
  },
  'fourth': {
    // 32 phases at 60s — thirty-two minutes, four ages.
    ages: 4,
    cycles_per_age: 4,
    phase_duration: 60_000,
    densities: 6,
    max_initial_density: 1,
    firstHarvest: {
      excessGate: 0.04,
      agesLived: 4,
      mergeMinimum: 0.45,
    },
    anchoring: {
      anchors: 4,
      duration: 240_000,
      bonusPerAnchor: 0.6,
    },
    harvest: {
      yields: { experience: 60, karma: 180 },
      duration: 60_000,
      mergeHalving: 0.45,
      maxMergeSpeed: 3.5,
    },
  },
  'fifth': {
    // 64 phases at 60s — an hour, eight ages. The cap: no world may ask for more
    // souls than it leaves you, so the toll stops climbing at half.
    ages: 8,
    cycles_per_age: 4,
    phase_duration: 60_000,
    densities: 9,
    max_initial_density: 1,
    firstHarvest: {
      excessGate: 0.03,
      agesLived: 8,
      mergeMinimum: 0.5,
    },
    anchoring: {
      anchors: 5,
      duration: 300_000,
      bonusPerAnchor: 0.75,
    },
    harvest: {
      yields: { experience: 80, karma: 240 },
      duration: 60_000,
      mergeHalving: 0.5,
      maxMergeSpeed: 3,
    },
  },
}
export default data;
