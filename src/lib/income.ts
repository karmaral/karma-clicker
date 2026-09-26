/**
 * What actually fills a karma pile: cohorts still working, plus every world
 * already behind and still yielding. Extracted because the refinery's readings
 * (the trend baseline) need the same total `Frame` assembles inline for its
 * rate badges.
 */

import { BuildingManager, PlanetManager } from '$lib/managers';
import { sumHarvestRates } from '$lib/planets/harvest';
import { aim } from '$lib/aim';
import type { ResourceType } from '$types';

function harvestRateFor(rates: { type: ResourceType; perSecond: number }[], type: ResourceType) {
  return rates.filter((rate) => rate.type === type).reduce((sum, rate) => sum + rate.perSecond, 0);
}

function sumBehindRates() {
  return sumHarvestRates(
    PlanetManager.behind.map((id) => {
      const planet = PlanetManager.getPlanet(id);

      return { yields: planet.harvestYields, duration: planet.harvestDuration };
    }),
  );
}

/** Cohorts plus every world still yielding — the two things that fill a pile. */
export function getKarmaIncomeByPolarity() {
  const cohorts = BuildingManager.countKarmaPerSecondByPolarity();
  const harvest = sumBehindRates();

  return {
    positive: cohorts.positive + harvestRateFor(harvest, 'karma_positive'),
    negative: cohorts.negative + harvestRateFor(harvest, 'karma_negative'),
  };
}

/** Experience earned a second, before the knowledge split takes its share. */
export function getExperienceIncome() {
  return BuildingManager.countExperiencePerSecond() + harvestRateFor(sumBehindRates(), 'experience');
}

/**
 * Both piles' income, cycle-mean: cohort karma with the wave's bias left out,
 * plus the worlds behind. What `weight` reads a backlog in seconds of.
 */
export function getHeldKarmaIncome() {
  const cohorts = BuildingManager.countKarmaEarnedPerSecond() * aim.resolve().karmaYieldFactor;
  const harvest = sumBehindRates();

  return cohorts
    + harvestRateFor(harvest, 'karma_positive')
    + harvestRateFor(harvest, 'karma_negative');
}
