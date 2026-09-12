<script lang="ts">
  /**
   * A price, drawn. Every figure keeps its badge at the badge's own gap, and the
   * figures stand apart at a wider one — without it a two-pile price runs
   * together into one number with two marks after it.
   */
  import { Badge } from '$ui';
  import { formatCost } from '$lib/utils';
  import { badgeFor } from '$features/details/badge';
  import { readCostFigures } from './cost';
  import type { ResourceType } from '$types';

  interface Props {
    entries: [ResourceType, number][];
  }

  let { entries }: Props = $props();

  const figures = $derived(readCostFigures(entries));
</script>

{#each figures as [type, amount] (type)}
  <span class="cost">
    <span class="num">{formatCost(amount)}</span>
    <Badge kind={badgeFor(type)} />
  </span>
{/each}

<style>
  .cost {
    display: inline-flex;
    align-items: center;
    gap: var(--badge-gap);
    white-space: nowrap;
  }
</style>
