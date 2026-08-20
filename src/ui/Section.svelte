<script lang="ts">
  import type { Snippet } from 'svelte';
  import Label from './Label.svelte';

  interface Props {
    label?: string;
    title?: string;
    /** What the section's own control currently says. */
    reading?: string;
    aside?: Snippet;
    children?: Snippet;
  }

  let { label, title, reading, aside, children }: Props = $props();
</script>

<section class="section">
  <div class="head">
    <div class="titles">
      {#if label}
        <Label text={label} />
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
    gap: var(--sp-3);
    padding: var(--sp-4);
    min-width: 0;
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
    color: var(--ink-500);
    text-align: right;
  }
</style>
