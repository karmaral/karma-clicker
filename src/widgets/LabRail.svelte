<script lang="ts">
  import type { Snippet } from 'svelte';

  interface Props {
    side: 'left' | 'right';
    children: Snippet;
  }

  let { side, children }: Props = $props();
</script>

<!--
  One side of the page, holding however many panels that side carries. The rail
  owns the fixed position so a panel does not, which is what lets a third lab
  exist without the second moving.

  It is also the box an *open* panel fills. The rail carries the width for that
  reason — a column sized by its content would collapse the moment the only
  thing in flow was a row of minimised title bars.
-->
<div class={['rail', side]}>
  {@render children()}
</div>

<style>
  .rail {
    position: fixed;
    top: var(--sp-3);
    bottom: var(--sp-3);
    width: 20rem;
    z-index: 40;
    display: flex;
    flex-direction: column;
    gap: var(--sp-2);
    /* The column is as tall as the page whatever it holds, so it must not
       swallow clicks in the space its panels do not occupy. */
    pointer-events: none;
  }

  .rail > :global(*) {
    pointer-events: auto;
  }

  /* Minimised panels are their title bar's own width, so each side keeps them
     against the page's edge rather than trailing across the rail. */
  .left {
    left: var(--sp-3);
    align-items: flex-start;
  }

  .right {
    right: var(--sp-3);
    align-items: flex-end;
  }
</style>
