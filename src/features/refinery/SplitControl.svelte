<script lang="ts">
  /**
   * One job's share of the souls. Close-up draws the anchoring one and the
   * refinery draws the refining one, which is why it stays here rather than
   * moving to either — the same lever, named by the job that consumes it.
   *
   * The detents come from the harness: coarse at first, so the allocation is a
   * decision with a cost and not a number to nudge into place. What overshoots
   * the slots is idle, and the aside says so — that overshoot is what the
   * granularity upgrades buy back.
   */
  import { SliderBar, Section } from '$ui';
  import { BuildingManager } from '$lib/managers';
  import { reserve, type SplitJob } from '$lib/reserve.svelte';
  import { harness } from '$lib/harness.svelte';
  import { refinery } from '$lib/refinery.svelte';
  import { f } from '$lib/utils';

  interface Props {
    job: SplitJob;
  }

  let { job }: Props = $props();

  const isAnchoring = $derived(job === 'anchoring');

  const souls = $derived(BuildingManager.countSouls());
  const incarnating = $derived(souls - BuildingManager.countReserved());

  const held = $derived(
    isAnchoring ? BuildingManager.countAnchoring() : BuildingManager.countRefining(),
  );

  /**
   * Employed, and the rest. A held soul does one job, and only as many are held
   * to a job as there are slots to hold them — so the surplus is what the
   * allocation is overspending, and the bar needs to say so or it has no optimum.
   */
  const working = $derived(isAnchoring ? harness.workers : refinery.workers);
  const idle = $derived(Math.max(0, held - working));

  const label = $derived(isAnchoring ? 'Anchoring split' : 'Refining split');
</script>

<Section {label}>
  {#snippet aside()}
    {f(held)} held{#if working} · {f(working)} working{/if}{#if idle} · {f(idle)} idle{/if} ·
    {f(incarnating)} incarnating
  {/snippet}

  <!-- Filled from this job's end: with two levers, the fill is the share you set
       rather than the remainder someone else left. -->
  <SliderBar
    value={reserve.shareOf(job)}
    ceiling={reserve.ceilingFor(job)}
    step={harness.step}
    {label}
    onchange={(share) => reserve.set(job, share)}
  />
</Section>
