import { ResourceManager } from '$lib/managers';
import { ResourceEmitter } from '$lib/emission';
import { getExcess } from '$lib/excess';
import { getWaveBias } from '$lib/wave';
import { FIRST_HARVEST_CONDITIONS } from '$lib/labels';
import balance from '$data/balance';
import { resolveDemandBonus, resolveHarvestDuration, resolveHarvestYields } from './harvest';
import type {
  FirstHarvestCondition, HarvestRates, PlanetData, Polarity, ResourceType,
} from '$types';

/**
 * What leaving is worth, all of it read before a single soul goes. Merging
 * destroys both the count and the income, and the harvest is paid for both — so
 * they are gathered once, by whoever is doing the merging, and handed over.
 */
export interface Departure {
  /** Souls left with the world, and what share of the army they were. */
  merged: number;
  mergedShare: number;
  alignment: Polarity;
  rates: HarvestRates;
  /**
   * What the anchors were worth, read on the way out and kept forever. The
   * anchors stay on the world; the riders leave with you — so this is the
   * nominal per-anchor sum with no coverage cut, unlike the living multiplier.
   * 1 on a world you never anchored.
   */
  anchorBonus: number;
}

/** Everything a world holds that the data file does not. What a save writes. */
export interface PlanetSnapshot extends Departure {
  livedMs: number;
  isHarvested: boolean;
  placedMs: number;
  bankedMs: number;
  isAnchorJobActive: boolean;
  /**
   * The demand's running tally, and what it settled at. Both sums travel rather
   * than the share alone — a world is saved mid-stay far more often than it is
   * saved at the harvest, and a ratio cannot be added to.
   */
  demandedKarma: number;
  earnedKarma: number;
  demandBonus: number;
}

/** The wave's marker steps once per this many ms of world time — a second hand. */
const POSITION_STEP_MS = 1000;

export default class Planet {
  #id: string;
  #data: PlanetData;
  /** Time spent standing on this world, in ms. The wave is nothing but this. */
  #livedMs = $state(0);
  #isHarvested = $state(false);
  /** The count is for reading; the share is what the clock runs on. */
  #merged = $state(0);
  #mergedShare = $state(0);
  #alignment = $state<Polarity>(0);
  #rates = $state<HarvestRates>({});
  #emitter = $state<ResourceEmitter>();
  #anchorBonusAtDeparture = $state(1);
  /**
   * Karma earned on this world, and how much of it went where the world asked.
   * Accumulated over the whole stay because the harvest's own reading cannot
   * carry a demand: `excessGate` forces it near even by construction, so the
   * door and the demand would be fighting over one number. See §14.
   */
  #demandedKarma = $state(0);
  #earnedKarma = $state(0);
  #demandBonusAtDeparture = $state(1);
  /**
   * Milliseconds of the anchoring job done, across every anchor. One accumulator
   * rather than one per anchor: they fill in order, which is what "next anchor
   * in" means, and each meter is a slice of this.
   */
  #placedMs = $state(0);

  /**
   * Of that, what a finished job already banked — the floor a cancel returns to.
   * A job forfeits its own work and never a closed one's: capacity bought after
   * a world is fully anchored re-offers it, and giving *that* offer back must
   * not pull anchors you finished paying for two upgrades ago.
   */
  #bankedMs = $state(0);

  /**
   * Whether you took this world's offer. Anchoring is opt-in, so a world with
   * slots is not a world being anchored — `Harness` reads this before it places
   * anything, and cancelling puts it back with the job.
   *
   * **Active, not running.** `Harness` has an `isRunning` of its own, meaning the
   * system's clock is on from the beat; this is per-world and means you chose it.
   */
  #isAnchorJobActive = $state(false);

  constructor(id: string, initData: PlanetData) {
    this.#id = id;
    this.#data = initData;
  }

