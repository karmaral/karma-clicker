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

/** Cohorts plus every world still yielding — the two things that fill a pile. */
export function getKarmaIncomeByPolarity() {
  const cohorts = BuildingManager.countKarmaPerSecondByPolarity();
  const harvest = sumHarvestRates(
    PlanetManager.behind.map((id) => {
      const planet = PlanetManager.getPlanet(id);

      return { yields: planet.harvestYields, duration: planet.harvestDuration };
    }),
  );

  return {
    positive: cohorts.positive + harvestRateFor(harvest, 'karma_positive'),
    negative: cohorts.negative + harvestRateFor(harvest, 'karma_negative'),
  };
}

/**
 * What the refinery's coverage is a share of: cohort karma, before the aim
 * split and the wave bias, times the *shorter* of the two shares the dial
 * would send it to. See `docs/design.md` §9 — this is exact, not an
 * approximation, because the wave's bias averages to 1.0 over a cycle.
 * Harvest income is left out on purpose: it never passed through the dial.
 */
export function getShortPileIncome() {
  const raw = BuildingManager.countKarmaEarnedPerSecond();
  const { positiveShare, karmaYieldFactor } = aim.resolve();

  return raw * karmaYieldFactor * Math.min(positiveShare, 1 - positiveShare);
}
