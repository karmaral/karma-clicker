<script lang="ts">
  import type { Snippet } from 'svelte';
  import type { RevealState } from '$lib/progression';
    import type { ClassValue } from 'svelte/elements';

  interface Props {
    state: RevealState;
    active?: boolean;
    /** The screen still exists but has nothing to open — Detail with no planet. */
    disabled?: boolean;
    classValue?: ClassValue;
    onselect?: () => void;
    children?: Snippet;
  }

  let { state, active = false, disabled = false, classValue, onselect, children }: Props = $props();

  const clickable = $derived(state === 'live' && !active && !disabled);
</script>

<!-- The rule at the top of the cell is the whole tab affordance: 3px says you are
     here, a hairline says you could be, a dash says there is nothing behind it.
     The figures below stay full black in all three — an inactive section is a
     live reading, not a disabled control. -->
<div class={['nav-section', { active, disabled }, classValue ]}>
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
    min-width: 0;
    position: relative;
  }

  .nav-section::before {
    content: "";
    position: absolute;
    left: 0;
    right: 0;
    top: 0;
    height: 1px;
    background-color: var(--line-200);
  }

  .nav-section.active::before {
    height: 3px;
    background-color: var(--ink-900);
  }

  .nav-section.disabled::before {
    height: 0;
    background-color: transparent;
    border-top: 1px dashed var(--ink-200);
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
    min-width: 0;
  }
</style>
