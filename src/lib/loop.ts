import { progression } from '$lib/progression';
import { aim } from '$lib/aim';
import { UpgradeManager } from '$lib/managers';

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
  aim.tick();
  // Before the triggers, so a beat gated on what it unlocked sees it this tick.
  UpgradeManager.acquireUnpriced();
  progression.evaluate();
}
