import * as THREE from 'three';
import type { AnchorVisual } from './anchor';
import type { HarnessVisual } from './harness';
import { readInkRamp, RAMP_SIZE, RAMP_SLOTS } from './ink';
import { keyLight } from './light.svelte';
import type { SwarmVisual } from './orbit';
import { haloSpreadOf, STROKE_ROOM, type PulseVisual } from './pulse';
import type { PlanetVisual } from './visual';

/**
 * Dynamic indexing of a uniform array is not portable in GLSL ES 1.00. Shared
 * so the swarm cannot invent a second ramp beside the body's.
 */
const rampRead = /* glsl */ `
  vec3 readRamp(float index) {
    int wanted = int(clamp(index, 0.0, float(${RAMP_SIZE - 1})) + 0.5);

    for (int i = 0; i < ${RAMP_SLOTS}; i++) {
      if (i == wanted) return uRamp[i];
    }

    return uRamp[0];
  }
`;

/**
 * No lights, no gradient map, no `MeshToonMaterial`. Under an orthographic
 * camera the view vector is a constant, so the fresnel collapses to how far a
 * facet turns from the screen — `1 − |N.z|`. Everything else is where that gets
 * quantised.
 */
const surfaceVertex = /* glsl */ `
  attribute float height;

  varying float vHeight;
  varying vec3 vNormal;

  void main() {
    vHeight = height;

    // The attribute is the field's own surface normal, baked in geometry.ts.
    vNormal = normalize(normalMatrix * normal);

    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

const surfaceFragment = /* glsl */ `
  uniform vec3 uRamp[${RAMP_SLOTS}];
  uniform float uRim;
  uniform float uRimGamma;
  uniform float uLand;
  uniform float uKey;
  uniform vec3 uKeyDir;
  uniform float uBias;
  uniform float uSteps;
  uniform float uToneFloor;
  uniform float uToneCeil;
  uniform float uContour;
  uniform float uContourTone;
  uniform float uContourShadowTone;
  uniform float uShadeSteps;
  uniform float uShadeDepth;

  varying float vHeight;
  varying vec3 vNormal;

  ${rampRead}

  /**
   * A band boundary drawn as a stroked path rather than left as the step between
   * two tones. Widths come from fwidth, so the line is the weight it
   * says it is however steep the field runs — and is simply absent where the
   * field is flat, instead of smearing across it.
   */
  float contourAt(float band) {
    // Derivatives have to be taken in uniform control flow.
    float perPixel = fwidth(band);
    if (uContour <= 0.0) return 0.0;

    // The uSteps-1 interior boundaries only. The ends of the range are where
    // t clamps, not where a tone changes.
    float boundary = floor(band + 0.5);
    float interior = step(0.5, boundary) * step(boundary, uSteps - 0.5);

    float pixels = abs(band - boundary) / max(perPixel, 1e-6);
    float reach = uContour * 0.5;

    return interior * (1.0 - smoothstep(reach - 0.5, reach + 0.5, pixels));
  }

  void main() {
    // The field's own surface normal, so the shade follows the terrain's slope
    // rather than the triangles it was tessellated into.
    vec3 N = normalize(vNormal);

    // The texture. vHeight is a vertex attribute, so this is the only term that
    // turns with the surface — and it is quantised alone, so the pattern is a
    // property of the world rather than of where the camera is standing. Left
    // unclamped: the contour reads it, and a boundary past the ends of the ramp
    // must not be drawn.
    float land = vHeight * 0.5 + 0.5;
    float band = (uLand * land + uBias) * uSteps;
    float level = floor(clamp(band, 0.0, uSteps - 1.0));
    float spread = uSteps > 1.0 ? level / (uSteps - 1.0) : 0.0;

    // The shade, in view space. It never reaches the band coordinate — it is
    // quantised on its own and composited as a shift along the ramp, so the
    // texture survives into the shadow instead of being redrawn by it.
    float rim = pow(clamp(1.0 - abs(N.z), 0.0, 1.0), uRimGamma);

    // Wrapped rather than clamped, so the whole sphere lands somewhere in the
    // shade range instead of collapsing the far half onto one tone.
    float key = 0.5 - 0.5 * dot(N, uKeyDir);

    // Rounded rather than floored, so a signed rim lightens the limb by as many
    // levels as a positive one darkens it.
    float shade = clamp(uRim * rim + uKey * key, -1.0, 1.0);
    float shadeLevel = floor(shade * uShadeSteps + 0.5);

    // readRamp clamps, so the shadow crushes to solid ink rather than wrapping.
    float index = mix(uToneFloor, uToneCeil, spread) + shadeLevel * uShadeDepth;

    // A contour takes its ink from which side of the terminator it falls on,
    // not from the tone beneath it — so a line stays legible crossing out of a
    // pale band into a dark one. Switched on the shade level, so the ink
    // changes where a shade band changes and never partway through one. Works
    // at uShadeDepth 0, where the contour is then the only thing saying where
    // the light is.
    float contourInk = mix(uContourTone, uContourShadowTone, step(0.5, shadeLevel));

    gl_FragColor = vec4(mix(readRamp(index), readRamp(contourInk), contourAt(band)), 1.0);

    #include <colorspace_fragment>
  }
`;

/**
 * Inverted hull, offset along the *radial* direction rather than the face
 * normal. A radially displaced sphere stays star-shaped about its origin while
 * |amplitude| < 1, so radial offset provably cannot self-intersect — which is the
 * usual reason hull outlines look bad on a lumpy low-poly mesh. Offsetting in
 * view space keeps the width independent of any scale on the mesh.
 */
const outlineVertex = /* glsl */ `
  uniform float uOffset;

  void main() {
    vec3 radial = normalize(normalMatrix * normalize(position));
    vec4 viewPos = modelViewMatrix * vec4(position, 1.0);
    viewPos.xyz += radial * uOffset;

    gl_Position = projectionMatrix * viewPos;
  }
`;

const outlineFragment = /* glsl */ `
  uniform vec3 uColor;

  void main() {
    gl_FragColor = vec4(uColor, 1.0);

    #include <colorspace_fragment>
  }
