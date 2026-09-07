<script lang="ts">
  import type { Snippet } from 'svelte';
  import type { LabelTone } from './types';
  import Label from './Label.svelte';
    import type { ClassValue } from 'svelte/elements';

  interface Props {
    label?: string;
    /** Active reads as the panel's own heading rather than a category word. */
    labelTone?: LabelTone;
    title?: string;
    /** What the section's own control currently says. */
    reading?: string;
    /** Lit while an upgrade that would change this whole panel is hovered. */
    highlighted?: boolean;
    /** The content is someone else's grid columns, not this section's own —
     * horizontal padding moves to `.head` so the body can subgrid cleanly. */
    subgrid?: boolean;
    className?: ClassValue;
    aside?: Snippet;
    children?: Snippet;
  }

  let { label, labelTone = 'inactive', title, reading, highlighted = false, subgrid = false, className, aside, children }: Props = $props();
</script>

<section class={['section', className, { lit: highlighted, subgrid }]}>
  <div class="head">
    <div class="titles">
      {#if label}
        <Label text={label} tone={labelTone} />
      {/if}
      {#if title}
        <h2>{title}</h2>
      {/if}
      {#if reading}
        <span class="reading">{reading}</span>
      {/if}
    </div>
    {#if aside}
      <div class="aside">{@render aside()}</div>
    {/if}
  </div>
  {@render children?.()}
</section>

<style>
  .section {
    display: flex;
    flex-direction: column;
    gap: var(--sp-2);
    padding: var(--sp-4);
    min-width: 0;
  }

  /* Same tint the rows use — hovering an upgrade that changes the whole panel
     says so the way one that changes a single row does. */
  .section.lit {
    background-color: var(--surface-alt);
  }

  /* Padding on a subgridded axis fights the inherited column tracks — see
     karma-clicker's OverviewScreen for the ledger this aligns to. */
  .section.subgrid {
    display: grid;
    grid-template-columns: subgrid;
    grid-column: 1 / -1;
    padding-inline: 0;
  }

  .section.subgrid > .head {
    grid-column: 1 / -1;
    padding-inline: var(--sp-4);
  }

  .head {
    display: flex;
    align-items: baseline;
    justify-content: space-between;
    gap: var(--sp-4);
    padding-bottom: var(--sp-2);
    border-bottom: var(--rule-row);
    min-width: 0;
  }

  .titles {
    display: flex;
    align-items: baseline;
    gap: var(--sp-3);
    min-width: 0;
  }

  h2 {
    margin: 0;
    font-size: var(--fs-lg);
    font-weight: 600;
    letter-spacing: -.01em;
    color: var(--ink-900);
  }

  /* Sentence case on purpose: the label's uppercase is worn by a word that holds
     still. A reading substitutes itself, and a heading that rewrites its own text
     and width on every drag reads as chrome misbehaving. */
  .reading {
    font-size: var(--fs-base);
    font-weight: 600;
    color: var(--ink-900);
    line-height: 1;
  }

  .aside {
    font-size: var(--fs-sm);
    line-height: 1;
    color: var(--ink-500);
    text-align: right;
  }
</style>
