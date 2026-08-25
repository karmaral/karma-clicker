/**
 * The souls around a planet. A cohort is a *band* of orbits rather than one
 * ring: every soul runs its own trajectory, drawn from its band's, so a group
 * reads as a clump of paths instead of beads on a wire.
 *
 * Nothing here is game state. The swarm is handed counts and never learns what
 * a cohort is, the same separation `Planet` and `PlanetVisual` already keep.
 */

/**
 * Instances are allocated once, so this is a ceiling and not a target: it is the
 * lab's own sliders at their tops — eight bands of a hundred — because a slider
 * that silently stops meaning anything past a third of its travel is worse than
 * no slider. Past this a band wants a stream, not more dots.
 */
export const SOUL_CAPACITY = 800;

/** Spreads the bands' planes so no two line up by arithmetic. */
const GOLDEN_ANGLE = Math.PI * (3 - Math.sqrt(5));

export interface SwarmVisual {
  seed: number;

  /**
   * Rim-hugging by design: 1 is the body's own edge, so a soul crosses the
   * silhouette twice an orbit and the ink rule does its work. Wide orbits would
   * cost framing, and framing is planet — the body shrinks to pay for them.
   */
  radius: number;
  /** Between one band and the next, so cohorts do not share a lane. */
  spacing: number;
  /**
   * Where the ink switches, in body radii: the sphere, ignoring terrain. The
   * body's outline is added to it by the scene, because a slider cannot know how
   * wide a px-authored edge came out at this widget's size.
   */
  rim: number;

  /**
   * How far a soul's own orbit strays from its band's. These three are what
   * make a band a clump: `node` opens the plane out into a shell, `tilt` and
   * `radius` thicken it. All zero gives one wire per cohort.
   */
  radiusScatter: number;
  tiltScatter: number;
  nodeScatter: number;

  /** Inclination handed to each successive band, alternating sign. */
  tiltStep: number;

  /** Radians per second. Bands alternate direction with their inclination. */
  speed: number;
  /** Per-soul variation, as a fraction of `speed`. At 0 a band turns rigidly. */
  speedScatter: number;

  /** Radial breathing, so an orbit is not a drawn circle. */
  wobble: number;
  wobbleRate: number;

  /**
   * Dot diameter in body radii. The outline is authored in px because it is
   * *structure* — the drawn edge of the widget, which must hold its weight at
   * any size. Souls are *content*: at 40px a px-authored dot is nearly as wide
   * as the world it orbits and the swarm reads as noise. Scaling with the body
   * is also what makes a cinematic push-in work, since zoom carries them.
   */
  dot: number;
  dotScatter: number;
  /** The px a dot never falls below, so a small widget has dots and not dust. */
  dotFloor: number;

  /**
   * A contrasting ring around each dot, as a fraction of its radius. Drawn
   * *outside* the fill, so a dot keeps its weight and gains an edge.
   *
   * The inks below are chosen by where a soul is; legibility depends on
   * what is under it, and the body owns the whole ramp. A ring carries both ends
   * of the ramp on every dot, which is the same argument the planet's own
   * outline already makes. 0 is off.
   */
  ring: number;

  /**
   * The share of the swarm the harness owns, 0…1 — and a *share* is a count, so
   * this resolves to whole souls. Each rider is fully on its line; nothing is
   * partly on one. Pulling a soul part of the way there was tried and is wrong:
   * the two places it could be are two points on a sphere, and the straight line
   * between them is a chord that passes through the world.
   *
   * Authored as a fraction because the swarm's size changes under it, and
   * because the mechanic is anchor upgrades buying riders a soul at a time.
   */
  riders: number;

  /**
   * The two ends of one travel, and neither is a resting state: a soul sits on
   * its own orbit until a caller's `merge` share drives it off, and no caller
   * that leaves that unset moves a soul at all.
   *
   * `settleAt` is in body radii and sits under `rim`, so a soul that stays is
   * taken *into* the world rather than parked over it: on the near side it is
   * drawn against the surface, and on the far side the ink rule has already
   * swallowed it. How deep is a look, and the range runs past the rim for the
   * one that hovers instead.
   *
   * `strayTo` is a multiple of the soul's own orbit, so a wide band strays wider
   * than a tight one and the swarm keeps its shape on the way out. Its ceiling
   * is the box: a swarm strayed past the frame's edge is a swarm that has left
   * before the decision was taken.
   */
  settleAt: number;
  strayTo: number;

