/**
 * The anchors a harness is strung between. Solids driven into the surface, in
 * two states: placed, and a dashed ghost of where one will go.
 *
 * Nothing here is game state. The module is handed one flag per anchor and
 * never learns what placing one costs — the separation `orbit.ts` already keeps.
 */

/** Past eight the placements stop being nameable figures. §3.8 says "2 to about 8". */
export const ANCHOR_MAX = 8;

export interface AnchorVisual {
  /**
   * The figure's rotation about the body's axis. Placement is fixed by the
   * count alone, so this is the only way to turn a figure without turning the
   * world — which is what aims a vertex at the viewer.
   */
  phase: number;
  /** How far the base sits below the surface, in body radii. Negative floats it. */
  sink: number;

  /**
   * Multiplies the whole solid, `sink` with it, so the proportion below is the
   * authored shape and this is the only magnitude. It is also where a planet's
   * own scale will arrive: anchors sized against a body cannot say how big the
   * body is, and anchors sized against the *screen* can — a world with small
   * poles reads large.
   */
  size: number;

  /** Base polygon. 3 is the handoff's cone; past 6 it is a chamfered cone. */
  sides: number;
  /** Base circumradius and full height at size 1, both in body radii. */
  radius: number;
  height: number;
  /**
   * How far the pyramid's two sharp corners — the base rim and the apex — are
   * cut back. At 0 it is a plain n-gonal pyramid; at 0.5 the cuts meet and it
   * is two frusta base to base.
   */
  chamfer: number;

  /**
   * Fill, plus how many ramp slots a facet darkens by as it turns from the key.
   * Aimed by the system's one light rather than by anything authored here, so a
   * placed anchor is lit the way the ground it stands on is. The fill is also
   * what makes the edges legible over any body — the souls' ring argument.
   */
  faceTone: number;
  faceShade: number;
  edgeTone: number;

  /**
   * The unplaced ghost: the same edges, no fill, dashed, and never hidden — it
   * marks a place, and a place does not stop existing when the world turns.
   *
   * It has **no tone of its own**. The dash *inverts* what it crosses, the way
   * the halo does, so a place is legible over a dark world, over a white one
   * and over the canvas by the same rule — a pair of authored inks could always
   * be authored the same as the surface they landed on, and on a `--surface`
   * world one of them was.
   *
   * What is left to author is the far half: how much of the inversion an anchor
   * behind the body keeps, 0…1. The whole depth cue, and the only one the ghost
   * has — `sparkBack`'s argument, one mark at two weights.
   */
  ghostBack: number;
  /** Dash cycle in pixels — structure, so authored on screen and not in radii. */
  dash: number;
  /** Share of a cycle that is inked. */
  duty: number;
}

export interface AnchorNode {
  x: number;
  y: number;
  z: number;
}

export interface AnchorPlacement extends AnchorNode {
  /** Where the solid's base sits along its own direction, in object units. */
  base: number;
  /**
   * And where its tip does — what the harness ties its lines to. `chamfer` cuts
   * the apex back to a small flat cap, so this is that cap's centre rather than
   * a point, which is the one place on the solid every line can meet.
   */
  peak: number;
  isPlaced: boolean;
}

/** A latitude's worth of nodes, evenly spaced. */
function ringOf(count: number, y = 0, offset = 0): AnchorNode[] {
  const radius = Math.sqrt(Math.max(0, 1 - y * y));

  return Array.from({ length: count }, (unused, i) => {
    const angle = offset + (i / count) * Math.PI * 2;

    return { x: Math.cos(angle) * radius, y, z: Math.sin(angle) * radius };
  });
}

const UP: AnchorNode = { x: 0, y: 1, z: 0 };
const DOWN: AnchorNode = { x: 0, y: -1, z: 0 };

const CORNER = 1 / Math.sqrt(3);

function cornersOf(signs: number[][]): AnchorNode[] {
  return signs.map(([x, y, z]) => ({ x: x * CORNER, y: y * CORNER, z: z * CORNER }));
}

/**
 * The square antiprism's latitude, at the value that makes its two edge lengths
 * equal — which is what makes it the optimal eight rather than any antiprism.
 * Solving 2 − 2y² = 2 − 2(r²/√2 − y²) with r² = 1 − y² gives y² = √2/(4+√2),
 * and the nearest-neighbour separation that falls out is 74.86°.
 */
