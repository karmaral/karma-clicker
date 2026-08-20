/**
 * A policy decides one thing: what to buy next. Everything else a run does —
 * clicking, taking upgrades, reserving, harvesting — is a fixed rule in `run`,
 * so two policies stay comparable and a third one is three lines.
 */

import type { Candidate, MergeStance, Policy, PolicyId } from './types';

function pickBy(candidates: Candidate[], score: (candidate: Candidate) => number) {
  let best: Candidate | undefined;
  let bestScore = Infinity;

  for (const candidate of candidates) {
    const scored = score(candidate);
    if (scored >= bestScore) continue;

    best = candidate;
    bestScore = scored;
  }

  return best;
}

export const POLICIES: Record<PolicyId, Policy> = {
  cheapest: {
    id: 'cheapest',
    label: 'Cheapest first',
    next: (candidates) => pickBy(candidates, (candidate) => candidate.cost),
  },

  /** Ignores anything that earns nothing back — its payback is Infinity. */
  payback: {
    id: 'payback',
    label: 'Fastest payback',
    next: (candidates) => pickBy(candidates, (candidate) => candidate.paybackSeconds),
  },
};

export const POLICY_IDS = Object.keys(POLICIES) as PolicyId[];

export const MERGE_STANCES: MergeStance[] = ['floor', 'generous', 'half', 'all'];

const STANCE_LABELS: Record<string, string> = {
  floor: 'The toll and no more',
  generous: 'A margin over the toll',
  half: 'Half of them',
  all: 'All of them',
};

export function stanceLabel(stance: MergeStance) {
  return STANCE_LABELS[String(stance)] ?? `${Math.round(Number(stance) * 100)}%`;
}
