<script lang="ts">
  import { Label, Section, Tabs } from '$ui';
  import type Building from '$lib/buildings/base.svelte';
  import type { PurchaseMode } from './types';
  import CohortRow from './CohortRow.svelte';

  interface Props {
    title?: string;
    cohorts: Building[];
    purchaseModes?: readonly PurchaseMode[];
    purchaseMode?: PurchaseMode;
    showAim?: boolean;
    note?: string;
    onpurchasemode?: (mode: PurchaseMode) => void;
    onpurchase?: (id: string, quantity: number) => void;
  }

  let {
    title,
    cohorts,
    purchaseModes = ['1', '10', 'Next', 'Max'],
    purchaseMode = '1',
    showAim = true,
    note,
    onpurchasemode,
    onpurchase,
  }: Props = $props();

  const columns = $derived(
    showAim
      ? '20px minmax(0, 1fr) 130px 170px 96px'
      : '20px minmax(0, 1fr) 170px 96px',
  );
</script>

<Section label="Incarnations" {title}>
  <div class="table" style:--cohort-cols={columns}>

    <div class="head">
      <span class="count right"><Label text="N" size="sm" /></span>

      <span><Label text="Cohort · level" size="sm" /></span>

      {#if showAim}
        <span class="lean"><Label text="Lean" size="sm" /></span>
      {/if}

      <span class="output right"><Label text="Rate" size="sm" /></span>

      <span class="cost right">
        <Tabs tabs={purchaseModes} active={purchaseMode} size="sm" onselect={(m) => onpurchasemode?.(m as PurchaseMode)} />
        <Label text="Cost" size="sm" />
      </span>
    </div>

    {#each cohorts as cohort (cohort.id)}
      <CohortRow
        {cohort}
        {showAim}
        {purchaseMode}
        onpurchase={(quantity) => onpurchase?.(cohort.id, quantity)}
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
  .lean {
    justify-content: center;
  }

  .cost {
    flex-direction: column;
    align-items: flex-end;
    gap: var(--sp-1);
  }
  .cost :global(.tabs) {
    flex-wrap: wrap;
    justify-content: flex-end;
  }

  .note {
    margin: 0;
    font-size: var(--fs-sm);
    color: var(--ink-300);
  }
</style>