`;

/**
 * Souls, billboarded in view space rather than by a camera quaternion on the
 * CPU. The swarm hangs inside the body's tilt group, so a local rotation would
 * compose with that tilt; building the quad from the instance's *origin* in view
 * space sidesteps it, and the loop then only writes a position and a scale.
 *
 * `instanceMatrix` is declared by three.js for any ShaderMaterial on an
 * InstancedMesh — this material is never used on anything else.
 */
const soulVertex = /* glsl */ `
  uniform float uRing;

  varying vec2 vUv;

  // The fragment's offset from the body's centre, in camera axes. Under an
  // orthographic camera that makes xy the silhouette and z the near/far test.
  varying vec3 vRel;

  void main() {
    vUv = uv;

    vec4 origin = modelViewMatrix * vec4(0.0, 0.0, 0.0, 1.0);
    vec4 centre = modelViewMatrix * instanceMatrix * vec4(0.0, 0.0, 0.0, 1.0);

    // The quad grows to hold the ring, so the fill stays the size it was
    // authored at — the ring is added around a dot, not taken out of one.
    float span = length(instanceMatrix[0].xyz) * (1.0 + uRing);

    vec4 viewPos = centre + vec4(position.xy * span, 0.0, 0.0);
    vRel = viewPos.xyz - origin.xyz;

    gl_Position = projectionMatrix * viewPos;
  }
`;

/**
 * Two inks, chosen **per fragment** so a dot straddling the silhouette is cut
 * into two halves rather than switched whole — a dot that changes colour when
 * its centre crosses reads as a bug at 4px.
 *
 * The far half is discarded rather than depth-tested. Both hide it; only this
 * one hides it at exactly `uRim`, where the ink already switches, so the two
 * agree on where the silhouette is instead of the depth buffer cutting along
 * the terrain and the ink along the sphere.
 */
const soulFragment = /* glsl */ `
  uniform vec3 uRamp[${RAMP_SLOTS}];
  uniform float uRim;
  uniform float uRing;
  uniform float uOutTone;
  uniform float uFrontTone;

  varying vec2 vUv;
  varying vec3 vRel;

  ${rampRead}

  void main() {
    // Round, and antialiased the way the contour is — hard edged, never blurred.
    float spread = length(vUv - 0.5) * 2.0;
    float aa = fwidth(spread) * 1.5;
    float alpha = 1.0 - smoothstep(1.0 - aa, 1.0, spread);
    if (alpha <= 0.0) discard;

    float reach = dot(vRel.xy, vRel.xy);
    float edge = uRim * uRim;

    // The body as a sphere, terrain ignored: at the amplitudes worlds are
    // authored at, the error is inside the outline's own weight.
    float surface = sqrt(max(edge - reach, 0.0));
    float over = step(reach, edge);
    float front = step(surface, vRel.z);

    // Behind the world is behind the world. Per fragment, so a dot crossing the
    // silhouette is cut in half rather than vanishing whole.
    if (over > 0.5 && front < 0.5) discard;

    float tone = mix(uOutTone, uFrontTone, over);

    // The ring takes the far end of the ramp from whatever the fill landed on,
    // rather than an ink of its own: a fourth authored tone would need setting
    // once per place a soul can be, and would still be wrong for one of them.
    // Gated, or at width 0 the ring would still claim the dot's own soft edge.
    float core = 1.0 / (1.0 + uRing);
    float ring = smoothstep(core - aa, core, spread) * step(0.001, uRing);
    tone = mix(tone, mix(6.0, 0.0, step(3.5, tone)), ring);

    gl_FragColor = vec4(readRamp(tone), alpha);

    #include <colorspace_fragment>
  }
`;

/**
 * The harness. One `LineSegments` for every loop, with `level` — 0 innermost,
 * 1 outermost — carried per vertex, and `vRel` the fragment's offset from the
 * body's centre in camera axes. Under an orthographic camera that makes xy the
 * silhouette and z the near/far test, which is the whole of what the ink rule
 * needs.
 */
const harnessVertex = /* glsl */ `
  attribute float level;

  varying float vLevel;
  varying vec3 vRel;

  void main() {
    vLevel = level;

    vec3 centre = (viewMatrix * vec4(0.0, 0.0, 0.0, 1.0)).xyz;
    vec4 viewPos = modelViewMatrix * vec4(position, 1.0);

    vRel = viewPos.xyz - centre;

    gl_Position = projectionMatrix * viewPos;
  }
`;

/**
 * The ink rule, and there is no other lighting anywhere in the harness. Two
 * inks by *place* — over the body, off it — chosen per fragment, because a
 * single loop crosses the silhouette twice and must invert where it does.
 *
 * Both ways of saying far are the same gesture, spent twice: a step toward the
 * middle of the ramp, which is away from whichever end the ink was chosen to
 * contrast with. Behind the body's own centre plane is one; being an outer loop
 * is the other, and that one is what sinks a family into what it sits on
 * instead of letting every loop claim the same weight.
 *
 * Stepped rather than mixed. A blend between two ramp slots is a gradient, and
 * the system does not own one.
 */
const harnessFragment = /* glsl */ `
  uniform vec3 uRamp[${RAMP_SLOTS}];
  uniform float uInTone;
  uniform float uOutTone;
  uniform float uBackFade;
  uniform float uBackHide;
  uniform float uLevelFade;

  varying float vLevel;
  varying vec3 vRel;

  ${rampRead}

  void main() {
    // The body as a unit sphere, terrain ignored — a loop stands off the
    // surface, so the mean radius is the only silhouette it can cross.
    float over = step(dot(vRel.xy, vRel.xy), 1.0);
    float back = step(vRel.z, 0.0);

    // Let the body hide what is behind it, if it is asked to. Per fragment, so
    // a line crossing the silhouette is cut at it rather than dropped whole —
    // the rule the souls' far half already goes by.
    if (uBackHide > 0.5 && over * back > 0.5) discard;

    float tone = mix(uOutTone, uInTone, over);
    tone += (back * uBackFade + vLevel * uLevelFade) * sign(3.0 - tone);

    gl_FragColor = vec4(readRamp(tone), 1.0);

    #include <colorspace_fragment>
  }
