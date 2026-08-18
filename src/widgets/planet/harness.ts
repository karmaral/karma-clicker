/**
 * The harness: the lines strung between a world's anchors. Every anchor carries
 * a crown of loops closing on itself, and every *edge* between anchors carries a
 * family — a true arc from one to the other, bulged outward and turned about the
 * chord between them. The family is what makes the harness read as a cage rather
 * than as wires; the crown is what makes one anchor read like eight.
 *
 * Nothing here is game state. The module is handed the nodes that are actually
 * anchored and never learns what placing one costs, the separation `anchor.ts`
 * and `orbit.ts` already keep.
 */

import type { AnchorNode } from './anchor';

/** Points per loop. The reference's 54; a hairline curve needs no more. */
const SEGMENTS = 54;

/**
 * Loops the whole harness may draw. Pairs go as n², so at eight anchors the
 * 28 pairs would carry six times what two anchors do — this is spent per family
 * instead, so the harness thickens with the count without the count squaring
 * the cost, and every crown and every edge gets the same share as every other.
 */
const LOOP_BUDGET = 192;

/** Past this an arc's ends are poles, and its family may sweep the whole turn. */
const ANTIPODAL = Math.PI - 0.2;

export interface HarnessVisual {
  /** Scales the rotations in a family. The one knob for how full a harness is. */
  density: number;
  /**
   * How long a strung pair may be, as a multiple of the closest pair in the
   * figure. Anchors stand on an optimal spherical code — a triangle, a
   * bipyramid, an antiprism — and stringing every pair draws that figure's
   * *complete graph* rather than the figure, which is what turns eight anchors
   * into a scribble while three still read. 1 keeps the shortest links alone,
   * about 1.4 is the figures' own edges, and the top of the range is every pair
   * back again.
   */
  span: number;
  /** Bulge levels per rotation, spread between `inner` and `outer`. */
  levels: number;
  /** How far the innermost and outermost loops stand off the surface, in radii. */
  inner: number;
  outer: number;
  /**
   * Turn about the chord, applied along the loop rather than to it. Not
   * optional: a planar loop collapses to a hard straight needle every time it
   * turns edge-on to the camera, and a twisted family weaves instead of
   * stacking. The sign alternates per level.
   */
  twist: number;
  /**
   * Half the range a non-antipodal family's rotations spread over, in radians.
   * A full sweep there would drive loops straight through the body.
   */
  spread: number;
  /**
   * A crown's angular radius. Every anchor carries one: loops that close on the
   * anchor itself, circles through it of this radius. Low is a tuft gripping one
   * spot; at π/2 the circle is a great circle through the anchor and its
   * antipode, which is the full cage — so the visual for a crown is this slider
   * rather than a choice between two constructions.
   */
  reach: number;

  /**
   * Ink by place, not by state — the rule the unplaced anchor already draws by,
   * one cell short of this one. Two inks for the two grounds a line crosses,
   * and both step toward the *middle* of the ramp to say far: away from
   * whichever end the ink was chosen to contrast with, so one gesture pales
   * both halves of the rule. `levelFade` is the same gesture again, spent on
   * the outermost loops, which is what sinks them into what they sit on.
   */
  inTone: number;
  outTone: number;
  backFade: number;
  levelFade: number;

  /**
   * How heavy a line is, in px at size 1, and the two bounds that hold it there.
   * Divided by the world's size like every other mark, so a cage on a large
   * world is drawn in finer ink than one on a small world.
   *
   * The **ceiling** is what the anchors do not need. A harness spans the *body*,
   * and the body is drawn to the framing at every size — so as a world is
   * authored smaller there is nothing underneath the line getting bigger to
   * carry the weight the division keeps adding, and past a point 192 loops stop
   * being a cage and become a fill.
   */
  width: number;
  floor: number;
  ceiling: number;

  /**
   * Or drop the far side entirely: 1 hides the stretch of every line that runs
   * behind the body, which is the whole of what `backFade` can only pale. Cut at
   * the same silhouette the ink switches at, and by the same test the souls
   * already hide their far half by — so a rider and the line under it disappear
   * together instead of one outliving the other.
   */
  backHide: number;
}

