<script lang="ts">
  import { progression } from '$lib/progression';
  import RefiningStatus from './RefiningStatus.svelte';
  import IntakeBar from './IntakeBar.svelte';
  import RateCeiling from './RateCeiling.svelte';
  import SplitControl from './SplitControl.svelte';
  import TokenTable from './TokenTable.svelte';
</script>

<div class="refinery view-layout">
  <div class="engine">
    {#if progression.isRevealed('refinery.status')}
      <RefiningStatus />
    {/if}
  </div>

  <div class="grades">
    {#if progression.isRevealed('refinery.intake')}
      <IntakeBar />
    {/if}

    {#if progression.isRevealed('refinery.backlog')}
      <RateCeiling />
    {/if}

    {#if progression.isRevealed('refinery.split')}
      <SplitControl />
    {/if}

    {#if progression.isRevealed('refinery.grades')}
      <TokenTable />
    {/if}
  </div>
</div>

<style>
  .engine {
    display: flex;
    flex-direction: column;
    gap: var(--sp-5);
    padding: 0 var(--sp-4);
    border-right: var(--rule-card);
    min-width: 0;
  }

  .grades {
    display: flex;
    flex-direction: column;
    min-width: 0;
  }
</style>
