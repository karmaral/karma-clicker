<script lang="ts">
  /** One band of the axis. The stat line is the band's, not the row's. */
  import { Section } from '$ui';
  import planetTexts from '$data/planets-texts';

  interface Props {
    label: string;
    ids: string[];
    selected: string;
    stat: (id: string) => string;
    empty?: string;
    onpick: (id: string) => void;
  }

  let { label, ids, selected, stat, empty, onpick }: Props = $props();
</script>

<Section {label}>
  {#if ids.length}
    <ul class="planets">
      {#each ids as id (id)}
        <li>
          <button
            type="button"
            class={['planet', { selected: id === selected }]}
            onclick={() => onpick(id)}
          >
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
    justify-content: space-between;
    gap: var(--sp-4);
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

  .stat {
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
