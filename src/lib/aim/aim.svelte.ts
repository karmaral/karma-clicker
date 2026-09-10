import { PlanetManager } from '$lib/managers';
import { progression } from '$lib/progression';
import { clamp } from '$lib/utils';
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

/** `reaimedAtPhase` is in the active world's progress units, not wall-clock. */
export interface AimSnapshot {
  detent: Detent;
  reaimedAtPhase: number | undefined;
}

class Aim {
  #detent = $state<Detent>(0);
  #reaimedAtPhase = $state<number | undefined>(undefined);

  /**
   * Where the dial is pointed but not yet committed. `undefined` is *no
   * decision pending*, not Even — the two are different, and only one costs.
   * Never saved: a draft surviving a reload is a decision nobody made.
   */
  #draft = $state<Detent | undefined>(undefined);

  /** Commits. Dragging a slider through this is what the draft exists to stop. */
  set(detent: Detent) {
    if (detent === this.#detent) return;

    this.#detent = detent;
    this.#reaimedAtPhase = PlanetManager.getActive()?.progress ?? 0;
  }

  /** Points the dial. Free — the penalty is bought by `confirm`, once. */
  aimAt(detent: Detent) {
    this.#draft = detent === this.#detent ? undefined : detent;
  }

  confirm() {
    if (this.#draft === undefined) return;

    this.set(this.#draft);
    this.#draft = undefined;
  }

  cancel() {
    this.#draft = undefined;
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
    // Beat 6 splits the pile. Before it, there is nothing to aim at — and
    // nothing to floor either: there is no negative pile yet to keep breathing.
    if (!progression.runs('negKarma')) {
      return { positiveShare: 1, karmaYieldFactor: 1 };
    }

    const span = HARDEST_POSITIVE - HARDEST_NEGATIVE;
    const extremity = Math.abs(detent) / HARDEST_POSITIVE;
    const extremityPayoff = 1 + extremity * (balance.aim.extremityMultiplier - 1);
    const floor = balance.aim.shortPileFloor;

    return {
      // Clamped off both ends: a hard detent used to land on exactly 0 or 1,
      // which starves the refinery for good. See `shortPileFloor`.
      positiveShare: clamp((detent - HARDEST_NEGATIVE) / span, floor, 1 - floor),
      karmaYieldFactor: extremityPayoff * (1 - this.#reaimPenalty),
    };
  }

  detentLabel(detent: Detent) {
    return DETENT_LABELS[detent];
  }

  /** Past `set`, which would stamp the mark with *now* and re-owe the penalty. */
  restore({ detent, reaimedAtPhase }: AimSnapshot) {
    this.#detent = detent;
    this.#reaimedAtPhase = reaimedAtPhase;
    this.#draft = undefined;
  }

  snapshot(): AimSnapshot {
    return { detent: this.#detent, reaimedAtPhase: this.#reaimedAtPhase };
  }

  get detent() { return this.#detent; }
  get draft() { return this.#draft; }
  get isPending() { return this.#draft !== undefined; }
  get reaimPenalty() { return this.#reaimPenalty; }
  get reaimPhases() { return balance.aim.reaimPhases; }

  /**
   * When the penalty runs out, in the world's progress units — what the wave
   * draws its settle line at. `undefined` once there is nothing left to owe.
   */
  get reaimEndsAt() {
    if (this.#reaimedAtPhase === undefined || this.#reaimPenalty === 0) return undefined;

    return this.#reaimedAtPhase + balance.aim.reaimPhases;
  }

  get phasesOwed() {
    const { reaimPhases } = balance.aim;
    const lived = this.#phasesSinceReaim;
    if (lived === undefined || lived >= reaimPhases) return 0;

    return reaimPhases - lived;
  }
}

export const aim = new Aim();
