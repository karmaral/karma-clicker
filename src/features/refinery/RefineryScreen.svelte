<script lang="ts">
  import { progression } from '$lib/progression';
  import RefiningStatus from './RefiningStatus.svelte';
  import IntakeBar from './IntakeBar.svelte';
  import RateCeiling from './RateCeiling.svelte';
  import SplitControl from './SplitControl.svelte';
  import TokenTable from './TokenTable.svelte';
</script>

{#if progression.isRevealed('refinery.screen')}
  <div class="refinery view-layout">
    <div class="engine">
      <RefiningStatus />
      <IntakeBar />
      <RateCeiling />
    </div>

    <div class="grades">
      <TokenTable />
      <SplitControl />
    </div>
  </div>
{/if}

<style>
  .engine {
    display: flex;
    flex-direction: column;
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
