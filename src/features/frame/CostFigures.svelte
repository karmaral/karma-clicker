<script lang="ts">
  /**
   * A price, drawn. Every figure keeps its badge at the badge's own gap, and the
   * figures stand apart at a wider one — without it a two-pile price runs
   * together into one number with two marks after it.
   *
   * An incurred price reads as a signed span of karma: `+60s` is a minute of
   * your income added to your piles, half to each pole, rather than taken away.
   */
  import { Badge } from '$ui';
  import { formatCost } from '$lib/utils';
  import { badgeFor } from '$features/details/badge';
  import { readCostFigures } from './cost';
  import type { ResourceType } from '$types';

  interface Props {
    entries: [ResourceType, number][];
    incurs?: number;
  }

  let { entries, incurs }: Props = $props();

  const figures = $derived(readCostFigures(entries));
</script>

{#each figures as [type, amount] (type)}
  <span class="cost">
    <span class="num">{formatCost(amount)}</span>
    <Badge kind={badgeFor(type)} />
  </span>
{/each}

{#if incurs}
  <span class="cost">
    <span class="num">+{incurs}s</span>
    <Badge kind={badgeFor('karma')} />
  </span>
{/if}

<style>
  .cost {
    display: inline-flex;
    align-items: center;
    gap: var(--badge-gap);
    white-space: nowrap;
  }
</style>
