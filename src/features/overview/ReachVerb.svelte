<script lang="ts">
  /** Under the planet portrait, for a world you have not yet reached. */
  import { Button } from '$ui';
  import { PlanetManager } from '$lib/managers';
  import { progression } from '$lib/progression';
  import { nav } from '$lib/nav.svelte';
  import planetTexts from '$data/planets-texts';

  interface Props {
    id: string;
  }

  let { id }: Props = $props();

  const planet = $derived(PlanetManager.getPlanet(id));
  const name = $derived(planetTexts[id]?.title ?? id);
  const activeName = $derived(planetTexts[PlanetManager.selected]?.title ?? '—');

  const isAhead = $derived(id !== PlanetManager.selected && Boolean(planet) && !planet.isHarvested);

  function onreach() {
    PlanetManager.reach(id);
    nav.to('details');
  }
</script>

{#if progression.isRevealed('overview.ahead') && isAhead}
  <Button
    variant="outline"
    label="Reach {name}"
    sub={PlanetManager.canReach ? 'Ready' : `Harvest ${activeName} first`}
    disabled={!progression.isLive('overview.ahead') || !PlanetManager.canReach}
    onclick={onreach}
  />
{/if}
