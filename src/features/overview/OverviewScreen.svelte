<script lang="ts">
  /** One axis, three bands. Selecting feeds the right column; the verb lives there. */
  import { Badge } from '$ui';
  import { PlanetManager } from '$lib/managers';
  import { FIRST_HARVEST_CONDITIONS, getFirstHarvestConditionLabel } from '$lib/labels';
  import { progression } from '$lib/progression';
  import { sumHarvestRates } from '$lib/planets/harvest';
  import { f } from '$lib/utils';
  import { badgeFor } from '../detail/badge';
  import FirstHarvestScreen from '../harvest/FirstHarvestScreen.svelte';
  import PlanetList from './PlanetList.svelte';
  import PlanetDetail from './PlanetDetail.svelte';
  import HarvestLedger from './HarvestLedger.svelte';
  import HarvestRates from './HarvestRates.svelte';

  /** Size is the only thing that separates the three bands' pictures. */
  const BEHIND_PX = 24;
  const ACTIVE_PX = 24;
  const AHEAD_PX = 40;

  const TICK_MS = 1000;

  /**
   * The takeover owns the screen while open, but leaving it is free: nothing is
   * committed until its own verb fires, and the header stays live throughout.
   */
  let isHarvesting = $state(false);

  let picked = $state('');

  /**
   * One clock for every countdown in the Behind band. Local, and written only by
   * the timer — never read and written in the same effect.
   */
  let now = $state(Date.now());

  $effect(() => {
    const handle = setInterval(() => (now = Date.now()), TICK_MS);

    return () => clearInterval(handle);
  });

  const selected = $derived(picked || PlanetManager.selected);
  const active = $derived(PlanetManager.getPlanet(PlanetManager.selected));
  const isOffered = $derived(
    selected === PlanetManager.selected && Boolean(active) && !active.isHarvested,
  );

  /** Whether the Behind band reports rates at all, or is still just a list. */
  const isReporting = $derived(progression.isRevealed('overview.harvest'));

  /** The band's own figure. Batches do not add, so the header reads per second. */
  const behindTotal = $derived(
    sumHarvestRates(
      PlanetManager.behind.map((id) => {
        const planet = PlanetManager.getPlanet(id);

        return { yields: planet.harvestYields, duration: planet.harvestDuration };
      }),
    ),
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

{#snippet behindRates(id: string)}
  <HarvestRates planet={PlanetManager.getPlanet(id)} {now} />
{/snippet}

{#snippet behindHeader()}
  <span class="total">
    {#each behindTotal as rate (rate.type)}
      <span class="rate">
        <Badge kind={badgeFor(rate.type)} />
        <span class="num">{f(rate.perSecond)}/s</span>
      </span>
    {/each}
  </span>
{/snippet}

{#if isHarvesting && isOffered}
  <FirstHarvestScreen onclose={() => (isHarvesting = false)} />
{:else}
  <div class="overview view-layout">

    <div class="detail">
      {#if progression.isRevealed('overview.active')}
        <PlanetDetail id={selected} onharvest={() => (isHarvesting = true)} />
      {/if}

      <!-- Only while the Behind band cannot carry the rates itself. -->
      {#if isReporting && !PlanetManager.behind.length}
        <HarvestLedger />
      {/if}
    </div>

    <div class="axis">
      {#if progression.isRevealed('overview.active')}
        <PlanetList
          label="Active"
          ids={[PlanetManager.selected]}
          {selected}
          stat={getHereStat}
          stillPx={ACTIVE_PX}
          onpick={(id) => (picked = id)}
        />
      {/if}

      {#if progression.isRevealed('overview.behind') && PlanetManager.behind.length}
        <PlanetList
          label="Behind"
          ids={PlanetManager.behind}
          {selected}
          stat={isReporting ? undefined : getBehindStat}
          rowAside={isReporting ? behindRates : undefined}
          aside={isReporting && behindTotal.length ? behindHeader : undefined}
          stillPx={BEHIND_PX}
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
          stillPx={AHEAD_PX}
          onpick={(id) => (picked = id)}
        />
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

  .total {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    justify-content: flex-end;
    gap: var(--sp-1) var(--sp-3);
  }

  .rate {
    display: flex;
    align-items: center;
    gap: var(--badge-gap);
    color: var(--ink-900);
  }
</style>
