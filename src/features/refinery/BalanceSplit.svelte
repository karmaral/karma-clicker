<script lang="ts">
  /**
   * The refinery's second split — see `docs/design.md` §21, *The balancer*. Of
   * the souls the refining split staffs, how many carry karma from the long
   * pile to the short one instead of drawing. A balancing soul is not drawing,
   * so balance now is crimson later.
   *
   * It stops at the band around this world's gate; the dial finishes. The
   * caption says which, so a balancer sitting still reads as done, not broken.
   */
  import { SliderBar, Section } from '$ui';
  import { refinery } from '$lib/refinery.svelte';
  import { f, formatRate } from '$lib/utils';

  const isMoving = $derived(refinery.balancedPerSecond > 0);
</script>

{#if refinery.isBalancerUnlocked}
  <Section label="Balancing split">
    {#snippet aside()}
      {f(refinery.balancers)} balancing · {f(refinery.drawers)} drawing
    {/snippet}

    <SliderBar
      value={refinery.balancing}
      ceiling={1}
      step={refinery.step}
      label="Balancing split"
      onchange={(share) => refinery.setBalancing(share)}
    />

    <p class="caption">
      {#if isMoving}
        carrying {formatRate(refinery.balancedPerSecond)} karma/s to the lighter pile
      {:else if refinery.balancers > 0 && refinery.band > 0}
        within {f(refinery.band * 100)}% — the dial finishes
      {:else if refinery.balancers > 0}
        the piles are even
      {:else}
        no souls balancing
      {/if}
    </p>
  </Section>
{/if}

<style>
  .caption {
    margin: 0;
    font-size: var(--fs-sm);
    color: var(--ink-500);
  }
</style>