`;

/**
 * An anchor's facets. No normal attribute: the normal comes from screen
 * derivatives, which is exact here because every triangle of the solid really
 * is flat. Lit by the system's one key, so a placed anchor takes its light from
 * the same place the ground it stands on does.
 */
const anchorVertex = /* glsl */ `
  varying vec3 vViewPos;

  void main() {
    vec4 viewPos = modelViewMatrix * vec4(position, 1.0);
    vViewPos = viewPos.xyz;

    gl_Position = projectionMatrix * viewPos;
  }
`;

const anchorFragment = /* glsl */ `
  uniform vec3 uRamp[${RAMP_SLOTS}];
  uniform vec3 uKeyDir;
  uniform float uTone;
  uniform float uShade;

  varying vec3 vViewPos;

  ${rampRead}

  void main() {
    vec3 facet = normalize(cross(dFdx(vViewPos), dFdy(vViewPos)));

    // Front faces of a convex solid all face the camera under an orthographic
    // projection, so this fixes the derivative's sign without a second normal.
    facet *= facet.z < 0.0 ? -1.0 : 1.0;

    // One knob is both the depth and the granularity: at 1 a facet is paper or
    // the next slot down, and nothing between.
    float key = 0.5 - 0.5 * dot(facet, uKeyDir);

    gl_FragColor = vec4(readRamp(uTone + floor(key * uShade + 0.5)), 1.0);

    #include <colorspace_fragment>
  }
`;

/**
 * The edges, shared by both states. `along` is arc length baked into the
 * geometry; `vRel` is the fragment's offset from the body's centre in camera
 * axes — everything between the two is rotation, so the world origin is the
 * body's own.
 *
 * `vBack` is taken from the anchor's *origin* instead, which makes it one answer
 * for the whole solid. A soul straddling the silhouette wants cutting in half;
 * an anchor is a place, and a place is on one side or the other. Reading it per
 * fragment would also call a sunk base far-side while its tip was near.
 */
const anchorEdgeVertex = /* glsl */ `
  attribute float along;

  varying float vAlong;
  varying float vBack;
  varying vec3 vRel;

  void main() {
    vAlong = along;

    vec3 centre = (viewMatrix * vec4(0.0, 0.0, 0.0, 1.0)).xyz;
    vec4 origin = modelViewMatrix * vec4(0.0, 0.0, 0.0, 1.0);
    vec4 viewPos = modelViewMatrix * vec4(position, 1.0);

    vBack = step(origin.z - centre.z, 0.0);
    vRel = viewPos.xyz - centre;

    gl_Position = projectionMatrix * viewPos;
  }
`;

/** A placed anchor's edges: one ink, and the depth buffer hides the far ones. */
const anchorEdgeFragment = /* glsl */ `
  uniform vec3 uRamp[${RAMP_SLOTS}];
  uniform float uTone;

  ${rampRead}

  void main() {
    gl_FragColor = vec4(readRamp(uTone), 1.0);

    #include <colorspace_fragment>
  }
`;

/**
 * The unplaced ghost. Never depth-tested — an anchor's *place* does not stop
 * existing when the world turns, so the far ones stay drawn and say they are far
 * by inverting less instead of by disappearing.
 *
 * **It carries no ink**, on the halo's argument and for the same reason the
 * halo stopped carrying one. Two authored inks, one for over the body and one
 * for off it, is still a guess about the body: a ghost inked `--surface` over
 * the world vanishes on a world whose surface *is* `--surface`, and no pair of
 * tones survives every planet a type table can produce. What this writes is a
 * blend factor and the material's blend does the rest, so the dash comes out as
 * whatever it crossed, reversed.
 *
 * The one thing an inversion cannot do is contrast with mid-grey — `src·(1−dst)
 * + dst·(1−src)` is 0.5 at dst 0.5 whatever src says. A ghost over `--ink-400`
 * is the fixed point of its own rule. If that shows on a real world the answer
 * is a cased line, not a return to authored tones.
 *
 * The dash is measured in pixels: an anchor is *structure*, so its rhythm must
 * hold at 40px and at 420px alike, exactly as the outline's weight does.
 */
const anchorGhostFragment = /* glsl */ `
  uniform float uBack;
  uniform float uDash;
  uniform float uDuty;
  uniform float uZoom;

  varying float vAlong;
  varying float vBack;
  varying vec3 vRel;

  void main() {
    if (fract(vAlong * uZoom / uDash) > uDuty) discard;

    // Behind the body it inverts less, which is the whole depth cue and the
    // only one the ghost has. Taken from the anchor's origin, so a place is on
    // one side or the other rather than cut in half at the rim.
    float invert = mix(1.0, uBack, vBack);
    if (invert <= 0.0) discard;

    gl_FragColor = vec4(vec3(invert), 1.0);
  }
`;

/**
 * A stroke centred on `at`, `width` px wide, measured against a coordinate that
 * runs 1.0 at the ring's own radius. `perPixel` is passed in because a
 * derivative has to be taken in uniform control flow, and the width test is not.
 */
const strokeAt = /* glsl */ `
  float strokeAt(float q, float at, float width, float perPixel) {
    if (width <= 0.0) return 0.0;

    float pixels = abs(q - at) / max(perPixel, 1e-6);

    return 1.0 - smoothstep(width * 0.5 - 0.5, width * 0.5 + 0.5, pixels);
  }
