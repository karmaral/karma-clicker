/**
 * The soul's own strike. `pulse.ts` is the click's marks; this is the swarm's
 * one — a small warped line thrown from a dot down at the world, on an interval
 * taken from the band the soul was dealt from.
 *
 * The two bolts are the same mark read from opposite sides. The click's comes
 * from *outside* the world and is you; this one comes from the orbit and is the
 * world working on its own, which is why the inner band flickering and the outer
 * one tolling is the whole of what it has to say.
 *
 * **Nothing here is a ring buffer, and nothing is born.** A soul's strike is a
 * pure function of the clock, its own phase and its band's period — the swarm's
 * standing rule, so two views of one world still agree without talking. What is
 * below is one frame's worth of geometry, filled by `SoulSwarm` and read by
 * `SoulBolts`, and it is emptied and refilled every frame rather than swept.
 *
 * Nothing here is game state either: a period is a number of seconds, and this
 * never learns that a band is a cohort.
 */

import type { Soul, SwarmVisual } from './orbit';

/**
 * Marks drawn in one frame. Sized to be **out of the way** rather than to be a
 * budget: a life longer than a period means a band never goes dark, so at the
 * short intervals this effect is authored at the demand is most of the swarm at
 * once, not a few dozen.
 *
 * That matters more than a ceiling usually would, because the buffer fills in
 * the order the souls were dealt — which is band by band. A ceiling low enough
 * to bind does not thin the effect evenly; it cuts every band past the first
 * off entirely, and the swarm reads as a single belt. Room here is what keeps
 * the outer bands on screen at all.
 *
 * It is affordable because a strike's quad is a sliver: see `SoulBolts`.
 */
export const SOUL_BOLT_CAPACITY = 512;

/**
 * One strike, in the body's own tilt frame — `SoulBolts` is what turns it into
 * the scene's.
 *
 * **Two whole points rather than a point and a direction**, which is the one
 * thing here that is not the cheapest possible: a radial strike only needs the
 * near end and a radius. It is written this way so that a strike between two
 * souls costs nothing to add later — the far end is already a place and not a
 * derivation of the near one.
 */
export interface SoulBolt {
  fx: number; fy: number; fz: number;
  tx: number; ty: number; tz: number;
  /** How far through its life it is, 0…1. */
  t: number;
  /** Its own draw against the warp, so two strikes in a row are not one shape. */
  seed: number;
}

export function createSoulBolts() {
  const marks: SoulBolt[] = Array.from({ length: SOUL_BOLT_CAPACITY }, () => ({
    fx: 0, fy: 0, fz: 0, tx: 0, ty: 0, tz: 0, t: 0, seed: 0,
  }));

  let count = 0;

  /** Empties the frame. The slots are kept — it is the count that is the list. */
  function reset() {
    count = 0;
  }

  /**
   * The near end, and how far in to strike. Radial: the far end is the near one
   * pulled back to `reach`, so a soul strikes the ground under itself rather
   * than a spot chosen for it. A soul at the origin has no direction to strike
   * along and is dropped.
   */
  function add(x: number, y: number, z: number, reach: number, t: number, seed: number) {
    if (count >= SOUL_BOLT_CAPACITY) return;

    const length = Math.hypot(x, y, z);
    if (length < 1e-6) return;

    const mark = marks[count];
    const scale = reach / length;

    mark.fx = x;
    mark.fy = y;
    mark.fz = z;
    mark.tx = x * scale;
    mark.ty = y * scale;
    mark.tz = z * scale;
    mark.t = t;
    mark.seed = seed;

    count++;
  }

  return {
    marks,
    get count() { return count; },
    reset,
    add,
  };
}

export type SoulBolts = ReturnType<typeof createSoulBolts>;

/**
 * How long between one soul's strikes, in seconds — **the authored rhythm, for
 * a swarm with no economy behind it.** Doubling per band, which is the game's
 * own `duration(n) = 1s × 2^(n-1)`, so the lab reads like the world without the
 * lab having to be told anything about a cohort.
 *
 * A world that is actually paying out does not come through here at all: it
 * strikes on the payout itself, which is `createBoltBeats` below.
 */
export function boltPeriodOf(band: number, visual: SwarmVisual) {
  return visual.boltEvery * 2 ** band;
}

