<script lang="ts">
  import { Label, Section, Tabs } from '$ui';
  import type Building from '$lib/buildings/base.svelte';
  import CohortRow from './CohortRow.svelte';

  interface Props {
    title?: string;
    cohorts: Building[];
    affordable?: (id: string) => boolean;
    buyModes?: readonly string[];
    buyMode?: string;
    showAim?: boolean;
    note?: string;
    onbuymode?: (mode: string) => void;
    onaim?: (id: string, value: number) => void;
    onbuy?: (id: string) => void;
  }

  let {
    title,
    cohorts,
    affordable,
    buyModes = ['1', '10', '100', 'Max'],
    buyMode = '1',
    showAim = true,
    note,
    onbuymode,
    onaim,
    onbuy,
  }: Props = $props();

  // const columns = $derived(
  //   showAim
  //     ? 'minmax(0, 1fr) 160px 100px 30px 120px'
  //     : 'minmax(0, 1fr) 54px 96px 160px 96px',
  // );
  const columns = 'minmax(0, 1fr) 54px 96px 160px 96px';
</script>

<Section label="Incarnations" {title}>
  {#snippet aside()}
    <Tabs tabs={buyModes} active={buyMode} size="sm" onselect={onbuymode} />
  {/snippet}

  <div class="table" style:--cohort-cols={columns}>
    <div class="head">
      <span><Label text="Cohort · level" size="sm" /></span>

      <span class="count"><Label text="Count" size="sm" /></span>

      <!-- {#if showAim}
        <span><Label text="Aim" size="sm" /></span>
      {/if} -->

      <span class="count"><Label text="Return time" size="sm" /></span>
      
      <span class="right"><Label text="Yield" size="sm" /></span>
      <span class="right"><Label text="Cost" size="sm" /></span>
    </div>

    {#each cohorts as cohort (cohort.id)}
      <CohortRow
        {cohort}
        {showAim}
        affordable={affordable?.(cohort.id)}
        onaim={(v) => onaim?.(cohort.id, v)}
        onbuy={() => onbuy?.(cohort.id)}
      />
    {/each}
  </div>

  {#if note}
    <p class="note">{note}</p>
  {/if}
</Section>

<style>
  .table {
    display: flex;
    flex-direction: column;
    min-width: 0;
  }

  .head {
    display: grid;
    grid-template-columns: var(--cohort-cols);
    column-gap: var(--sp-3);
    align-items: end;
    padding-bottom: var(--sp-1);
    border-bottom: var(--rule-row);
    min-width: 0;
  }

  .head > span {
    display: flex;
    line-height: 1;
  }

  .head .right {
    justify-content: flex-end;
  }

  .note {
    margin: 0;
    font-size: var(--fs-sm);
    color: var(--ink-300);
  }
</style>
