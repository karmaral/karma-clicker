/**
 * Every rig the harness ladder passes through, built rather than eyeballed. An
 * upgrade axis that moves no picture is a dead purchase, and the only way to
 * catch one is to see the whole ladder at once — a live game shows you a rig at
 * whatever rung you happen to be on, hours apart.
 *
 * The ladder is replayed through a throwaway `ModifierSet`, so these are the
 * real rows in `$data/upgrades` in the real order, not a hand-written sequence
 * that would go stale the moment one is retuned. Nothing here touches the live
 * harness: `$lib/rig` is a leaf on purpose, so the lab draws the rig without
 * mounting the game behind it.
 *
 * Lines are not on the ladder — they are bought repeatedly once an upgrade
 * unlocks them — so they get their own strip.
 */

import upgradeData from '$data/upgrades';
import { ModifierSet } from '$lib/modifiers';
import { readAxes, rigVisualsAt } from '$lib/rig';
import type { RigAxes, RigVisuals } from '$lib/rig';
import type { Effect, Modifier } from '$types';

export interface RigStage {
  /** The upgrade row this rung is the result of. `base` is nothing bought. */
  id: string;
  /** What the row moved, in the data's own words. Blank for a verb. */
  note: string;
  axes: RigAxes;
  visuals: RigVisuals;
}

/** How many lines the second strip walks. Past a handful the span has saturated. */
const LINE_COUNTS = [0, 1, 2, 3, 5, 8];

/** `flat +24 slots`, so the cell says which axis it is testing. */
function noteOf(effect: Effect | Effect[] | undefined) {
  if (!effect) return '';

  const list = Array.isArray(effect) ? effect : [effect];

  return list
    .map((one) => (typeof one === 'string' ? one : `${one.op} ${one.value} ${one.stat ?? 'yield'}`))
    .join(' · ');
}

function modifiersOf(id: string, effect: Effect | Effect[] | undefined): Modifier[] {
  if (!effect) return [];

  const list = Array.isArray(effect) ? effect : [effect];

  return list
    .filter((one): one is Omit<Modifier, 'id'> => typeof one !== 'string')
    .map((one, i) => ({ ...one, id: `${id}:${i}` }));
}

/**
 * The ladder, cumulative. One cell per row plus the rig nobody has bought, which
 * is the cell every other one has to differ from.
 */
function buildLadder(lines: number): RigStage[] {
  const modifiers = new ModifierSet();
  const stages: RigStage[] = [
    { id: 'base', note: 'nothing bought', ...readStage(modifiers, lines) },
  ];

  for (const item of upgradeData.harness) {
    modifiersOf(item.id, item.effect).forEach((modifier) => modifiers.add(modifier));

    stages.push({ id: item.id, note: noteOf(item.effect), ...readStage(modifiers, lines) });
  }

  return stages;
}

function readStage(modifiers: ModifierSet, lines: number) {
  const axes = readAxes(modifiers, lines);

  return { axes, visuals: rigVisualsAt(axes) };
}

/** The whole ladder bought, so the line strip varies one thing and nothing else. */
function buildLines(): RigStage[] {
  const modifiers = new ModifierSet();

  for (const item of upgradeData.harness) {
    modifiersOf(item.id, item.effect).forEach((modifier) => modifiers.add(modifier));
  }

  return LINE_COUNTS.map((lines) => ({
    id: `${lines} lines`,
    note: lines ? '' : 'unlit',
    ...readStage(modifiers, lines),
  }));
}

export const RIG_LADDER = buildLadder(0);
export const RIG_LINES = buildLines();
