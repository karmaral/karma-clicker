import { progression } from '$lib/progression';
import { harness } from '$lib/harness.svelte';
import { PlanetManager, UpgradeManager } from '$lib/managers';

/**
 * Somewhere for progression to be evaluated. Buildings still schedule their own
 * output; this only polls the beat triggers, which are cheap predicates.
 */

const TICK_MS = 250;

let handle: ReturnType<typeof setInterval> | undefined;

export function start(intervalMs = TICK_MS) {
  if (handle !== undefined) return;

  handle = setInterval(pulse, intervalMs);
}

export function stop() {
  if (handle === undefined) return;

  clearInterval(handle);
  handle = undefined;
}

/** Call directly after a discrete event rather than waiting for the tick. */
export function pulse() {
  // Aim reads the planet directly now — both the wave pull and the re-aim
  // penalty want this tick's phase, not the last one.
  PlanetManager.tick();
  // Reads `clock` deltas rather than the interval, so a direct call after a
  // discrete event costs nothing and a simulated run fast-forwards it.
  harness.tick();
  // Before the triggers, so a beat gated on what it unlocked sees it this tick.
  UpgradeManager.acquireUnpriced();
  // And after it, so a cohort unlocked on this very tick still catches the
  // fan-out upgrades that were bought before it existed.
  UpgradeManager.syncFanOut();
  progression.evaluate();
}