  /**
   * Real elapsed ms, only while this is the world you are on. A harvested world
   * stops ageing: its wave froze where you left it, which is what the Overview
   * should read. Unclamped, like the harness — a backgrounded tab still spent
   * the time, and the wave is the one clock nothing can be bought to hurry.
   */
  advance(ms: number) {
    if (ms <= 0 || this.#isHarvested) return;

    this.#livedMs += ms;
  }

  /**
   * Every karma payout made while standing here, split as the aim and the wave
   * left it. Both piles count towards the total: the demand asks what share of
   * what you earned went its way, not how much of it there was.
   */
  recordKarma(positive: number, negative: number) {
    const earned = positive + negative;
    if (this.#isHarvested || !(earned > 0)) return;

    this.#earnedKarma += earned;

    const wants = this.#data.demand?.wants;
    if (!wants) return;

    this.#demandedKarma += wants > 0 ? positive : negative;
  }

  /**
   * What the world asked for, met so far. Half with nothing earned and half with
   * nothing asked — both are the neutral reading, and both pay ×1.
   */
  get matchShare() {
    if (!this.#data.demand?.wants || !(this.#earnedKarma > 0)) return 0.5;

    return this.#demandedKarma / this.#earnedKarma;
  }

  /** What the demand is paying right now. Locked at departure like the anchors. */
  get demandBonus() { return resolveDemandBonus(this.#data.demand, this.matchShare); }

  get demand() { return this.#data.demand; }
  get demandBonusAtDeparture() { return this.#demandBonusAtDeparture; }

  /** Every condition the planet imposes that is not met yet. Empty means go. */
  #unmet = $derived.by(() => {
    const required = this.#data.firstHarvest;

    return FIRST_HARVEST_CONDITIONS.filter((condition) => {
      const threshold = required[condition];
      if (threshold === undefined) return false;

      return !this.#isConditionMet(condition, threshold);
    });
  });

  /** A condition a planet does not declare is not a condition, so absence is not met. */
  #isConditionMet(condition: FirstHarvestCondition, threshold: number): boolean {
    switch (condition) {
      case 'agesLived': {
        return this.agesLived >= threshold;
      }
      case 'excessGate': {
        const excess = getExcess();

        return excess !== undefined && Math.abs(excess) < threshold;
      }
      default: {
        const unhandled: never = condition;

        return unhandled;
      }
    }
  }

  /**
   * The one-off event that ends the planet. Merged souls stop being yours, and
   * both readings taken on the way out — the alignment and the income — lock
   * what the recurring harvest pays, forever.
   */
  completeFirstHarvest({ merged, mergedShare, alignment, rates, anchorBonus }: Departure) {
    if (this.#isHarvested) return;

    this.#isHarvested = true;
    this.#merged = Math.max(0, Math.trunc(merged));
    this.#mergedShare = Math.max(0, Math.min(1, mergedShare));
    this.#alignment = alignment;
    this.#rates = rates;
    this.#anchorBonusAtDeparture = Math.max(1, anchorBonus);
    // The whole stay, not the instant. Locked for the same reason the anchors
    // are: what the world paid for is what you did while you were on it.
    this.#demandBonusAtDeparture = this.demandBonus;

    this.#armHarvest();
  }

  /**
   * The recurring harvest's clock. Its own step because a load has to reach it
   * too: the emitter lives nowhere but here, and a harvested world restored
   * without it is a finished world that pays nothing and looks fine doing it.
   */
  #armHarvest() {
    if (!this.#data.harvest) return;

    // A getter, not the figure: the emitter re-queues itself and asks again.
    this.#emitter = new ResourceEmitter(() => this.#payHarvest(), () => this.#harvestDuration);

    this.#emitter.toggleAutonomy(true);
    this.#emitter.queue();
  }

  snapshot(): PlanetSnapshot {
    return {
      livedMs: this.#livedMs,
      isHarvested: this.#isHarvested,
      merged: this.#merged,
      mergedShare: this.#mergedShare,
      alignment: this.#alignment,
      rates: $state.snapshot(this.#rates),
      anchorBonus: this.#anchorBonusAtDeparture,
      placedMs: this.#placedMs,
      bankedMs: this.#bankedMs,
      isAnchorJobActive: this.#isAnchorJobActive,
      demandedKarma: this.#demandedKarma,
      earnedKarma: this.#earnedKarma,
      demandBonus: this.#demandBonusAtDeparture,
    };
  }

  /** The fields, then the clock. Never `completeFirstHarvest` — that one merges souls. */
  restore(state: PlanetSnapshot) {
    this.#livedMs = state.livedMs;
    this.#isHarvested = state.isHarvested;
    this.#merged = state.merged;
    this.#mergedShare = state.mergedShare;
    this.#alignment = state.alignment;
    this.#rates = state.rates;
    this.#anchorBonusAtDeparture = state.anchorBonus;
    this.#placedMs = state.placedMs;
    this.#bankedMs = state.bankedMs;
    this.#isAnchorJobActive = state.isAnchorJobActive;
    this.#demandedKarma = state.demandedKarma;
    this.#earnedKarma = state.earnedKarma;
    this.#demandBonusAtDeparture = state.demandBonus;

    if (this.#isHarvested) this.#armHarvest();
  }

  /**
   * Into the piles and nowhere else. A finished world does not feed the world
   * you are standing on — its experience buys progression, not somebody's phases.
   */
  #payHarvest() {
    const yields = this.#harvestYields;

    Object.keys(yields).forEach((type: ResourceType) => {
      ResourceManager.add(type, yields[type]);
    });
  }

  #harvestYields = $derived.by(() => {
    return resolveHarvestYields(
      this.#data.harvest?.yields ?? {},
      this.#alignment,
      this.#rates,
      { anchorBonus: this.#anchorBonusAtDeparture, demandBonus: this.#demandBonusAtDeparture },
    );
  });

  #harvestDuration = $derived.by(() => {
    const harvest = this.#data.harvest;

    return resolveHarvestDuration(harvest?.duration ?? 0, this.#mergedShare, harvest ?? {});
  });

  /**
   * Job-time, not real time. What souls and hands buy is a *rate* on this — see
   * `Harness` — so a split dragged mid-anchor moves the countdown and never the
   * fill: work done is work done.
   */
  place(ms: number, jobMs: number) {
    if (ms <= 0 || this.#isHarvested || !this.#isAnchorJobActive) return;

    this.#placedMs = Math.min(jobMs, this.#placedMs + ms);
  }

  /** Taking the world up on its offer. Costless — what it costs is the souls it holds. */
  beginAnchorJob() {
    if (this.#isHarvested || !this.anchorSlots) return;

    this.#isAnchorJobActive = true;
  }

  /**
   * And giving it back. This job's own work is forfeit — the anchors it was
   * part-way through come out with the harness, so there is no half-anchored
   * slot to bank. A job resumed from a saved fraction would make cancelling
   * free, which is the one thing it must not be.
   *
   * Back to `#bankedMs` rather than to zero: what a *closed* job put down is
   * not this one's to lose.
   */
  cancelAnchorJob() {
    this.#isAnchorJobActive = false;
    this.#placedMs = this.#bankedMs;
  }

  /**
   * Spent, not given back — the anchors stay down and bank at what they reached.
   * Consent is per offer: a job left open past its last anchor would restart
   * itself the moment an upgrade widened the world, and holding souls on a
   * phase nobody re-entered is the one thing taking the offer is supposed to
   * be. `Harness` calls it, because only the rig knows when the job is done.
   */
  closeAnchorJob() {
    this.#isAnchorJobActive = false;
    this.#bankedMs = this.#placedMs;
  }

  #anchoring = $derived.by(() => this.#data.anchoring);

  #phasesPerAge = $derived.by(() => this.#data.cycles_per_age * 2);

  /**
   * Every phase is the same length, so the wave is a clock and not a second
   * reading of your income. It used to be priced in experience on a geometric
   * ramp, which made phases logarithmic in a stock the player multiplies: a
   * tenfold income bought a fixed number of phases outright, and a world's
   * length depended on how good the run before it had been. See
   * progression.md, *The wave is a clock*.
   */
  #phaseMs = $derived.by(() => Math.max(1, this.#data.phase_duration));

  #phasesElapsed = $derived.by(() => Math.floor(this.#livedMs / this.#phaseMs));

  #currentPhases = $derived.by(() => {
    const opened = this.agesLived * this.#phasesPerAge;

    return Array.from({ length: this.#phasesPerAge }, (_, i) => ({
      dense: i % 2 === 1,
      /** When it closes, as ms lived on this world. */
      at: (opened + i + 1) * this.#phaseMs,
    }));
  });

  #throughPhase = $derived.by(() => (this.#livedMs % this.#phaseMs) / this.#phaseMs);

  /**
   * `#throughPhase`, stepped to whole seconds. The wave is a clock, so its
   * marker should read as one — a second hand, not a glide — but the payout
   * `#throughPhase` feeds (through `progress`) stays continuous, so a stepped
   * marker never puts a visible stair in the re-aim penalty. See
   * progression.md, *The wave is a clock*.
   */
  #displayThroughPhase = $derived.by(() => {
    const steppedMs = Math.floor((this.#livedMs % this.#phaseMs) / POSITION_STEP_MS) * POSITION_STEP_MS;

    return steppedMs / this.#phaseMs;
  });

  /** Phases are drawn evenly wide, so the axis is counted in phases, not experience. */
  #positionInAge = $derived.by(() => {
    return (this.phase + this.#displayThroughPhase) / this.#phasesPerAge;
  });

  bias(positive: boolean) {
    const { biasWith, biasAgainst } = getWaveBias();

    return this.isDense === positive ? biasAgainst : biasWith;
  }

  /**
   * Ms spent in a dense phase, from world arrival to `t`. A closed form over the
   * square wave rather than a loop: dense is the second half of every `2 ×
   * phaseMs` period, regardless of age boundaries — `phasesPerAge` is always
   * even, so it never shifts which half of the period is dense. See
   * `docs/design.md` §6, *The phase bias*.
   */
  #denseMsBefore(t: number) {
    const p = this.#phaseMs;
    const period = 2 * p;

    return Math.floor(t / period) * p + Math.max(0, (t % period) - p);
  }

  /**
   * A life accumulates the phase bias across its whole span, not the instant it
   * pays out — a one-second life takes one phase's bias whole, a 128-second life
   * averages several. `bias()` above is the instantaneous case this generalises;
   * a zero-length span (a click) falls back to it. See `docs/design.md` §6.
   */
  biasBetween(fromLived: number, toLived: number, positive: boolean) {
    const span = toLived - fromLived;
    if (!(span > 0)) return this.bias(positive);

    const denseShare = (this.#denseMsBefore(toLived) - this.#denseMsBefore(fromLived)) / span;
    const { biasWith, biasAgainst } = getWaveBias();

    return positive
      ? (1 - denseShare) * biasWith + denseShare * biasAgainst
      : (1 - denseShare) * biasAgainst + denseShare * biasWith;
  }

  get id() { return this.#id; }
  get data() { return this.#data; }
  get isHarvested() { return this.#isHarvested; }
  get merged() { return this.#merged; }
  get mergedShare() { return this.#mergedShare; }
  get alignment() { return this.#alignment; }
  get emitter() { return this.#emitter; }

  /** What one delivery brings, and how long it takes. The ledger's two figures. */
  get harvestYields() { return this.#harvestYields; }
  get harvestDuration() { return this.#harvestDuration; }

  /**
   * The world's whole offer, and nothing about what you can take of it. How many
   * slots you actually fill is capped by the rig, so the arithmetic — placed,
   * fill, remaining, whether the job is done — lives on `Harness`, which is the
   * only thing that knows both halves.
   */
  get anchorSlots() { return this.#anchoring?.anchors ?? 0; }
  get anchorDuration() { return this.#anchoring?.duration ?? 0; }
  get anchorBonus() { return this.#anchoring?.bonusPerAnchor ?? 0; }

  /** Job-ms done, for the harness to slice into anchors. */
  get placedMs() { return this.#placedMs; }

  /** Job-ms a cancel would keep — what closed jobs banked. The harness names it in anchors. */
  get bankedMs() { return this.#bankedMs; }
  get isAnchorJobActive() { return this.#isAnchorJobActive; }

  /** What the anchors were worth when you left. 1 until you do. */
  get anchorBonusAtDeparture() { return this.#anchorBonusAtDeparture; }

  /** The conditions still standing in the way, for the UI to name. */
  get unmetFirstHarvestConditions() { return this.#unmet; }
  get isFirstHarvestReady() { return !this.#isHarvested && this.#unmet.length === 0; }

  /**
   * The toll, as a share of the army. 0 is a world that asks none. Not one of
   * the first-harvest conditions: a share is always payable, so it is the merge
   * slider's floor and never a door — see `PlanetFirstHarvest`.
   */
  get mergeMinimum() { return this.#data.firstHarvest.mergeMinimum ?? 0; }

  isMergeSufficient(mergedShare: number) { return mergedShare >= this.mergeMinimum; }

  /** What the world is worth in wall-clock, and how far in you are. Both in ms. */
  get lived() { return this.#livedMs; }
  get phaseDuration() { return this.#phaseMs; }

  /**
   * Ms left in the phase you are standing in. Off `#displayThroughPhase` and not
   * the raw one, so the figure steps with the marker rather than against it.
   */
  get phaseRemaining() { return this.#phaseMs * (1 - this.#displayThroughPhase); }

  get length() { return this.#data.ages * this.#phasesPerAge * this.#phaseMs; }

  get phases() { return this.#currentPhases; }
  get phasesPerAge() { return this.#phasesPerAge; }
  get phase() { return this.#phasesElapsed % this.#phasesPerAge; }
  get isDense() { return this.phase % 2 === 1; }
  get position() { return this.#positionInAge; }
  get agesLived() { return Math.floor(this.#phasesElapsed / this.#phasesPerAge); }

  /** Phases lived since arrival, fractional. The clock anything phase-priced reads. */
  get progress() { return this.#phasesElapsed + this.#throughPhase; }
}
