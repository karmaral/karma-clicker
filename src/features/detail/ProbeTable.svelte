<script lang="ts">
  import { Label, Section, Tabs } from '$ui';
  import ProbeRow from './ProbeRow.svelte';
  import type { Probe } from './types';

  interface Props {
    title?: string;
    probes: Probe[];
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
    probes,
    buyModes = ['1', '10', '100', 'Max'],
    buyMode = '1',
    showAim = true,
    note,
    onbuymode,
    onaim,
    onbuy,
  }: Props = $props();

  const columns = $derived(
    showAim
      ? 'minmax(0, 1fr) 160px 100px 120px 30px'
      : 'minmax(0, 1fr) 100px 120px 30px',
  );
</script>

<Section label="Incarnations" {title}>
  {#snippet aside()}
    <Tabs tabs={buyModes} active={buyMode} size="sm" onselect={onbuymode} />
  {/snippet}

  <div class="table" style:--probe-cols={columns}>
    <div class="head">
      <span><Label text="Probe" size="sm" /></span>
      {#if showAim}
        <span><Label text="Aim" size="sm" /></span>
      {/if}
      <span class="right"><Label text="Output" size="sm" /></span>
      <span class="right"><Label text="Cost" size="sm" /></span>
      <span class="count"><Label text="N" size="sm" /></span>
    </div>

    {#each probes as probe (probe.id)}
      <ProbeRow
        {probe}
        {showAim}
        onaim={(v) => onaim?.(probe.id, v)}
        onbuy={() => onbuy?.(probe.id)}
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
    grid-template-columns: var(--probe-cols);
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

  .head .count,
  .head .right {
    justify-content: flex-end;
  }

  .note {
    margin: 0;
    font-size: var(--fs-sm);
    color: var(--ink-300);
  }
</style>
