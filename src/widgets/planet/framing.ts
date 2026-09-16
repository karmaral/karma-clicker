/**
 * Turning the world to present the anchor going down.
 *
 * A framing and not a camera. The camera stands unrotated on Z and everything
 * projected, struck or sparked reads that, so showing a site means turning the
 * *body* under it — two angles added to the ones the world is already held at,
 * which is the one move that leaves every other reading in the scene intact.
 *
 * Nothing here is game state. The module is handed a direction and never learns
 * what is being driven into it, the separation `anchor.ts` already keeps.
 */

import type { AnchorNode } from './anchor';

/**
 * How fast the world swings onto a site and back, in e-folds a second. A rate
 * and not a duration, so the short turn to a neighbouring pole and the long one
 * back to free spin read as the same hand.
 */
const SLEW_RATE = 3.5;

/**
 * And the least it will turn while it still has anywhere to go, in radians a
 * second. An exponential never arrives — it halves forever — so something has to
 * close the tail, and closing it by snapping to the target is the one option
 * that shows: the eye reads a decelerating turn, and a jump at the end of one is
 * a jump however small it is. A floor lands the world instead, at a speed slow
 * enough that touching down is not an event.
 */
const SLEW_FLOOR = 0.05;

/**
 * Where a presented site is put, as an elevation and an azimuth off the view
 * axis. A site aimed straight down the axis is seen down its *own* axis too —
 * an anchor's cap foreshortens to a flat polygon and the solid keeps no profile
 * at all — so the framing stands off it and the shape is read on the slant.
 *
 * Off-centre is not a side effect of that: it *is* the oblique view. The camera
 * stands on Z and a site stands on a sphere, so it cannot be both centred and
 * seen from anywhere but head on — putting it up the screen is the same act as
 * looking down on it. Up and to the left, because the pill that gives the
 * world's offer back has the viewport's top right.
 */
const SITE_LIFT = 0.45;
const SITE_SWING = -0.28;

/** The same, as the direction it means. Unit by construction. */
const SITE_AT = {
  x: Math.cos(SITE_LIFT) * Math.sin(SITE_SWING),
  y: Math.sin(SITE_LIFT),
  z: Math.cos(SITE_LIFT) * Math.cos(SITE_SWING),
};

/** How a body is held, past its lean. Absolute, or an offset — both are pairs. */
export interface Framing {
  tilt: number;
  turn: number;
}

/** Wrapped to (−π, π], so a swing always takes the short way round. */
export function shortAngle(radians: number) {
  const wrapped = (radians + Math.PI) % (Math.PI * 2);

  return (wrapped < 0 ? wrapped + Math.PI * 2 : wrapped) - Math.PI;
}

/**
 * The two angles that put `node` at `SITE_AT`, solved against `PlanetBody`'s
 * own chain, `Rx(tilt)·Ry(turn)`. The turn is the only thing that decides the
 * direction's x, so it is solved for that alone; the tilt then swings what the
 * turn left in the ZY plane onto what the target has there, which is a rotation
 * between two points of equal radius and so always exists.
 *
 * `lean` never enters — it is a roll about the view axis, so it cannot move
 * what is faced, only how that sits.
 */
export function frameOn(node: AnchorNode): Framing {
  const round = Math.hypot(node.x, node.z);

  // What the node's own latitude can carry sideways: a site near a pole rides a
  // small circle, and no turn of the world will stand it further off the axis
  // than that circle reaches. Clamped rather than given up on, so such a site
  // takes what swing it has and the lift makes up the rest of the slant.
  const across = Math.max(-round, Math.min(round, SITE_AT.x));

  // And what is left of each once the turn has spent itself.
  const depth = Math.sqrt(Math.max(0, round * round - across * across));
  const turn = Math.asin(round > 0 ? across / round : 0) - Math.atan2(node.x, node.z);

  return { tilt: Math.atan2(node.y, depth) - Math.atan2(SITE_AT.y, SITE_AT.z), turn };
}

/** The offsets actually in force, and what the last frame held them against. */
export interface Slew extends Framing {
  /**
   * The world's own turn at the last step, while a site is being held — and
   * `undefined` the rest of the time, which is also what says there is no drift
   * to make up on the frame a hold begins.
   */
  base?: number;
}

/**
 * Plain and runeless for `clock.ts`'s reason: this is written once a frame from
 * inside `useTask`, which is the last place a reactive value belongs.
 */
export function createSlew(): Slew {
  return { tilt: 0, turn: 0 };
}

/**
 * One frame of the ease, onto `toward` or back to nothing. Reports whether
 * anything moved, so a world that has come to rest asks for no frames.
 *
 * `base` is the turn the world is on by itself — its own angle plus the spin —
 * and it is **fed forward rather than eased against**. An offset that has to
 * cancel a spin is chasing a target receding at the spin's own rate, and an
 * exponential chasing a receding target lands a fixed distance behind it: the
 * site parks a few degrees off centre for as long as it is held, and closing
 * that gap when the hold ends is a snap. Cancelling the base outright leaves
 * only real error to ease, so a swing arrives where it was aimed.
 */
export function slewTo(slew: Slew, toward: Framing | undefined, base: number, delta: number) {
  const step = Math.max(0, delta);

  // Nothing on the frame a hold begins: where the world had turned to before it
  // was held is not a drift this has to make up.
  const drift = toward && slew.base !== undefined ? base - slew.base : 0;

  slew.base = toward ? base : undefined;
  slew.turn = shortAngle(slew.turn - drift);

  const byTilt = (toward?.tilt ?? 0) - slew.tilt;
  const byTurn = shortAngle((toward?.turn ?? 0) - slew.turn);

  // One share for the pair, so the two axes arrive together and a swing reads as
  // one move rather than two that finish at different times.
  const gone = Math.hypot(byTilt, byTurn);
  if (gone === 0) return false;

  const eased = gone * (1 - Math.exp(-SLEW_RATE * step));
  const share = Math.min(gone, Math.max(eased, SLEW_FLOOR * step)) / gone;

  slew.tilt += byTilt * share;
  slew.turn = shortAngle(slew.turn + byTurn * share);

  return true;
}
