<script lang="ts">
  /**
   * The one verb about the run rather than about a world, so it is the one the
   * action bar keeps. Quieter than the Overview's planet verbs on purpose — it
   * ends everything they are for, and must not read as the next step.
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
    background: none;
    border: none;
    padding: 0;
    font-size: var(--fs-sm);
    color: var(--ink-500);
    border-bottom: var(--rule-row);
    transition: color var(--t-fast);
  }

  .end-run:hover {
    color: var(--ink-900);
  }
</style>