/**
 * An anchor a line may be tied to. `peak` is how far out the solid's tip stands,
 * in body radii — a line converges on the *top* of the pole rather than on the
 * ground at its foot, which is what makes the anchor hold the harness instead of
 * standing beside it. Absent is the surface itself, at radius 1.
 */
export interface HarnessNode extends AnchorNode {
  peak?: number;
}

export interface HarnessLoop {
  /** `SEGMENTS + 1` sampled points, xyz. The last is the far anchor. */
  points: Float32Array;
  /** 0 innermost … 1 outermost. Drives the ink's fade and the loop's bulge. */
  level: number;
  /**
   * How far round it is, in world units — the polyline's own length. A rider
   * covers all of it in one turn of its orbit, so this is what says how fast
   * that is: without it, a soul stepping onto a short loop keeps its *angular*
   * rate and loses most of its speed across the screen.
   */
  length: number;
}

export interface HarnessLines {
  positions: Float32Array;
  levels: Float32Array;
}

type Vec = AnchorNode;

const UP: Vec = { x: 0, y: 1, z: 0 };
const ASIDE: Vec = { x: 1, y: 0, z: 0 };

function dotOf(a: Vec, b: Vec) {
  return a.x * b.x + a.y * b.y + a.z * b.z;
}

function crossOf(a: Vec, b: Vec): Vec {
  return {
    x: a.y * b.z - a.z * b.y,
    y: a.z * b.x - a.x * b.z,
    z: a.x * b.y - a.y * b.x,
  };
}

function unitOf(v: Vec): Vec {
  const length = Math.hypot(v.x, v.y, v.z) || 1;

  return { x: v.x / length, y: v.y / length, z: v.z / length };
}

/** A direction the axis is never parallel to, so a cross with it is a real one. */
function sideOf(v: Vec): Vec {
  return Math.abs(v.y) > 0.9 ? ASIDE : UP;
}

function scaleOf(v: Vec, by: number): Vec {
  return { x: v.x * by, y: v.y * by, z: v.z * by };
}

/** Where a line ties to an anchor. Untied nodes sit on the surface. */
function peakOf(node: HarnessNode) {
  return node.peak ?? 1;
}

/**
 * The radius a loop runs at: the grip it leaves from at the ends, the bulge at
 * the middle, and a sine between. Written as a blend rather than as a bulge
 * added to 1 so that raising the grip lifts the *ends* onto the anchors' tips
 * without carrying the whole harness out with them — the peak stays where it was
 * authored, which is what keeps a lifted harness inside its framing.
 */
function radiusAlong(grip: number, amp: number, t: number) {
  return grip + (1 + amp - grip) * Math.sin(Math.PI * t);
}

/** Rodrigues. `axis` is a unit vector through the origin. */
function turnAbout(v: Vec, axis: Vec, angle: number): Vec {
  const cos = Math.cos(angle);
  const sin = Math.sin(angle);
  const cross = crossOf(axis, v);
  const along = dotOf(axis, v) * (1 - cos);

  return {
    x: v.x * cos + cross.x * sin + axis.x * along,
    y: v.y * cos + cross.y * sin + axis.y * along,
    z: v.z * cos + cross.z * sin + axis.z * along,
  };
}

/** The same turn, but about a line through `pivot` rather than through the origin. */
function turnAround(v: Vec, axis: Vec, pivot: Vec, angle: number): Vec {
  const offset = turnAbout(
    { x: v.x - pivot.x, y: v.y - pivot.y, z: v.z - pivot.z },
    axis,
    angle,
  );

  return { x: offset.x + pivot.x, y: offset.y + pivot.y, z: offset.z + pivot.z };
}

/**
 * A true slerp — `a` turned toward `b` about their common normal — and not a
 * lerp put back on the sphere, which would bunch its samples at the ends.
 */
function arcPointAt(a: Vec, b: Vec, t: number): Vec {
  const angle = Math.acos(Math.max(-1, Math.min(1, dotOf(a, b))));
  const normal = crossOf(a, b);

  // Antipodal ends leave the normal undefined: every plane through them is a
  // great circle, so any one of them will do.
  const reach = Math.hypot(normal.x, normal.y, normal.z);
  const axis = reach < 1e-6 ? unitOf(crossOf(a, sideOf(a))) : unitOf(normal);

  return turnAbout(a, axis, angle * t);
}

