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

    return (state >>> 0) / 4294967296;
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

/** How many souls ride, from the share. A share that buys none buys nothing. */
export function riderCount(visual: SwarmVisual, souls: number) {
  return Math.max(0, Math.min(souls, Math.round(visual.riders * souls)));
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
