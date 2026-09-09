<script lang="ts">
  import type { Snippet } from "svelte";

  interface Props {
    title?: string;
    description?: string;
    contentElem?: HTMLElement;
    children?: Snippet;
    /** One line, no chrome, no title/description — the dial's word, not a panel. */
    hint?: boolean;
  }

  let {
    title,
    description,
    contentElem = $bindable(),
    children,
    hint = false,
  }: Props = $props();
</script>

<div class={['tooltip', { hint }]} bind:this={contentElem}>
  {#if children}
    {@render children()}
  {:else}
    {#if title}
      <div class="title">{title}</div>
    {/if}
    {#if description}
      <div class="description">{description}</div>
    {/if}
  {/if}
</div>

<style>
  .tooltip {
    display: none;
    padding: var(--sp-3);
    background: var(--surface);
    border: 1px solid var(--ink-900);
    border-radius: var(--radius);
    width: var(--tooltip-width, auto);
    max-width: var(--tooltip-max, 320px);
    /* box-shadow: 0 4px 4px rgba(0, 0, 0, 0.15); */
    box-shadow: 0 8px 24px rgba(0,0,0,.10);
  }

  .tooltip.hint {
    padding: var(--sp-1) var(--sp-2);
    max-width: none;
    white-space: nowrap;
    box-shadow: none;
    font-size: var(--fs-sm);
    color: var(--ink-900);
  }

  :global(.tippy-content) .tooltip {
    display: block;
  }

  /* No tippy.css in this project — the box has no chrome of its own, so the
     arrow has to draw its own border+fill to match `.tooltip`'s. A square
     rotated 45deg, half hidden behind the box: the content div paints after
     the arrow in tippy's own DOM order, so it covers the near half and only
     the outward-facing corner — matching border, matching fill — shows. Only
     rendered when a consumer opts in with `arrow: true`; otherwise tippy
     never creates the element. */
  :global(.tippy-arrow) {
    position: absolute;
    width: 10px;
    height: 10px;
  }

  :global(.tippy-arrow::before) {
    content: '';
    position: absolute;
    inset: 0;
    background: var(--surface);
    border: 1px solid var(--ink-900);
    transform: rotate(45deg);
  }

  /* Popper's arrow modifier centers on the reference/popper overlap, applied
     as an inline `transform: translate()` (not `left`) — on a cornered
     placement with a wide reference that lands wherever the overlap happens
     to be, nowhere near the corner the box was aligned to. Cancelling the
     transform and setting the offset ourselves pins it there instead; both
     need `!important` because they're fighting that inline style.

     Keyed to the corner the placement names, not to the axis: `-end` aligns
     the box's *right* edge to the reference, so an arrow pinned left points
     out into open air. A plain `bottom`/`top` is centred on the reference
     already and keeps popper's own placement. */
  :global([data-placement^='bottom'] > .tippy-arrow) {
    top: -5px;
  }

  :global([data-placement='bottom-start'] > .tippy-arrow),
  :global([data-placement='top-start'] > .tippy-arrow) {
    left: var(--sp-3) !important;
    transform: none !important;
  }

  :global([data-placement='bottom-end'] > .tippy-arrow),
  :global([data-placement='top-end'] > .tippy-arrow) {
    left: auto !important;
    right: var(--sp-3);
    transform: none !important;
  }

  /* The hidden half's border would still show through as a stray edge at
     the seam if the box's own paint doesn't land pixel-perfect on top of
     it — dropped outright so the visible corner reads as a clean
     continuation of the box's own top border rather than a shape sitting
     next to it. */
  :global([data-placement^='bottom'] > .tippy-arrow::before) {
    border-right: none;
    border-bottom: none;
  }

  :global([data-placement^='top'] > .tippy-arrow) {
    bottom: -5px;
  }

  :global([data-placement^='top'] > .tippy-arrow::before) {
    border-left: none;
    border-top: none;
  }

  /* Same pinning as `left`, mirrored: a `-start` box is aligned to the
     reference's top corner, so the arrow belongs at the box's own top and not
     wherever the overlap with a tall row happens to fall. */
  :global([data-placement^='right'] > .tippy-arrow) {
    left: -5px;
    top: var(--sp-3) !important;
    transform: none !important;
  }

  :global([data-placement^='right'] > .tippy-arrow::before) {
    border-right: none;
    border-top: none;
  }

  :global([data-placement^='left'] > .tippy-arrow) {
    right: -5px;
    top: var(--sp-3) !important;
    transform: none !important;
  }

  :global([data-placement^='left'] > .tippy-arrow::before) {
    border-left: none;
    border-bottom: none;
  }

  .title {
    font-weight: 600;
    font-size: var(--fs-sm);
    margin-bottom: var(--sp-2);
    color: var(--ink-900);
  }

  .description {
    font-size: var(--fs-sm);
    line-height: 1.4;
    color: var(--ink-600);
  }
</style>
