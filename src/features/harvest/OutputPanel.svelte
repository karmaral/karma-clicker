<script lang="ts">
  /**
   * What leaving buys, in the three currencies it is paid in: a batch, a clock,
   * and what you keep. Every figure moves under the split — the cycle directly,
   * the yields only in that the alignment routes them — so the panel is a
   * readout on the drag and not a summary of the world.
   */
  import { Badge, Label } from '$ui';
  import { getFirstHarvestAlignment } from '$lib/excess';
  import { getBoonLabel } from '$lib/labels';
  import { resolveHarvestDuration, resolveHarvestYields } from '$lib/planets/harvest';
  import { badgeFor, byRateOrder } from '../details/badge';
  import { f, formatSpan } from '$lib/utils';
  import type Planet from '$lib/planets/base.svelte';
  import type { HarvestRates, ResourceType } from '$types';

  interface Props {
    planet: Planet;
    /** The share of the army the split would leave. The clock reads off it. */
    mergedShare: number;
    /** Income at departure. What one delivery is worth is a multiple of it. */
    rates: HarvestRates;
  }

  let { planet, mergedShare, rates }: Props = $props();

  const harvest = $derived(planet.data.harvest);

  const yields = $derived.by(() => {
    const paid = resolveHarvestYields(harvest?.yields ?? {}, getFirstHarvestAlignment(), rates);

    return (Object.keys(paid) as ResourceType[])
      .sort(byRateOrder)
      .map((type) => ({ type, amount: paid[type] ?? 0 }));
  });

  /**
   * The clock this world would keep once you have gone, at the split as it
   * stands. `~` because merged souls round per cohort and the figure moves under
   * the handle — an exact-looking span on a number still being dragged is a lie.
   */
  const cycle = $derived(
    harvest ? resolveHarvestDuration(harvest.duration, mergedShare, harvest) : 0,
  );

  const boons = $derived(planet.data.boons ?? []);
</script>

<div class="output">
  <Label text="Projected output" />

  <dl>
    <div class="row">
      <dt>Yields</dt>
      <dd>
        {#each yields as paid (paid.type)}
          <span class="paid">
            <Badge kind={badgeFor(paid.type)} />
            <span class="num">+{f(paid.amount)}</span>
          </span>
        {:else}
          <span class="none">nothing</span>
        {/each}
      </dd>
    </div>

    <div class="row">
      <dt>Harvest cycle</dt>
      <dd>
        {#if cycle}
          <span class="num strong">~{formatSpan(cycle)}</span>
        {:else}
          <span class="none">pays once</span>
        {/if}
      </dd>
    </div>

    <div class="row">
      <dt>First harvest boons</dt>
      <dd>
        {#each boons as boon, i (i)}
          <span class="strong">{getBoonLabel(boon)}</span>
        {:else}
          <span class="none">—</span>
        {/each}
      </dd>
    </div>
  </dl>
</div>

<style>
  .output {
    display: flex;
    flex-direction: column;
    gap: var(--sp-3);
    padding: var(--sp-3) var(--sp-4);
    background: var(--surface);
    border: var(--rule-card);
    min-width: 0;
  }

  dl {
    display: flex;
    flex-direction: column;
    gap: var(--sp-2);
    margin: 0;
  }

  .row {
    display: flex;
    align-items: baseline;
    justify-content: space-between;
    gap: var(--sp-4);
    min-width: 0;
  }

  dt {
    font-size: var(--fs-sm);
    color: var(--ink-500);
  }

  dd {
    display: flex;
    align-items: center;
    gap: var(--sp-3);
    margin: 0;
    font-size: var(--fs-sm);
    color: var(--ink-900);
    text-align: right;
  }

  .paid {
    display: flex;
    align-items: center;
    gap: var(--badge-gap);
  }

  /* The two rows with one figure each carry it at the weight the yields' badges
     carry theirs, so the column reads as three answers and not one list. */
  .strong {
    font-size: var(--fs-md);
    font-weight: 600;
  }

  .none { color: var(--ink-300); }
</style>
