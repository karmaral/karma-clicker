import { Experience } from '$lib/resources/experience';
import { BuildingManager, ResourceManager } from '$lib/managers';
import { ResourceEmitter } from '$lib/emission';
import { getExcess } from '$lib/excess';
import { FIRST_HARVEST_CONDITIONS } from '$lib/labels';
import { resolveHarvestDuration, resolveHarvestYields } from './harvest';
import type { FirstHarvestCondition, PlanetData, Polarity, ResourceType } from '$types';

const BIAS_WITH = 1.4;
const BIAS_AGAINST = 0.6;

export default class Planet {
  #id: string;
  #data: PlanetData;
  #experience = new Experience();
  #isHarvested = $state(false);
  #merged = $state(0);
  #alignment = $state<Polarity>(0);
  #emitter = $state<ResourceEmitter>();

  constructor(id: string, initData: PlanetData) {
    this.#id = id;
    this.#data = initData;
  }

  addExperience(amount: number) {
    this.#experience.add(amount);
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
      // Whether the floor is *payable*. Whether it is actually paid depends on
      // the split, which only the harvest screen knows — see `isMergeSufficient`.
      case 'mergeMinimum': {
        return BuildingManager.countSouls() >= threshold;
      }
      default: {
        const unhandled: never = condition;

        return unhandled;
      }
    }
  }

  /**
   * The one-off event that ends the planet. Merged souls stop being yours, and
   * the alignment read here locks what the recurring harvest pays.
   */
  completeFirstHarvest(merged: number, alignment: Polarity) {
    if (this.#isHarvested) return;

    this.#isHarvested = true;
    this.#merged = Math.max(0, Math.trunc(merged));
    this.#alignment = alignment;

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
    return resolveHarvestYields(this.#data.harvest?.yields ?? {}, this.#alignment);
  });

  #harvestDuration = $derived.by(() => {
    const harvest = this.#data.harvest;

    return resolveHarvestDuration(harvest?.duration ?? 0, this.#merged, harvest ?? {});
  });

  #phasesPerAge = $derived.by(() => this.#data.cycles_per_age * 2);

  /**
   * Phase cost grows to keep pace with yields, so phases stay about as long as
   * each other however fast experience comes in. Placeholder ramp.
   */
  #experienceAfter(phases: number) {
    const { phase_multiplier: rate, initial_phase_amount: first } = this.#data;
    if (rate === 1) return first * phases;

    return (first * (rate ** phases - 1)) / (rate - 1);
  }

  #phasesElapsed = $derived.by(() => {
    const { phase_multiplier: rate, initial_phase_amount: first } = this.#data;
    const lived = this.#experience.amount;
    if (rate === 1) return Math.floor(lived / first);

    return Math.floor(Math.log(1 + (lived * (rate - 1)) / first) / Math.log(rate));
  });

  #currentPhases = $derived.by(() => {
    const opened = this.agesLived * this.#phasesPerAge;

    return Array.from({ length: this.#phasesPerAge }, (_, i) => ({
      dense: i % 2 === 1,
      at: this.#experienceAfter(opened + i + 1),
    }));
  });

  #throughPhase = $derived.by(() => {
    const opens = this.#experienceAfter(this.#phasesElapsed);
    const closes = this.#experienceAfter(this.#phasesElapsed + 1);
    const raw = (this.#experience.amount - opens) / (closes - opens);

    return Math.min(1, Math.max(0, raw));
  });

  /** Phases are drawn evenly wide, so the axis is counted in phases, not experience. */
  #positionInAge = $derived.by(() => {
    return (this.phase + this.#throughPhase) / this.#phasesPerAge;
  });

  bias(positive: boolean) {
    return this.isDense === positive ? BIAS_AGAINST : BIAS_WITH;
  }

  get id() { return this.#id; }
  get data() { return this.#data; }
  get experience() { return this.#experience.amount; }
  get isHarvested() { return this.#isHarvested; }
  get merged() { return this.#merged; }
  get alignment() { return this.#alignment; }
  get emitter() { return this.#emitter; }

  /** What one delivery brings, and how long it takes. The ledger's two figures. */
  get harvestYields() { return this.#harvestYields; }
  get harvestDuration() { return this.#harvestDuration; }

  /** The conditions still standing in the way, for the UI to name. */
  get unmetFirstHarvestConditions() { return this.#unmet; }
  get isFirstHarvestReady() { return !this.#isHarvested && this.#unmet.length === 0; }

  /** The toll the world takes for letting you leave. 0 is a world that asks none. */
  get mergeMinimum() { return this.#data.firstHarvest.mergeMinimum ?? 0; }

  isMergeSufficient(merged: number) { return merged >= this.mergeMinimum; }

  get phases() { return this.#currentPhases; }
  get phasesPerAge() { return this.#phasesPerAge; }
  get phase() { return this.#phasesElapsed % this.#phasesPerAge; }
  get isDense() { return this.phase % 2 === 1; }
  get position() { return this.#positionInAge; }
  get agesLived() { return Math.floor(this.#phasesElapsed / this.#phasesPerAge); }

  /** Phases lived since arrival, fractional. The clock anything phase-priced reads. */
  get progress() { return this.#phasesElapsed + this.#throughPhase; }
}
