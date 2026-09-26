import { progression } from '$lib/progression';
import { harness } from '$lib/harness.svelte';
import { refinery } from '$lib/refinery.svelte';
import { weight } from '$lib/weight.svelte';
import { PlanetManager, UpgradeManager } from '$lib/managers';
import { aim } from '$lib/aim';

/**
 * Somewhere for progression to be evaluated. Buildings still schedule their own
 * output; this mostly polls the beat triggers, which are cheap predicates —
 * plus one sample of the refinery's lifetime counter, for its trailing rate.
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
  // Knowledge's auto-aim, on this tick's phase.
  if (UpgradeManager.isAcquired('global', 'auto_aim')) aim.follow(PlanetManager.getActive()?.isDense);
  // Reads `clock` deltas rather than the interval, so a direct call after a
  // discrete event costs nothing and a simulated run fast-forwards it.
  harness.tick();
  // Halts the clock when the split leaves it unstaffed, and starts it again on
  // the first worker back. Before the sample, so a halted pulse is not counted.
  refinery.tick();
  // Self-throttled, so a direct `pulse()` elsewhere costs nothing extra.
  refinery.sample();
  // After the refinery's pulse, so the backlog reads what it just cleared.
  weight.tick();
  // Before the triggers, so a beat gated on what it unlocked sees it this tick.
  UpgradeManager.acquireUnpriced();
  // And after it, so a cohort unlocked on this very tick still catches the
  // fan-out upgrades that were bought before it existed.
  UpgradeManager.syncFanOut();
  progression.evaluate();
}