interface Level {
  level: number;
  amp: number;
  twist: number;
}

function levelsOf(visual: HarnessVisual): Level[] {
  const count = Math.max(1, Math.min(3, Math.round(visual.levels)));

  return Array.from({ length: count }, (unused, i) => {
    const level = count > 1 ? i / (count - 1) : 0;

    return {
      level,
      amp: visual.inner + (visual.outer - visual.inner) * level,
      twist: (i % 2 === 0 ? 1 : -1) * visual.twist,
    };
  });
}

/** Rotations in one family, cut to the share of the budget its pair is owed. */
function rotationsFor(visual: HarnessVisual, families: number, levels: number, isFull: boolean) {
  const wanted = Math.round((isFull ? 4 : 3) * visual.density);
  const room = Math.floor(LOOP_BUDGET / Math.max(1, families * levels));

  return Math.max(1, Math.min(wanted, room));
}

/** One loop between two anchors: the arc, bulged outward, then turned about the chord. */
function arcLoop(a: HarnessNode, b: HarnessNode, phi: number, level: Level): Float32Array {
  const gripA = peakOf(a);
  const gripB = peakOf(b);

  // The chord is taken between the two *tips*, and the family turns about that
  // line — so every rotation in it, and every twist along it, leaves both ends
  // tied to the anchors instead of sliding off them.
  const from = scaleOf(a, gripA);
  const to = scaleOf(b, gripB);
  const chord = unitOf({ x: to.x - from.x, y: to.y - from.y, z: to.z - from.z });
  const points = new Float32Array((SEGMENTS + 1) * 3);

  for (let i = 0; i <= SEGMENTS; i++) {
    const t = i / SEGMENTS;
    const bulge = radiusAlong(gripA + (gripB - gripA) * t, level.amp, t);
    const arc = arcPointAt(a, b, t);
    const point = turnAround(
      scaleOf(arc, bulge),
      chord,
      from,
      phi + level.twist * (t - 0.5),
    );

    points[i * 3] = point.x;
    points[i * 3 + 1] = point.y;
    points[i * 3 + 2] = point.z;
  }

  return points;
}

/**
 * One petal of the solo crown: the circle on the sphere that passes through the
 * anchor, centred `reach` away from it in the direction `psi` picks out of the
 * anchor's own tangent plane. It leaves the anchor and comes back to it, so the
 * bulge closes at both ends and the only corner in the curve is the grip.
 */
function petalLoop(a: HarnessNode, psi: number, reach: number, level: Level): Float32Array {
  const grip = peakOf(a);
  const angle = Math.max(0.15, Math.min(Math.PI / 2, reach));
  const cos = Math.cos(angle);
  const sin = Math.sin(angle);

  // The anchor's tangent plane, as a frame `psi` can name a direction in.
  const east = unitOf(crossOf(sideOf(a), a));
  const north = crossOf(a, east);
  const out = {
    x: east.x * Math.cos(psi) + north.x * Math.sin(psi),
    y: east.y * Math.cos(psi) + north.y * Math.sin(psi),
    z: east.z * Math.cos(psi) + north.z * Math.sin(psi),
  };

  // The circle's centre, and the frame it is drawn in. `u` is chosen so the
  // curve starts on the anchor rather than anywhere on the circle.
  const centre = unitOf({
    x: a.x * cos + out.x * sin,
    y: a.y * cos + out.y * sin,
    z: a.z * cos + out.z * sin,
  });
  const u = unitOf({
    x: a.x - centre.x * cos,
    y: a.y - centre.y * cos,
    z: a.z - centre.z * cos,
  });
  const v = crossOf(centre, u);

  // The point opposite the anchor on the circle. Twisting about the line
  // through the two keeps both ends where they are — and the line is pinned at
  // the anchor's tip, which is the end the petal actually closes on.
  const far = {
    x: centre.x * cos - u.x * sin,
    y: centre.y * cos - u.y * sin,
    z: centre.z * cos - u.z * sin,
  };
  const axis = unitOf({ x: far.x - a.x, y: far.y - a.y, z: far.z - a.z });
  const tip = scaleOf(a, grip);

  const points = new Float32Array((SEGMENTS + 1) * 3);

  for (let i = 0; i <= SEGMENTS; i++) {
    const t = i / SEGMENTS;
    const turn = Math.PI * 2 * t;
    const bulge = radiusAlong(grip, level.amp, t);
    const circle = {
      x: (centre.x * cos + (u.x * Math.cos(turn) + v.x * Math.sin(turn)) * sin) * bulge,
      y: (centre.y * cos + (u.y * Math.cos(turn) + v.y * Math.sin(turn)) * sin) * bulge,
      z: (centre.z * cos + (u.z * Math.cos(turn) + v.z * Math.sin(turn)) * sin) * bulge,
    };
    const point = turnAround(circle, axis, tip, level.twist * (t - 0.5));

    points[i * 3] = point.x;
    points[i * 3 + 1] = point.y;
    points[i * 3 + 2] = point.z;
  }

  return points;
}

