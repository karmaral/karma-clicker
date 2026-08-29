/**
 * The click. One **flash** is one click, and it leaves marks in two waves: a
 * **halo** and a **bolt**, both born with the press — and a **spark**, born
 * with the payout the bolt was flying toward. A halo is a pair of rings around
 * the whole world, facing the camera and *inverting* whatever they cross; a
 * bolt is a warped line struck at a spot chosen the moment it leaves, so the
 * wait between press and payout is the flight and not a mystery; a spark lands
 * on that same spot once the wait is over.
 *
 * Nothing here is game state. The scene is told a click landed and never learns
 * what it bought, the same separation `orbit.ts` and `anchor.ts` keep.
 */

import type { SurfaceField } from './field';

/**
 * Slots per kind of mark. A click is transient rather than accumulated, so the
 * oldest slot is overwritten instead of the list growing — which is also why
 * nothing here has to be swept.
 */
export const PULSE_CAPACITY = 32;

/** One per spark, so it matches `sparks`' own top of 8. */
export const BOLT_CAPACITY = 8;

/**
 * A ring is drawn on a quad whose *inscribed* circle is the ring's own radius,
 * so a stroke centred on that circle has its outer half cut off by the quad's
 * edge at the four cardinal points — the crop. Every ring quad is built this
 * much wider than the furthest thing on it, and its shader divides back out.
 */
export const STROKE_ROOM = 1.08;

export interface Mark {
  /** The pulse clock when it flashed. `-Infinity` is a slot never used. */
  born: number;
}

export interface Halo extends Mark {
  /**
   * Where this flash's echo starts its turn, in radians. Drawn once, so two
   * clicks in a row are not the same broken ring twice.
   */
  turn: number;
  /**
   * Its own draw against the lobe count, -1…1. The *draw* rather than the count
   * it produced: `echoScatter` scales it in the shader, so a slider moved while
   * a flash is still in the air moves that flash too.
   */
  scatter: number;
}

export interface Spark extends Mark {
  /** A unit direction in *object* space, so a flash sticks to the ground it hit. */
  x: number;
  y: number;
  z: number;
  /** The terrain's radius along it, sampled once — a flash outlives no slider. */
  r: number;
}

/**
 * Somewhere a spark may be put, in the body's own frame: a direction and how
 * far out along it. The ground is one, and so is the cap of an anchor standing
 * on it — which is the whole of what a caller needs to aim a strike.
 */
export type Spot = Pick<Spark, 'x' | 'y' | 'z' | 'r'>;

/**
 * The strike: a warped line from the cursor to the spot it is aimed at, in the
 * scene's own frame — the one `Halo` already draws in, outside the body's
 * spin. `Bolt` reads both ends live every frame the mark is alive, and both
 * fall back once there is nowhere live left to read: `fx`/`fy` to where the
 * cursor started, `to` to the world's own centre.
 *
 * `to` is a frozen `Spot` chosen at the press — before the spark it is aimed at
 * exists — rather than a `Spark` read live: a ring-buffer slot can be reused
 * by a later click while this bolt is still in flight, which would silently
 * retarget it. `sparkWorldPosition` is re-run on it every frame regardless, so
 * the far end still chases the body's own spin exactly as a live spark would.
 * `undefined` only while a slot has never held a strike; every live bolt was
 * given one at `bolt()`.
 */
export interface Bolt extends Mark {
  fx: number; fy: number;
  to: Spot | undefined;
  /** Its own draw against the warp, so two strikes in a row are not one shape twice. */
  seed: number;
}

/**
 * How the world is held at the moment of a click, in `PlanetBody`'s own three
 * angles plus where the spin has got to. A spark is placed on the face the
 * camera can see, and this is what says which ground that is.
 */
export interface Facing {
  lean: number;
  tilt: number;
  turn: number;
  spin: number;
}

