<script lang="ts">
  import type { Snippet } from 'svelte';
  import Label from './Label.svelte';
  import type { LabelSize } from './types';

  interface Props {
    label: string;
    /** Qualifies the label in place, for a section named after what it currently reads. */
    labelNote?: string;
    labelSize?: LabelSize;
    caption?: string;
    gap?: string;
    banded?: boolean;
    header?: Snippet;
    children?: Snippet;
  }

  let {
    label,
    labelNote,
    labelSize = 'default',
    caption,
    gap = 'var(--sp-3)',
    banded = false,
    header,
    children,
  }: Props = $props();
</script>

<div class={['cell', { banded }]}>
  <div class="labelrow">
    <span class="labels">
      <Label text={label} size={labelSize} />
      {#if labelNote}
        <Label text={labelNote} size={labelSize} muted />
      {/if}
    </span>
    {#if header}
      <div class="header">{@render header()}</div>
    {/if}
  </div>
  <div class="content">
    <div class="values" style:gap>
      {@render children?.()}
    </div>
    {#if caption}
      <span class="caption">{caption}</span>
    {/if}
  </div>
</div>

<style>
  .cell {
    display: flex;
    flex-direction: column;
    gap: var(--sp-1);
  }

  .cell.banded {
    display: grid;
    grid-template-rows: subgrid;
    grid-row: span 2;
    row-gap: var(--sp-2);
  }

  .labelrow {
    display: grid;
    grid-template-columns: minmax(0, 1fr);
    align-items: start;
    min-width: 0;
  }

  .labelrow > :global(*) {
    grid-area: 1 / 1;
  }

  .labels {
    display: flex;
    align-items: baseline;
    gap: var(--sp-3);
    min-width: 0;
  }

  .header {
    min-width: 0;
  }

  .content {
    display: flex;
    flex-direction: column;
    gap: var(--sp-2);
    min-width: 0;
  }

  .values {
    display: flex;
    align-items: center;
  }

  .caption {
    font-size: var(--fs-xs);
    color: var(--ink-300);
  }
</style>
