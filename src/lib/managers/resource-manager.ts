import { experience, wisdom, negKarma, posKarma, negRed, posRed, yellow, blue } from '$lib/resources';
import type { ResourceType } from '$types';
import type Resource from '$lib/resources/base.svelte';
import type { ResourceSnapshot } from '$lib/resources/base.svelte';

class ResourceManager {
  #resources: Record<string, Resource> = {
    'experience': experience,
    'wisdom': wisdom,
    'karma_negative': negKarma,
    'karma_positive': posKarma,
    'red_negative': negRed,
    'red_positive': posRed,
    'yellow': yellow,
    'blue': blue,
  };

  getResource(type: ResourceType) {
    return this.#resources[type];
  }

  getTotal(type: ResourceType) {
    return this.#resources[type]?.total ?? 0;
  }

  getAmount(type: ResourceType) {
    return this.#resources[type]?.amount ?? 0;
  }

  has(type: ResourceType, amount?: number) {
    if (!amount) return;

    return this.getAmount(type) >= amount;
  }

  add(type: ResourceType, amount: number) {
    return this.#resources[type]?.add(amount);
  }

  remove(type: ResourceType, amount: number) {
    return this.#resources[type]?.remove(amount);
  }

  snapshot(): Record<string, ResourceSnapshot> {
    return Object.fromEntries(
      Object.entries(this.#resources).map(([type, resource]) => [type, resource.snapshot()]),
    );
  }

  /** Silent — a type the save does not name keeps whatever the fresh graph gave it. */
  restore(snapshot: Record<string, ResourceSnapshot>) {
    Object.entries(snapshot).forEach(([type, figures]) => {
      this.#resources[type]?.restore(figures);
    });
  }

  addListener(type: ResourceType, listenerType: string, callback: (detail?: Record<string, unknown>) => void) {
    this.#resources[type]?.addListener(listenerType, callback);
  }

  removeListener(type: ResourceType, listenerType: string, callback: (detail?: Record<string, unknown>) => void) {
    this.#resources[type]?.removeListener(listenerType, callback);
  }
}

const manager = new ResourceManager();
export default manager;
