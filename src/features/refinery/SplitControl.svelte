<script lang="ts">
  /**
   * The soul allocation, set from the side that consumes it. Both Close-up and
   * the refinery draw it, which is why it stays here rather than moving to
   * either — one lever, named by whatever the reserved souls are doing.
   *
   * The detents come from the harness: coarse at first, so the allocation is a
   * decision with a cost and not a number to nudge into place.
   */
  import { SliderBar, Section } from '$ui';
  import { BuildingManager } from '$lib/managers';
  import { reserve } from '$lib/reserve.svelte';
  import { harness } from '$lib/harness.svelte';
  import { refinery } from '$lib/refinery.svelte';
  import { f } from '$lib/utils';

  const souls = $derived(BuildingManager.countSouls());
  const reserved = $derived(BuildingManager.countReserved());
  const incarnating = $derived(souls - reserved);

  /**
   * Employed, and the rest. A held soul does one job, and only as many are held
   * to a job as there are slots to hold them — so the surplus is what the
   * allocation is overspending, and the bar needs to say so or it has no optimum.
   */
  const working = $derived(harness.workers + refinery.workers);
  const idle = $derived(Math.max(0, reserved - working));

  /**
   * Named for the phase rather than for the majority: while a world is going
   * down that is what the allocation is about, and the refinery has a panel of
   * its own to say what it got.
   */
  const job = $derived(harness.isPlacing ? 'anchoring' : 'clearing');
</script>

<Section label="Soul allocation">
  {#snippet aside()}
    {f(incarnating)} out{#if working} · {f(working)} {job}{/if}{#if idle} · {f(idle)} idle{/if}
  {/snippet}

  <!-- Filled from the incarnating end, so the bar reads left to right with the aside. -->
  <SliderBar
    value={1 - reserve.fraction}
    step={harness.step}
    label="Soul allocation"
    onchange={(share) => reserve.set(1 - share)}
  />
</Section>
