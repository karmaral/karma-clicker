<script lang="ts">
  /**
   * The one verb about the run rather than about a world, so it is the one the
   * action bar keeps, on every screen. Outlined, never filled — distinct enough
   * to find, but it ends everything the planet verbs are for, so it must not
   * read as the next step.
   */
  import { progression } from '$lib/progression';
  import { nav } from '$lib/nav.svelte';
</script>

{#if progression.isRevealed('prestige.screen')}
  <button type="button" class="end-run" onclick={() => nav.openPrestige()}>
    End the run
  </button>
{/if}

<style>
  .end-run {
    background: var(--surface);
    border: 1px solid var(--ink-900);
    padding: 6px var(--sp-3);
    font-size: var(--fs-sm);
    font-weight: 600;
    line-height: 1.2;
    color: var(--ink-900);
    transition: background var(--t-fast), color var(--t-fast);
  }

  .end-run:hover {
    background: var(--ink-900);
    color: var(--ink-inverse);
  }
</style>
