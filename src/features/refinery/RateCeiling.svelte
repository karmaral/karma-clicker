<script lang="ts">
  /**
   * Backlog, read as pressure rather than as a quantity: what arrives against
   * what the refinery can clear. Over the ceiling and the piles grow — the bar
   * is the only place that difference is visible before it shows up as excess.
   *
   * Two things can cap it now, and they are different problems. The ceiling is
   * bought and answers to slots and levels; the mix is aimed and answers to
   * nothing but the dial. A tilted fleet starves a refinery that has capacity to
   * spare, so the idle span is drawn rather than folded into the overflow.
   */
  import { Section } from '$ui';
  import { BuildingManager } from '$lib/managers';
  import { refinery } from '$lib/refinery.svelte';
  import { spotlight } from '$lib/spotlight.svelte';
  import { f } from '$lib/utils';

  const ceiling = $derived(refinery.clearedPerSecond);

  const income = $derived(BuildingManager.countKarmaPerSecondByPolarity());
  const arriving = $derived(income.positive + income.negative);

  /** It only ever moves pairs, so the weaker stream decides what it can reach. */
  const pairable = $derived(Math.min(income.positive, income.negative) * 2);

  const cleared = $derived(Math.min(ceiling, pairable));
  const idle = $derived(Math.max(0, ceiling - cleared));
  const overflow = $derived(Math.max(0, arriving - cleared));

  const isStarved = $derived(idle > 0);

  /** The bar is scaled to whichever rate is greater, so neither can run off it. */
  const scale = $derived(Math.max(ceiling, arriving));

  const share = (amount: number) => (scale > 0 ? `${(amount / scale) * 100}%` : '0%');
</script>

<Section label="Rate against ceiling" highlighted={spotlight.isLit('refinery')}>
  {#snippet aside()}
    {f(refinery.workers)} souls staffing it · {f(refinery.slots)} slots
  {/snippet}

  <div class="bar">
    <span class="cleared" style:width={share(cleared)}></span>
    <span class="idle" style:width={share(idle)}></span>
    <span class="overflow" style:width={share(overflow)}></span>
  </div>

  <div class="captions">
    <span class="caption">
      <strong>{f(cleared)} karma/s paired</strong>
      {#if isStarved}
        — your mix caps it, {f(idle)}/s of the ceiling idle
      {:else}
        — the ceiling
      {/if}
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
    height: 8px;
    background: var(--line-100);
    min-width: 0;
  }

  .cleared {
    background: var(--ink-900);
    border-right: var(--rule-strong);
  }

  /* Capacity the mix will not let it use — bought, and going to waste. */
  .idle {
    background: var(--ink-300);
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
