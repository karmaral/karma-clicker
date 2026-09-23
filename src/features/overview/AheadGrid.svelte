<script lang="ts">
  /** Destinations, not a list: what each asks of you lives in the detail panel. */
  import { DEFAULT_VISUAL, PlanetStill } from '$widgets/planet';
  import { spotlight } from '$lib/spotlight.svelte';
  import planetVisuals from '$data/planet-visuals';
  import planetTexts from '$data/planets-texts';

  interface Props {
    ids: string[];
    selected: string;
    empty?: string;
    stillPx: number;
    onpick: (id: string) => void;
  }

  let { ids, selected, empty, stillPx, onpick }: Props = $props();

  const CELL_FRAME = 2.2;
</script>

{#if ids.length}
  <ul class="grid">
    {#each ids as id (id)}
      <li>
        <button
          type="button"
          class={['cell', { selected: id === selected, lit: spotlight.isLit('planet', id) }]}
          onclick={() => onpick(id)}
        >
          <PlanetStill visual={planetVisuals[id] ?? DEFAULT_VISUAL} widthPx={stillPx} frame={CELL_FRAME} />
          <span class="name">{planetTexts[id]?.title ?? id}</span>
        </button>
      </li>
    {/each}
  </ul>
{:else if empty}
  <p class="empty">{empty}</p>
{/if}

<style>
  /* Flex rather than grid: cells pack from the left and wrap as a row fills,
     so one planet and a dozen both end up flush against the same edge. */
  /* Tiles edge to edge on a lattice of the same pitch, so the cells a row
     leaves empty still read as slots. Inner lines only: each sits on a tile's
     right and bottom, and the last row's bottom is pulled under the clip. */
  .grid {
    --cell: 6rem;

    display: flex;
    flex-wrap: wrap;
    margin: 0 0 -1px;
    padding: 0;
    list-style: none;
    background-image:
      linear-gradient(to left, var(--line-100) 1px, transparent 1px),
      linear-gradient(to top, var(--line-100) 1px, transparent 1px);
    background-size: var(--cell) var(--cell);
  }

  /* Its own lines too, so a tinted tile keeps its edges. */
  .cell {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: var(--sp-2);
    width: var(--cell);
    height: var(--cell);
    padding: var(--sp-2);
    background: none;
    border: none;
    box-shadow: inset -1px -1px var(--line-100);
    text-align: center;
  }

  .cell.selected,
  .cell.lit {
    background: var(--surface-alt);
  }

  .name {
    font-size: var(--fs-sm);
    font-weight: 600;
    color: var(--ink-900);
  }

  .empty {
    margin: 0;
    padding: var(--sp-3) var(--sp-2);
    font-size: var(--fs-sm);
    color: var(--ink-300);
  }
</style>
