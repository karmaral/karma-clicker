<script lang="ts">
  import type { Snippet } from 'svelte';

  interface Props {
    children?: Snippet;
  }

  let { children }: Props = $props();
</script>

<div class="rail">
  {@render children?.()}
</div>

<style>
  .rail {
    display: flex;
    align-items: center;
    gap: var(--sp-4);
    padding: var(--sp-3) var(--sp-4);
    border-bottom: var(--rule-card);
    min-width: 0;
    min-height: 75px;
  }

  .rail > :global(* + *) {
    border-left: var(--rule-row);
    padding-left: var(--sp-4);
  }
</style>
