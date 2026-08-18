/**
 * Line lists widened into quads, so a stroke can carry a weight at all. WebGL's
 * `linewidth` is one device pixel everywhere that matters, which is why the
 * harness and the anchors were hairlines — and a hairline has nothing for a
 * world's size to divide.
 *
 * Arrays in, arrays out, and no three: the rule `anchor.ts` and `harness.ts`
 * already keep. Where the ribbon is actually swung out is the vertex shader,
 * because the direction to swing perpendicular to is a screen direction.
 */

/** Four vertices and two triangles per segment. */
export interface Ribbon {
  /** This vertex's own end of the segment. */
  positions: Float32Array;
  /** The other end. The shader takes the screen direction between the two. */
  toward: Float32Array;
  /** Which way to swing out, −1 or 1. */
  sides: Float32Array;
  /** Whatever the line carried per vertex, at this end and at the other. */
  marks: Float32Array;
  marksTo: Float32Array;
  /** 32-bit, because a full harness is past what 16 bits can index. */
  indices: Uint32Array;
}

/**
 * `edges` is a plain segment list — two points, six floats, per span — and
 * `marks` one scalar per point of it, which is exactly what `buildAnchorSolid`
 * and `strokeLoops` already return. So this widens what is there rather than
 * asking either of them to build something else.
 *
 * Both ends are carried on every vertex. A cap that squares off the end of a
 * span pushes it past its own endpoint, and anything measured *along* the line —
 * the ghost's dash is the one — has to be able to correct itself by how far.
 */
export function buildRibbon(edges: Float32Array, marks?: Float32Array): Ribbon {
  const spans = Math.floor(edges.length / 6);

  const positions = new Float32Array(spans * 12);
  const toward = new Float32Array(spans * 12);
  const sides = new Float32Array(spans * 4);
  const at = new Float32Array(spans * 4);
  const atTo = new Float32Array(spans * 4);
  const indices = new Uint32Array(spans * 6);

  for (let span = 0; span < spans; span++) {
    for (let i = 0; i < 4; i++) {
      // Vertices 0 and 1 sit at the near end and 2 and 3 at the far one; the low
      // bit picks the side. One quad, wound from one end of the span to the other.
      const isFar = i > 1;
      const here = span * 6 + (isFar ? 3 : 0);
      const there = span * 6 + (isFar ? 0 : 3);
      const vertex = span * 4 + i;

      positions.set(edges.subarray(here, here + 3), vertex * 3);
      toward.set(edges.subarray(there, there + 3), vertex * 3);

      // Flipped at the far end. Each vertex finds its own direction, and the far
      // end's runs backwards — so the perpendicular it swings out along is the
      // negative of the near end's, and a side asked for by the same sign at
      // both would put the two corners on opposite sides of the line. That is a
      // crossed quad: a bowtie per span, a comb along a polyline.
      sides[vertex] = (i % 2 ? 1 : -1) * (isFar ? -1 : 1);

      at[vertex] = marks ? marks[span * 2 + (isFar ? 1 : 0)] : 0;
      atTo[vertex] = marks ? marks[span * 2 + (isFar ? 0 : 1)] : 0;
    }

    const base = span * 4;

    indices.set([base, base + 1, base + 2, base + 1, base + 3, base + 2], span * 6);
  }

  return { positions, toward, sides, marks: at, marksTo: atTo, indices };
}

/**
 * The stroke a mark of this weight comes out at, in px. The souls' rule: a big
 * world wears fine ink, and the bounds are what keep that from running off
 * either end — a floor so a stroke never falls under what a screen can draw, and
 * a ceiling for the marks whose *shape* does not shrink with the world and would
 * otherwise be inked heavier and heavier as it stayed the same size.
 *
 * A width of 0 is off and stays off. The floor is there to rescue a stroke the
 * size divided away, not to overrule an author who asked for no stroke.
 */
export function weightOf(width: number, size: number, low: number, high = Infinity) {
  if (width <= 0) return 0;

  return Math.min(Math.max(width / Math.max(0.05, size), low), high);
}
