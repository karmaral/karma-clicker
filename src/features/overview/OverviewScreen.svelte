<script lang="ts">
  /** One axis, three bands. Selecting feeds the right column; the verb lives there. */
  import { PlanetManager } from '$lib/managers';
  import { FIRST_HARVEST_CONDITIONS, getFirstHarvestConditionLabel } from '$lib/labels';
  import { progression } from '$lib/progression';
  import { f } from '$lib/utils';
  import FirstHarvestScreen from '../harvest/FirstHarvestScreen.svelte';
  import PlanetList from './PlanetList.svelte';
  import PlanetDetail from './PlanetDetail.svelte';
  import HarvestLedger from './HarvestLedger.svelte';

  /**
   * The takeover owns the screen while open, but leaving it is free: nothing is
   * committed until its own verb fires, and the header stays live throughout.
   */
  let isHarvesting = $state(false);

  let picked = $state('');

  const selected = $derived(picked || PlanetManager.selected);
  const active = $derived(PlanetManager.getPlanet(PlanetManager.selected));
  const isOffered = $derived(
    selected === PlanetManager.selected && Boolean(active) && !active.isHarvested,
  );

  function getHereStat(id: string) {
    const planet = PlanetManager.getPlanet(id);

    if (planet.isHarvested) {
      return `${f(planet.merged)} merged`;
    }

    return `${f(planet.agesLived)} ages · phase ${planet.phase + 1} of ${planet.phasesPerAge}`;
  }

  function getBehindStat(id: string) {
    return `${f(PlanetManager.getPlanet(id).merged)} merged`;
  }

  /** An unreached world is known only by what it will ask of you. */
  function getAheadStat(id: string) {
    const { firstHarvest } = PlanetManager.getPlanet(id).data;

    return FIRST_HARVEST_CONDITIONS
      .filter((condition) => firstHarvest[condition] !== undefined)
      .map((condition) => getFirstHarvestConditionLabel(condition, firstHarvest[condition] ?? 0))
      .join(' · ');
  }
</script>

{#if isHarvesting && isOffered}
  <FirstHarvestScreen onclose={() => (isHarvesting = false)} />
{:else}
  <div class="overview view-layout">
    <div class="axis">
      {#if progression.isRevealed('overview.active')}
        <PlanetList
          label="Active"
          ids={[PlanetManager.selected]}
          {selected}
          stat={getHereStat}
          onpick={(id) => (picked = id)}
        />
      {/if}

      {#if progression.isRevealed('overview.behind') && PlanetManager.behind.length}
        <PlanetList
          label="Behind"
          ids={PlanetManager.behind}
          {selected}
          stat={getBehindStat}
          onpick={(id) => (picked = id)}
        />
      {/if}

      {#if progression.isRevealed('overview.ahead')}
        <PlanetList
          label="Ahead"
          ids={PlanetManager.ahead}
          {selected}
          stat={getAheadStat}
          empty="Nowhere else is known."
          onpick={(id) => (picked = id)}
        />
      {/if}

    </div>

    <div class="detail">
      {#if progression.isRevealed('overview.active')}
        <PlanetDetail id={selected} onharvest={() => (isHarvesting = true)} />
      {/if}

      {#if progression.isRevealed('overview.harvest')}
        <HarvestLedger />
      {/if}
    </div>
  </div>
{/if}

<style>
  .axis {
    display: flex;
    flex-direction: column;
    min-width: 0;
  }

  .detail {
    display: flex;
    flex-direction: column;
    border-left: var(--rule-card);
    min-width: 0;
  }
</style>