const ANTIPRISM_Y = Math.sqrt(Math.SQRT2 / (4 + Math.SQRT2));

/**
 * Anchors go where n points on a sphere go when they push each other as far
 * apart as they can: the optimal spherical codes, every one of which is a named
 * symmetric figure at these counts. So the count alone fixes the placement —
 * nothing is authored per planet, and the harness wraps the world in three
 * dimensions instead of belting its equator.
 *
 * Two and three come out as a ring either way, which is the case the 2D drawing
 * was tuned against.
 */
const ANCHOR_FIGURES: AnchorNode[][] = [
  [],
  // One is below §3.8's minimum of two and exists for the lab. Placed facing
  // the camera at phase 0, where a single solid can actually be judged.
  [{ x: 0, y: 0, z: 1 }],
  ringOf(2),
  ringOf(3),
  cornersOf([[1, 1, 1], [1, -1, -1], [-1, 1, -1], [-1, -1, 1]]),
  [...ringOf(3), UP, DOWN],
  [
    { x: 1, y: 0, z: 0 }, { x: -1, y: 0, z: 0 },
    UP, DOWN,
    { x: 0, y: 0, z: 1 }, { x: 0, y: 0, z: -1 },
  ],
  [...ringOf(5), UP, DOWN],
  [...ringOf(4, ANTIPRISM_Y), ...ringOf(4, -ANTIPRISM_Y, Math.PI / 4)],
];

/** The figure for a count, turned by `phase`. */
export function nodesFor(count: number, phase: number): AnchorNode[] {
  const figure = ANCHOR_FIGURES[Math.max(0, Math.min(ANCHOR_MAX, Math.round(count)))];
  const cos = Math.cos(phase);
  const sin = Math.sin(phase);

  return figure.map((node) => ({
    x: node.x * cos + node.z * sin,
    y: node.y,
    z: node.z * cos - node.x * sin,
  }));
}

/**
 * Where each anchor stands. `radiusAt` is the surface itself, so an anchor and
 * the terrain under it cannot disagree — the reason `field.ts` is one
 * implementation and never duplicated.
 */
export function placeAnchors(
  visual: AnchorVisual,
  anchored: boolean[],
  radiusAt: (x: number, y: number, z: number) => number,
): AnchorPlacement[] {
  return nodesFor(anchored.length, visual.phase).map((node, i) => {
    const base = radiusAt(node.x, node.y, node.z) - visual.sink * visual.size;

    return {
      ...node,
      base,
      peak: base + visual.height * visual.size,
      isPlaced: anchored[i],
    };
  });
}

export interface AnchorSolid {
  positions: Float32Array;
  indices: Uint16Array;
  /** Edge segment pairs, and arc length along the polyline each belongs to. */
  edges: Float32Array;
  along: Float32Array;
}

/** Running arc length, so a dash crosses a corner instead of restarting at it. */
function strokeAlong(points: number[][], edges: number[], along: number[], isClosed: boolean) {
  let distance = 0;
  const spans = isClosed ? points.length : points.length - 1;

  for (let i = 0; i < spans; i++) {
    const from = points[i];
    const to = points[(i + 1) % points.length];
    const step = Math.hypot(to[0] - from[0], to[1] - from[1], to[2] - from[2]);

    edges.push(from[0], from[1], from[2], to[0], to[1], to[2]);
    along.push(distance, distance + step);
    distance += step;
  }
}

/**
 * The chamfered pyramid, as three rings. A sharp pyramid's profile has two
 * corners — the base rim and the apex — and `chamfer` cuts back both, which is
 * what turns the silhouette from a triangle into the cut-cornered polygon the
 * 2D mark draws. Sized in body radii and built at that size, so world units are
 * object units and the dash can be measured in them.
 */
