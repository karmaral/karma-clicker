<script lang="ts">
  /**
   * When each cohort's row became buyable, and when its first copy actually
   * landed — the wall-clock the retune session opens with instead of a
   * stopwatch. Same idiom as `BeatTimeline`: one row per cohort, one column
   * pair per run.
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
      for (const arrival of result.arrivals) seen.set(arrival.cohort, arrival.index);
    }

    return [...seen]
      .sort(([, a], [, b]) => a - b)
      .map(([id, index]) => ({
        id,
        index,
        cells: results.map((result) => result.arrivals.find((arrival) => arrival.cohort === id)),
      }));
  });

  function gap(revealedAtMs: number | undefined, firstCopyAtMs: number | undefined) {
    if (revealedAtMs === undefined || firstCopyAtMs === undefined) return undefined;

    return (firstCopyAtMs - revealedAtMs) / 1000;
  }
</script>

<div class="wrap">
  <table>
    <thead>
      <tr>
        <th class="cohort">Cohort</th>
        {#each results as result (result.label)}
          <th colspan="3">{result.label}</th>
        {/each}
      </tr>
    </thead>

    <tbody>
      {#each rows as row (row.id)}
        <tr>
          <th class="cohort"><span class="num">{row.index}</span> {row.id}</th>

          {#each row.cells as cell, i (i)}
            <td class="at">{cell ? clockTime((cell.revealedAtMs ?? NaN) / 1000) : '—'}</td>
            <td class="at">{cell ? clockTime((cell.firstCopyAtMs ?? NaN) / 1000) : '—'}</td>
            <td class="gap">
              {clockTime(gap(cell?.revealedAtMs, cell?.firstCopyAtMs) ?? NaN)}
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

  .cohort {
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

  .gap {
    color: var(--ink-400);
    font-variant-numeric: tabular-nums;
  }
</style>
