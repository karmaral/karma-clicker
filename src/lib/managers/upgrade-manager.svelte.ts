import { tick } from 'svelte';
import type { Effect, Modifier, ResourceType, UnlockType, UpgradeData } from '$types';
import data, { parseScope } from '$data/upgrades';
import texts from '$data/upgrades-texts';
import { effectsOf, modifierFor } from '$lib/upgrade-effects';
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

export interface UpgradeSnapshot {
  upgrades: Record<string, string[]>;
  acquiredLog: string[];
}

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

    if (unlock_type === 'count' || unlock_type === 'count_total') {
      // The building the count is asked of, not the upgrade's own bucket key —
      // 'cohort:cohort_1' has no building, 'cohort_1' does. Locked while there
      // is no building at all: a cohort you have not unlocked holds nothing.
      const { entity } = parseScope(target);
      const tgt = entity && BuildingManager.getBuilding(entity);
      if (!tgt) return true;

      const held = unlock_type === 'count' ? tgt.count : tgt.total;

      return held < unlocks_at;
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

    // Every entry, and all of them checked before any is taken — a price in two
    // piles that could half-charge you would be a way to lose crimson for nothing.
    const costs = item.costs ? Object.entries(item.costs) as [ResourceType, number][] : [];
    if (!costs.length) return;
    if (costs.some(([type, cost]) => ResourceManager.getAmount(type) < cost)) return;

    costs.forEach(([type, cost]) => ResourceManager.remove(type, cost));
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

  /**
   * Gives an upgrade back — the first thing in the game that takes one away. The
   * modifiers go with it, by the same `id:index` the effects were added under, so
   * a released upgrade lands exactly where it would have had it never applied.
   */
  release(target: string, id: string) {
    if (!Boolean(target in this.#upgrades)) return;
    if (!this.#upgrades[target].includes(id)) return;

    const item = upgradeMap[target][id];
    if (!item) return;

    const { kind, entity } = parseScope(target);
    const effects = effectsOf(item);

    // Symmetric with `#processEffect`: whatever held it gives it back. A fan-out
    // was added to every cohort, so it comes off every cohort.
    const holders = kind === 'cohorts' ? BuildingManager.cohorts : entity ? [entity] : [];

    holders.forEach((held) => {
      const building = BuildingManager.getBuilding(held);
      effects.forEach((_, index) => building?.removeModifier(`${item.id}:${index}`));
    });

    this.#upgrades[target] = this.#upgrades[target].filter((held) => held !== id);
    this.#acquiredLog = this.#acquiredLog.filter((held) => held !== `${target}/${id}`);
  }

  /**
   * One rule, and the merge is only its first caller: **a `count`-gated upgrade
   * is held only while its count is held.** So a merge burns exactly the levels
   * it drops you below and no others — the deeper the merge, the more of the
   * ladder is bought again, which is the whole of what the slider weighs.
   *
   * Nothing gated on a resource total or on `count_total` is touched; those are
   * the layer meant to stay earned.
   */
  releaseUnheld() {
    Object.keys(this.#upgrades).forEach((target) => {
      [...this.#upgrades[target]]
        .filter((id) => this.isLocked(target, id))
        .forEach((id) => this.release(target, id));
    });
  }

  snapshot(): UpgradeSnapshot {
    return {
      upgrades: Object.fromEntries(
        Object.entries(this.#upgrades).map(([target, ids]) => [target, [...ids]]),
      ),
      acquiredLog: [...this.#acquiredLog],
    };
  }

  /**
   * The held ids, then their modifiers — and **only** their modifiers. A string
   * effect is a verb (`unlock`, `acquire`, `discover`, `autonomy`) and every one
   * of them has already landed in the saved buildings and planets, so replaying
   * it would grant a second time. Skipping `acquire` is the whole reason this is
   * not a loop over `acquire()`; skipping the notification is the other half.
   *
   * Synchronous, unlike `#handleEffect`: the `await tick()` there paces toasts,
   * and there are none here.
   */
  restore({ upgrades, acquiredLog }: UpgradeSnapshot) {
    Object.keys(this.#upgrades).forEach((target) => {
      this.#upgrades[target] = [...(upgrades[target] ?? [])];
    });
    this.#acquiredLog = [...acquiredLog];

    Object.entries(this.#upgrades).forEach(([target, ids]) => {
      ids.forEach((id) => {
        const item = upgradeMap[target]?.[id];
        if (!item?.effect) return;

        const effects = effectsOf(item);

        effects.forEach((effect, index) => {
          if (typeof effect === 'string') return;

          this.#processEffect(target, item, effect, index);
        });
      });
    });
  }

  async #handleEffect(target: string, item: UpgradeData) {
    const effects = effectsOf(item);

    for (const [index, entry] of effects.entries()) {
      this.#processEffect(target, item, entry, index);
      await tick();
    }
  }

  #processEffect(target: string, item: UpgradeData, effect: Effect, index: number) {
    if (!Boolean(target in this.#upgrades)) return;

    const { kind, entity } = parseScope(target);

    // The scopes with a singleton behind them. A verb usually needs an entity to
    // act on, so these are modifiers — with one exception: the harness's `unlock`
    // opens cohort lines, which are then *bought* rather than granted, so the
    // verb has the singleton itself to act on and nothing else.
    if (kind === 'refinery' || kind === 'harness') {
      if (typeof effect === 'string') {
        if (kind === 'harness' && effect === 'unlock') harness.unlockLines();

        return;
      }

      const target = kind === 'refinery' ? refinery : harness;

      return target.addModifier(modifierFor(item, effect, index));
    }

    // Names no entity because it names all of them. Same reasoning as above: a
    // fan-out has no one thing to act on, so it is always a modifier.
    if (kind === 'cohorts') {
      if (typeof effect === 'string') return;

      return this.#fanOut(item, effect, index);
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
        case 'autonomy':
          return BuildingManager.getBuilding(entity)?.toggleAutonomy(true);
        default: return;
      }
    }

    BuildingManager.getBuilding(entity)?.addModifier(modifierFor(item, effect, index));
  }

  /**
   * One modifier onto every cohort there is. `ModifierSet.add` drops a repeat id,
   * so this is idempotent — which is what lets `syncFanOut` simply run it again.
   */
  #fanOut(item: UpgradeData, effect: Omit<Modifier, 'id'>, index: number) {
    BuildingManager.cohorts.forEach((id) => {
      BuildingManager.getBuilding(id)?.addModifier(modifierFor(item, effect, index));
    });
  }

  /**
   * A fan-out lands on the cohorts that exist when it is bought, so one unlocked
   * afterwards would miss it — the bug every "all of them" effect has. Rather
   * than have `BuildingManager.unlock` call back here and close a cycle, the held
   * ones are re-applied off the loop beside `acquireUnpriced`. Idempotent, and
   * small: a couple of upgrades across a handful of cohorts.
   */
  syncFanOut() {
    this.#upgrades['cohorts']?.forEach((id) => {
      const item = upgradeMap['cohorts'][id];
      if (!item?.effect) return;

      const effects = effectsOf(item);

      effects.forEach((effect, index) => {
        if (typeof effect === 'string') return;

        this.#fanOut(item, effect, index);
      });
    });
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
