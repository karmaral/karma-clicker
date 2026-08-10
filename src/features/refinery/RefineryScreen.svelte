<script lang="ts">
  import RevealStub from '../RevealStub.svelte';
</script>

<div class="refinery">
  <RevealStub name="refinery.status" note="what the refinery is doing" height="48px" />
  <RevealStub name="refinery.intake" note="what goes in" />
  <RevealStub name="refinery.backlog" note="what is waiting" />
  <RevealStub name="refinery.rate" note="how fast it clears" height="48px" />
  <RevealStub name="refinery.grades" note="the three grades" />
  <RevealStub name="refinery.side" note="what comes out the side" />
  <RevealStub name="refinery.split" note="how intake is divided" />
</div>

<style>
  .refinery {
    display: flex;
    flex-direction: column;
    gap: var(--sp-4);
    padding: var(--sp-5) var(--sp-4);
    min-width: 0;
  }
</style>
