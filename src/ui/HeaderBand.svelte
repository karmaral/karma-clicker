<script lang="ts">
  import type { Snippet } from 'svelte';

  interface Props {
    columns?: string;
    /** Off when the sections carry their own rules as tab affordance. */
    rule?: boolean;
    /** For a header that is a reading only — no tab rule below to leave room for. */
    compact?: boolean;
    children?: Snippet;
  }

  let { columns, rule = true, compact = false, children }: Props = $props();
</script>

<div class={['band', { rule, compact }]} style:grid-template-columns={columns}>
  {@render children?.()}
</div>

<style>
  .band {
    display: grid;
    grid-auto-flow: column;
    grid-auto-columns: minmax(0, 1fr);
    grid-template-rows: auto 1fr;
    padding: 14px 14px 0;
    min-height: 95px;
  }

  .band.compact {
    padding: var(--sp-3) var(--sp-3);
    min-height: 64px;
  }

  .band.rule {
    border-bottom: var(--rule-strong);
  }

  .band > :global(*) {
    padding: 10px 22px 4px;
    min-width: 0;
  }

  .band.compact > :global(*) {
    padding: 0 22px;
  }

  .band > :global(* + *) {
    border-left: var(--rule-row);
  }
</style>
