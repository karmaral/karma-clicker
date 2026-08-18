<script lang="ts">
  /** One band of the axis. The stat line is the band's, not the row's. */
  import { Section } from '$ui';
  import { DEFAULT_VISUAL, PlanetStill } from '$widgets/planet';
  import planetVisuals from '$data/planet-visuals';
  import planetTexts from '$data/planets-texts';

  interface Props {
    label: string;
    ids: string[];
    selected: string;
    stat: (id: string) => string;
    empty?: string;
    /** Bands opt in one at a time — whether a world reads at this size is a design call. */
    pictures?: boolean;
    onpick: (id: string) => void;
  }

  let { label, ids, selected, stat, empty, pictures = false, onpick }: Props = $props();

  /** A still, not a view: a row's world does not move, so it costs no WebGL context. */
  const ROW_PX = 40;
  const ROW_FRAME = 2.2;
</script>

<Section {label}>
  {#if ids.length}
    <ul class="planets">
      {#each ids as id (id)}
        <li>
          <button
            type="button"
            class={['planet', { selected: id === selected, pictured: pictures }]}
            onclick={() => onpick(id)}
          >
            {#if pictures}
              <PlanetStill
                visual={planetVisuals[id] ?? DEFAULT_VISUAL}
                widthPx={ROW_PX}
                frame={ROW_FRAME}
              />
            {/if}
            <span class="name">{planetTexts[id]?.title ?? id}</span>
            <span class="stat num">{stat(id)}</span>
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

  .planet {
    display: flex;
    align-items: baseline;
    gap: var(--sp-4);
    width: 100%;
    padding: var(--sp-3) var(--sp-2);
    background: none;
    border: none;
    border-bottom: var(--rule-row);
    cursor: pointer;
    text-align: left;
  }

  /* A picture has no baseline to sit on, so a pictured row centres instead. */
  .planet.pictured {
    align-items: center;
    gap: var(--sp-3);
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
