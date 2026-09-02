import type { BuildingData } from '$types';
import { PlanetManager } from '$lib/managers';
import { progression } from '$lib/progression';
import balance from '$data/balance';

export const DETENTS = [-2, -1, 0, 1, 2] as const;
export type Detent = (typeof DETENTS)[number];

const HARDEST_NEGATIVE = DETENTS[0];
const HARDEST_POSITIVE = DETENTS[DETENTS.length - 1];

const DETENT_LABELS: Record<Detent, string> = {
  [-2]: 'Hard negative',
  [-1]: 'Negative',
  [0]: 'Even',
  [1]: 'Positive',
  [2]: 'Hard positive',
};

export interface ResolvedAim {
  realizedAim: number;
  positiveShare: number;
  karmaYieldFactor: number;
  unaimable: boolean;
  /** How far into each polarity this cohort wanders, 0…1 of a hard detent. */
  negativeReach: number;
  positiveReach: number;
}

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function toDetent(aim: number) {
  return clamp(Math.round(aim), HARDEST_NEGATIVE, HARDEST_POSITIVE) as Detent;
}

class Aim {
  #detent = $state<Detent>(0);
  #reaimedAtPhase = $state<number | undefined>(undefined);

  set(detent: Detent) {
    if (detent === this.#detent) return;

    this.#detent = detent;
    this.#reaimedAtPhase = PlanetManager.getActive()?.progress ?? 0;
  }

  /**
   * The wave is the clock, not elapsed time: an experience-based penalty must
   * not slow the experience that ends it.
   */
  #phasesSinceReaim = $derived.by(() => {
    if (this.#reaimedAtPhase === undefined) return undefined;

    return Math.max(0, (PlanetManager.getActive()?.progress ?? 0) - this.#reaimedAtPhase);
  });

  #reaimPenalty = $derived.by(() => {
    const { reaimPenalty, reaimPhases } = balance.aim;
    const lived = this.#phasesSinceReaim;
    if (lived === undefined || lived >= reaimPhases) return 0;

    return reaimPenalty * (1 - lived / reaimPhases);
  });

  /** Which polarity this phase pays. 0 between worlds, so nothing is pulled. */
  #waveSign() {
    const planet = PlanetManager.getActive();
    if (!planet) return 0;

    return planet.isDense ? -1 : 1;
  }

  /** What the aim pays — the wave and the cohort's own bias, and nothing more. */
  resolve(data: BuildingData, detent: Detent = this.#detent): ResolvedAim {
    const { polarity_bias = 0, polarity_multiplier = 1, resistance = 0 } = data;
    const biasPull = clamp(resistance, 0, 1);
    const centre = detent * (1 - biasPull) + polarity_bias * biasPull;
    const sway = balance.aim.wavePull * biasPull;
    const realizedAim = clamp(centre + sway * this.#waveSign(), HARDEST_NEGATIVE, HARDEST_POSITIVE);
    const unaimable = biasPull >= 1;

    const reach = {
      negativeReach: -clamp(centre - sway, HARDEST_NEGATIVE, 0) / HARDEST_POSITIVE,
      positiveReach: clamp(centre + sway, 0, HARDEST_POSITIVE) / HARDEST_POSITIVE,
    };

    // Beat 6 splits the pile. Before it, there is nothing to aim at.
    if (!progression.runs('negKarma')) {
      return {
        realizedAim: centre,
        positiveShare: 1,
        karmaYieldFactor: 1,
        unaimable,
        negativeReach: 0,
        positiveReach: reach.positiveReach,
      };
    }

    const span = HARDEST_POSITIVE - HARDEST_NEGATIVE;
    const extremity = Math.abs(realizedAim) / HARDEST_POSITIVE;
    const extremityPayoff = 1 + extremity * (polarity_multiplier - 1);

    return {
      realizedAim,
      positiveShare: (realizedAim - HARDEST_NEGATIVE) / span,
      karmaYieldFactor: extremityPayoff * (1 - this.#reaimPenalty),
      unaimable,
      ...reach,
    };
  }

  detentLabel(detent: Detent) {
    return DETENT_LABELS[detent];
  }

  /**
   * Where the needle points, −1…1 of a hard detent — the reaches' own scale, so
   * the dial reads one number for the band and one for the line inside it.
   */
  needleFor({ realizedAim }: ResolvedAim) {
    return realizedAim / HARDEST_POSITIVE;
  }

  /** The row's word. Character, not position — position is the meter beside it. */
  leanFor({ realizedAim, unaimable, negativeReach, positiveReach }: ResolvedAim) {
    if (unaimable) return 'tidal';
    if (negativeReach > 0 && positiveReach > 0) return 'turns';
    if (!negativeReach && !positiveReach) return 'even';

    return DETENT_LABELS[toDetent(realizedAim)].toLowerCase();
  }

  get detent() { return this.#detent; }
  get reaimPenalty() { return this.#reaimPenalty; }

  get phasesOwed() {
    const { reaimPhases } = balance.aim;
    const lived = this.#phasesSinceReaim;
    if (lived === undefined || lived >= reaimPhases) return 0;

    return reaimPhases - lived;
  }
}

export const aim = new Aim();
