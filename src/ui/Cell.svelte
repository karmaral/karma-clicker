<script lang="ts">
  import type { Snippet } from 'svelte';
  import type { HTMLAttributes } from 'svelte/elements';
  import Label from './Label.svelte';
  import type { LabelSize, LabelTone } from './types';

  /** Rest props land on the root, so a consumer can hang an attachment — a
      tooltip — on the whole cell. A banded cell is a subgrid child of the band,
      so it cannot be wrapped to get a hover target. */
  interface Props extends HTMLAttributes<HTMLDivElement> {
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
    ...rest
  }: Props = $props();
</script>

<div class={['cell', { banded }]} {...rest}>
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
    row-gap: var(--sp-1);
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
     the row's spacing it read as a third item in the line.

     Centred rather than baseline-aligned: the pip is a box twice the label's
     height, so on the baseline it dragged the whole row's baseline down with it
     and the label jumped by a pixel or two whenever the pip was absent. Out of
     the baseline group, the label sits where it sits either way.

     Centred on the label's own box rather than on the row: the row reserves the
     pip's full height whether or not there is a pip, so centring on it would
     hang the pip below a label that only fills the top of it. */
  .mark {
    display: flex;
    align-items: center;
    align-self: start;
    margin-top: calc((var(--fs-label) - 15px) / 2);
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

  /* Cells in a band share one row, and their figures are not the same size —
     tokens read at `lg` where karma reads at `xl`. Centred in that row, each
     cell sat on a baseline of its own height and the captions under them
     scattered. Pinned to the bottom, every figure in the band sits on one
     baseline and every caption on one rail. */
  .cell.banded .content {
    justify-content: end;
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
