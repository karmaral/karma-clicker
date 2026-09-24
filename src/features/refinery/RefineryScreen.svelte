<script lang="ts">
  import { progression } from '$lib/progression';
  import RefiningStatus from './RefiningStatus.svelte';
  import Draw from './Draw.svelte';
  import IntakeBar from './IntakeBar.svelte';
  import SplitControl from './SplitControl.svelte';
  import TokenTable from './TokenTable.svelte';
</script>

{#if progression.isRevealed('refinery.screen')}
  <div class="refinery view-layout">
    <!-- Refining and Draw are one argument in two steps — what it makes,
         then where it settles the weight — so they sit together. Intake is a
         *stock* rather than a rate, and the heaviest graphic on the screen, so it
         anchors the column's base instead of splitting the two rate panels. -->
    <div class="engine">
      <RefiningStatus />
      <Draw />
      <IntakeBar />
    </div>

    <div class="grades">
      <TokenTable />
      <SplitControl job="refining" />
    </div>
  </div>
{/if}

<style>
  .engine {
    display: flex;
    flex-direction: column;
    border-right: var(--rule-card);
    min-width: 0;
  }

  .grades {
    display: flex;
    flex-direction: column;
    min-width: 0;
  }
</style>
