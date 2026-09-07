<script lang="ts">
  /** Under the planet on Details and on Overview alike — one world, one door in. */
  import { Button } from '$ui';
  import { PlanetManager } from '$lib/managers';
  import { progression } from '$lib/progression';
  import { getFirstHarvestConditionLabel } from '$lib/labels';
  import { nav } from '$lib/nav.svelte';
  import planetTexts from '$data/planets-texts';

  interface Props {
    id: string;
  }

  let { id }: Props = $props();

  const planet = $derived(PlanetManager.getPlanet(id));
  const name = $derived(planetTexts[id]?.title ?? id);

  /** Only the world you are on can be harvested; the rest are places to go. */
  const isOffered = $derived(id === PlanetManager.selected && Boolean(planet) && !planet.isHarvested);

  const blockers = $derived(
    (planet?.unmetFirstHarvestConditions ?? []).map((condition) =>
      getFirstHarvestConditionLabel(condition, planet?.data.firstHarvest[condition] ?? 0),
    ),
  );
</script>

{#if progression.isRevealed('overview.firstHarvest') && isOffered}
  <Button
    label="Harvest {name}"
    sub={blockers.length ? `Needs ${blockers.join(' · ')}` : 'Ready'}
    disabled={!progression.isLive('overview.firstHarvest') || !planet.isFirstHarvestReady}
    onclick={() => nav.openHarvest()}
  />
{/if}
