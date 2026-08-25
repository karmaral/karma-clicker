import * as THREE from 'three';
import type { AnchorVisual } from './anchor';
import type { HarnessVisual } from './harness';
import { readInkRamp, RAMP_SIZE, RAMP_SLOTS } from './ink';
import { keyLight } from './light.svelte';
import type { SwarmVisual } from './orbit';
import { haloSpreadOf, STROKE_ROOM, type PulseVisual } from './pulse';
import { weightOf } from './ribbon';
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
 * A segment widened into a quad — see `ribbon.ts` for why anything drawn as a
 * line needs this to carry a weight at all. Shared by the harness and by both
 * states of an anchor's edges, so the three cannot drift apart on what a stroke
 * of a given width comes out as.
 *
 * Exact under an orthographic camera and only there: view units are pixels over
 * zoom whatever the depth, so a swing perpendicular in view xy is the same
 * weight wherever the segment points and however far away it is. No viewport
 * uniform, no perspective divide.
 *
 * `uWidth` and `uCap` are declared by each shader that includes this, the way
 * `rampRead` leaves `uRamp` to its callers — a uniform the join checker cannot
 * see is a uniform that is silently 0.
 */
const ribbonPlace = /* glsl */ `
  attribute vec3 toward;
  attribute float side;

  vec4 ribbonView(out float slip) {
    vec4 here = modelViewMatrix * vec4(position, 1.0);
    vec4 there = modelViewMatrix * vec4(toward, 1.0);

    vec2 span = there.xy - here.xy;

    // How long the segment is *on screen*, which is what both the direction and
    // the cap are measured against.
    float reach = length(span);

    // Edge-on to the camera a segment is a point and has no direction to stand
    // perpendicular to. It is also invisible, so any answer will do.
    vec2 dir = reach > 1e-6 ? span / reach : vec2(1.0, 0.0);
    float arm = uWidth * 0.5;

    // Squared off, so the corners of a polyline fill instead of showing a nick
    // at every one. How far that pushed this end past its own endpoint goes back
    // as a share of the span, for anything measured along the line to undo.
    float cap = arm * uCap;
    slip = reach > 1e-6 ? -cap / reach : 0.0;

    return here + vec4(vec2(-dir.y, dir.x) * arm * side - dir * cap, 0.0, 0.0);
  }
`;

/**
 * 3D simplex, and the project's only noise in a shader. Deliberately not the
 * hash kind: a `fract(sin(...))` field depends on the precision of `sin` at
 * large arguments, which differs between Mali, Adreno and desktop — and the
 * field *is* what the surface looks like, so a world that comes out different
 * on a phone is a bug that cannot be reproduced. This permutation is exact
 * integer arithmetic in float and is the same everywhere.
 *
 * Sampled on a direction, so a sphere has no seam and no pole to pinch —
 * `noise.ts`'s opening argument, spent a second time.
 *
 * Ashima Arts / Stefan Gustavson, webgl-noise, MIT. Left as written rather than
 * reformatted to the house style: it is a citation, and a citation you have
 * edited is not one.
 *
 * Declares no uniforms, so every shader including it declares its own — the
 * contract `rampRead` has with `uRamp`, and for the same reason. Up here
 * rather than beside the veil because the body's own fragment includes it too,
 * and a const is not hoisted.
 */
const simplex3D = /* glsl */ `
  vec3 mod289(vec3 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
  vec4 mod289(vec4 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
  vec4 permute(vec4 x) { return mod289(((x * 34.0) + 1.0) * x); }
  vec4 taylorInvSqrt(vec4 r) { return 1.79284291400159 - 0.85373472095314 * r; }

  float snoise(vec3 v) {
    const vec2 C = vec2(1.0 / 6.0, 1.0 / 3.0);
    const vec4 D = vec4(0.0, 0.5, 1.0, 2.0);

    vec3 i = floor(v + dot(v, C.yyy));
    vec3 x0 = v - i + dot(i, C.xxx);

    vec3 g = step(x0.yzx, x0.xyz);
    vec3 l = 1.0 - g;
    vec3 i1 = min(g.xyz, l.zxy);
    vec3 i2 = max(g.xyz, l.zxy);

    vec3 x1 = x0 - i1 + C.xxx;
    vec3 x2 = x0 - i2 + C.yyy;
    vec3 x3 = x0 - D.yyy;

    i = mod289(i);
    vec4 p = permute(permute(permute(
               i.z + vec4(0.0, i1.z, i2.z, 1.0))
             + i.y + vec4(0.0, i1.y, i2.y, 1.0))
             + i.x + vec4(0.0, i1.x, i2.x, 1.0));

    float n_ = 0.142857142857;
    vec3 ns = n_ * D.wyz - D.xzx;

    vec4 j = p - 49.0 * floor(p * ns.z * ns.z);

    vec4 x_ = floor(j * ns.z);
    vec4 y_ = floor(j - 7.0 * x_);

    vec4 x = x_ * ns.x + ns.yyyy;
    vec4 y = y_ * ns.x + ns.yyyy;
    vec4 h = 1.0 - abs(x) - abs(y);

    vec4 b0 = vec4(x.xy, y.xy);
    vec4 b1 = vec4(x.zw, y.zw);

    vec4 s0 = floor(b0) * 2.0 + 1.0;
    vec4 s1 = floor(b1) * 2.0 + 1.0;
    vec4 sh = -step(h, vec4(0.0));

    vec4 a0 = b0.xzyw + s0.xzyw * sh.xxyy;
    vec4 a1 = b1.xzyw + s1.xzyw * sh.zzww;

    vec3 p0 = vec3(a0.xy, h.x);
    vec3 p1 = vec3(a0.zw, h.y);
    vec3 p2 = vec3(a1.xy, h.z);
    vec3 p3 = vec3(a1.zw, h.w);

    vec4 norm = taylorInvSqrt(vec4(dot(p0, p0), dot(p1, p1), dot(p2, p2), dot(p3, p3)));
    p0 *= norm.x;
    p1 *= norm.y;
    p2 *= norm.z;
    p3 *= norm.w;

    vec4 m = max(0.6 - vec4(dot(x0, x0), dot(x1, x1), dot(x2, x2), dot(x3, x3)), 0.0);
    m = m * m;

    return 42.0 * dot(m * m, vec4(dot(p0, x0), dot(p1, x1), dot(p2, x2), dot(p3, x3)));
  }
`;

/**
 * A stroke centred on `at`, `width` px wide, measured against a coordinate that
 * runs 1.0 at the ring's own radius. `perPixel` is passed in because a
 * derivative has to be taken in uniform control flow, and the width test is not.
 *
 * Up here with the other shared chunks rather than beside the halo that was its
 * first caller: the core's ruling includes it too, and a const is not hoisted —
 * `simplex3D`'s move, for `simplex3D`'s reason.
 */
const strokeAt = /* glsl */ `
  float strokeAt(float q, float at, float width, float perPixel) {
    if (width <= 0.0) return 0.0;

    float pixels = abs(q - at) / max(perPixel, 1e-6);

    return 1.0 - smoothstep(width * 0.5 - 0.5, width * 0.5 + 0.5, pixels);
  }
`;

/**
 * The window, as a **factor on whatever the shader was about to draw**. The
 * fresnel one screen down is how far a facet turns *from* the camera; this is
 * the same reading the other way, so the front opens and the limb stays whole —
 * and the limb is where a world's silhouette is read, which is why it is the
 * half that may not be spent.
 *
 * Shared, because a world is more than its surface. The body and both veil
 * modes call it on the same radial normal, so the three open together and the
 * weather over an opened front is as thin as the front is. A window cut in the
 * body alone left the cloud hanging in the hole, which read as a lid.
 *
 * `uClarity`, `uClarityGamma` and `uClaritySteps` are declared by each shader
 * that calls this rather than here — `rampRead`'s arrangement, and the one the
 * join check reads.
 */
const clarityOpen = /* glsl */ `
  float clarityAt(vec3 normal) {
    if (uClarity <= 0.0) return 1.0;

    float face = pow(clamp(abs(normal.z), 0.0, 1.0), uClarityGamma);

    // Steepened about its middle before it is spent. The bare fresnel is a
    // gradient with no edge anywhere on it, and a window whose edge is
    // everywhere reads as haze over the world rather than as a hole in it. The
    // S puts the whole falloff in one band, so uClarityGamma moves a rim
    // instead of stretching a wash.
    //
    // Twice, because once was still a slope: the second pass flattens what the
    // first left of the shoulders and halves the band again. Composed rather
    // than written as one curve so the knob keeps its meaning — this is the
    // same S the window has always had, applied again.
    face = face * face * (3.0 - 2.0 * face);
    face = face * face * (3.0 - 2.0 * face);

    float alpha = clamp(1.0 - uClarity * face, 0.0, 1.0);

    // And then quantised, which is the ramp's own argument spent on the one
    // quantity on this world that had escaped it. The lattice is fixed at 0 and
    // 1 and does not move with uClarity, so a level is a level: a half-open
    // window is the same half-open the next world's is, and turning the clarity
    // down drops bands off the middle rather than sliding all of them.
    float steps = max(2.0, uClaritySteps) - 1.0;

    return floor(alpha * steps + 0.5) / steps;
  }
`;

