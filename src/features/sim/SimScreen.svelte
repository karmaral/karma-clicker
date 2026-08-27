<script lang="ts">
  /**
   * The balance bench. Runs the real economy under a virtual clock, several
   * policies at once, and draws what came out — so a number can be changed and
   * its consequence read without playing for it.
   */
  import { Label } from '$ui';
  import LabRail from '$widgets/LabRail.svelte';
  import { startSims, type SimRun } from '$lib/sim/client';
  import { MERGE_STANCES, POLICY_IDS, POLICIES, stanceLabel } from '$lib/sim/policy';
  import { reportsFor } from '$lib/sim/report';
  import {
    COHORT_GROUPS, COHORT_PARAMS, GLOBAL_GROUPS, GLOBAL_PARAMS, PLANET_GROUPS, PLANET_PARAMS,
  } from '$lib/sim/params';
  import type { Detent } from '$lib/aim';
  import type { MergeStance, PolicyId, Sample, SimConfig, SimProgress, SimResult } from '$lib/sim/types';
  import { balanceLab } from './balance-lab.svelte';
  import { clockTime, figure, span } from './format';
  import BalanceLabPanel from './BalanceLabPanel.svelte';
  import BeatTimeline from './BeatTimeline.svelte';
  import MergeCurve from './MergeCurve.svelte';
  import SimChart from './SimChart.svelte';
  import type { Series } from './types';

  /** Monochrome first: the runs differ by dash, and hue is the second signal. */
  const PALETTE = ['var(--ink-900)', 'var(--res-red)', 'var(--res-blue)', 'var(--res-xp)'];
  const DASHES = ['none', '5 3', '2 3', '8 3 2 3'];

  /** Six runs is already twelve seconds of compute and a chart nobody can read. */
  const MAX_RUNS = 6;

  /**
   * Restated rather than imported: reaching for `DETENTS` would pull the whole
   * game graph into a page that only ever hands configs to a worker.
   */
  const DETENT_OPTIONS: { value: Detent; label: string }[] = [
    { value: -2, label: 'Hard negative' },
    { value: -1, label: 'Negative' },
    { value: 0, label: 'Even' },
    { value: 1, label: 'Positive' },
    { value: 2, label: 'Hard positive' },
  ];

  let hours = $state(6);
  let clicksPerSecond = $state(4);
  let reserveFraction = $state(0.25);
  let anchorFraction = $state(0.25);
  let detent = $state<Detent>(0);
  let policies = $state<PolicyId[]>(['cheapest', 'payback']);
  let stances = $state<MergeStance[]>(['floor']);

  let running = $state(false);
  let results = $state<SimResult[]>([]);
  let progress = $state<SimProgress[]>([]);
  let error = $state<string | undefined>();

  let handle: SimRun<SimResult[]> | undefined;

  const configs = $derived.by(() => {
    const built: Partial<SimConfig>[] = [];

    for (const policy of policies) {
      for (const merge of stances) {
        built.push({
          policy,
          merge,
          hours,
          clicksPerSecond,
          reserveFraction,
          anchorFraction,
          detent,
          overrides: balanceLab.overrides,
        });
      }
    }

    return built.slice(0, MAX_RUNS);
  });

  function toggle<T>(list: T[], value: T) {
    return list.includes(value) ? list.filter((item) => item !== value) : [...list, value];
  }

  async function start() {
    if (!configs.length || running) return;

    error = undefined;
    results = [];
    progress = configs.map(() => ({ atMs: 0, beat: 0 }));
    running = true;

    handle = startSims(configs, (index, update) => { progress[index] = update; });

    try {
      results = await handle.done;
    } catch (failure) {
      error = failure instanceof Error ? failure.message : String(failure);
    } finally {
      running = false;
      handle = undefined;
    }
  }

  function stop() {
    handle?.stop();
    handle = undefined;
    running = false;
  }

  function download(name: string, text: string) {
    const url = URL.createObjectURL(new Blob([text], { type: 'text/csv' }));
    const link = document.createElement('a');

    link.href = url;
    link.download = name;
    link.click();

    URL.revokeObjectURL(url);
  }

  function seriesFrom(label: string, pick: (sample: Sample) => number | undefined): Series[] {
    return results.map((result, index) => ({
      label: `${label} · ${result.label}`,
      color: PALETTE[index % PALETTE.length],
      dash: DASHES[index % DASHES.length],
      points: result.samples
        .map((sample) => [sample.atMs / 1000, pick(sample)] as [number, number | undefined])
        .filter((point): point is [number, number] => point[1] !== undefined),
    }));
  }

  const experience = $derived(seriesFrom('xp earned', (sample) => sample.totals.experience));
  const karmaHeld = $derived(seriesFrom('karma held', (sample) => sample.amounts.karma_positive));
  const income = $derived(seriesFrom('karma / s', (sample) => sample.karmaPerSecond));
  const excess = $derived(seriesFrom('excess', (sample) => sample.excess));
  const souls = $derived(seriesFrom('souls', (sample) => sample.souls));

  const summary = $derived(results.map((result) => ({
    label: result.label,
    reached: `${result.beatsReached}/${result.beatsTotal}`,
    last: result.beats[result.beats.length - 1],
    widest: [...result.beats].sort((a, b) => b.gapMs - a.gapMs)[0],
    stalledOn: result.stalledOn,
  })));

  /** A held beat says more than the count that stopped climbing. */
  function heldBy(stall: NonNullable<SimResult['stalledOn']>) {
    const parts = [
      stall.unmetFirstHarvest.length
        ? `${stall.planet ?? 'world'}: ${stall.unmetFirstHarvest.join(', ')}`
        : undefined,
      stall.excess === undefined ? undefined : `excess ${figure(stall.excess)}`,
    ];

    return parts.filter(Boolean).join(' · ');
  }
