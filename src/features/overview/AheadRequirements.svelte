<script lang="ts">
  /** What an unreached world asks of you, and what it leaves you with. */
  import { FIRST_HARVEST_CONDITIONS, getFirstHarvestConditionLabel, getMergeTollLabel, getBoonLabel } from '$lib/labels';
  import type Planet from '$lib/planets/base.svelte';

  interface Props {
    planet: Planet;
  }

  let { planet }: Props = $props();

  const asks = $derived(
    FIRST_HARVEST_CONDITIONS
      .filter((condition) => planet.data.firstHarvest[condition] !== undefined)
      .map((condition) => getFirstHarvestConditionLabel(condition, planet.data.firstHarvest[condition] ?? 0)),
  );

  const boons = $derived(planet.data.boons ?? []);
</script>

<dl class="requirements">

  <div class="row">
    <dt>Anchors</dt>
    <dd>
      <span class="strong">{planet.anchorsAsked || '—'}</span>
    </dd>
  </div>

  <div class="row">
    <dt>Harvest requirements</dt>
    <dd>
      {#each asks as ask, i (i)}
        <span class="strong">{ask}</span>
      {:else}
        <span class="none">nothing</span>
      {/each}
    </dd>
  </div>

  <div class="row">
    <dt>Merge toll</dt>
    <dd>
      <span class="strong">{planet.mergeMinimum ? getMergeTollLabel(planet.mergeMinimum) : '—'}</span>
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

<style>
  .requirements {
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
    flex-wrap: wrap;
    flex-direction: column;
    align-items: end;
    justify-content: center;
    gap: var(--sp-1) var(--sp-3);
    margin: 0;
    text-align: right;
  }

  .strong {
    font-size: var(--fs-sm);
    font-weight: 600;
    color: var(--ink-900);
  }

  .none {
    font-size: var(--fs-sm);
    color: var(--ink-300);
  }
</style>
