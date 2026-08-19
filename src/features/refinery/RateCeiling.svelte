<script lang="ts">
  /**
   * Backlog, read as pressure rather than as a quantity: what arrives against
   * what the refinery can clear. Over the ceiling and the piles grow — the bar
   * is the only place that difference is visible before it shows up as excess.
   */
  import { Section } from '$ui';
  import { BuildingManager } from '$lib/managers';
  import { refinery } from '$lib/refinery.svelte';
  import { f } from '$lib/utils';

  const cleared = $derived(refinery.clearedPerSecond);
  const arriving = $derived(BuildingManager.countKarmaPerSecond());

  const overflow = $derived(Math.max(0, arriving - cleared));

  /** The bar is scaled to whichever rate is greater, so neither can run off it. */
  const scale = $derived(Math.max(cleared, arriving));

  const share = (amount: number) => (scale > 0 ? `${(amount / scale) * 100}%` : '0%');
</script>

<Section label="Rate against ceiling">
  {#snippet aside()}
    {f(refinery.workers)} souls staffing it · {f(refinery.slots)} slots
  {/snippet}

  <div class="bar">
    <span class="cleared" style:width={share(cleared)}></span>
    <span class="overflow" style:width={share(overflow)}></span>
  </div>

  <div class="captions">
    <span class="caption">
      <strong>{f(cleared)} karma/s cleared</strong> — the ceiling
    </span>
    <span class="caption right">
      <strong>{f(arriving)} karma/s arriving</strong>
      {#if overflow > 0}
        — {f(overflow)}/s of it becomes backlog
      {:else}
        — the refinery keeps up
      {/if}
    </span>
  </div>
</Section>

<style>
  .bar {
    display: flex;
    height: 44px;
    background: var(--line-100);
    min-width: 0;
  }

  .cleared {
    background: var(--ink-900);
    border-right: var(--rule-strong);
  }

  .overflow {
    background: var(--res-red);
  }

  .captions {
    display: flex;
    justify-content: space-between;
    gap: var(--sp-4);
    min-width: 0;
  }

  .caption {
    font-size: var(--fs-sm);
    color: var(--ink-500);
  }

  .caption strong {
    font-weight: 600;
    color: var(--ink-900);
  }

  .caption.right {
    text-align: right;
  }
</style>