  /**
   * The two knobs that make the split a movement rather than a readout, and
   * neither is worth much without the other.
   *
   * `crossing` is how many souls are in the air at once — the width of the
   * boundary in `travelOf`. `mergeLag` is how long the swarm takes to catch up
   * to a split that has already moved, as the time constant of an exponential
   * chase in seconds: the number is where the swarm has got to about 63% of the
   * way, so the tail is a good deal longer than it reads.
   *
   * The lag is the one thing in the swarm that is **not** a pure function of
   * `elapsed` — it carries a value between frames, which is exactly what the
   * berths were built to avoid. It is a much smaller sin: one scalar for the
   * whole swarm and not one per soul, and it converges, so two views of a world
   * whose split has stopped moving still agree on where every soul is. Only the
   * drag itself is a view's own business. 0 turns it off and the swarm tracks
   * the slider frame for frame, which is what every screen but the harvest does
   * anyway, having no split to drag.
   */
  crossing: number;
  mergeLag: number;

  /**
   * Where a soul that is staying leaves its orbit for the core, as a point on
   * its own travel. Below this it is still coming in radially and `settleAt` is
   * what it is coming in *to*; above it, it is crossing to a berth.
   *
   * The chord objection that keeps a rider off a partly-travelled harness line
   * does not reach this. That one is about two points on a *sphere*, where the
   * straight line between them passes through the world; both ends of this are
   * already inside the world, so there is nothing for a chord to cut.
   */
  berthEnter: number;
  /**
   * How far a berthed soul strays from its berth, as a share of the room it has.
   * The room is half the gap to the nearest other berth, so at 1 two neighbours
   * at their furthest still do not meet and **nothing here is ever tested for a
   * collision** — the packing is what does the avoiding, and the wobble only
   * ever spends what the packing left over.
   *
   * That is the whole reason the core is berthed rather than simulated. A
   * separation pass would want a velocity per soul carried between frames, and
   * the swarm is a pure function of `elapsed`: every soul's place comes from its
   * seed and the clock, so two views of one world agree without talking.
   */
  berthWobble: number;

  /**
   * Two inks, one per place a soul can be *seen*: off the body and in front of
   * it. The far half is hidden. A pale third ink was tried for it and cut —
   * motion already says the path closes, and a dot that is neither in front nor
   * gone is only asking to be read as a nearer dot.
   */
  outTone: number;
  frontTone: number;
}

/**
 * One soul's orbit, as an orthonormal basis for its plane. Held this way so the
 * hot loop is two cosines and six multiplies, with no matrices and no allocation.
 */
export interface Soul {
  ux: number; uy: number; uz: number;
  vx: number; vy: number; vz: number;
  radius: number;
  speed: number;
  phase: number;
  /** Diameter in body radii. `zoom` only enters as the px floor, at draw time. */
  size: number;
  wobble: number;
  wobbleRate: number;
  /** Its place in the dealing order — the soul with place 0 rides first. */
  place: number;
}

/** xorshift, so one integer fixes the whole swarm — as `seed` does for the field. */
function createRandom(seed: number) {
  let state = (seed | 0) || 0x9e3779b9;

  return () => {
    state ^= state << 13;
    state ^= state >>> 17;
    state ^= state << 5;

    return (state >>> 0) / 4_294_967_296;
  };
}

/**
 * The band a cohort orbits on, from its index alone — so cohort 3 looks like
 * cohort 3 on every world and nothing is authored per planet.
 *
 * Inclination alternates, and direction alternates with it. Counter-rotation is
 * only jarring between bands that share a plane; separating the planes first is
 * what makes the opposed directions read as different orbits rather than as a
 * mistake against the body's spin.
 */
function bandAt(index: number, visual: SwarmVisual) {
  const step = Math.ceil(index / 2);
  const side = index % 2 === 1 ? 1 : -1;

  return {
    radius: visual.radius + index * visual.spacing,
    tilt: visual.tiltStep * step * side,
    node: GOLDEN_ANGLE * index,
    direction: side,
  };
}

/** Symmetric about zero, so scatter widens a band without moving it. */
function strayBy(random: () => number, reach: number) {
  return (random() * 2 - 1) * reach;
}

/**
 * The plane's basis. Starts in the body's own equator — the swarm sits inside
 * the tilt group and outside the spinner, so "equatorial" is the group's XZ
 * plane and needs no angle authored for it.
 */
function orbitBasis(soul: Soul, tilt: number, node: number) {
  const ct = Math.cos(tilt);
  const st = Math.sin(tilt);
  const cn = Math.cos(node);
  const sn = Math.sin(node);

  soul.ux = cn;
  soul.uy = 0;
  soul.uz = -sn;

  soul.vx = ct * sn;
  soul.vy = -st;
  soul.vz = ct * cn;
}

