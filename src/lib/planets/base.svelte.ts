import { ResourceManager } from '$lib/managers';
import { ResourceEmitter } from '$lib/emission';
import { getExcess } from '$lib/excess';
import { FIRST_HARVEST_CONDITIONS } from '$lib/labels';
import balance from '$data/balance';
import { resolveHarvestDuration, resolveHarvestYields } from './harvest';
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
  /**
   * Milliseconds of the anchoring job done, across every anchor. One accumulator
   * rather than one per anchor: they fill in order, which is what "next anchor
   * in" means, and each meter is a slice of this.
   */
  #placedMs = $state(0);

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
  completeFirstHarvest({ merged, mergedShare, alignment, rates }: Departure) {
    if (this.#isHarvested) return;

    this.#isHarvested = true;
    this.#merged = Math.max(0, Math.trunc(merged));
    this.#mergedShare = Math.max(0, Math.min(1, mergedShare));
    this.#alignment = alignment;
    this.#rates = rates;

    if (!this.#data.harvest) return;

    // A getter, not the figure: the emitter re-queues itself and asks again.
    this.#emitter = new ResourceEmitter(() => this.#payHarvest(), () => this.#harvestDuration);

    this.#emitter.toggleAutonomy(true);
    this.#emitter.queue();
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
    return resolveHarvestYields(this.#data.harvest?.yields ?? {}, this.#alignment, this.#rates);
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
  place(ms: number) {
    if (ms <= 0 || this.#isHarvested) return;

    this.#placedMs = Math.min(this.#anchorJob, this.#placedMs + ms);
  }

  #anchoring = $derived.by(() => this.#data.anchoring);

  /** The whole job, in ms. 0 on a world that asks for no anchors. */
  #anchorJob = $derived.by(() => {
    const anchoring = this.#anchoring;

    return anchoring ? anchoring.anchors * anchoring.duration : 0;
  });

  #anchorsPlaced = $derived.by(() => {
    const anchoring = this.#anchoring;

    return anchoring ? Math.floor(this.#placedMs / anchoring.duration) : 0;
  });

  /** One flag per anchor the world asks for — what `Anchors` draws. */
  #anchored = $derived.by(() => {
    const asked = this.#anchoring?.anchors ?? 0;

    return Array.from({ length: asked }, (_, i) => i < this.#anchorsPlaced);
  });

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
    return this.isDense === positive ? balance.wave.biasAgainst : balance.wave.biasWith;
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
    const { biasWith, biasAgainst } = balance.wave;

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
   * The anchoring readout, all of it in job-ms. `anchorRemaining` is what is
   * left of the one in progress — the harness divides it by its speed to get a
   * countdown, because only the harness knows how fast the job is running.
   */
  get anchorsAsked() { return this.#anchoring?.anchors ?? 0; }
  get anchorsPlaced() { return Math.min(this.#anchorsPlaced, this.anchorsAsked); }
  get anchorDuration() { return this.#anchoring?.duration ?? 0; }
  get anchorBonus() { return this.#anchoring?.bonusPerAnchor ?? 0; }
  get anchored() { return this.#anchored; }

  /** How far into the one being placed, 0…1. Full once the last one is in. */
  get anchorFill() {
    if (!this.anchorDuration) return 1;
    if (this.#placedMs >= this.#anchorJob) return 1;

    return (this.#placedMs % this.anchorDuration) / this.anchorDuration;
  }

  get anchorRemaining() { return this.anchorDuration * (1 - this.anchorFill); }

  /** A world with nothing to anchor is never anchoring, and never anchored. */
  get isAnchoring() { return !this.#isHarvested && this.anchorsPlaced < this.anchorsAsked; }
  get isAnchored() { return this.anchorsAsked > 0 && this.anchorsPlaced >= this.anchorsAsked; }

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
