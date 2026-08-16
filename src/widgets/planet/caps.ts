import type { PlanetVisual } from './visual';

/**
 * Terrain authored as features rather than as an octave. A tier is a count and
 * a size in radians — three caps at 0.42, six at 0.20, seven at 0.09 — so a
 * world can be told to have *three continents*, which is the one thing noise
 * cannot be asked for. Summed, not maxed: where two caps overlap the ground
 * stands higher than either, which makes a range rather than a seam.
 *
 * This is the same kind of thing as `sampleFbm` — a raw field, normalised by
 * `field.ts` and nowhere else — so it inherits the rest for free. Notably
 * `warp`, since the caps are read at the warped direction, and that is what
 * keeps a coastline off a circle.
 */

/** One placed feature. `cos` and `span` are precomputed; the hot loop is a dot product. */
interface Cap {
  x: number;
  y: number;
  z: number;
  /** Cosine of the angular radius, compared against a dot — no `acos` per vertex. */
  cos: number;
  /** 1 − cos: the denominator that puts the rim at 0 and the centre at 1. */
  span: number;
  /** The tier's, signed, so a tier of craters sinks where a tier of continents rises. */
  lift: number;
  /** Cosine of the skirt's outer edge, and its width in the same units as `span`. */
  cosOuter: number;
  outerSpan: number;
  /** 1 − cosOuter: the same edge measured from the cap's centre, for `sampleCoverage`. */
  coverSpan: number;
  /** The skirt's extreme, against `lift`. Zero switches the whole ring off. */
  lobe: number;
}

/** Arbitrary and mutually distant — three streams off one seed, not three seeds. */
const TIER_SEEDS = [0x2f6e2b1, 0x51ed270b, 0x1b56c4e9];

/**
 * How far the skirt reaches past the rim, as a share of the cap's own radius —
 * fixed, so the slider is the one thing that decides whether the ring reads.
 * Proportional rather than absolute: a continent gets a wide skirt and a crater
 * a narrow rim, which is the relation both actually have.
 */
const SKIRT_REACH = 0.5;

/** xorshift32, the same generator `noise.ts` shuffles its permutation with. */
function createRandom(seed: number) {
  let state = (seed | 0) || 0x9e3779b9;

  return () => {
    state ^= state << 13;
    state ^= state >>> 17;
    state ^= state << 5;

    return (state >>> 0) / 0x100000000;
  };
}

/**
 * Uniform on the sphere, and *only* uniform — features are not pushed apart the
 * way anchors are. Two continents landing on each other is one larger continent,
 * which is the point; evenly spaced ones read as a figure.
 */
function placeTier(
  caps: Cap[],
  count: number,
  size: number,
  lift: number,
  skirt: number,
  seed: number,
) {
  const n = Math.round(count);
  if (n < 1 || size <= 0 || lift === 0) return;

  const random = createRandom(seed);
  const cos = Math.cos(Math.min(size, Math.PI));
  const span = Math.max(1e-6, 1 - cos);
  const cosOuter = Math.cos(Math.min(size * (1 + SKIRT_REACH), Math.PI));
  const outerSpan = Math.max(1e-6, cos - cosOuter);
  const coverSpan = Math.max(1e-6, 1 - cosOuter);

  for (let i = 0; i < n; i++) {
    const y = 1 - random() * 2;
    const radius = Math.sqrt(Math.max(0, 1 - y * y));
    const angle = random() * Math.PI * 2;

    caps.push({
      x: Math.cos(angle) * radius,
      y,
      z: Math.sin(angle) * radius,
      cos,
      span,
      lift,
      cosOuter,
      outerSpan,
      coverSpan,
      lobe: -lift * skirt,
    });
  }
}

