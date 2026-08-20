<script lang="ts">
  /** One band of the axis. The stat line is the band's, not the row's. */
  import type { Snippet } from 'svelte';
  import { Section } from '$ui';
  import { DEFAULT_VISUAL, PlanetStill } from '$widgets/planet';
  import planetVisuals from '$data/planet-visuals';
  import planetTexts from '$data/planets-texts';

  interface Props {
    label: string;
    ids: string[];
    selected: string;
    /** The row's right cell as text. Bands with more to say pass `rowAside`. */
    stat?: (id: string) => string;
    rowAside?: Snippet<[string]>;
    /** The band's own figure, in the header beside the label. */
    aside?: Snippet;
    empty?: string;
    /** Size is what distinguishes the bands; the framing is shared. */
    stillPx: number;
    onpick: (id: string) => void;
    ondblclick?: () => void;
  }

  let { label, ids, selected, stat, rowAside, aside, empty, stillPx, onpick, ondblclick }: Props = $props();

  /** A still, not a view: a row's world does not move, so it costs no WebGL context. */
  const ROW_FRAME = 2.2;
</script>

<Section {label} {aside}>
  {#if ids.length}
    <ul class="planets">
      {#each ids as id (id)}
        <li>
          <button
            type="button"
            class={['planet', { selected: id === selected }]}
            onclick={() => onpick(id)}
            {ondblclick}
          >
            <PlanetStill
              visual={planetVisuals[id] ?? DEFAULT_VISUAL}
              widthPx={stillPx}
              frame={ROW_FRAME}
            />
            <span class="name">{planetTexts[id]?.title ?? id}</span>
            {#if rowAside}
              <span class="trailing">{@render rowAside(id)}</span>
            {:else if stat}
              <span class="stat num">{stat(id)}</span>
            {/if}
          </button>
        </li>
      {/each}
    </ul>
  {:else if empty}
    <p class="empty">{empty}</p>
  {/if}
</Section>

<style>
  .planets {
    display: flex;
    flex-direction: column;
    margin: 0;
    padding: 0;
    list-style: none;
  }

  /* A picture has no baseline to sit on, so a row centres rather than aligns. */
  .planet {
    display: flex;
    align-items: center;
    gap: var(--sp-3);
    width: 100%;
    padding: var(--sp-3) var(--sp-2);
    background: none;
    border: none;
    border-bottom: var(--rule-row);
    cursor: pointer;
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

  /* Auto rather than space-between: the row gained a third child. */
  .stat,
  .trailing {
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