/**
 * The order souls take the harness in. Drawn from the swarm's own seed, so it is
 * fixed for a given swarm: raising the rider count puts one more soul on a line
 * rather than dealing the whole swarm again. Shuffled rather than taken in index
 * order, which would fill the innermost cohort before the next one has a rider.
 */
function dealPlaces(souls: Soul[], random: () => number) {
  const order = souls.map((unused, i) => i);

  for (let i = order.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));

    [order[i], order[j]] = [order[j], order[i]];
  }

  order.forEach((soul, place) => (souls[soul].place = place));
}

/** One soul per unit of `counts[i]`, while the counts are small enough to mean it. */
export function createSouls(visual: SwarmVisual, counts: number[]): Soul[] {
  const random = createRandom(visual.seed);
  const souls: Soul[] = [];

  counts.forEach((count, index) => {
    const band = bandAt(index, visual);
    const wanted = Math.max(0, Math.floor(count));

    for (let i = 0; i < wanted && souls.length < SOUL_CAPACITY; i++) {
      const soul: Soul = {
        ux: 0, uy: 0, uz: 0,
        vx: 0, vy: 0, vz: 0,
        radius: band.radius + strayBy(random, visual.radiusScatter),
        speed: band.direction * visual.speed * (1 + strayBy(random, visual.speedScatter)),
        phase: random() * Math.PI * 2,
        size: Math.max(0.002, visual.dot + strayBy(random, visual.dotScatter)),
        wobble: visual.wobble * random(),
        wobbleRate: visual.wobbleRate * (0.5 + random()),
        place: 0,
      };

      orbitBasis(
        soul,
        band.tilt + strayBy(random, visual.tiltScatter),
        band.node + strayBy(random, visual.nodeScatter),
      );

      souls.push(soul);
    }
  });

  dealPlaces(souls, random);

  return souls;
}

/** A share of a swarm as the whole souls it comes to. */
export function shareOf(share: number, souls: number) {
  return Math.max(0, Math.min(souls, Math.round(share * souls)));
}

/** How many souls ride, from the share. A share that buys none buys nothing. */
export function riderCount(visual: SwarmVisual, souls: number) {
  return shareOf(visual.riders, souls);
}

/**
 * And how many actually ride here: a caller's own count when it has one, the
 * authored share otherwise. The count wins because riders are *bought* a soul at
 * a time — a share is what the lab has to author with, since it drags a swarm
 * whose size moves under it, but a game that knows the figure should not have to
 * turn it back into a fraction of a number it cannot see.
 */
export function ridersOf(visual: SwarmVisual, souls: number, riders?: number) {
  if (riders === undefined) return riderCount(visual, souls);

  return Math.max(0, Math.min(souls, Math.floor(riders)));
}

/**
 * Which side of the split a soul is on, 0…1 — 1 stays with the world, 0 comes
 * away with you. Read from the **top** of the dealing order, because `riders`
 * reads it from the bottom: the two must not pick the same souls first, or a
 * drag would strip the harness before it touched anything else.
 *
 * Fractional on purpose, for `crossing` souls at a time. At 1 the boundary is a
 * single soul part of the way over and the swarm switches a dot at a step, which
 * is honest and reads as a counter; wider and the boundary is a band with a
 * leading edge, which reads as a current. The decision is a flow of people and
 * should look like one, so the default is wide.
 *
 * The share is scaled by `souls + crossing` rather than by `souls`, so widening
 * the band does not cost the ends: at a share of 1 the last soul still reaches
 * a full 1 instead of stalling `crossing` places short of the middle.
 */
export function travelOf(soul: Soul, share: number, souls: number, crossing = 1) {
  const width = Math.max(1, crossing);

  return Math.max(0, Math.min(1, (share * (souls + width) - rankOf(soul, souls)) / width));
}

/**
 * A soul's rank in the split — 0 is the first to stay, and the last to leave.
 * Its own two callers have to read it the same way round or a soul would cross
 * to a berth that belongs to a different one.
 */
export function rankOf(soul: Soul, souls: number) {
  return souls - 1 - soul.place;
}

/**
 * The room a berth has, in body radii: half the gap to the nearest other berth,
 * which is what a wobble may spend without two souls ever meeting.
 *
 * `n` berths packed into a ball of radius `radius` each own `4/3·π·r³/n` of it,
 * so the gap between centres is the cube root of that volume — the same
 * arithmetic that gives `berthOf` its radii, read the other way.
 */
export function berthRoom(souls: number, radius: number) {
  if (souls < 2) return radius;

  return radius * Math.cbrt((4 * Math.PI) / (3 * souls)) * 0.5;
}

