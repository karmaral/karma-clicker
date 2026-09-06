<script lang="ts">
  import type { Snippet } from 'svelte';

  interface Props {
    children?: Snippet;
  }

  let { children }: Props = $props();
</script>

<div class="rail">
  <div class="track">
    {@render children?.()}
  </div>
</div>

<style>
  /* The grid item itself: sized by the grid, and by nothing inside it — `.track`
     is absolute, so `.rail` contributes no intrinsic height of its own. Without
     that split a long queue would stretch the row (and every screen sharing it)
     to its own height instead of scrolling inside the one the grid already gave
     it. */
  .rail {
    position: relative;
    min-width: 0;
  }

  .track {
    position: absolute;
    inset: 0;
    display: flex;
    flex-direction: column;
    gap: var(--sp-4);
    padding: calc(var(--sp-1) + var(--sp-4)) var(--sp-4) var(--sp-4);
    border-left: var(--rule-card);
  }

  .track > :global(* + *) {
    border-top: var(--rule-row);
    padding-top: var(--sp-4);
  }
</style>