export interface PulseVisual {
  /**
   * The burst: the world's own shape thrown out behind it as a thick band, in
   * px, and the planet's outline flashing to `burstEdge` over the top of it.
   * 0 is the whole thing off.
   *
   * It is the halo's opposite and the reason both exist. A halo is a *circle*
   * about the world and says nothing about which world it is around; the burst
   * is the silhouette, terrain and all, so it is the same mark on a smooth ball
   * and on a ridged one only if those two read the same in the first place.
   *
   * The hull is the outline's construction at a much greater width — radially
   * offset, so it provably cannot self-intersect however lumpy the body is.
   */
  burstWidth: number;
  /** Its ink. 6 is the dark end of the ramp, which is what was asked for. */
  burstTone: number;
  /**
   * What the body's *own* outline flashes to while the burst is up. 0 is the
   * paper end, so the world is drawn white-edged against its own shadow.
   *
   * It is the only place anything writes over an authored `outlineTone`, and it
   * is a flash rather than a state: at the end of `burstLife` the outline is
   * exactly what the world authored, with nothing to restore.
   */
  burstEdge: number;
  /** Seconds from the flash to gone. Short — this is a blink, not a halo. */
  burstLife: number;

  /**
   * Where the halo is born and where it has got to when it dies, in body radii.
   * Born outside the silhouette: a ring that starts on the world reads as a
   * band drawn on it rather than as something leaving it.
   */
  haloFrom: number;
  haloTo: number;
  /** Seconds from the flash to gone. */
  haloLife: number;
  /**
   * Its stroke, in px. A halo is a drawn edge — structure, not content — so it
   * is authored on screen and holds that weight at any radius, which is the
   * argument the outline and the contour already make.
   *
   * There is no `haloTone` beside it. The halo carries no ink at all: it
   * **inverts** what it passes over, so its colour is whatever was already
   * there, reversed — which is the one mark in the medium that cannot be wrong
   * against its background, and the reason the alpha-fade exception is gone.
   */
  haloWidth: number;

  /**
   * The halo's second ring, and the only one that is not a circle: its radius
   * is warped by an angular noise, so a flash leaves one clean edge and one
   * broken one. `echoWidth` 0 is the whole thing off.
   */
  echoWidth: number;
  /** Where it runs, as a multiple of the main ring's radius. 1 is on top of it. */
  echoScale: number;
  /** How far the warp pushes it, as a share of its own radius. */
  echoWarp: number;
  /** Lobes around the turn. Three sines off this, so it never closes on a rosette. */
  echoBands: number;
  /**
   * How far the lobe count wanders from flash to flash, as a share of itself.
   * The *count* and not the warp, because the quad is sized off the warp — a
   * scattered warp would have to reserve room for its own widest draw, where a
   * scattered count changes the rhythm and costs nothing. 0 is every echo alike.
   */
  echoScatter: number;
  /** How far it inverts, 0…1 — what makes it the subtler of the two. */
  echoDepth: number;

  /** How many sparks one flash makes. 0 leaves the halo on its own. */
  sparks: number;
  /** The flash's radius, in body radii — content, so sized like a soul. */
  sparkDot: number;
  /** How far its ring travels out, as a multiple of the dot. 1 is no travel. */
  sparkRing: number;
  /** The ring's stroke in px, on the halo's argument. */
  sparkWidth: number;
  sparkLife: number;

  /**
   * The flare: a cross of two quads standing on the dot along the surface
   * normal, tapered wider at the base, so a spark reads as a small cone struck
   * off the ground rather than as a sticker on it.
   *
   * Its height, in multiples of the dot's radius, at the flash and where it has
   * got to when it dies — the halo's `From`/`To` again, because a flare that
   * holds one height for its whole life reads as a decal, not as a strike. Both
   * at 0 is the flare off, and leaves the dot and its ring alone.
   *
   * The flare is the one part of a mark that is **not** drawn on the far side —
   * a cone struck away from the camera has no near-side reading — so it fades
   * out at the limb and `sparkBack` does not reach it.
   */
  sparkRiseFrom: number;
  sparkRiseTo: number;
  /**
   * The blade's base as a multiple of its top, over the same two moments. 1 is
   * a slab rather than a cone, so wide-to-narrow is a flame collapsing into a
   * spike and narrow-to-wide is one opening out.
   */
  sparkFlareFrom: number;
  sparkFlareTo: number;