/**
 * One loop, before its points exist. Separated so the count can be had without
 * the geometry — the budget makes density stop buying loops well before the
 * slider ends, and a lab that could not see that would be tuning blind.
 */
interface LoopPlan {
  a: HarnessNode;
  /** The far anchor, or absent for a crown petal, which has only the one. */
  b?: HarnessNode;
  /** The family's rotation about the chord, or the petal's about the anchor. */
  turn: number;
  level: Level;
}

/** The crown an anchor carries. One anchor is all of the harness there is. */
function planCrown(
  visual: HarnessVisual,
  node: HarnessNode,
  families: number,
  levels: Level[],
): LoopPlan[] {
  const petals = rotationsFor(visual, families, levels.length, true);
  const plans: LoopPlan[] = [];

  for (let i = 0; i < petals; i++) {
    const turn = (i / petals) * Math.PI * 2;

    levels.forEach((level) => plans.push({ a: node, turn, level }));
  }

  return plans;
}

interface Link {
  a: HarnessNode;
  b: HarnessNode;
  /** The arc between the two, which is what says whether this is an edge. */
  angle: number;
}

/** The family one link carries: its rotations about the chord, in turn order. */
function planLink(
  visual: HarnessVisual,
  link: Link,
  families: number,
  levels: Level[],
): LoopPlan[] {
  const isFull = link.angle > ANTIPODAL;
  const rotations = rotationsFor(visual, families, levels.length, isFull);
  const plans: LoopPlan[] = [];

  for (let i = 0; i < rotations; i++) {
    const turn = isFull
      ? (i / rotations) * Math.PI * 2
      : rotations === 1 ? 0 : -visual.spread + (i / (rotations - 1)) * visual.spread * 2;

    levels.forEach((level) => plans.push({ a: link.a, b: link.b, turn, level }));
  }

  return plans;
}

/**
 * The pairs a line is strung between: the ones short enough to be *edges* of the
 * figure the anchors stand on. All n² pairs are that figure's complete graph, and
 * a complete graph is not a shape — the long diagonals are what cross everything
 * else. `span` measures each pair against the closest one in the same figure, so
 * the test is the figure's own scale and not a fixed angle.
 */
function linksOf(nodes: HarnessNode[], span: number): Link[] {
  const pairs: Link[] = [];

  for (let i = 0; i < nodes.length; i++) {
    for (let j = i + 1; j < nodes.length; j++) {
      const cosine = Math.max(-1, Math.min(1, dotOf(nodes[i], nodes[j])));

      pairs.push({ a: nodes[i], b: nodes[j], angle: Math.acos(cosine) });
    }
  }

  const closest = pairs.reduce((least, pair) => Math.min(least, pair.angle), Infinity);

  return pairs.filter((pair) => pair.angle <= closest * span + 1e-6);
}

/**
 * Handed the nodes that are *placed* — a line is strung between anchors that
 * exist, so the harness grows as they are driven in rather than being drawn in
 * full and waiting for them.
 *
 * Every anchor gets a crown and the links connect crowns, so one anchor is the
 * general case seen alone rather than a special case that happens to look better.
 */
