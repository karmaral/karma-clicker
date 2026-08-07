<script lang="ts">
  import type { Snippet } from 'svelte';
  import type { RevealState } from '$lib/progression';

  interface Props {
    state: RevealState;
    active?: boolean;
    onselect?: () => void;
    children?: Snippet;
  }

  let { state, active = false, onselect, children }: Props = $props();

  const clickable = $derived(state === 'live' && !active);
</script>

<div class={['nav-section', { active }]}>
  {#if clickable}
    <button type="button" onclick={onselect}>
      {@render children?.()}
    </button>
  {:else}
    {@render children?.()}
  {/if}
</div>

<style>
  .nav-section {
    display: grid;
    grid-template-rows: subgrid;
    grid-row: span 2;
    border-bottom: var(--rule-card);
    min-width: 0;
  }

  .nav-section.active {
    border-bottom: var(--rule-strong);
  }

  button {
    display: grid;
    grid-template-rows: subgrid;
    grid-row: span 2;
    background: none;
    border: none;
    padding: 0;
    font: inherit;
    color: inherit;
    text-align: left;
    cursor: pointer;
    min-width: 0;
  }
</style>