/**
 * When each band last paid out, on the frame's clock — the swarm striking on
 * the economy rather than on a rhythm that merely resembles it.
 *
 * Something has to hold two clocks together here, because a payout is an event
 * on the game's and a strike ages on the frame's. What is followed is **the
 * count rising, not a time**: the world's own clock advances in quarter-seconds
 * ([`TICK_MS`](../../lib/loop.ts)) and a strike is shorter than that, so a
 * payout read off it would land in one of four places and a cohort quicker than
 * the tick would lose strikes outright. A count is exact, and `elapsed` at the
 * frame that sees it rise is one frame late at worst.
 *
 * This is the one thing about the swarm that is not a pure function of seed and
 * clock, and it cannot be: a payout is not derivable from either. Two views of
 * one world still agree, though — they follow the same counts.
 */
export function createBoltBeats() {
  const seen: number[] = [];
  const at: number[] = [];

  /**
   * Stamps every band whose count rose. A band's *first* reading never strikes:
   * a view opened mid-game would otherwise fire the whole roster on its first
   * frame, which reads as a payout that never happened.
   */
  function follow(yields: number[], elapsed: number) {
    for (let band = 0; band < yields.length; band++) {
      const count = yields[band];

      if (seen[band] !== undefined && count > seen[band]) at[band] = elapsed;

      seen[band] = count;
    }
  }

  /** How long ago that band paid, in seconds. One that never has is dark. */
  function ageOf(band: number, elapsed: number) {
    const stamp = at[band];

    return stamp === undefined ? Infinity : elapsed - stamp;
  }

  return { follow, ageOf };
}

export type BoltBeats = ReturnType<typeof createBoltBeats>;

/**
 * How long ago this **band** last struck on the authored rhythm, in seconds. It
 * keeps nothing — the cycle is the clock and the period, and a band that has
 * never been asked before is already mid-strike if that is where its cycle has
 * got to.
 *
 * Band-level rather than per soul, which it used to be: `boltDelayOf` is what
 * separates the souls now, and it has to be the same separation on both paths.
 * Decorrelating here instead would have left the lab pattering while a paying
 * world flashed — the same effect, differing in the one place it gets tuned.
 *
 * Because the period is the whole cycle a band has at most one strike in the
 * air; a `boltLife` longer than the period means it never goes dark, which is
 * the honest reading of a cohort that earns faster than its mark can fade.
 */
export function boltCycleOf(elapsed: number, period: number) {
  if (period <= 0) return Infinity;

  const at = elapsed / period;

  return (at - Math.floor(at)) * period;
}

/**
 * How long ago the wave passed this **place**, on a band that streams — one
 * paying by the tick rather than by the life, and so with no payout left worth
 * answering.
 *
 * A front sweeping round the world, and every departure from the band rhythm
 * above follows from that one picture.
 *
 * **It is asked of a position and not of a soul.** The band rhythm is a property
 * of the seed — which soul, which band — and so it holds still while the swarm
 * turns under it. A wave is a property of the *world*: what decides whether a
 * soul is lit is where it is standing when the front arrives, so two souls that
 * meet are struck together and a soul crossing the front is struck as it does.
 * That is the whole difference between a wave and a scatter that happens to be
 * even, and it is why nothing of the soul is passed in.
 *
 * **Azimuth rather than a screen axis**, so the sweep is the world's own and not
 * the camera's: it is measured in the body's frame, so it leans and tilts with
 * the world, and every band rides one front however wide its orbit — an inner
 * band and an outer one light together where they share an angle.
 *
 * **`boltWave`, not `boltEvery`.** The band period doubles per band to show a
 * slow cohort tolling against a quick one, and a band whose lives have collapsed
 * into a rate has nothing to toll; every streaming band is now the same speed by
 * definition, so the wave is one authored figure and all of them are on it. It
 * is also seconds *per pass of the world* rather than per strike, which is a
 * different quantity and would read as a strobe at the other one's scale.
 *
 * How much of the ring is lit is `boltLife` over this — the two together are the
 * width of the band, the way the sweep bar's gradient is a share of its track.
 */
export function streamWaveOf(x: number, z: number, elapsed: number, visual: SwarmVisual) {
  const period = Math.max(1e-3, visual.boltWave);
  // Counter-clockwise seen from above the world's north. One negation the other
  // way if the front should ever run against the swarm rather than with it.
  const turn = Math.atan2(z, x) / (Math.PI * 2);
  const at = elapsed / period - turn;

  return (at - Math.floor(at)) * period;
}

/**
 * How long this soul waits after its band strikes, in seconds — its own share
 * of `boltSpread`, taken off the phase it already carries for its orbit.
 *
 * Fixed for the soul's life rather than drawn fresh each time, so a band
 * scatters the *same* way whenever it fires. A band that reshuffled every
 * strike would twinkle, and what this is for is a band that arrives.
 */
export function boltDelayOf(soul: Soul, visual: SwarmVisual) {
  return Math.max(0, visual.boltSpread) * (soul.phase / (Math.PI * 2));
}
