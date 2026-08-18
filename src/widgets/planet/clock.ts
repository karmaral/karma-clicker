/**
 * A world's own clock, and the reason a planet does not start over.
 *
 * The body's rotation and the swarm's drift are one quantity read two ways, and
 * both used to live in the component that drew them — so leaving a screen and
 * coming back put the world at nought. Keyed clocks live out here instead: two
 * views of the same world share one, and the world is where you left it.
 *
 * Plain, and no runes anywhere. This is written from inside `useTask`, once a
 * frame, which is the last place a reactive value belongs.
 */

/**
 * Threlte clamps its own frame delta to the same tenth of a second. A gap
 * longer than one frame is a world nobody was watching, and this is what makes
 * that a **pause** rather than a fast-forward.
 */
const MAX_STEP = 0.1;

export interface WorldClock {
  /** Seconds the world has been watched. What the swarm reads. */
  elapsed: number;
  /**
   * Radians turned. Integrated rather than taken as `spin × elapsed`, so
   * changing the rate bends the motion instead of jumping it — which is the
   * whole difference between a lab slider and a teleport.
   */
  angle: number;
  /**
   * The veil's own, and a second integral rather than a second clock. The two
   * have to share one wall-time step: calling `advanceClock` twice a frame
   * would add `elapsed` twice and leave `at` at the second read, so the swarm
   * would run double and both angles half.
   */
  veilAngle: number;
  /** Wall time at the last step, in seconds. */
  at: number;
}

const shared = new Map<string, WorldClock>();

function createClock(): WorldClock {
  return { elapsed: 0, angle: 0, veilAngle: 0, at: performance.now() / 1000 };
}

/**
 * Shared under a key, private without one. Two screens showing the same world
 * pass the same key and see one clock; the labs pass none, so a view there
 * starts where it always did and forty-four of them do not converge.
 */
export function getClock(key?: string): WorldClock {
  if (!key) return createClock();

  const held = shared.get(key);
  if (held) return held;

  const clock = createClock();
  shared.set(key, clock);

  return clock;
}

/**
 * Wall time rather than the frame's delta, and clamped — which buys two things
 * at once. A world nobody has drawn for five minutes advances a tenth of a
 * second, so coming back continues the picture instead of jumping it. And two
 * views of one world cannot run it double: whichever reads second in a frame
 * finds almost no time left to add.
 *
 * `veilRate` is defaulted so the signature stays honest for a caller with no
 * veil to turn, and both angles are written from the one step — see the
 * interface for why that cannot be two calls.
 */
export function advanceClock(clock: WorldClock, rate: number, veilRate = 0) {
  const now = performance.now() / 1000;
  const step = Math.min(MAX_STEP, Math.max(0, now - clock.at));

  clock.at = now;
  clock.elapsed += step;
  clock.angle += rate * step;
  clock.veilAngle += veilRate * step;
}
