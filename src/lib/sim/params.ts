/**
 * Sliders generated off the data files rather than authored beside them, so a
 * field added to `buildings.ts` shows up in the lab without a second edit.
 * A default is a starting value, not a ceiling — ranges are deliberately wide.
 */

import buildings from '$data/buildings';
import planets from '$data/planets';
import balance from '$data/balance';
import { readOverride } from './overrides';

export interface BalanceParam {
  key: string;
  label: string;
  group: string;
  min: number;
  max: number;
  step: number;
}

interface FieldSpec {
  field: string;
  label: string;
  range: (value: number) => [number, number, number];
}

/** About two hundred notches, rounded down to a power of ten. */
function niceStep(span: number) {
  if (!(span > 0)) return 0.01;

  return Math.max(10 ** Math.floor(Math.log10(span / 200)), 0.001);
}

/** For a figure with no natural ceiling: open at zero, generous at the top. */
function scaled(factor: number) {
  return (value: number): [number, number, number] => {
    const max = Math.max(1, value * factor);

    return [0, max, niceStep(max)];
  };
}

function fixed(min: number, max: number, step: number) {
  return (): [number, number, number] => [min, max, step];
}

const COHORT_FIELDS: FieldSpec[] = [
  { field: 'cost', label: 'cost', range: scaled(20) },
  // Finer and shorter than it was: the ramps now live between 1.01 and 1.06, and
  // a 0.01 notch there is a doubling of the army. The count is 1/ln(ramp).
  { field: 'cost_multiplier', label: 'cost ramp', range: fixed(1.005, 1.5, 0.001) },
  { field: 'duration', label: 'duration ms', range: fixed(0, 20_000, 100) },
  // The three multipliers author the level upgrades rather than applying to a
  // count, so moving one moves both what a level is worth and what it is priced
  // at — see `cohort-levels.ts`.
  { field: 'duration_reduction', label: 'speed / tier', range: fixed(0, 0.9, 0.01) },
  { field: 'yields.karma', label: 'karma', range: scaled(20) },
  { field: 'yields.experience', label: 'experience', range: scaled(20) },
  { field: 'yields.red_positive', label: 'red', range: scaled(20) },
  { field: 'yield_multipliers.karma', label: 'karma / tier', range: fixed(0, 10, 0.01) },
  { field: 'yield_multipliers.experience', label: 'xp / tier', range: fixed(0, 10, 0.01) },
  { field: 'yield_multipliers.red_positive', label: 'red / tier', range: fixed(0, 10, 0.01) },
  { field: 'polarity_bias', label: 'bias', range: fixed(-2, 2, 1) },
  { field: 'polarity_multiplier', label: 'extremity pay', range: fixed(1, 10, 0.1) },
  { field: 'resistance', label: 'resistance', range: fixed(0, 1, 0.01) },
];

const PLANET_FIELDS: FieldSpec[] = [
  { field: 'ages', label: 'ages', range: fixed(1, 12, 1) },
  { field: 'cycles_per_age', label: 'cycles / age', range: fixed(1, 32, 1) },
  { field: 'phase_duration', label: 'phase ms', range: fixed(1000, 600_000, 1000) },
  { field: 'firstHarvest.excessGate', label: 'excess gate', range: fixed(0, 1, 0.01) },
  { field: 'firstHarvest.agesLived', label: 'ages lived', range: fixed(0, 12, 1) },
  { field: 'firstHarvest.mergeMinimum', label: 'merge toll', range: scaled(10) },
  { field: 'harvest.duration', label: 'harvest ms', range: fixed(0, 300_000, 1000) },
  { field: 'harvest.mergeHalving', label: 'merge halving', range: scaled(10) },
  { field: 'harvest.maxMergeSpeed', label: 'max speed', range: fixed(1, 32, 1) },
  { field: 'harvest.yields.experience', label: 'pays xp', range: scaled(20) },
  { field: 'harvest.yields.karma', label: 'pays karma', range: scaled(20) },
];

const GLOBAL_FIELDS: FieldSpec[] = [
  { field: 'excess.evenBand', label: 'even band', range: fixed(0, 0.5, 0.005) },
  { field: 'refinery.batchPerWorker', label: 'batch / worker', range: scaled(20) },
  { field: 'refinery.interval', label: 'interval ms', range: fixed(100, 30_000, 100) },
  { field: 'refinery.expBase', label: 'exp to lvl 2', range: scaled(20) },
  { field: 'refinery.expGrowth', label: 'exp growth', range: fixed(1, 3, 0.01) },
  { field: 'refinery.yieldPerLevel', label: 'batch / level', range: fixed(0, 0.5, 0.005) },
  { field: 'aim.wavePull', label: 'wave pull', range: fixed(0, 2, 0.01) },
  { field: 'aim.reaimPenalty', label: 're-aim cost', range: fixed(0, 1, 0.01) },
  { field: 'aim.reaimPhases', label: 're-aim phases', range: fixed(0, 10, 1) },
  { field: 'wave.biasWith', label: 'with the wave', range: fixed(0, 4, 0.05) },
  { field: 'wave.biasAgainst', label: 'against it', range: fixed(0, 4, 0.05) },
  { field: 'harvest.evenExperienceBonus', label: 'even xp bonus', range: fixed(0, 3, 0.05) },
  { field: 'harvest.mergeHalving', label: 'merge halving', range: scaled(10) },
  { field: 'harvest.maxMergeSpeed', label: 'max speed', range: fixed(1, 32, 1) },
];

/** The page's own copies, never overridden — a worker mutates its graph, not this one. */
export const DATA_ROOTS = { buildings, planets, balance };

const ROOTS = DATA_ROOTS;

/** A field the data does not carry is not offered — absence is not a default of 0. */
function paramsFor(root: string, entity: string | undefined, group: string, fields: FieldSpec[]) {
  const params: BalanceParam[] = [];

  for (const spec of fields) {
    const key = [root, entity, spec.field].filter(Boolean).join('.');
    const value = readOverride(ROOTS, key);
    if (value === undefined) continue;

    const [min, max, step] = spec.range(value);
    params.push({ key, label: spec.label, group, min, max, step });
  }

  return params;
}

/** The click is in here too — its yields are the opening minute of the game. */
export const COHORT_PARAMS = Object.keys(buildings)
  .flatMap((id) => paramsFor('buildings', id, id, COHORT_FIELDS));

export const COHORT_GROUPS = Object.keys(buildings);

export const PLANET_PARAMS = Object.keys(planets)
  .flatMap((id) => paramsFor('planets', id, id, PLANET_FIELDS));

export const PLANET_GROUPS = Object.keys(planets);

export const GLOBAL_PARAMS = paramsFor('balance', undefined, 'global', GLOBAL_FIELDS)
  .map((param) => ({ ...param, group: param.key.split('.')[1] }));

export const GLOBAL_GROUPS = [...new Set(GLOBAL_PARAMS.map((param) => param.group))];

export const ALL_PARAMS = [...COHORT_PARAMS, ...PLANET_PARAMS, ...GLOBAL_PARAMS];

/** What the data files say today, before anything is dragged. */
export const DEFAULTS: Record<string, number> = Object.fromEntries(
  ALL_PARAMS.map((param) => [param.key, readOverride(ROOTS, param.key) ?? 0]),
);
