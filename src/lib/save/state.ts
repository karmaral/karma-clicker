/**
 * What a run is, written down. Ids and raw counters only — everything derived is
 * rebuilt by `apply`, so the save stays small and survives a balance change.
 *
 * Three figures are here because nothing rederives them: a resource's `total`
 * (which `remove` never reduces), the refinery's level and exp, and the
 * inversion counter. Planet boons are *not* here — they are what being harvested
 * means, so they are replayed off the flag instead.
 */

import {
  BuildingManager, PlanetManager, ResourceManager, UpgradeManager,
} from '$lib/managers';
import { progression } from '$lib/progression';
import { refinery, type RefinerySnapshot } from '$lib/refinery.svelte';
import { reserve, type ReserveSnapshot } from '$lib/reserve.svelte';
import { aim, type AimSnapshot } from '$lib/aim';
import { tokens } from '$lib/tokens.svelte';
import type { BuildingSnapshot } from '$lib/buildings/base.svelte';
import type { PlanetManagerSnapshot } from '$lib/managers/planet-manager.svelte';
import type { UpgradeSnapshot } from '$lib/managers/upgrade-manager.svelte';
import type { ResourceSnapshot } from '$lib/resources/base.svelte';

/** Bumped whenever a field changes shape. An older save is refused, not patched. */
export const SAVE_VERSION = 1;

export interface SaveState {
  version: number;
  savedAt: number;
  beat: number;
  resources: Record<string, ResourceSnapshot>;
  buildings: Record<string, BuildingSnapshot>;
  planets: PlanetManagerSnapshot;
  upgrades: UpgradeSnapshot;
  reserve: ReserveSnapshot;
  aim: AimSnapshot;
  refinery: RefinerySnapshot;
  inversions: number;
}

/** What the list prints without opening a save. Derived, never stored. */
export interface SaveSummary {
  beat: number;
  planet: string;
  souls: number;
  savedAt: number;
}

export function capture(): SaveState {
  return {
    version: SAVE_VERSION,
    savedAt: Date.now(),
    beat: progression.beat,
    resources: ResourceManager.snapshot(),
    buildings: BuildingManager.snapshot(),
    planets: PlanetManager.snapshot(),
    upgrades: UpgradeManager.snapshot(),
    reserve: reserve.snapshot(),
    aim: aim.snapshot(),
    refinery: refinery.snapshot(),
    inversions: tokens.inversions,
  };
}

export function summarize(state: SaveState): SaveSummary {
  const souls = Object.entries(state.buildings)
    .filter(([id]) => id !== 'main')
    .reduce((sum, [, building]) => sum + building.count, 0);

  return {
    beat: state.beat,
    planet: state.planets.selected || '—',
    souls,
    savedAt: state.savedAt,
  };
}

export function isSaveState(value: unknown): value is SaveState {
  const state = value as SaveState | null;

  return Boolean(state) && state.version === SAVE_VERSION && typeof state.beat === 'number';
}

/**
 * Onto a graph that has just booted and nothing else — every step below assumes
 * the systems above it have already landed, so the order is load-bearing:
 * progression gates aim, totals gate the upgrade locks, buildings must exist
 * before a modifier or a boon can find them, and the clocks start last because
 * `duration` is a modifier away from its base until step 5.
 */
export function apply(state: SaveState) {
  progression.jumpTo(state.beat);
  ResourceManager.restore(state.resources);
  PlanetManager.restore(state.planets);
  BuildingManager.restore(state.buildings);
  UpgradeManager.restore(state.upgrades);
  PlanetManager.grantSavedBoons();

  reserve.restore(state.reserve);
  aim.restore(state.aim);
  refinery.restore(state.refinery);
  tokens.restore(state.inversions);

  BuildingManager.startEmitters();
}
