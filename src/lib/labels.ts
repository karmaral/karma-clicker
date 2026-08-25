/**
 * The one place code names and UI labels meet. Every screen keeps its own name in
 * the header; the active planet's proper noun rides in the note beside it, so the
 * tab holds still while the world it reads changes.
 */

import buildingTexts from '$data/buildings-texts';
import type { FirstHarvestCondition, HarvestBoon, Polarity } from '$types';

export type ScreenName = 'overview' | 'details' | 'refinery';

/**
 * Header order, left to right. Details leads because the minute you are living in
 * leads; Overview arrives between two cells that already exist rather than at an
 * end, which is what it costs to keep experience out of the tabs.
 */
export const SCREENS: ScreenName[] = ['details', 'overview', 'refinery'];

export const SCREEN_LABELS: Record<ScreenName, string> = {
  overview: 'Overview',
  refinery: 'Refinery',
  details: 'Details',
};

/**
 * The grades, in ladder order. Code says red / yellow / blue and the screen says
 * Crimson / Ochre / Indigo; red is the only one still holding a side, so it is
 * the only one whose name takes a qualifier.
 */
export type GradeKey = 'red_negative' | 'red_positive' | 'yellow' | 'blue' | 'wisdom';

export const GRADES: GradeKey[] = ['red_negative', 'red_positive', 'yellow', 'blue'];

export const GRADE_LABELS: Record<GradeKey, string> = {
  red_negative: 'Crimson · negative',
  red_positive: 'Crimson · positive',
  yellow: 'Ochre',
  blue: 'Indigo',
  wisdom: 'Wisdom',
};

/** What each grade comes out of — the row's whole explanation of itself. */
export const GRADE_SOURCES: Record<GradeKey, string> = {
  red_negative: 'Refined from negative karma',
  red_positive: 'Refined from positive karma',
  yellow: 'Refined from matched Crimson',
  blue: 'Refined from Ochre',
  wisdom: 'Refined from Experience',
};

/**
 * How a planet was first harvested, which sets what its recurring harvest pays.
 * The karma column words, so nobody mistakes them for the excess sides.
 */
export const FIRST_HARVEST_ALIGNMENT_LABELS: Record<Polarity, string> = {
  '-1': 'In the negative',
  '0': 'Even',
  '1': 'In the positive',
};

/**
 * Where the wave is. The data authors these as `cycles_per_age`; the screens have
 * said phase since the wobble was drawn, and the two want reconciling in one pass
 * rather than by whichever file is being edited.
 */
export function getPhaseLabel(phase: number, phasesPerAge: number) {
  return `phase ${phase + 1} of ${phasesPerAge}`;
}

/** The header's one-line note: the same, plus which half of the wobble it is in. */
export function getWaveLabel(phase: number, phasesPerAge: number, isDense: boolean) {
  return `${getPhaseLabel(phase, phasesPerAge)} · ${isDense ? 'dense' : 'light'}`;
}

/**
 * Which side the excess sits on. One signed reading, never two bars — the side
 * is a qualifier on the label, not a resource of its own (CONTEXT v3 §3.2).
 */
export function getExcessSideLabel(excess: number | undefined) {
  if (!excess) return undefined;

  return excess > 0 ? 'Comfort' : 'Burden';
}

/** The side as a section's qualifier — the meter says the bare word itself. */
export function getExcessSideNote(excess: number | undefined) {
  const side = getExcessSideLabel(excess);

  return side && `${side} side`;
}

/**
 * What a boon acts on, said the way the screen says it. Buildings name
 * themselves in `buildings-texts`; the click does not have an entry there and
 * would not want its own title anyway — a boon on it moves *incarnation*, which
 * is the verb, not the thing doing it.
 */
const BOON_TARGET_LABELS: Record<string, string> = {
  main: 'incarnation',
};

/** The change itself, in the shortest form that stays true to the operator. */
function getModifierFigure({ op, value }: HarvestBoon['effect']) {
  switch (op) {
    case 'boost':
      return `${value < 0 ? '−' : '+'}${Math.abs(Math.round(value * 1000) / 10)}%`;
    case 'mult':
      return `×${value}`;
    case 'pow':
      return `^${value}`;
    default:
      return `${value < 0 ? '−' : '+'}${Math.abs(value)}`;
  }
}

/** One boon as its own line: `+2% incarnation`. */
export function getBoonLabel(boon: HarvestBoon) {
  const named = BOON_TARGET_LABELS[boon.target]
    ?? buildingTexts[boon.target]?.title.toLowerCase()
    ?? boon.target;

  return `${getModifierFigure(boon.effect)} ${named}`;
}

/**
 * The record is what makes the order exhaustive: `strict` is off, so a missing
 * switch case compiles fine, but a missing key here does not. Widen
 * `PlanetFirstHarvest` and this fails until the condition is placed.
 */
const CONDITION_ORDER: Record<FirstHarvestCondition, number> = {
  agesLived: 1,
  mergeMinimum: 2,
  excessGate: 3,
};

/**
 * Canonical order. Anything listing a planet's conditions walks this, so what it
 * asks reads the same on the Ahead row as on the Harvest button.
 */
export const FIRST_HARVEST_CONDITIONS = (Object.keys(CONDITION_ORDER) as FirstHarvestCondition[])
  .sort((a, b) => CONDITION_ORDER[a] - CONDITION_ORDER[b]);

/** Why a planet will not let you take the first harvest yet. */
export function getFirstHarvestConditionLabel(
  condition: FirstHarvestCondition,
  value: number,
): string {
  switch (condition) {
    case 'agesLived':
      return `${value} ${value === 1 ? 'age' : 'ages'} lived`;
    case 'mergeMinimum':
      return `${value} souls to merge`;
    case 'excessGate':
      return `excess under ${Math.round(value * 100)}%`;
    default: {
      const unhandled: never = condition;

      return unhandled;
    }
  }
}
