import { tick } from 'svelte';
import type { ResourceType, UpgradeData } from '$types';
import data from '$data/upgrades';
import texts from '$data/upgrades-texts';
import { ResourceManager, BuildingManager, NotificationManager } from '$lib/managers';

const upgradeMap: Record<string, Record<string, UpgradeData>> = {};
Object.keys(data).forEach((name) => {
  upgradeMap[name] = {};
  data[name].forEach((upg) => {
    upgradeMap[name][upg.id] = upg;
  });
});

class UpgradeManager {
  #upgrades: Record<string, string[]> = $state(
    Object.fromEntries(Object.keys(data).map((name) => [name, []])),
  );

  isLocked(target: string, id: string) {
    if (!Boolean(target in this.#upgrades)) return;

    const item = upgradeMap[target][id];
    if (!item) return;

    const { unlock_type, unlocks_at } = item;

    return ResourceManager.getTotal(unlock_type) < unlocks_at;
  }

  isAcquired(target: string, id: string) {
    if (!Boolean(target in this.#upgrades)) return;

    return this.#upgrades[target].includes(id);
  }

  purchase(target: string, id: string) {
    if (!Boolean(target in this.#upgrades)) return;
    if (this.#upgrades[target].includes(id)) return;

    const item = upgradeMap[target][id];
    if (!item) return;

    const { cost, cost_type } = item;
    if (ResourceManager.getAmount(cost_type) < cost) return;

    ResourceManager.remove(cost_type, cost);
    this.acquire(target, id);

    return true;
  }

  acquire(target: string, id: string) {
    if (!Boolean(target in this.#upgrades)) return;
    if (this.#upgrades[target].includes(id)) return;

    const item = upgradeMap[target][id];
    if (!item) return;

    NotificationManager.notify(texts[target][id]);
    this.#upgrades[target].push(id);

    const { effect, effect_target } = item;
    if (effect) {
      this.#handleEffect(target, effect, effect_target);
    }
  }

  async #handleEffect(target: string, effect: string | string[], effectTarget?: ResourceType | 'all') {
    const effectArr = Array.isArray(effect) ? effect : [effect];

    for (const e of effectArr) {
      this.#processEffect(target, e, effectTarget);
      await tick();
    }
  }

  #processEffect(target: string, effect: string, effectTarget?: ResourceType | 'all') {
    if (!Boolean(target in this.#upgrades)) return;

    const building = BuildingManager.getBuilding(target);

    switch (effect) {
      case 'unlock':
        return BuildingManager.unlock(target);
      case 'acquire':
        return BuildingManager.acquire(target);
      case 'autonomy':
        return building.toggleAutonomy(true);
      default: break;
    }

    if (!effect.includes('unitYield') || !effectTarget) return;

    if (effectTarget === 'all') {
      Object.keys(building.production).forEach((resource: ResourceType) => {
        const unitYield = building.production[resource];
        building.updateProduction(resource, eval(effect.replace('unitYield', `${unitYield}`)));
      });

      return;
    }

    const unitYield = building.production[effectTarget];
    building.updateProduction(effectTarget, eval(effect.replace('unitYield', String(unitYield))));
  }

  get upgrades() {
    return this.#upgrades;
  }
}

const manager = new UpgradeManager();
export default manager;
