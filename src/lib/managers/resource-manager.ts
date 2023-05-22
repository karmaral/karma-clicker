import { type Readable, writable, readonly, get } from 'svelte/store';
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
  combinedKarma,
  combinedRed,
  combinedYellow,
  combinedBlue,
} from '$lib/resources';
import type { ResourceType, BaseResourceType } from '$types';
import type Resource from '$lib/resources/base';
import type Building from '$lib/buildings/base';

class ResourceManager {
  subscribe: Readable<this>['subscribe'];
  #set: (value: this) => void;
  #update: (updater: (value: this) => this) => void;

  #resources: Record<string, Resource> = {};
  #effects: Record<string, string[]> = {};
  #conversionTable: Record<BaseResourceType, number>;

  constructor() {
    const store = writable(this);
    const { subscribe } = readonly(store);
    const { set, update } = store;
    this.subscribe = subscribe;
    this.#set = set;
    this.#update = update;

    this.#resources = {
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
    
    this.#conversionTable = {
      'karma': 1,
      'red': 100,
      'yellow': 1500,
      'blue': 7000,
    };

    Object.keys(this.#resources).forEach(type => {
      this.#effects[type] = [];
    });
  }

  getResource(type: ResourceType) {
    if (!Boolean(type in this.#resources)) return;
    return this.#resources[type];
  }
  getTotal(type: ResourceType) {
    if (!Boolean(type in this.#resources)) return;
    const resource = get(this.#resources[type]);
    return resource.total;
  }
  getCombinedTotal(type: BaseResourceType, asReadable = false) {
    let res: Readable<number>;
    switch (type) {
      case 'karma':
        res = combinedKarma;
        break;
      case 'red':
        res = combinedRed; 
        break;
      case 'yellow':
        res = combinedYellow; 
        break;
      case 'blue':
        res = combinedBlue; 
        break;
      default: break;
    }
    return asReadable ? res : get(res);
  }

  getAmount(type: ResourceType) {
    const resource = get(this.#resources[type]);
    return resource.amount;
  }

  has(type: ResourceType, amount?: number) {
    if (!amount) {
      // check if resource unlocked
       return;
    }
    return this.getAmount(type) >= amount;
  }

  add(type: ResourceType, amount: number) {
    const resource = get(this.#resources[type]);
    return resource.add(amount);
  }

  remove(type: ResourceType, amount: number) {
    const resource = get(this.#resources[type]);
    return resource.remove(amount);
  }

  convert(targetType: ResourceType, amount: number) {
    if (targetType.startsWith('karma')) return;
    const [combined, polarity] = targetType.split('_');
    const k = `karma_${polarity}` as ResourceType;

    const cost = this.getConversionCost(combined as BaseResourceType, amount);
    if (this.has(k, cost)) {
      this.remove(k, cost);
      this.add(targetType, amount);
    }
  }
  getConversionCost(targetType: BaseResourceType, amount: number) {
    if (targetType === 'karma') return; // de-conversion is too complex for now
    return amount * this.#conversionTable[targetType];
  }
  getAffordableConversionQuantity(targetType: ResourceType) {
    if (targetType.startsWith('karma')) return;

    let [_combined, polarity] = targetType.split('_');
    const combined = _combined as BaseResourceType;
    const k = `karma_${polarity}` as ResourceType;

    let q = 1;
    let cost = this.getConversionCost(combined, q);

    while (this.has(k, cost)) {
      q++;
      cost = this.getConversionCost(combined, q);
    }
    return q - 1;
  }

  addListener(type: ResourceType, listenerType: string, callback: (detail?: unknown) => void) {
    if (!Boolean(type in this.#resources)) return;
    const resource = get(this.#resources[type]);
    resource.addListener(listenerType, callback);
  }

  removeListener(type: ResourceType, listenerType: string, callback: (detail?: unknown) => void) {
    if (!Boolean(type in this.#resources)) return;
    const resource = get(this.#resources[type]);
    resource.removeListener(listenerType, callback);
  }
}

const manager = new ResourceManager();
export default manager;