/**
 * Van der Corput base 2 — the bits of `n` reflected about the binary point.
 *
 * Wanted over a golden-ratio sequence for one property: **every prefix is well
 * spread**, not just the whole. The core fills in rank order, so what has to
 * look even is the first k of these for every k, and that is exactly what a
 * radical inverse guarantees — each new value lands in the largest gap left.
 */
function radicalInverse(n: number) {
  let bits = n >>> 0;

  bits = ((bits << 16) | (bits >>> 16)) >>> 0;
  bits = (((bits & 0x5555_5555) << 1) | ((bits & 0xaaaa_aaaa) >>> 1)) >>> 0;
  bits = (((bits & 0x3333_3333) << 2) | ((bits & 0xcccc_cccc) >>> 2)) >>> 0;
  bits = (((bits & 0x0f0f_0f0f) << 4) | ((bits & 0xf0f0_f0f0) >>> 4)) >>> 0;
  bits = (((bits & 0x00ff_00ff) << 8) | ((bits & 0xff00_ff00) >>> 8)) >>> 0;

  return bits * 2.328_306_436_538_696_3e-10;
}

/**
 * Where a soul that has arrived stands, from its rank alone — so a berth is
 * fixed for the whole drag and a soul crossing to one is not chasing it.
 *
 * **Radius and direction come from different sequences, and that is the whole
 * of it.** The rank gives the radius, cube-rooted so the ball fills evenly
 * rather than crowding the shell — volume goes as r³. The direction is a
 * Fibonacci spiral: the azimuth from the golden angle, the latitude from the
 * radical inverse of the same rank.
 *
 * Taking the latitude from the *radius* instead, as the plain spiral does, was
 * the bug this replaces. Both terms then ran off one number, so the outermost
 * berth was always at the south pole and the innermost always at the north —
 * and since the innermost has no radius to speak of, the whole packing came out
 * as a ball with a spike hanging off the bottom and nothing at the top. It read
 * exactly as it was: the souls sat low and never reached the core's edge.
 *
 * Rank 0 still lands at the middle, which is the read: the core fills from its
 * centre outward as more of the swarm is given to it, rather than growing a
 * crust. And the packing is for the **whole** swarm rather than for the merged
 * count, so dragging the split fills more berths instead of moving all of them.
 */
export function berthOf(
  rank: number,
  souls: number,
  radius: number,
  out: { x: number; y: number; z: number },
) {
  const at = (rank + 0.5) / Math.max(1, souls);

  const radial = radius * Math.cbrt(at);
  const y = 1 - 2 * radicalInverse(rank);
  const ring = Math.sqrt(Math.max(0, 1 - y * y));
  const angle = GOLDEN_ANGLE * rank;

  out.x = radial * ring * Math.cos(angle);
  out.y = radial * y;
  out.z = radial * ring * Math.sin(angle);
}

/**
 * What to multiply a placed soul's position by. Radial, so the soul never
 * leaves the plane of its own orbit — the objection that keeps a rider off a
 * partly-travelled harness line does not reach this, because there is no chord.
 *
 * A split shows both of its sides at once: everything not staying is already on
 * its way out, which is why a share of 0 is a swarm gathered to leave rather
 * than a swarm at rest. A caller with nothing to split passes no share at all
 * and none of this runs.
 */
export function settleScale(soul: Soul, travel: number, visual: SwarmVisual) {
  const held = soul.radius > 1e-6 ? visual.settleAt / soul.radius : 1;

  return visual.strayTo + (held - visual.strayTo) * travel;
}

/** Where a soul is at `elapsed`. Writes into `out`, so the loop allocates nothing. */
export function placeSoul(
  soul: Soul,
  elapsed: number,
  out: { x: number; y: number; z: number },
) {
  const angle = soul.phase + soul.speed * elapsed;
  const radius = soul.radius
    * (1 + Math.sin(elapsed * soul.wobbleRate + soul.phase) * soul.wobble);

  const along = Math.cos(angle) * radius;
  const across = Math.sin(angle) * radius;

  out.x = soul.ux * along + soul.vx * across;
  out.y = soul.uy * along + soul.vy * across;
  out.z = soul.uz * along + soul.vz * across;
}

/**
 * How far round its own orbit a soul is, 0…1. The same figure indexes a harness
 * loop, so a soul can be put on a line without its motion changing rate and
 * without a second clock being started for it.
 */
export function phaseOf(soul: Soul, elapsed: number) {
  const turns = (soul.phase + soul.speed * elapsed) / (Math.PI * 2);

  return turns - Math.floor(turns);
}

export type SwarmGroup = 'Orbits' | 'Scatter' | 'Souls';

