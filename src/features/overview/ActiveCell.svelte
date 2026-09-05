<script lang="ts">
  /** The one world you are on — shaped like a Behind row, spanning its still
   * and name columns so the two line up. */
  import { DEFAULT_VISUAL, PlanetStill } from '$widgets/planet';
  import { spotlight } from '$lib/spotlight.svelte';
  import planetVisuals from '$data/planet-visuals';
  import planetTexts from '$data/planets-texts';

  interface Props {
    id: string;
    selected: string;
    stat?: (id: string) => string;
    empty?: string;
    stillPx: number;
    onpick: (id: string) => void;
    ondblclick?: () => void;
  }

  let { id, selected, stat, empty, stillPx, onpick, ondblclick }: Props = $props();

  const CELL_FRAME = 2.2;
</script>

{#if id}
  <button
    type="button"
    class={['cell', { selected: id === selected, lit: spotlight.isLit('planet', id) }]}
    onclick={() => onpick(id)}
    {ondblclick}
  >
    <PlanetStill visual={planetVisuals[id] ?? DEFAULT_VISUAL} widthPx={stillPx} frame={CELL_FRAME} />
    <span class="name">{planetTexts[id]?.title ?? id}</span>
    {#if stat}
      <span class="stat num">{stat(id)}</span>
    {/if}
  </button>
{:else if empty}
  <p class="empty">{empty}</p>
{/if}

<style>
  .cell {
    display: flex;
    align-items: center;
    gap: var(--sp-3);
    width: 100%;
    padding: var(--sp-3) var(--sp-2);
    background: none;
    border: none;
    text-align: left;
  }

  .cell.selected,
  .cell.lit {
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

  .empty {
    margin: 0;
    padding: var(--sp-3) var(--sp-2);
    font-size: var(--fs-sm);
    color: var(--ink-300);
  }
</style>
