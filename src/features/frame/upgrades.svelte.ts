/**
 * The rail's view model, hoisted here because the catalogue window reads the
 * exact same rows. Two consumers turning a bucket key and an id into a
 * purchasable row is one too many for that logic to live inside a component.
 */
import { untrack } from 'svelte';
import { ResourceManager, UpgradeManager } from '$lib/managers';
import { modifiersFor } from '$lib/upgrade-effects';
import type { Modifier, ResourceType, UpgradeData, UpgradeScope } from '$types';
import type { ChipStatus } from '$ui';
import { pulse } from '$lib/loop';
import { SCREENS, type ScreenName } from '$lib/labels';
import { nav } from '$lib/nav.svelte';
import data, { parseScope } from '$data/upgrades';
import texts from '$data/upgrades-texts';

/**
 * Which screen an upgrade acts on. Read off the scope rather than authored,
 * because the scope already says it: a cohort is bought over the roster, a world
 * is found from the list, and the refinery has a screen of its own.
 *
 * `global` maps to nothing on purpose, and that is not a gap — it owns no entity
 * and so has no screen to be filed under. It shows on every one instead.
 */
const SCREEN_BY_KIND: Record<UpgradeScope['kind'], ScreenName | undefined> = {
  global: undefined,
  building: 'details',
  cohort: 'details',
  cohorts: 'details',
  harness: 'harness',
  planet: 'overview',
  refinery: 'refinery',
};

export interface Upgrade {
  target: string;
  id: string;
  label: string;
  scope: string;
  /** The scope's own two halves, parsed once here so no consumer re-splits the key. */
  kind: UpgradeScope['kind'];
  entity?: string;
  /**
   * What it would add, were it bought. Empty for a verb — an unlock or a clerk
   * changes what exists, not what a figure reads, so a preview has nothing to price.
   */
  modifiers: Modifier[];
  /** The tab that acts on it — `undefined` is global, which every tab shows. */
  screen?: ScreenName;
  costs?: Partial<Record<ResourceType, number>>;
  /**
   * Every entry of `costs`, parsed once. A price may name more than one pile —
   * the harness is bought in both crimsons — and all of them are charged.
   */
  costEntries: [ResourceType, number][];
  /** The first cost entry's amount. Undefined for an unpriced arrival. */
  cost?: number;
  /** What you currently hold of the first cost's resource — 0 for an unpriced entry. */
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

  const costEntries = item.costs ? Object.entries(item.costs) as [ResourceType, number][] : [];
  const costEntry = costEntries[0];
  const cost = costEntry?.[1];
  const held = costEntry ? ResourceManager.getAmount(costEntry[0]) : 0;

  /**
   * Every pile short of its price, summed. A two-pile upgrade is as far away as
   * both halves are, so a chip that reads affordable is one every pile can pay —
   * and one you are close on in one pile alone does not climb the rail for it.
   */
  const shortfall = costEntries.reduce((sum, [type, amount]) => {
    return sum + Math.max(0, amount - ResourceManager.getAmount(type));
  }, 0);

  let status: ChipStatus = 'unlocked';
  if (locked) {
    status = 'approaching';
  } else if (cost === undefined) {
    status = 'arriving';
  } else if (shortfall <= 0) {
    status = 'affordable';
  }

  const { kind, entity } = parseScope(target);

