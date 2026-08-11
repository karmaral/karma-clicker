<script lang="ts">
  /** Layout awaits its design pass — unbuilt keys are held in reveal order until then. */
  import { Button } from '$ui';
  import { PlanetManager } from '$lib/managers';
  import { getFirstHarvestConditionLabel } from '$lib/labels';
  import { progression } from '$lib/progression';
  import { formatNumber } from '$lib/utils';
  import RevealStub from '../RevealStub.svelte';
  import FirstHarvestScreen from '../harvest/FirstHarvestScreen.svelte';
  import planetTexts from '$data/planets-texts';

  /**
   * The takeover owns the screen while open, but leaving it is free: nothing is
   * committed until its own verb fires, and the header stays live throughout.
   */
  let isHarvesting = $state(false);

  let picked = $state('');

  const selected = $derived(picked || PlanetManager.selected);
  const planet = $derived(PlanetManager.getPlanet(selected));
  const name = $derived(planetTexts[selected]?.title ?? '—');

  /** Only the planet you are on can be harvested; the rest are places to go. */
  const isActive = $derived(selected === PlanetManager.selected);
  const isOffered = $derived(isActive && Boolean(planet) && !planet.harvested);

  const blockers = $derived(
    (planet?.unmetFirstHarvestConditions ?? []).map((condition) =>
      getFirstHarvestConditionLabel(condition, planet?.data.firstHarvest[condition] ?? 0),
    ),
  );
</script>

{#if isHarvesting && isOffered}
  <FirstHarvestScreen onclose={() => (isHarvesting = false)} />
{:else}
  <div class="overview view-layout">
    <div class="planet-list">
      {#if progression.isRevealed('overview.active')}
        <ul class="planets">
          {#each PlanetManager.planets as id (id)}
            {@const each = PlanetManager.getPlanet(id)}
            <li>
              <button
                type="button"
                class={['planet', { on: id === selected }]}
                onclick={() => (picked = id)}
              >
                <span class="name">{planetTexts[id]?.title ?? id}</span>
                <span class="stat num">
                  {each.harvested
                    ? `${formatNumber(each.merged)} merged`
                    : `${formatNumber(each.agesLived)} ages · phase ${each.phase + 1} of ${each.phasesPerAge}`}
                </span>
              </button>
            </li>
          {/each}
        </ul>
        <RevealStub name="overview.ahead" note="unreached planets" />
        <RevealStub name="overview.behind" note="planets left for good" />
      {/if}
    </div>

    <div class="planet-detail">
      {#if progression.isRevealed('overview.harvest') && isOffered}
        <Button
          label="Harvest {name}"
          sub={blockers.length ? `Needs ${blockers.join(' · ')}` : 'Ready'}
          disabled={!progression.isLive('overview.harvest') || !planet.isFirstHarvestReady}
          onclick={() => (isHarvesting = true)}
        />
      {/if}
      <RevealStub name="overview.cameHome" note="arrivals from behind you" height="48px" />
      <RevealStub name="overview.setOut" note="depart for the next planet" height="48px" />
    </div>

  </div>
{/if}

<style>

  .planets {
    display: flex;
    flex-direction: column;
    margin: 0;
    padding: 0;
    list-style: none;
    border-top: var(--rule-row);
  }

  .planet {
    display: flex;
    align-items: baseline;
    justify-content: space-between;
    gap: var(--sp-4);
    width: 100%;
    padding: var(--sp-3) var(--sp-2);
    background: none;
    border: none;
    border-bottom: var(--rule-row);
    cursor: pointer;
    text-align: left;
  }

  .planet.on {
    background: var(--surface-alt);
  }

  .name {
    font-size: var(--fs-md);
    font-weight: 600;
    color: var(--ink-900);
  }

  .stat {
    font-size: var(--fs-sm);
    color: var(--ink-500);
  }
</style>
