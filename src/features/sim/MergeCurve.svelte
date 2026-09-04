<script lang="ts">
  /**
   * What merging would buy, before any run — so the shape of the decision can be
   * read while `mergeHalving` is still under the cursor. The sweep beside it says
   * what it was actually worth.
   */
  import type { PlanetData, Polarity } from '$types';
  import type { SimResult } from '$lib/sim/types';
  import { buildMergeCurve } from '$lib/sim/merge-curve';
  import planets from '$data/planets';
  import { balanceLab } from './balance-lab.svelte';
  import { clockTime, figure } from './format';
  import SimChart from './SimChart.svelte';
  import type { Series } from './types';

  interface Props {
    results: SimResult[];
  }

  let { results }: Props = $props();

  const ids = Object.keys(planets);

  let planetId = $state(ids[0]);
  let souls = $state(200);
  let alignment = $state<Polarity>(0);
  /**
   * Income at departure, which the payout is now a multiple of — so the curve
   * cannot be read without one. Opens on the figures the first measured run
   * reached at world 3, karma phase-averaged. See `docs/progression.md`.
   */
  let experiencePerSecond = $state(150_000);
  let karmaPerSecond = $state(90_000);

  const planet = $derived(balanceLab.entity<PlanetData>('planets', planetId));

  const curve = $derived(buildMergeCurve(
    planetId,
    planet,
    souls,
    { experience: experiencePerSecond, karma: karmaPerSecond },
    alignment,
  ));

  const series = $derived<Series[]>([
    {
      label: 'experience / s',
      color: 'var(--res-xp)',
      points: curve.map((row) => [row.fraction, row.experiencePerSecond] as [number, number]),
    },
    {
      label: 'karma / s',
      color: 'var(--ink-900)',
      points: curve.map((row) => [row.fraction, row.karmaPerSecond] as [number, number]),
    },
  ]);

  /** The lowest share the world will accept — where the real choice starts. */
  const floor = $derived(curve.find((row) => row.meetsMinimum)?.fraction ?? 0);

  const harvests = $derived(
    results.flatMap((result) =>
      result.harvests.map((harvest) => ({ label: result.label, harvest }))),
  );

  /**
   * From a harvest to the last beat that run reached. The one figure the sweep
   * is for: whether giving up more souls got you further, sooner.
   */
  function afterHarvest(result: SimResult, atMs: number) {
    const last = result.beats[result.beats.length - 1];

    return last && last.atMs >= atMs ? (last.atMs - atMs) / 1000 : undefined;
  }
</script>

<div class="merge">
  <div class="controls">
    <label>
      World
      <select bind:value={planetId}>
        {#each ids as id (id)}
          <option value={id}>{id}</option>
        {/each}
      </select>
    </label>

    <label>
      Souls
      <input type="number" min="0" step="10" bind:value={souls} />
    </label>

    <label>
      xp / s
      <input type="number" min="0" step="10000" bind:value={experiencePerSecond} />
    </label>

    <label>
      karma / s
      <input type="number" min="0" step="10000" bind:value={karmaPerSecond} />
    </label>

    <label>
      Alignment
      <select bind:value={alignment}>
        <option value={-1}>negative</option>
        <option value={0}>even</option>
        <option value={1}>positive</option>
      </select>
    </label>
  </div>

  <SimChart
    title="what merging buys — {planetId}"
    {series}
    xFormat={(value) => `${Math.round(value * 100)}%`}
    marks={floor > 0 ? [{ at: floor, label: 'toll' }] : []}
    height={220}
  />

  {#if harvests.length}
    <table>
      <thead>
        <tr>
          <th>Run</th>
          <th>World</th>
          <th>Merged</th>
          <th>Left</th>
          <th>Harvest</th>
          <th>Karma/s after</th>
          <th>Aligned</th>
          <th>To last beat</th>
        </tr>
      </thead>
      <tbody>
        {#each harvests as { label, harvest }, i (i)}
          <tr>
            <td>{label}</td>
            <td>{harvest.planet}</td>
            <td>{harvest.merged} <span class="dim">({Math.round(harvest.fraction * 100)}%)</span></td>
            <td>{harvest.soulsAfter}</td>
            <td>{clockTime(harvest.harvestDurationMs / 1000)}</td>
            <td>
              {figure(harvest.karmaPerSecondAfter)}
              <span class="dim">was {figure(harvest.karmaPerSecondBefore)}</span>
            </td>
            <td>{harvest.alignment}</td>
            <td>
              {clockTime(
                afterHarvest(
                  results.find((result) => result.label === label)!,
                  harvest.atMs,
                ) ?? NaN,
              )}
            </td>
          </tr>
        {/each}
      </tbody>
    </table>
  {:else}
    <p class="note">No harvest in the runs yet — the sweep fills this once one lands.</p>
  {/if}
</div>

<style>
  .merge {
    display: flex;
    flex-direction: column;
    gap: var(--sp-3);
  }

  .controls {
    display: flex;
    flex-wrap: wrap;
    gap: var(--sp-3);
    font-size: var(--fs-xs);
    color: var(--ink-500);
  }

  label {
    display: flex;
    align-items: center;
    gap: var(--sp-2);
  }

  select, input {
    font: inherit;
    font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
    background: var(--surface);
    border: var(--rule-card);
    padding: 2px var(--sp-2);
    color: var(--ink-900);
  }

  input {
    width: 5rem;
  }

  table {
    width: 100%;
    border-collapse: collapse;
    font-size: var(--fs-xs);
    font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
    background: var(--surface);
    border: var(--rule-card);
  }

  th, td {
    padding: var(--sp-1) var(--sp-2);
    text-align: left;
    border-bottom: var(--rule-row);
    white-space: nowrap;
  }

  thead th {
    border-bottom: var(--rule-section);
    font-size: var(--fs-label);
    letter-spacing: var(--ls-label);
    text-transform: uppercase;
    color: var(--ink-500);
  }

  .dim {
    color: var(--ink-300);
  }

  .note {
    font-size: var(--fs-sm);
    color: var(--ink-400);
    margin: 0;
  }
</style>
