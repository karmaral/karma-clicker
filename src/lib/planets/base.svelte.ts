import { Experience } from '$lib/resources/experience';
import { ResourceManager } from '$lib/managers';
import { ResourceEmitter } from '$lib/emission';
import { getExcess } from '$lib/excess';
import type { FirstHarvestCondition, PlanetData, Polarity, ResourceType } from '$types';

const BIAS_WITH = 1.4;
const BIAS_AGAINST = 0.6;

export default class Planet {
  #id: string;
  #data: PlanetData;
  #experience = new Experience();
  #harvested = $state(false);
  #merged = $state(0);
  #polarity = $state<Polarity>(0);
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
    const { excessGate, agesLived } = this.#data.firstHarvest;
    const unmet: FirstHarvestCondition[] = [];

    if (agesLived !== undefined && this.agesLived < agesLived) {
      unmet.push('agesLived');
    }

    const excess = getExcess();
    if (excessGate !== undefined && (excess === undefined || Math.abs(excess) >= excessGate)) {
      unmet.push('excessGate');
    }

    return unmet;
  });

  /**
   * The one-off event that ends the planet. Merged souls stop being yours, and
   * the polarity read here locks what the recurring harvest pays.
   */
  completeFirstHarvest(merged: number, polarity: Polarity) {
    if (this.#harvested) return;

    this.#harvested = true;
    this.#merged = Math.max(0, Math.trunc(merged));
    this.#polarity = polarity;

    const { yields, duration } = this.#data;
    if (!yields) return;

    this.#emitter = new ResourceEmitter(() => {
      Object.keys(yields).forEach((type: ResourceType) => {
        ResourceManager.add(type, yields[type]);
      });
    }, duration);

    this.#emitter.toggleAutonomy(true);
    this.#emitter.queue();
  }

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
  get harvested() { return this.#harvested; }
  get merged() { return this.#merged; }
  get polarity() { return this.#polarity; }
  get emitter() { return this.#emitter; }

  /** The conditions still standing in the way, for the UI to name. */
  get unmetFirstHarvestConditions() { return this.#unmet; }
  get isFirstHarvestReady() { return !this.#harvested && this.#unmet.length === 0; }

  get phases() { return this.#currentPhases; }
  get phasesPerAge() { return this.#phasesPerAge; }
  get phase() { return this.#phasesElapsed % this.#phasesPerAge; }
  get isDense() { return this.phase % 2 === 1; }
  get position() { return this.#positionInAge; }
  get agesLived() { return Math.floor(this.#phasesElapsed / this.#phasesPerAge); }

  /** Phases lived since arrival, fractional. The clock anything phase-priced reads. */
  get progress() { return this.#phasesElapsed + this.#throughPhase; }
}