/**
 * The core's inks, three readings' worth, and they are **not** authorable.
 * Everything else the planet draws is a world's own character; this one mark is
 * a *reading* of the harvest, and a reading each world stated in its own colours
 * would be one nobody could learn. Same argument that keeps the hatch's axis off
 * the sliders.
 *
 * The ramp runs 0 `--surface` to 6 `--ink-900`, so the three readings take the
 * two ends and the middle: **positive is paper, negative is black, even is a
 * mid-light grey**. That ordering is the copy's, not a palette's — service to
 * others is the light one — and it is the strongest signal on the screen
 * because it is the one thing a glance has to get right.
 *
 * Each ruled end hatches **one step in from its own ground**, which is why the
 * two are not simply the ramp's ends against its darkest ink: a hatch far from
 * its ground is a second mark sitting on the core, and a hatch one step off it
 * is the ground itself, worked. Even is bare — no ruling at all, because neither
 * side was taken.
 *
 * The souls get **two** numbers per reading rather than borrowing the hatch's,
 * because a dot has to *carry* at a few pixels where a stroke only has to be
 * legible. Both ruled ends give the dot their own ground and ring it in the far
 * end of the ramp: an arrived soul is a bubble the colour of the world it went
 * into, and what the eye picks up at 4px is the rim. Even keeps the shape and
 * spends its contrast inside the ramp instead of across it — a step lighter than
 * its ground, rimmed two steps darker — so the swarm is legible there without
 * either end of the ramp on it, which is what would read as a decision.
 *
 * The ring is fixed here for the same reason the ground is. Outside the core the
 * swarm keeps its own rule — the far end of the ramp from whatever the fill
 * landed on — because out there the dot is over the world, not over a reading.
 */
const CORE_TONES = {
  even: { ground: 2, hatch: 2, soul: 1, ring: 4 },
  light: { ground: 0, hatch: 1, soul: 0, ring: 6 },
  dark: { ground: 6, hatch: 5, soul: 6, ring: 0 },
};

/**
 * No lights, no gradient map, no `MeshToonMaterial`. Under an orthographic
 * camera the view vector is a constant, so the fresnel collapses to how far a
 * facet turns from the screen — `1 − |N.z|`. Everything else is where that gets
 * quantised.
 *
 * That one term is read twice and in opposite directions. As `rim` it is the
 * shade at the limb; as `open` it is the **window**, which is the same reading
 * turned round — the front dissolves and the silhouette stays whole, so what is
 * spent is the half of the disc that says least about the world's shape.
 */
const surfaceVertex = /* glsl */ `
  attribute float height;

  varying float vHeight;
  varying vec3 vNormal;
  varying vec3 vDir;

  void main() {
    vHeight = height;

    // The attribute is the field's own surface normal, baked in geometry.ts.
    vNormal = normalize(normalMatrix * normal);

    // Object space, so the grain rides the surface the way vHeight does rather
    // than sitting on the paper. position is r(d)*d with r above zero across the
    // authored range of amplitude, so normalize recovers d — veilVertex's move.
    vDir = normalize(position);

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
  uniform float uGrain;
  uniform float uShadeGrain;
  uniform float uGrainScale;
  uniform vec3 uOrigin;
  uniform float uClarity;
  uniform float uClarityGamma;
  uniform float uClaritySteps;

  varying float vHeight;
  varying vec3 vNormal;
  varying vec3 vDir;

  ${rampRead}
  ${simplex3D}
  ${clarityOpen}

  /**
   * A band boundary drawn as a stroked path rather than left as the step between
   * two tones. Widths come from fwidth, so the line is the weight it
   * says it is however steep the field runs — and is simply absent where the
   * field is flat, instead of smearing across it.
   *
   * It is handed the *grained* band and the *clean* rate, and the pair is the
   * whole of how it behaves under a grain. The band, so the line stays
   * coincident with the tone edge it is the boundary of instead of ruling a
   * smooth arc across a ragged one. The rate, because a rate carrying the
   * displacement spikes wherever the noise runs fast, and a width divided by it
   * thins to nothing there — the bug ridgeAt records one shader down.
   */
  float contourAt(float band, float perPixel) {
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

    // The grain, and the one noise in the body's fragment. Both quantisers
    // below are exact level sets, so a smooth field crosses one as a perfect
    // curve; this displaces the coordinate before the floor and the boundary
    // comes apart into paper instead. Half the noise's range, so an amount of 1
    // is a wander of one whole slot.
    //
    // Faded as its period approaches two pixels — veilFbm's rule with its
    // constants. The limb compresses the sphere hard and an unfaded grain
    // fizzes there. To nothing rather than to its mean, because a grain stuck
    // at its mean is a constant offset on the band, which is uBias said badly.
    //
    // One sample under both amounts. They are independent coordinates already,
    // so a shared displacement is a grain in the paper rather than a
    // correlation — and it is one snoise instead of two.
    float perStep = length(fwidth(vDir));
    float fade = 1.0 - smoothstep(0.25, 0.5, uGrainScale * perStep);
    float grain = snoise(vDir * uGrainScale + uOrigin) * 0.5 * fade;

    // The window, on the field's own normal so the front opens along the
    // terrain rather than along the sphere it was displaced from. Spent as an
    // **alpha**, and this is the one mark on the world where the seven inks do
    // not hold: a blend puts the ramp value and whatever stands behind it in the
    // same pixel and the answer is between them. Taken knowingly.
    //
    // A dithered cutout was here first and held the inks, saying the same thing
    // as a density of holes — but a hole is all or nothing, so a barely open
    // window came out as sparse confetti, and thin is most of what this window
    // is. It carried a speckle after that, and the speckle went the same way:
    // the window is a *clearing*, and grain in it read as damage to the surface
    // rather than as the surface thinning.
    float alpha = clarityAt(N);

    // The texture. vHeight is a vertex attribute, so this is the only term that
    // turns with the surface — and it is quantised alone, so the pattern is a
    // property of the world rather than of where the camera is standing. Left
    // unclamped: the contour reads it, and a boundary past the ends of the ramp
    // must not be drawn.
    float land = vHeight * 0.5 + 0.5;

    // The clean coordinate and its rate, taken before the grain reaches either.
    // Derivatives have to be in uniform control flow, and the rate is what the
    // contour is weighed in.
    float clean = (uLand * land + uBias) * uSteps;
    float perPixel = fwidth(clean);

    float band = clean + uGrain * grain;
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
    float shadeLevel = floor(shade * uShadeSteps + 0.5 + uShadeGrain * grain);

    // readRamp clamps, so the shadow crushes to solid ink rather than wrapping.
    float index = mix(uToneFloor, uToneCeil, spread) + shadeLevel * uShadeDepth;

    // A contour takes its ink from which side of the terminator it falls on,
    // not from the tone beneath it — so a line stays legible crossing out of a
    // pale band into a dark one. Switched on the shade level, so the ink
    // changes where a shade band changes and never partway through one. Works
    // at uShadeDepth 0, where the contour is then the only thing saying where
    // the light is.
    float contourInk = mix(uContourTone, uContourShadowTone, step(0.5, shadeLevel));

    // Last, and that is the whole of why it is here rather than up beside its
    // own noise: a discard makes the control flow non-uniform for everything
    // after it, and every fwidth in this shader is above this line. A fully open
    // pixel is dropped rather than blended at nought, so it does not leave a
    // depth write behind for the burst to be cut against.
    if (alpha <= 0.0) discard;

    gl_FragColor = vec4(mix(readRamp(index), readRamp(contourInk), contourAt(band, perPixel)), alpha);

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

/**
 * `uFlash` is the click reaching the world's own edge: at 1 the outline is
 * `uFlashColor` and at 0 it is exactly the tone the world authored, so there is
 * no state to restore when a burst ends.
 */
const outlineFragment = /* glsl */ `
  uniform vec3 uColor;
  uniform vec3 uFlashColor;
  uniform float uFlash;

  void main() {
    gl_FragColor = vec4(mix(uColor, uFlashColor, uFlash), 1.0);

    #include <colorspace_fragment>
  }
