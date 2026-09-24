<script lang="ts">
  /** The selected world, whichever band it sits in. Its verb comes with it. */
  import { Section } from '$ui';
  import { PlanetManager } from '$lib/managers';
  import { progression } from '$lib/progression';
  import { f } from '$lib/utils';
  import { getAgesLabel, getPhaseLabel } from '$lib/labels';
  import { DEFAULT_VISUAL, PlanetView } from '$widgets/planet';
  import planetVisuals from '$data/planet-visuals';
  import planetTexts from '$data/planets-texts';
  import { HarvestVerb } from '$features/harvest';
  import AheadRequirements from './AheadRequirements.svelte';
  import ReachVerb from './ReachVerb.svelte';
  import DemandNote from '../details/DemandNote.svelte';

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
  const PORTRAIT_PX = 220;
  /** Planet scale, in px per world unit — fixed, so a taller box shows more room, not a bigger world. */
  const PORTRAIT_ZOOM = 75;

  /** The box spans the column, so rings run out to its edges instead of the canvas's. */
  let portraitWidth = $state(0);

  const visual = $derived(planetVisuals[id] ?? DEFAULT_VISUAL);

  const planet = $derived(PlanetManager.getPlanet(id));
  const name = $derived(planetTexts[id]?.title ?? id);
  const description = $derived(planetTexts[id]?.description ?? '');

  const isHere = $derived(id === PlanetManager.selected);
  const isAhead = $derived(!isHere && Boolean(planet) && !planet.isHarvested);

  /** Nothing for a world ahead: it has lived no ages yet. */
  const status = $derived.by(() => {
    if (!planet || isAhead) return '';

    if (planet.isHarvested) {
      return `${f(planet.merged)} merged`;
    }

    return `${getAgesLabel(planet.agesLived)} · ${getPhaseLabel(planet.phase, planet.phasesPerAge)}`;
  });
</script>

<!-- No aside: the world's readings sit under its portrait, where the column
     has room for them. -->
{#if planet}
  <Section label={name} labelTone="active">

    <div class="portrait" bind:clientWidth={portraitWidth}>
      {#if portraitWidth > 0}
        <PlanetView
          {visual}
          widthPx={portraitWidth}
          heightPx={PORTRAIT_PX}
          frame={PORTRAIT_PX / PORTRAIT_ZOOM}
          backgroundToken="--surface"
          clockKey={id}
        />
      {/if}
    </div>

    {#if description}
      <p class="description">{description}</p>
    {/if}

    <!-- Only the world you are on pulls, so only it says what it wants. -->
    {#if status || isHere}
      <div class="stats">
        {#if status}<p>{status}</p>{/if}
        {#if isHere}<p><DemandNote {planet} /></p>{/if}
      </div>
    {/if}

    {#if progression.isRevealed('overview.ahead') && isAhead}
        <AheadRequirements {planet} />
    {/if}

    <div class="action">
      <HarvestVerb {id} />

      {#if progression.isRevealed('overview.ahead') && isAhead}
        <ReachVerb {id} />
      {/if}
    </div>

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
    min-width: 0;
  }

  .description {
    margin: 0;
    font-size: var(--fs-sm);
    color: var(--ink-500);
  }
  .stats {
    display: flex;
    flex-direction: column;
    gap: var(--sp-1);
    font-size: var(--fs-sm);
    color: var(--ink-500);
  }

  .stats p {
    margin: 0;
  }

  /* A world that wants nothing renders an empty line; it gives its gap back. */
  .stats p:empty {
    display: none;
  }

  .action {
    margin-top: auto;
  }
</style>