  /**
   * Where on the world a mark may land, as the cosine of its angle off the
   * camera. 0 is the visible half exactly; above that it also keeps marks off
   * the limb, where the ground is edge-on and a dot foreshortens into the
   * silhouette; −1 is the whole sphere, which is where this started.
   *
   * Sampled in view space and turned back into the body's frame, so the hold
   * and the spin decide which ground is facing you *at the click*. A cutoff
   * taken on the body's own axes would pin marks to a fixed patch and let the
   * spin carry them away.
   */
  sparkFace: number;

  /**
   * What the *dot and its ring* keep on the far side of the body, 0…1. The
   * silhouette decides the ink; this decides how much of it, because a mark on
   * the back of the world sits inside the silhouette and would otherwise be
   * indistinguishable from one on the front. 1 is the far side as loud as the
   * near, 0 is the near half only — and it is the near half only for the flare
   * either way.
   *
   * It only says anything while `sparkFace` is below 0 and marks reach the back
   * at all.
   */
  sparkBack: number;

  /**
   * The flash, and the ring around it — **over the body**. Off it both invert
   * to the far end of the ramp, so a spark that stands out past the silhouette
   * changes ink at exactly the place the harness and the souls already do.
   */
  sparkTone: number;
  sparkRingTone: number;

  /**
   * An outline around the mark, in pixels — a drawn edge, so it is authored on
   * screen like every other one and holds its weight at any world size. 0 is
   * off.
   *
   * It goes round the **whole mark at once**: the dot, the ring travelling out
   * of it and both blades are grown together and the border of what they cover
   * between them is what gets inked, so nothing is outlined against the inside
   * of anything else. Its ink is `sparkTone` flipped, on both sides of the
   * silhouette, which is why there is no tone beside it — an outline that could
   * be authored the same as its fill could be authored invisible.
   */
  sparkOutline: number;

  /**
   * The strike: a bolt from the press toward the spot it is aimed at, drawn
   * with the press rather than the payout — the wait between the two is the
   * flight, so a queued click reads as travelling rather than as nothing
   * happening.
   *
   * Its own two tones, on the spark's own argument: a fill and an outline grown
   * past it in the fill's flip, so it reads whatever it crosses.
   */
  boltWidth: number;
  /** Seconds from the press to landing, at the floor — see `PlanetScene`, which
   * lifts this to the click's own duration whenever that is longer. The whole
   * of it once a click has ramped to instant. */
  boltLife: number;
  /** How far the warp pushes it off the straight line, as a share of its own length. */
  boltWarp: number;
  /** Bends along its length. Not lobes around a ring — see the halo's `echoBands`. */
  boltBends: number;
  boltTone: number;
  /** In pixels, grown past the fill in the fill's flip. 0 is the outline off. */
  boltOutline: number;
  /**
   * How much of the drawn length is lit behind the head, as a share of it —
   * the rest reads as spent trail rather than an unlit gap, so a long flight is
   * a line advancing rather than a rod materialising whole.
   */
  boltTrail: number;
}

/**
 * How far past its own radius a halo's quad has to reach: the echo's widest
 * warped radius, or the main ring's own 1, plus the room every stroke needs.
 * Read by the component to size the quad and by the shader to divide it back
 * out, so the two cannot drift.
 */
export function haloSpreadOf(visual: PulseVisual) {
  const echo = visual.echoWidth > 0 ? visual.echoScale * (1 + visual.echoWarp) : 0;

  return Math.max(1, echo) * STROKE_ROOM;
}


