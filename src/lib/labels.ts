/**
 * The one place code names and UI labels meet. Every screen keeps its own name in
 * the header; the active planet's proper noun rides in the note beside it, so the
 * tab holds still while the world it reads changes.
 */

import buildingTexts from '$data/buildings-texts';
import planetTexts from '$data/planets-texts';
import { parseScope } from '$data/upgrades';
import type {
  Effect, EffectVerb, FirstHarvestCondition, HarvestBoon, ModifierStat, Polarity, YieldType,
} from '$types';

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
export type GradeKey = 'red_negative' | 'red_positive' | 'yellow' | 'blue';

export const GRADES: GradeKey[] = ['red_negative', 'red_positive', 'yellow', 'blue'];

export const GRADE_LABELS: Record<GradeKey, string> = {
  red_negative: 'Crimson · negative',
  red_positive: 'Crimson · positive',
  yellow: 'Ochre',
  blue: 'Indigo',
};

/** What each grade comes out of — the row's whole explanation of itself. */
export const GRADE_SOURCES: Record<GradeKey, string> = {
  red_negative: 'Refined from negative karma',
  red_positive: 'Refined from positive karma',
  yellow: 'Refined from matched Crimson',
  blue: 'Refined from Ochre',
};

/**
 * The words the header band writes *under* its figures. A cell's title says what
 * the reading is of; these say what each figure inside it counts — which is why
 * Legacy's figure says Wisdom and Karma's two say their sides. Crimson is bare
 * here: the header reads the two reds as one rung, so neither qualifier applies.
 */
