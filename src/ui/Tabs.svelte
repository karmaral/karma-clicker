<script lang="ts">
  import type { TabsSize } from './types';

  interface Props {
    tabs: readonly string[];
    active: string;
    size?: TabsSize;
    /**
     * Off makes the strip a read-out of where you are rather than four targets.
     * Its only caller so far is a cell that is itself the button, and a button
     * cannot contain one — this keeps the look here rather than restating it.
     */
    interactive?: boolean;
    onselect?: (tab: string) => void;
  }

  let {
    tabs,
    active,
    size = 'default',
    interactive = true,
    onselect,
  }: Props = $props();
</script>

<nav class={['tabs', size, { static: !interactive }]}>
  {#each tabs as tab (tab)}
    {#if interactive}
      <button
        type="button"
        class={['tab', { active: tab === active }]}
        onclick={() => onselect?.(tab)}
      >
        {tab}
      </button>
    {:else}
      <span class={['tab', { active: tab === active }]}>{tab}</span>
    {/if}
  {/each}
</nav>

<style>
  .tabs {
    display: flex;
    gap: var(--sp-4);
    flex: none;
  }

  .tabs.sm {
    gap: var(--sp-3);
  }

  .tab {
    display: inline-block;
    background: none;
    border: none;
    padding: 0 0 var(--sp-1);
    font-size: var(--fs-base);
    letter-spacing: var(--ls-label-sm);
    text-transform: uppercase;
    font-weight: 600;
    color: var(--ink-200);
    border-bottom: 2px solid transparent;
    transition: color var(--t-fast);
  }

  .tabs.sm .tab {
    font-size: var(--fs-xs);
    letter-spacing: .08em;
    padding-bottom: 1px;
    color: var(--ink-300);
  }

  .tab:hover {
    color: var(--ink-500);
  }

  /* Invisible to the pointer, so a hover reads as one cell and a click reaches
     whatever wraps the strip. */
  .tabs.static .tab {
    pointer-events: none;
  }

  .tab.active {
    color: var(--ink-900);
    border-bottom-color: var(--ink-900);
  }
</style>