`;

/**
 * The click's halo: two rings around the whole world, built from the body's
 * origin in *view space* so they face the camera without a quaternion and
 * without inheriting the tilt of whatever group they hang in.
 *
 * `fade` is per instance, which is what lets many flashes live at once out of
 * one draw — the alternative was a component per ring, mounting and unmounting
 * on every click.
 *
 * The quad is `uSpread` times the ring's radius rather than exactly it. At
 * exactly it, the ring lands on the quad's inscribed circle and the outer half
 * of its stroke is cut off at the four cardinal points; the fragment divides
 * the room back out, so `q` is still 1.0 on the ring.
 */
const haloVertex = /* glsl */ `
  uniform float uSpread;

  attribute float fade;
  attribute float turn;
  attribute float scatter;

  varying vec2 vUv;
  varying float vFade;
  varying float vRadius;
  varying float vTurn;
  varying float vScatter;

  void main() {
    vUv = uv;
    vFade = fade;
    vTurn = turn;
    vScatter = scatter;

    // The instance carries the ring's radius, not the quad's span — the one
    // conversion between the two is the line below.
    vRadius = length(instanceMatrix[0].xyz);

    vec4 origin = modelViewMatrix * vec4(0.0, 0.0, 0.0, 1.0);
    float span = vRadius * 2.0 * uSpread;

    gl_Position = projectionMatrix * (origin + vec4(position.xy * span, 0.0, 0.0));
  }
`;

/**
 * The halo carries **no ink**. What it writes is how far to invert what is
 * already in the framebuffer, and the material's blend does the rest:
 * `src·(1−dst) + dst·(1−src)` with a grey `src` is exactly `mix(dst, 1−dst, f)`.
 * So a ring over the canvas comes out as ink, over a soul as paper, and over
 * the harness as whatever that line was not — the only mark in the medium that
 * cannot be the wrong tone for its background.
 *
 * That is also why `colorspace_fragment` is absent: this is a blend factor, not
 * a colour, and encoding it would bend the inversion.
 */
const haloFragment = /* glsl */ `
  uniform float uSpread;
  uniform float uWidth;
  uniform float uEchoWidth;
  uniform float uEchoScale;
  uniform float uEchoWarp;
  uniform float uEchoBands;
  uniform float uEchoScatter;
  uniform float uEchoDepth;

  varying vec2 vUv;
  varying float vFade;
  varying float vRadius;
  varying float vTurn;
  varying float vScatter;

  ${strokeAt}

  /**
   * Three sines at ratios that do not divide, so the echo never closes into a
   * rosette however many lobes it is given. Normalised to about ±1.
   *
   * Every count here is a whole one, because the ring closes and the angle it
   * is drawn against does not: atan runs -PI to PI and jumps at the far side.
   * At 5.4 lobes the pattern meets its own start mid-stride there and the echo
   * carries a notch that stays put while the flash turns under it. All three
   * harmonics are rounded, not just the first — any one of them landing off a
   * whole count reopens the seam by itself. Rounding keeps the ratios: 5 lobes
   * carries 9 and 15, which share no factor, so the shape still does not close.
   */
  float lobedAt(float angle, float lobes) {
    float second = floor(lobes * 1.7 + 0.5);
    float third = floor(lobes * 2.9 + 0.5);

    return (
      sin(lobes * angle)
      + 0.6 * sin(second * angle + 1.3)
      + 0.35 * sin(third * angle + 4.1)
    ) / 1.95;
  }

  /**
   * Per flash the pattern is turned by a random angle and its lobe count is
   * drawn off vScatter, so two clicks in a row leave two different rings out of
   * one authored shape.
   *
   * A count between two whole ones is the *blend* of the two patterns rather
   * than a pattern at a fractional count — which keeps the slider and the
   * scatter continuous while every shape they land on is seamless, since a mix
   * of two things that close is a thing that closes.
   */
  float warpAt(float angle) {
    float lobes = max(1.0, uEchoBands * (1.0 + uEchoScatter * vScatter));
    float whole = floor(lobes);
    float turned = angle + vTurn;

    return mix(lobedAt(turned, whole), lobedAt(turned, whole + 1.0), lobes - whole);
  }

  void main() {
    vec2 offset = vUv - 0.5;

    // 1.0 exactly on the ring, whatever room the quad was given past it.
    float q = length(offset) * 2.0 * uSpread;
    float perPixel = fwidth(q);

    // Always behind the world. The halo is what the click threw *off* the body,
    // so the body is what stops it — and q times vRadius is the fragment's own
    // distance from the centre in body radii, which is the same silhouette the
    // harness and the souls are cut at.
    if (q * vRadius < 1.0) discard;

    float main = strokeAt(q, 1.0, uWidth, perPixel);
    float echo = strokeAt(
      q,
      uEchoScale * (1.0 + uEchoWarp * warpAt(atan(offset.y, offset.x))),
      uEchoWidth,
      perPixel
    ) * uEchoDepth;

    float invert = max(main, echo) * vFade;
    if (invert <= 0.0) discard;

    gl_FragColor = vec4(vec3(invert), 1.0);
  }