  return {
    target,
    id,
    label: text?.title ?? id,
    scope: entity ?? kind,
    kind,
    entity,
    modifiers: modifiersFor(item),
    screen: SCREEN_BY_KIND[kind],
    costs: item.costs,
    costEntries,
    cost,
    held,
    effect: item.effect,
    effectTarget: item.effect_target,
    acquired,
    status,
    distanceToAffordable: cost === undefined ? Infinity : shortfall,
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

/**
 * The rail's own order, and the only place it differs from the catalogue's:
 * **affordable first, then the global ones, then nearest.**
 *
 * The middle key is the pin. A global upgrade belongs to every screen and is
 * filed under none, so it is the one thing in the rail with nowhere else to be
 * found — and sorted on distance alone it could be crowded out of the five by a
 * screen upgrade you happen to be further past, with no tab carrying a count for
 * it. Two entries at most, so the pin costs the screen almost nothing.
 *
 * Affordability outranks it on purpose: the top of the rail is the slot worth
 * acting on, and a global still half a fortune away has no claim on it. Inside
 * each group `byDistance`'s reading — nearest first — is untouched, which is why
 * the catalogue window keeps using that one whole.
 *
 * **Spent once, at a settling, and never per frame** — see `ranking`.
 */
const byStanding = (a: Upgrade, b: Upgrade) =>
  Number(a.status !== 'affordable') - Number(b.status !== 'affordable')
  || Number(Boolean(a.screen)) - Number(Boolean(b.screen))
  || byDistance(a, b);

const keyOf = (upgrade: Upgrade) => `${upgrade.target}/${upgrade.id}`;

const notAcquired = $derived(all.filter((u) => !u.acquired));
const available = $derived(notAcquired.filter((u) => u.status !== 'approaching').sort(byDistance));
const locked = $derived(notAcquired.filter((u) => u.status === 'approaching').sort(byDistance));

/**
 * What is in the rail, as a set and nothing more. A joined string rather than
 * the list, so it stops propagating the moment the membership stops changing —
 * `available` is rebuilt on every tick that moves a resource, and its *contents*
 * moving is exactly what must not reach the order.
 */
const railSet = $derived(available.map(keyOf).sort().join('|'));

/**
 * Where each chip sits, settled when the set last changed and not since.
 *
 * `byStanding` reads `held`, which never stops moving: income lifts it and a
 * purchase drops it back, so an upgrade you are close to crosses the affordable
 * line and recrosses it several times while you spend. Ranked live, the rail
 * reshuffled under the cursor — worst while buying, which is the one time you
 * are reading it.
 *
 * So the order is a **placement**, and it is redecided only on the discrete
 * events that change what there is to place: an upgrade bought, or one newly
 * unlocked. Between those, a chip does not move.
 *
 * Nothing is lost by that, because position was saying a thing the chip already
 * says: affordability is `ChipStatus`, drawn as the chip's own ink. A reading
 * carried in the border does not need the running order to carry it twice.
 *
 * `railSet` is the whole mechanism — the ranking depends on the membership and
 * reads the live rows through `untrack`, so the standing that decides a
 * placement is the standing at the moment it was placed.
 */
const ranking = $derived.by(() => {
  const rows = untrack(() => new Map(available.map((u) => [keyOf(u), u])));

  const placed = railSet
    .split('|')
    .map((key) => rows.get(key))
    .filter((u): u is Upgrade => Boolean(u))
    .sort(byStanding);

  return new Map(placed.map((u, at) => [keyOf(u), at] as const));
});

/**
 * What the rail shows while a screen is up: that screen's own upgrades and the
 * global ones, which belong to no screen and so are never withheld from one.
 *
 * The whole point of the cut is that a chip in the rail should be about the
 * thing under it — the rail hovers a target the screen can light (see
 * `spotlight`), and pointing at something two tabs away was the clutter.
 *
 * A screen still out of the run is not a hiding place: nothing files upgrades
 * under a tab that has not arrived, so anything scoped to one shows everywhere
 * until it has somewhere of its own to be. `onScreen` is the only thing that
 * decides this, and the catalogue window deliberately does not call it — the
 * complete list is what it is for.
 *
 * Ordered by the settled `ranking` rather than left in `available`'s, because a
 * shorter list is not the same list — the pin only means anything once the
 * screen's cut has been made. The rows themselves stay live: it is where they
 * sit that is held still, not what they say.
 */
function onScreen(screen: ScreenName) {
  const at = ranking;

  return available
    .filter((u) => !u.screen || u.screen === screen || nav.state(u.screen) === 'absent')
    .sort((a, b) => (at.get(keyOf(a)) ?? 0) - (at.get(keyOf(b)) ?? 0));
}

/**
 * How many upgrades each tab is holding that you could buy this second — the
 * badge's whole reading, and the other half of the cut above: what the rail
 * stops showing you, the header has to.
 *
 * Global ones are counted under no tab, because they are in the rail on every
 * screen already and a badge for something you are looking at is not news.
 */
const affordable = $derived.by(() => {
  const counts = Object.fromEntries(SCREENS.map((s) => [s, 0])) as Record<ScreenName, number>;

  for (const upgrade of available) {
    if (upgrade.screen && upgrade.status === 'affordable') counts[upgrade.screen]++;
  }

  return counts;
});

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
  get affordable() { return affordable; },

  onScreen,

  open() { isOpen = true; },
  close() { isOpen = false; },
  buy,
};
