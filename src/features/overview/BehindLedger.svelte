<script lang="ts">
  /**
   * The resource ledger: every world behind you, each paying on its own clock.
   * Two readings — before `overview.harvest` reveals this is still the plain
   * list Behind has always been, `N merged` and nothing more.
   */
  import { Badge, Label, Section } from '$ui';
  import { PlanetManager } from '$lib/managers';
  import { sumHarvestRates } from '$lib/planets/harvest';
  import { f } from '$lib/utils';
  import { badgeFor } from '../details/badge';
  import { DEFAULT_VISUAL, PlanetStill } from '$widgets/planet';
  import planetVisuals from '$data/planet-visuals';
  import planetTexts from '$data/planets-texts';
  import BehindRow from './BehindRow.svelte';
    import { RateFigure } from '$features/details';

  const ROW_FRAME = 2.2;

  interface Props {
    ids: string[];
    selected: string;
    reporting: boolean;
    stillPx: number;
    onpick: (id: string) => void;
  }

  let { ids, selected, reporting, stillPx, onpick }: Props = $props();

  const TICK_MS = 1000;

  /** One clock for every row's countdown and sweep — not per world. */
  let now = $state(Date.now());

  $effect(() => {
    const handle = setInterval(() => (now = Date.now()), TICK_MS);

    return () => clearInterval(handle);
  });

  /** Batches do not add, so the band header reads per second. */
  const total = $derived(
    sumHarvestRates(
      ids.map((id) => {
        const planet = PlanetManager.getPlanet(id);

        return { yields: planet.harvestYields, duration: planet.harvestDuration };
      }),
    ),
  );

  function getMergedStat(id: string) {
    return `${f(PlanetManager.getPlanet(id).merged)} merged`;
  }
</script>

<Section subgrid label="Behind">
  {#if reporting}
    <ul class="ledger">
      {#each ids as id (id)}
        <BehindRow id={id} planet={PlanetManager.getPlanet(id)} {selected} {stillPx} {now} {onpick} />
      {/each}

      {#if total.length}
        <li class="foot">
          <span class="total-label"><Label text="Total" size="sm" muted /></span>
          <span class="deliveries">
            {#each total as rate (rate.type)}
              <span class="rate">
              <RateFigure type={rate.type} value={rate.perSecond} />
              </span>
            {/each}
          </span>
        </li>
      {/if}
    </ul>
  {:else}
    <ul class="planets">
      {#each ids as id (id)}
        <li>
          <button type="button" class={['planet', { selected: id === selected }]} onclick={() => onpick(id)}>
            <PlanetStill visual={planetVisuals[id] ?? DEFAULT_VISUAL} widthPx={stillPx} frame={ROW_FRAME} />
            <span class="name">{planetTexts[id]?.title ?? id}</span>
            <span class="stat num">{getMergedStat(id)}</span>
          </button>
        </li>
      {/each}
    </ul>
  {/if}
</Section>

<style>
  /* Shares OverviewScreen's here-row columns via subgrid, so Active/Ahead
     line up with the planet+name / time+yield halves below them. */
  .ledger {
    display: grid;
    grid-template-columns: subgrid;
    grid-column: 1 / -1;
    margin: 0;
    padding: 0;
    list-style: none;
  }

  /* The foot is the sum of the rows above it — same subgrid chain as a row,
     see `BehindRow`, but with nothing in the still/sweep/clock half. */
  .foot {
    display: grid;
    grid-column: 1 / -1;
    grid-template-columns: subgrid;
    align-items: center;
    column-gap: var(--sp-3);
    padding: var(--sp-2) var(--sp-2) 0;
  }

  .total-label {
    grid-column: 1;
  }

  .deliveries {
    grid-column: 2;
    display: flex;
    flex-wrap: wrap;
    justify-content: flex-start;
    align-items: center;
    gap: var(--sp-1) var(--sp-3);
  }

  .rate {
    display: flex;
    align-items: center;
    gap: var(--badge-gap);
    font-size: var(--fs-sm);
    color: var(--ink-900);
  }

  .planets {
    display: flex;
    flex-direction: column;
    margin: 0;
    padding: 0;
    list-style: none;
  }

  .planet {
    display: flex;
    align-items: center;
    gap: var(--sp-3);
    width: 100%;
    padding: var(--sp-3) var(--sp-2);
    background: none;
    border: none;
    border-bottom: var(--rule-row);
    text-align: left;
  }

  .planet.selected {
    background: var(--surface-alt);
  }

  .name {
    font-size: var(--fs-md);
    font-weight: 600;
    color: var(--ink-900);
  }

  .stat {
    margin-left: auto;
    font-size: var(--fs-sm);
    color: var(--ink-500);
    text-align: right;
  }
</style>