</script>

<svelte:head>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin="anonymous">
  <link href="https://fonts.googleapis.com/css2?family=Encode+Sans:wght@300;400;500;600;700&display=swap" rel="stylesheet">
</svelte:head>

<div class="page">
  <header>
    <Label text="Karma clicker — balance bench" />
    <h1>Simulator</h1>
    <p>
      The real economy under a virtual clock. Drag a figure in the lab, run it, and read
      what moved — the gap column is the one that shows a wall.
    </p>
  </header>

  <section class="run">
    <div class="controls">
      <label>
        Hours
        <input type="number" min="0.25" max="48" step="0.25" bind:value={hours} />
      </label>

      <label>
        Clicks / s
        <input type="number" min="0" max="20" step="1" bind:value={clicksPerSecond} />
      </label>

      <label>
        Refining
        <input type="number" min="0" max="1" step="0.05" bind:value={reserveFraction} />
      </label>

      <label>
        Anchoring
        <input type="number" min="0" max="1" step="0.05" bind:value={anchorFraction} />
      </label>

      <label>
        Aim
        <select bind:value={detent}>
          {#each DETENT_OPTIONS as option (option.value)}
            <option value={option.value}>{option.label}</option>
          {/each}
        </select>
      </label>
    </div>

    <div class="picks">
      <span class="pick-label">Policy</span>
      {#each POLICY_IDS as id (id)}
        <button
          class={['pick', { on: policies.includes(id) }]}
          onclick={() => (policies = toggle(policies, id))}
        >{POLICIES[id].label}</button>
      {/each}
    </div>

    <div class="picks">
      <span class="pick-label">Merge</span>
      {#each MERGE_STANCES as stance (stance)}
        <button
          class={['pick', { on: stances.includes(stance) }]}
          onclick={() => (stances = toggle(stances, stance))}
        >{stanceLabel(stance)}</button>
      {/each}
    </div>

    <div class="actions">
      <button class="go" onclick={start} disabled={running || !configs.length}>
        {running ? 'running…' : `run ${configs.length}`}
      </button>
      {#if running}
        <button onclick={stop}>stop</button>
      {/if}

      {#each progress as update, index (index)}
        <span class="dim">
          {clockTime(update.atMs / 1000)} · beat {update.beat}
        </span>
      {/each}

      {#if results.length}
        {#each reportsFor(results) as report (report.name)}
          <button onclick={() => download(report.name, report.text)}>{report.name}</button>
        {/each}
      {/if}
    </div>

    {#if error}
      <p class="error">{error}</p>
    {/if}
  </section>

  {#if results.length}
    <section>
      <h2>Where it got to</h2>
      <ul class="summary">
        {#each summary as row (row.label)}
          <li>
            <b>{row.label}</b> — {row.reached} beats
            {#if row.last}· last at {clockTime(row.last.atMs / 1000)}{/if}
            {#if row.widest}· slowest step {row.widest.id} (+{clockTime(row.widest.gapMs / 1000)}){/if}
            {#if row.stalledOn}
              <span class="held">held at {row.stalledOn.beat} — {heldBy(row.stalledOn)}</span>
            {/if}
          </li>
        {/each}
      </ul>

      <BeatTimeline {results} />
    </section>

    <section>
      <h2>The curves</h2>
      <div class="charts">
        <SimChart title="experience earned" series={experience} logY />
        <SimChart title="positive karma held" series={karmaHeld} logY />
        <SimChart title="karma per second" series={income} logY />
        <SimChart title="souls" series={souls} />
        <SimChart title="excess" series={excess} />
      </div>
    </section>
  {/if}

  <section>
    <h2>Merging</h2>
    <p class="note">
      The one decision a run cannot make greedily: souls given up are gone from every
      world still to come, and what they buy is a faster harvest from the world you are
      leaving. If the sweep's last column falls with every larger merge, the choice is
      decoration.
    </p>
    <MergeCurve {results} />
  </section>

  {#if results.length}
    <section>
      <h2>The ladder</h2>
      <p class="note">
        Cost against income as a count climbs, off the data alone — no aim, no wave.
        Payback is seconds of a purchase's own earnings to repay it; where it turns
        upward is where a cohort stops being worth buying. Full table in
        <code>ladder.csv</code>.
      </p>
      <SimChart
        title="payback by count"
        series={[...new Set(results[0].ladder.map((row) => row.cohort))].map((cohort, index) => ({
          label: cohort,
          color: PALETTE[index % PALETTE.length],
          dash: DASHES[index % DASHES.length],
          points: results[0].ladder
            .filter((row) => row.cohort === cohort && Number.isFinite(row.paybackSeconds))
            .map((row) => [row.count, row.paybackSeconds] as [number, number]),
        }))}
        xFormat={(value) => `${Math.round(value)}`}
        yFormat={span}
        logY
      />
    </section>
  {/if}
</div>

<LabRail side="left">
  <BalanceLabPanel title="cohorts" groups={COHORT_GROUPS} params={COHORT_PARAMS} />
  <BalanceLabPanel title="worlds" groups={PLANET_GROUPS} params={PLANET_PARAMS} />
  <BalanceLabPanel title="global" groups={GLOBAL_GROUPS} params={GLOBAL_PARAMS} />
</LabRail>

<style>
  .page {
    max-width: 1180px;
    margin: 0 auto;
    padding: var(--sp-6) var(--sp-5) 96px 21rem;
    display: flex;
    flex-direction: column;
    gap: 44px;
  }

  header {
    display: flex;
    flex-direction: column;
    gap: var(--sp-2);
    border-bottom: var(--rule-strong);
    padding-bottom: var(--sp-3);
  }

  h1 {
    font-size: var(--fs-display);
    font-weight: 600;
    letter-spacing: -.02em;
    margin: 0;
  }

  header p {
    font-size: var(--fs-base);
    color: var(--ink-700);
    margin: 0;
    max-width: 60ch;
  }

  section {
    display: flex;
    flex-direction: column;
    gap: var(--sp-3);
  }

  h2 {
    font-size: var(--fs-sm);
    letter-spacing: var(--ls-label);
    text-transform: uppercase;
    font-weight: 700;
    border-bottom: var(--rule-section);
    padding-bottom: var(--sp-1);
    margin: 0;
  }

  .note {
    font-size: var(--fs-sm);
    color: var(--ink-400);
    margin: 0;
    max-width: 70ch;
  }

  code {
    font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
  }

  .run {
    background: var(--surface);
    border: var(--rule-card);
    padding: var(--sp-3);
    gap: var(--sp-2);
  }

  .controls,
  .picks,
  .actions {
    display: flex;
    align-items: center;
    flex-wrap: wrap;
    gap: var(--sp-2) var(--sp-3);
    font-size: var(--fs-xs);
    color: var(--ink-500);
    font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
  }

  label {
    display: flex;
    align-items: center;
    gap: var(--sp-2);
  }

  input {
    font: inherit;
    background: var(--surface);
    border: var(--rule-card);
    padding: 2px var(--sp-2);
    width: 4.5rem;
    color: var(--ink-900);
  }

  select {
    font: inherit;
    font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
    font-size: var(--fs-xs);
    background: var(--surface);
    border: var(--rule-card);
    padding: 2px var(--sp-2);
    color: var(--ink-900);
  }

  .pick-label {
    width: 4rem;
    color: var(--ink-300);
  }

  button {
    font: inherit;
    font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
    font-size: var(--fs-xs);
    background: var(--surface);
    border: var(--rule-card);
    padding: 2px var(--sp-2);
  }

  button:hover {
    background: var(--surface-alt);
  }

  .pick.on,
  .pick.on:hover {
    background: var(--ink-900);
    color: var(--ink-inverse);
    border-color: var(--ink-900);
  }

  .go {
    border: var(--rule-section);
    font-weight: 700;
  }

  .go:disabled {
    color: var(--ink-300);
    border-color: var(--line-300);
  }

  .dim {
    color: var(--ink-300);
  }

  .error {
    font-size: var(--fs-sm);
    color: var(--status-loss);
    margin: 0;
  }

  .held {
    display: block;
    padding-left: var(--sp-3);
    color: var(--status-loss);
    font-size: var(--fs-xs);
    font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
  }

  .summary {
    list-style: none;
    margin: 0;
    padding: 0;
    display: flex;
    flex-direction: column;
    gap: var(--sp-1);
    font-size: var(--fs-sm);
    color: var(--ink-700);
  }

  .charts {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(420px, 1fr));
    gap: var(--sp-4);
  }
</style>