`;

/**
 * The two planes the ground marks are flattened onto, as a share of the near
 * clip. The fill takes the nearer one and draws first; the outline takes the
 * one behind it and draws second, so `LessDepth` rejects the ink under every
 * pixel the mark itself claimed.
 */
const SPARK_PLANE = 0.999;
const OUTLINE_PLANE = 0.998;

/**
 * What the outline pass adds to each quad so the grown shape has somewhere to
 * go. `STROKE_ROOM` alone is the room a stroke needs, which is a fraction of a
 * ring; an outline is authored in pixels and can be most of a small mark. Past
 * these the ink is cropped at the quad's edge, which needs a mark only a few
 * pixels across to reach.
 */
const SPARK_OUTLINE_ROOM = 1.8;
const FLARE_OUTLINE_ROOM = 1.5;

/**
 * A flash on the ground it hit: a filled dot with a ring travelling out of it,
 * lying **in the terrain's own tangent plane** rather than facing the camera —
 * so a spark near the limb foreshortens into the surface the way a mark painted
 * there would, and the ring says which way the ground faces.
 *
 * There is no silhouette test here and that is still the decision — a spark is
 * visible wherever it landed, including the far side, so neither the world nor
 * the depth buffer hides it. What the silhouette does decide is the *ink*: past
 * it both tones invert, which is the rule the harness and the souls go by. How
 * far back it is decides the *weight*, and that is `uBack`.
 *
 * The depth it writes is not the depth it has. Every ground mark is flattened
 * onto one plane at the near clip and the group is drawn with `LessDepth`, so
 * the first fragment to reach a pixel claims it and every later one is
 * rejected: a dot, the ring leaving it and the two blades crossing over both
 * come out as **one silhouette** rather than as a sum of overlaps — which is
 * what alpha over alpha gives, and which reads as a bruise wherever two parts
 * of the same mark meet. Depth rather than stencil because nothing in the scene
 * draws after these, so the buffer they leave behind is nobody else's.
 *
 * **The outline is the same shaders at a second plane.** Both meshes are drawn
 * again, each shape grown by `uOutline` pixels, on a plane a hair *behind* the
 * fill and after it — so every fragment the mark already claimed rejects the
 * ink, and what survives is the border of the *union* of the dot, the ring and
 * the two blades. One outline around the whole mark rather than three outlines
 * that cross each other's insides, and it falls out of the rule the group was
 * already drawn by rather than needing a shape nothing draws.
 *
 * The cost of that ordering is a hairline. The fill's antialiased rim writes
 * depth at whatever alpha it has, so the outline starts half a pixel out from
 * where the mark stops being opaque and the ground shows through the join. The
 * alternative — outline first, fill over it — has the fill's own fade let the
 * ink back through the middle of the mark, which is the bruise again and much
 * worse. If the hairline ever reads, the fix is a tighter antialias on the
 * fill's outer edge, not a change of order.
 */
const sparkVertex = /* glsl */ `
  uniform float uRoom;
  uniform float uPlane;

  attribute float fade;
  attribute float grow;

  varying vec2 vUv;
  varying float vFade;
  varying float vGrow;
  varying vec3 vRel;

  void main() {
    vUv = uv;
    vFade = fade;
    vGrow = grow;

    // The room the stroke needs past the ring, and on the outline pass the room
    // the ink needs past that. The fragment divides it back out, so q is 1.0 on
    // the ring however much of it this pass asked for.
    vec3 held = position * uRoom;

    vec3 centre = (viewMatrix * vec4(0.0, 0.0, 0.0, 1.0)).xyz;
    vec4 viewPos = modelViewMatrix * instanceMatrix * vec4(held, 1.0);

    vRel = viewPos.xyz - centre;

    gl_Position = projectionMatrix * viewPos;

    // The plane this pass claims. Just inside the near clip rather than on it,
    // so no driver has to decide whether the boundary is inclusive.
    gl_Position.z = -gl_Position.w * uPlane;
  }
`;

const sparkFragment = /* glsl */ `
  uniform vec3 uRamp[${RAMP_SLOTS}];
  uniform float uCore;
  uniform float uWidth;
  uniform float uBack;
  uniform float uTone;
  uniform float uRingTone;
  uniform float uRoom;
  uniform float uOutline;

  varying vec2 vUv;
  varying float vFade;
  varying float vGrow;
  varying vec3 vRel;

  ${rampRead}
  ${strokeAt}

  void main() {
    // The same room the vertex shader gave the quad, divided back out, so q is
    // 1.0 exactly on the ring at full travel.
    float q = length(vUv - 0.5) * 2.0 * uRoom;
    float perPixel = fwidth(q);

    // How far this pass grows the mark. Pixels converted through the fragment's
    // own derivative rather than through a scale, so the ink holds its weight
    // where the quad is foreshortened into the terrain — the same argument the
    // stroke widths are authored in px by.
    float ink = uOutline * perPixel;

    // The quad is sized to hold the ring at its widest, so the dot is a share
    // of it rather than the whole — hard edged, antialiased as a soul is.
    float aa = perPixel * 1.5;
    float flash = 1.0 - smoothstep(uCore + ink - aa, uCore + ink, q);

    // The ring leaves the dot's own edge rather than its centre, so the two are
    // one mark at the flash instead of a ring drawn through a dot.
    // strokeAt is authored in pixels already, so the ring grows by the outline
    // on each side rather than through the derivative a second time.
    float ring = strokeAt(q, mix(uCore, 1.0, vGrow), uWidth + uOutline * 2.0, perPixel);

    // The body as a unit sphere, per fragment — a ring standing out past the
    // limb is cut at the silhouette rather than switched whole. Behind its
    // centre plane is the other half of the same reading, and there the mark
    // keeps its ink and gives up its weight.
    float over = step(dot(vRel.xy, vRel.xy), 1.0);
    float back = step(vRel.z, 0.0);

    float alpha = max(flash, ring) * vFade * mix(1.0, uBack, back);
    if (alpha <= 0.0) discard;

    // One ink for the whole outline — it is one shape, so it cannot be two
    // tones — and that ink is the dot's own, flipped. Flipped again by the
    // silhouette below, which lands it opposite the fill on both sides of the
    // limb and costs no second authored tone.
    float tone = uOutline > 0.0
      ? float(${RAMP_SIZE - 1}) - uTone
      : mix(uRingTone, uTone, step(0.5, flash));

    gl_FragColor = vec4(readRamp(mix(float(${RAMP_SIZE - 1}) - tone, tone, over)), alpha);

    #include <colorspace_fragment>
  }
