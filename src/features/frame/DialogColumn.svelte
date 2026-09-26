<script lang="ts">
  /** One labelled, scrolling column of a `Dialog`. */
  import type { Snippet } from 'svelte';
  import { Label } from '$ui';

  interface Props {
    label: string;
    note?: string;
    children: Snippet;
  }

  let { label, note, children }: Props = $props();
</script>

<section class="column">
  <div class="col-head">
    <Label text={label} />
    {#if note}
      <span class="note">{note}</span>
    {/if}
  </div>
  <div class="rows">
    {@render children()}
  </div>
</section>

<style>
  .column {
    display: flex;
    flex-direction: column;
    min-width: 0;
    min-height: 0;
    padding: var(--sp-4);
  }

  .column:not(:first-child) {
    border-left: var(--rule-row);
  }

  .col-head {
    display: flex;
    align-items: baseline;
    gap: var(--sp-3);
    padding-bottom: var(--sp-2);
    border-bottom: var(--rule-section);
    min-width: 0;
  }

  .note {
    font-size: var(--fs-sm);
    color: var(--ink-500);
  }

  .rows {
    display: flex;
    flex-direction: column;
    overflow-y: auto;
    margin-top: var(--sp-2);
  }

  /* The rows' shared empty line. */
  .rows :global(.empty) {
    padding: var(--sp-3) 0;
    font-size: var(--fs-sm);
    color: var(--ink-300);
  }
</style>
