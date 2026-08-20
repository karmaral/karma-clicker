<script lang="ts">
  /**
   * When each beat arrived, and — the column that matters — how long the step
   * before it took. A wall is a gap bar that runs away from the ones around it.
   */
  import type { SimResult } from '$lib/sim/types';
  import { clockTime } from './format';

  interface Props {
    results: SimResult[];
  }

  let { results }: Props = $props();

  const rows = $derived.by(() => {
    const seen = new Map<string, number>();

    for (const result of results) {
      for (const beat of result.beats) seen.set(beat.id, beat.index);
    }

    return [...seen]
      .sort(([, a], [, b]) => a - b)
      .map(([id, index]) => ({
        id,
        index,
        cells: results.map((result) => result.beats.find((beat) => beat.id === id)),
      }));
  });

  const widestGap = $derived(
    Math.max(1, ...results.flatMap((result) => result.beats.map((beat) => beat.gapMs))),
  );

  /** Capped short of the cell, so the figure beside the bar always has room. */
  function share(gapMs: number) {
    return `${Math.max(1, (gapMs / widestGap) * 62)}%`;
  }
</script>

<div class="wrap">
  <table>
    <thead>
      <tr>
        <th class="beat">Beat</th>
        {#each results as result (result.label)}
          <th colspan="2">
            {result.label}
            <span class="sub">{result.beatsReached}/{result.beatsTotal} beats</span>
          </th>
        {/each}
      </tr>
    </thead>

    <tbody>
      {#each rows as row (row.id)}
        <tr>
          <th class="beat"><span class="num">{row.index}</span> {row.id}</th>

          {#each row.cells as cell, i (i)}
            <td class="at">{cell ? clockTime(cell.atMs / 1000) : '—'}</td>
            <td class="gap">
              {#if cell}
                <span class="bar" style:width={share(cell.gapMs)}></span>
                <span class="label">+{clockTime(cell.gapMs / 1000)}</span>
              {/if}
            </td>
          {/each}
        </tr>
      {/each}
    </tbody>
  </table>
</div>

<style>
  .wrap {
    overflow-x: auto;
    border: var(--rule-card);
    background: var(--surface);
  }

  table {
    width: 100%;
    border-collapse: collapse;
    font-size: var(--fs-xs);
    font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
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

  .sub {
    display: block;
    color: var(--ink-300);
    letter-spacing: 0;
    text-transform: none;
    font-weight: 400;
  }

  .beat {
    color: var(--ink-700);
    font-weight: 400;
  }

  .num {
    color: var(--ink-300);
    display: inline-block;
    width: 1.4em;
    text-align: right;
  }

  .at {
    color: var(--ink-900);
    font-variant-numeric: tabular-nums;
  }

  /* The bar is the reading; the figure beside it is only for writing down. */
  .gap {
    width: 40%;
    min-width: 8rem;
  }

  .bar {
    display: inline-block;
    height: 7px;
    background: var(--ink-200);
    vertical-align: middle;
    margin-right: var(--sp-2);
  }

  .label {
    color: var(--ink-400);
    font-variant-numeric: tabular-nums;
  }
</style>