export const READING_LABELS = {
  /** The score's figure is the standing total; the rates beside it are the flow. */
  total: 'Total',
  wisdom: 'Wisdom',
  karmaNegative: 'Negative',
  karmaPositive: 'Positive',
  red: 'Crimson',
  yellow: GRADE_LABELS.yellow,
  blue: GRADE_LABELS.blue,
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
 * The two ends of the excess scale. Named as a pair because the meter draws
 * both at once — the end you are on and the one you are not — where a caller
 * asking which side a reading sits on wants only the one word.
 */
export const EXCESS_SIDES = { negative: 'Burden', positive: 'Comfort' } as const;

/**
 * Which side the excess sits on. One signed reading, never two bars — the side
 * is a qualifier on the label, not a resource of its own (CONTEXT v3 §3.2).
 */
export function getExcessSideLabel(excess: number | undefined) {
  if (!excess) return undefined;

  return excess > 0 ? EXCESS_SIDES.positive : EXCESS_SIDES.negative;
}

/** The side spelt out as a sentence's qualifier, where a bare word would not do. */
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

/**
 * Stats whose value is a share per unit rather than a count of anything. A `flat`
 * on one of these adds a rate, so it reads as a percent — `carry` is 1% a soul
 * riding, never one soul.
 */
const RATE_STATS: ModifierStat[] = ['carry'];

/** The change itself, in the shortest form that stays true to the operator. */
export function getModifierFigure({ op, value, stat }: HarvestBoon['effect']) {
  if (op === 'flat' && stat && RATE_STATS.includes(stat)) {
    return `${value < 0 ? '−' : '+'}${Math.abs(Math.round(value * 1000) / 10)}%`;
  }

  switch (op) {
    case 'boost':
      return `${value < 0 ? '−' : '+'}${Math.abs(Math.round(value * 1000) / 10)}%`;
    // Two decimals, trailing zeros dropped: a factor is authored as `1 + 0.57`
    // somewhere, and binary leaves that 1.5699999999999998.
    case 'mult':
      return `×${Math.round(value * 100) / 100}`;
    case 'pow':
      return `^${Math.round(value * 100) / 100}`;
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
 * The catalogue's left-hand column. Only the irregulars are listed — a bucket
 * with an entity resolves through the same tables the rest of the game already
 * names things with, so `cohort:cohort_2` reads `buildingTexts.cohort_2.title`
 * rather than repeating it here.
 */
const SCOPE_LABELS: Record<string, string> = {
  global: 'Global',
  cohorts: 'All cohorts',
  refinery: 'Refinery',
  harness: 'Harness',
  'building:main': 'You',
};

export function getScopeLabel(bucket: string): string {
  if (bucket in SCOPE_LABELS) return SCOPE_LABELS[bucket];

  const { kind, entity } = parseScope(bucket);
  if (!entity) return SCOPE_LABELS[kind] ?? kind;
  if (kind === 'cohort') return buildingTexts[entity]?.title ?? entity;
  if (kind === 'planet') return planetTexts[entity]?.title ?? entity;

  return entity;
}

/** A stat's noun, where the bare `ModifierStat` word would not read as one. */
const STAT_NOUNS: Partial<Record<ModifierStat, string>> = {
  duration: 'return time',
  step: 'allocation steps',
  carry: 'per soul riding',
};

/** `karma_positive` → `positive karma` — the order every other reading already takes. */
function targetNoun(type: YieldType | 'all') {
  if (type === 'all') return 'yield';

  const [family, polarity] = type.split('_');
  if (polarity === 'positive' || polarity === 'negative') return `${polarity} ${family}`;

  return type;
}

/** `unlock`/`discover` name themselves; `acquire` and `autonomy` ride along unlabelled. */
const VERB_EFFECT_LABELS: Partial<Record<EffectVerb, string>> = {
  unlock: 'unlocked',
  discover: 'discovered',
};

/**
 * The catalogue's effect column: noun first, figure last — `return time ×0.75` —
 * the reverse of `getBoonLabel`'s `+2% incarnation`. A boon is a line of its own
 * where the figure leads; a row here already has a name above it, so the noun is
 * what makes a column of these scannable. Do not "fix" one to match the other.
 */
export function getEffectLabel(
  effect: Effect | Effect[] | undefined,
  effectTarget?: YieldType | 'all',
): string {
  if (!effect) return '';

  const list = Array.isArray(effect) ? effect : [effect];

  return list
    .flatMap((entry) => {
      if (typeof entry === 'string') {
        const verbLabel = VERB_EFFECT_LABELS[entry];

        return verbLabel ? [verbLabel] : [];
      }

      const noun = entry.stat
        ? STAT_NOUNS[entry.stat] ?? entry.stat
        : targetNoun(entry.target ?? effectTarget ?? 'all');

      return [`${getModifierFigure(entry)} ${noun}`];
    })
    .join(' · ');
}

/** A kind's own word, for the row whose entity is not a thing you know yet. */
const KIND_LABELS: Record<string, string> = {
  cohort: 'Cohort',
  planet: 'World',
};

/**
 * Scope and effect as one reading, because for an arrival they trade places.
 * `Impulse · unlocked` puts a proper noun in the column that says *where*, for
 * something that is nowhere yet, and then spends the effect column saying what
 * the chip's being there already said. `Cohort · Impulse` names the kind you are
 * buying into and spends the effect on the one thing you do not know: which.
 *
 * Everything else keeps its entity as the scope, and takes `authored` — the
 * short line from `upgrades-texts` — over the figures whenever one is written.
 * The rail passes it and the catalogue does not: a chip has one line, a row has
 * the width to say what actually moved.
 */
export function getUpgradeReading(
  target: string,
  effect: Effect | Effect[] | undefined,
  effectTarget?: YieldType | 'all',
  authored?: string,
) {
  const list = Array.isArray(effect) ? effect : effect ? [effect] : [];
  const named = getScopeLabel(target);

  if (list.some((entry) => entry === 'unlock' || entry === 'discover')) {
    const { kind } = parseScope(target);

    return { scope: KIND_LABELS[kind] ?? named, effect: named };
  }

  return { scope: named, effect: authored || getEffectLabel(effect, effectTarget) };
}

/**
 * The record is what makes the order exhaustive: `strict` is off, so a missing
 * switch case compiles fine, but a missing key here does not. Widen
 * `PlanetFirstHarvest` and this fails until the condition is placed.
 */
const CONDITION_ORDER: Record<FirstHarvestCondition, number> = {
  agesLived: 1,
  excessGate: 2,
};

/**
 * Canonical order. Anything listing a planet's conditions walks this, so what it
 * asks reads the same on the Ahead row as on the Harvest button.
 */
export const FIRST_HARVEST_CONDITIONS = (Object.keys(CONDITION_ORDER) as FirstHarvestCondition[])
  .sort((a, b) => CONDITION_ORDER[a] - CONDITION_ORDER[b]);

/**
 * The toll, which is not one of the conditions above and so has no label there:
 * it can never fail, so it is never a reason. A share of the army rather than a
 * count of souls, and it prints as one — see `PlanetFirstHarvest`.
 */
export function getMergeTollLabel(share: number) {
  return `${Math.round(share * 100)}%`;
}

/** Why a planet will not let you take the first harvest yet. */
export function getFirstHarvestConditionLabel(
  condition: FirstHarvestCondition,
  value: number,
): string {
  switch (condition) {
    case 'agesLived':
      return `${value} ${value === 1 ? 'age' : 'ages'} lived`;
    case 'excessGate':
      return `excess under ${Math.round(value * 100)}%`;
    default: {
      const unhandled: never = condition;

      return unhandled;
    }
  }
}
