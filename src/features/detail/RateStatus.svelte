<script lang="ts">
  /** Cohorts and the worlds already left both keep earning, so the header sums both. */
  import { Badge } from '$ui';
  import { BuildingManager, PlanetManager } from '$lib/managers';
  import { sumHarvestRates } from '$lib/planets/harvest';
  import { f } from '$lib/utils';
  import type { ResourceType } from '$types';

  const harvestRates = $derived(
    sumHarvestRates(
      PlanetManager.behind.map((id) => {
        const planet = PlanetManager.getPlanet(id);

        return { yields: planet.harvestYields, duration: planet.harvestDuration };
      }),
    ),
  );

  function harvestRateFor(...types: ResourceType[]) {
    return harvestRates
      .filter((rate) => types.includes(rate.type))
      .reduce((sum, rate) => sum + rate.perSecond, 0);
  }

  const karma = $derived(
    BuildingManager.countKarmaPerSecond() + harvestRateFor('karma_positive', 'karma_negative'),
  );
  const experience = $derived(
    BuildingManager.countExperiencePerSecond() + harvestRateFor('experience'),
  );
</script>

<div class="status">
  <span class="rate">
    <Badge kind="both" />
    <strong class="num">{f(karma)}/s</strong> karma
  </span>
  <span class="rate">
    <Badge kind="xp" />
    <strong class="num">{f(experience)}/s</strong> experience
  </span>
</div>

<style>
  .status {
    display: flex;
    align-items: center;
    gap: var(--sp-4);
    height: 48px;
    font-size: var(--fs-sm);
    color: var(--ink-500);
  }

  .rate {
    display: flex;
    align-items: center;
    gap: var(--badge-gap);
  }

  .num {
    font-weight: 600;
    color: var(--ink-900);
  }
</style>