function planLoops(visual: HarnessVisual, nodes: HarnessNode[]): LoopPlan[] {
  if (nodes.length === 0) return [];

  const levels = levelsOf(visual);
  const links = nodes.length > 1 ? linksOf(nodes, visual.span) : [];
  const families = nodes.length + links.length;

  const plans = nodes.flatMap((node) => planCrown(visual, node, families, levels));

  links.forEach((link) => plans.push(...planLink(visual, link, families, levels)));

  return plans;
}

/**
 * The polyline's length, measured on the same samples a rider is read from — so
 * the figure is exactly the distance a rider covers, chords and all, rather than
 * the length of the ideal curve under them.
 */
function lengthOf(points: Float32Array) {
  let total = 0;

  for (let i = 3; i < points.length; i += 3) {
    total += Math.hypot(
      points[i] - points[i - 3],
      points[i + 1] - points[i - 2],
      points[i + 2] - points[i - 1],
    );
  }

  return total;
}

const cache = new Map<string, HarnessLoop[]>();

/** The loop fields and the nodes — everything the curves are, and nothing else. */
function keyLoops(visual: HarnessVisual, nodes: HarnessNode[]) {
  const shape = [
    visual.density, visual.span, visual.levels, visual.inner,
    visual.outer, visual.twist, visual.spread, visual.reach,
  ];

  return shape
    .concat(nodes.flatMap((node) => [node.x, node.y, node.z, peakOf(node)]))
    .map((value) => value.toFixed(4))
    .join(',');
}

/**
 * The whole harness, as loops. Cached on the loop fields alone, so dragging an
 * ink slider rebuilds nothing — and so the seven views showing one world at
 * seven sizes pay for its curves once.
 */
export function buildLoops(visual: HarnessVisual, nodes: HarnessNode[]): HarnessLoop[] {
  const key = keyLoops(visual, nodes);
  const hit = cache.get(key);
  if (hit) return hit;

  const loops = planLoops(visual, nodes).map((plan) => {
    const points = plan.b
      ? arcLoop(plan.a, plan.b, plan.turn, plan.level)
      : petalLoop(plan.a, plan.turn, visual.reach, plan.level);

    return { level: plan.level.level, points, length: lengthOf(points) };
  });

  cache.set(key, loops);

  return loops;
}

/** The lab churns keys; nothing here holds a GPU resource, so this is only memory. */
export function trimLoopCache(limit = 16) {
  for (const key of cache.keys()) {
    if (cache.size <= limit) break;

    cache.delete(key);
  }
}

/** How many the settings come to, without paying for the curves. */
export function countLoops(visual: HarnessVisual, nodes: HarnessNode[]) {
  return planLoops(visual, nodes).length;
}

/**
 * Pairs `span` strings a line between. The slider that decides this is a filter
 * on a set nothing draws a number for, so a lab without this reads two settings
 * either side of a threshold as the same setting.
 */
export function countLinks(visual: HarnessVisual, nodes: HarnessNode[]) {
  return nodes.length > 1 ? linksOf(nodes, visual.span).length : 0;
}

/** One `LineSegments` for the whole harness — a draw call per loop is not a budget. */
export function strokeLoops(loops: HarnessLoop[]): HarnessLines {
  const spans = loops.length * SEGMENTS;
  const positions = new Float32Array(spans * 6);
  const levels = new Float32Array(spans * 2);

  let span = 0;

  loops.forEach((loop) => {
    for (let i = 0; i < SEGMENTS; i++) {
      const from = i * 3;
      const to = from + 3;

      positions.set(loop.points.subarray(from, from + 3), span * 6);
      positions.set(loop.points.subarray(to, to + 3), span * 6 + 3);
      levels[span * 2] = loop.level;
      levels[span * 2 + 1] = loop.level;

      span++;
    }
  });

  return { positions, levels };
}

/**
 * Where a soul riding `loop` is at `t`, 0…1 around it. Writes into `out`, so
 * the swarm's hot loop allocates nothing.
 */