export interface SwarmParam {
  key: keyof SwarmVisual;
  label: string;
  group: SwarmGroup;
  min: number;
  max: number;
  step: number;
}

export const SWARM_GROUPS: SwarmGroup[] = ['Orbits', 'Scatter', 'Souls'];

/** Shaped like `VISUAL_PARAMS`, so wiring a panel onto it is mechanical. */
export const SWARM_PARAMS: SwarmParam[] = [
  { key: 'radius', label: 'Radius', group: 'Orbits', min: 1, max: 2, step: 0.01 },
  { key: 'spacing', label: 'Spacing', group: 'Orbits', min: 0, max: 0.4, step: 0.005 },
  { key: 'tiltStep', label: 'Tilt step', group: 'Orbits', min: 0, max: 1.6, step: 0.01 },
  { key: 'speed', label: 'Speed', group: 'Orbits', min: 0, max: 1.5, step: 0.01 },
  { key: 'rim', label: 'Rim', group: 'Orbits', min: 0.8, max: 1.3, step: 0.005 },

  { key: 'radiusScatter', label: 'Radius scatter', group: 'Scatter', min: 0, max: 0.3, step: 0.005 },
  { key: 'tiltScatter', label: 'Tilt scatter', group: 'Scatter', min: 0, max: 0.8, step: 0.005 },
  { key: 'nodeScatter', label: 'Node scatter', group: 'Scatter', min: 0, max: 3.2, step: 0.01 },
  { key: 'speedScatter', label: 'Speed scatter', group: 'Scatter', min: 0, max: 1, step: 0.01 },
  { key: 'wobble', label: 'Wobble', group: 'Scatter', min: 0, max: 0.3, step: 0.005 },
  { key: 'wobbleRate', label: 'Wobble rate', group: 'Scatter', min: 0, max: 3, step: 0.05 },

  { key: 'dot', label: 'Dot', group: 'Souls', min: 0.004, max: 0.12, step: 0.002 },
  { key: 'dotScatter', label: 'Dot scatter', group: 'Souls', min: 0, max: 0.06, step: 0.002 },
  { key: 'dotFloor', label: 'Dot floor px', group: 'Souls', min: 0, max: 4, step: 0.25 },
  { key: 'riders', label: 'Riders', group: 'Souls', min: 0, max: 1, step: 0.01 },
  { key: 'settleAt', label: 'Settle at', group: 'Souls', min: 0, max: 1.2, step: 0.005 },
  { key: 'strayTo', label: 'Stray to', group: 'Souls', min: 1, max: 4, step: 0.05 },
  { key: 'crossing', label: 'Crossing at once', group: 'Souls', min: 1, max: 24, step: 1 },
  { key: 'mergeLag', label: 'Merge lag s', group: 'Souls', min: 0, max: 2, step: 0.05 },
  { key: 'berthEnter', label: 'Berth from', group: 'Souls', min: 0, max: 1, step: 0.01 },
  { key: 'berthWobble', label: 'Berth wobble', group: 'Souls', min: 0, max: 1, step: 0.01 },
  { key: 'ring', label: 'Ring', group: 'Souls', min: 0, max: 0.8, step: 0.02 },
  { key: 'outTone', label: 'Tone outside', group: 'Souls', min: 0, max: 6, step: 1 },
  { key: 'frontTone', label: 'Tone in front', group: 'Souls', min: 0, max: 6, step: 1 },
];

export const DEFAULT_SWARM: SwarmVisual = {
  seed: 50149,
  radius: 1.3,
  spacing: 0.045,
  rim: 1,
  radiusScatter: 0.095,
  tiltScatter: 0.13,
  nodeScatter: 0.24,
  tiltStep: 0.74,
  speed: 0.69,
  speedScatter: 0.31,
  wobble: 0.065,
  wobbleRate: 0.8,
  dot: 0.042,
  dotScatter: 0.012,
  dotFloor: 1.5,
  riders: 0,
  settleAt: 0.8,
  strayTo: 1.1,
  crossing: 24,
  mergeLag: 0.25,
  berthEnter: 0.75,
  berthWobble: 1,
  ring: 0.3,
  outTone: 6,
  frontTone: 0,
};

export function cloneSwarm(visual: SwarmVisual): SwarmVisual {
  return { ...visual };
}

/** A TS literal, ready to paste back over `DEFAULT_SWARM`. */
export function printSwarm(visual: SwarmVisual) {
  const lines = Object.entries(visual).map(
    ([key, value]) => `  ${key}: ${Number(value.toFixed(4))},`,
  );

  return `export const DEFAULT_SWARM: SwarmVisual = {\n${lines.join('\n')}\n};`;
}
