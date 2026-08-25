<script lang="ts">
  /** What one finished world sends, and when the next batch lands. */
  import { Badge } from '$ui';
  import { f, formatClock } from '$lib/utils';
  import { badgeFor } from '../details/badge';
  import type Planet from '$lib/planets/base.svelte';
  import type { ResourceType } from '$types';

  interface Props {
    planet: Planet;
    /** Passed in, not owned: one clock for the band rather than one per world. */
    now: number;
  }

  let { planet, now }: Props = $props();

  const deliveries = $derived.by(() => {
    const yields = planet.harvestYields;

    return (Object.keys(yields) as ResourceType[])
      .map((type) => ({ type, amount: yields[type] ?? 0 }));
  });

  /** Blank rather than 00:00 on a world that pays once and has nothing pending. */
  const countdown = $derived.by(() => {
    const nextAt = planet.emitter?.nextAt ?? 0;
    if (!nextAt || !planet.harvestDuration) return '';

    return formatClock(nextAt - now);
  });
</script>

<span class="rates">
  {#each deliveries as delivery (delivery.type)}
    <span class="rate">
      <Badge kind={badgeFor(delivery.type)} />
      <span class="num">{f(delivery.amount)}/y</span>
    </span>
  {:else}
    <span class="none">nothing yet</span>
  {/each}
  {#if countdown}
    <span class="clock">{countdown}</span>
  {/if}
</span>

<style>
  .rates {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    justify-content: flex-end;
    gap: var(--sp-1) var(--sp-3);
  }

  .rate {
    display: flex;
    align-items: center;
    gap: var(--badge-gap);
    font-size: var(--fs-sm);
    color: var(--ink-900);
  }

  .clock {
    font-variant-numeric: tabular-nums;
    font-size: var(--fs-sm);
    color: var(--ink-500);
  }

  .none {
    font-size: var(--fs-sm);
    color: var(--ink-300);
  }
</style>
