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
    align-items: center;
    gap: var(--sp-3);
    flex: 1;
    min-width: 0;
  }

  .viewport {
    position: relative;
    flex: 1;
    min-width: 0;
  }

  .chips {
    display: flex;
    gap: var(--sp-2);
    overflow-x: auto;
    overscroll-behavior-x: contain;
    scrollbar-width: none;
    user-select: none;
  }

  .chips::-webkit-scrollbar {
    display: none;
  }

  .fade {
    position: absolute;
    inset: 0 0 0 auto;
    width: 90px;
    background: linear-gradient(to right, transparent, var(--surface));
    pointer-events: none;
  }

  .escape {
    flex: none;
    background: none;
    border: none;
    padding: 0 0 2px;
    font-size: var(--fs-sm);
    font-weight: 600;
    color: var(--ink-900);
    border-bottom: 1px solid var(--ink-900);
    cursor: pointer;
    white-space: nowrap;
  }

  .escape:hover {
    color: var(--ink-500);
    border-bottom-color: var(--ink-500);
  }
</style>
