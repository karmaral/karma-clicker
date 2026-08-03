<script lang="ts">
  import type { TabsSize } from './types';

  interface Props {
    tabs: readonly string[];
    active: string;
    size?: TabsSize;
    onselect?: (tab: string) => void;
  }

  let { 
    tabs,
    active,
    size = 'default',
    onselect,
  }: Props = $props();
</script>

<nav class={['tabs', size]}>
  {#each tabs as tab (tab)}
    <button
      type="button"
      class={['tab', { active: tab === active }]}
      onclick={() => onselect?.(tab)}
    >
      {tab}
    </button>
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
    background: none;
    border: none;
    padding: 0 0 var(--sp-1);
    font-size: var(--fs-base);
    letter-spacing: var(--ls-label-sm);
    text-transform: uppercase;
    font-weight: 600;
    color: var(--ink-200);
    border-bottom: 2px solid transparent;
    cursor: pointer;
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

  .tab.active {
    color: var(--ink-900);
    border-bottom-color: var(--ink-900);
  }
</style>
