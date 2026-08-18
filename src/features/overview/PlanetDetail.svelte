<script lang="ts">
  /** The selected world, whichever band it sits in. Its verb comes with it. */
  import { Button, Section } from '$ui';
  import { PlanetManager } from '$lib/managers';
  import { progression } from '$lib/progression';
  import { getFirstHarvestConditionLabel } from '$lib/labels';
  import { f } from '$lib/utils';
  import planetTexts from '$data/planets-texts';

  interface Props {
    id: string;
    onharvest: () => void;
  }

  let { id, onharvest }: Props = $props();

  const planet = $derived(PlanetManager.getPlanet(id));
  const name = $derived(planetTexts[id]?.title ?? id);
  const description = $derived(planetTexts[id]?.description ?? '');
  const activeName = $derived(planetTexts[PlanetManager.selected]?.title ?? '—');

  const isHere = $derived(id === PlanetManager.selected);
  const isAhead = $derived(!isHere && Boolean(planet) && !planet.isHarvested);

  function getBandLabel() {
    if (isHere) {
      return 'Active';
    }

    if (isAhead) {
      return 'Ahead';
    }

    return 'Behind';
  }

  function getStatus() {
    if (!planet) return '';

    if (planet.isHarvested) {
      return `${f(planet.merged)} merged`;
    }

    return `${f(planet.agesLived)} ages · phase ${planet.phase + 1} of ${planet.phasesPerAge}`;
  }

  const blockers = $derived(
    (planet?.unmetFirstHarvestConditions ?? []).map((condition) =>
      getFirstHarvestConditionLabel(condition, planet?.data.firstHarvest[condition] ?? 0),
    ),
  );

  /** Only the world you are on can be harvested; the rest are places to go. */
  const isOffered = $derived(isHere && Boolean(planet) && !planet.isHarvested);
</script>

<Section label={getBandLabel()} title={name}>
  {#snippet aside()}
    {getStatus()}
  {/snippet}

  {#if description}
    <p class="description">{description}</p>
  {/if}

  {#if progression.isRevealed('overview.firstHarvest') && isOffered}
    <Button
      label="Harvest {name}"
      sub={blockers.length ? `Needs ${blockers.join(' · ')}` : 'Ready'}
      disabled={!progression.isLive('overview.firstHarvest') || !planet.isFirstHarvestReady}
      onclick={onharvest}
    />
  {/if}

  {#if progression.isRevealed('overview.ahead') && isAhead}
    <Button
      variant="outline"
      label="Reach {name}"
      sub={PlanetManager.canReach ? 'Ready' : `Harvest ${activeName} first`}
      disabled={!progression.isLive('overview.ahead') || !PlanetManager.canReach}
      onclick={() => PlanetManager.reach(id)}
    />
  {/if}
</Section>

<style>
  .description {
    margin: 0;
    font-size: var(--fs-sm);
    color: var(--ink-500);
  }
</style>
