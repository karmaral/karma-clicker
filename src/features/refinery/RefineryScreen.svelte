<script lang="ts">
  import { progression } from '$lib/progression';
  import RevealStub from '../RevealStub.svelte';
  import TokenTable from './TokenTable.svelte';
</script>

<div class="refinery view-layout">
  <div>
    <RevealStub name="refinery.intake" note="what goes in" />
    <RevealStub name="refinery.rate" note="how fast it clears" height="48px" />
    <RevealStub name="refinery.side" note="what comes out the side" />
  </div>

  <div>
    <RevealStub name="refinery.split" note="how intake is divided" />
    <RevealStub name="refinery.backlog" note="what is waiting" />

    {#if progression.isRevealed('refinery.grades')}
      <TokenTable />
    {/if}
  </div>
</div>

<style>
</style>
