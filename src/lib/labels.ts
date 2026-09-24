/**
 * The one place code names and UI labels meet. Every screen keeps its own name in
 * the header; the active planet's proper noun rides in the note beside it, so the
 * tab holds still while the world it reads changes.
 */

import buildingTexts from '$data/buildings-texts';
import planetTexts from '$data/planets-texts';
import { parseScope } from '$data/upgrades';
import { f } from '$lib/utils';
import type {
  Effect, EffectVerb, FirstHarvestCondition, HarvestBoon, ModifierStat, PlanetDemand, Polarity,
  YieldType,
} from '$types';

export type ScreenName = 'overview' | 'details' | 'harness' | 'refinery';

/**
 * Header order, left to right. Details leads because the minute you are living in
 * leads. Harness sits second, and until it reveals Details stands across both
 * slots — so it lands in a cell that was already there rather than pushing
 * Overview along. Refinery reveals a beat later and appends.
 */
export const SCREENS: ScreenName[] = ['details', 'harness', 'overview', 'refinery'];

export const SCREEN_LABELS: Record<ScreenName, string> = {
  overview: 'Overview',
  refinery: 'Refinery',
  details: 'Details',
  harness: 'Harness',
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
  weight: 'Weight',
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

/**
 * Ages completed on this world. The first-harvest gate counts the same thing, so
 * the reading and the door it opens can never disagree — and it is a count, never
 * `age 3`, which would name an age you are only part-way through.
 */
export function getAgesLabel(agesLived: number) {
  return `${f(agesLived)} ${agesLived === 1 ? 'age' : 'ages'}`;
}

/** The header's one-line note: the same, plus which half of the wobble it is in. */
export function getWaveLabel(phase: number, phasesPerAge: number, isDense: boolean) {
  return `${getPhaseLabel(phase, phasesPerAge)} · ${isDense ? 'dense' : 'light'}`;
}

/** Within a percent of whole. Wide enough for float drift, tight enough to refuse a lie. */
function isWhole(value: number) {
  return Math.abs(value - Math.round(value)) < 0.01 * Math.max(1, Math.abs(value));
}

function plural(count: number, unit: string) {
  return `${Math.round(count)} ${unit}${Math.round(count) === 1 ? '' : 's'}`;
}

/**
 * A life in the wave's own words. Lives are authored in phases and double per
 * index (see `buildings.ts`, `BASE_LIFE`), so every one of them lands on a
 * landmark the wave already has a name for — and the reading a player needs is
 * whether a life fits inside a phase, not how many seconds it happens to be on
 * this world.
 *
 * Bigger units first: a length that is both four phases and two cycles reads as
 * cycles, because a cycle is what the one-phase line is drawn against.
 *
 * ⚠ Seconds are the guard, not a fallback anybody should reach. Nothing may
 * multiply a life by anything but a power of two — that is what keeps every one
 * of them on a landmark, and it is why the two all-cohort `boost` entries buy
 * yield rather than duration (see `upgrades.ts`, the `cohorts` bucket). A life
 * off the grid would have to be named by the nearest landmark, which is a lie
 * about the only figure on the row, so it reads in seconds instead. A floored
 * life never arrives here at all — `lifeLabel` answers *stream* first.
 *
 * The power-of-two test is exact on the rounded denominator and not on its
 * log: `isWhole` is a *relative* tolerance, and at a denominator of 960 it
 * accepted log2 9.907 as 10 and then printed the 960.
 */
export function formatLife(ms: number, phaseMs: number, phasesPerAge: number) {
  const phases = ms / Math.max(1, phaseMs);
  const ages = phases / Math.max(1, phasesPerAge);

  if (ages >= 1 && isWhole(ages)) return plural(ages, 'age');
  if (phases >= 2 && isWhole(phases / 2)) return plural(phases / 2, 'cycle');
  if (phases >= 1 && isWhole(phases)) return plural(phases, 'phase');

  const denominator = Math.round(1 / phases);
  if (phases > 0 && isWhole(1 / phases) && Number.isInteger(Math.log2(denominator))) {
    return `1/${denominator} phase`;
  }

  return `${f(ms / 1000)}s`;
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
 * What a world is asking for. The excess words, because a demand is a demand for
 * one of the two piles and naming it anything else would make it a third thing.
 *
 * An **offer**, and it reads as one: the world pays more for a life spent its
 * way and less for one spent the other. Never a condition and never a judgement
 * — declining costs you the premium and nothing else. See `docs/design.md` §14.
 */
export function getDemandLabel(demand: PlanetDemand | undefined) {
  if (!demand?.wants) return undefined;

  return demand.wants > 0 ? EXCESS_SIDES.positive : EXCESS_SIDES.negative;
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

/**
 * Stats authored in milliseconds. A `flat` on one of these adds a span, so it
 * prints as seconds — the press buys +0.5s of the job, never "+500" of nothing.
 */
const MS_STATS: ModifierStat[] = ['press'];

/** The change itself, in the shortest form that stays true to the operator. */
export function getModifierFigure({ op, value, stat }: HarvestBoon['effect']) {
  if (op === 'flat' && stat && RATE_STATS.includes(stat)) {
    return `${value < 0 ? '−' : '+'}${Math.abs(Math.round(value * 1000) / 10)}%`;
  }

  if (op === 'flat' && stat && MS_STATS.includes(stat)) {
    return `${value < 0 ? '−' : '+'}${Math.abs(value / 1000)}s`;
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
  anchors: 'anchors placeable',
  work: 'placing speed',
  press: 'per press',
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
