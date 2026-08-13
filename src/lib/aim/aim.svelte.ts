import type { BuildingData } from '$types';
import { PlanetManager } from '$lib/managers';
import { progression } from '$lib/progression';
import { noise } from './noise';

export const DETENTS = [-2, -1, 0, 1, 2] as const;
export type Detent = (typeof DETENTS)[number];

const HARDEST_NEGATIVE = DETENTS[0];
const HARDEST_POSITIVE = DETENTS[DETENTS.length - 1];

const DRIFT_DETENTS = 0.55;
const DRIFT_MS_PER_LATTICE_UNIT = 9_000;

const REAIM_PENALTY = 0.65;
const REAIM_PHASES = 2;

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
  #driftClock = $state(0);
  #reaimedAtPhase = $state<number | undefined>(undefined);

  set(detent: Detent) {
    if (detent === this.#detent) return;

    this.#detent = detent;
    this.#reaimedAtPhase = PlanetManager.getActive()?.progress ?? 0;
  }

  /** Driven by the loop, so drift is one clock the UI and the payout share. */
  tick() {
    this.#driftClock = Date.now();
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
    const lived = this.#phasesSinceReaim;
    if (lived === undefined || lived >= REAIM_PHASES) return 0;

    return REAIM_PENALTY * (1 - lived / REAIM_PHASES);
  });

  #driftFor(id: string, biasPull: number) {
    if (!biasPull) return 0;

    const t = this.#driftClock / DRIFT_MS_PER_LATTICE_UNIT;

    return noise(id, t) * DRIFT_DETENTS * biasPull;
  }

  /** What the aim pays right now, drift and all. The payout reads this. */
  resolve(id: string, data: BuildingData): ResolvedAim {
    return this.#resolve(id, data, this.#detent, true);
  }

  /**
   * The same without drift, so a figure on screen does not churn every tick —
   * the meter beside it already carries the wander as a band. `detent` prices an
   * aim you have not set, which is how the row reads itself against Even.
   */
  resolveSettled(id: string, data: BuildingData, detent: Detent = this.#detent): ResolvedAim {
    return this.#resolve(id, data, detent, false);
  }

  #resolve(id: string, data: BuildingData, detent: number, drifting: boolean): ResolvedAim {
    const { polarity_bias = 0, polarity_multiplier = 1, resistance = 0 } = data;
    const biasPull = clamp(resistance, 0, 1);
    const settledAim = detent * (1 - biasPull) + polarity_bias * biasPull;
    const drifted = drifting ? settledAim + this.#driftFor(id, biasPull) : settledAim;
    const realizedAim = clamp(drifted, HARDEST_NEGATIVE, HARDEST_POSITIVE);
    const unaimable = biasPull >= 1;
    const wander = DRIFT_DETENTS * biasPull;

    const reach = {
      negativeReach: -clamp(settledAim - wander, HARDEST_NEGATIVE, 0) / HARDEST_POSITIVE,
      positiveReach: clamp(settledAim + wander, 0, HARDEST_POSITIVE) / HARDEST_POSITIVE,
    };

    // Beat 6 splits the pile. Before it, there is nothing to aim at.
    if (!progression.runs('negKarma')) {
      return {
        realizedAim: settledAim,
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

  /** The row's word. Character, not position — position is the meter beside it. */
  leanFor({ realizedAim, unaimable, negativeReach, positiveReach }: ResolvedAim) {
    if (unaimable) return 'unpredictable';
    if (negativeReach > 0 && positiveReach > 0) return 'risky';
    if (!negativeReach && !positiveReach) return 'even';

    return DETENT_LABELS[toDetent(realizedAim)].toLowerCase();
  }

  get detent() { return this.#detent; }
  get reaimPenalty() { return this.#reaimPenalty; }

  get phasesOwed() {
    const lived = this.#phasesSinceReaim;
    if (lived === undefined || lived >= REAIM_PHASES) return 0;

    return REAIM_PHASES - lived;
  }
}

export const aim = new Aim();
