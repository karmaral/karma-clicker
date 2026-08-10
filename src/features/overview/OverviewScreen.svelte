<script lang="ts">
  /** Layout awaits its design pass — the keys are held in reveal order until then. */
  import RevealStub from '../RevealStub.svelte';
  import HarvestSection from '../harvest/HarvestSection.svelte';
</script>

<div class="overview">
  <RevealStub name="overview.active" note="the planet you are on" />
  <RevealStub name="overview.ahead" note="unreached planets" />
  <RevealStub name="overview.behind" note="planets left for good" />
  <RevealStub name="overview.cameHome" note="arrivals from behind you" height="48px" />
  <RevealStub name="overview.harvest" note="needs an age lived and excess under 12%" height="48px" />
  <RevealStub name="overview.setOut" note="depart for the next planet" height="48px" />

  <HarvestSection />
</div>

<style>
  .overview {
    display: flex;
    flex-direction: column;
    gap: var(--sp-4);
    padding: var(--sp-5) var(--sp-4);
    min-width: 0;
  }
</style>
