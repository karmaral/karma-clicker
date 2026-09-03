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

/**
 * One global dial, and every cohort does exactly as it is told — see
 * `docs/design.md` §6. No per-cohort figures any more: duration alone carries
 * a cohort's identity, by how much of the wave its life spans (`biasBetween` on
 * `Planet`), not by anything read here.
 */
export interface ResolvedAim {
  positiveShare: number;
  karmaYieldFactor: number;
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

  /**
   * What the aim pays — every cohort does exactly as it is told. `extremity`
   * is the whole reward for committing: at Even it pays ×1, at a hard detent
   * ×`extremityMultiplier`. See `docs/design.md` §6.
   */
  resolve(detent: Detent = this.#detent): ResolvedAim {
    // Beat 6 splits the pile. Before it, there is nothing to aim at.
    if (!progression.runs('negKarma')) {
      return { positiveShare: 1, karmaYieldFactor: 1 };
    }

    const span = HARDEST_POSITIVE - HARDEST_NEGATIVE;
    const extremity = Math.abs(detent) / HARDEST_POSITIVE;
    const extremityPayoff = 1 + extremity * (balance.aim.extremityMultiplier - 1);

    return {
      positiveShare: (detent - HARDEST_NEGATIVE) / span,
      karmaYieldFactor: extremityPayoff * (1 - this.#reaimPenalty),
    };
  }

  detentLabel(detent: Detent) {
    return DETENT_LABELS[detent];
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
