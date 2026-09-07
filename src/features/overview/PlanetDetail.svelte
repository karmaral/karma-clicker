<script lang="ts">
  /** The selected world, whichever band it sits in. Its verb comes with it. */
  import { Section } from '$ui';
  import { PlanetManager } from '$lib/managers';
  import { progression } from '$lib/progression';
  import { f } from '$lib/utils';
  import { DEFAULT_VISUAL, PlanetView } from '$widgets/planet';
  import planetVisuals from '$data/planet-visuals';
  import planetTexts from '$data/planets-texts';
  import { HarvestVerb } from '$features/harvest';
  import AheadRequirements from './AheadRequirements.svelte';
  import ReachVerb from './ReachVerb.svelte';

  interface Props {
    id: string;
  }

  let { id }: Props = $props();

  /**
   * The one live world in the Overview, and the only WebGL context it holds. A
   * portrait, not a stage: it turns, and nothing stands beside it or answers a
   * click — incarnating is the detail screen's verb, and the buttons below are
   * this column's. Exactly one of them ever shows: you harvest the world you
   * are on and reach the ones you are not.
   */
  const PORTRAIT_PX = 180;
  const PORTRAIT_FRAME = 2.4;

  const visual = $derived(planetVisuals[id] ?? DEFAULT_VISUAL);

  const planet = $derived(PlanetManager.getPlanet(id));
  const name = $derived(planetTexts[id]?.title ?? id);
  const description = $derived(planetTexts[id]?.description ?? '');

  const isHere = $derived(id === PlanetManager.selected);
  const isAhead = $derived(!isHere && Boolean(planet) && !planet.isHarvested);

  function getStatus() {
    if (!planet) return '';

    if (planet.isHarvested) {
      return `${f(planet.merged)} merged`;
    }

    return `${f(planet.agesLived)} ages · phase ${planet.phase + 1} of ${planet.phasesPerAge}`;
  }
</script>

{#if planet}
  <Section label={name} labelTone="active">
    {#snippet aside()}
      {getStatus()}
    {/snippet}

    <div class="portrait">
      <PlanetView
        {visual}
        widthPx={PORTRAIT_PX}
        frame={PORTRAIT_FRAME}
        backgroundToken="--surface"
        clockKey={id}
      />
    </div>

    {#if description}
      <p class="description">{description}</p>
    {/if}

    <HarvestVerb {id} />

    {#if progression.isRevealed('overview.ahead') && isAhead}
      <ReachVerb {id} />

      <AheadRequirements {planet} />
    {/if}
  </Section>
{:else}
  <Section label="Active">
    <p class="description">No active planet.</p>
  </Section>
{/if}

<style>
  .portrait {
    display: flex;
    justify-content: center;
  }

  .description {
    margin: 0;
    font-size: var(--fs-sm);
    color: var(--ink-500);
  }
</style>
