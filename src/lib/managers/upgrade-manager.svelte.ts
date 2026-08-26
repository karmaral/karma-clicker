import { tick } from 'svelte';
import type { Effect, Modifier, ResourceType, UnlockType, UpgradeData } from '$types';
import data, { parseScope } from '$data/upgrades';
import texts from '$data/upgrades-texts';
import { refinery } from '$lib/refinery.svelte';
import { harness } from '$lib/harness.svelte';
import {
  ResourceManager,
  BuildingManager,
  PlanetManager,
  NotificationManager,
} from '$lib/managers';

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

  /** Acquisition order, flat across every bucket — what "newest first" reads. */
  #acquiredLog: string[] = $state([]);

  isLocked(target: string, id: string) {
    if (!Boolean(target in this.#upgrades)) return;

    const item = upgradeMap[target][id];
    if (!item) return;

    const [unlock_type, unlocks_at] = Object.entries(item.unlocks_at)[0] as [UnlockType, number];

    if (unlock_type === 'count_total') {
      // The building the count is asked of, not the upgrade's own bucket key —
      // 'cohort:basic' has no building, 'basic' does.
      const { entity } = parseScope(target);
      const tgt = entity && BuildingManager.getBuilding(entity);
      if (!tgt) return;

      return tgt.total <= unlocks_at;
    }
    return ResourceManager.getTotal(unlock_type as ResourceType) < unlocks_at;
  }

  isAcquired(target: string, id: string) {
    if (!Boolean(target in this.#upgrades)) return;

    return this.#upgrades[target].includes(id);
  }

  /** Unpriced upgrades have no buyer, so `unlocks_at` acts as the trigger. Polled off the loop. */
  acquireUnpriced() {
    Object.entries(upgradeMap).forEach(([target, items]) => {
      Object.values(items).forEach((item) => {
        if (item.costs) return;
        if (this.#upgrades[target].includes(item.id)) return;
        if (this.isLocked(target, item.id)) return;

        this.acquire(target, item.id);
      });
    });
  }

  purchase(target: string, id: string) {
    if (!Boolean(target in this.#upgrades)) return;
    if (this.#upgrades[target].includes(id)) return;

    const item = upgradeMap[target][id];
    if (!item) return;

    const costEntry = item.costs ? Object.entries(item.costs)[0] as [ResourceType, number] : undefined;
    if (!costEntry) return;
    const [cost_type, cost] = costEntry;
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
    this.#acquiredLog.push(`${target}/${id}`);

    if (item.effect) {
      this.#handleEffect(target, item);
    }
  }

  async #handleEffect(target: string, item: UpgradeData) {
    const effects = Array.isArray(item.effect) ? item.effect : [item.effect];

    for (const [index, entry] of effects.entries()) {
      this.#processEffect(target, item, entry, index);
      await tick();
    }
  }

  #processEffect(target: string, item: UpgradeData, effect: Effect, index: number) {
    if (!Boolean(target in this.#upgrades)) return;

    const { kind, entity } = parseScope(target);

    // The scopes with a singleton behind them. Verbs act on entities, so these
    // upgrades are always modifiers and never verbs.
    if (kind === 'refinery' || kind === 'harness') {
      if (typeof effect === 'string') return;

      const target = kind === 'refinery' ? refinery : harness;

      return target.addModifier(this.#toModifier(item, effect, index));
    }

    // A global-scoped bucket names no entity, so nothing here can act for it yet.
    if (!entity) return;

    if (typeof effect === 'string') {
      switch (effect) {
        case 'unlock':
          return BuildingManager.unlock(entity);
        case 'acquire':
          return BuildingManager.acquire(entity);
        case 'discover':
          return PlanetManager.unlock(entity);
        // case 'autonomy':
        //   return BuildingManager.getBuilding(entity).toggleAutonomy(true);
        default: return;
      }
    }

    BuildingManager.getBuilding(entity)?.addModifier(this.#toModifier(item, effect, index));
  }

  /**
   * One modifier out of one effect entry, for whoever will hold it. `index`
   * keeps an upgrade's several effects individually removable, and `effect`
   * spreads last so its own `target` beats the upgrade's `effect_target`.
   */
  #toModifier(item: UpgradeData, effect: Omit<Modifier, 'id'>, index: number): Modifier {
    return { id: `${item.id}:${index}`, target: item.effect_target, ...effect };
  }

  get upgrades() {
    return this.#upgrades;
  }

  /** `target/id` pairs, oldest first — reverse for newest-first reading. */
  get acquiredLog() {
    return this.#acquiredLog;
  }
}

const manager = new UpgradeManager();
export default manager;
