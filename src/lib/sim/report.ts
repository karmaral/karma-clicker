/**
 * Runs turned into CSV. Seconds rather than milliseconds throughout — a sheet
 * axis in ms reads as noise.
 */

import type { SimResult } from './types';

type Cell = string | number | boolean | undefined;

function escape(value: Cell) {
  if (value === undefined) return '';
  const text = String(value);

  return /[",\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
}

/** Trimmed rather than fixed: a payback of 3.5 should not read as 3.500. */
function num(value: number | undefined) {
  if (value === undefined || !Number.isFinite(value)) return '';

  return String(Number(value.toFixed(3)));
}

function toCsv(headers: string[], rows: Cell[][]) {
  return [headers, ...rows].map((row) => row.map(escape).join(',')).join('\n');
}

function seconds(ms: number) {
  return num(ms / 1000);
}

export function beatsCsv(results: SimResult[]) {
  const headers = [
    'run', 'index', 'beat', 'atSeconds', 'gapSeconds',
    'experience', 'karmaPositive', 'karmaNegative', 'souls', 'planetsFinished',
  ];

  const rows = results.flatMap((result) =>
    result.beats.map((beat) => [
      result.label, beat.index, beat.id, seconds(beat.atMs), seconds(beat.gapMs),
      num(beat.experience), num(beat.karmaPositive), num(beat.karmaNegative),
      beat.souls, beat.planetsFinished,
    ]));

  return toCsv(headers, rows);
}

export function timelineCsv(results: SimResult[]) {
  const resources = Object.keys(results[0]?.samples[0]?.amounts ?? {});
  const cohorts = [...new Set(
    results.flatMap((result) => result.samples.flatMap((sample) => Object.keys(sample.counts))),
  )];

  const headers = [
    'run', 'atSeconds', 'beat', 'souls', 'reserved', 'anchors', 'excess',
    'karmaPerSecond', 'experiencePerSecond',
    ...resources.map((type) => `have.${type}`),
    ...resources.map((type) => `earned.${type}`),
    ...cohorts.map((id) => `count.${id}`),
  ];

  const rows = results.flatMap((result) =>
    result.samples.map((sample) => [
      result.label, seconds(sample.atMs), sample.beat, sample.souls, sample.reserved,
      sample.anchorsPlaced,
      num(sample.excess), num(sample.karmaPerSecond), num(sample.experiencePerSecond),
      ...resources.map((type) => num(sample.amounts[type])),
      ...resources.map((type) => num(sample.totals[type])),
      ...cohorts.map((id) => sample.counts[id] ?? 0),
    ]));

  return toCsv(headers, rows);
}

/** One run's worth — the ladder is data, so every run with the same overrides shares it. */
export function ladderCsv(result: SimResult) {
  const headers = [
    'cohort', 'count', 'cumulativeCost', 'nextCost', 'costType',
    'karmaPerSecond', 'experiencePerSecond', 'marginalPerSecond', 'paybackSeconds',
  ];

  const rows = result.ladder.map((row) => [
    row.cohort, row.count, num(row.cumulativeCost), num(row.nextCost), row.costType,
    num(row.karmaPerSecond), num(row.experiencePerSecond),
    num(row.marginalPerSecond), num(row.paybackSeconds),
  ]);

  return toCsv(headers, rows);
}

/**
 * The sweep. One row per harvest, with how long every later beat took to arrive
 * from it — the columns that say whether merging more was worth it.
 */
export function mergeCsv(results: SimResult[]) {
  // Off the runs rather than off `beats`, so this file needs none of the game.
  const reachedIds = [...new Set(
    results
      .flatMap((result) => result.beats)
      .sort((a, b) => a.index - b.index)
      .map((beat) => beat.id),
  )];

  const headers = [
    'run', 'stance', 'planet', 'atSeconds', 'fraction', 'merged',
    'soulsBefore', 'soulsAfter', 'harvestSeconds', 'alignment',
    'karmaPerSecondBefore', 'karmaPerSecondAfter',
    ...reachedIds.map((id) => `to.${id}`),
  ];

  const rows = results.flatMap((result) =>
    result.harvests.map((harvest) => {
      const reached = new Map(result.beats.map((beat) => [beat.id, beat.atMs]));

      return [
        result.label, String(result.config.merge), harvest.planet,
        seconds(harvest.atMs), num(harvest.fraction), harvest.merged,
        harvest.soulsBefore, harvest.soulsAfter, seconds(harvest.harvestDurationMs),
        harvest.alignment,
        num(harvest.karmaPerSecondBefore), num(harvest.karmaPerSecondAfter),
        ...reachedIds.map((id) => {
          const at = reached.get(id);

          return at !== undefined && at >= harvest.atMs ? seconds(at - harvest.atMs) : '';
        }),
      ];
    }));

  return toCsv(headers, rows);
}

export function reportsFor(results: SimResult[]) {
  return [
    { name: 'beats.csv', text: beatsCsv(results) },
    { name: 'timeline.csv', text: timelineCsv(results) },
    { name: 'merge.csv', text: mergeCsv(results) },
    ...(results[0] ? [{ name: 'ladder.csv', text: ladderCsv(results[0]) }] : []),
  ];
}
