/**
 * What the wave pays each polarity, right now. Authored `biasWith`/`biasAgainst`
 * are the *floor* of the spread, not the whole figure: excess widens it, so a
 * deep tilt means one phase corrects fast and the other near-stalls, and digging
 * out becomes aim in the right phase rather than hold a dial.
 *
 * Mean-preserving by construction — the pair always sums to twice the authored
 * mean, so a tilted run earns the same karma per cycle as it ever did. Phase
 * durations are untouched, so `docs/design.md` §9's cycle mean and §13's age
 * arithmetic never see this.
 */

import { getExcess } from '$lib/excess';
import balance from '$data/balance';

export function getWaveBias() {
  const { biasWith, biasAgainst, excessSpread } = balance.wave;

  /** Undefined is *unknown*, not zero — before both piles exist, the authored pair stands. */
  const excess = getExcess();
  if (excess === undefined) return { biasWith, biasAgainst };

  const mean = (biasWith + biasAgainst) / 2;
  const spread = (biasWith - biasAgainst) / 2 + excessSpread * Math.abs(excess);

  return { biasWith: mean + spread, biasAgainst: mean - spread };
}
