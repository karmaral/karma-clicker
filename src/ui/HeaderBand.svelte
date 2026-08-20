<script lang="ts">
  import type { Snippet } from 'svelte';

  interface Props {
    columns?: string;
    /** Off when the sections carry their own rules as tab affordance. */
    rule?: boolean;
    children?: Snippet;
  }

  let { columns, rule = true, children }: Props = $props();
</script>

<div class={['band', { rule }]} style:grid-template-columns={columns}>
  {@render children?.()}
</div>

<style>
  .band {
    display: grid;
    grid-auto-flow: column;
    grid-auto-columns: minmax(0, 1fr);
    grid-template-rows: auto 1fr;
    padding: 14px 14px 0;
    /* Room for the split and the bars under it, so the frame does not resize
       on the beat that reveals them. */
    min-height: 176px;
  }

  .band.rule {
    border-bottom: var(--rule-strong);
  }

  .band > :global(*) {
    padding: 10px 22px 0;
    min-width: 0;
  }

  .band > :global(* + *) {
    border-left: var(--rule-row);
  }
</style>