export function buildAnchorSolid(visual: AnchorVisual): AnchorSolid {
  const sides = Math.max(3, Math.min(8, Math.round(visual.sides)));
  const cut = Math.max(0, Math.min(0.5, visual.chamfer));
  const radius = visual.radius * visual.size;
  const height = visual.height * visual.size;

  const rings = [
    { radius: radius * (1 - cut), y: 0 },
    { radius, y: height * cut },
    { radius: radius * cut, y: height },
  ];

  const points = rings.map((ring) =>
    Array.from({ length: sides }, (unused, i) => {
      const angle = (i / sides) * Math.PI * 2;

      return [Math.cos(angle) * ring.radius, ring.y, Math.sin(angle) * ring.radius];
    }),
  );

  const positions: number[] = [];
  points.forEach((ring) => ring.forEach((point) => positions.push(...point)));

  const indices: number[] = [];
  const next = (i: number) => (i + 1) % sides;

  // Both lateral bands, wound so the front face looks outward.
  for (let band = 0; band < 2; band++) {
    const lower = band * sides;
    const upper = lower + sides;

    for (let i = 0; i < sides; i++) {
      indices.push(lower + i, upper + i, lower + next(i));
      indices.push(lower + next(i), upper + i, upper + next(i));
    }
  }

  // The base is buried once `sink` is set, and closed anyway so the depth
  // buffer has a solid to test the far anchors against.
  const top = 2 * sides;
  for (let i = 1; i < sides - 1; i++) {
    indices.push(top, top + i + 1, top + i);
    indices.push(0, i, i + 1);
  }

  const edges: number[] = [];
  const along: number[] = [];

  points.forEach((ring) => strokeAlong(ring, edges, along, true));
  for (let i = 0; i < sides; i++) {
    strokeAlong([points[0][i], points[1][i], points[2][i]], edges, along, false);
  }

  return {
    positions: new Float32Array(positions),
    indices: new Uint16Array(indices),
    edges: new Float32Array(edges),
    along: new Float32Array(along),
  };
}

export type AnchorGroup = 'Placement' | 'Solid' | 'Ink';

export interface AnchorParam {
  key: keyof AnchorVisual;
  label: string;
  group: AnchorGroup;
  min: number;
  max: number;
  step: number;
}

export const ANCHOR_GROUPS: AnchorGroup[] = ['Placement', 'Solid', 'Ink'];

export const ANCHOR_PARAMS: AnchorParam[] = [
  { key: 'phase', label: 'Phase', group: 'Placement', min: 0, max: 6.28, step: 0.01 },
  { key: 'sink', label: 'Sink', group: 'Placement', min: -0.05, max: 0.15, step: 0.005 },

  // `radius` and `height` are the authored proportion and stay off the panel —
  // `size` is the one magnitude, so a bigger anchor is the same anchor.
  { key: 'size', label: 'Size', group: 'Solid', min: 0.3, max: 3, step: 0.05 },
  { key: 'sides', label: 'Sides', group: 'Solid', min: 3, max: 8, step: 1 },
  { key: 'chamfer', label: 'Chamfer', group: 'Solid', min: 0, max: 0.5, step: 0.01 },

  { key: 'faceTone', label: 'Face', group: 'Ink', min: 0, max: 6, step: 1 },
  { key: 'faceShade', label: 'Face shade', group: 'Ink', min: 0, max: 4, step: 1 },
  { key: 'edgeTone', label: 'Edge', group: 'Ink', min: 0, max: 6, step: 1 },
  // The ghost inverts, so it has no ink to author — only how much of the
  // inversion the far half keeps.
  { key: 'ghostBack', label: 'Ghost behind', group: 'Ink', min: 0, max: 1, step: 0.05 },
  { key: 'dash', label: 'Dash px', group: 'Ink', min: 1, max: 12, step: 0.5 },
  { key: 'duty', label: 'Dash duty', group: 'Ink', min: 0.1, max: 0.9, step: 0.05 },
];

export const DEFAULT_ANCHOR: AnchorVisual = {
  phase: 0.4,
  sink: 0.02,

  size: 1,
  sides: 4,
  radius: 0.105,
  height: 0.17,
  chamfer: 0.25,

  faceTone: 0,
  faceShade: 1,
  edgeTone: 6,
  ghostBack: 0.45,
  dash: 3,
  duty: 0.5,
};

export function cloneAnchor(visual: AnchorVisual): AnchorVisual {
  return { ...visual };
}

/** A TS literal, ready to paste back over `DEFAULT_ANCHOR`. */
export function printAnchor(visual: AnchorVisual) {
  const lines = Object.entries(visual).map(
    ([key, value]) => `  ${key}: ${Number(value.toFixed(4))},`,
  );

  return `export const DEFAULT_ANCHOR: AnchorVisual = {\n${lines.join('\n')}\n};`;
}
