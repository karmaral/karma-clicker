import {
  experience,
  negKarma,
  posKarma,
  negRed,
  negYellow,
  negBlue,
  posRed,
  posYellow,
  posBlue,
} from '$lib/resources';
import type { ResourceType, CombinedResourceType } from '$types';
import type Resource from '$lib/resources/base.svelte';

class ResourceManager {
  #resources: Record<string, Resource> = {
    'experience': experience,
    'karma_negative': negKarma,
    'karma_positive': posKarma,
    'red_negative': negRed,
    'yellow_negative': negYellow,
    'blue_negative': negBlue,
    'red_positive': posRed,
    'yellow_positive': posYellow,
    'blue_positive': posBlue,
  };

  #conversionTable: Record<CombinedResourceType, number> = {
    'karma': 1,
    'red': 100,
    'yellow': 1500,
    'blue': 7000,
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

  getCombinedTotal(type: CombinedResourceType) {
    return this.getAmount(`${type}_negative` as ResourceType)
      + this.getAmount(`${type}_positive` as ResourceType);
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

  convert(targetType: ResourceType, amount: number) {
    if (targetType.startsWith('karma')) return;

    const [combined, polarity] = targetType.split('_');
    const k = `karma_${polarity}` as ResourceType;

    const cost = this.getConversionCost(combined as CombinedResourceType, amount);
    if (this.has(k, cost)) {
      this.remove(k, cost);
      this.add(targetType, amount);
    }
  }

  getConversionCost(targetType: CombinedResourceType, amount: number) {
    if (targetType === 'karma') return; // de-conversion is too complex for now

    return amount * this.#conversionTable[targetType];
  }

  getAffordableConversionQuantity(targetType: ResourceType) {
    if (targetType.startsWith('karma')) return;

    const [_combined, polarity] = targetType.split('_');
    const combined = _combined as CombinedResourceType;
    const k = `karma_${polarity}` as ResourceType;

    let q = 1;
    let cost = this.getConversionCost(combined, q);

    while (this.has(k, cost)) {
      q++;
      cost = this.getConversionCost(combined, q);
    }

    return q - 1;
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
