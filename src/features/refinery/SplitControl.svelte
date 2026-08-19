<script lang="ts">
  /**
   * The soul allocation, set from the side that consumes it. The same lever
   * belongs on Close-up, where the souls are; this is the first thing to write
   * `reserve` outside the dev panel.
   */
  import { SliderBar, Section } from '$ui';
  import { BuildingManager } from '$lib/managers';
  import { reserve } from '$lib/reserve.svelte';
  import { f } from '$lib/utils';

  const reserved = $derived(BuildingManager.countReserved());
  const incarnating = $derived(BuildingManager.countSouls() - reserved);
</script>

<Section label="Soul allocation">
  {#snippet aside()}
    {f(incarnating)} incarnating · {f(reserved)} clearing
  {/snippet}

  <!-- Filled from the incarnating end, so the bar reads left to right with the aside. -->
  <SliderBar
    value={1 - reserve.fraction}
    label="Soul allocation"
    onchange={(share) => reserve.set(1 - share)}
  />
</Section>
