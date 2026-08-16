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
-->
<div class={['rail', side]}>
  {@render children()}
</div>

<style>
  .rail {
    position: fixed;
    top: var(--sp-3);
    bottom: var(--sp-3);
    z-index: 40;
    display: flex;
    flex-direction: column;
    align-items: stretch;
    gap: var(--sp-2);
    /* The column is as tall as the page whatever it holds, so it must not
       swallow clicks in the space its panels do not occupy. */
    pointer-events: none;
  }

  .rail > :global(*) {
    pointer-events: auto;
  }

  .left {
    left: var(--sp-3);
  }

  .right {
    right: var(--sp-3);
  }
</style>