/**
 * A spark's position in the scene's own frame — object space undone, so a
 * screen can be told where it landed. The forward reading of `spark`'s own
 * backward chain: `Ry(turn + spin)` first, then `Rx(tilt)`, then `Rz(-lean)`,
 * signs un-flipped since nothing here is being undone this time.
 */
export function sparkWorldPosition(mark: Spot, held: Facing) {
  const px = mark.x * mark.r, py = mark.y * mark.r, pz = mark.z * mark.r;

  const round = held.turn + held.spin;
  const roundC = Math.cos(round), roundS = Math.sin(round);
  const qx = px * roundC + pz * roundS;
  const qz = pz * roundC - px * roundS;
  const qy = py;

  const tiltC = Math.cos(held.tilt), tiltS = Math.sin(held.tilt);
  const ry = qy * tiltC - qz * tiltS;
  const rz = qy * tiltS + qz * tiltC;
  const rx = qx;

  const leanC = Math.cos(held.lean), leanS = Math.sin(held.lean);
  const wx = rx * leanC + ry * leanS;
  const wy = ry * leanC - rx * leanS;
  const wz = rz;

  return { x: wx, y: wy, z: wz };
}

/**
 * How far through its life a mark is: 0 at the flash, 1 when it is gone. Past
 * 1 nothing draws it, which is the whole of the expiry — a slot is free because
 * it is old, not because anything swept it.
 */
export function lifeOf(mark: Mark, now: number, life: number) {
  return life > 0 ? (now - mark.born) / life : 2;
}

/**
 * Out, so a mark leaves fast and eases — but only *quadratically* out, and the
 * fade below is the steeper of the two on purpose. Cubed here against a squared
 * fade put the halo at 99% of its travel while still a quarter visible, which
 * reads as a ring that stops in mid-air and is then rubbed out. It has to still
 * be moving when it goes.
 */
export function growOf(t: number) {
  const left = 1 - t;

  return 1 - left * left;
}

/** Cubed, so a mark is spent well before it is done travelling. */
export function fadeOf(t: number) {
  const left = 1 - t;

  return left * left * left;
}

/**
 * The bolt's own alpha, not `fadeOf`: a strike can live as long as the click's
 * own duration, and fading it out over that whole flight would leave it a
 * ghost by the halfway point. A bolt holds its full weight until it lands, and
 * `boltTrail` is what makes it read as travelling rather than as a static rod.
 */
export function holdOf(_t: number) {
  return 1;
}

/**
 * The scene's marks and the clock they are timed by, together — two components
 * draw them and a clock either of them owned would be a second one.
 */
