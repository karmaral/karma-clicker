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
