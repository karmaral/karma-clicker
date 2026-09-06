<script lang="ts">
  import type { Snippet } from 'svelte';
  import { dragScroll } from './actions/dragScroll';

  interface Props {
    escape?: string;
    onescape?: () => void;
    children?: Snippet;
  }

  let { escape, onescape, children }: Props = $props();
</script>

<div class="queue">
  <div class="viewport">
    <div class="chips" use:dragScroll>
      {@render children?.()}
    </div>
    <span class="fade" aria-hidden="true"></span>
  </div>
  {#if escape}
    <button type="button" class="escape" onclick={onescape}>{escape}</button>
  {/if}
</div>

<style>
  .queue {
    display: flex;
    flex-direction: column;
    align-items: stretch;
    gap: var(--sp-3);
    flex: 1;
    min-height: 0;
  }

  .viewport {
    position: relative;
    flex: 1;
    min-height: 0;
  }

  .chips {
    display: flex;
    flex-direction: column;
    align-items: stretch;
    gap: var(--sp-2);
    height: 100%;
    overflow-y: auto;
    overscroll-behavior-y: contain;
    scrollbar-width: none;
    user-select: none;
  }

  .chips::-webkit-scrollbar {
    display: none;
  }

  .chips > :global(li) {
    align-self: stretch;
  }

  .chips :global(.chip) {
    width: 100%;
    justify-content: flex-start;
  }

  .chips :global(.name) {
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .fade {
    position: absolute;
    inset: auto 0 0 0;
    height: 60px;
    background: linear-gradient(to bottom, transparent, var(--surface));
    pointer-events: none;
  }

  .escape {
    flex: none;
    align-self: flex-end;
    background: none;
    border: none;
    padding: 0 0 2px;
    font-size: var(--fs-sm);
    font-weight: 600;
    color: var(--ink-900);
    border-bottom: 1px solid var(--ink-900);
    white-space: nowrap;
  }

  .escape:hover {
    color: var(--ink-500);
    border-bottom-color: var(--ink-500);
  }
</style>