export function createPulses() {
  const halos: Halo[] = Array.from({ length: PULSE_CAPACITY }, () => ({
    born: -Infinity, turn: 0, scatter: 0,
  }));

  const sparks: Spark[] = Array.from({ length: PULSE_CAPACITY }, () => ({
    born: -Infinity, x: 0, y: 1, z: 0, r: 1,
  }));

  const bolts: Bolt[] = Array.from({ length: BOLT_CAPACITY }, () => ({
    born: -Infinity, fx: 0, fy: 0, to: undefined, seed: 0,
  }));

  /**
   * One, and restarted rather than queued. The burst is the *world's* shape,
   * and there is one world — thirty-two of them would be the same silhouette
   * drawn thirty-two times, so a second click restarts the blink instead of
   * stacking another on it.
   */
  const burst: Mark = { born: -Infinity };

  let now = 0;
  let nextHalo = 0;
  let nextSpark = 0;
  let nextBolt = 0;

  /**
   * Clamped, because the widget renders on demand: a world that has been idle
   * or in a hidden tab can come back with a delta longer than a flash's whole
   * life, and the click that woke it would be over before it was drawn.
   */
  function advance(delta: number) {
    now += Math.min(delta, 0.1);
  }

  /**
   * The click itself: the halo's pair of rings and the outline's blink. No
   * `Facing` needed — a ring about the whole world reads the same wherever the
   * world is held.
   */
  function echo() {
    const halo = halos[nextHalo];

    burst.born = now;
    halo.born = now;
    halo.turn = Math.random() * Math.PI * 2;
    halo.scatter = Math.random() * 2 - 1;

    nextHalo = (nextHalo + 1) % PULSE_CAPACITY;
  }

  /**
   * One random spot on the cap the camera can see, in the body's own frame —
   * `spark()`'s own fallback, pulled out so `aim()` can pick the same way
   * before there is a ring-buffer slot to write it into.
   *
   * The directions are `Math.random` and not the seeded stream the swarm and
   * the caps use: a spark is an *event*, so two landing in the same place is
   * the failure, not the unreproducibility.
   */
  function pickSpot(field: SurfaceField, face: number, held: Facing): Spot {
    const lean = Math.cos(held.lean), leanS = Math.sin(held.lean);
    const tilt = Math.cos(held.tilt), tiltS = Math.sin(held.tilt);
    const round = -(held.turn + held.spin);
    const spun = Math.cos(round), spunS = Math.sin(round);

    // Uniform on the cap the camera can see: the view axis first, then a
    // point on the ring of the radius that leaves.
    const az = face + Math.random() * (1 - face);
    const around = Math.random() * Math.PI * 2;
    const ring = Math.sqrt(Math.max(0, 1 - az * az));
    const ax = Math.cos(around) * ring;
    const ay = Math.sin(around) * ring;

    // And back into the body's frame. `PlanetBody` nests Rz(−lean), Rx(tilt)
    // and Ry(turn + spin) in that order, so this is the same chain read
    // backwards — written out rather than taken from three, because nothing
    // here may import it and stay probeable.
    const bx = ax * lean - ay * leanS;
    const by = ax * leanS + ay * lean;
    const cy = by * tilt + az * tiltS;
    const cz = az * tilt - by * tiltS;

    const x = bx * spun + cz * spunS;
    const y = cy;
    const z = cz * spun - bx * spunS;

    return { x, y, z, r: field.sampleRadius(x, y, z) };
  }

  /**
   * Where a flash will land, chosen before there is a payout to land it —
   * the bolt needs a target the moment it leaves. Returns spots rather than
   * writing them anywhere; `spark()` below is what turns a spot into a mark.
   *
   * `findSpot` is asked once per spot, and is the one thing about a flash a
   * caller may decide: a spot puts it there, `undefined` rolls the cap. The
   * roll lives out there too — what a strike might prefer to hit is the
   * world's business, and this module is not allowed to know there is
   * anything standing on the ground.
   */
  function aim(
    count: number,
    field: SurfaceField,
    face: number,
    held: Facing,
    findSpot?: () => Spot | undefined,
  ) {
    const spots: Spot[] = [];

    for (let i = 0; i < count; i++) {
      spots.push(findSpot?.() ?? pickSpot(field, face, held));
    }

    return spots;
  }

  /**
   * Where a click landed. Writes the spots already `aim`ed into ring-buffer
   * slots, one per spot — a spark is the mark, `aim` is the choice.
   *
   * Returns what it wrote — the ring buffer has no other way to say which
   * slots are new.
   */
  function spark(spots: Spot[]) {
    const written: Spark[] = [];

    for (const spot of spots) {
      const mark = sparks[nextSpark];

      mark.x = spot.x;
      mark.y = spot.y;
      mark.z = spot.z;
      mark.r = spot.r;
      mark.born = now;

      written.push(mark);
      nextSpark = (nextSpark + 1) % PULSE_CAPACITY;
    }

    return written;
  }

  /**
   * The strike. The press is already a world point, unprojected by the caller;
   * the far end is a frozen `Spot` — see `Bolt`'s own doc for why it is not
   * the live spark.
   */
  function bolt(from: { x: number; y: number }, to: Spot) {
    const mark = bolts[nextBolt];

    mark.born = now;
    mark.fx = from.x;
    mark.fy = from.y;
    mark.to = to;
    mark.seed = Math.random() * Math.PI * 2;

    nextBolt = (nextBolt + 1) % BOLT_CAPACITY;
  }

  /** Whether anything is still drawing, so a quiet world stops asking for frames. */
  function isLive(life: number) {
    return now - burst.born < life
      || halos.some((mark) => now - mark.born < life)
      || sparks.some((mark) => now - mark.born < life)
      || bolts.some((mark) => now - mark.born < life);
  }

  return {
    burst,
    halos,
    sparks,
    bolts,
    get now() { return now; },
    advance,
    echo,
    aim,
    spark,
    bolt,
    isLive,
  };
}