`;

/**
 * How much of the near half the flare gives up before the limb, as the cosine
 * off the view axis its foot stands at — so the band is an angle rather than a
 * distance, and the same on a mark that landed in a trough as on a peak.
 */
const FLARE_LIMB = 0.18;

/**
 * The flare standing on a spark: two quads crossed about the surface normal,
 * each tapered wider at its base, so the pair reads as a small cone struck off
 * the ground. The taper is applied here rather than baked, so a slider moves it
 * without rebuilding the geometry.
 *
 * The cross degenerates to nothing seen straight down its own axis — which is
 * exactly where the dot and the ring lying in the terrain are seen full-on. The
 * two marks cover each other's worst angle, and neither needed a third quad.
 *
 * **Unlike the dot and the ring, this one is on the near half only.** A mark
 * keeps its dot wherever it landed, but a blade standing on the far side is a
 * cone struck away from the camera drawn as though it were struck towards it,
 * and no weight makes that read. So the foot decides, not the vertex: the whole
 * cross belongs to the visible half or to nothing, and it lets go over
 * `FLARE_LIMB` rather than switching off at the limb — the world turns under
 * these, and a hard edge pops a cross out on a mark that has not moved.
 */
const flareVertex = /* glsl */ `
  uniform float uFlareFrom;
  uniform float uFlareTo;
  uniform float uRoom;
  uniform float uPlane;

  attribute float fade;
  attribute float grow;

  varying vec2 vUv;
  varying float vFade;
  varying float vFace;
  varying vec3 vRel;

  void main() {
    vUv = uv;
    vFade = fade;

    // The taper travels over the mark's life on the ring's own curve, so a
    // flare opens or collapses instead of holding one shape and fading.
    float taper = mix(uFlareFrom, uFlareTo, grow);

    // Room for the ink, taken about the quad's own centre so the outline stands
    // off the blade's foot by as much as it stands off its tip. The fragment
    // divides it back out, the way the ring's crop is divided out.
    vec3 roomed = vec3(position.x, position.y - 0.5, position.z) * uRoom;
    roomed.y += 0.5;

    // Blades stand along +Y from the surface, so uv.y is height along one and
    // the taper is a widening of everything that is not the axis.
    vec3 blade = roomed * vec3(mix(taper, 1.0, uv.y), 1.0, mix(taper, 1.0, uv.y));

    mat4 toView = modelViewMatrix * instanceMatrix;

    vec3 centre = (viewMatrix * vec4(0.0, 0.0, 0.0, 1.0)).xyz;
    vec4 viewPos = toView * vec4(blade, 1.0);

    vRel = viewPos.xyz - centre;

    // Where the cross stands rather than where this vertex is, normalised off
    // the body's centre: 1 facing the camera, 0 on the limb, negative behind.
    // A leaning tip cannot buy the mark back and cannot lose it either.
    vFace = normalize((toView * vec4(0.0, 0.0, 0.0, 1.0)).xyz - centre).z;

    gl_Position = projectionMatrix * viewPos;

    // The dot's plane, exactly — the blade standing on a mark is part of that
    // mark's silhouette, not a second thing layered over it. Which plane that
    // is depends on the pass, and both passes answer the same way.
    gl_Position.z = -gl_Position.w * uPlane;
  }
`;

/** The dot's own sprite, drawn in the blade's uv — so the taper shapes it. */
const flareFragment = /* glsl */ `
  uniform vec3 uRamp[${RAMP_SLOTS}];
  uniform float uTone;
  uniform float uRoom;
  uniform float uOutline;

  varying vec2 vUv;
  varying float vFade;
  varying float vFace;
  varying vec3 vRel;

  ${rampRead}

  void main() {
    float spread = length(vUv - 0.5) * 2.0 * uRoom;
    float perPixel = fwidth(spread);
    float aa = perPixel * 1.5;

    // The derivative is what makes this a pixel width and not a share of the
    // blade: the taper stretches the base wide, so the same number of uv units
    // is a much longer walk on screen down there than it is at the tip.
    float ink = uOutline * perPixel;

    // Still per fragment, and still worth keeping with the far half gone: a
    // blade on a mark near the limb leans its tip out past the silhouette, and
    // the part that is over open sky inverts the way everything else does.
    float over = step(dot(vRel.xy, vRel.xy), 1.0);

    float near = smoothstep(0.0, ${FLARE_LIMB.toFixed(4)}, vFace);

    float alpha = (1.0 - smoothstep(1.0 + ink - aa, 1.0 + ink, spread)) * vFade * near;
    if (alpha <= 0.0) discard;

    // The dot's rule, and the dot's flip, so a blade's outline and the outline
    // around the dot it stands on are one ink meeting itself.
    float tone = uOutline > 0.0 ? float(${RAMP_SIZE - 1}) - uTone : uTone;

    gl_FragColor = vec4(readRamp(mix(float(${RAMP_SIZE - 1}) - tone, tone, over)), alpha);

    #include <colorspace_fragment>
  }