export function sampleLoop(loop: HarnessLoop, t: number, out: AnchorNode) {
  const spans = loop.points.length / 3 - 1;
  const along = (t - Math.floor(t)) * spans;
  const index = Math.min(spans - 1, Math.floor(along));
  const step = along - index;

  const from = index * 3;
  const to = from + 3;
  const points = loop.points;

  out.x = points[from] + (points[to] - points[from]) * step;
  out.y = points[from + 1] + (points[to + 1] - points[from + 1]) * step;
  out.z = points[from + 2] + (points[to + 2] - points[from + 2]) * step;
}

export type HarnessGroup = 'Loops' | 'Ink';

export interface HarnessParam {
  key: keyof HarnessVisual;
  label: string;
  group: HarnessGroup;
  min: number;
  max: number;
  step: number;
}

export const HARNESS_GROUPS: HarnessGroup[] = ['Loops', 'Ink'];

export const HARNESS_PARAMS: HarnessParam[] = [
  { key: 'density', label: 'Density', group: 'Loops', min: 0.25, max: 2, step: 0.05 },
  // 2.6 clears the longest pair in every figure, so the top of the slider is
  // every pair strung — the harness before the edges were picked out of it.
  { key: 'span', label: 'Link span', group: 'Loops', min: 1, max: 2.6, step: 0.05 },
  { key: 'levels', label: 'Levels', group: 'Loops', min: 1, max: 3, step: 1 },
  { key: 'inner', label: 'Inner bulge', group: 'Loops', min: 0, max: 0.4, step: 0.005 },
  { key: 'outer', label: 'Outer bulge', group: 'Loops', min: 0, max: 0.5, step: 0.005 },
  // A full turn along a loop's own length at the top, because the twist is an
  // upgrade axis and 0.8 rad was judged short of what one should be able to buy.
  { key: 'twist', label: 'Twist', group: 'Loops', min: 0, max: 6.28, step: 0.02 },
  { key: 'spread', label: 'Spread', group: 'Loops', min: 0, max: 1.4, step: 0.01 },
  { key: 'reach', label: 'Crown reach', group: 'Loops', min: 0.2, max: 1.57, step: 0.01 },

  { key: 'inTone', label: 'Over the body', group: 'Ink', min: 0, max: 6, step: 1 },
  { key: 'outTone', label: 'Off the body', group: 'Ink', min: 0, max: 6, step: 1 },
  { key: 'backFade', label: 'Behind fade', group: 'Ink', min: 0, max: 3, step: 1 },
  // A toggle, drawn as the panel draws every other integer field.
  { key: 'backHide', label: 'Behind hidden', group: 'Ink', min: 0, max: 1, step: 1 },
  { key: 'levelFade', label: 'Outer fade', group: 'Ink', min: 0, max: 3, step: 1 },
  // 0 is no harness drawn, and the floor does not overrule it — see `weightOf`.
  { key: 'width', label: 'Line px', group: 'Ink', min: 0, max: 6, step: 0.1 },
  { key: 'floor', label: 'Floor px', group: 'Ink', min: 0.1, max: 3, step: 0.1 },
  { key: 'ceiling', label: 'Ceiling px', group: 'Ink', min: 0.5, max: 10, step: 0.25 },
];

export const DEFAULT_HARNESS: HarnessVisual = {
  density: 0.45,
  span: 1.5,
  levels: 3,
  inner: 0.4,
  outer: 0.5,
  twist: 0,
  spread: 0.91,
  reach: 0.2,
  inTone: 0,
  outTone: 1,
  backFade: 3,
  backHide: 1,
  levelFade: 2,
  width: 1,
  floor: 0.6,
  ceiling: 2.5,
};

export function cloneHarness(visual: HarnessVisual): HarnessVisual {
  return { ...visual };
}

/** A TS literal, ready to paste back over `DEFAULT_HARNESS`. */
export function printHarness(visual: HarnessVisual) {
  const lines = Object.entries(visual).map(
    ([key, value]) => `  ${key}: ${Number(value.toFixed(4))},`,
  );

  return `export const DEFAULT_HARNESS: HarnessVisual = {\n${lines.join('\n')}\n};`;
}
