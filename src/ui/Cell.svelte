<script lang="ts">
  import type { Snippet } from 'svelte';
  import Label from './Label.svelte';
  import type { LabelSize, LabelTone } from './types';

  interface Props {
    label: string;
    /** Qualifies the label in place, for a section named after what it currently reads. */
    labelNote?: string;
    labelSize?: LabelSize;
    labelTone?: LabelTone;
    caption?: string;
    gap?: string;
    banded?: boolean;
    /**
     * A mark on the label itself, tight against it — for something the section
     * is carrying rather than something it reads. Beside the label and not out
     * at the end of the row, where `labelNote` already lives.
     */
    mark?: Snippet;
    header?: Snippet;
    children?: Snippet;
    /** Drawn directly under the figures it is a picture of. */
    graphic?: Snippet;
    /** Pinned to the bottom of the cell, so every foot in a band sits on one line. */
    foot?: Snippet;
  }

  let {
    label,
    labelNote,
    labelSize = 'default',
    labelTone = 'inactive',
    caption,
    gap = 'var(--sp-3)',
    banded = false,
    mark,
    header,
    children,
    graphic,
    foot,
  }: Props = $props();
</script>

<div class={['cell', { banded }]}>
  <div class="labelrow">
    <span class="labels">
      <Label text={label} size={labelSize} tone={labelTone} />
      {#if mark}
        <span class="mark">{@render mark()}</span>
      {/if}
      {#if labelNote}
        <span class="divider" aria-hidden="true"></span>
        <Label 
          text={labelNote} 
          size={labelSize} 
          muted 
          classValue={'note'}
        />
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
    {#if graphic}
      <div class="graphic">{@render graphic()}</div>
    {/if}
    {#if caption}
      <span class="caption">{caption}</span>
    {/if}
    {#if foot}
      <div class="foot">{@render foot()}</div>
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

  /* Pulled back off the label's own gap: the mark belongs *to* the label, and at
     the row's spacing it read as a third item in the line. */
  .mark {
    display: flex;
    align-items: center;
    flex: none;
    margin-left: calc(var(--sp-3) * -1 + var(--sp-2));
  }

  /* A mark with nothing to say gives its pull back — a `mark` snippet that
     renders nothing must not still be tightening the row it is not in. */
  .mark:empty {
    display: none;
  }

  .divider {
    flex: none;
    width: 1px;
    height: .9em;
    background: var(--ink-200);
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

  .graphic {
    margin-top: var(--sp-1);
    min-width: 0;
  }

  .caption {
    font-size: var(--fs-xs);
    color: var(--ink-300);
  }

  .foot {
    margin-top: auto;
    padding-top: var(--sp-3);
    padding-bottom: 11px;
    font-size: var(--fs-xs);
    color: var(--ink-300);
    font-variant-numeric: tabular-nums;
  }
</style>