/** Empty when the blend is off, so `field.ts` can skip the whole term on length alone. */
export function buildCaps(visual: PlanetVisual): Cap[] {
  const caps: Cap[] = [];
  if (visual.caps <= 0) return caps;

  const [coarse, mid, fine] = TIER_SEEDS;
  const skirt = visual.capSkirt;
  placeTier(caps, visual.capCoarse, visual.capCoarseSize, visual.capCoarseLift, skirt, visual.seed ^ coarse);
  placeTier(caps, visual.capMid, visual.capMidSize, visual.capMidLift, skirt, visual.seed ^ mid);
  placeTier(caps, visual.capFine, visual.capFineSize, visual.capFineLift, skirt, visual.seed ^ fine);

  /**
   * Scaled by the largest lift, so a cap standing on its own reaches exactly ±1
   * and the bare sphere between them sits at 0 — which is what makes `Caps` a
   * real half at a half, since the noise it blends against is on that scale too.
   *
   * Deliberately *not* the measured range. Measuring would fold the seed into
   * the scale, and it would fold it badly: the probe grid is coarse enough to
   * step over a fine cap entirely, so what a reseed moved would be the whole
   * world's tone and not just where its craters fell. Overlaps run past ±1 and
   * are left to `field.ts` to absorb, the same allowance `ridge` already has.
   */
  let peak = 0;
  for (const cap of caps) peak = Math.max(peak, Math.abs(cap.lift));

  if (peak > 0) {
    for (const cap of caps) {
      cap.lift /= peak;
      cap.lobe /= peak;
    }
  }

  return caps;
}

/**
 * Two pieces that meet at the rim, both flat where they meet.
 *
 * **Inside**, smoothstep from rim to centre, so a cap has a crown and a shore
 * rather than a cone and an edge — and so two of them meet in a saddle instead
 * of a crease.
 *
 * **Outside**, the skirt: a ring running against the lift and back to nothing,
 * which is what gives the water within reach of a coast a gradient to be
 * quantised. Without it the ground between caps is one constant, and a constant
 * has no band boundary in it for `contour` to draw. The ring has to go *against*
 * the lift rather than simply reach further, because the inner falloff is
 * already zero at the rim and anything continuous outside it must come back.
 *
 * That is also why one slider serves both signs: against a continent it reads
 * as a shelf under the water, and against a crater it is the raised rim a
 * crater actually has.
 */
export function sampleCaps(caps: Cap[], x: number, y: number, z: number) {
  let total = 0;

  for (let i = 0; i < caps.length; i++) {
    const cap = caps[i];
    const dot = cap.x * x + cap.y * y + cap.z * z;
    const t = (dot - cap.cos) / cap.span;

    if (t > 0) {
      total += cap.lift * t * t * (3 - 2 * t);
      continue;
    }

    if (cap.lobe === 0) continue;

    const u = (dot - cap.cosOuter) / cap.outerSpan;
    if (u <= 0) continue;

    // 16·u²(1−u)²: 1 at the middle of the ring, 0 at both of its edges and flat
    // at both, so the skirt leaves no crease in the shading where it meets land.
    const bump = u * (1 - u);
    total += cap.lobe * 16 * bump * bump;
  }

  return total;
}

/**
 * How much of this point the caps have claimed: 1 at a centre, 0 at and past the
 * outer edge of the skirt, monotone in between. Taken as a max, so overlapping
 * caps do not close it twice over.
 *
 * It is a second pass rather than a second return from `sampleCaps`, and it has
 * to be its own function rather than reusing the sum, because the sum is 0 in two
 * unrelated places — far out at sea, and *exactly on a coast*, where the falloff
 * has come back to nothing. A mask built from the sum would open right at the
 * shoreline, which is the one place it must not. This is monotone, so it cannot.
 */
export function sampleCoverage(caps: Cap[], x: number, y: number, z: number) {
  let most = 0;

  for (let i = 0; i < caps.length; i++) {
    const cap = caps[i];
    const u = (cap.x * x + cap.y * y + cap.z * z - cap.cosOuter) / cap.coverSpan;
    if (u <= most) continue;

    most = u > 1 ? 1 : u;
  }

  return most * most * (3 - 2 * most);
}