export type Pulses = ReturnType<typeof createPulses>;

export type PulseGroup = 'Burst' | 'Halo' | 'Echo' | 'Spark' | 'Bolt';

export interface PulseParam {
  key: keyof PulseVisual;
  label: string;
  group: PulseGroup;
  min: number;
  max: number;
  step: number;
}

export const PULSE_GROUPS: PulseGroup[] = ['Burst', 'Halo', 'Echo', 'Spark', 'Bolt'];

/** Shaped like `SWARM_PARAMS`, so wiring a panel onto it is mechanical. */
export const PULSE_PARAMS: PulseParam[] = [
  // 0 is the burst off, so the three below need no switch of their own.
  { key: 'burstWidth', label: 'Hull px', group: 'Burst', min: 0, max: 80, step: 0.5 },
  { key: 'burstTone', label: 'Hull ink', group: 'Burst', min: 0, max: 6, step: 1 },
  { key: 'burstEdge', label: 'Edge ink', group: 'Burst', min: 0, max: 6, step: 1 },
  { key: 'burstLife', label: 'Life', group: 'Burst', min: 0.05, max: 2, step: 0.05 },

  { key: 'haloFrom', label: 'From', group: 'Halo', min: 0.5, max: 3, step: 0.01 },
  // Past the framing on purpose: a halo that stops inside the frame reads as a
  // ring that was drawn and rubbed out, not as one that left.
  { key: 'haloTo', label: 'To', group: 'Halo', min: 0.5, max: 6, step: 0.01 },
  { key: 'haloLife', label: 'Life', group: 'Halo', min: 0.05, max: 4, step: 0.05 },
  // 0 is the main ring off, leaving the echo on its own.
  { key: 'haloWidth', label: 'Stroke px', group: 'Halo', min: 0, max: 12, step: 0.25 },

  // 0 is the whole echo off, so the four below need no switch of their own.
  { key: 'echoWidth', label: 'Stroke px', group: 'Echo', min: 0, max: 8, step: 0.25 },
  { key: 'echoScale', label: 'Radius', group: 'Echo', min: 0.5, max: 2, step: 0.01 },
  { key: 'echoWarp', label: 'Warp', group: 'Echo', min: 0, max: 0.4, step: 0.005 },
  { key: 'echoBands', label: 'Lobes', group: 'Echo', min: 1, max: 16, step: 0.5 },
  { key: 'echoScatter', label: 'Scatter', group: 'Echo', min: 0, max: 1, step: 0.02 },
  { key: 'echoDepth', label: 'Depth', group: 'Echo', min: 0, max: 1, step: 0.02 },

  // A count, and an upgrade axis: a click that incarnates more should mark the
  // world in more places. 0 is the sparks off.
  { key: 'sparks', label: 'Sparks', group: 'Spark', min: 0, max: 8, step: 1 },
  { key: 'sparkDot', label: 'Dot', group: 'Spark', min: 0, max: 0.25, step: 0.002 },
  { key: 'sparkRing', label: 'Ring reach', group: 'Spark', min: 1, max: 10, step: 0.1 },
  { key: 'sparkWidth', label: 'Ring px', group: 'Spark', min: 0, max: 8, step: 0.25 },
  // Both at 0 is the flare off, so the two below need no switch of their own.
  { key: 'sparkRiseFrom', label: 'Rise from', group: 'Spark', min: 0, max: 8, step: 0.1 },
  { key: 'sparkRiseTo', label: 'Rise to', group: 'Spark', min: 0, max: 8, step: 0.1 },
  { key: 'sparkFlareFrom', label: 'Base from', group: 'Spark', min: 1, max: 6, step: 0.05 },
  { key: 'sparkFlareTo', label: 'Base to', group: 'Spark', min: 1, max: 6, step: 0.05 },
  { key: 'sparkLife', label: 'Life', group: 'Spark', min: 0.05, max: 3, step: 0.05 },
  // −1 is the whole sphere, 0 the visible half, and it stops at 0.9 because a
  // cap any tighter than that is one point and the slider would stop meaning
  // anything before its end.
  { key: 'sparkFace', label: 'Face', group: 'Spark', min: -1, max: 0.9, step: 0.02 },
  { key: 'sparkBack', label: 'Far side', group: 'Spark', min: 0, max: 1, step: 0.02 },
  { key: 'sparkTone', label: 'Dot ink', group: 'Spark', min: 0, max: 6, step: 1 },
  { key: 'sparkRingTone', label: 'Ring ink', group: 'Spark', min: 0, max: 6, step: 1 },
  // Around the whole mark at once, and inked against it, so it has no tone of
  // its own to author. 0 is the outline off.
  { key: 'sparkOutline', label: 'Outline px', group: 'Spark', min: 0, max: 6, step: 0.25 },

  // 0 is the whole bolt off.
  { key: 'boltWidth', label: 'Stroke px', group: 'Bolt', min: 0, max: 8, step: 0.25 },
  { key: 'boltLife', label: 'Life', group: 'Bolt', min: 0.05, max: 1, step: 0.05 },
  { key: 'boltWarp', label: 'Warp', group: 'Bolt', min: 0, max: 0.3, step: 0.005 },
  { key: 'boltBends', label: 'Bends', group: 'Bolt', min: 1, max: 6, step: 0.5 },
  { key: 'boltTone', label: 'Ink', group: 'Bolt', min: 0, max: 6, step: 1 },
  { key: 'boltOutline', label: 'Outline px', group: 'Bolt', min: 0, max: 6, step: 0.25 },
  { key: 'boltTrail', label: 'Trail', group: 'Bolt', min: 0.05, max: 1, step: 0.05 },
];