`;

/**
 * The burst: the same inverted hull at a much greater width, fading rather than
 * travelling. It is drawn transparent and **never writes depth**, and its depth
 * test is `LessDepth` — strictly less, the spark group's rule — so a fragment at
 * the same depth as the body or as the body's own outline is rejected and what
 * survives is only the band standing outside both.
 */
const burstFragment = /* glsl */ `
  uniform vec3 uColor;
  uniform float uFade;

  void main() {
    if (uFade <= 0.0) discard;

    gl_FragColor = vec4(uColor, uFade);

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

  // How far this soul has committed to the world, 0 in its orbit and 1 berthed.
  // Per instance, because the swarm crosses a few at a time and the rest are
  // still leaving.
  attribute float stay;

  varying vec2 vUv;
  varying float vStay;

  // The fragment's offset from the body's centre, in camera axes. Under an
  // orthographic camera that makes xy the silhouette and z the near/far test.
  varying vec3 vRel;

  // The same offset for the dot's *centre*, and the dot's own radius with it.
  // Constant across the quad, so a test written on these is a test about the
  // whole soul rather than about the pixel.
  varying vec3 vAt;
  varying float vSpan;

  void main() {
    vUv = uv;
    vStay = stay;

    vec4 origin = modelViewMatrix * vec4(0.0, 0.0, 0.0, 1.0);
    vec4 centre = modelViewMatrix * instanceMatrix * vec4(0.0, 0.0, 0.0, 1.0);

    // The quad grows to hold the ring, so the fill stays the size it was
    // authored at — the ring is added around a dot, not taken out of one.
    float span = length(instanceMatrix[0].xyz) * (1.0 + uRing);

    vec4 viewPos = centre + vec4(position.xy * span, 0.0, 0.0);
    vRel = viewPos.xyz - origin.xyz;

    vAt = centre.xyz - origin.xyz;
    vSpan = span * 0.5;

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
 *
 * `uRim` is the body's *drawn* edge, outline included — see `syncSoulUniforms`.
 * At the sphere alone a soul coming round the back reappeared inside the outline.
 *
 * `uCore` is the third place, and the one exception to all of the above: inside
 * it there is no far half to hide, because the thing a soul would be hidden
 * behind is the core it has arrived in. Both halves are drawn, over the core, in
 * an ink of their own. At 0 the whole test is inert and this is the two-ink
 * shader it was.
 *
 * Being hidden is the soul's own commitment: `stay` scales the far half's
 * hiding, so a soul still in orbit is never behind the world and one crossing
 * into it sinks behind it over the crossing. A leaver clipped by a silhouette it
 * is not going into read as the world eating it. Spent on the alpha rather than
 * on a discard because a half-committed soul is halfway hidden, which no cut can
 * say.
 */
const soulFragment = /* glsl */ `
  uniform vec3 uRamp[${RAMP_SLOTS}];
  uniform float uRim;
  uniform float uRing;
  uniform float uOutTone;
  uniform float uFrontTone;
  uniform float uCore;
  uniform float uCoreTone;
  uniform float uCoreRing;

  varying vec2 vUv;
  varying float vStay;
  varying vec3 vRel;
  varying vec3 vAt;
  varying float vSpan;

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

    // A soul that has arrived. Tested on the same silhouette radius the ink
    // switches on, so the core is a disc in the same measure as everything else
    // here — the sphere it is drawn from is never asked about.
    //
    // Whole dot, unlike everything else in this shader: arriving is something a
    // soul does and not something a pixel does, and per fragment it cropped a
    // berthed soul to the crescent of itself that was over the core. The dot's
    // own radius is added, so a soul touching the rim is in and the wobble
    // cannot carry an outermost berth back out of it.
    float span = uCore + vSpan;
    float inCore = step(dot(vAt.xy, vAt.xy), span * span) * step(0.001, uCore);

    // Behind the world is behind the world, for whatever has thrown in with it.
    // Per fragment, so a dot crossing the silhouette is cut in half rather than
    // vanishing whole.
    float behind = over * (1.0 - front) * (1.0 - inCore);
    alpha *= 1.0 - behind * clamp(vStay, 0.0, 1.0);
    if (alpha <= 0.0) discard;

    float tone = mix(mix(uOutTone, uFrontTone, over), uCoreTone, inCore);

    // Over the world the ring takes the far end of the ramp from whatever the
    // fill landed on, rather than an ink of its own: an authored tone would need
    // setting once per place a soul can be, and would still be wrong for one of
    // them. Over the core it is fixed with the rest of the reading, because
    // there the pair is the mark — a dot in the ground's own tone that is only
    // seen at all by its rim.
    // Gated, or at width 0 the ring would still claim the dot's own soft edge.
    float core = 1.0 / (1.0 + uRing);
    float ring = smoothstep(core - aa, core, spread) * step(0.001, uRing);
    float ringTone = mix(mix(6.0, 0.0, step(3.5, tone)), uCoreRing, inCore);
    tone = mix(tone, ringTone, ring);

    gl_FragColor = vec4(readRamp(tone), alpha);

    #include <colorspace_fragment>
  }
`;

/**
 * The harness. One ribbon for the whole of it, with `level` — 0 innermost,
 * 1 outermost — carried per vertex, and `vRel` the fragment's offset from the
 * body's centre in camera axes. Under an orthographic camera that makes xy the
 * silhouette and z the near/far test, which is the whole of what the ink rule
 * needs.
 *
 * `vRel` is read off the *swung* vertex rather than the centreline, so a stroke
 * wide enough to straddle the silhouette is inked by where its own edge landed.
 * The alternative would ink the whole width by the middle and leave a heavy line
 * changing colour a half-width late.
 */
const harnessVertex = /* glsl */ `
  attribute float level;

  uniform float uWidth;
  uniform float uCap;

  varying float vLevel;
  varying vec3 vRel;

  ${ribbonPlace}

  void main() {
    vLevel = level;

    float slip;
    vec4 viewPos = ribbonView(slip);
    vec3 centre = (viewMatrix * vec4(0.0, 0.0, 0.0, 1.0)).xyz;

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
  uniform float uRim;
  uniform float uInTone;
  uniform float uOutTone;
  uniform float uBackFade;
  uniform float uBackHide;
  uniform float uLevelFade;

  varying float vLevel;
  varying vec3 vRel;

  ${rampRead}

  void main() {
    // The body's *drawn* edge, which is the mean sphere plus the outline's own
    // weight — where a viewer sees the world end, not where it is modelled. Cut
    // at the modelled radius, a line behind the world came back out inside the
    // outline and crossed it, and a line in front took its off-body ink while
    // still over the black edge.
    //
    // Terrain stays ignored: a loop stands off the surface, and at the
    // amplitudes worlds are authored at that error is inside the weight this is
    // now adding.
    float over = step(dot(vRel.xy, vRel.xy), uRim * uRim);
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
  attribute float alongTo;

  uniform float uWidth;
  uniform float uCap;

  varying float vAlong;
  varying float vBack;
  varying vec3 vRel;

  ${ribbonPlace}

  void main() {
    float slip;
    vec4 viewPos = ribbonView(slip);

    // The cap carried this end past the corner it belongs to, so the arc length
    // it reports comes with it — or the ghost's dash would compress by a cap at
    // every one of the twenty spans a solid is drawn from.
    vAlong = mix(along, alongTo, slip);

    vec3 centre = (viewMatrix * vec4(0.0, 0.0, 0.0, 1.0)).xyz;
    vec4 origin = modelViewMatrix * vec4(0.0, 0.0, 0.0, 1.0);

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

/** The octave loop's static bound. `veilOctaves` is the slider inside it. */
const VEIL_OCTAVES = 6;

/**
 * What `field.ts`'s `measureRange` cannot be here. A fragment cannot probe its
 * own field, so the reachable range is asserted once instead of measured per
 * world. This is the whole price of evaluating a field in GLSL, and it is paid
 * in one number: `veilCoverage` re-means itself slightly when `veilOctaves`
 * moves, which `land` on the body never does.
 */
const VEIL_SPREAD = 1.6;

/**
 * The veil as one number, and the whole of what the three composite modes
 * share. They differ only in what they do with it, which is why it lives out
 * here rather than three times over.
 *
 * Declares no uniforms. Every including shader states the block itself, or the
 * join checker cannot see them and a missing one is silently 0.
 */
const veilField = /* glsl */ `
  /**
   * Octave sum. Lacunarity is fixed at 2 rather than authored: the veil has no
   * measured range to absorb what a second octave-shaping knob does to it, and
   * gain already carries the difference between wisp and blob.
   */
  float veilFbm(vec3 dir, float perStep) {
    float frequency = uFrequency;
    float amplitude = 1.0;
    float total = 0.0;
    float range = 0.0;

    // Statically bounded with a uniform break. The count is a slider and the
    // loop is not allowed to be one — readRamp's constraint, one file over.
    for (int i = 0; i < ${VEIL_OCTAVES}; i++) {
      if (float(i) >= uOctaves) break;

      // An octave whose features are finer than the pixels cannot be drawn,
      // only sparkled at — and a procedural field has no mip to fall back on,
      // so it has to be faded by hand. Cut as the period approaches two pixels,
      // which is Nyquist. This is why detail dissolves toward the limb, where
      // the sphere turns away and a pixel covers a great deal of it, instead of
      // fizzing there.
      float fade = 1.0 - smoothstep(0.25, 0.5, frequency * perStep);

      total += snoise(dir * frequency + uOrigin) * amplitude * fade;

      // The *unfaded* amplitude, so a dropped octave is genuinely dropped and
      // the coarse ones are not boosted to stand in for it. The veil thins at
      // the limb rather than growing a hard ring there.
      range += amplitude;
      frequency *= 2.0;
      amplitude *= uGain;
    }

    return range > 0.0 ? total / range * ${VEIL_SPREAD.toFixed(2)} : 0.0;
  }

  /**
   * Domain warp: push the sample point around by the field and put it back on
   * the sphere. Renormalising is what keeps it a slide across the surface
   * rather than a second shell. The three offsets are field.ts's, so nobody has
   * to invent a second set of arbitrary distant numbers.
   */
  vec3 veilWarpAt(vec3 dir, float perStep) {
    // Faded on the same rule as an octave, and it has to be: a warp that
    // sparkles moves every sample point under it, so it would put the noise's
    // own aliasing back however carefully the sum was band-limited.
    float fade = 1.0 - smoothstep(0.25, 0.5, uFrequency * perStep);
    if (uWarp <= 0.0 || fade <= 0.0) return dir;

    vec3 p = dir * uFrequency + uOrigin;

    return normalize(dir + uWarp * fade * vec3(
      snoise(p + vec3(19.3, 7.1, 3.7)),
      snoise(p + vec3(5.2, 23.9, 11.4)),
      snoise(p + vec3(31.6, 2.8, 17.5))
    ));
  }

  /**
   * The fill, and the line around it. Two answers from one field walk, because
   * the line is a contour *of* the fill and computing it anywhere else would be
   * a second threshold that could disagree with the first.
   *
   * The key comes out *beside* the fill rather than folded into it, and that is
   * the one thing the two modes disagree about. An alpha veil multiplies them
   * back together on the spot, so the key thins it — nothing has changed there.
   * A hatched veil keeps them apart: shape from the field, shading from the
   * light, which is the only way a mark can be both dense and dark.
   *
   * lineGrain wanders the *outline* and nothing else. In the hatch the marks
   * are broken by a noise the line knows nothing about, so a break patch
   * straddling the contour takes the strokes away and leaves the ink ruling
   * straight through the gap. Fed the same noise, the line follows the edge it
   * is the edge of. Centred, so 0 is the clean contour and the alpha veil — which
   * has no such noise — passes it.
   */
  float veilCover(vec3 dir, vec3 N, float lineGrain, out float line, out float lit) {
    // How far the sample point moves from one pixel to the next. Taken on the
    // unwarped direction and before any branch — derivatives have to be in
    // uniform control flow, and the warp is a small enough push that its own
    // rate is this one.
    float perStep = length(fwidth(dir));

    vec3 warped = veilWarpAt(dir, perStep);
    float field = veilFbm(warped, perStep);

    // Latitude bands at the warped direction, so the swirl reaches them. The
    // body's strata, and the same reason they are not a barcode.
    if (uBands > 0.0) {
      field = mix(field, sin(warped.y * uBandFrequency * 3.14159265), uBands);
    }

    // Where the veil is allowed: an annulus in sin-latitude, not a cap. An
    // aurora is a ring at sixty degrees and a cap centred on the pole is a hat.
    // Read at the warped direction too, or the ring's edge would be the one
    // ruled line on the world. Past a uPoleEdge of 2 the test cannot fail and
    // the mask is simply gone, which is the cloud reading.
    float mask = 1.0 - smoothstep(uPoleEdge * 0.5, uPoleEdge, abs(abs(warped.y) - uPole));

    // The threshold is what turns a field into a shape. uEdge is its softness
    // in field units; the derivative under it is a floor, so an edge is never
    // harder than the screen can draw however fast the field runs beneath it.
    float over = field * 0.5 + 0.5 - uCoverage;

    // Taken before any branch — derivatives have to be in uniform control flow.
    float perPixel = max(fwidth(over), 1e-6);
    float soft = max(max(uEdge, perPixel * 1.5), 1e-4);

    // Signed, and the sign is which side of the light the veil belongs to:
    // cloud burns off the dark half, an aurora is a night mark and lives at a
    // negative value. Its magnitude is how hard that reading is pressed, so at
    // 0 the light does not reach the veil at all and lit is flat 1.
    float facing = 0.5 + 0.5 * dot(N, uKeyDir);
    float side = mix(1.0 - facing, facing, step(0.0, uKey));

    lit = mix(1.0, side, abs(uKey));

    // Everything about the veil that is *not* the light. The modes both want
    // this on its own, and only one of them wants it multiplied by the key.
    float shape = mask * uVeil;

    /**
     * The line is drawn where the fill reaches *full*, not at the silhouette —
     * and that one choice is the whole of how it behaves. At uEdge 0 the two
     * are the same contour and the line is the silhouette; open uEdge and full
     * coverage retreats up the field's own slope toward each blob's core,
     * taking the line with it. So a diffuse veil is a soft mass with an outline
     * drawn around its solid heart, and no second slider had to say so.
     *
     * It follows the field rather than any centre, so a long curtain keeps a
     * line down its spine instead of collapsing to a dot — and a wisp whose
     * peak never reaches full coverage has no line at all, which is right: it
     * has no solid part to draw the edge of.
     *
     * The contour is uEdge and **not** soft, which is the same number only
     * until the derivative floor bites. soft is a per-pixel quantity: anchoring
     * a line to it gives every pixel a slightly different contour to be near,
     * and the line comes apart into dots wherever the field runs fast. The
     * authored edge is the same for the whole surface, so the line is one line.
     *
     * Width in pixels, from the derivative, exactly as contourAt does it on
     * the surface — so it holds its weight at any widget size with no zoom.
     */
    line = 0.0;

    if (uOutline > 0.0) {
      float reach = uOutline * 0.5;

      // The wander is in *pixels*, and is a share of the line's own weight: at
      // lineGrain's half-unit range this is up to a quarter of the drawn width
      // either way, so the ink follows the broken edge without coming apart
      // along it. Scale-free at any widget size the way every other measure in
      // this shader is, and needing no slider to say how far — a thick line
      // wanders proportionally more than a hairline, which is what a wider pen
      // does.
      float wander = lineGrain * reach * perPixel;
      float pixels = abs(over - uEdge - wander) / perPixel;

      line = (1.0 - smoothstep(reach - 0.5, reach + 0.5, pixels)) * shape;
    }

    return smoothstep(-soft, soft, over) * shape;
  }
`;

/**
 * The body's geometry borrowed for its topology alone. Normalising throws the
 * terrain away and re-inflates a true sphere, so no veil setting can touch the
 * shape cache and a cloud is not a lumpy copy of the ground under it —
 * `outlineVertex`'s move, front-faced and normalised.
 *
 * Under an orthographic camera a shell at 1 + uHeight differs from one at 1 in
 * exactly two ways: the pattern is magnified by that factor, and the limb
 * reaches that far past the body. There is no parallax to buy. So uHeight is
 * honestly a *limb reach*, and wants authoring against `outline / zoom`.
 *
 * `position` is r(d)·d with r above zero across the whole authored range of
 * `amplitude`, so normalize recovers d exactly. At an amplitude that drove r
 * through zero the direction would flip, and the field with it.
 */
const veilVertex = /* glsl */ `
  uniform float uHeight;

  varying vec3 vDir;
  varying vec3 vNormal;

  void main() {
    vDir = normalize(position);

    // The shell's own normal is its radial. The baked attribute belongs to a
    // surface this shader has just discarded.
    vNormal = normalize(normalMatrix * vDir);

    gl_Position = projectionMatrix * modelViewMatrix * vec4(vDir * (1.0 + uHeight), 1.0);
  }
`;

/**
 * Mode 0. Plain alpha over one ramp tone — the only veil that carries an ink,
 * and so the only one that can be authored wrong against the world beneath it.
 * That is the whole reason the other two exist.
 *
 * It is also the first thing in the stack whose pixels are not ramp values: a
 * partial alpha invents a grey between two slots. Known, and chosen.
 */
const veilAlphaFragment = /* glsl */ `
  uniform vec3 uRamp[${RAMP_SLOTS}];
  uniform float uTone;
  uniform float uOutline;
  uniform float uOutlineTone;
  uniform float uVeil;
  uniform vec3 uOrigin;
  uniform float uFrequency;
  uniform float uOctaves;
  uniform float uGain;
  uniform float uWarp;
  uniform float uBands;
  uniform float uBandFrequency;
  uniform float uCoverage;
  uniform float uEdge;
  uniform float uPole;
  uniform float uPoleEdge;
  uniform float uKey;
  uniform vec3 uKeyDir;
  uniform float uClarity;
  uniform float uClarityGamma;
  uniform float uClaritySteps;

  varying vec3 vDir;
  varying vec3 vNormal;

  ${rampRead}
  ${simplex3D}
  ${veilField}
  ${clarityOpen}

  void main() {
    float line;
    float lit;
    // No break noise in this mode, so the outline is the clean contour it was.
    float fill = veilCover(vDir, normalize(vNormal), 0.0, line, lit);

    // Folded straight back in: for this mode the key *is* a coverage term, and
    // the only thing a single-ink layer can shade is how much of it there is.
    float cover = fill * lit;
    line *= lit;

    // The line carries its own opacity rather than borrowing the fill's, so an
    // outline is still a line where the cloud under it has gone to nothing.
    //
    // The window thins the whole layer, its outline included. A veil that kept
    // its edge over an opened front would draw a clean contour around a hole,
    // which is the one thing that would make the hole read as a hole.
    float alpha = max(cover, line) * clarityAt(normalize(vNormal));
    if (alpha <= 0.0) discard;

    gl_FragColor = vec4(mix(readRamp(uTone), readRamp(uOutlineTone), line), alpha);

    #include <colorspace_fragment>
  }
`;

/**
 * Mode 1. Coverage as a *density* rather than as an opacity, so the veil can
 * say "half a cloud" without saying it in a colour nobody authored — the
 * argument the Bayer dither this replaces was making, with a better mark.
 *
 * The mark is Christoph Steinmeyer's dotted line shader, whose whole graph is a
 * wave texture at one authored angle, a single-octave noise screened in to
 * break the lines into dashes, and a constant ramp with the light added under
 * it. That last step is what makes it fit: a pattern plus a tone through a hard
 * threshold *is* ordered dithering, so the hatch drops straight into the slot
 * the Bayer matrix left rather than being a second kind of thing.
 *
 * So the hatch is a **screen**, never a picture: a ruling in 0..1, cut against
 * a tone. Two tones want cutting, so one family is read at two phases.
 *
 * - **Coverage cuts the silhouette.** A full cloud is *solid ink* and a thinning
 *   one breaks into dashes on its way to nothing. The hatch is the gradient, not
 *   the veil — the mass it used to eat is the thing it is dithering.
 * - **The key cuts the ramp**, against the same family walked out of phase by
 *   the break noise. `veilKey` walks `veilHatchShade` slots deeper as the
 *   surface turns from the light and the woven strokes dither each slot
 *   boundary. That is the whole of the manga read: paper, hatch, solid tone.
 *
 * Two phases rather than one, because one correlates them: in a shoulder the
 * pixels that survive the silhouette are the ones nearest a spine, and they are
 * the same pixels that pass the tone cut, so every shoulder collapses onto one
 * slot and the grading shows only where the veil is already solid. Two phases
 * rather than two *angles*, because a second family square to the first is a
 * cross-hatch on paper and a net on a sphere.
 *
 * Surface-locked, and free: vDir is object space and the veil group carries the
 * veil's own turn, so the strokes ride the world rather than the paper.
 */
const veilHatchFragment = /* glsl */ `
  uniform vec3 uRamp[${RAMP_SLOTS}];
  uniform float uTone;
  uniform float uOutline;
  uniform float uOutlineTone;
  uniform float uVeil;
  uniform vec3 uOrigin;
  uniform float uFrequency;
  uniform float uOctaves;
  uniform float uGain;
  uniform float uWarp;
  uniform float uBands;
  uniform float uBandFrequency;
  uniform float uCoverage;
  uniform float uEdge;
  uniform float uPole;
  uniform float uPoleEdge;
  uniform float uKey;
  uniform vec3 uKeyDir;
  uniform float uHatchDensity;
  uniform float uHatchWidth;
  uniform float uHatchAlpha;
  uniform float uHatchBreak;
  uniform float uHatchGrainScale;
  uniform float uHatchSoften;
  uniform float uHatchShade;
  uniform float uClarity;
  uniform float uClarityGamma;
  uniform float uClaritySteps;

  varying vec3 vDir;
  varying vec3 vNormal;

  ${rampRead}
  ${simplex3D}
  ${veilField}
  ${clarityOpen}

  /**
   * Where a direction falls across the ruling, counted in stroke periods. The
   * whole family is level sets of this, and every ruling the shader draws is
   * this one number read at a different phase.
   *
   * Strokes are the level sets of the *angle* to the axis rather than of the
   * dot product, and that is the load-bearing choice: the gradient of
   * asin(d.y) over a unit sphere has magnitude exactly 1, so the family is
   * evenly spaced across the whole world at once. A surface-locked stroke
   * therefore needs no projection, no triplanar blend and no correction at the
   * limb — the three things a UV-space hatch spends its budget on.
   *
   * The axis is the world's own, and is not authorable. Any other one puts the
   * measure's two degenerate poles somewhere arbitrary — object space, so tilt,
   * turn and lean decide where they surface, and they read as a whorl sitting
   * in the middle of the disc with nothing to explain it. On the world's axis
   * they land on the world's poles, where a ruling in latitude is *supposed* to
   * converge, and the eye reads a globe instead of an artefact.
   */
  float bandAt(vec3 dir) {
    return asin(clamp(dir.y, -1.0, 1.0)) * uHatchDensity;
  }

  /**
   * The ruling itself: 0 on a spine, 1 out in the paper midway between two of
   * them. A tone cut against this is an ordered dither — tone 1 solid, tone 0
   * bare, the Bayer matrix's whole contract.
   *
   * Takes the band's rate rather than measuring it, so a phase-displaced ruling
   * is still weighed by the *clean* one. A rate that carried the displacement
   * would spike wherever the noise ran fast, and anything scaled by it would
   * grow a bright fringe there — which is the bug this shader already shipped
   * once.
   */
  float ridgeAt(float band, float perBand) {
    float ridge = abs(band - floor(band + 0.5)) * 2.0;

    // Nyquist, on veilFbm's rule and with its constants — but a ruling cannot
    // fade to *nothing* the way an octave can, or the veil would lose its mass
    // at the limb. It fades to its own mean instead, which is what a mip of it
    // would be, and there the dither degrades to a plain cut at half tone. So a
    // limb keeps its solid heart and loses only the grading across it.
    return mix(0.5, ridge, 1.0 - smoothstep(0.25, 0.5, perBand));
  }

  /**
   * The breaks, as a *removal* rather than as a tint on the threshold.
   *
   * Christoph screens a smooth noise straight in, which lifts the ruling a
   * little everywhere and shortens the strokes into dashes. Nothing is ever
   * fully gone, and with two rulings on one sphere that is far too gentle — the
   * families meet wherever both survive and the veil reads as a net. So the
   * noise is cut to a near-binary mask first: uHatchBreak is the *fraction of
   * the field taken away*, and where it is taken the ruling is lifted to 1 and
   * that patch draws no stroke at all until its tone reaches solid.
   *
   * The mask's own edge is floored by the noise's rate per pixel, veilCover's
   * move on uEdge, so it is never harder than the screen can draw. It fades to
   * *nothing* at Nyquist rather than to its mean, unlike a ruling: a mask that
   * vanishes only costs the limb its dashes, where a mask stuck at its mean
   * would flip a whole hemisphere on or off as uHatchBreak crossed a half.
   */
  float breakAt(float grain, float soft, float fade) {
    if (uHatchBreak <= 0.0) return 0.0;

    return smoothstep(1.0 - uHatchBreak - soft, 1.0 - uHatchBreak + soft, grain) * fade;
  }

  /**
   * One cut. At uHatchSoften 0 this is a raw step and every pixel the hatch
   * draws is still one of the seven inks — the whole reason a density mode
   * exists rather than an alpha one. Above 0 it ramps across that many pixels,
   * the mark goes misty, and the guarantee is traded away for it: a partial
   * alpha invents a grey between the ink and the ground, exactly as mode 0
   * does. Authored per world, so one world can be pen and its neighbour fog.
   *
   * The tone is widened by the reach at both ends before it is cut, and that is
   * not a nicety. A ruling tops out at exactly 1, so a raw ramp of +/-reach runs
   * off the end of the screen: at solid tone the midline between two spines sits
   * half way up the ramp and takes half alpha, drawing a fine pale line down
   * every gap of a region that should be unbroken ink — and one at every slot
   * boundary of the shading, where the remainder comes back round through 1.
   * Widened, tone 1 clears the screen's top and tone 0 its bottom, so softening
   * touches only the marks that have an edge to soften.
   */
  float inkAt(float screen, float perStroke, float tone) {
    if (tone <= 0.0) return 0.0;
    if (uHatchSoften <= 0.0) return step(screen, tone);

    float reach = uHatchSoften * perStroke * 0.5;

    return smoothstep(screen - reach, screen + reach, tone * (1.0 + 2.0 * reach) - reach);
  }

  /**
   * Both ends of a tone's range, opened out so the pen can draw them.
   *
   * A pure dither has no width control — width *is* the tone. That leaves it
   * with a mark it cannot draw at each end: near 0 a stroke a fiftieth of a
   * period wide, and near 1 a *gap* of the same, both well under a pixel at
   * these densities. Neither disappears with density, because density is
   * spacing and this is width; both persist as a hairline that sparkles rather
   * than reads. So the faint end is lifted onto a floor of uHatchWidth pixels
   * and the solid end is lifted off it by the same amount — the ruling runs
   * 0..1 across a half period, which makes a mark of w pixels worth a tone of
   * w * perStroke / 2, ink or paper alike.
   *
   * Symmetric because the two are the same statement: **uHatchWidth is the
   * thinnest thing this pen draws**, and a gap is a mark in the paper.
   *
   * A plain clamp, and it has to be. It was a geometric mean first —
   * max(t, sqrt(t * floor)) — chosen to reach the floor without the hard step a
   * remap would put at zero. It is not a floor at all: sqrt(t * floor) goes to
   * zero with t, so it only ever leans toward the value and every width below
   * it still gets through. The knob moved a tenth of a pixel and read as dead.
   *
   * A floor is a discontinuity by definition — any tone above zero owes at
   * least one whole mark — so the honest form keeps the step and makes it
   * exactly uHatchWidth wide. What that draws is a hairline appearing all at
   * once at each contour where a tone leaves zero or reaches full, which is a
   * *drawn edge* and the thing the slider is for. At uHatchWidth 0 there is no
   * floor and the dither is plain.
   *
   * Clamped rather than remapped, so the range between the two floors is left
   * exactly as it was; a remap would compress every mid-tone to buy the same
   * two edges. Capped at 0.4 so the pair cannot cross on a small widget.
   *
   * The soften is paid for here rather than left to eat the floor. inkAt spends
   * its reach off the tone, so a floor of exactly uHatchWidth would come out a
   * softened mark of uHatchWidth minus uHatchSoften — nothing at all once the
   * blur is wider than the hairline it is blurring. Floored at the sum instead,
   * the thinnest mark is uHatchWidth across at half alpha with the falloff
   * outside it, which is what a soft pen drawing a hairline does. It needs no
   * guard at uHatchWidth 0: the lift and the reach cancel, the mark comes out
   * zero wide, and the dither is plain exactly as it is with no soften.
   */
  float legibleAt(float tone, float perStroke) {
    if (tone <= 0.0) return 0.0;
    if (tone >= 1.0) return 1.0;

    float thinnest = min((uHatchWidth + uHatchSoften) * perStroke * 0.5, 0.4);

    return clamp(tone, thinnest, 1.0 - thinnest);
  }

  void main() {
    float perStep = length(fwidth(vDir));

    // Detail 0 in his graph: one octave, no sum, and the seed offset is the
    // world's so two worlds break differently. Two samples of it, and the
    // second earns its keep twice over below.
    //
    // Taken before veilCover rather than after, because the outline is drawn in
    // there and wants grainA: the line is the edge of a silhouette this noise
    // breaks, and a clean contour over a broken edge rules straight through
    // every gap.
    float grainA = snoise(vDir * uHatchGrainScale + uOrigin) * 0.5 + 0.5;
    float grainB = snoise(vDir * uHatchGrainScale + uOrigin + vec3(37.1, 11.9, 5.3)) * 0.5 + 0.5;

    float soft = max(0.06, uHatchGrainScale * perStep);
    float fade = 1.0 - smoothstep(0.25, 0.5, uHatchGrainScale * perStep);

    float line;
    float lit;
    float fill = veilCover(vDir, normalize(vNormal), (grainA - 0.5) * fade, line, lit);

    // One ruling for the whole shader, read at two phases. Its rate is measured
    // once, on the clean band, and is what both cuts are weighed in.
    float band = bandAt(vDir);
    float perBand = max(fwidth(band), 1e-6);
    float perStroke = 2.0 * perBand;

    // Cut one: the silhouette. Coverage is a density here, so a full cloud
    // closes to solid ink and a thinning one opens into strokes. His screen
    // node, over a mask rather than over the raw noise: where the mask is up
    // the ruling is lifted to 1, so the patch takes no ink until its tone
    // reaches solid — which is why even a hard break never holes a solid core.
    float marks = ridgeAt(band, perBand);
    marks = 1.0 - (1.0 - marks) * (1.0 - breakAt(grainA, soft, fade));

    // The layer's own weight, and the second knob in this mode that spends the
    // seven-ink guarantee. It is not uHatchSoften's job done twice: soften
    // blurs a mark's *edge* and leaves its middle pure, this thins the whole
    // sheet evenly and keeps every edge as hard as it was. The faceted read
    // survives it, which is why it is here — a hatch at full weight has only
    // its density to say anything with, and density is already carrying the
    // silhouette. The outline is left alone: a line at part weight is a smudge.
    float alpha = inkAt(marks, perStroke, legibleAt(fill, perStroke)) * uHatchAlpha;

    // Cut two: the shading. How far from the light, in ramp slots — bounded by
    // abs(uKey), so the slider is both which way the light falls and how hard
    // the reading is pressed. floor is the slot already reached and the
    // remainder is dithered into the next, which is the banding this mode
    // exists to break.
    //
    // It needs a ruling the first cut cannot predict. Sharing one outright
    // correlates them: in a shoulder only the pixels nearest a spine survive
    // the silhouette, and those same pixels are the ones that pass the tone
    // cut, so every shoulder collapses onto whichever slot is at its extreme
    // and the grading shows only where the veil is already solid.
    //
    // Crossing a second family square to the first decorrelates them and is
    // what a pen does — and on a sphere it is also a *net*, two regular grids
    // over a curved surface reading as wireframe rather than as ink. So the
    // second ruling is the same family walked out of phase by the noise
    // instead: same direction, no crossings, and a displacement of up to half a
    // period is as independent of the first as a right angle was. The strokes
    // weave between each other and merge where the phases meet, which is what a
    // second tone in one direction looks like drawn by hand.
    //
    // Displaced by the *faded* noise, so the weave dies where the grain can no
    // longer be resolved rather than aliasing the ruling it is displacing.
    float weave = (grainB - 0.5) * fade;
    float woven = ridgeAt(band + weave, perBand);
    woven = 1.0 - (1.0 - woven) * (1.0 - breakAt(grainB, soft, fade));

    float depth = (1.0 - lit) * uHatchShade;
    float reached = floor(depth);
    float deeper = inkAt(woven, perStroke, legibleAt(depth - reached, perStroke));

    // The outline is not hatched — a broken hairline is not a line, and at
    // these widths it would come apart entirely — and not keyed either, because
    // here the key is a shading and a cloud does not lose its edge to the dark.
    float drawn = step(0.5, line);

    // The window, last and over everything this mode drew — the density read
    // included. It is the third knob here that spends the seven inks, and the
    // only one that is not the veil's own doing: an opened front thins the
    // weather over it whatever the pen was set to.
    alpha = max(alpha, drawn) * clarityAt(normalize(vNormal));
    if (alpha <= 0.0) discard;

    gl_FragColor = vec4(readRamp(mix(uTone + reached + deeper, uOutlineTone, drawn)), alpha);

    #include <colorspace_fragment>
  }
`;

export function createSurfaceMaterial() {
  return new THREE.ShaderMaterial({
    vertexShader: surfaceVertex,
    fragmentShader: surfaceFragment,
    side: THREE.FrontSide,
    // The window is an alpha, so the body sorts as a transparent mark — see
    // `RENDER_ORDER.body`. At uClarity 0 every pixel is alpha 1 and this costs
    // the picture nothing, which is what lets the eight views that never open a
    // window be unaffected by the one that does.
    transparent: true,
    // Kept, though three's default for a transparent material is off. The body
    // is the depth cue the whole scene is built against — the burst is cut
    // against it, the outline hull's near half is rejected by it — and none of
    // that may change because the front went thin.
    depthWrite: true,
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
      uGrain: { value: 0 },
      uShadeGrain: { value: 0 },
      uGrainScale: { value: 30 },
      uOrigin: { value: new THREE.Vector3() },
      uClarity: { value: 0 },
      uClarityGamma: { value: 2 },
      uClaritySteps: { value: 5 },
    },
  });
}

/**
 * The two veil materials, and the reason there are two rather than one with a
 * mode uniform. It used to be that a mode was a blend and a blend is a
 * construction flag; the inversion is gone and that argument with it. What is
 * left is cost: a mode uniform compiles both pictures into one shader, so every
 * world wearing the cheap alpha veil would carry the hatch's noise and
 * derivatives in its register budget for a branch it never takes — across as
 * many `PlanetView`s as a screen mounts. Two shaders, one compiled per world.
 *
 * Their uniform blocks are written out in full twice over, which is not an
 * oversight. `uniforms: { ...veilUniforms() }` defeats the join checker's
 * block match and every declared uniform comes back MISSING — and a uniform the
 * checker cannot see is a uniform that is silently 0. The duplication is what
 * two modes cost to stay checked.
 *
 * Every one of them: FrontSide, because the vertex shader emits a true sphere,
 * so the winding is the sphere's and the rasteriser culls the far half exactly.
 * A soul needs a discard for this; a closed shell does not.
 *
 * And no depth test, which is the load-bearing one. The shell was built by
 * throwing the terrain away; testing it against a buffer the *lumpy* body wrote
 * would put every lump straight back in, and the veil's picture would then
 * depend on `amplitude` — a slider in another group that says nothing about
 * veils. The far half is culled and the limb is meant to stand past the drawn
 * silhouette, so there is nothing left for a depth test to decide.
 */
export function createVeilAlphaMaterial() {
  return new THREE.ShaderMaterial({
    vertexShader: veilVertex,
    fragmentShader: veilAlphaFragment,
    side: THREE.FrontSide,
    transparent: true,
    depthTest: false,
    depthWrite: false,
    uniforms: {
      uRamp: { value: readInkRamp() },
      uTone: { value: 0 },
      uOutline: { value: 0 },
      uOutlineTone: { value: 6 },
      uHeight: { value: 0.03 },
      uVeil: { value: 0 },
      uOrigin: { value: new THREE.Vector3() },
      uFrequency: { value: 2.6 },
      uOctaves: { value: 4 },
      uGain: { value: 0.55 },
      uWarp: { value: 0.28 },
      uBands: { value: 0 },
      uBandFrequency: { value: 5 },
      uCoverage: { value: 0.52 },
      uEdge: { value: 0.08 },
      uPole: { value: 0 },
      uPoleEdge: { value: 2 },
      uKey: { value: 0 },
      uKeyDir: { value: new THREE.Vector3(0, 0, 1) },
      uClarity: { value: 0 },
      uClarityGamma: { value: 2 },
      uClaritySteps: { value: 5 },
    },
  });
}

/** Mode 1, the hatch — the only veil that can be all seven inks and nothing between. */
export function createVeilHatchMaterial() {
  return new THREE.ShaderMaterial({
    vertexShader: veilVertex,
    fragmentShader: veilHatchFragment,
    side: THREE.FrontSide,
    transparent: true,
    depthTest: false,
    depthWrite: false,
    uniforms: {
      uRamp: { value: readInkRamp() },
      uTone: { value: 0 },
      uOutline: { value: 0 },
      uOutlineTone: { value: 6 },
      uHeight: { value: 0.03 },
      uVeil: { value: 0 },
      uOrigin: { value: new THREE.Vector3() },
      uFrequency: { value: 2.6 },
      uOctaves: { value: 4 },
      uGain: { value: 0.55 },
      uWarp: { value: 0.28 },
      uBands: { value: 0 },
      uBandFrequency: { value: 5 },
      uCoverage: { value: 0.52 },
      uEdge: { value: 0.08 },
      uPole: { value: 0 },
      uPoleEdge: { value: 2 },
      uKey: { value: 0 },
      uKeyDir: { value: new THREE.Vector3(0, 0, 1) },
      uClarity: { value: 0 },
      uClarityGamma: { value: 2 },
      uClaritySteps: { value: 5 },
      uHatchDensity: { value: 24 },
      uHatchWidth: { value: 1 },
      uHatchAlpha: { value: 0.85 },
      uHatchBreak: { value: 0.45 },
      uHatchGrainScale: { value: 30 },
      uHatchSoften: { value: 0 },
      uHatchShade: { value: 2 },
    },
  });
}

/**
 * The mode in force, as a material. Not a factory *argument*, and that is
 * load-bearing: `uniform-join.mjs` only recognises `create...Material()` with no
 * parameters, so a factory that took the mode would drop off the join check
 * entirely and a missing uniform would go back to being silent.
 */
export function veilMaterialFor(ink: number) {
  if (Math.round(ink) === 1) return createVeilHatchMaterial();

  return createVeilAlphaMaterial();
}

export function createOutlineMaterial() {
  return new THREE.ShaderMaterial({
    vertexShader: outlineVertex,
    fragmentShader: outlineFragment,
    side: THREE.BackSide,
    uniforms: {
      uOffset: { value: 0 },
      uColor: { value: readInkRamp()[6] },
      uFlashColor: { value: readInkRamp()[0] },
      uFlash: { value: 0 },
    },
  });
}

export function createBurstMaterial() {
  return new THREE.ShaderMaterial({
    vertexShader: outlineVertex,
    fragmentShader: burstFragment,
    side: THREE.BackSide,
    transparent: true,
    depthWrite: false,
    depthFunc: THREE.LessDepth,
    uniforms: {
      uOffset: { value: 0 },
      uColor: { value: readInkRamp()[6] },
      uFade: { value: 0 },
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
      uCore: { value: 0 },
      uCoreTone: { value: 6 },
      uCoreRing: { value: 0 },
    },
  });
}

export function createHarnessMaterial() {
  return new THREE.ShaderMaterial({
    vertexShader: harnessVertex,
    fragmentShader: harnessFragment,
    // A ribbon's winding follows whichever way its segment happens to run, so
    // there is no consistent front to cull.
    side: THREE.DoubleSide,
    // Transparent, though every fragment it writes is alpha 1. Three draws the
    // whole opaque pass before the transparent one and honours `renderOrder`
    // only *within* a pass, so once the body blends nothing opaque can sit
    // above it — an opaque harness is painted over by the world it crosses,
    // front loops and all. Costs one blend of a fully opaque source.
    transparent: true,
    // The lines behind the planet stay visible and pale rather than
    // disappearing, so the depth buffer must not have an opinion about them.
    depthTest: false,
    depthWrite: false,
    uniforms: {
      uRamp: { value: readInkRamp() },
      uWidth: { value: 0 },
      uCap: { value: 1 },
      uRim: { value: 1 },
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
    // Alpha 1 throughout; this is only a pass, not a blend — see
    // `createHarnessMaterial`. It keeps writing depth, which is what the pair
    // below and the body's own test still go by.
    transparent: true,
    // The edges lie exactly on these faces. Without the offset they z-fight,
    // and with it the two need no render order between them. The edges pull the
    // other way by as much again, because a stroke with a width to it covers a
    // band of a facet that falls away from the camera across it and one unit of
    // clearance is only enough for a hairline.
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
    side: THREE.DoubleSide,
    transparent: true,
    // See `createAnchorMaterial`: the facets go back a unit, these come forward
    // one, and a wide stroke keeps its clearance over the slope it lies on.
    polygonOffset: true,
    polygonOffsetFactor: -1,
    polygonOffsetUnits: -1,
    uniforms: {
      uRamp: { value: readInkRamp() },
      uTone: { value: 6 },
      uWidth: { value: 0 },
      uCap: { value: 1 },
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
    side: THREE.DoubleSide,
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
      uWidth: { value: 0 },
      // The one stroke here that is *not* capped. An inversion applied twice is
      // no inversion, so a square cap filling a corner would punch a hole in the
      // ghost at every one of them. Dashed lines have gaps at corners anyway.
      uCap: { value: 0 },
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

/**
 * `size` is the world's, not the harness's: a cage on a large world is drawn in
 * finer ink, the souls' rule. The ceiling is the harness's own — its loops span
 * the *body*, which never changes size, so nothing shrinks underneath a stroke
 * that keeps thickening as the world is authored smaller.
 *
 * `rim` is where the body is *seen* to end, in body radii. The scene works it
 * out, because it is the body's outline that decides it and the harness has no
 * business reading a `PlanetVisual`.
 */
export function syncHarnessUniforms(
  material: THREE.ShaderMaterial,
  visual: HarnessVisual,
  zoom: number,
  size: number,
  rim: number,
) {
  const u = material.uniforms;
  const px = weightOf(visual.width, size, visual.floor, visual.ceiling);

  u.uWidth.value = zoom > 0 ? px / zoom : 0;
  u.uRim.value = rim;
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

/**
 * `size` is the world's. The solid is already divided by it in `PlanetScene`, so
 * this is what keeps the ink on the same footing as the shape it draws — no
 * ceiling, because an anchor on a small world is a large anchor and can carry
 * the heavier line the division hands it.
 */
export function syncAnchorEdgeUniforms(
  material: THREE.ShaderMaterial,
  visual: AnchorVisual,
  zoom: number,
  size: number,
) {
  const u = material.uniforms;
  const px = weightOf(visual.edgeWidth, size, visual.edgeFloor);

  u.uTone.value = Math.round(visual.edgeTone);
  u.uWidth.value = zoom > 0 ? px / zoom : 0;
}

export function syncAnchorGhostUniforms(
  material: THREE.ShaderMaterial,
  visual: AnchorVisual,
  zoom: number,
  size: number,
) {
  const u = material.uniforms;
  const px = weightOf(visual.edgeWidth, size, visual.edgeFloor);

  u.uBack.value = visual.ghostBack;
  u.uDash.value = Math.max(0.5, visual.dash);
  u.uDuty.value = visual.duty;
  u.uZoom.value = zoom;
  u.uWidth.value = zoom > 0 ? px / zoom : 0;
}

/**
 * `bleed` is how far the body's outline reaches past its surface, in body radii.
 * Added to the authored rim rather than replacing it, so the slider keeps saying
 * what it always said and the widget's own weight is stacked on top — the
 * harness cuts at the same edge, worked out the same way.
 */
export function syncSoulUniforms(
  material: THREE.ShaderMaterial,
  visual: SwarmVisual,
  bleed: number,
  reach: number,
  lean: number,
) {
  const u = material.uniforms;

  u.uRim.value = visual.rim + bleed;
  u.uRing.value = visual.ring;
  u.uOutTone.value = Math.round(visual.outTone);
  u.uFrontTone.value = Math.round(visual.frontTone);

  // How far out a soul still counts as arrived, not a swarm field: it is the
  // *body's* core, the same argument that keeps `bleed` a parameter rather than
  // a slider. 0 is a world with no core, and the third place is then unreachable.
  //
  // Deliberately not the core's radius. A berth sits inside it but the wobble
  // rides on top, so souls on the outer shell crossed a radius-tight boundary
  // and back as they milled — a flicker on the one mark that has to be steady.
  // The caller widens it by what the wobble can spend; the shader adds the dot.
  //
  // That third place's pair is fixed, unlike the two tones above it, and takes
  // the *lean* rather than a slider: the core's ground is paper on one reading
  // and black on the other, so one authored tone would be a dot that disappears
  // on half the harvests. See `CORE_TONES` for why it is a fill and a ring and
  // not simply the hatch's ink.
  u.uCore.value = Math.max(0, reach);
  u.uCoreTone.value = coreOf(lean).soul;
  u.uCoreRing.value = coreOf(lean).ring;
}

/** Which of the three readings a lean is. `syncCoreUniforms` and the swarm must agree. */
function coreOf(lean: number) {
  const at = Math.sign(Math.round(lean));

  if (at > 0) return CORE_TONES.light;
  if (at < 0) return CORE_TONES.dark;

  return CORE_TONES.even;
}

/**
 * The world's noise-domain offset, from its own seed — read by the body's grain
 * and by the veil alike. There is no second seed for either on purpose: the
 * grain is this world's paper and the veil is this world's weather, not two more
 * worlds, so reseeding in the lab has to move all three together.
 *
 * Folded small because `simplex3D` wraps its lattice at 289 cells — a raw
 * five-digit seed lands outside it and every world would share one corner of
 * the field. Three mutually irrational strides, so consecutive seeds land far
 * apart instead of walking one line.
 *
 * One scratch vector for both callers, and both `.copy()` out of it.
 */
const NOISE_ORIGIN = new THREE.Vector3();

function originOf(seed: number) {
  const at = Math.abs(seed);

  return NOISE_ORIGIN.set(
    ((at * 0.7548776662) % 1) * 128,
    ((at * 0.5698402909) % 1) * 128,
    ((at * 0.6180339887) % 1) * 128,
  );
}

/**
 * `clarity` is passed rather than read off the visual, because the window is not
 * a property of the world on its own — it is half of one mark, and the other
 * half is the core, and a core is only drawn where there is an alignment to put
 * in it. A view with none passes 0 and the body is the solid it always was.
 */
export function syncSurfaceUniforms(
  material: THREE.ShaderMaterial,
  visual: PlanetVisual,
  clarity: number,
) {
  const u = material.uniforms;

  u.uClarity.value = Math.max(0, Math.min(1, clarity));
  u.uClarityGamma.value = Math.max(0.01, visual.clarityGamma);
  u.uClaritySteps.value = Math.max(2, Math.round(visual.claritySteps));

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

  u.uGrain.value = Math.max(0, visual.grain);
  u.uShadeGrain.value = Math.max(0, visual.shadeGrain);
  u.uGrainScale.value = Math.max(0.1, visual.grainScale);
  u.uOrigin.value.copy(originOf(visual.seed));
}

/** `clarity` reaches the veil for the reason it reaches the body — see `syncSurfaceUniforms`. */
export function syncVeilUniforms(
  material: THREE.ShaderMaterial,
  visual: PlanetVisual,
  clarity: number,
) {
  const u = material.uniforms;

  u.uClarity.value = Math.max(0, Math.min(1, clarity));
  u.uClarityGamma.value = Math.max(0.01, visual.clarityGamma);
  u.uClaritySteps.value = Math.max(2, Math.round(visual.claritySteps));

  u.uVeil.value = Math.max(0, visual.veil);
  u.uHeight.value = Math.max(0, visual.veilHeight);
  u.uOrigin.value.copy(originOf(visual.seed));
  u.uFrequency.value = visual.veilFrequency;
  u.uOctaves.value = Math.max(1, Math.round(visual.veilOctaves));
  u.uGain.value = visual.veilGain;
  u.uWarp.value = visual.veilWarp;
  u.uBands.value = visual.veilBands;
  u.uBandFrequency.value = visual.veilBandFrequency;
  u.uCoverage.value = visual.veilCoverage;
  u.uEdge.value = visual.veilEdge;
  u.uPole.value = Math.abs(visual.veilPole);
  u.uPoleEdge.value = Math.max(0.02, visual.veilPoleEdge);
  u.uKey.value = visual.veilKey;
  u.uOutline.value = Math.max(0, visual.veilOutline);
  u.uTone.value = Math.round(visual.veilTone);
  u.uOutlineTone.value = Math.round(visual.veilOutlineTone);

  // The aim is the system's, not the world's — read ambiently, as the ramp is.
  const key = keyLight.direction;
  u.uKeyDir.value.set(key.x, key.y, key.z);

  // The hatch's own slots, guarded rather than declared into the alpha shader
  // that does not use them. A uniform a shader does not declare is one the join
  // check calls unused, and it would be right.
  if (!u.uHatchDensity) return;

  u.uHatchDensity.value = Math.max(0.1, visual.veilHatchDensity);
  u.uHatchWidth.value = Math.max(0, visual.veilHatchWidth);
  u.uHatchAlpha.value = Math.max(0, Math.min(1, visual.veilHatchAlpha));
  u.uHatchBreak.value = visual.veilHatchBreak;
  u.uHatchGrainScale.value = Math.max(0.1, visual.veilHatchGrainScale);
  u.uHatchSoften.value = Math.max(0, visual.veilHatchSoften);
  u.uHatchShade.value = Math.max(0, visual.veilHatchShade);
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

/**
 * The burst's own width and ink, and the tone the body's outline flashes to.
 * Both materials are synced here rather than each from its own visual, because
 * the two are one mark: the hull and the edge standing against it.
 */
export function syncBurstUniforms(
  hull: THREE.ShaderMaterial,
  outline: THREE.ShaderMaterial,
  visual: PulseVisual,
  ramp: THREE.Color[],
  zoom: number,
) {
  hull.uniforms.uOffset.value = zoom > 0 ? Math.max(0, visual.burstWidth) / zoom : 0;
  hull.uniforms.uColor.value = ramp[Math.round(visual.burstTone)] ?? ramp[6];
  outline.uniforms.uFlashColor.value = ramp[Math.round(visual.burstEdge)] ?? ramp[0];
}
