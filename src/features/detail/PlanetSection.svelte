<script lang="ts">
  import { Section } from '$ui';
  import DensityWave from './DensityWave.svelte';
  import CycleStrip from './CycleStrip.svelte';
  import type { Phase } from './types';

  interface Props {
    name: string;
    status: string;
    phases: Phase[];
    current: number;
    position: number;
    flatten?: number;
    flattened?: string;
    note?: string;
  }

  let {
    name,
    status,
    phases,
    current,
    position,
    flatten = 0,
    flattened,
    note,
  }: Props = $props();
</script>

<Section label="Density wobble" title={name}>
  {#snippet aside()}
    {status}
  {/snippet}

  <DensityWave phases={phases.length} {current} {position} {flatten} />
  <CycleStrip {phases} {current} />

  <div class="legend">
    <span class="key">
      <span class="swatch karma-pos"></span>
      Light: positive <b>×1.4</b>, negative <b>×0.6</b>
    </span>
    <span class="key">
      <span class="swatch karma-neg"></span>
      Dense: negative <b>×1.4</b>, positive <b>×0.6</b>
    </span>
    {#if flattened}
      <span class="key muted">
        <span class="swatch ghost"></span>
        {flattened}
      </span>
    {/if}
  </div>

  {#if note}
    <p class="note">{note}</p>
  {/if}
</Section>

<style>
  .legend {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: var(--sp-2) var(--sp-5);
    font-size: var(--fs-sm);
    color: var(--ink-500);
  }

  .key {
    display: flex;
    align-items: center;
    gap: var(--sp-2);
  }

  .key b {
    color: var(--ink-900);
    font-weight: 600;
  }

  .key.muted {
    color: var(--ink-300);
  }

  .swatch {
    width: 28px;
    height: 12px;
    flex: none;
    display: inline-block;
  }

  .swatch.ghost {
    height: 0;
    border-top: 2px dashed var(--ink-200);
  }

  .note {
    margin: 0;
    font-size: var(--fs-sm);
    color: var(--ink-700);
  }
</style>
