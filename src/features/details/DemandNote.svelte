<script lang="ts">
  /**
   * What a world wants and what it lifts off you for it — one line, inline, so
   * it drops into whatever caption holds it. The rate is badged on the pile it
   * drains, and negative: it leaves you. Nothing for a world that wants nothing.
   */
  import { Badge } from '$ui';
  import { getDemandLabel } from '$lib/labels';
  import { f } from '$lib/utils';
  import type Planet from '$lib/planets/base.svelte';
  import { badgeFor } from './badge';

  interface Props {
    planet: Planet;
    /**
     * Its own row, the want pinned left and the take right — and the rate in a
     * fixed slot, since a changing figure on a right edge shoves the line.
     */
    isSpread?: boolean;
  }

  let { planet, isSpread = false }: Props = $props();

  const wants = $derived(getDemandLabel(planet.demand));
  const pullPercent = $derived(Math.round(planet.pullShare * 100));
</script>

{#if wants}
  <span class={['demand', { spread: isSpread }]}>
    <span>Wants {wants}{isSpread ? '' : ' · '}</span>
    <span>
      <span class="num">{pullPercent}%</span> a phase ·
      <span class={['rate', { fixed: isSpread }]}>
        {#if planet.pulledPole}<span class="badge"><Badge kind={badgeFor(planet.pulledPole)} /></span>{/if}
        <span><span class="num">−{f(planet.pullPerSecond)}</span>/s</span>
      </span>
    </span>
  </span>
{/if}

<style>
  .demand.spread {
    display: flex;
    justify-content: space-between;
    align-items: baseline;
    font-size: var(--fs-sm);
    color: var(--ink-500);
  }

  .rate {
    display: inline-flex;
    align-items: baseline;
    gap: var(--badge-gap);
  }

  /* Packed right, the slack before the badge. Room for "−999,999/s" — an
     estimate; past a million the figure goes short again. */
  .rate.fixed {
    justify-content: flex-end;
    min-width: 10ch;
    margin-left: var(--sp-1);
  }

  /* Two centres a pixel apart, and the badge answers to both: the digits beside
     it and the lowercase line it sits in. Centred on either, it reads off
     against the other — so it splits them: on the digits, then half a pixel down. */
  .badge {
    display: flex;
    align-self: center;
    translate: 0 .5px;
  }

  .num {
    color: var(--ink-900);
    font-weight: 600;
  }
</style>
