import { tick } from 'svelte';
import type { Effect, UpgradeData, YieldType } from '$types';
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

    if (item.effect) {
      this.#handleEffect(target, item);
    }
  }

  async #handleEffect(target: string, item: UpgradeData) {
    const { id, effect, effect_target } = item;
    const effects = Array.isArray(effect) ? effect : [effect];

    for (const [index, entry] of effects.entries()) {
      this.#processEffect(target, `${id}:${index}`, entry, effect_target);
      await tick();
    }
  }

  #processEffect(target: string, id: string, effect: Effect, effectTarget?: YieldType | 'all') {
    if (!Boolean(target in this.#upgrades)) return;

    if (typeof effect === 'string') {
      switch (effect) {
        case 'unlock':
          return BuildingManager.unlock(target);
        case 'acquire':
          return BuildingManager.acquire(target);
        // case 'autonomy':
        //   return BuildingManager.getBuilding(target).toggleAutonomy(true);
        default: return;
      }
    }

    BuildingManager.getBuilding(target)?.addModifier({ id, target: effectTarget, ...effect });
  }

  get upgrades() {
    return this.#upgrades;
  }
}

const manager = new UpgradeManager();
export default manager;
