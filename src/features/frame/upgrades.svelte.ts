/**
 * The rail's view model, hoisted here because the catalogue window reads the
 * exact same rows. Two consumers turning a bucket key and an id into a
 * purchasable row is one too many for that logic to live inside a component.
 */
import { ResourceManager, UpgradeManager } from '$lib/managers';
import type { ResourceType, UpgradeData } from '$types';
import type { ChipStatus } from '$ui';
import { pulse } from '$lib/loop';
import data, { parseScope } from '$data/upgrades';
import texts from '$data/upgrades-texts';

export interface Upgrade {
  target: string;
  id: string;
  label: string;
  scope: string;
  costs?: Partial<Record<ResourceType, number>>;
  /** The first (only) cost entry's amount. Undefined for an unpriced arrival. */
  cost?: number;
  /** What you currently hold of the cost's resource — 0 for an unpriced entry. */
  held: number;
  effect?: UpgradeData['effect'];
  effectTarget?: UpgradeData['effect_target'];
  acquired: boolean;
  status: ChipStatus;
  /** Sorts nearest-to-affordable first. Infinity for anything with no price. */
  distanceToAffordable: number;
  textData: Record<string, string>;
}

function upgradeFor(target: string, id: string): Upgrade | undefined {
  const item = data[target].find((u) => u.id === id);
  if (!item) return;

  const text = texts[target]?.[id];
  const acquired = Boolean(UpgradeManager.isAcquired(target, id));
  const locked = Boolean(UpgradeManager.isLocked(target, id));

  const costEntry = item.costs ? Object.entries(item.costs)[0] as [ResourceType, number] : undefined;
  const cost = costEntry?.[1];
  const held = costEntry ? ResourceManager.getAmount(costEntry[0]) : 0;

  let status: ChipStatus = 'unlocked';
  if (locked) {
    status = 'approaching';
  } else if (cost === undefined) {
    status = 'arriving';
  } else if (held >= cost) {
    status = 'affordable';
  }

  const { kind, entity } = parseScope(target);

  return {
    target,
    id,
    label: text?.title ?? id,
    scope: entity ?? kind,
    costs: item.costs,
    cost,
    held,
    effect: item.effect,
    effectTarget: item.effect_target,
    acquired,
    status,
    distanceToAffordable: cost === undefined ? Infinity : cost - held,
    textData: { ...text },
  };
}

const all = $derived.by(() => {
  const list: Upgrade[] = [];
  for (const target of Object.keys(data)) {
    for (const item of data[target]) {
      const upgrade = upgradeFor(target, item.id);
      if (upgrade) list.push(upgrade);
    }
  }

  return list;
});

const byDistance = (a: Upgrade, b: Upgrade) => a.distanceToAffordable - b.distanceToAffordable;

const notAcquired = $derived(all.filter((u) => !u.acquired));
const available = $derived(notAcquired.filter((u) => u.status !== 'approaching').sort(byDistance));
const locked = $derived(notAcquired.filter((u) => u.status === 'approaching').sort(byDistance));

/** Newest first — a flat log across every bucket, since acquisition order isn't. */
const acquired = $derived.by(() => {
  const byKey = new Map(all.map((u) => [`${u.target}/${u.id}`, u]));

  return UpgradeManager.acquiredLog
    .map((key) => byKey.get(key))
    .filter((u): u is Upgrade => Boolean(u))
    .reverse();
});

let isOpen = $state(false);

function buy(upgrade: Upgrade) {
  UpgradeManager.purchase(upgrade.target, upgrade.id);
  pulse();
}

export const catalogue = {
  get isOpen() { return isOpen; },
  get available() { return available; },
  get locked() { return locked; },
  get acquired() { return acquired; },

  open() { isOpen = true; },
  close() { isOpen = false; },
  buy,
};
