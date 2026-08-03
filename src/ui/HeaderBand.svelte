<script lang="ts">
  import type { Snippet } from 'svelte';

  interface Props {
    columns?: string;
    children?: Snippet;
  }

  let { columns, children }: Props = $props();
</script>

<div class="band" style:grid-template-columns={columns}>
  {@render children?.()}
</div>

<style>
  .band {
    display: grid;
    grid-auto-flow: column;
    grid-auto-columns: minmax(0, 1fr);
    grid-template-rows: auto 1fr;
    border-bottom: var(--rule-strong);
  }

  .band > :global(*) {
    padding: var(--sp-3) var(--sp-4);
    min-width: 0;
  }

  .band > :global(* + *) {
    border-left: var(--rule-row);
  }
</style>