export const DEFAULT_PULSE: PulseVisual = {
  burstWidth: 6,
  burstTone: 6,
  burstEdge: 0,
  burstLife: 0.15,
  haloFrom: 0.78,
  haloTo: 1.15,
  haloLife: 0.9,
  haloWidth: 0,
  echoWidth: 1.75,
  echoScale: 1.12,
  echoWarp: 0.26,
  echoBands: 1,
  echoScatter: 1,
  echoDepth: 0.8,
  sparks: 1,
  sparkDot: 0.045,
  sparkRing: 4,
  sparkWidth: 1.5,
  sparkRiseFrom: 0,
  sparkRiseTo: 6.4,
  sparkFlareFrom: 1.95,
  sparkFlareTo: 1.4,
  sparkLife: 0.8,
  sparkFace: 0.45,
  sparkBack: 0.25,
  sparkTone: 0,
  sparkRingTone: 0,
  sparkOutline: 1,
  boltWidth: 3,
  boltLife: 0.15,
  boltWarp: 0.105,
  boltBends: 2,
  boltTone: 0,
  boltOutline: 1,
  boltTrail: 0.35,
};

export function clonePulse(visual: PulseVisual): PulseVisual {
  return { ...visual };
}

/** A TS literal, ready to paste back over `DEFAULT_PULSE`. */
export function printPulse(visual: PulseVisual) {
  const lines = Object.entries(visual).map(
    ([key, value]) => `  ${key}: ${Number(value.toFixed(4))},`,
  );

  return `export const DEFAULT_PULSE: PulseVisual = {\n${lines.join('\n')}\n};`;
}