`;

export function createSurfaceMaterial() {
  return new THREE.ShaderMaterial({
    vertexShader: surfaceVertex,
    fragmentShader: surfaceFragment,
    side: THREE.FrontSide,
    uniforms: {
      uRamp: { value: readInkRamp() },
      uRim: { value: 0.75 },
      uRimGamma: { value: 3 },
      uLand: { value: 0.35 },
      uKey: { value: 0 },
      uKeyDir: { value: new THREE.Vector3(0, 0, 1) },
      uBias: { value: 0 },
      uSteps: { value: 4 },
      uToneFloor: { value: 0 },
      uToneCeil: { value: 6 },
      uContour: { value: 0 },
      uContourTone: { value: 6 },
      uContourShadowTone: { value: 6 },
      uShadeSteps: { value: 2 },
      uShadeDepth: { value: 0 },
    },
  });
}

export function createOutlineMaterial() {
  return new THREE.ShaderMaterial({
    vertexShader: outlineVertex,
    fragmentShader: outlineFragment,
    side: THREE.BackSide,
    uniforms: {
      uOffset: { value: 0 },
      uColor: { value: readInkRamp()[6] },
    },
  });
}

export function createSoulMaterial() {
  return new THREE.ShaderMaterial({
    vertexShader: soulVertex,
    fragmentShader: soulFragment,
    side: THREE.DoubleSide,
    transparent: true,
    // The shader decides what the body hides, at the same radius as the ink.
    depthTest: false,
    depthWrite: false,
    uniforms: {
      uRamp: { value: readInkRamp() },
      uRim: { value: 1 },
      uRing: { value: 0 },
      uOutTone: { value: 6 },
      uFrontTone: { value: 0 },
    },
  });
}

export function createHarnessMaterial() {
  return new THREE.ShaderMaterial({
    vertexShader: harnessVertex,
    fragmentShader: harnessFragment,
    // The lines behind the planet stay visible and pale rather than
    // disappearing, so the depth buffer must not have an opinion about them.
    depthTest: false,
    depthWrite: false,
    uniforms: {
      uRamp: { value: readInkRamp() },
      uInTone: { value: 0 },
      uOutTone: { value: 6 },
      uBackFade: { value: 2 },
      uBackHide: { value: 0 },
      uLevelFade: { value: 1 },
    },
  });
}

export function createAnchorMaterial() {
  return new THREE.ShaderMaterial({
    vertexShader: anchorVertex,
    fragmentShader: anchorFragment,
    side: THREE.FrontSide,
    // The edges lie exactly on these faces. Without the offset they z-fight,
    // and with it the two need no render order between them.
    polygonOffset: true,
    polygonOffsetFactor: 1,
    polygonOffsetUnits: 1,
    uniforms: {
      uRamp: { value: readInkRamp() },
      uKeyDir: { value: new THREE.Vector3(0, 0, 1) },
      uTone: { value: 0 },
      uShade: { value: 1 },
    },
  });
}

export function createAnchorEdgeMaterial() {
  return new THREE.ShaderMaterial({
    vertexShader: anchorEdgeVertex,
    fragmentShader: anchorEdgeFragment,
    uniforms: {
      uRamp: { value: readInkRamp() },
      uTone: { value: 6 },
    },
  });
}

/**
 * The ghost owns no ramp slot either — the halo's blend, on the halo's terms.
 * See `anchorGhostFragment` for why a place is the second mark in the medium
 * that cannot be authored wrong against its background.
 */
export function createAnchorGhostMaterial() {
  return new THREE.ShaderMaterial({
    vertexShader: anchorEdgeVertex,
    fragmentShader: anchorGhostFragment,
    transparent: true,
    blending: THREE.CustomBlending,
    blendEquation: THREE.AddEquation,
    blendSrc: THREE.OneMinusDstColorFactor,
    blendDst: THREE.OneMinusSrcColorFactor,
    // Colour only, or the same factors would drive alpha to zero along every
    // dash — a row of holes punched in the canvas.
    blendSrcAlpha: THREE.ZeroFactor,
    blendDstAlpha: THREE.OneFactor,
    // The shader decides what the body hides, and the answer is nothing.
    depthTest: false,
    depthWrite: false,
    uniforms: {
      uBack: { value: 0.45 },
      uDash: { value: 3 },
      uDuty: { value: 0.5 },
      uZoom: { value: 100 },
    },
  });
}

/**
 * The halo owns no ramp slot. It writes a blend *factor* and the framebuffer
 * supplies the colour: `src·(1−dst) + dst·(1−src)` is `mix(dst, 1−dst, f)` for
 * a grey src, so the ring inverts what it crosses and fades by inverting less.
 *
 * That is what retires the exception this mark used to carry. Alpha was the
 * only fade that meant the same thing over the canvas and over a dark body;
 * an inversion needs no such argument, because it has no tone of its own to be
 * wrong about.
 */
export function createHaloMaterial() {
  return new THREE.ShaderMaterial({
    vertexShader: haloVertex,
    fragmentShader: haloFragment,
    side: THREE.DoubleSide,
    transparent: true,
    blending: THREE.CustomBlending,
    blendEquation: THREE.AddEquation,
    blendSrc: THREE.OneMinusDstColorFactor,
    blendDst: THREE.OneMinusSrcColorFactor,
    // Colour only. The same factors on the alpha channel would drive it to zero
    // wherever the ring drew — a hole punched in the canvas, on any context
    // that has an alpha channel at all.
    blendSrcAlpha: THREE.ZeroFactor,
    blendDstAlpha: THREE.OneFactor,
    // The shader decides what the body hides, at the same radius as the ink.
    depthTest: false,
    depthWrite: false,
    uniforms: {
      uSpread: { value: 1 },
      uWidth: { value: 2 },
      uEchoWidth: { value: 1 },
      uEchoScale: { value: 1.24 },
      uEchoWarp: { value: 0.07 },
      uEchoBands: { value: 5 },
      uEchoScatter: { value: 0.35 },
      uEchoDepth: { value: 0.55 },
    },
  });
}

export function createSparkMaterial() {
  return new THREE.ShaderMaterial({
    vertexShader: sparkVertex,
    fragmentShader: sparkFragment,
    // The quad lies in the terrain now, so half the sparks on a world face away
    // from the camera and every one of them is still meant to be seen.
    side: THREE.DoubleSide,
    transparent: true,
    // Not a depth cue: the vertex shader flattens every ground mark onto one
    // plane at the near clip, so nothing here is ever hidden by the world — a
    // spark is visible wherever it landed, the far side included. What the
    // buffer does instead is let the first fragment at a pixel win, which is
    // what makes the group one silhouette rather than a stack of overlaps.
    depthTest: true,
    depthWrite: true,
    // LessEqual — three's default — would let every later fragment through,
    // since they all sit on the same plane. Strictly less is the whole trick.
    depthFunc: THREE.LessDepth,
    uniforms: {
      uRamp: { value: readInkRamp() },
      uCore: { value: 0.25 },
      uWidth: { value: 1.5 },
      uBack: { value: 0.25 },
      uTone: { value: 0 },
      uRingTone: { value: 0 },
      uRoom: { value: STROKE_ROOM },
      uPlane: { value: SPARK_PLANE },
      uOutline: { value: 0 },
    },
  });
}

/** The flare shares the spark's plane and its rule — see `createSparkMaterial`. */
export function createFlareMaterial() {
  return new THREE.ShaderMaterial({
    vertexShader: flareVertex,
    fragmentShader: flareFragment,
    side: THREE.DoubleSide,
    transparent: true,
    depthTest: true,
    depthWrite: true,
    depthFunc: THREE.LessDepth,
    uniforms: {
      uRamp: { value: readInkRamp() },
      uFlareFrom: { value: 3.2 },
      uFlareTo: { value: 1.4 },
      uTone: { value: 0 },
      uRoom: { value: 1 },
      uPlane: { value: SPARK_PLANE },
      uOutline: { value: 0 },
    },
  });
}

/**
 * The same shaders at the plane behind, with room to grow into. Two *materials*
 * rather than two shaders on purpose: an outline that did not agree with its
 * mark about the taper, the travel or the limb would be a second mark, and the
 * one thing it must be is the same one.
 */
export function createSparkOutlineMaterial() {
  const material = createSparkMaterial();

  material.uniforms.uRoom.value = SPARK_OUTLINE_ROOM;
  material.uniforms.uPlane.value = OUTLINE_PLANE;

  return material;
}

export function createFlareOutlineMaterial() {
  const material = createFlareMaterial();

  material.uniforms.uRoom.value = FLARE_OUTLINE_ROOM;
  material.uniforms.uPlane.value = OUTLINE_PLANE;

  return material;
}

export function syncHaloUniforms(material: THREE.ShaderMaterial, visual: PulseVisual) {
  const u = material.uniforms;

  // The same measure the component sizes the quad by, so the ring lands at 1.0
  // however much room the echo's warp asked for.
  u.uSpread.value = haloSpreadOf(visual);
  u.uWidth.value = visual.haloWidth;
  u.uEchoWidth.value = visual.echoWidth;
  u.uEchoScale.value = visual.echoScale;
  u.uEchoWarp.value = visual.echoWarp;
  u.uEchoBands.value = visual.echoBands;
  u.uEchoScatter.value = visual.echoScatter;
  u.uEchoDepth.value = visual.echoDepth;
}

export function syncSparkUniforms(material: THREE.ShaderMaterial, visual: PulseVisual) {
  const u = material.uniforms;

  // The quad holds the ring at its widest, so the dot is that share of it — one
  // number rather than a second scale the two marks could disagree about.
  u.uCore.value = 1 / Math.max(1, visual.sparkRing);
  u.uWidth.value = visual.sparkWidth;
  u.uBack.value = visual.sparkBack;
  u.uTone.value = Math.round(visual.sparkTone);
  u.uRingTone.value = Math.round(visual.sparkRingTone);
}

/**
 * The fill's own sync, and then the one number that makes it an outline. The
 * fill material never receives this, so its `uOutline` stays at the 0 it was
 * built with and the branch in the shader is decided once per material.
 */
export function syncSparkOutlineUniforms(material: THREE.ShaderMaterial, visual: PulseVisual) {
  syncSparkUniforms(material, visual);

  material.uniforms.uOutline.value = Math.max(0, visual.sparkOutline);
}

export function syncFlareUniforms(material: THREE.ShaderMaterial, visual: PulseVisual) {
  const u = material.uniforms;

  u.uFlareFrom.value = Math.max(1, visual.sparkFlareFrom);
  u.uFlareTo.value = Math.max(1, visual.sparkFlareTo);
  // The flare is the dot standing up, so it takes the dot's ink rather than an
  // authored one of its own — two answers for one mark would only disagree, and
  // the two are drawn as one silhouette. `sparkBack` it does not take: the far
  // half has no flare to weigh.
  u.uTone.value = Math.round(visual.sparkTone);
}

/** The blades' half of the one outline — see `syncSparkOutlineUniforms`. */
export function syncFlareOutlineUniforms(material: THREE.ShaderMaterial, visual: PulseVisual) {
  syncFlareUniforms(material, visual);

  material.uniforms.uOutline.value = Math.max(0, visual.sparkOutline);
}

export function syncHarnessUniforms(material: THREE.ShaderMaterial, visual: HarnessVisual) {
  const u = material.uniforms;

  u.uInTone.value = Math.round(visual.inTone);
  u.uOutTone.value = Math.round(visual.outTone);
  u.uBackFade.value = Math.round(visual.backFade);
  u.uBackHide.value = Math.round(visual.backHide);
  u.uLevelFade.value = Math.round(visual.levelFade);
}

export function syncAnchorUniforms(material: THREE.ShaderMaterial, visual: AnchorVisual) {
  const u = material.uniforms;
  const key = keyLight.direction;

  u.uKeyDir.value.set(key.x, key.y, key.z);
  u.uTone.value = Math.round(visual.faceTone);
  u.uShade.value = Math.round(visual.faceShade);
}

export function syncAnchorEdgeUniforms(material: THREE.ShaderMaterial, visual: AnchorVisual) {
  material.uniforms.uTone.value = Math.round(visual.edgeTone);
}

export function syncAnchorGhostUniforms(
  material: THREE.ShaderMaterial,
  visual: AnchorVisual,
  zoom: number,
) {
  const u = material.uniforms;

  u.uBack.value = visual.ghostBack;
  u.uDash.value = Math.max(0.5, visual.dash);
  u.uDuty.value = visual.duty;
  u.uZoom.value = zoom;
}

export function syncSoulUniforms(material: THREE.ShaderMaterial, visual: SwarmVisual) {
  const u = material.uniforms;

  u.uRim.value = visual.rim;
  u.uRing.value = visual.ring;
  u.uOutTone.value = Math.round(visual.outTone);
  u.uFrontTone.value = Math.round(visual.frontTone);
}

export function syncSurfaceUniforms(material: THREE.ShaderMaterial, visual: PlanetVisual) {
  const u = material.uniforms;

  u.uRim.value = visual.rim;
  u.uRimGamma.value = visual.rimGamma;
  u.uLand.value = visual.land;
  u.uKey.value = visual.key;
  u.uBias.value = visual.bias;

  // The aim is the system's, not the world's — read ambiently, as the ramp is.
  const key = keyLight.direction;
  u.uKeyDir.value.set(key.x, key.y, key.z);

  u.uSteps.value = Math.max(1, Math.round(visual.steps));
  u.uToneFloor.value = Math.round(visual.toneFloor);
  u.uToneCeil.value = Math.round(visual.toneCeil);
  u.uContour.value = visual.contour;
  u.uContourTone.value = Math.round(visual.contourTone);
  u.uContourShadowTone.value = Math.round(visual.contourShadowTone);
  u.uShadeSteps.value = Math.max(1, Math.round(visual.shadeSteps));
  u.uShadeDepth.value = visual.shadeDepth;
}

/**
 * `zoom` on an orthographic camera is pixels per world unit, because Threlte
 * sizes the frustum in pixels — so an outline authored in px converts exactly.
 */
export function syncOutlineUniforms(
  material: THREE.ShaderMaterial,
  visual: PlanetVisual,
  ramp: THREE.Color[],
  zoom: number,
) {
  material.uniforms.uOffset.value = zoom > 0 ? visual.outline / zoom : 0;
  material.uniforms.uColor.value = ramp[Math.round(visual.outlineTone)] ?? ramp[6];
}
